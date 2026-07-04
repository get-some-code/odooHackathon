"use server";

import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { ApplyLeaveSchema, type ApplyLeaveInput } from "@/lib/validators";
import { revalidatePath } from "next/cache";

interface ActionResponse<T = unknown> {
  success: boolean;
  error?: string;
  data?: T;
}

export interface LeaveSummaryData {
  paidRemaining: number;
  sickRemaining: number;
  unpaidUsed: number;
  pendingCount: number;
  approvedCount: number;
  rejectedCount: number;
}

const BASE_PAID_LEAVES = 18;
const BASE_SICK_LEAVES = 12;

/**
 * Calculates duration in days. Handles half-day override.
 */
function calculateDaysDuration(start: Date, end: Date, halfDay: boolean): number {
  if (halfDay) return 0.5;
  const diffTime = Math.abs(end.getTime() - start.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
  return diffDays;
}

/**
 * Get leave balance statistics for the logged-in user.
 */
export async function getLeaveSummaryAction(): Promise<ActionResponse<LeaveSummaryData>> {
  try {
    const session = await getSession();
    if (!session) return { success: false, error: "Unauthorized" };

    const userId = session.id;
    const now = new Date();
    const currentYearStart = new Date(now.getFullYear(), 0, 1);

    // Fetch all requests for current year
    const requests = await db.leaveRequest.findMany({
      where: {
        userId,
        startDate: { gte: currentYearStart },
      },
    });

    let paidUsed = 0;
    let sickUsed = 0;
    let unpaidUsed = 0;

    let pendingCount = 0;
    let approvedCount = 0;
    let rejectedCount = 0;

    requests.forEach((req) => {
      const duration = calculateDaysDuration(req.startDate, req.endDate, req.reason.includes("[HALF_DAY]")); // halfDay determined dynamically or via duration helper

      // Update counters
      if (req.status === "PENDING") pendingCount++;
      else if (req.status === "APPROVED") approvedCount++;
      else if (req.status === "REJECTED") rejectedCount++;

      // Sum usage
      if (req.status === "APPROVED") {
        if (req.leaveType === "PAID") paidUsed += duration;
        else if (req.leaveType === "SICK") sickUsed += duration;
        else if (req.leaveType === "UNPAID") unpaidUsed += duration;
      }
    });

    return {
      success: true,
      data: {
        paidRemaining: Math.max(0, BASE_PAID_LEAVES - paidUsed),
        sickRemaining: Math.max(0, BASE_SICK_LEAVES - sickUsed),
        unpaidUsed,
        pendingCount,
        approvedCount,
        rejectedCount,
      },
    };
  } catch (error) {
    console.error("Failed to load leave summary:", error);
    return { success: false, error: "Internal server error" };
  }
}

/**
 * Apply for a leave request.
 */
export async function applyLeaveAction(input: ApplyLeaveInput): Promise<ActionResponse> {
  try {
    const session = await getSession();
    if (!session) return { success: false, error: "Unauthorized" };

    const userId = session.id;

    // 1. Zod Validation
    const validated = ApplyLeaveSchema.safeParse(input);
    if (!validated.success) {
      return {
        success: false,
        error: validated.error.errors[0]?.message || "Validation failed",
      };
    }

    const { leaveType, startDate, endDate, halfDay, reason, fileUrl } = validated.data;

    const start = new Date(startDate);
    const end = new Date(endDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Prevent past invalid dates (start date before today)
    if (start < today) {
      return { success: false, error: "Cannot apply for leaves in the past." };
    }

    // 2. Prevent Overlapping requests
    const overlapping = await db.leaveRequest.findFirst({
      where: {
        userId,
        status: { not: "REJECTED" },
        OR: [
          {
            // Case 1: Existing request starts within range
            startDate: { gte: start, lte: end },
          },
          {
            // Case 2: Existing request ends within range
            endDate: { gte: start, lte: end },
          },
          {
            // Case 3: Range falls completely inside existing request
            startDate: { lte: start },
            endDate: { gte: end },
          },
        ],
      },
    });

    if (overlapping) {
      return { success: false, error: "You already have a leave request overlapping this period." };
    }

    // 3. Exceeding Balance validation
    const duration = calculateDaysDuration(start, end, halfDay);
    const balanceRes = await getLeaveSummaryAction();
    if (!balanceRes.success || !balanceRes.data) {
      return { success: false, error: "Could not verify leave balances." };
    }

    const balances = balanceRes.data;
    if (leaveType === "PAID" && duration > balances.paidRemaining) {
      return { success: false, error: `Requested duration (${duration} days) exceeds Paid Leave balance (${balances.paidRemaining} days).` };
    }
    if (leaveType === "SICK" && duration > balances.sickRemaining) {
      return { success: false, error: `Requested duration (${duration} days) exceeds Sick Leave balance (${balances.sickRemaining} days).` };
    }

    // Append flag in reason if half day (since schema doesn't have half-day boolean)
    const finalReason = halfDay ? `[HALF_DAY] ${reason}` : reason;

    // 4. Create request
    const request = await db.leaveRequest.create({
      data: {
        userId,
        leaveType,
        startDate: start,
        endDate: end,
        reason: finalReason,
        adminComment: fileUrl, // Reuse adminComment field as file upload placeholder URL to avoid schema change
      },
    });

    revalidatePath("/leave");
    revalidatePath("/dashboard");
    return { success: true, data: request };
  } catch (error) {
    console.error("Apply leave error:", error);
    return { success: false, error: "Failed to submit leave request." };
  }
}

export interface LeaveHistoryItem {
  id: string;
  leaveType: string;
  startDate: Date;
  endDate: Date;
  duration: number;
  reason: string;
  status: string;
  appliedDate: Date;
  adminComment: string | null;
}

/**
 * Fetch leave history logs for the user.
 */
export async function getLeaveHistoryAction(params: {
  page?: number;
  limit?: number;
  status?: string;
  leaveType?: string;
  targetUserId?: string;
}): Promise<ActionResponse<{ items: LeaveHistoryItem[]; total: number }>> {
  try {
    const session = await getSession();
    if (!session) return { success: false, error: "Unauthorized" };

    const page = params.page || 1;
    const limit = params.limit || 5;
    const skip = (page - 1) * limit;

    const targetUserId = params.targetUserId || session.id;
    if (targetUserId !== session.id && session.role !== "ADMIN") {
      return { success: false, error: "Access denied" };
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const whereClause: any = { userId: targetUserId };

    if (params.status && params.status !== "ALL") {
      whereClause.status = params.status;
    }
    if (params.leaveType && params.leaveType !== "ALL") {
      whereClause.leaveType = params.leaveType;
    }

    const [requests, total] = await Promise.all([
      db.leaveRequest.findMany({
        where: whereClause,
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      db.leaveRequest.count({ where: whereClause }),
    ]);

    const formatted: LeaveHistoryItem[] = requests.map((r) => {
      const halfDay = r.reason.startsWith("[HALF_DAY]");
      const cleanReason = halfDay ? r.reason.replace("[HALF_DAY]", "").trim() : r.reason;

      return {
        id: r.id,
        leaveType: r.leaveType,
        startDate: r.startDate,
        endDate: r.endDate,
        duration: calculateDaysDuration(r.startDate, r.endDate, halfDay),
        reason: cleanReason,
        status: r.status,
        appliedDate: r.createdAt,
        adminComment: r.adminComment,
      };
    });

    return {
      success: true,
      data: { items: formatted, total },
    };
  } catch (error) {
    console.error("Get history error:", error);
    return { success: false, error: "Failed to load leave history logs." };
  }
}

export interface AdminLeaveRequestLog {
  id: string;
  leaveType: string;
  startDate: Date;
  endDate: Date;
  duration: number;
  reason: string;
  status: string;
  appliedDate: Date;
  adminComment: string | null;
  employeeName: string;
  employeeId: string;
  department: string;
  userId: string;
  email: string;
}

/**
 * Get all leave requests for admin review.
 */
export async function getAdminLeavesAction(params: {
  search?: string;
  department?: string;
  status?: string;
  leaveType?: string;
  page?: number;
  limit?: number;
}): Promise<ActionResponse<{ items: AdminLeaveRequestLog[]; total: number }>> {
  try {
    const session = await getSession();
    if (!session || session.role !== "ADMIN") {
      return { success: false, error: "Access denied" };
    }

    const page = params.page || 1;
    const limit = params.limit || 10;
    const skip = (page - 1) * limit;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const whereClause: any = { user: {} };

    if (params.search) {
      whereClause.user.OR = [
        { firstName: { contains: params.search } },
        { lastName: { contains: params.search } },
        { employeeId: { contains: params.search } },
      ];
    }
    if (params.department && params.department !== "ALL") {
      whereClause.user.profile = { department: params.department };
    }
    if (params.status && params.status !== "ALL") {
      whereClause.status = params.status;
    }
    if (params.leaveType && params.leaveType !== "ALL") {
      whereClause.leaveType = params.leaveType;
    }

    const [records, total] = await Promise.all([
      db.leaveRequest.findMany({
        where: whereClause,
        include: {
          user: { include: { profile: true } },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      db.leaveRequest.count({ where: whereClause }),
    ]);

    const formatted: AdminLeaveRequestLog[] = records.map((r) => {
      const halfDay = r.reason.startsWith("[HALF_DAY]");
      const cleanReason = halfDay ? r.reason.replace("[HALF_DAY]", "").trim() : r.reason;

      return {
        id: r.id,
        leaveType: r.leaveType,
        startDate: r.startDate,
        endDate: r.endDate,
        duration: calculateDaysDuration(r.startDate, r.endDate, halfDay),
        reason: cleanReason,
        status: r.status,
        appliedDate: r.createdAt,
        adminComment: r.adminComment,
        employeeName: `${r.user.firstName} ${r.user.lastName}`,
        employeeId: r.user.employeeId,
        department: r.user.profile?.department || "Unassigned",
        userId: r.user.id,
        email: r.user.email,
      };
    });

    return {
      success: true,
      data: { items: formatted, total },
    };
  } catch (error) {
    console.error("Admin get leaves error:", error);
    return { success: false, error: "Failed to load leave sheets." };
  }
}

/**
 * Approve or Reject a leave request.
 * Automatically synchronizes employee attendance table.
 */
export async function updateLeaveStatusAction(
  requestId: string,
  status: "APPROVED" | "REJECTED",
  comment?: string
): Promise<ActionResponse> {
  try {
    const session = await getSession();
    if (!session || session.role !== "ADMIN") {
      return { success: false, error: "Access denied" };
    }

    const request = await db.leaveRequest.findUnique({
      where: { id: requestId },
      include: { user: true },
    });

    if (!request) return { success: false, error: "Leave request not found" };

    const halfDay = request.reason.startsWith("[HALF_DAY]");

    // Update inside a safe database transaction
    await db.$transaction(async (tx) => {
      // 1. Update Request
      await tx.leaveRequest.update({
        where: { id: requestId },
        data: {
          status,
          adminComment: comment || null,
        },
      });

      // 2. Synchronize Attendance table if APPROVED
      if (status === "APPROVED") {
        const start = new Date(request.startDate);
        const end = new Date(request.endDate);

        // Generate all dates in duration
        const currentDate = new Date(start);
        while (currentDate <= end) {
          const targetDate = new Date(currentDate);
          targetDate.setHours(0, 0, 0, 0);

          if (halfDay) {
            // Half day settings
            await tx.attendance.upsert({
              where: {
                userId_date: { userId: request.userId, date: targetDate },
              },
              update: {
                status: "HALF_DAY",
              },
              create: {
                userId: request.userId,
                date: targetDate,
                status: "HALF_DAY",
              },
            });
          } else {
            // Full leave settings
            await tx.attendance.upsert({
              where: {
                userId_date: { userId: request.userId, date: targetDate },
              },
              update: {
                status: "LEAVE",
              },
              create: {
                userId: request.userId,
                date: targetDate,
                status: "LEAVE",
              },
            });
          }

          currentDate.setDate(currentDate.getDate() + 1);
        }
      } else {
        // If changing status back to REJECTED, delete/clean matching LEAVE attendance records
        const start = new Date(request.startDate);
        const end = new Date(request.endDate);

        const currentDate = new Date(start);
        while (currentDate <= end) {
          const targetDate = new Date(currentDate);
          targetDate.setHours(0, 0, 0, 0);

          // Clear records marked as LEAVE
          await tx.attendance.deleteMany({
            where: {
              userId: request.userId,
              date: targetDate,
              status: { in: ["LEAVE", "HALF_DAY"] },
            },
          });

          currentDate.setDate(currentDate.getDate() + 1);
        }
      }
    });

    revalidatePath("/leave");
    revalidatePath("/attendance");
    revalidatePath("/dashboard");
    return { success: true };
  } catch (error) {
    console.error("Update leave status error:", error);
    return { success: false, error: "Failed to update leave request status." };
  }
}

/**
 * Bulk Approve/Reject leave requests.
 */
export async function bulkUpdateLeaveStatusAction(
  requestIds: string[],
  status: "APPROVED" | "REJECTED",
  comment?: string
): Promise<ActionResponse> {
  try {
    const session = await getSession();
    if (!session || session.role !== "ADMIN") {
      return { success: false, error: "Access denied" };
    }

    for (const id of requestIds) {
      const res = await updateLeaveStatusAction(id, status, comment);
      if (!res.success) {
        throw new Error(res.error || "Failed to update individual record");
      }
    }

    return { success: true };
  } catch (error: unknown) {
    console.error("Bulk update leave error:", error);
    const errMsg = error instanceof Error ? error.message : "Failed to update batch of requests.";
    return { success: false, error: errMsg };
  }
}
