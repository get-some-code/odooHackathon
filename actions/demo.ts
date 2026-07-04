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
  {
    employeeId: "EMP107",
    email: "aarav@nexus.com",
    firstName: "Aarav",
    lastName: "Kumar",
    phone: "9876543207",
    address: "88, Indira Nagar, Bangalore, Karnataka",
    department: "Engineering",
    designation: "Frontend Architect",
    baseSalary: 110000,
    status: "Active",
    joiningDate: "2023-05-12",
  },
  {
    employeeId: "EMP108",
    email: "diya@nexus.com",
    firstName: "Diya",
    lastName: "Mishra",
    phone: "9876543208",
    address: "19, Saket, New Delhi",
    department: "Marketing",
    designation: "Content Producer",
    baseSalary: 42000,
    status: "Active",
    joiningDate: "2025-09-22",
  },
  {
    employeeId: "EMP109",
    email: "vihaan@nexus.com",
    firstName: "Vihaan",
    lastName: "Gupta",
    phone: "9876543209",
    address: "10, HSR Layout, Bangalore, Karnataka",
    department: "Engineering",
    designation: "DevOps Specialist",
    baseSalary: 75000,
    status: "Active",
    joiningDate: "2024-03-18",
  },
  {
    employeeId: "EMP110",
    email: "ananya@nexus.com",
    firstName: "Ananya",
    lastName: "Roy",
    phone: "9876543210",
    address: "71, Salt Lake, Kolkata, West Bengal",
    department: "HR",
    designation: "HR Generalist",
    baseSalary: 45000,
    status: "Active",
    joiningDate: "2024-10-05",
  },
  {
    employeeId: "EMP111",
    email: "arjun@nexus.com",
    firstName: "Arjun",
    lastName: "Prasad",
    phone: "9876543211",
    address: "2, Powai, Mumbai, Maharashtra",
    department: "Sales",
    designation: "Sales Executive",
    baseSalary: 37000,
    status: "Probation",
    joiningDate: "2026-05-01",
  },
  {
    employeeId: "EMP112",
    email: "avani@nexus.com",
    firstName: "Avani",
    lastName: "Shah",
    phone: "9876543212",
    address: "9, Satellite, Ahmedabad, Gujarat",
    department: "Finance",
    designation: "Accountant",
    baseSalary: 52000,
    status: "Active",
    joiningDate: "2024-02-14",
  },
  {
    employeeId: "EMP113",
    email: "sai@nexus.com",
    firstName: "Sai",
    lastName: "Nair",
    phone: "9876543213",
    address: "5, MG Road, Kochi, Kerala",
    department: "Engineering",
    designation: "Backend Developer",
    baseSalary: 68000,
    status: "Active",
    joiningDate: "2025-07-19",
  },
  {
    employeeId: "EMP114",
    email: "aanya@nexus.com",
    firstName: "Aanya",
    lastName: "Joshi",
    phone: "9876543214",
    address: "15, Deccan Gymkhana, Pune, Maharashtra",
    department: "Design",
    designation: "Product Designer",
    baseSalary: 58000,
    status: "Active",
    joiningDate: "2025-02-28",
  },
  {
    employeeId: "EMP115",
    email: "reyansh@nexus.com",
    firstName: "Reyansh",
    lastName: "Mehta",
    phone: "9876543215",
    address: "3, Civil Lines, Jaipur, Rajasthan",
    department: "Sales",
    designation: "Account Manager",
    baseSalary: 49000,
    status: "Active",
    joiningDate: "2024-08-11",
  },
  {
    employeeId: "EMP116",
    email: "saisha@nexus.com",
    firstName: "Saisha",
    lastName: "Bose",
    phone: "9876543216",
    address: "11, Gariahat, Kolkata, West Bengal",
    department: "Operations",
    designation: "Operations Manager",
    baseSalary: 82000,
    status: "Active",
    joiningDate: "2023-12-01",
  },
  {
    employeeId: "EMP117",
    email: "krishna@nexus.com",
    firstName: "Krishna",
    lastName: "Das",
    phone: "9876543217",
    address: "21, Whitefield, Bangalore, Karnataka",
    department: "Engineering",
    designation: "Full Stack Engineer",
    baseSalary: 72000,
    status: "Active",
    joiningDate: "2025-04-03",
  },
  {
    employeeId: "EMP118",
    email: "ira@nexus.com",
    firstName: "Ira",
    lastName: "Sen",
    phone: "9876543218",
    address: "32, Jodhpur Park, Kolkata, West Bengal",
    department: "Legal",
    designation: "Legal Counsel",
    baseSalary: 95000,
    status: "Active",
    joiningDate: "2024-06-20",
  },
  {
    employeeId: "EMP119",
    email: "ishaan@nexus.com",
    firstName: "Ishaan",
    lastName: "Rao",
    phone: "9876543219",
    address: "44, Jubilee Hills, Hyderabad, Telangana",
    department: "Finance",
    designation: "Financial Analyst",
    baseSalary: 64000,
    status: "Active",
    joiningDate: "2025-01-15",
  },
  {
    employeeId: "EMP120",
    email: "pihu@nexus.com",
    firstName: "Pihu",
    lastName: "Jain",
    phone: "9876543220",
    address: "14, C-Scheme, Jaipur, Rajasthan",
    department: "HR",
    designation: "Recruiting Coordinator",
    baseSalary: 32000,
    status: "Active",
    joiningDate: "2026-02-10",
  },
  {
    employeeId: "EMP121",
    email: "shaurya@nexus.com",
    firstName: "Shaurya",
    lastName: "Kumar",
    phone: "9876543221",
    address: "65, Koramangala, Bangalore, Karnataka",
    department: "Engineering",
    designation: "QA Automation Engineer",
    baseSalary: 50000,
    status: "Active",
    joiningDate: "2025-10-18",
  },
  {
    employeeId: "EMP122",
    email: "riya@nexus.com",
    firstName: "Riya",
    lastName: "Chawla",
    phone: "9876543222",
    address: "8, Rajouri Garden, New Delhi",
    department: "Marketing",
    designation: "SEO Lead",
    baseSalary: 51000,
    status: "Active",
    joiningDate: "2024-09-09",
  },
  {
    employeeId: "EMP123",
    email: "atharv@nexus.com",
    firstName: "Atharv",
    lastName: "Dutta",
    phone: "9876543223",
    address: "27, Salt Lake Sec 5, Kolkata",
    department: "Engineering",
    designation: "Systems Engineer",
    baseSalary: 63000,
    status: "Active",
    joiningDate: "2025-11-30",
  },
  {
    employeeId: "EMP124",
    email: "prisha@nexus.com",
    firstName: "Prisha",
    lastName: "Verma",
    phone: "9876543224",
    address: "99, Sector 62, Noida, Uttar Pradesh",
    department: "Design",
    designation: "Graphic Designer",
    baseSalary: 34000,
    status: "Active",
    joiningDate: "2026-03-01",
  },
  {
    employeeId: "EMP125",
    email: "kabir@nexus.com",
    firstName: "Kabir",
    lastName: "Malhotra",
    phone: "9876543225",
    address: "54, Bandra West, Mumbai, Maharashtra",
    department: "Sales",
    designation: "Business Director",
    baseSalary: 120000,
    status: "Active",
    joiningDate: "2023-01-20",
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
      for (let i = 0; i <= 14; i++) {
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
        
        let checkOut: Date | null = null;
        if (i > 0) {
          // Finished days get checkout times
          checkOut = new Date(date);
          checkOut.setHours(18, Math.floor(Math.random() * 15), 0, 0); // 18:00 - 18:15
        }

        // Introduce random absences or half days
        const randomChance = Math.random();
        if (emp.status === "On Leave" && i === 0) {
          status = "LEAVE";
          checkIn = null;
          checkOut = null;
        } else if (randomChance < 0.08) {
          status = "ABSENT";
          checkIn = null;
          checkOut = null;
        } else if (randomChance < 0.18) {
          status = "HALF_DAY";
          if (i > 0) {
            checkOut = new Date(date);
            checkOut.setHours(13, 30, 0, 0); // 13:30 Check out
          }
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
