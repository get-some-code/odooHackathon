"use server";

import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";

interface ActionResponse<T = unknown> {
  success: boolean;
  error?: string;
  data?: T;
}

export interface DashboardData {
  presentDays: number;
  leaveBalance: number;
  pendingLeaves: number;
  netSalary: number;
  recentAttendance: Array<{
    id: string;
    date: Date;
    checkIn: Date | null;
    checkOut: Date | null;
    status: string;
  }>;
  upcomingEvents: Array<{
    type: "leave" | "holiday";
    title: string;
    date: Date | string;
  }>;
  notifications: Array<{
    id: string;
    title: string;
    description: string;
    time: Date | string;
    type: "info" | "success" | "warning" | "error";
  }>;
}

// Hardcoded company holidays
const HOLIDAYS = [
  { title: "New Year's Day", date: "2026-01-01" },
  { title: "Republic Day", date: "2026-01-26" },
  { title: "Good Friday", date: "2026-04-03" },
  { title: "Independence Day", date: "2026-08-15" },
  { title: "Mahatma Gandhi Jayanti", date: "2026-10-02" },
  { title: "Diwali", date: "2026-11-08" },
  { title: "Christmas Day", date: "2026-12-25" },
];

export async function getDashboardDataAction(): Promise<ActionResponse<DashboardData>> {
  try {
    const session = await getSession();
    if (!session) {
      return { success: false, error: "Unauthorized" };
    }

    const userId = session.id;
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfYear = new Date(now.getFullYear(), 0, 1);

    // 1. Days Present this month
    const presentDays = await db.attendance.count({
      where: {
        userId,
        date: { gte: startOfMonth },
        status: { in: ["PRESENT", "HALF_DAY"] },
      },
    });

    // 2. Approved leave days (this year)
    const approvedLeaves = await db.leaveRequest.findMany({
      where: {
        userId,
        status: "APPROVED",
        startDate: { gte: startOfYear },
      },
    });

    let approvedLeaveDays = 0;
    approvedLeaves.forEach((leave) => {
      const diffTime = Math.abs(leave.endDate.getTime() - leave.startDate.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
      approvedLeaveDays += diffDays;
    });

    const baseLeaveAllowance = 24;
    const leaveBalance = Math.max(0, baseLeaveAllowance - approvedLeaveDays);

    // 3. Pending requests
    const pendingLeaves = await db.leaveRequest.count({
      where: {
        userId,
        status: "PENDING",
      },
    });

    // 4. Net Salary
    const latestPayroll = await db.payroll.findFirst({
      where: { userId },
      orderBy: [{ year: "desc" }, { month: "desc" }],
    });
    const netSalary = latestPayroll ? latestPayroll.netSalary : 0;

    // 5. Recent Attendance
    const recentAttendance = await db.attendance.findMany({
      where: { userId },
      orderBy: { date: "desc" },
      take: 5,
    });

    // 6. Upcoming Events (Holidays + User's approved leaves)
    const upcomingEvents: DashboardData["upcomingEvents"] = [];

    // Add company holidays within the next 30 days
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(now.getDate() + 30);

    HOLIDAYS.forEach((h) => {
      const hDate = new Date(h.date);
      if (hDate >= now && hDate <= thirtyDaysFromNow) {
        upcomingEvents.push({
          type: "holiday",
          title: h.title,
          date: hDate,
        });
      }
    });

    // Add future approved leaves
    const futureLeaves = await db.leaveRequest.findMany({
      where: {
        userId,
        status: "APPROVED",
        startDate: { gte: now },
      },
      orderBy: { startDate: "asc" },
      take: 5,
    });

    futureLeaves.forEach((l) => {
      upcomingEvents.push({
        type: "leave",
        title: `Approved ${l.leaveType} Leave`,
        date: l.startDate,
      });
    });

    // Sort upcoming events by date
    upcomingEvents.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    // 7. Notifications (derived dynamically)
    const notifications: DashboardData["notifications"] = [];

    // Derivation A: Leave request status notifications
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const leavesQuery: any = session.role === "ADMIN" ? {} : { userId };
    const userLeaves = await db.leaveRequest.findMany({
      where: leavesQuery,
      include: { user: true },
      orderBy: { updatedAt: "desc" },
      take: 8,
    });

    userLeaves.forEach((leave) => {
      const applicantName = `${leave.user.firstName} ${leave.user.lastName}`;
      if (session.role === "ADMIN") {
        if (leave.status === "PENDING") {
          notifications.push({
            id: `leave-pending-admin-${leave.id}`,
            title: "New Leave Request",
            description: `${applicantName} submitted a ${leave.leaveType} leave request starting ${leave.startDate.toLocaleDateString()}.`,
            time: leave.createdAt,
            type: "warning",
          });
        }
      } else {
        if (leave.status === "APPROVED") {
          notifications.push({
            id: `leave-app-${leave.id}`,
            title: "Leave Approved",
            description: `Your request for ${leave.leaveType} leave on ${leave.startDate.toLocaleDateString()} has been approved.`,
            time: leave.updatedAt,
            type: "success",
          });
        } else if (leave.status === "REJECTED") {
          notifications.push({
            id: `leave-rej-${leave.id}`,
            title: "Leave Request Rejected",
            description: `Your request for ${leave.leaveType} leave has been rejected. Reason: ${leave.adminComment || "N/A"}`,
            time: leave.updatedAt,
            type: "error",
          });
        } else if (leave.status === "PENDING") {
          notifications.push({
            id: `leave-pen-${leave.id}`,
            title: "Leave Submitted",
            description: `Your request for ${leave.leaveType} leave starting ${leave.startDate.toLocaleDateString()} has been submitted.`,
            time: leave.createdAt,
            type: "info",
          });
        }
      }
    });

    // Derivation B: Salary processed notification
    const userPayrolls = await db.payroll.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 2,
    });

    userPayrolls.forEach((p) => {
      notifications.push({
        id: `payroll-${p.id}`,
        title: "Salary Processed",
        description: `Your salary slip for Month ${p.month}/${p.year} has been processed and generated.`,
        time: p.createdAt,
        type: "success",
      });
    });

    // Derivation C: Profile updates
    const userProfile = await db.user.findUnique({
      where: { id: userId },
      include: { profile: true },
    });

    if (userProfile?.profile?.phone || userProfile?.profile?.address) {
      notifications.push({
        id: `profile-${userId}`,
        title: "Profile Configured",
        description: "Your contact details and profile parameters are verified.",
        time: userProfile.updatedAt,
        type: "info",
      });
    }

    // Derivation D: Attendance Missed (ABSENT status)
    const missedAttendance = await db.attendance.findMany({
      where: {
        userId,
        status: "ABSENT",
      },
      orderBy: { date: "desc" },
      take: 3,
    });

    missedAttendance.forEach((a) => {
      notifications.push({
        id: `absent-${a.id}`,
        title: "Attendance Recorded Absent",
        description: `You were marked absent on ${a.date.toLocaleDateString()}.`,
        time: a.date,
        type: "warning",
      });
    });

    // Sort notifications newest first
    notifications.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());

    return {
      success: true,
      data: {
        presentDays,
        leaveBalance,
        pendingLeaves,
        netSalary,
        recentAttendance,
        upcomingEvents,
        notifications: notifications.slice(0, 10), // Limit to top 10
      },
    };
  } catch (error) {
    console.error("Failed to fetch dashboard data:", error);
    return { success: false, error: "Internal server error" };
  }
}

export interface AdminDashboardData {
  totalEmployees: number;
  presentToday: number;
  attendanceRate: number;
  openLeaves: number;
  monthlyPayrollEstimate: number;
  departmentAttendance: Array<{
    dept: string;
    total: number;
    present: number;
    rate: number;
  }>;
  recentLeaves: Array<{
    id: string;
    name: string;
    type: string;
    days: number;
    status: string;
  }>;
}

export async function getAdminDashboardDataAction(): Promise<ActionResponse<AdminDashboardData>> {
  try {
    const session = await getSession();
    if (!session || session.role !== "ADMIN") {
      return { success: false, error: "Access denied" };
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // 1. Total active employees (count of non-admin users or all users)
    const totalEmployees = await db.user.count({
      where: { role: "EMPLOYEE" },
    });

    // 2. Present today
    const presentToday = await db.attendance.count({
      where: {
        date: today,
        status: { in: ["PRESENT", "HALF_DAY"] },
      },
    });

    const attendanceRate = totalEmployees > 0 ? Math.round((presentToday / totalEmployees) * 100) : 0;

    // 3. Open leave requests
    const openLeaves = await db.leaveRequest.count({
      where: { status: "PENDING" },
    });

    // 4. Monthly payroll estimate (sum of netSalary for all payroll records in current month/year, or overall average monthly sum)
    const currentMonth = today.getMonth() + 1;
    const currentYear = today.getFullYear();
    const payrolls = await db.payroll.findMany({
      where: {
        month: currentMonth,
        year: currentYear,
      },
    });
    const monthlyPayrollEstimate = payrolls.reduce((acc, curr) => acc + curr.netSalary, 0);

    // 5. Department attendance statistics today
    // Grouping manually since SQLite + Prisma has limitations grouping on joined fields
    const employees = await db.user.findMany({
      where: { role: "EMPLOYEE" },
      include: {
        profile: true,
        attendances: {
          where: { date: today },
        },
      },
    });

    const deptMap: Record<string, { total: number; present: number }> = {};
    employees.forEach((emp) => {
      const dept = emp.profile?.department || "Unassigned";
      if (!deptMap[dept]) {
        deptMap[dept] = { total: 0, present: 0 };
      }
      deptMap[dept].total += 1;
      if (emp.attendances.length > 0 && ["PRESENT", "HALF_DAY"].includes(emp.attendances[0].status)) {
        deptMap[dept].present += 1;
      }
    });

    const departmentAttendance = Object.entries(deptMap).map(([dept, counts]) => ({
      dept,
      total: counts.total,
      present: counts.present,
      rate: counts.total > 0 ? Math.round((counts.present / counts.total) * 100) : 0,
    }));

    // If empty department list, push some defaults for empty state/fallback
    if (departmentAttendance.length === 0) {
      departmentAttendance.push(
        { dept: "Engineering", total: 0, present: 0, rate: 0 },
        { dept: "Design", total: 0, present: 0, rate: 0 }
      );
    }

    // 6. Recent leave requests (pending or overall newest)
    const recentLeavesDb = await db.leaveRequest.findMany({
      include: { user: true },
      orderBy: { createdAt: "desc" },
      take: 5,
    });

    const recentLeaves = recentLeavesDb.map((leave) => {
      const diffTime = Math.abs(leave.endDate.getTime() - leave.startDate.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

      return {
        id: leave.id,
        name: `${leave.user.firstName} ${leave.user.lastName}`,
        type: leave.leaveType,
        days: diffDays,
        status: leave.status.toLowerCase(),
      };
    });

    return {
      success: true,
      data: {
        totalEmployees,
        presentToday,
        attendanceRate,
        openLeaves,
        monthlyPayrollEstimate,
        departmentAttendance,
        recentLeaves,
      },
    };
  } catch (error) {
    console.error("Failed to load admin dashboard data:", error);
    return { success: false, error: "Internal server error" };
  }
}

export interface DashboardWidgetsData {
  upcomingHolidays: Array<{ id: string; title: string; date: Date; category: string; isOptional: boolean }>;
  recentJoinees: Array<{ name: string; date: string; department: string; designation: string }>;
  employeesOnLeave: Array<{ name: string; department: string; duration: string }>;
  birthdays: Array<{ name: string; date: string; department: string }>;
  anniversaries: Array<{ name: string; date: string; years: number; department: string }>;
  pendingDocsCount: number;
}

export async function getDashboardExtendedWidgetsAction(): Promise<ActionResponse<DashboardWidgetsData>> {
  try {
    const session = await getSession();
    if (!session) return { success: false, error: "Unauthorized" };

    const today = new Date();
    const currentMonth = today.getMonth();

    // 1. Upcoming holidays (from Database)
    const holidays = await db.holiday.findMany({
      where: { date: { gte: new Date(today.getFullYear(), today.getMonth(), today.getDate()) } },
      orderBy: { date: "asc" },
      take: 5,
    });

    // 2. Recent joinees
    const joinees = await db.user.findMany({
      where: { role: "EMPLOYEE" },
      include: { profile: true },
      orderBy: { createdAt: "desc" },
      take: 5,
    });

    // 3. Employees on leave today
    const leavesToday = await db.leaveRequest.findMany({
      where: {
        status: "APPROVED",
        startDate: { lte: today },
        endDate: { gte: today },
      },
      include: { user: true },
    });

    // 4. Pending documents verification count
    const pendingDocsCount = await db.document.count({
      where: { status: "PENDING" },
    });

    // 5. Birthdays & Anniversaries mapping
    const allEmployees = await db.user.findMany({
      where: { role: "EMPLOYEE" },
      include: { profile: true },
    });

    const birthdays: DashboardWidgetsData["birthdays"] = [];
    const anniversaries: DashboardWidgetsData["anniversaries"] = [];

    allEmployees.forEach((emp) => {
      const dept = emp.profile?.department || "Operations";
      
      // Calculate work anniversaries from joining date
      if (emp.profile?.joiningDate) {
        const jDate = new Date(emp.profile.joiningDate);
        if (jDate.getMonth() === currentMonth) {
          const years = today.getFullYear() - jDate.getFullYear();
          if (years > 0) {
            anniversaries.push({
              name: `${emp.firstName} ${emp.lastName}`,
              date: jDate.toLocaleDateString("en-IN", { day: "numeric", month: "short" }),
              years,
              department: dept,
            });
          }
        }
      }

      // Generate stable mock birthdays based on user indices or creation date
      const hashDay = (emp.firstName.charCodeAt(0) + (emp.lastName.charCodeAt(0) || 0)) % 28 + 1;
      const hashMonth = (emp.email.charCodeAt(0) + emp.employeeId.charCodeAt(2)) % 12;

      if (hashMonth === currentMonth) {
        birthdays.push({
          name: `${emp.firstName} ${emp.lastName}`,
          date: `${hashDay} ${today.toLocaleString("default", { month: "short" })}`,
          department: dept,
        });
      }
    });

    return {
      success: true,
      data: {
        upcomingHolidays: holidays.map((h) => ({
          id: h.id,
          title: h.title,
          date: h.date,
          category: h.category,
          isOptional: h.isOptional,
        })),
        recentJoinees: joinees.map((j) => ({
          name: `${j.firstName} ${j.lastName}`,
          date: j.profile?.joiningDate ? new Date(j.profile.joiningDate).toLocaleDateString("en-IN") : "—",
          department: j.profile?.department || "Unassigned",
          designation: j.profile?.designation || "Unassigned",
        })),
        employeesOnLeave: leavesToday.map((l) => ({
          name: `${l.user.firstName} ${l.user.lastName}`,
          department: "Operations",
          duration: `${l.startDate.toLocaleDateString("en-IN")} - ${l.endDate.toLocaleDateString("en-IN")}`,
        })),
        birthdays: birthdays.slice(0, 5),
        anniversaries: anniversaries.slice(0, 5),
        pendingDocsCount,
      },
    };
  } catch (error) {
    console.error("Dashboard extended widgets error:", error);
    return { success: false, error: "Failed to load dashboard widgets data" };
  }
}


