"use server";

import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { writeAuditLog } from "@/lib/audit";
import { revalidatePath } from "next/cache";

interface ActionResponse<T = unknown> {
  success: boolean;
  error?: string;
  data?: T;
}

export interface LifecycleHistoryItem {
  id: string;
  oldStatus: string | null;
  newStatus: string;
  reason: string | null;
  date: Date;
  updatedBy: string;
}

/**
 * Update employee active lifecycle status.
 * Restricted to ADMIN accounts. Logs changes to the Audit trail and Lifecycle history.
 */
export async function updateEmployeeStatusAction(params: {
  targetUserId: string;
  newStatus: string;
  reason?: string;
}): Promise<ActionResponse> {
  try {
    const session = await getSession();
    if (!session || session.role !== "ADMIN") {
      return { success: false, error: "Access denied" };
    }

    const { targetUserId, newStatus, reason } = params;

    const userProfile = await db.user.findUnique({
      where: { id: targetUserId },
      include: { profile: true },
    });

    if (!userProfile) {
      return { success: false, error: "User not found" };
    }

    const oldStatus = userProfile.profile?.status || "Active";

    await db.$transaction(async (tx) => {
      // 1. Update Employee Profile status
      await tx.employeeProfile.update({
        where: { userId: targetUserId },
        data: { status: newStatus },
      });

      // 2. Write lifecycle event log
      await tx.lifecycleEvent.create({
        data: {
          userId: targetUserId,
          oldStatus,
          newStatus,
          reason: reason || "No reason specified",
          updatedBy: `${session.firstName} ${session.lastName}`,
        },
      });
    });

    writeAuditLog(
      "Employee Status Updated",
      session.id,
      `${session.firstName} ${session.lastName}`,
      targetUserId,
      `${userProfile.firstName} ${userProfile.lastName} (${oldStatus} -> ${newStatus})`
    );

    revalidatePath("/admin/employees");
    return { success: true };
  } catch (error) {
    console.error("Status update lifecycle error:", error);
    return { success: false, error: "Failed to update lifecycle status" };
  }
}

/**
 * Retrieve status change timeline history logs for a user.
 */
export async function getLifecycleHistoryAction(targetUserId: string): Promise<ActionResponse<LifecycleHistoryItem[]>> {
  try {
    const session = await getSession();
    if (!session) {
      return { success: false, error: "Unauthorized" };
    }

    const logs = await db.lifecycleEvent.findMany({
      where: { userId: targetUserId },
      orderBy: { date: "desc" },
    });

    return {
      success: true,
      data: logs.map((l) => ({
        id: l.id,
        oldStatus: l.oldStatus,
        newStatus: l.newStatus,
        reason: l.reason,
        date: l.date,
        updatedBy: l.updatedBy,
      })),
    };
  } catch (error) {
    console.error("Get lifecycle history error:", error);
    return { success: false, error: "Failed to load status logs history" };
  }
}
