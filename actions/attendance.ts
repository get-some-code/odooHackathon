"use server";

import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { revalidatePath } from "next/cache";

interface ActionResponse<T = unknown> {
  success: boolean;
  error?: string;
  data?: T;
}

export interface AttendanceHistoryItem {
  id: string;
  date: Date;
  checkIn: Date | null;
  checkOut: Date | null;
  status: string;
  workingHours: string;
  isLate: boolean;
}

// Today at local midnight utility
function getTodayMidnight() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

/**
 * Perform daily check-in.
 */
export async function checkInAction(): Promise<ActionResponse> {
  try {
    const session = await getSession();
    if (!session) return { success: false, error: "Unauthorized" };

    const userId = session.id;
    const today = getTodayMidnight();
    const now = new Date();

    // Check if check-in already exists for today
    const existing = await db.attendance.findUnique({
      where: {
        userId_date: { userId, date: today },
      },
    });

    if (existing && existing.checkIn) {
      return { success: false, error: "You have already checked in for today." };
    }

    if (existing) {
      await db.attendance.update({
        where: { id: existing.id },
        data: {
          checkIn: now,
          status: "PRESENT",
        },
      });
    } else {
      await db.attendance.create({
        data: {
          userId,
          date: today,
          checkIn: now,
          status: "PRESENT",
        },
      });
    }

    revalidatePath("/attendance");
    revalidatePath("/dashboard");
    return { success: true };
  } catch (error) {
    console.error("Check-in error:", error);
    return { success: false, error: "Failed to record check-in. Please try again." };
  }
}

/**
 * Perform daily check-out.
 */
export async function checkOutAction(): Promise<ActionResponse> {
  try {
    const session = await getSession();
    if (!session) return { success: false, error: "Unauthorized" };

    const userId = session.id;
    const today = getTodayMidnight();
    const now = new Date();

    const existing = await db.attendance.findUnique({
      where: {
        userId_date: { userId, date: today },
      },
    });

    if (!existing || !existing.checkIn) {
      return { success: false, error: "You must check in before checking out." };
    }

    if (existing.checkOut) {
      return { success: false, error: "You have already checked out for today." };
    }

    const checkInTime = existing.checkIn.getTime();
    const checkOutTime = now.getTime();
    const diffMs = checkOutTime - checkInTime;
    const diffHours = diffMs / (1000 * 60 * 60);

    // Dynamic status determination based on working hours:
    // >= 8 hours -> PRESENT, >= 4 hours -> HALF_DAY, < 4 hours -> ABSENT
    let finalStatus = "PRESENT";
    if (diffHours < 4) {
      finalStatus = "ABSENT";
    } else if (diffHours < 8) {
      finalStatus = "HALF_DAY";
    }

    await db.attendance.update({
      where: { id: existing.id },
      data: {
        checkOut: now,
        status: finalStatus,
      },
    });

    revalidatePath("/attendance");
    revalidatePath("/dashboard");
    return { success: true };
  } catch (error) {
    console.error("Check-out error:", error);
    return { success: false, error: "Failed to record check-out. Please try again." };
  }
}

/**
 * Get current day attendance status of logged-in user.
 */
export async function getTodayAttendanceStatusAction(): Promise<ActionResponse> {
  try {
    const session = await getSession();
    if (!session) return { success: false, error: "Unauthorized" };

    const today = getTodayMidnight();
    const record = await db.attendance.findUnique({
      where: {
        userId_date: { userId: session.id, date: today },
      },
    });

    return { success: true, data: record };
  } catch (error) {
    console.error("Get today status error:", error);
    return { success: false, error: "Internal server error" };
  }
}

/**
 * Helper to format working duration.
 */
function calculateWorkingDuration(inTime: Date | null, outTime: Date | null): string {
  if (!inTime) return "—";
  const end = outTime ? outTime.getTime() : Date.now();
  const diffMs = end - inTime.getTime();
  const mins = Math.floor(diffMs / (1000 * 60));
  const hrs = Math.floor(mins / 60);
  const remainingMins = mins % 60;
  return `${hrs}h ${remainingMins}m`;
}

/**
 * Fetch paginated attendance records for history views.
 */
export async function getAttendanceHistoryAction(params: {
  page?: number;
  limit?: number;
  startDate?: string;
  endDate?: string;
  status?: string;
  targetUserId?: string;
}): Promise<ActionResponse<{ items: AttendanceHistoryItem[]; total: number }>> {
  try {
    const session = await getSession();
    if (!session) return { success: false, error: "Unauthorized" };

    const page = params.page || 1;
    const limit = params.limit || 10;
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

    if (params.startDate || params.endDate) {
      whereClause.date = {};
      if (params.startDate) {
        whereClause.date.gte = new Date(params.startDate);
      }
      if (params.endDate) {
        // Extend to end of the day
        const end = new Date(params.endDate);
        end.setHours(23, 59, 59, 999);
        whereClause.date.lte = end;
      }
    }

    const [items, total] = await Promise.all([
      db.attendance.findMany({
        where: whereClause,
        orderBy: { date: "desc" },
        skip,
        take: limit,
      }),
      db.attendance.count({ where: whereClause }),
    ]);

    const formatted: AttendanceHistoryItem[] = items.map((a) => {
      // Determine if checked in late (after 09:30 AM)
      let isLate = false;
      if (a.checkIn) {
        const checkInHour = a.checkIn.getHours();
        const checkInMinute = a.checkIn.getMinutes();
        if (checkInHour > 9 || (checkInHour === 9 && checkInMinute > 30)) {
          isLate = true;
        }
      }

      return {
        id: a.id,
        date: a.date,
        checkIn: a.checkIn,
        checkOut: a.checkOut,
        status: a.status,
        workingHours: calculateWorkingDuration(a.checkIn, a.checkOut),
        isLate,
      };
    });

    return {
      success: true,
      data: { items: formatted, total },
    };
  } catch (error) {
    console.error("Get history error:", error);
    return { success: false, error: "Failed to fetch history logs." };
  }
}

/**
 * Fetch calendar view of attendance.
 */
export async function getMonthlyAttendanceAction(
  year: number,
  month: number
): Promise<ActionResponse<unknown>> {
  try {
    const session = await getSession();
    if (!session) return { success: false, error: "Unauthorized" };

    const startDate = new Date(year, month, 1);
    const endDate = new Date(year, month + 1, 0, 23, 59, 59, 999);

    const records = await db.attendance.findMany({
      where: {
        userId: session.id,
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
    });

    return { success: true, data: records };
  } catch (error) {
    console.error("Get monthly calendar records error:", error);
    return { success: false, error: "Internal server error" };
  }
}

export interface AdminAttendanceLog {
  id: string;
  date: Date;
  checkIn: Date | null;
  checkOut: Date | null;
  status: string;
  workingHours: string;
  employeeName: string;
  employeeId: string;
  department: string;
  isLate: boolean;
}

/**
 * Admin view of organization-wide attendance records.
 */
export async function getAdminAttendanceLogsAction(params: {
  search?: string;
  department?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}): Promise<ActionResponse<{ items: AdminAttendanceLog[]; total: number }>> {
  try {
    const session = await getSession();
    if (!session || session.role !== "ADMIN") {
      return { success: false, error: "Access denied" };
    }

    const page = params.page || 1;
    const limit = params.limit || 10;
    const skip = (page - 1) * limit;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const whereClause: any = {
      user: {},
    };

    if (params.search) {
      whereClause.user.OR = [
        { firstName: { contains: params.search } },
        { lastName: { contains: params.search } },
        { employeeId: { contains: params.search } },
      ];
    }

    if (params.department && params.department !== "ALL") {
      whereClause.user.profile = {
        department: params.department,
      };
    }

    if (params.status && params.status !== "ALL") {
      whereClause.status = params.status;
    }

    if (params.startDate || params.endDate) {
      whereClause.date = {};
      if (params.startDate) {
        whereClause.date.gte = new Date(params.startDate);
      }
      if (params.endDate) {
        const end = new Date(params.endDate);
        end.setHours(23, 59, 59, 999);
        whereClause.date.lte = end;
      }
    }

    const [records, total] = await Promise.all([
      db.attendance.findMany({
        where: whereClause,
        include: {
          user: {
            include: { profile: true },
          },
        },
        orderBy: { date: "desc" },
        skip,
        take: limit,
      }),
      db.attendance.count({ where: whereClause }),
    ]);

    const formatted: AdminAttendanceLog[] = records.map((r) => {
      let isLate = false;
      if (r.checkIn) {
        const checkInHour = r.checkIn.getHours();
        const checkInMinute = r.checkIn.getMinutes();
        if (checkInHour > 9 || (checkInHour === 9 && checkInMinute > 30)) {
          isLate = true;
        }
      }

      return {
        id: r.id,
        date: r.date,
        checkIn: r.checkIn,
        checkOut: r.checkOut,
        status: r.status,
        workingHours: calculateWorkingDuration(r.checkIn, r.checkOut),
        employeeName: `${r.user.firstName} ${r.user.lastName}`,
        employeeId: r.user.employeeId,
        department: r.user.profile?.department || "Unassigned",
        isLate,
      };
    });

    return {
      success: true,
      data: { items: formatted, total },
    };
  } catch (error) {
    console.error("Admin get attendance error:", error);
    return { success: false, error: "Failed to load logs" };
  }
}
