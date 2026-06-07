import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, usersTable, tenantsTable } from "@workspace/db";
import { hashPassword, comparePassword, signAccessToken, signRefreshToken, verifyRefreshToken, generateVoucherCode } from "../lib/auth";
import { authenticate } from "../middlewares/authenticate";

const router: IRouter = Router();

router.post("/auth/login", async (req, res): Promise<void> => {
  const { email, password } = req.body;
  if (!email || !password) {
    res.status(400).json({ error: "Email and password required" });
    return;
  }
  const [user] = await db.select().from(usersTable).where(eq(usersTable.email, email.toLowerCase()));
  if (!user || !(await comparePassword(password, user.passwordHash))) {
    res.status(401).json({ error: "Invalid credentials" });
    return;
  }
  if (user.status !== "active") {
    res.status(401).json({ error: "Account suspended or inactive" });
    return;
  }
  const payload = { userId: user.id, tenantId: user.tenantId ?? null, role: user.role };
  const accessToken = signAccessToken(payload);
  const refreshToken = signRefreshToken(payload);
  res.json({
    accessToken,
    refreshToken,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      tenantId: user.tenantId,
      locationId: user.locationId,
      status: user.status,
      createdAt: user.createdAt,
    },
  });
});

router.post("/auth/register", async (req, res): Promise<void> => {
  const { email, password, name, tenantName } = req.body;
  if (!email || !password || !name || !tenantName) {
    res.status(400).json({ error: "All fields required" });
    return;
  }
  const [existing] = await db.select().from(usersTable).where(eq(usersTable.email, email.toLowerCase()));
  if (existing) {
    res.status(409).json({ error: "Email already registered" });
    return;
  }
  const slug = tenantName.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "") + "-" + generateVoucherCode(4).toLowerCase();
  const [tenant] = await db.insert(tenantsTable).values({ name: tenantName, slug, status: "trial", plan: "starter" }).returning();
  const passwordHash = await hashPassword(password);
  const [user] = await db.insert(usersTable).values({
    email: email.toLowerCase(),
    name,
    passwordHash,
    role: "admin",
    tenantId: tenant.id,
    status: "active",
  }).returning();
  const payload = { userId: user.id, tenantId: user.tenantId ?? null, role: user.role };
  res.status(201).json({
    accessToken: signAccessToken(payload),
    refreshToken: signRefreshToken(payload),
    user: { id: user.id, email: user.email, name: user.name, role: user.role, tenantId: user.tenantId, locationId: user.locationId, status: user.status, createdAt: user.createdAt },
  });
});

router.post("/auth/refresh", async (req, res): Promise<void> => {
  const { refreshToken } = req.body;
  if (!refreshToken) {
    res.status(400).json({ error: "Refresh token required" });
    return;
  }
  try {
    const payload = verifyRefreshToken(refreshToken);
    const [user] = await db.select().from(usersTable).where(eq(usersTable.id, payload.userId));
    if (!user || user.status !== "active") {
      res.status(401).json({ error: "User not found or inactive" });
      return;
    }
    const newPayload = { userId: user.id, tenantId: user.tenantId ?? null, role: user.role };
    res.json({
      accessToken: signAccessToken(newPayload),
      refreshToken: signRefreshToken(newPayload),
      user: { id: user.id, email: user.email, name: user.name, role: user.role, tenantId: user.tenantId, locationId: user.locationId, status: user.status, createdAt: user.createdAt },
    });
  } catch {
    res.status(401).json({ error: "Invalid refresh token" });
  }
});

router.post("/auth/logout", (_req, res): void => {
  res.sendStatus(204);
});

router.post("/auth/forgot-password", async (req, res): Promise<void> => {
  const { email } = req.body;
  if (!email) {
    res.status(400).json({ error: "Email required" });
    return;
  }
  const [user] = await db.select().from(usersTable).where(eq(usersTable.email, email.toLowerCase()));
  if (user) {
    const token = generateVoucherCode(32);
    const expiresAt = new Date(Date.now() + 1000 * 60 * 60);
    await db.update(usersTable).set({ resetToken: token, resetTokenExpiresAt: expiresAt }).where(eq(usersTable.id, user.id));
    req.log.info({ email, token }, "Password reset token generated");
  }
  res.json({ message: "If that email exists, a reset link has been sent." });
});

router.post("/auth/reset-password", async (req, res): Promise<void> => {
  const { token, password } = req.body;
  if (!token || !password) {
    res.status(400).json({ error: "Token and password required" });
    return;
  }
  const [user] = await db.select().from(usersTable).where(eq(usersTable.resetToken, token));
  if (!user || !user.resetTokenExpiresAt || user.resetTokenExpiresAt < new Date()) {
    res.status(400).json({ error: "Invalid or expired reset token" });
    return;
  }
  const passwordHash = await hashPassword(password);
  await db.update(usersTable).set({ passwordHash, resetToken: null, resetTokenExpiresAt: null }).where(eq(usersTable.id, user.id));
  res.json({ message: "Password reset successful" });
});

router.get("/auth/me", authenticate, async (req, res): Promise<void> => {
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, req.user!.userId));
  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }
  res.json({ id: user.id, email: user.email, name: user.name, role: user.role, tenantId: user.tenantId, locationId: user.locationId, status: user.status, createdAt: user.createdAt });
});

export default router;
