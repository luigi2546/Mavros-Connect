import { Router } from "express";
import { db } from "@workspace/db";
import {
  userProfilesTable,
  twoFactorCodesTable,
  securityQuestionsTable,
  userSecurityAnswersTable,
  deviceSessionsTable,
  translationsTable,
  userPreferencesTable,
  passwordResetTokensTable,
  accountRecoveryTable,
  usersTable,
} from "@workspace/db";
import { eq, and, desc, gte } from "drizzle-orm";
import { authenticate } from "../middlewares/authenticate";
import crypto from "crypto";
import bcrypt from "bcryptjs";

const userExperienceRouter = Router();
userExperienceRouter.use(authenticate);

// User Profile: Get my profile
userExperienceRouter.get("/user/profile", async (req, res) => {
  try {
    const userId = (req.user as any).id;
    const tenantId = (req.user as any).tenantId;

    const profile = await db
      .select()
      .from(userProfilesTable)
      .where(and(eq(userProfilesTable.userId, userId), eq(userProfilesTable.tenantId, tenantId)))
      .then((rows) => rows[0]);

    if (!profile) {
      return res.status(404).json({ error: "Profile not found" });
    }

    res.json(profile);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to fetch profile" });
  }
});

// User Profile: Update my profile
userExperienceRouter.patch("/user/profile", async (req, res) => {
  try {
    const userId = (req.user as any).id;
    const tenantId = (req.user as any).tenantId;
    const { firstName, lastName, bio, phone, department, jobTitle, timezone, language, theme } = req.body;

    await db
      .update(userProfilesTable)
      .set({
        firstName: firstName || undefined,
        lastName: lastName || undefined,
        bio: bio || undefined,
        phone: phone || undefined,
        department: department || undefined,
        jobTitle: jobTitle || undefined,
        timezone: timezone || undefined,
        language: language || undefined,
        theme: theme || undefined,
        updatedAt: new Date(),
      })
      .where(and(eq(userProfilesTable.userId, userId), eq(userProfilesTable.tenantId, tenantId)));

    res.json({ success: true, message: "Profile updated" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to update profile" });
  }
});

// 2FA: Request 2FA setup (send verification code)
userExperienceRouter.post("/user/2fa/setup", async (req, res) => {
  try {
    const userId = (req.user as any).id;
    const tenantId = (req.user as any).tenantId;

    const code = Math.random().toString(36).substring(2, 8).toUpperCase();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    await db.insert(twoFactorCodesTable).values({
      userId,
      tenantId,
      code,
      type: "email",
      expiresAt,
    });

    // TODO: Send email with code
    res.json({ success: true, message: "Verification code sent to email" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to setup 2FA" });
  }
});

// 2FA: Verify code and enable 2FA
userExperienceRouter.post("/user/2fa/verify", async (req, res) => {
  try {
    const userId = (req.user as any).id;
    const tenantId = (req.user as any).tenantId;
    const { code } = req.body;

    if (!code) {
      return res.status(400).json({ error: "Code is required" });
    }

    const twoFactorCode = await db
      .select()
      .from(twoFactorCodesTable)
      .where(
        and(
          eq(twoFactorCodesTable.userId, userId),
          eq(twoFactorCodesTable.code, code),
          eq(twoFactorCodesTable.isUsed, false),
          gte(twoFactorCodesTable.expiresAt, new Date())
        )
      )
      .then((rows) => rows[0]);

    if (!twoFactorCode) {
      return res.status(400).json({ error: "Invalid or expired code" });
    }

    // Generate backup codes
    const backupCodes = Array.from({ length: 10 }, () =>
      crypto.randomBytes(4).toString("hex").toUpperCase()
    );

    await db
      .update(userProfilesTable)
      .set({
        twoFactorEnabled: true,
        twoFactorBackupCodes: backupCodes,
        updatedAt: new Date(),
      })
      .where(and(eq(userProfilesTable.userId, userId), eq(userProfilesTable.tenantId, tenantId)));

    await db
      .update(twoFactorCodesTable)
      .set({ isUsed: true, usedAt: new Date() })
      .where(eq(twoFactorCodesTable.id, twoFactorCode.id));

    res.json({
      success: true,
      message: "2FA enabled",
      backupCodes,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to verify 2FA" });
  }
});

// 2FA: Disable 2FA
userExperienceRouter.post("/user/2fa/disable", async (req, res) => {
  try {
    const userId = (req.user as any).id;
    const tenantId = (req.user as any).tenantId;

    await db
      .update(userProfilesTable)
      .set({
        twoFactorEnabled: false,
        twoFactorBackupCodes: [],
        updatedAt: new Date(),
      })
      .where(and(eq(userProfilesTable.userId, userId), eq(userProfilesTable.tenantId, tenantId)));

    res.json({ success: true, message: "2FA disabled" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to disable 2FA" });
  }
});

// Security Questions: Get all security questions
userExperienceRouter.get("/security-questions", async (req, res) => {
  try {
    const questions = await db
      .select()
      .from(securityQuestionsTable)
      .where(eq(securityQuestionsTable.isActive, true));

    res.json(questions);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to fetch security questions" });
  }
});

// Security Questions: Set my security answers
userExperienceRouter.post("/user/security-answers", async (req, res) => {
  try {
    const userId = (req.user as any).id;
    const tenantId = (req.user as any).tenantId;
    const { answers } = req.body; // [{ questionId, answer }, ...]

    if (!Array.isArray(answers) || answers.length === 0) {
      return res.status(400).json({ error: "At least one answer required" });
    }

    // Delete existing answers
    await db
      .delete(userSecurityAnswersTable)
      .where(
        and(
          eq(userSecurityAnswersTable.userId, userId),
          eq(userSecurityAnswersTable.tenantId, tenantId)
        )
      );

    // Insert new answers with hashed values
    for (const { questionId, answer } of answers) {
      const answerHash = bcrypt.hashSync(answer.toLowerCase(), 10);
      await db.insert(userSecurityAnswersTable).values({
        userId,
        tenantId,
        questionId,
        answerHash,
      });
    }

    res.json({ success: true, message: "Security answers updated" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to update security answers" });
  }
});

// Device Sessions: Get my active sessions
userExperienceRouter.get("/user/sessions", async (req, res) => {
  try {
    const userId = (req.user as any).id;
    const tenantId = (req.user as any).tenantId;

    const sessions = await db
      .select()
      .from(deviceSessionsTable)
      .where(
        and(eq(deviceSessionsTable.userId, userId), eq(deviceSessionsTable.tenantId, tenantId))
      )
      .orderBy(desc(deviceSessionsTable.createdAt));

    res.json(sessions);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to fetch sessions" });
  }
});

// Device Sessions: Logout from specific device
userExperienceRouter.post("/user/sessions/:id/logout", async (req, res) => {
  try {
    const userId = (req.user as any).id;
    const tenantId = (req.user as any).tenantId;
    const sessionId = parseInt(req.params.id);

    const session = await db
      .select()
      .from(deviceSessionsTable)
      .where(
        and(
          eq(deviceSessionsTable.id, sessionId),
          eq(deviceSessionsTable.userId, userId),
          eq(deviceSessionsTable.tenantId, tenantId)
        )
      )
      .then((rows) => rows[0]);

    if (!session) {
      return res.status(404).json({ error: "Session not found" });
    }

    await db
      .update(deviceSessionsTable)
      .set({ isActive: false, logoutAt: new Date() })
      .where(eq(deviceSessionsTable.id, sessionId));

    res.json({ success: true, message: "Session logged out" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to logout session" });
  }
});

// Preferences: Get my preferences
userExperienceRouter.get("/user/preferences", async (req, res) => {
  try {
    const userId = (req.user as any).id;
    const tenantId = (req.user as any).tenantId;

    const preferences = await db
      .select()
      .from(userPreferencesTable)
      .where(
        and(eq(userPreferencesTable.userId, userId), eq(userPreferencesTable.tenantId, tenantId))
      )
      .then((rows) => rows[0]);

    res.json(preferences || {});
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to fetch preferences" });
  }
});

// Preferences: Update my preferences
userExperienceRouter.patch("/user/preferences", async (req, res) => {
  try {
    const userId = (req.user as any).id;
    const tenantId = (req.user as any).tenantId;
    const {
      emailNotifications,
      smsNotifications,
      pushNotifications,
      marketingEmails,
      weeklyReport,
      dailyDigest,
      preferences,
    } = req.body;

    const existing = await db
      .select()
      .from(userPreferencesTable)
      .where(
        and(eq(userPreferencesTable.userId, userId), eq(userPreferencesTable.tenantId, tenantId))
      )
      .then((rows) => rows[0]);

    if (existing) {
      await db
        .update(userPreferencesTable)
        .set({
          emailNotifications: emailNotifications !== undefined ? emailNotifications : existing.emailNotifications,
          smsNotifications: smsNotifications !== undefined ? smsNotifications : existing.smsNotifications,
          pushNotifications: pushNotifications !== undefined ? pushNotifications : existing.pushNotifications,
          marketingEmails: marketingEmails !== undefined ? marketingEmails : existing.marketingEmails,
          weeklyReport: weeklyReport !== undefined ? weeklyReport : existing.weeklyReport,
          dailyDigest: dailyDigest !== undefined ? dailyDigest : existing.dailyDigest,
          preferences: preferences || existing.preferences,
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(userPreferencesTable.userId, userId),
            eq(userPreferencesTable.tenantId, tenantId)
          )
        );
    } else {
      await db.insert(userPreferencesTable).values({
        userId,
        tenantId,
        emailNotifications: emailNotifications || true,
        smsNotifications: smsNotifications || false,
        pushNotifications: pushNotifications || true,
        marketingEmails: marketingEmails || false,
        weeklyReport: weeklyReport || true,
        dailyDigest: dailyDigest || false,
        preferences: preferences || {},
      });
    }

    res.json({ success: true, message: "Preferences updated" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to update preferences" });
  }
});

// Translations: Get translations for language
userExperienceRouter.get("/translations/:language", async (req, res) => {
  try {
    const language = req.params.language;
    const namespace = req.query.namespace as string | undefined;

    let query = db
      .select()
      .from(translationsTable)
      .where(eq(translationsTable.language, language));

    if (namespace) {
      query = query.where(eq(translationsTable.namespace, namespace));
    }

    const translations = await query;

    const result: Record<string, string> = {};
    translations.forEach((t) => {
      result[t.key] = t.value;
    });

    res.json(result);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to fetch translations" });
  }
});

// Account Recovery: Request account recovery
userExperienceRouter.post("/user/account-recovery/request", async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: "Email is required" });
    }

    const user = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.email, email))
      .then((rows) => rows[0]);

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const recoveryCode = crypto.randomBytes(3).toString("hex").toUpperCase();
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    await db.insert(accountRecoveryTable).values({
      userId: user.id,
      tenantId: user.tenantId,
      recoveryMethod: "email",
      status: "pending",
      verificationCode: recoveryCode,
      verificationCodeExpiresAt: expiresAt,
    });

    // TODO: Send email with recovery code
    res.json({ success: true, message: "Recovery code sent to email" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to request account recovery" });
  }
});

// Account Recovery: Verify recovery code
userExperienceRouter.post("/user/account-recovery/verify", async (req, res) => {
  try {
    const { email, code } = req.body;

    if (!email || !code) {
      return res.status(400).json({ error: "Email and code required" });
    }

    const user = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.email, email))
      .then((rows) => rows[0]);

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const recovery = await db
      .select()
      .from(accountRecoveryTable)
      .where(
        and(
          eq(accountRecoveryTable.userId, user.id),
          eq(accountRecoveryTable.verificationCode, code)
        )
      )
      .orderBy(desc(accountRecoveryTable.createdAt))
      .then((rows) => rows[0]);

    if (!recovery || !recovery.verificationCodeExpiresAt || recovery.verificationCodeExpiresAt < new Date()) {
      return res.status(400).json({ error: "Invalid or expired recovery code" });
    }

    // Generate recovery token
    const recoveryToken = crypto.randomBytes(32).toString("hex");

    await db
      .update(accountRecoveryTable)
      .set({ status: "verified" })
      .where(eq(accountRecoveryTable.id, recovery.id));

    res.json({ success: true, recoveryToken, message: "Recovery verified" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to verify recovery code" });
  }
});

export default userExperienceRouter;
