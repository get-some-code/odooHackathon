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

export interface PayrollBreakdown {
  basicSalary: number;
  houseRentAllowance: number;
  medicalAllowance: number;
  travelAllowance: number;
  otherAllowances: number;
  tax: number;
  providentFund: number;
  professionalTax: number;
  otherDeductions: number;
  bonus: number;
  netSalary: number;
  allowances: number;
  deductions: number;
}

export interface EmployeePayrollProfile {
  userId: string;
  fullName: string;
  employeeId: string;
  email: string;
  department: string;
  designation: string;
  baseSalary: number;
  latestPayslip: (PayrollBreakdown & { id: string; month: number; year: number; paymentStatus: string; createdAt: Date }) | null;
  history: Array<{
    id: string;
    month: number;
    year: number;
    basicSalary: number;
    allowances: number;
    deductions: number;
    bonus: number;
    netSalary: number;
    paymentStatus: string;
    createdAt: Date;
  }>;
}

/**
 * Fetch payroll profile and history for an employee.
 */
export async function getEmployeePayrollAction(
  targetUserId?: string
): Promise<ActionResponse<EmployeePayrollProfile>> {
  try {
    const session = await getSession();
    if (!session) {
      return { success: false, error: "Unauthorized" };
    }

    // Guard: Only admins can query other users
    const userId = (session.role === "ADMIN" && targetUserId) ? targetUserId : session.id;

    const user = await db.user.findUnique({
      where: { id: userId },
      include: {
        profile: true,
        payrolls: {
          orderBy: [{ year: "desc" }, { month: "desc" }],
        },
      },
    });

    if (!user) {
      return { success: false, error: "Employee profile not found" };
    }

    const baseSalary = user.profile?.baseSalary ?? 35000;
    const history = user.payrolls.map((p) => ({
      id: p.id,
      month: p.month,
      year: p.year,
      basicSalary: p.basicSalary,
      allowances: p.allowances,
      deductions: p.deductions,
      bonus: p.bonus,
      netSalary: p.netSalary,
      paymentStatus: p.paymentStatus,
      createdAt: p.createdAt,
    }));

    const latestDb = user.payrolls[0] || null;
    let latestPayslip = null;

    if (latestDb) {
      latestPayslip = {
        id: latestDb.id,
        month: latestDb.month,
        year: latestDb.year,
        basicSalary: latestDb.basicSalary,
        houseRentAllowance: latestDb.houseRentAllowance,
        medicalAllowance: latestDb.medicalAllowance,
        travelAllowance: latestDb.travelAllowance,
        otherAllowances: latestDb.otherAllowances,
        tax: latestDb.tax,
        providentFund: latestDb.providentFund,
        professionalTax: latestDb.professionalTax,
        otherDeductions: latestDb.otherDeductions,
        bonus: latestDb.bonus,
        netSalary: latestDb.netSalary,
        allowances: latestDb.allowances,
        deductions: latestDb.deductions,
        paymentStatus: latestDb.paymentStatus,
        createdAt: latestDb.createdAt,
      };
    }

    return {
      success: true,
      data: {
        userId: user.id,
        fullName: `${user.firstName} ${user.lastName}`,
        employeeId: user.employeeId,
        email: user.email,
        department: user.profile?.department || "Unassigned",
        designation: user.profile?.designation || "Unassigned",
        baseSalary,
        latestPayslip,
        history,
      },
    };
  } catch (error) {
    console.error("Fetch payroll error:", error);
    return { success: false, error: "Failed to load payroll details." };
  }
}

export interface AdminPayrollDashboardData {
  totalPayrollCost: number;
  employeesPaid: number;
  pendingPayroll: number;
  averageSalary: number;
  highestSalary: number;
  lowestSalary: number;
  departmentSalaryDistribution: Array<{ department: string; amount: number }>;
  monthlyPayrollTrend: Array<{ month: string; amount: number }>;
  salaryDistribution: Array<{ label: string; count: number }>;
}

/**
 * Compile analytics metrics for the Admin Payroll Dashboard.
 */
export async function getAdminPayrollDashboardAction(): Promise<ActionResponse<AdminPayrollDashboardData>> {
  try {
    const session = await getSession();
    if (!session || session.role !== "ADMIN") {
      return { success: false, error: "Access denied" };
    }

    const today = new Date();
    const currentMonth = today.getMonth() + 1;
    const currentYear = today.getFullYear();

    // 1. Current month processing status
    const currentMonthPayrolls = await db.payroll.findMany({
      where: { month: currentMonth, year: currentYear },
    });

    const totalPayrollCost = currentMonthPayrolls.reduce((sum, p) => sum + p.netSalary, 0);
    const employeesPaid = currentMonthPayrolls.filter((p) => p.paymentStatus === "PAID").length;
    
    const totalEmployees = await db.user.count({ where: { role: "EMPLOYEE", isVerified: true } });
    const pendingPayroll = Math.max(0, totalEmployees - employeesPaid);

    // 2. Averages across all time
    const allPayrolls = await db.payroll.findMany();
    let averageSalary = 0;
    let highestSalary = 0;
    let lowestSalary = 0;

    if (allPayrolls.length > 0) {
      const totalNet = allPayrolls.reduce((sum, p) => sum + p.netSalary, 0);
      averageSalary = Math.round(totalNet / allPayrolls.length);
      highestSalary = Math.max(...allPayrolls.map((p) => p.netSalary));
      lowestSalary = Math.min(...allPayrolls.map((p) => p.netSalary));
    }

    // 3. Department distribution (Join manual group)
    const employees = await db.user.findMany({
      where: { role: "EMPLOYEE" },
      include: { profile: true, payrolls: { where: { month: currentMonth, year: currentYear } } },
    });

    const deptMap: Record<string, number> = {};
    employees.forEach((emp) => {
      const dept = emp.profile?.department || "Unassigned";
      const salary = emp.payrolls[0]?.netSalary ?? 0;
      deptMap[dept] = (deptMap[dept] || 0) + salary;
    });

    const departmentSalaryDistribution = Object.entries(deptMap).map(([department, amount]) => ({
      department,
      amount,
    }));

    if (departmentSalaryDistribution.length === 0) {
      departmentSalaryDistribution.push(
        { department: "Engineering", amount: 0 },
        { department: "Design", amount: 0 },
        { department: "Marketing", amount: 0 }
      );
    }

    // 4. Monthly trend for the current year
    const monthlyTrendMap: Record<number, number> = {};
    const yearPayrolls = await db.payroll.findMany({
      where: { year: currentYear },
    });

    yearPayrolls.forEach((p) => {
      monthlyTrendMap[p.month] = (monthlyTrendMap[p.month] || 0) + p.netSalary;
    });

    const monthLabels = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const monthlyPayrollTrend = monthLabels.map((label, idx) => ({
      month: label,
      amount: monthlyTrendMap[idx + 1] ?? 0,
    }));

    // 5. Salary Distribution buckets
    let under30k = 0;
    let range30to50k = 0;
    let range50to80k = 0;
    let above80k = 0;

    allPayrolls.forEach((p) => {
      if (p.netSalary < 30000) under30k++;
      else if (p.netSalary < 50000) range30to50k++;
      else if (p.netSalary < 80000) range50to80k++;
      else above80k++;
    });

    const salaryDistribution = [
      { label: "< ₹30K", count: under30k },
      { label: "₹30K - ₹50K", count: range30to50k },
      { label: "₹50K - ₹80K", count: range50to80k },
      { label: "₹80K+", count: above80k },
    ];

    return {
      success: true,
      data: {
        totalPayrollCost,
        employeesPaid,
        pendingPayroll,
        averageSalary,
        highestSalary,
        lowestSalary,
        departmentSalaryDistribution,
        monthlyPayrollTrend,
        salaryDistribution,
      },
    };
  } catch (error) {
    console.error("Dashboard analytics error:", error);
    return { success: false, error: "Failed to compile payroll statistics." };
  }
}

export interface AdminPayrollTableItem {
  id: string;
  userId: string;
  fullName: string;
  employeeId: string;
  email: string;
  department: string;
  designation: string;
  month: number;
  year: number;
  basicSalary: number;
  allowances: number;
  deductions: number;
  bonus: number;
  netSalary: number;
  paymentStatus: string;
  createdAt: Date;
  houseRentAllowance: number;
  medicalAllowance: number;
  travelAllowance: number;
  otherAllowances: number;
  tax: number;
  providentFund: number;
  professionalTax: number;
  otherDeductions: number;
}

/**
 * Query payroll logs in database with filters & pagination.
 */
export async function getAdminPayrollTableAction(params: {
  search?: string;
  department?: string;
  month?: number;
  year?: number;
  page?: number;
  limit?: number;
}): Promise<ActionResponse<{ items: AdminPayrollTableItem[]; total: number }>> {
  try {
    const session = await getSession();
    if (!session || session.role !== "ADMIN") {
      return { success: false, error: "Access denied" };
    }

    const page = params.page || 1;
    const limit = params.limit || 10;
    const skip = (page - 1) * limit;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const whereClause: any = {};

    if (params.month) whereClause.month = params.month;
    if (params.year) whereClause.year = params.year;

    if (params.search || params.department) {
      whereClause.user = {};
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
    }

    const [payrolls, total] = await Promise.all([
      db.payroll.findMany({
        where: whereClause,
        include: {
          user: {
            include: { profile: true },
          },
        },
        orderBy: [{ year: "desc" }, { month: "desc" }, { createdAt: "desc" }],
        skip,
        take: limit,
      }),
      db.payroll.count({ where: whereClause }),
    ]);

    const items: AdminPayrollTableItem[] = payrolls.map((p) => ({
      id: p.id,
      userId: p.userId,
      fullName: `${p.user.firstName} ${p.user.lastName}`,
      employeeId: p.user.employeeId,
      email: p.user.email,
      department: p.user.profile?.department || "Unassigned",
      designation: p.user.profile?.designation || "Unassigned",
      month: p.month,
      year: p.year,
      basicSalary: p.basicSalary,
      allowances: p.allowances,
      deductions: p.deductions,
      bonus: p.bonus,
      netSalary: p.netSalary,
      paymentStatus: p.paymentStatus,
      createdAt: p.createdAt,
      houseRentAllowance: p.houseRentAllowance,
      medicalAllowance: p.medicalAllowance,
      travelAllowance: p.travelAllowance,
      otherAllowances: p.otherAllowances,
      tax: p.tax,
      providentFund: p.providentFund,
      professionalTax: p.professionalTax,
      otherDeductions: p.otherDeductions,
    }));

    return { success: true, data: { items, total } };
  } catch (error) {
    console.error("Fetch admin payroll error:", error);
    return { success: false, error: "Failed to search payroll directory." };
  }
}

/**
 * Create or update a payroll slip for an employee.
 */
export async function createOrUpdatePayrollAction(params: {
  userId: string;
  month: number;
  year: number;
  basicSalary: number;
  houseRentAllowance: number;
  medicalAllowance: number;
  travelAllowance: number;
  otherAllowances: number;
  tax: number;
  providentFund: number;
  professionalTax: number;
  otherDeductions: number;
  bonus: number;
  paymentStatus: string;
}): Promise<ActionResponse> {
  try {
    const session = await getSession();
    if (!session || session.role !== "ADMIN") {
      return { success: false, error: "Access denied" };
    }

    const totalAllowances =
      Number(params.houseRentAllowance) +
      Number(params.medicalAllowance) +
      Number(params.travelAllowance) +
      Number(params.otherAllowances);

    const totalDeductions =
      Number(params.tax) +
      Number(params.providentFund) +
      Number(params.professionalTax) +
      Number(params.otherDeductions);

    const netSalary =
      Number(params.basicSalary) +
      totalAllowances +
      Number(params.bonus) -
      totalDeductions;

    // Check transaction safety
    const record = await db.$transaction(async (tx) => {
      // Find user
      const user = await tx.user.findUnique({ where: { id: params.userId } });
      if (!user) throw new Error("Employee not found");

      // Check if entry already exists
      const existing = await tx.payroll.findFirst({
        where: { userId: params.userId, month: params.month, year: params.year },
      });

      if (existing) {
        return tx.payroll.update({
          where: { id: existing.id },
          data: {
            basicSalary: Number(params.basicSalary),
            allowances: totalAllowances,
            deductions: totalDeductions,
            netSalary,
            houseRentAllowance: Number(params.houseRentAllowance),
            medicalAllowance: Number(params.medicalAllowance),
            travelAllowance: Number(params.travelAllowance),
            otherAllowances: Number(params.otherAllowances),
            tax: Number(params.tax),
            providentFund: Number(params.providentFund),
            professionalTax: Number(params.professionalTax),
            otherDeductions: Number(params.otherDeductions),
            bonus: Number(params.bonus),
            paymentStatus: params.paymentStatus,
          },
        });
      } else {
        return tx.payroll.create({
          data: {
            userId: params.userId,
            month: params.month,
            year: params.year,
            basicSalary: Number(params.basicSalary),
            allowances: totalAllowances,
            deductions: totalDeductions,
            netSalary,
            houseRentAllowance: Number(params.houseRentAllowance),
            medicalAllowance: Number(params.medicalAllowance),
            travelAllowance: Number(params.travelAllowance),
            otherAllowances: Number(params.otherAllowances),
            tax: Number(params.tax),
            providentFund: Number(params.providentFund),
            professionalTax: Number(params.professionalTax),
            otherDeductions: Number(params.otherDeductions),
            bonus: Number(params.bonus),
            paymentStatus: params.paymentStatus,
          },
        });
      }
    });

    const targetUser = await db.user.findUnique({ where: { id: params.userId } });
    const targetName = targetUser ? `${targetUser.firstName} ${targetUser.lastName}` : "Employee";

    writeAuditLog(
      "Payroll Generated",
      session.id,
      `${session.firstName} ${session.lastName}`,
      params.userId,
      `Salary generated for ${targetName} for ${params.month}/${params.year} (Net: ₹${netSalary})`
    );

    revalidatePath("/payroll");
    revalidatePath("/admin/payroll");
    return { success: true, data: record.id };
  } catch (error: unknown) {
    console.error("Generate payroll error:", error);
    const msg = error instanceof Error ? error.message : "Generate payroll failed";
    return { success: false, error: msg };
  }
}

/**
 * Bulk generate/process payroll for all active employees for a given month and year.
 */
export async function processMonthlyPayrollAction(
  month: number,
  year: number
): Promise<ActionResponse<number>> {
  try {
    const session = await getSession();
    if (!session || session.role !== "ADMIN") {
      return { success: false, error: "Access denied" };
    }

    const activeEmployees = await db.user.findMany({
      where: { role: "EMPLOYEE", isVerified: true },
      include: { profile: true },
    });

    let processedCount = 0;

    await db.$transaction(async (tx) => {
      for (const emp of activeEmployees) {
        // Check if already processed
        const existing = await tx.payroll.findFirst({
          where: { userId: emp.id, month, year },
        });

        if (existing) continue; // Skip already generated records

        const baseSalary = emp.profile?.baseSalary ?? 35000;

        // Auto-calculate components:
        // HRA = 40%, Medical = 10%, Travel = 5%, Other = 5%
        // PF = 12%, Tax = 10%, Prof Tax = 200, Other Deduct = 0
        const basic = Math.round(baseSalary * 0.5); // Basic is 50% of package
        const hra = Math.round(baseSalary * 0.2);
        const med = Math.round(baseSalary * 0.1);
        const travel = Math.round(baseSalary * 0.1);
        const otherAllow = Math.round(baseSalary * 0.1);

        const tax = Math.round(baseSalary * 0.1);
        const pf = Math.round(baseSalary * 0.12);
        const profTax = 200;
        const otherDeduct = 0;
        const bonus = 0;

        const totalAllowances = hra + med + travel + otherAllow;
        const totalDeductions = tax + pf + profTax + otherDeduct;
        const netSalary = basic + totalAllowances + bonus - totalDeductions;

        await tx.payroll.create({
          data: {
            userId: emp.id,
            month,
            year,
            basicSalary: basic,
            allowances: totalAllowances,
            deductions: totalDeductions,
            netSalary,
            houseRentAllowance: hra,
            medicalAllowance: med,
            travelAllowance: travel,
            otherAllowances: otherAllow,
            tax,
            providentFund: pf,
            professionalTax: profTax,
            otherDeductions: otherDeduct,
            bonus,
            paymentStatus: "PENDING",
          },
        });

        processedCount++;
      }
    });

    writeAuditLog(
      "Monthly Payroll Complete",
      session.id,
      `${session.firstName} ${session.lastName}`,
      undefined,
      `Processed payroll for ${processedCount} employees for month ${month}/${year}`
    );

    revalidatePath("/payroll");
    revalidatePath("/admin/payroll");
    return { success: true, data: processedCount };
  } catch (error) {
    console.error("Bulk payroll process error:", error);
    return { success: false, error: "Failed to execute monthly payroll bulk generation." };
  }
}

/**
 * Delete a payroll record.
 */
export async function deletePayrollAction(id: string): Promise<ActionResponse> {
  try {
    const session = await getSession();
    if (!session || session.role !== "ADMIN") {
      return { success: false, error: "Access denied" };
    }

    const record = await db.payroll.delete({ where: { id } });

    writeAuditLog(
      "Payroll Deleted",
      session.id,
      `${session.firstName} ${session.lastName}`,
      record.userId,
      `Salary record for month ${record.month}/${record.year} deleted`
    );

    revalidatePath("/payroll");
    revalidatePath("/admin/payroll");
    return { success: true };
  } catch {
    return { success: false, error: "Failed to delete payroll record" };
  }
}

/**
 * Update payment status for a payroll record.
 */
export async function updatePayrollPaymentStatusAction(
  id: string,
  status: string
): Promise<ActionResponse> {
  try {
    const session = await getSession();
    if (!session || session.role !== "ADMIN") {
      return { success: false, error: "Access denied" };
    }

    const record = await db.payroll.update({
      where: { id },
      data: { paymentStatus: status },
    });

    writeAuditLog(
      "Salary Updated",
      session.id,
      `${session.firstName} ${session.lastName}`,
      record.userId,
      `Payment status for month ${record.month}/${record.year} updated to ${status}`
    );

    revalidatePath("/payroll");
    revalidatePath("/admin/payroll");
    return { success: true };
  } catch {
    return { success: false, error: "Failed to update payment status" };
  }
}
