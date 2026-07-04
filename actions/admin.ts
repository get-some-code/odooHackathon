"use server";

import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import bcrypt from "bcryptjs";
import { writeAuditLog, getAuditLogs, type AuditLogEntry } from "@/lib/audit";
import {
  getDepartments,
  saveDepartments,
  getDesignations,
  saveDesignations,
} from "@/lib/department-designation";
import { revalidatePath } from "next/cache";

interface ActionResponse<T = unknown> {
  success: boolean;
  error?: string;
  data?: T;
}

export interface AdminDashboardStats {
  totalEmployees: number;
  activeEmployees: number;
  newEmployeesThisMonth: number;
  employeesOnLeave: number;
  presentToday: number;
  absentToday: number;
  pendingLeaves: number;
  payrollProcessed: number;
  departmentsCount: number;
  averageAttendanceRate: number;
}

/**
 * Fetch Admin Dashboard statistics.
 */
export async function getAdminDashboardStatsAction(): Promise<ActionResponse<AdminDashboardStats>> {
  try {
    const session = await getSession();
    if (!session || session.role !== "ADMIN") {
      return { success: false, error: "Access denied" };
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    // 1. Total & Active
    const totalEmployees = await db.user.count({ where: { role: "EMPLOYEE" } });
    const activeEmployees = await db.user.count({
      where: { role: "EMPLOYEE", isVerified: true },
    });

    // 2. New Employees this month
    const newEmployeesThisMonth = await db.user.count({
      where: { role: "EMPLOYEE", createdAt: { gte: startOfMonth } },
    });

    // 3. Employees on leave today
    const employeesOnLeave = await db.attendance.count({
      where: { date: today, status: "LEAVE" },
    });

    // 4. Present & Absent today
    const presentToday = await db.attendance.count({
      where: { date: today, status: { in: ["PRESENT", "HALF_DAY"] } },
    });
    const absentToday = await db.attendance.count({
      where: { date: today, status: "ABSENT" },
    });

    // 5. Pending leaves
    const pendingLeaves = await db.leaveRequest.count({
      where: { status: "PENDING" },
    });

    // 6. Payroll Processed count
    const payrollProcessed = await db.payroll.count({
      where: { month: today.getMonth() + 1, year: today.getFullYear() },
    });

    // 7. Distinct Departments
    const depts = getDepartments();
    const departmentsCount = depts.length;

    // 8. Average Attendance this month
    const totalAttendanceCount = await db.attendance.count({
      where: { date: { gte: startOfMonth } },
    });
    const presentAttendanceCount = await db.attendance.count({
      where: {
        date: { gte: startOfMonth },
        status: { in: ["PRESENT", "HALF_DAY"] },
      },
    });
    const averageAttendanceRate =
      totalAttendanceCount > 0
        ? Math.round((presentAttendanceCount / totalAttendanceCount) * 100)
        : 90; // fallback to 90% if no records yet

    return {
      success: true,
      data: {
        totalEmployees,
        activeEmployees,
        newEmployeesThisMonth,
        employeesOnLeave,
        presentToday,
        absentToday,
        pendingLeaves,
        payrollProcessed,
        departmentsCount,
        averageAttendanceRate,
      },
    };
  } catch (error) {
    console.error("Dashboard stats error:", error);
    return { success: false, error: "Internal server error" };
  }
}

export interface EmployeeDirectoryItem {
  id: string;
  employeeId: string;
  fullName: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  department: string;
  designation: string;
  joiningDate: Date | null;
  role: string;
  isVerified: boolean;
  attendancePresentCount: number;
  leavesCount: number;
  status?: string;
}

/**
 * Fetch employee records list with filters & pagination.
 */
export async function getEmployeesAction(params: {
  search?: string;
  department?: string;
  designation?: string;
  status?: string; // "ACTIVE", "INACTIVE"
  page?: number;
  limit?: number;
}): Promise<ActionResponse<{ items: EmployeeDirectoryItem[]; total: number }>> {
  try {
    const session = await getSession();
    if (!session || session.role !== "ADMIN") {
      return { success: false, error: "Access denied" };
    }

    const page = params.page || 1;
    const limit = params.limit || 10;
    const skip = (page - 1) * limit;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const whereClause: any = { role: "EMPLOYEE" };

    if (params.search) {
      whereClause.OR = [
        { firstName: { contains: params.search } },
        { lastName: { contains: params.search } },
        { employeeId: { contains: params.search } },
        { email: { contains: params.search } },
      ];
    }

    if (params.status) {
      if (params.status === "ACTIVE") whereClause.isVerified = true;
      else if (params.status === "INACTIVE") whereClause.isVerified = false;
    }

    if (params.department && params.department !== "ALL" || params.designation && params.designation !== "ALL") {
      whereClause.profile = {};
      if (params.department && params.department !== "ALL") {
        whereClause.profile.department = params.department;
      }
      if (params.designation && params.designation !== "ALL") {
        whereClause.profile.designation = params.designation;
      }
    }

    const [users, total] = await Promise.all([
      db.user.findMany({
        where: whereClause,
        include: {
          profile: true,
          _count: {
            select: {
              attendances: { where: { status: { in: ["PRESENT", "HALF_DAY"] } } },
              leaveRequests: { where: { status: "APPROVED" } },
            },
          },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      db.user.count({ where: whereClause }),
    ]);

    const items: EmployeeDirectoryItem[] = users.map((u) => ({
      id: u.id,
      employeeId: u.employeeId,
      fullName: `${u.firstName} ${u.lastName}`,
      firstName: u.firstName,
      lastName: u.lastName,
      email: u.email,
      phone: u.profile?.phone || "—",
      address: u.profile?.address || "—",
      department: u.profile?.department || "Unassigned",
      designation: u.profile?.designation || "Unassigned",
      joiningDate: u.profile?.joiningDate || null,
      role: u.role,
      isVerified: u.isVerified,
      attendancePresentCount: u._count.attendances,
      leavesCount: u._count.leaveRequests,
      status: u.profile?.status || "Active",
    }));

    return { success: true, data: { items, total } };
  } catch (error) {
    console.error("Fetch employees error:", error);
    return { success: false, error: "Failed to fetch workforce database." };
  }
}

/**
 * Create a new employee user & profile.
 */
export async function createEmployeeAction(params: {
  employeeId: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  phone?: string;
  address?: string;
  department?: string;
  designation?: string;
  joiningDate?: string;
}): Promise<ActionResponse> {
  try {
    const session = await getSession();
    if (!session || session.role !== "ADMIN") {
      return { success: false, error: "Access denied" };
    }

    // Default password as employee ID
    const defaultPasswordHash = await bcrypt.hash(params.employeeId, 12);

    const user = await db.$transaction(async (tx) => {
      // Check duplicate employee ID
      const existingId = await tx.user.findUnique({
        where: { employeeId: params.employeeId },
      });
      if (existingId) throw new Error("Employee ID already exists");

      const existingEmail = await tx.user.findUnique({
        where: { email: params.email },
      });
      if (existingEmail) throw new Error("Email address already exists");

      const newUser = await tx.user.create({
        data: {
          employeeId: params.employeeId,
          email: params.email,
          password: defaultPasswordHash,
          firstName: params.firstName,
          lastName: params.lastName,
          role: params.role,
          isVerified: true,
        },
      });

      await tx.employeeProfile.create({
        data: {
          userId: newUser.id,
          phone: params.phone || null,
          address: params.address || null,
          department: params.department || null,
          designation: params.designation || null,
          joiningDate: params.joiningDate ? new Date(params.joiningDate) : null,
        },
      });

      return newUser;
    });

    writeAuditLog(
      "Employee Created",
      session.id,
      `${session.firstName} ${session.lastName}`,
      user.id,
      `${user.firstName} ${user.lastName}`
    );

    revalidatePath("/admin/employees");
    return { success: true };
  } catch (error: unknown) {
    console.error("Create employee error:", error);
    const errMsg = error instanceof Error ? error.message : "Failed to create employee";
    return { success: false, error: errMsg };
  }
}

/**
 * Edit existing employee.
 */
export async function updateEmployeeAction(
  userId: string,
  params: {
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    address?: string;
    department?: string;
    designation?: string;
    joiningDate?: string;
    role: string;
  }
): Promise<ActionResponse> {
  try {
    const session = await getSession();
    if (!session || session.role !== "ADMIN") {
      return { success: false, error: "Access denied" };
    }

    const user = await db.$transaction(async (tx) => {
      const updatedUser = await tx.user.update({
        where: { id: userId },
        data: {
          firstName: params.firstName,
          lastName: params.lastName,
          email: params.email,
          role: params.role,
        },
      });

      await tx.employeeProfile.upsert({
        where: { userId },
        update: {
          phone: params.phone || null,
          address: params.address || null,
          department: params.department || null,
          designation: params.designation || null,
          joiningDate: params.joiningDate ? new Date(params.joiningDate) : null,
        },
        create: {
          userId,
          phone: params.phone || null,
          address: params.address || null,
          department: params.department || null,
          designation: params.designation || null,
          joiningDate: params.joiningDate ? new Date(params.joiningDate) : null,
        },
      });

      return updatedUser;
    });

    writeAuditLog(
      "Employee Updated",
      session.id,
      `${session.firstName} ${session.lastName}`,
      user.id,
      `${user.firstName} ${user.lastName}`
    );

    revalidatePath("/admin/employees");
    return { success: true };
  } catch (error: unknown) {
    console.error("Update employee error:", error);
    const errMsg = error instanceof Error ? error.message : "Failed to update employee details";
    return { success: false, error: errMsg };
  }
}

/**
 * Deactivate employee.
 */
export async function deactivateEmployeeAction(userId: string): Promise<ActionResponse> {
  try {
    const session = await getSession();
    if (!session || session.role !== "ADMIN") {
      return { success: false, error: "Access denied" };
    }

    const user = await db.user.update({
      where: { id: userId },
      data: { isVerified: false },
    });

    writeAuditLog(
      "Employee Inactivated",
      session.id,
      `${session.firstName} ${session.lastName}`,
      user.id,
      `${user.firstName} ${user.lastName}`
    );

    revalidatePath("/admin/employees");
    return { success: true };
  } catch {
    return { success: false, error: "Failed to deactivate employee" };
  }
}

/**
 * Activate employee.
 */
export async function activateEmployeeAction(userId: string): Promise<ActionResponse> {
  try {
    const session = await getSession();
    if (!session || session.role !== "ADMIN") {
      return { success: false, error: "Access denied" };
    }

    const user = await db.user.update({
      where: { id: userId },
      data: { isVerified: true },
    });

    writeAuditLog(
      "Employee Activated",
      session.id,
      `${session.firstName} ${session.lastName}`,
      user.id,
      `${user.firstName} ${user.lastName}`
    );

    revalidatePath("/admin/employees");
    return { success: true };
  } catch {
    return { success: false, error: "Failed to activate employee" };
  }
}

/**
 * Delete employee.
 */
export async function deleteEmployeeAction(userId: string): Promise<ActionResponse> {
  try {
    const session = await getSession();
    if (!session || session.role !== "ADMIN") {
      return { success: false, error: "Access denied" };
    }

    const user = await db.user.delete({
      where: { id: userId },
    });

    writeAuditLog(
      "Employee Deleted",
      session.id,
      `${session.firstName} ${session.lastName}`,
      userId,
      `${user.firstName} ${user.lastName}`
    );

    revalidatePath("/admin/employees");
    return { success: true };
  } catch {
    return { success: false, error: "Failed to delete employee" };
  }
}

/**
 * Reset password.
 */
export async function resetPasswordAction(userId: string): Promise<ActionResponse> {
  try {
    const session = await getSession();
    if (!session || session.role !== "ADMIN") {
      return { success: false, error: "Access denied" };
    }

    const user = await db.user.findUnique({ where: { id: userId } });
    if (!user) return { success: false, error: "Employee not found" };

    // Reset password back to employee ID hash
    const resetHash = await bcrypt.hash(user.employeeId, 12);
    await db.user.update({
      where: { id: userId },
      data: { password: resetHash },
    });

    writeAuditLog(
      "Password Reset",
      session.id,
      `${session.firstName} ${session.lastName}`,
      userId,
      `${user.firstName} ${user.lastName}`
    );

    return { success: true };
  } catch {
    return { success: false, error: "Failed to reset password" };
  }
}

/**
 * Change Role.
 */
export async function changeRoleAction(userId: string, role: string): Promise<ActionResponse> {
  try {
    const session = await getSession();
    if (!session || session.role !== "ADMIN") {
      return { success: false, error: "Access denied" };
    }

    const user = await db.user.update({
      where: { id: userId },
      data: { role },
    });

    writeAuditLog(
      "Role Changed",
      session.id,
      `${session.firstName} ${session.lastName}`,
      userId,
      `${user.firstName} ${user.lastName}`
    );

    revalidatePath("/admin/employees");
    return { success: true };
  } catch {
    return { success: false, error: "Failed to change role" };
  }
}

/**
 * Bulk Import Employees.
 */
export async function bulkImportEmployeesAction(
  rows: Array<{
    employeeId: string;
    email: string;
    firstName: string;
    lastName: string;
    department?: string;
    designation?: string;
    joiningDate?: string;
  }>
): Promise<ActionResponse> {
  try {
    const session = await getSession();
    if (!session || session.role !== "ADMIN") {
      return { success: false, error: "Access denied" };
    }

    let importedCount = 0;
    await db.$transaction(async (tx) => {
      for (const row of rows) {
        // Validate duplicates
        const existing = await tx.user.findFirst({
          where: { OR: [{ employeeId: row.employeeId }, { email: row.email }] },
        });

        if (existing) continue; // Skip duplicates silently or handle validation previews

        const hash = await bcrypt.hash(row.employeeId, 12);
        const newUser = await tx.user.create({
          data: {
            employeeId: row.employeeId,
            email: row.email,
            password: hash,
            firstName: row.firstName,
            lastName: row.lastName,
            role: "EMPLOYEE",
            isVerified: true,
          },
        });

        await tx.employeeProfile.create({
          data: {
            userId: newUser.id,
            department: row.department || null,
            designation: row.designation || null,
            joiningDate: row.joiningDate ? new Date(row.joiningDate) : null,
          },
        });

        importedCount++;
      }
    });

    writeAuditLog(
      "Bulk Import Employees",
      session.id,
      `${session.firstName} ${session.lastName}`,
      undefined,
      `${importedCount} rows imported`
    );

    revalidatePath("/admin/employees");
    return { success: true, data: importedCount };
  } catch (error: unknown) {
    console.error("Bulk import error:", error);
    const errMsg = error instanceof Error ? error.message : "Bulk import failed";
    return { success: false, error: errMsg };
  }
}

/**
 * Fetch paginated audit logs.
 */
export async function getAuditLogsAction(params: {
  page?: number;
  limit?: number;
}): Promise<ActionResponse<{ items: AuditLogEntry[]; total: number }>> {
  try {
    const session = await getSession();
    if (!session || session.role !== "ADMIN") {
      return { success: false, error: "Access denied" };
    }

    const page = params.page || 1;
    const limit = params.limit || 10;
    const skip = (page - 1) * limit;

    const logs = getAuditLogs();
    const sliced = logs.slice(skip, skip + limit);

    return { success: true, data: { items: sliced, total: logs.length } };
  } catch {
    return { success: false, error: "Failed to load audit logs" };
  }
}

export interface SearchResultItem {
  id: string;
  title: string;
  subtitle: string;
  category: "Employee" | "Department" | "Leave" | "Attendance" | "Payroll" | "Document";
  href: string;
}

/**
 * Enterprise Global Search across all models.
 */
export async function globalSearchAction(query: string): Promise<ActionResponse<SearchResultItem[]>> {
  try {
    const session = await getSession();
    if (!session) return { success: false, error: "Unauthorized" };

    if (!query || query.trim().length < 2) {
      return { success: true, data: [] };
    }

    const q = query.trim();
    const results: SearchResultItem[] = [];

    // 1. Search Users
    const users = await db.user.findMany({
      where: {
        OR: [
          { firstName: { contains: q } },
          { lastName: { contains: q } },
          { employeeId: { contains: q } },
          { email: { contains: q } },
        ],
      },
      include: { profile: true },
      take: 5,
    });
    users.forEach((u) => {
      results.push({
        id: `user-${u.id}`,
        title: `${u.firstName} ${u.lastName}`,
        subtitle: `ID: ${u.employeeId} · ${u.profile?.department || "Unassigned"}`,
        category: "Employee",
        href: u.role === "ADMIN" ? "/admin/dashboard" : `/admin/employees`, // Details open dynamically or go to path
      });
    });

    // 2. Search Leaves
    const leaves = await db.leaveRequest.findMany({
      where: {
        OR: [{ reason: { contains: q } }, { leaveType: { contains: q } }],
      },
      include: { user: true },
      take: 5,
    });
    leaves.forEach((l) => {
      results.push({
        id: `leave-${l.id}`,
        title: `${l.user.firstName} ${l.user.lastName} — ${l.leaveType} Leave`,
        subtitle: `Reason: ${l.reason} (${l.status})`,
        category: "Leave",
        href: session.role === "ADMIN" ? "/admin/leave" : "/leave",
      });
    });

    // 3. Search Documents
    const docs = await db.document.findMany({
      where: { name: { contains: q } },
      include: { user: true },
      take: 5,
    });
    docs.forEach((d) => {
      results.push({
        id: `doc-${d.id}`,
        title: d.name,
        subtitle: `Employee: ${d.user.firstName} ${d.user.lastName}`,
        category: "Document",
        href: d.fileUrl,
      });
    });

    // 3.5. Search Payrolls
    const payrolls = await db.payroll.findMany({
      where: {
        OR: [
          { user: { firstName: { contains: q } } },
          { user: { lastName: { contains: q } } },
          { user: { employeeId: { contains: q } } },
        ],
      },
      include: { user: true },
      take: 5,
    });
    payrolls.forEach((p) => {
      results.push({
        id: `payroll-${p.id}`,
        title: `${p.user.firstName} ${p.user.lastName} — Month ${p.month}/${p.year} Payroll`,
        subtitle: `Net Disbursed: ₹${p.netSalary.toLocaleString()} (${p.paymentStatus})`,
        category: "Payroll",
        href: session.role === "ADMIN" ? "/admin/payroll" : "/payroll",
      });
    });

    // 4. Search Departments (Unique list matching query)
    const depts = getDepartments().filter((d) => d.name.toLowerCase().includes(q.toLowerCase()));
    depts.forEach((d) => {
      results.push({
        id: `dept-${d.name}`,
        title: `${d.name} Department`,
        subtitle: `Manager: ${d.managerName || "Unassigned"}`,
        category: "Department",
        href: "/admin/departments",
      });
    });

    return { success: true, data: results };
  } catch (error) {
    console.error("Global search error:", error);
    return { success: false, error: "Global search query failed." };
  }
}

/**
 * Create a new department mapping.
 */
export async function createDepartmentAction(name: string, description: string, managerName: string): Promise<ActionResponse> {
  try {
    const session = await getSession();
    if (!session || session.role !== "ADMIN") return { success: false, error: "Access denied" };

    const depts = getDepartments();
    if (depts.find((d) => d.name.toLowerCase() === name.toLowerCase())) {
      return { success: false, error: "Department already exists" };
    }

    depts.push({
      name,
      description,
      managerName,
      createdAt: new Date().toISOString(),
    });
    saveDepartments(depts);

    writeAuditLog("Department Created", session.id, `${session.firstName} ${session.lastName}`, undefined, name);
    return { success: true };
  } catch {
    return { success: false, error: "Failed to create department" };
  }
}

/**
 * Delete a department.
 */
export async function deleteDepartmentAction(name: string): Promise<ActionResponse> {
  try {
    const session = await getSession();
    if (!session || session.role !== "ADMIN") return { success: false, error: "Access denied" };

    let depts = getDepartments();
    depts = depts.filter((d) => d.name !== name);
    saveDepartments(depts);

    writeAuditLog("Department Deleted", session.id, `${session.firstName} ${session.lastName}`, undefined, name);
    return { success: true };
  } catch {
    return { success: false, error: "Failed to delete department" };
  }
}

/**
 * Rename department.
 */
export async function renameDepartmentAction(oldName: string, newName: string, managerName: string): Promise<ActionResponse> {
  try {
    const session = await getSession();
    if (!session || session.role !== "ADMIN") return { success: false, error: "Access denied" };

    const depts = getDepartments();
    const dept = depts.find((d) => d.name === oldName);
    if (!dept) return { success: false, error: "Department not found" };

    dept.name = newName;
    dept.managerName = managerName;
    saveDepartments(depts);

    writeAuditLog(
      "Department Renamed",
      session.id,
      `${session.firstName} ${session.lastName}`,
      undefined,
      `${oldName} to ${newName}`
    );
    return { success: true };
  } catch {
    return { success: false, error: "Failed to rename department" };
  }
}

/**
 * Create job title / designation.
 */
export async function createDesignationAction(title: string, department: string, level: number): Promise<ActionResponse> {
  try {
    const session = await getSession();
    if (!session || session.role !== "ADMIN") return { success: false, error: "Access denied" };

    const titles = getDesignations();
    if (titles.find((t) => t.title.toLowerCase() === title.toLowerCase())) {
      return { success: false, error: "Designation title already exists" };
    }

    titles.push({ title, department, hierarchyLevel: level });
    saveDesignations(titles);

    writeAuditLog("Designation Created", session.id, `${session.firstName} ${session.lastName}`, undefined, title);
    return { success: true };
  } catch {
    return { success: false, error: "Failed to create job designation" };
  }
}

/**
 * Delete job designation.
 */
export async function deleteDesignationAction(title: string): Promise<ActionResponse> {
  try {
    const session = await getSession();
    if (!session || session.role !== "ADMIN") return { success: false, error: "Access denied" };

    let titles = getDesignations();
    titles = titles.filter((t) => t.title !== title);
    saveDesignations(titles);

    writeAuditLog("Designation Deleted", session.id, `${session.firstName} ${session.lastName}`, undefined, title);
    return { success: true };
  } catch {
    return { success: false, error: "Failed to delete job designation" };
  }
}

export async function getDepartmentStatsAction(): Promise<ActionResponse<Record<string, unknown>[]>> {
  try {
    const session = await getSession();
    if (!session) return { success: false, error: "Unauthorized" };

    const depts = getDepartments();
    const stats = await Promise.all(
      depts.map(async (d) => {
        const count = await db.employeeProfile.count({
          where: { department: d.name },
        });
        return {
          ...d,
          employeeCount: count,
        };
      })
    );

    return { success: true, data: stats };
  } catch {
    return { success: false, error: "Failed to load department statistics" };
  }
}

export async function getDesignationStatsAction(): Promise<ActionResponse<Record<string, unknown>[]>> {
  try {
    const session = await getSession();
    if (!session) return { success: false, error: "Unauthorized" };

    const titles = getDesignations();
    const stats = await Promise.all(
      titles.map(async (t) => {
        const count = await db.employeeProfile.count({
          where: { designation: t.title },
        });
        return {
          ...t,
          employeeCount: count,
        };
      })
    );

    return { success: true, data: stats };
  } catch {
    return { success: false, error: "Failed to load job designation statistics" };
  }
}

