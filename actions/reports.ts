"use server";

import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";

interface ActionResponse<T = unknown> {
  success: boolean;
  error?: string;
  data?: T;
}

export interface EmployeeReportRow {
  employeeId: string;
  fullName: string;
  email: string;
  department: string;
  designation: string;
  joiningDate: string;
  status: string;
}

export interface DocumentReportRow {
  employeeId: string;
  employeeName: string;
  fileName: string;
  fileType: string;
  status: string;
  adminComment: string | null;
  uploadedAt: string;
}

export interface LifecycleReportRow {
  employeeId: string;
  employeeName: string;
  oldStatus: string | null;
  newStatus: string;
  reason: string | null;
  date: string;
  updatedBy: string;
}

export interface HRMSReportsData {
  employees: EmployeeReportRow[];
  documents: DocumentReportRow[];
  lifecycle: LifecycleReportRow[];
}

/**
 * Fetch all report lists for consolidated administrative audits.
 * Restricted to ADMIN accounts.
 */
export async function getHRMSReportsAction(): Promise<ActionResponse<HRMSReportsData>> {
  try {
    const session = await getSession();
    if (!session || session.role !== "ADMIN") {
      return { success: false, error: "Access denied" };
    }

    const [users, docs, events] = await Promise.all([
      db.user.findMany({
        where: { role: "EMPLOYEE" },
        include: { profile: true },
        orderBy: { createdAt: "desc" },
      }),
      db.document.findMany({
        include: { user: true },
        orderBy: { uploadedAt: "desc" },
      }),
      db.lifecycleEvent.findMany({
        include: { user: true },
        orderBy: { date: "desc" },
      }),
    ]);

    return {
      success: true,
      data: {
        employees: users.map((u) => ({
          employeeId: u.employeeId,
          fullName: `${u.firstName} ${u.lastName}`,
          email: u.email,
          department: u.profile?.department || "Unassigned",
          designation: u.profile?.designation || "Unassigned",
          joiningDate: u.profile?.joiningDate ? new Date(u.profile.joiningDate).toLocaleDateString("en-IN") : "—",
          status: u.profile?.status || "Active",
        })),
        documents: docs.map((d) => ({
          employeeId: d.user.employeeId,
          employeeName: `${d.user.firstName} ${d.user.lastName}`,
          fileName: d.name,
          fileType: d.fileType,
          status: d.status,
          adminComment: d.adminComment,
          uploadedAt: new Date(d.uploadedAt).toLocaleDateString("en-IN"),
        })),
        lifecycle: events.map((e) => ({
          employeeId: e.user.employeeId,
          employeeName: `${e.user.firstName} ${e.user.lastName}`,
          oldStatus: e.oldStatus,
          newStatus: e.newStatus,
          reason: e.reason,
          date: new Date(e.date).toLocaleDateString("en-IN"),
          updatedBy: e.updatedBy,
        })),
      },
    };
  } catch (error) {
    console.error("Get HRMS reports action error:", error);
    return { success: false, error: "Failed to load audit reports data" };
  }
}
