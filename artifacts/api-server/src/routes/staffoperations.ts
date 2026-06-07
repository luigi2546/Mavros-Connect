// @ts-nocheck
import { Router } from "express";
import { eq, and, desc, sql } from "drizzle-orm";
import { db } from "@workspace/db";
import {
  rolesTable,
  staffMembersTable,
  staffAssignmentsTable,
  approvalWorkflowsTable,
  approvalRequestsTable,
  permissionLogsTable,
  shiftSchedulesTable,
  performanceMetricsTable,
} from "@workspace/db";
import { authenticate } from "../middlewares/authenticate";

const router = Router();

// ===== ROLES ENDPOINTS =====

router.get("/staff/roles", authenticate, async (req, res) => {
  try {
    const tenantId = req.user?.tenantId;
    if (!tenantId) return res.status(400).json({ error: "Tenant ID required" });

    const roles = await db
      .select()
      .from(rolesTable)
      .where(eq(rolesTable.tenantId, tenantId));

    res.json(roles);
  } catch (error) {
    console.error("Error fetching roles:", error);
    res.status(500).json({ error: "Failed to fetch roles" });
  }
});

router.post("/staff/roles", authenticate, async (req, res) => {
  try {
    const tenantId = req.user?.tenantId;
    if (!tenantId) return res.status(400).json({ error: "Tenant ID required" });

    const { name, description, permissions } = req.body;
    const role = await db
      .insert(rolesTable)
      .values({
        tenantId,
        name,
        description,
        permissions,
      })
      .returning();

    res.json(role[0]);
  } catch (error) {
    console.error("Error creating role:", error);
    res.status(500).json({ error: "Failed to create role" });
  }
});

router.patch("/staff/roles/:id", authenticate, async (req, res) => {
  try {
    const tenantId = req.user?.tenantId;
    const roleId = parseInt(req.params.id);
    if (!tenantId) return res.status(400).json({ error: "Tenant ID required" });

    const { name, description, permissions } = req.body;
    const role = await db
      .update(rolesTable)
      .set({
        name,
        description,
        permissions,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(rolesTable.id, roleId),
          eq(rolesTable.tenantId, tenantId)
        )
      )
      .returning();

    res.json(role[0]);
  } catch (error) {
    console.error("Error updating role:", error);
    res.status(500).json({ error: "Failed to update role" });
  }
});

router.delete("/staff/roles/:id", authenticate, async (req, res) => {
  try {
    const tenantId = req.user?.tenantId;
    const roleId = parseInt(req.params.id);
    if (!tenantId) return res.status(400).json({ error: "Tenant ID required" });

    await db
      .delete(rolesTable)
      .where(
        and(
          eq(rolesTable.id, roleId),
          eq(rolesTable.tenantId, tenantId)
        )
      );

    res.json({ message: "Role deleted" });
  } catch (error) {
    console.error("Error deleting role:", error);
    res.status(500).json({ error: "Failed to delete role" });
  }
});

// ===== STAFF MEMBERS ENDPOINTS =====

router.get("/staff/members", authenticate, async (req, res) => {
  try {
    const tenantId = req.user?.tenantId;
    if (!tenantId) return res.status(400).json({ error: "Tenant ID required" });

    const staff = await db
      .select()
      .from(staffMembersTable)
      .where(eq(staffMembersTable.tenantId, tenantId));

    res.json(staff);
  } catch (error) {
    console.error("Error fetching staff:", error);
    res.status(500).json({ error: "Failed to fetch staff" });
  }
});

router.post("/staff/members", authenticate, async (req, res) => {
  try {
    const tenantId = req.user?.tenantId;
    if (!tenantId) return res.status(400).json({ error: "Tenant ID required" });

    const { userId, roleId, department, title, phone } = req.body;
    const staff = await db
      .insert(staffMembersTable)
      .values({
        tenantId,
        userId,
        roleId,
        department,
        title,
        phone,
        startDate: new Date(),
      })
      .returning();

    res.json(staff[0]);
  } catch (error) {
    console.error("Error creating staff:", error);
    res.status(500).json({ error: "Failed to create staff" });
  }
});

router.patch("/staff/members/:id", authenticate, async (req, res) => {
  try {
    const tenantId = req.user?.tenantId;
    const staffId = parseInt(req.params.id);
    if (!tenantId) return res.status(400).json({ error: "Tenant ID required" });

    const { roleId, department, title, phone, isActive } = req.body;
    const staff = await db
      .update(staffMembersTable)
      .set({
        roleId,
        department,
        title,
        phone,
        isActive,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(staffMembersTable.id, staffId),
          eq(staffMembersTable.tenantId, tenantId)
        )
      )
      .returning();

    res.json(staff[0]);
  } catch (error) {
    console.error("Error updating staff:", error);
    res.status(500).json({ error: "Failed to update staff" });
  }
});

// ===== STAFF ASSIGNMENTS ENDPOINTS =====

router.get("/staff/assignments", authenticate, async (req, res) => {
  try {
    const tenantId = req.user?.tenantId;
    if (!tenantId) return res.status(400).json({ error: "Tenant ID required" });

    const assignments = await db
      .select()
      .from(staffAssignmentsTable)
      .where(eq(staffAssignmentsTable.tenantId, tenantId));

    res.json(assignments);
  } catch (error) {
    console.error("Error fetching assignments:", error);
    res.status(500).json({ error: "Failed to fetch assignments" });
  }
});

router.post("/staff/assignments", authenticate, async (req, res) => {
  try {
    const tenantId = req.user?.tenantId;
    if (!tenantId) return res.status(400).json({ error: "Tenant ID required" });

    const { staffId, locationId, responsibilities, isPrimary } = req.body;
    const assignment = await db
      .insert(staffAssignmentsTable)
      .values({
        tenantId,
        staffId,
        locationId,
        responsibilities,
        isPrimary,
      })
      .returning();

    res.json(assignment[0]);
  } catch (error) {
    console.error("Error creating assignment:", error);
    res.status(500).json({ error: "Failed to create assignment" });
  }
});

// ===== APPROVAL WORKFLOWS ENDPOINTS =====

router.get("/staff/approval-workflows", authenticate, async (req, res) => {
  try {
    const tenantId = req.user?.tenantId;
    if (!tenantId) return res.status(400).json({ error: "Tenant ID required" });

    const workflows = await db
      .select()
      .from(approvalWorkflowsTable)
      .where(eq(approvalWorkflowsTable.tenantId, tenantId));

    res.json(workflows);
  } catch (error) {
    console.error("Error fetching workflows:", error);
    res.status(500).json({ error: "Failed to fetch workflows" });
  }
});

router.post("/staff/approval-workflows", authenticate, async (req, res) => {
  try {
    const tenantId = req.user?.tenantId;
    if (!tenantId) return res.status(400).json({ error: "Tenant ID required" });

    const { workflowName, description, type, approvalSteps } = req.body;
    const workflow = await db
      .insert(approvalWorkflowsTable)
      .values({
        tenantId,
        workflowName,
        description,
        type,
        approvalSteps,
      })
      .returning();

    res.json(workflow[0]);
  } catch (error) {
    console.error("Error creating workflow:", error);
    res.status(500).json({ error: "Failed to create workflow" });
  }
});

// ===== APPROVAL REQUESTS ENDPOINTS =====

router.get("/staff/approval-requests", authenticate, async (req, res) => {
  try {
    const tenantId = req.user?.tenantId;
    if (!tenantId) return res.status(400).json({ error: "Tenant ID required" });

    const requests = await db
      .select()
      .from(approvalRequestsTable)
      .where(eq(approvalRequestsTable.tenantId, tenantId))
      .orderBy(desc(approvalRequestsTable.createdAt));

    res.json(requests);
  } catch (error) {
    console.error("Error fetching approval requests:", error);
    res.status(500).json({ error: "Failed to fetch approval requests" });
  }
});

router.post("/staff/approval-requests", authenticate, async (req, res) => {
  try {
    const tenantId = req.user?.tenantId;
    const staffId = req.user?.userId;
    if (!tenantId || !staffId) return res.status(400).json({ error: "Missing user info" });

    const { workflowId, title, description, requestData } = req.body;
    const request = await db
      .insert(approvalRequestsTable)
      .values({
        tenantId,
        workflowId,
        requesterStaffId: staffId,
        title,
        description,
        requestData,
        status: "pending",
      })
      .returning();

    res.json(request[0]);
  } catch (error) {
    console.error("Error creating approval request:", error);
    res.status(500).json({ error: "Failed to create approval request" });
  }
});

router.patch("/staff/approval-requests/:id/:action", authenticate, async (req, res) => {
  try {
    const tenantId = req.user?.tenantId;
    const requestId = parseInt(req.params.id);
    const action = req.params.action; // approve or reject

    if (!tenantId) return res.status(400).json({ error: "Tenant ID required" });

    const newStatus = action === "approve" ? "approved" : "rejected";
    const request = await db
      .update(approvalRequestsTable)
      .set({
        status: newStatus,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(approvalRequestsTable.id, requestId),
          eq(approvalRequestsTable.tenantId, tenantId)
        )
      )
      .returning();

    res.json(request[0]);
  } catch (error) {
    console.error("Error updating approval request:", error);
    res.status(500).json({ error: "Failed to update approval request" });
  }
});

// ===== SHIFT SCHEDULES ENDPOINTS =====

router.get("/staff/shifts", authenticate, async (req, res) => {
  try {
    const tenantId = req.user?.tenantId;
    if (!tenantId) return res.status(400).json({ error: "Tenant ID required" });

    const shifts = await db
      .select()
      .from(shiftSchedulesTable)
      .where(eq(shiftSchedulesTable.tenantId, tenantId));

    res.json(shifts);
  } catch (error) {
    console.error("Error fetching shifts:", error);
    res.status(500).json({ error: "Failed to fetch shifts" });
  }
});

router.post("/staff/shifts", authenticate, async (req, res) => {
  try {
    const tenantId = req.user?.tenantId;
    if (!tenantId) return res.status(400).json({ error: "Tenant ID required" });

    const { staffId, locationId, shiftName, startTime, endTime, daysOfWeek, startDate } = req.body;
    const shift = await db
      .insert(shiftSchedulesTable)
      .values({
        tenantId,
        staffId,
        locationId,
        shiftName,
        startTime,
        endTime,
        daysOfWeek,
        startDate,
      })
      .returning();

    res.json(shift[0]);
  } catch (error) {
    console.error("Error creating shift:", error);
    res.status(500).json({ error: "Failed to create shift" });
  }
});

// ===== PERFORMANCE METRICS ENDPOINTS =====

router.get("/staff/performance", authenticate, async (req, res) => {
  try {
    const tenantId = req.user?.tenantId;
    if (!tenantId) return res.status(400).json({ error: "Tenant ID required" });

    const metrics = await db
      .select()
      .from(performanceMetricsTable)
      .where(eq(performanceMetricsTable.tenantId, tenantId));

    res.json(metrics);
  } catch (error) {
    console.error("Error fetching performance metrics:", error);
    res.status(500).json({ error: "Failed to fetch performance metrics" });
  }
});

router.post("/staff/performance", authenticate, async (req, res) => {
  try {
    const tenantId = req.user?.tenantId;
    if (!tenantId) return res.status(400).json({ error: "Tenant ID required" });

    const { staffId, tasksCompleted, ticketsResolved, averageResponseTime, satisfactionScore, notes } = req.body;
    const metric = await db
      .insert(performanceMetricsTable)
      .values({
        tenantId,
        staffId,
        tasksCompleted,
        ticketsResolved,
        averageResponseTime,
        satisfactionScore,
        evaluationDate: new Date(),
        notes,
      })
      .returning();

    res.json(metric[0]);
  } catch (error) {
    console.error("Error creating performance metric:", error);
    res.status(500).json({ error: "Failed to create performance metric" });
  }
});

// ===== PERMISSION LOGS ENDPOINTS =====

router.get("/staff/permission-logs", authenticate, async (req, res) => {
  try {
    const tenantId = req.user?.tenantId;
    if (!tenantId) return res.status(400).json({ error: "Tenant ID required" });

    const logs = await db
      .select()
      .from(permissionLogsTable)
      .where(eq(permissionLogsTable.tenantId, tenantId))
      .orderBy(desc(permissionLogsTable.timestamp));

    res.json(logs);
  } catch (error) {
    console.error("Error fetching permission logs:", error);
    res.status(500).json({ error: "Failed to fetch permission logs" });
  }
});

export default router;
