import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, Shield, Clock, TrendingUp, CheckCircle2, FileText } from "lucide-react";
import { authenticatedFetch } from "@/utils/authenticatedFetch";

interface Role {
  id: number;
  name: string;
  description: string;
  permissions: string[];
  isDefault: boolean;
}

interface StaffMember {
  id: number;
  userId: number;
  roleId: number;
  department: string;
  title: string;
  phone: string;
  isActive: boolean;
}

interface StaffAssignment {
  id: number;
  staffId: number;
  locationId: number;
  responsibilities: string;
  isPrimary: boolean;
}

interface ApprovalRequest {
  id: number;
  title: string;
  status: string;
  requesterStaffId: number;
  createdAt: string;
}

interface ShiftSchedule {
  id: number;
  staffId: number;
  locationId: number;
  shiftName: string;
  startTime: string;
  endTime: string;
  daysOfWeek: number[];
}

interface PerformanceMetric {
  id: number;
  staffId: number;
  tasksCompleted: number;
  ticketsResolved: number;
  averageResponseTime: number;
  satisfactionScore: number;
}

export default function StaffOperations() {
  const queryClient = useQueryClient();

  // Fetch all data
  const { data: roles = [], isLoading: rolesLoading } = useQuery({
    queryKey: ["staff-roles"],
    queryFn: async () => {
      const response = await authenticatedFetch("/api/staff/roles");
      return response.json();
    },
    select: (data: unknown) => Array.isArray(data) ? data : [],
  });

  const { data: staffMembers = [], isLoading: staffLoading } = useQuery({
    queryKey: ["staff-members"],
    queryFn: async () => {
      const response = await authenticatedFetch("/api/staff/members");
      return response.json();
    },
    select: (data: unknown) => Array.isArray(data) ? data : [],
  });

  const { data: assignments = [] } = useQuery({
    queryKey: ["staff-assignments"],
    queryFn: async () => {
      const response = await authenticatedFetch("/api/staff/assignments");
      return response.json();
    },
    select: (data: unknown) => Array.isArray(data) ? data : [],
  });

  const { data: approvals = [] } = useQuery({
    queryKey: ["approval-requests"],
    queryFn: async () => {
      const response = await authenticatedFetch("/api/staff/approval-requests");
      return response.json();
    },
    select: (data: unknown) => Array.isArray(data) ? data : [],
  });

  const { data: shifts = [] } = useQuery({
    queryKey: ["shift-schedules"],
    queryFn: async () => {
      const response = await authenticatedFetch("/api/staff/shifts");
      return response.json();
    },
    select: (data: unknown) => Array.isArray(data) ? data : [],
  });

  const { data: performance = [] } = useQuery({
    queryKey: ["performance-metrics"],
    queryFn: async () => {
      const response = await authenticatedFetch("/api/staff/performance");
      return response.json();
    },
    select: (data: unknown) => Array.isArray(data) ? data : [],
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "approved":
        return "bg-green-100 text-green-800";
      case "rejected":
        return "bg-red-100 text-red-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getDayName = (day: number) => {
    const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    return days[day] || "";
  };

  return (
    <div className="w-full space-y-4">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Staff & Operations</h1>
        <p className="text-gray-500 mt-2">Manage team members, roles, approvals, and performance</p>
      </div>

      <Tabs defaultValue="staff" className="w-full">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="staff" className="flex items-center gap-2">
            <Users className="w-4 h-4" />
            <span className="hidden sm:inline">Staff</span>
          </TabsTrigger>
          <TabsTrigger value="roles" className="flex items-center gap-2">
            <Shield className="w-4 h-4" />
            <span className="hidden sm:inline">Roles</span>
          </TabsTrigger>
          <TabsTrigger value="assignments" className="flex items-center gap-2">
            <FileText className="w-4 h-4" />
            <span className="hidden sm:inline">Assign</span>
          </TabsTrigger>
          <TabsTrigger value="approvals" className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" />
            <span className="hidden sm:inline">Approve</span>
          </TabsTrigger>
          <TabsTrigger value="shifts" className="flex items-center gap-2">
            <Clock className="w-4 h-4" />
            <span className="hidden sm:inline">Shifts</span>
          </TabsTrigger>
          <TabsTrigger value="performance" className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4" />
            <span className="hidden sm:inline">Perf</span>
          </TabsTrigger>
        </TabsList>

        {/* STAFF MEMBERS TAB */}
        <TabsContent value="staff" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Staff Members</CardTitle>
            </CardHeader>
            <CardContent>
              {staffLoading ? (
                <p className="text-gray-500">Loading staff...</p>
              ) : staffMembers.length === 0 ? (
                <p className="text-gray-500">No staff members found</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {staffMembers.map((staff: StaffMember) => (
                    <Card key={staff.id} className="bg-gray-50">
                      <CardContent className="pt-4">
                        <div className="space-y-2">
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="font-semibold">{staff.title}</p>
                              <p className="text-sm text-gray-600">{staff.department}</p>
                            </div>
                            <Badge variant={staff.isActive ? "default" : "secondary"}>
                              {staff.isActive ? "Active" : "Inactive"}
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-700">{staff.phone}</p>
                          <p className="text-xs text-gray-500">ID: {staff.id}</p>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ROLES TAB */}
        <TabsContent value="roles" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Roles & Permissions</CardTitle>
            </CardHeader>
            <CardContent>
              {rolesLoading ? (
                <p className="text-gray-500">Loading roles...</p>
              ) : roles.length === 0 ? (
                <p className="text-gray-500">No roles found</p>
              ) : (
                <div className="space-y-3">
                  {roles.map((role: Role) => (
                    <Card key={role.id} className="bg-gray-50">
                      <CardContent className="pt-4">
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <p className="font-semibold">{role.name}</p>
                            <p className="text-sm text-gray-600">{role.description}</p>
                          </div>
                          {role.isDefault && <Badge>Default</Badge>}
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {Array.isArray(role.permissions) &&
                            role.permissions.map((perm: string, idx: number) => (
                              <Badge key={idx} variant="outline" className="text-xs">
                                {perm}
                              </Badge>
                            ))}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ASSIGNMENTS TAB */}
        <TabsContent value="assignments" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Location Assignments</CardTitle>
            </CardHeader>
            <CardContent>
              {assignments.length === 0 ? (
                <p className="text-gray-500">No assignments found</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-100">
                      <tr>
                        <th className="px-4 py-2 text-left">Staff ID</th>
                        <th className="px-4 py-2 text-left">Location ID</th>
                        <th className="px-4 py-2 text-left">Responsibilities</th>
                        <th className="px-4 py-2 text-left">Primary</th>
                      </tr>
                    </thead>
                    <tbody>
                      {assignments.map((assignment: StaffAssignment) => (
                        <tr key={assignment.id} className="border-t">
                          <td className="px-4 py-2">{assignment.staffId}</td>
                          <td className="px-4 py-2">{assignment.locationId}</td>
                          <td className="px-4 py-2 text-gray-700">{assignment.responsibilities}</td>
                          <td className="px-4 py-2">
                            <Badge variant={assignment.isPrimary ? "default" : "secondary"}>
                              {assignment.isPrimary ? "Yes" : "No"}
                            </Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* APPROVALS TAB */}
        <TabsContent value="approvals" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Approval Requests</CardTitle>
            </CardHeader>
            <CardContent>
              {approvals.length === 0 ? (
                <p className="text-gray-500">No approval requests found</p>
              ) : (
                <div className="space-y-3">
                  {approvals.map((approval: ApprovalRequest) => (
                    <Card key={approval.id} className="bg-gray-50">
                      <CardContent className="pt-4">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <p className="font-semibold">{approval.title}</p>
                            <p className="text-sm text-gray-600">
                              Requester ID: {approval.requesterStaffId}
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
                              {new Date(approval.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                          <Badge className={getStatusColor(approval.status)}>
                            {approval.status.charAt(0).toUpperCase() + approval.status.slice(1)}
                          </Badge>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* SHIFTS TAB */}
        <TabsContent value="shifts" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Shift Schedules</CardTitle>
            </CardHeader>
            <CardContent>
              {shifts.length === 0 ? (
                <p className="text-gray-500">No shift schedules found</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {shifts.map((shift: ShiftSchedule) => (
                    <Card key={shift.id} className="bg-gray-50">
                      <CardContent className="pt-4">
                        <div className="space-y-2">
                          <div>
                            <p className="font-semibold">{shift.shiftName}</p>
                            <p className="text-sm text-gray-600">
                              {shift.startTime} - {shift.endTime}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs font-medium text-gray-700 mb-1">Days:</p>
                            <div className="flex gap-1">
                              {shift.daysOfWeek.map((day: number) => (
                                <Badge key={day} variant="outline" className="text-xs">
                                  {getDayName(day)}
                                </Badge>
                              ))}
                            </div>
                          </div>
                          <p className="text-xs text-gray-500">
                            Staff ID: {shift.staffId} | Location: {shift.locationId}
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* PERFORMANCE TAB */}
        <TabsContent value="performance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Performance Metrics</CardTitle>
            </CardHeader>
            <CardContent>
              {performance.length === 0 ? (
                <p className="text-gray-500">No performance metrics found</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {performance.map((metric: PerformanceMetric) => (
                    <Card key={metric.id} className="bg-gradient-to-br from-blue-50 to-blue-100">
                      <CardContent className="pt-4">
                        <div className="space-y-3">
                          <p className="font-semibold">Staff {metric.staffId}</p>
                          <div className="grid grid-cols-2 gap-3">
                            <div className="bg-white p-2 rounded">
                              <p className="text-xs text-gray-600">Tasks</p>
                              <p className="text-lg font-bold text-blue-600">
                                {metric.tasksCompleted}
                              </p>
                            </div>
                            <div className="bg-white p-2 rounded">
                              <p className="text-xs text-gray-600">Tickets</p>
                              <p className="text-lg font-bold text-green-600">
                                {metric.ticketsResolved}
                              </p>
                            </div>
                            <div className="bg-white p-2 rounded">
                              <p className="text-xs text-gray-600">Response</p>
                              <p className="text-lg font-bold text-orange-600">
                                {metric.averageResponseTime}m
                              </p>
                            </div>
                            <div className="bg-white p-2 rounded">
                              <p className="text-xs text-gray-600">Satisfaction</p>
                              <p className="text-lg font-bold text-purple-600">
                                {metric.satisfactionScore}/5
                              </p>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
