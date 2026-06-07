import { Router, type IRouter } from "express";
import { eq, and, desc, sql } from "drizzle-orm";
import { db, notificationsTable, notificationPreferencesTable } from "@workspace/db";
import { authenticate } from "../middlewares/authenticate";

const router: IRouter = Router();

// ── Get notifications for user ────────────────────────────────────────
router.get("/notifications", authenticate, async (req, res): Promise<void> => {
  const userId = req.user!.id;
  if (!userId) { res.status(403).json({ error: "No user" }); return; }

  const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);
  const notifications = await db.select()
    .from(notificationsTable)
    .where(eq(notificationsTable.userId, userId))
    .orderBy(desc(notificationsTable.createdAt))
    .limit(limit);

  res.json(notifications);
});

// ── Get unread count ──────────────────────────────────────────────────
router.get("/notifications/unread-count", authenticate, async (req, res): Promise<void> => {
  try {
    const userId = req.user!.id;
    if (!userId) { res.status(403).json({ error: "No user" }); return; }

    const result = await db.select({ count: sql`COUNT(*)`.mapWith(Number) })
      .from(notificationsTable)
      .where(and(eq(notificationsTable.userId, userId), eq(notificationsTable.status, "unread")));

    const count = result[0]?.count || 0;
    res.json({ unreadCount: count });
  } catch (error) {
    console.error("Error fetching unread count:", error);
    res.status(500).json({ error: "Failed to fetch unread count" });
  }
});

// ── Mark notification as read ─────────────────────────────────────────
router.patch("/notifications/:id/read", authenticate, async (req, res): Promise<void> => {
  const userId = req.user!.id;
  const id = parseInt(req.params.id, 10);

  const [notif] = await db.select()
    .from(notificationsTable)
    .where(and(eq(notificationsTable.id, id), eq(notificationsTable.userId, userId)));

  if (!notif) { res.status(404).json({ error: "Not found" }); return; }

  const [updated] = await db.update(notificationsTable)
    .set({ status: "read", readAt: new Date() })
    .where(eq(notificationsTable.id, id))
    .returning();

  res.json(updated);
});

// ── Mark all as read ─────────────────────────────────────────────────
router.post("/notifications/mark-all-read", authenticate, async (req, res): Promise<void> => {
  const userId = req.user!.id;

  await db.update(notificationsTable)
    .set({ status: "read", readAt: new Date() })
    .where(and(eq(notificationsTable.userId, userId), eq(notificationsTable.status, "unread")));

  res.json({ success: true });
});

// ── Delete notification ──────────────────────────────────────────────
router.delete("/notifications/:id", authenticate, async (req, res): Promise<void> => {
  const userId = req.user!.id;
  const id = parseInt(req.params.id, 10);

  const [deleted] = await db.delete(notificationsTable)
    .where(and(eq(notificationsTable.id, id), eq(notificationsTable.userId, userId)))
    .returning();

  if (!deleted) { res.status(404).json({ error: "Not found" }); return; }
  res.sendStatus(204);
});

// ── Get notification preferences ─────────────────────────────────────
router.get("/notification-preferences", authenticate, async (req, res): Promise<void> => {
  const userId = req.user!.id;
  if (!userId) { res.status(403).json({ error: "No user" }); return; }

  const [prefs] = await db.select()
    .from(notificationPreferencesTable)
    .where(eq(notificationPreferencesTable.userId, userId));

  if (!prefs) {
    // Create default preferences
    const [created] = await db.insert(notificationPreferencesTable).values({
      userId,
      paymentNotifications: true,
      voucherNotifications: true,
      routerAlerts: true,
      emailNotifications: true,
    }).returning();
    res.json(created);
  } else {
    res.json(prefs);
  }
});

// ── Update notification preferences ──────────────────────────────────
router.patch("/notification-preferences", authenticate, async (req, res): Promise<void> => {
  const userId = req.user!.id;
  const { paymentNotifications, voucherNotifications, routerAlerts, emailNotifications } = req.body;

  const [prefs] = await db.select()
    .from(notificationPreferencesTable)
    .where(eq(notificationPreferencesTable.userId, userId));

  if (!prefs) {
    const [created] = await db.insert(notificationPreferencesTable).values({
      userId,
      paymentNotifications: paymentNotifications ?? true,
      voucherNotifications: voucherNotifications ?? true,
      routerAlerts: routerAlerts ?? true,
      emailNotifications: emailNotifications ?? true,
    }).returning();
    res.json(created);
    return;
  }

  const [updated] = await db.update(notificationPreferencesTable)
    .set({
      paymentNotifications: paymentNotifications ?? prefs.paymentNotifications,
      voucherNotifications: voucherNotifications ?? prefs.voucherNotifications,
      routerAlerts: routerAlerts ?? prefs.routerAlerts,
      emailNotifications: emailNotifications ?? prefs.emailNotifications,
    })
    .where(eq(notificationPreferencesTable.userId, userId))
    .returning();

  res.json(updated);
});

export default router;
