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

export interface CompanySettingsData {
  companyName: string;
  logoUrl: string | null;
  address: string | null;
  workingHours: number;
  officeTiming: string;
  weeklyOff: string;
  timezone: string;
  currency: string;
  financialYear: string;
}

export interface HolidayItem {
  id: string;
  title: string;
  date: Date;
  isOptional: boolean;
  isRecurring: boolean;
  category: string;
}

/**
 * Fetch company settings.
 * Returns default details if no db record is created yet.
 */
export async function getCompanySettingsAction(): Promise<ActionResponse<CompanySettingsData>> {
  try {
    const settings = await db.companySettings.findUnique({
      where: { id: "company-settings" },
    });

    const defaultData: CompanySettingsData = {
      companyName: settings?.companyName ?? "Nexus Enterprise",
      logoUrl: settings?.logoUrl ?? null,
      address: settings?.address ?? "Corporate HQ, Outer Ring Road, Bangalore",
      workingHours: settings?.workingHours ?? 8.0,
      officeTiming: settings?.officeTiming ?? "09:00 - 18:00",
      weeklyOff: settings?.weeklyOff ?? "Saturday, Sunday",
      timezone: settings?.timezone ?? "UTC+05:30",
      currency: settings?.currency ?? "INR",
      financialYear: settings?.financialYear ?? "2026-2027",
    };

    return { success: true, data: defaultData };
  } catch (error) {
    console.error("Get company settings error:", error);
    return { success: false, error: "Failed to load company settings" };
  }
}

/**
 * Save or update company settings.
 * Restricted to ADMIN accounts.
 */
export async function updateCompanySettingsAction(data: CompanySettingsData): Promise<ActionResponse> {
  try {
    const session = await getSession();
    if (!session || session.role !== "ADMIN") {
      return { success: false, error: "Access denied" };
    }

    await db.companySettings.upsert({
      where: { id: "company-settings" },
      update: {
        companyName: data.companyName,
        logoUrl: data.logoUrl,
        address: data.address,
        workingHours: data.workingHours,
        officeTiming: data.officeTiming,
        weeklyOff: data.weeklyOff,
        timezone: data.timezone,
        currency: data.currency,
        financialYear: data.financialYear,
      },
      create: {
        id: "company-settings",
        companyName: data.companyName,
        logoUrl: data.logoUrl,
        address: data.address,
        workingHours: data.workingHours,
        officeTiming: data.officeTiming,
        weeklyOff: data.weeklyOff,
        timezone: data.timezone,
        currency: data.currency,
        financialYear: data.financialYear,
      },
    });

    writeAuditLog(
      "Settings Updated",
      session.id,
      `${session.firstName} ${session.lastName}`,
      undefined,
      `Company parameters: ${data.companyName}`
    );

    revalidatePath("/admin/settings");
    return { success: true };
  } catch (error) {
    console.error("Save company settings error:", error);
    return { success: false, error: "Failed to update company settings" };
  }
}

/**
 * Retrieve all company holidays.
 */
export async function getHolidaysAction(): Promise<ActionResponse<HolidayItem[]>> {
  try {
    const list = await db.holiday.findMany({
      orderBy: { date: "asc" },
    });

    return {
      success: true,
      data: list.map((h) => ({
        id: h.id,
        title: h.title,
        date: h.date,
        isOptional: h.isOptional,
        isRecurring: h.isRecurring,
        category: h.category,
      })),
    };
  } catch (error) {
    console.error("Get holidays error:", error);
    return { success: false, error: "Failed to retrieve holiday listings" };
  }
}

/**
 * Create or Update a company holiday entry.
 * Restricted to ADMIN accounts.
 */
export async function createOrUpdateHolidayAction(params: {
  id?: string;
  title: string;
  date: string;
  isOptional: boolean;
  isRecurring: boolean;
  category: string;
}): Promise<ActionResponse> {
  try {
    const session = await getSession();
    if (!session || session.role !== "ADMIN") {
      return { success: false, error: "Access denied" };
    }

    const { id, title, date, isOptional, isRecurring, category } = params;
    const parsedDate = new Date(date);

    if (id) {
      await db.holiday.update({
        where: { id },
        data: {
          title,
          date: parsedDate,
          isOptional,
          isRecurring,
          category,
        },
      });
      writeAuditLog(
        "Holiday Updated",
        session.id,
        `${session.firstName} ${session.lastName}`,
        undefined,
        `Title: ${title} (${date})`
      );
    } else {
      await db.holiday.create({
        data: {
          title,
          date: parsedDate,
          isOptional,
          isRecurring,
          category,
        },
      });
      writeAuditLog(
        "Holiday Created",
        session.id,
        `${session.firstName} ${session.lastName}`,
        undefined,
        `Title: ${title} (${date})`
      );
    }

    revalidatePath("/admin/settings");
    return { success: true };
  } catch (error) {
    console.error("Save holiday error:", error);
    return { success: false, error: "Failed to save holiday entry" };
  }
}

/**
 * Delete a company holiday entry.
 * Restricted to ADMIN accounts.
 */
export async function deleteHolidayAction(id: string): Promise<ActionResponse> {
  try {
    const session = await getSession();
    if (!session || session.role !== "ADMIN") {
      return { success: false, error: "Access denied" };
    }

    const item = await db.holiday.delete({
      where: { id },
    });

    writeAuditLog(
      "Holiday Deleted",
      session.id,
      `${session.firstName} ${session.lastName}`,
      undefined,
      `Title: ${item.title}`
    );

    revalidatePath("/admin/settings");
    return { success: true };
  } catch (error) {
    console.error("Delete holiday error:", error);
    return { success: false, error: "Failed to delete holiday entry" };
  }
}
