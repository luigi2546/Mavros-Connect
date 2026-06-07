// @ts-nocheck
import { Router } from "express";
import { eq, and, desc } from "drizzle-orm";
import { db } from "@workspace/db";
import {
  apiKeysTable,
  webhooksTable,
  webhookLogsTable,
  integrationsTable,
  integrationEventsTable,
  apiDocumentationTable,
  oauthAppsTable,
  oauthTokensTable,
  apiRateLimitsTable,
} from "@workspace/db";
import { authenticate } from "../middlewares/authenticate";

const router = Router();

// ===== API KEYS ENDPOINTS =====

router.get("/integrations/api-keys", authenticate, async (req, res) => {
  try {
    const tenantId = req.user?.tenantId;
    if (!tenantId) return res.status(400).json({ error: "Tenant ID required" });

    const keys = await db
      .select()
      .from(apiKeysTable)
      .where(eq(apiKeysTable.tenantId, tenantId));

    res.json(keys);
  } catch (error) {
    console.error("Error fetching API keys:", error);
    res.status(500).json({ error: "Failed to fetch API keys" });
  }
});

router.post("/integrations/api-keys", authenticate, async (req, res) => {
  try {
    const tenantId = req.user?.tenantId;
    if (!tenantId) return res.status(400).json({ error: "Tenant ID required" });

    const { keyName, description, scopes, rateLimit, expiresAt } = req.body;
    const keyHash = Buffer.from(Math.random().toString()).toString("base64");

    const apiKey = await db
      .insert(apiKeysTable)
      .values({
        tenantId,
        keyName,
        keyHash,
        description,
        scopes,
        rateLimit,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
      })
      .returning();

    res.json(apiKey[0]);
  } catch (error) {
    console.error("Error creating API key:", error);
    res.status(500).json({ error: "Failed to create API key" });
  }
});

router.patch("/integrations/api-keys/:id/revoke", authenticate, async (req, res) => {
  try {
    const tenantId = req.user?.tenantId;
    const keyId = parseInt(req.params.id);
    if (!tenantId) return res.status(400).json({ error: "Tenant ID required" });

    const key = await db
      .update(apiKeysTable)
      .set({
        isActive: false,
        revokedAt: new Date(),
      })
      .where(
        and(eq(apiKeysTable.id, keyId), eq(apiKeysTable.tenantId, tenantId))
      )
      .returning();

    res.json(key[0]);
  } catch (error) {
    console.error("Error revoking API key:", error);
    res.status(500).json({ error: "Failed to revoke API key" });
  }
});

// ===== WEBHOOKS ENDPOINTS =====

router.get("/integrations/webhooks", authenticate, async (req, res) => {
  try {
    const tenantId = req.user?.tenantId;
    if (!tenantId) return res.status(400).json({ error: "Tenant ID required" });

    const webhooks = await db
      .select()
      .from(webhooksTable)
      .where(eq(webhooksTable.tenantId, tenantId));

    res.json(webhooks);
  } catch (error) {
    console.error("Error fetching webhooks:", error);
    res.status(500).json({ error: "Failed to fetch webhooks" });
  }
});

router.post("/integrations/webhooks", authenticate, async (req, res) => {
  try {
    const tenantId = req.user?.tenantId;
    if (!tenantId) return res.status(400).json({ error: "Tenant ID required" });

    const { url, events, description, secret, retryCount, headers } = req.body;
    const webhook = await db
      .insert(webhooksTable)
      .values({
        tenantId,
        url,
        events,
        description,
        secret,
        retryCount,
        headers,
      })
      .returning();

    res.json(webhook[0]);
  } catch (error) {
    console.error("Error creating webhook:", error);
    res.status(500).json({ error: "Failed to create webhook" });
  }
});

router.patch("/integrations/webhooks/:id", authenticate, async (req, res) => {
  try {
    const tenantId = req.user?.tenantId;
    const webhookId = parseInt(req.params.id);
    if (!tenantId) return res.status(400).json({ error: "Tenant ID required" });

    const { url, events, isActive, retryCount } = req.body;
    const webhook = await db
      .update(webhooksTable)
      .set({
        url,
        events,
        isActive,
        retryCount,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(webhooksTable.id, webhookId),
          eq(webhooksTable.tenantId, tenantId)
        )
      )
      .returning();

    res.json(webhook[0]);
  } catch (error) {
    console.error("Error updating webhook:", error);
    res.status(500).json({ error: "Failed to update webhook" });
  }
});

router.delete("/integrations/webhooks/:id", authenticate, async (req, res) => {
  try {
    const tenantId = req.user?.tenantId;
    const webhookId = parseInt(req.params.id);
    if (!tenantId) return res.status(400).json({ error: "Tenant ID required" });

    await db
      .delete(webhooksTable)
      .where(
        and(
          eq(webhooksTable.id, webhookId),
          eq(webhooksTable.tenantId, tenantId)
        )
      );

    res.json({ message: "Webhook deleted" });
  } catch (error) {
    console.error("Error deleting webhook:", error);
    res.status(500).json({ error: "Failed to delete webhook" });
  }
});

// ===== WEBHOOK LOGS ENDPOINTS =====

router.get("/integrations/webhooks/:id/logs", authenticate, async (req, res) => {
  try {
    const tenantId = req.user?.tenantId;
    const webhookId = parseInt(req.params.id);
    if (!tenantId) return res.status(400).json({ error: "Tenant ID required" });

    const logs = await db
      .select()
      .from(webhookLogsTable)
      .where(
        and(
          eq(webhookLogsTable.webhookId, webhookId),
          eq(webhookLogsTable.tenantId, tenantId)
        )
      )
      .orderBy(desc(webhookLogsTable.createdAt));

    res.json(logs);
  } catch (error) {
    console.error("Error fetching webhook logs:", error);
    res.status(500).json({ error: "Failed to fetch webhook logs" });
  }
});

// ===== INTEGRATIONS ENDPOINTS =====

router.get("/integrations/list", authenticate, async (req, res) => {
  try {
    const tenantId = req.user?.tenantId;
    if (!tenantId) return res.status(400).json({ error: "Tenant ID required" });

    const integrations = await db
      .select()
      .from(integrationsTable)
      .where(eq(integrationsTable.tenantId, tenantId))
      .orderBy(desc(integrationsTable.updatedAt));

    res.json(integrations);
  } catch (error) {
    console.error("Error fetching integrations:", error);
    res.status(500).json({ error: "Failed to fetch integrations" });
  }
});

router.post("/integrations/list", authenticate, async (req, res) => {
  try {
    const tenantId = req.user?.tenantId;
    if (!tenantId) return res.status(400).json({ error: "Tenant ID required" });

    const { serviceName, serviceType, description, config, credentials } = req.body;
    const integration = await db
      .insert(integrationsTable)
      .values({
        tenantId,
        serviceName,
        serviceType,
        description,
        config,
        credentials,
      })
      .returning();

    res.json(integration[0]);
  } catch (error) {
    console.error("Error creating integration:", error);
    res.status(500).json({ error: "Failed to create integration" });
  }
});

router.patch("/integrations/list/:id", authenticate, async (req, res) => {
  try {
    const tenantId = req.user?.tenantId;
    const integrationId = parseInt(req.params.id);
    if (!tenantId) return res.status(400).json({ error: "Tenant ID required" });

    const { isActive, config } = req.body;
    const integration = await db
      .update(integrationsTable)
      .set({
        isActive,
        config,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(integrationsTable.id, integrationId),
          eq(integrationsTable.tenantId, tenantId)
        )
      )
      .returning();

    res.json(integration[0]);
  } catch (error) {
    console.error("Error updating integration:", error);
    res.status(500).json({ error: "Failed to update integration" });
  }
});

// ===== INTEGRATION EVENTS ENDPOINTS =====

router.get("/integrations/events", authenticate, async (req, res) => {
  try {
    const tenantId = req.user?.tenantId;
    if (!tenantId) return res.status(400).json({ error: "Tenant ID required" });

    const events = await db
      .select()
      .from(integrationEventsTable)
      .where(eq(integrationEventsTable.tenantId, tenantId))
      .orderBy(desc(integrationEventsTable.createdAt));

    res.json(events);
  } catch (error) {
    console.error("Error fetching integration events:", error);
    res.status(500).json({ error: "Failed to fetch integration events" });
  }
});

// ===== API DOCUMENTATION ENDPOINTS =====

router.get("/integrations/docs", authenticate, async (req, res) => {
  try {
    const tenantId = req.user?.tenantId;
    if (!tenantId) return res.status(400).json({ error: "Tenant ID required" });

    const docs = await db
      .select()
      .from(apiDocumentationTable)
      .where(eq(apiDocumentationTable.tenantId, tenantId))
      .orderBy(desc(apiDocumentationTable.updatedAt));

    res.json(docs);
  } catch (error) {
    console.error("Error fetching API documentation:", error);
    res.status(500).json({ error: "Failed to fetch API documentation" });
  }
});

router.post("/integrations/docs", authenticate, async (req, res) => {
  try {
    const tenantId = req.user?.tenantId;
    if (!tenantId) return res.status(400).json({ error: "Tenant ID required" });

    const { endpointPath, method, description, parameters, requestBody, responseBody, examples } =
      req.body;
    const doc = await db
      .insert(apiDocumentationTable)
      .values({
        tenantId,
        endpointPath,
        method,
        description,
        parameters,
        requestBody,
        responseBody,
        examples,
      })
      .returning();

    res.json(doc[0]);
  } catch (error) {
    console.error("Error creating API documentation:", error);
    res.status(500).json({ error: "Failed to create API documentation" });
  }
});

// ===== OAUTH APPS ENDPOINTS =====

router.get("/integrations/oauth/apps", authenticate, async (req, res) => {
  try {
    const tenantId = req.user?.tenantId;
    if (!tenantId) return res.status(400).json({ error: "Tenant ID required" });

    const apps = await db
      .select()
      .from(oauthAppsTable)
      .where(eq(oauthAppsTable.tenantId, tenantId));

    res.json(apps);
  } catch (error) {
    console.error("Error fetching OAuth apps:", error);
    res.status(500).json({ error: "Failed to fetch OAuth apps" });
  }
});

router.post("/integrations/oauth/apps", authenticate, async (req, res) => {
  try {
    const tenantId = req.user?.tenantId;
    if (!tenantId) return res.status(400).json({ error: "Tenant ID required" });

    const { appName, description, redirectUris, scopes } = req.body;
    const clientId = Buffer.from(Math.random().toString()).toString("base64").slice(0, 32);
    const clientSecret = Buffer.from(Math.random().toString()).toString("base64").slice(0, 64);

    const app = await db
      .insert(oauthAppsTable)
      .values({
        tenantId,
        appName,
        description,
        clientId,
        clientSecret,
        redirectUris,
        scopes,
      })
      .returning();

    res.json(app[0]);
  } catch (error) {
    console.error("Error creating OAuth app:", error);
    res.status(500).json({ error: "Failed to create OAuth app" });
  }
});

// ===== RATE LIMITS ENDPOINTS =====

router.get("/integrations/rate-limits", authenticate, async (req, res) => {
  try {
    const tenantId = req.user?.tenantId;
    if (!tenantId) return res.status(400).json({ error: "Tenant ID required" });

    const limits = await db
      .select()
      .from(apiRateLimitsTable)
      .where(eq(apiRateLimitsTable.tenantId, tenantId));

    res.json(limits);
  } catch (error) {
    console.error("Error fetching rate limits:", error);
    res.status(500).json({ error: "Failed to fetch rate limits" });
  }
});

router.post("/integrations/rate-limits", authenticate, async (req, res) => {
  try {
    const tenantId = req.user?.tenantId;
    if (!tenantId) return res.status(400).json({ error: "Tenant ID required" });

    const { apiKeyId, requestsPerSecond, requestsPerDay } = req.body;
    const limit = await db
      .insert(apiRateLimitsTable)
      .values({
        tenantId,
        apiKeyId,
        requestsPerSecond,
        requestsPerDay,
      })
      .returning();

    res.json(limit[0]);
  } catch (error) {
    console.error("Error creating rate limit:", error);
    res.status(500).json({ error: "Failed to create rate limit" });
  }
});

export default router;
