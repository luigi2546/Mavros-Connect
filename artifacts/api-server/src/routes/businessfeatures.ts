// @ts-nocheck
import { Router } from "express";
import { eq, and, desc } from "drizzle-orm";
import { db } from "@workspace/db";
import {
  businessReportsTable,
  businessMetricsTable,
  customerInsightsTable,
  revenueSummaryTable,
  operationalMetricsTable,
  competitorAnalysisTable,
  forecastsTable,
  marketTrendsTable,
  businessGoalsTable,
} from "@workspace/db";
import { authenticate } from "../middlewares/authenticate";

const router = Router();

// ===== BUSINESS REPORTS ENDPOINTS =====

router.get("/business/reports", authenticate, async (req, res) => {
  try {
    const tenantId = req.user?.tenantId;
    if (!tenantId) return res.status(400).json({ error: "Tenant ID required" });

    const reports = await db
      .select()
      .from(businessReportsTable)
      .where(eq(businessReportsTable.tenantId, tenantId))
      .orderBy(desc(businessReportsTable.generatedAt));

    res.json(reports);
  } catch (error) {
    console.error("Error fetching reports:", error);
    res.status(500).json({ error: "Failed to fetch reports" });
  }
});

router.post("/business/reports", authenticate, async (req, res) => {
  try {
    const tenantId = req.user?.tenantId;
    const userId = req.user?.userId;
    if (!tenantId || !userId) return res.status(400).json({ error: "Missing user info" });

    const { reportName, reportType, description, data } = req.body;
    const report = await db
      .insert(businessReportsTable)
      .values({
        tenantId,
        reportName,
        reportType,
        description,
        data,
        generatedAt: new Date(),
        generatedBy: userId,
      })
      .returning();

    res.json(report[0]);
  } catch (error) {
    console.error("Error creating report:", error);
    res.status(500).json({ error: "Failed to create report" });
  }
});

// ===== BUSINESS METRICS ENDPOINTS =====

router.get("/business/metrics", authenticate, async (req, res) => {
  try {
    const tenantId = req.user?.tenantId;
    if (!tenantId) return res.status(400).json({ error: "Tenant ID required" });

    const metrics = await db
      .select()
      .from(businessMetricsTable)
      .where(eq(businessMetricsTable.tenantId, tenantId))
      .orderBy(desc(businessMetricsTable.createdAt));

    res.json(metrics);
  } catch (error) {
    console.error("Error fetching metrics:", error);
    res.status(500).json({ error: "Failed to fetch metrics" });
  }
});

router.post("/business/metrics", authenticate, async (req, res) => {
  try {
    const tenantId = req.user?.tenantId;
    if (!tenantId) return res.status(400).json({ error: "Tenant ID required" });

    const { metricName, category, value, unit, targetValue, status, trend } = req.body;
    const metric = await db
      .insert(businessMetricsTable)
      .values({
        tenantId,
        metricName,
        category,
        value,
        unit,
        targetValue,
        status,
        trend,
        periodStart: new Date(),
      })
      .returning();

    res.json(metric[0]);
  } catch (error) {
    console.error("Error creating metric:", error);
    res.status(500).json({ error: "Failed to create metric" });
  }
});

// ===== CUSTOMER INSIGHTS ENDPOINTS =====

router.get("/business/insights", authenticate, async (req, res) => {
  try {
    const tenantId = req.user?.tenantId;
    if (!tenantId) return res.status(400).json({ error: "Tenant ID required" });

    const insights = await db
      .select()
      .from(customerInsightsTable)
      .where(eq(customerInsightsTable.tenantId, tenantId))
      .orderBy(desc(customerInsightsTable.updatedAt));

    res.json(insights);
  } catch (error) {
    console.error("Error fetching insights:", error);
    res.status(500).json({ error: "Failed to fetch insights" });
  }
});

router.post("/business/insights", authenticate, async (req, res) => {
  try {
    const tenantId = req.user?.tenantId;
    if (!tenantId) return res.status(400).json({ error: "Tenant ID required" });

    const { customerId, segmentName, insights, churnRisk, lifetime, recommendations } = req.body;
    const insight = await db
      .insert(customerInsightsTable)
      .values({
        tenantId,
        customerId,
        segmentName,
        insights,
        churnRisk,
        lifetime,
        recommendations,
      })
      .returning();

    res.json(insight[0]);
  } catch (error) {
    console.error("Error creating insight:", error);
    res.status(500).json({ error: "Failed to create insight" });
  }
});

// ===== REVENUE SUMMARY ENDPOINTS =====

router.get("/business/revenue", authenticate, async (req, res) => {
  try {
    const tenantId = req.user?.tenantId;
    if (!tenantId) return res.status(400).json({ error: "Tenant ID required" });

    const revenue = await db
      .select()
      .from(revenueSummaryTable)
      .where(eq(revenueSummaryTable.tenantId, tenantId))
      .orderBy(desc(revenueSummaryTable.periodStart));

    res.json(revenue);
  } catch (error) {
    console.error("Error fetching revenue:", error);
    res.status(500).json({ error: "Failed to fetch revenue" });
  }
});

router.post("/business/revenue", authenticate, async (req, res) => {
  try {
    const tenantId = req.user?.tenantId;
    if (!tenantId) return res.status(400).json({ error: "Tenant ID required" });

    const {
      periodStart,
      periodEnd,
      totalRevenue,
      subscriptionRevenue,
      oneTimeRevenue,
      refundsTotal,
      transactionCount,
    } = req.body;

    const netRevenue =
      (parseFloat(totalRevenue) || 0) - (parseFloat(refundsTotal) || 0);

    const revenueSummary = await db
      .insert(revenueSummaryTable)
      .values({
        tenantId,
        periodStart: new Date(periodStart),
        periodEnd: new Date(periodEnd),
        totalRevenue: totalRevenue?.toString(),
        subscriptionRevenue: subscriptionRevenue?.toString(),
        oneTimeRevenue: oneTimeRevenue?.toString(),
        refundsTotal: refundsTotal?.toString(),
        netRevenue: netRevenue.toString(),
        transactionCount,
      })
      .returning();

    res.json(revenueSummary[0]);
  } catch (error) {
    console.error("Error creating revenue summary:", error);
    res.status(500).json({ error: "Failed to create revenue summary" });
  }
});

// ===== OPERATIONAL METRICS ENDPOINTS =====

router.get("/business/operational", authenticate, async (req, res) => {
  try {
    const tenantId = req.user?.tenantId;
    if (!tenantId) return res.status(400).json({ error: "Tenant ID required" });

    const metrics = await db
      .select()
      .from(operationalMetricsTable)
      .where(eq(operationalMetricsTable.tenantId, tenantId))
      .orderBy(desc(operationalMetricsTable.periodStart));

    res.json(metrics);
  } catch (error) {
    console.error("Error fetching operational metrics:", error);
    res.status(500).json({ error: "Failed to fetch operational metrics" });
  }
});

router.post("/business/operational", authenticate, async (req, res) => {
  try {
    const tenantId = req.user?.tenantId;
    if (!tenantId) return res.status(400).json({ error: "Tenant ID required" });

    const {
      periodStart,
      periodEnd,
      systemUptime,
      avgResponseTime,
      ticketResolutionTime,
      customerSatisfaction,
      bugCount,
      deploymentFrequency,
      failureRate,
    } = req.body;

    const metric = await db
      .insert(operationalMetricsTable)
      .values({
        tenantId,
        periodStart: new Date(periodStart),
        periodEnd: new Date(periodEnd),
        systemUptime: systemUptime?.toString(),
        avgResponseTime: avgResponseTime?.toString(),
        ticketResolutionTime: ticketResolutionTime?.toString(),
        customerSatisfaction: customerSatisfaction?.toString(),
        bugCount,
        deploymentFrequency,
        failureRate: failureRate?.toString(),
      })
      .returning();

    res.json(metric[0]);
  } catch (error) {
    console.error("Error creating operational metric:", error);
    res.status(500).json({ error: "Failed to create operational metric" });
  }
});

// ===== FORECASTS ENDPOINTS =====

router.get("/business/forecasts", authenticate, async (req, res) => {
  try {
    const tenantId = req.user?.tenantId;
    if (!tenantId) return res.status(400).json({ error: "Tenant ID required" });

    const forecasts = await db
      .select()
      .from(forecastsTable)
      .where(eq(forecastsTable.tenantId, tenantId))
      .orderBy(desc(forecastsTable.startDate));

    res.json(forecasts);
  } catch (error) {
    console.error("Error fetching forecasts:", error);
    res.status(500).json({ error: "Failed to fetch forecasts" });
  }
});

router.post("/business/forecasts", authenticate, async (req, res) => {
  try {
    const tenantId = req.user?.tenantId;
    if (!tenantId) return res.status(400).json({ error: "Tenant ID required" });

    const { forecastType, forecastData, confidenceLevel, startDate, endDate, modelUsed } =
      req.body;
    const forecast = await db
      .insert(forecastsTable)
      .values({
        tenantId,
        forecastType,
        forecastData,
        confidenceLevel: confidenceLevel?.toString(),
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        modelUsed,
      })
      .returning();

    res.json(forecast[0]);
  } catch (error) {
    console.error("Error creating forecast:", error);
    res.status(500).json({ error: "Failed to create forecast" });
  }
});

// ===== MARKET TRENDS ENDPOINTS =====

router.get("/business/trends", authenticate, async (req, res) => {
  try {
    const tenantId = req.user?.tenantId;
    if (!tenantId) return res.status(400).json({ error: "Tenant ID required" });

    const trends = await db
      .select()
      .from(marketTrendsTable)
      .where(eq(marketTrendsTable.tenantId, tenantId))
      .orderBy(desc(marketTrendsTable.updatedAt));

    res.json(trends);
  } catch (error) {
    console.error("Error fetching trends:", error);
    res.status(500).json({ error: "Failed to fetch trends" });
  }
});

router.post("/business/trends", authenticate, async (req, res) => {
  try {
    const tenantId = req.user?.tenantId;
    if (!tenantId) return res.status(400).json({ error: "Tenant ID required" });

    const { trendName, category, description, impact, relevance, trendData, source } = req.body;
    const trend = await db
      .insert(marketTrendsTable)
      .values({
        tenantId,
        trendName,
        category,
        description,
        impact,
        relevance: relevance?.toString(),
        trendData,
        source,
      })
      .returning();

    res.json(trend[0]);
  } catch (error) {
    console.error("Error creating trend:", error);
    res.status(500).json({ error: "Failed to create trend" });
  }
});

// ===== COMPETITOR ANALYSIS ENDPOINTS =====

router.get("/business/competitors", authenticate, async (req, res) => {
  try {
    const tenantId = req.user?.tenantId;
    if (!tenantId) return res.status(400).json({ error: "Tenant ID required" });

    const competitors = await db
      .select()
      .from(competitorAnalysisTable)
      .where(eq(competitorAnalysisTable.tenantId, tenantId))
      .orderBy(desc(competitorAnalysisTable.lastAnalyzed));

    res.json(competitors);
  } catch (error) {
    console.error("Error fetching competitors:", error);
    res.status(500).json({ error: "Failed to fetch competitors" });
  }
});

router.post("/business/competitors", authenticate, async (req, res) => {
  try {
    const tenantId = req.user?.tenantId;
    if (!tenantId) return res.status(400).json({ error: "Tenant ID required" });

    const { competitorName, marketShare, pricePoint, features, strengths, weaknesses, notes } =
      req.body;
    const competitor = await db
      .insert(competitorAnalysisTable)
      .values({
        tenantId,
        competitorName,
        marketShare: marketShare?.toString(),
        pricePoint: pricePoint?.toString(),
        features,
        strengths,
        weaknesses,
        lastAnalyzed: new Date(),
        notes,
      })
      .returning();

    res.json(competitor[0]);
  } catch (error) {
    console.error("Error creating competitor analysis:", error);
    res.status(500).json({ error: "Failed to create competitor analysis" });
  }
});

// ===== BUSINESS GOALS ENDPOINTS =====

router.get("/business/goals", authenticate, async (req, res) => {
  try {
    const tenantId = req.user?.tenantId;
    if (!tenantId) return res.status(400).json({ error: "Tenant ID required" });

    const goals = await db
      .select()
      .from(businessGoalsTable)
      .where(eq(businessGoalsTable.tenantId, tenantId))
      .orderBy(desc(businessGoalsTable.dueDate));

    res.json(goals);
  } catch (error) {
    console.error("Error fetching goals:", error);
    res.status(500).json({ error: "Failed to fetch goals" });
  }
});

router.post("/business/goals", authenticate, async (req, res) => {
  try {
    const tenantId = req.user?.tenantId;
    const userId = req.user?.userId;
    if (!tenantId || !userId) return res.status(400).json({ error: "Missing user info" });

    const { goalName, description, category, targetValue, unit, priority, dueDate } = req.body;
    const goal = await db
      .insert(businessGoalsTable)
      .values({
        tenantId,
        goalName,
        description,
        category,
        targetValue: targetValue?.toString(),
        currentValue: "0",
        unit,
        priority,
        dueDate: new Date(dueDate),
        owner: userId,
        progress: "0",
        status: "on-track",
      })
      .returning();

    res.json(goal[0]);
  } catch (error) {
    console.error("Error creating goal:", error);
    res.status(500).json({ error: "Failed to create goal" });
  }
});

router.patch("/business/goals/:id", authenticate, async (req, res) => {
  try {
    const tenantId = req.user?.tenantId;
    const goalId = parseInt(req.params.id);
    if (!tenantId) return res.status(400).json({ error: "Tenant ID required" });

    const { currentValue, progress, status } = req.body;
    const goal = await db
      .update(businessGoalsTable)
      .set({
        currentValue: currentValue?.toString(),
        progress: progress?.toString(),
        status,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(businessGoalsTable.id, goalId),
          eq(businessGoalsTable.tenantId, tenantId)
        )
      )
      .returning();

    res.json(goal[0]);
  } catch (error) {
    console.error("Error updating goal:", error);
    res.status(500).json({ error: "Failed to update goal" });
  }
});

export default router;

