"use server";

import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";

interface ActionResponse<T = unknown> {
  success: boolean;
  error?: string;
  data?: T;
}

const DEMO_EMPLOYEES = [
  {
    employeeId: "EMP101",
    email: "rohan@nexus.com",
    firstName: "Rohan",
    lastName: "Sharma",
    phone: "9876543201",
    address: "12, MG Road, Bangalore, Karnataka",
    department: "Engineering",
    designation: "Software Engineer",
    baseSalary: 45000,
    status: "Active",
    joiningDate: "2025-06-15",
  },
  {
    employeeId: "EMP102",
    email: "priya@nexus.com",
    firstName: "Priya",
    lastName: "Patel",
    phone: "9876543202",
    address: "45, Ring Road, Ahmedabad, Gujarat",
    department: "Design",
    designation: "Senior UI Designer",
    baseSalary: 60000,
    status: "Active",
    joiningDate: "2024-11-01",
  },
  {
    employeeId: "EMP103",
    email: "amit@nexus.com",
    firstName: "Amit",
    lastName: "Verma",
    phone: "9876543203",
    address: "78, Sector 15, Noida, Uttar Pradesh",
    department: "Marketing",
    designation: "Growth Manager",
    baseSalary: 40000,
    status: "Probation",
    joiningDate: "2026-04-10",
  },
  {
    employeeId: "EMP104",
    email: "sneha@nexus.com",
    firstName: "Sneha",
    lastName: "Reddy",
    phone: "9876543204",
    address: "102, Jubilee Hills, Hyderabad, Telangana",
    department: "Engineering",
    designation: "Lead QA Engineer",
    baseSalary: 55000,
    status: "On Leave",
    joiningDate: "2025-01-20",
  },
  {
    employeeId: "EMP105",
    email: "vikram@nexus.com",
    firstName: "Vikram",
    lastName: "Singh",
    phone: "9876543205",
    address: "24, Park Street, Kolkata, West Bengal",
    department: "Operations",
    designation: "Operations Associate",
    baseSalary: 35000,
    status: "Active",
    joiningDate: "2025-08-01",
  },
  {
    employeeId: "EMP106",
    email: "anjali@nexus.com",
    firstName: "Anjali",
    lastName: "Gupta",
    phone: "9876543206",
    address: "56, Linking Road, Mumbai, Maharashtra",
    department: "HR",
    designation: "Recruiter",
    baseSalary: 38000,
    status: "Active",
    joiningDate: "2025-03-05",
  },
];

const DEMO_HOLIDAYS = [
  { title: "Republic Day", date: "2026-01-26", category: "National", isOptional: false },
  { title: "Good Friday", date: "2026-04-03", category: "National", isOptional: false },
  { title: "Independence Day", date: "2026-08-15", category: "National", isOptional: false },
  { title: "Mahatma Gandhi Jayanti", date: "2026-10-02", category: "National", isOptional: false },
  { title: "Diwali", date: "2026-11-08", category: "Company", isOptional: false },
  { title: "Christmas Day", date: "2026-12-25", category: "National", isOptional: false },
  { title: "New Year's Eve Off", date: "2026-12-31", category: "Restricted", isOptional: true },
];

/**
 * Seed realistic HR data to showcase features instantly.
 */
export async function seedDemoDataAction(): Promise<ActionResponse> {
  try {
    const session = await getSession();
    if (!session || session.role !== "ADMIN") {
      return { success: false, error: "Access denied" };
    }

    const hashedDemoPassword = await bcrypt.hash("password123", 10);
    const today = new Date();

    // 1. Seed Holidays
    await db.holiday.deleteMany({});
    await db.holiday.createMany({
      data: DEMO_HOLIDAYS.map((h) => ({
        title: h.title,
        date: new Date(h.date),
        category: h.category,
        isOptional: h.isOptional,
        isRecurring: true,
      })),
    });

    // 2. Loop and Create Employees
    for (const emp of DEMO_EMPLOYEES) {
      // Avoid duplicate seeding if employee exists
      const existingUser = await db.user.findUnique({
        where: { email: emp.email },
      });
      if (existingUser) continue;

      const newUser = await db.user.create({
        data: {
          employeeId: emp.employeeId,
          email: emp.email,
          firstName: emp.firstName,
          lastName: emp.lastName,
          password: hashedDemoPassword,
          role: "EMPLOYEE",
          isVerified: true,
          profile: {
            create: {
              phone: emp.phone,
              address: emp.address,
              department: emp.department,
              designation: emp.designation,
              baseSalary: emp.baseSalary,
              status: emp.status,
              joiningDate: new Date(emp.joiningDate),
            },
          },
        },
      });

      // 3. Seed Attendance Logs for the past 14 days (excluding weekends)
      const attendanceData: {
        userId: string;
        date: Date;
        checkIn: Date | null;
        checkOut: Date | null;
        status: string;
      }[] = [];
      for (let i = 1; i <= 14; i++) {
        const date = new Date(today);
        date.setDate(today.getDate() - i);
        date.setHours(0, 0, 0, 0);

        // Skip Saturday (6) and Sunday (0)
        const dayOfWeek = date.getDay();
        if (dayOfWeek === 0 || dayOfWeek === 6) continue;

        // Set status
        let status = "PRESENT";
        let checkIn: Date | null = new Date(date);
        checkIn.setHours(9, Math.floor(Math.random() * 20), 0, 0); // 09:00 - 09:20
        let checkOut: Date | null = new Date(date);
        checkOut.setHours(18, Math.floor(Math.random() * 15), 0, 0); // 18:00 - 18:15

        // Introduce random absences or half days
        const randomChance = Math.random();
        if (randomChance < 0.05) {
          status = "ABSENT";
          checkIn = null;
          checkOut = null;
        } else if (randomChance < 0.12) {
          status = "HALF_DAY";
          checkOut = new Date(date);
          checkOut.setHours(13, 30, 0, 0); // 13:30 Check out
        }

        attendanceData.push({
          userId: newUser.id,
          date,
          checkIn,
          checkOut,
          status,
        });
      }

      await db.attendance.createMany({ data: attendanceData });

      // 4. Seed Leave Requests
      // Seed an approved leave request
      const startLeave = new Date();
      startLeave.setDate(today.getDate() + 3);
      const endLeave = new Date();
      endLeave.setDate(today.getDate() + 5);

      await db.leaveRequest.create({
        data: {
          userId: newUser.id,
          leaveType: "PAID",
          startDate: startLeave,
          endDate: endLeave,
          reason: "Family wedding event in my hometown",
          status: "APPROVED",
          adminComment: "Approved. Handover tasks before leaving.",
        },
      });

      // Seed a pending leave request for Sneha
      if (emp.firstName === "Sneha") {
        const startPen = new Date();
        startPen.setDate(today.getDate() + 10);
        const endPen = new Date();
        endPen.setDate(today.getDate() + 12);

        await db.leaveRequest.create({
          data: {
            userId: newUser.id,
            leaveType: "SICK",
            startDate: startPen,
            endDate: endPen,
            reason: "Doctor consultation and routine tests",
            status: "PENDING",
          },
        });
      }

      // 5. Seed Documents
      await db.document.create({
        data: {
          userId: newUser.id,
          name: `${emp.firstName}_Aadhaar_Card.pdf`,
          fileType: "Aadhaar",
          fileUrl: "/data/mock-documents/aadhaar.pdf",
          status: "VERIFIED",
          verifiedAt: new Date(),
        },
      });

      await db.document.create({
        data: {
          userId: newUser.id,
          name: `${emp.firstName}_PAN_Card.pdf`,
          fileType: "PAN",
          fileUrl: "/data/mock-documents/pan.pdf",
          status: emp.firstName === "Amit" ? "REJECTED" : "PENDING",
          adminComment: emp.firstName === "Amit" ? "Blurry upload, please scan details clearly" : null,
        },
      });

      // 6. Seed Payroll for previous month (June 2026 / Month 6)
      const basic = emp.baseSalary;
      const hra = basic * 0.4;
      const ma = 3000;
      const ta = 2000;
      const providentFund = basic * 0.12;
      const pt = 200;
      const tax = basic > 50000 ? basic * 0.1 : 0;
      const net = basic + hra + ma + ta - providentFund - pt - tax;

      await db.payroll.create({
        data: {
          userId: newUser.id,
          month: 6,
          year: 2026,
          basicSalary: basic,
          houseRentAllowance: hra,
          medicalAllowance: ma,
          travelAllowance: ta,
          allowances: hra + ma + ta,
          tax,
          providentFund,
          professionalTax: pt,
          deductions: providentFund + pt + tax,
          netSalary: net,
          paymentStatus: "PAID",
        },
      });

      // 7. Seed Lifecycle Events
      if (emp.status === "Active") {
        await db.lifecycleEvent.create({
          data: {
            userId: newUser.id,
            oldStatus: "Probation",
            newStatus: "Active",
            reason: "Completed probation periods review performance review",
            updatedBy: "Admin Principal",
          },
        });
      }
    }

    revalidatePath("/admin/dashboard");
    revalidatePath("/admin/employees");
    return { success: true };
  } catch (error) {
    console.error("Demo seed error:", error);
    return { success: false, error: "Failed to seed demo HR datasets." };
  }
}

/**
 * Remove all demo employees, logs, leave sheets, and payroll records.
 * Keeps the main admin user accounts intact.
 */
export async function resetDemoDataAction(): Promise<ActionResponse> {
  try {
    const session = await getSession();
    if (!session || session.role !== "ADMIN") {
      return { success: false, error: "Access denied" };
    }

    // Delete all users whose role is EMPLOYEE
    // onDelete: Cascade handles cleaning profiles, attendances, leave requests, payrolls, documents, and lifecycle history automatically!
    await db.user.deleteMany({
      where: { role: "EMPLOYEE" },
    });

    // Clear holidays
    await db.holiday.deleteMany({});

    revalidatePath("/admin/dashboard");
    revalidatePath("/admin/employees");
    return { success: true };
  } catch (error) {
    console.error("Demo reset error:", error);
    return { success: false, error: "Failed to reset demo databases." };
  }
}
