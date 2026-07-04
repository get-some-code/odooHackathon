const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log("Starting DB seeding with 20 dummy employees...");

  // Clean old dummy records first
  await prisma.user.deleteMany({
    where: {
      email: {
        endsWith: "@hrms.com"
      }
    }
  });
  console.log("Cleaned up old @hrms.com dummy accounts.");

  const departments = ["Engineering", "Design", "Marketing", "Operations", "HR", "Sales", "Finance", "Legal"];
  const designations = {
    "Engineering": ["Frontend Developer", "Backend Developer", "Full Stack Engineer", "DevOps Engineer", "QA Engineer", "Engineering Manager"],
    "Design": ["UI/UX Designer", "Product Designer", "Graphic Designer"],
    "Marketing": ["Marketing Associate", "SEO Specialist", "Social Media Manager"],
    "Operations": ["Operations Manager", "Operations Associate"],
    "HR": ["HR Specialist", "Recruiter", "HR Generalist"],
    "Sales": ["Sales Account Manager", "Business Development Executive"],
    "Finance": ["Financial Analyst", "Accountant"],
    "Legal": ["Legal Counsel"]
  };

  const firstNames = [
    "Aarav", "Aditya", "Vihaan", "Arjun", "Sai", "Reyansh", "Krishna", "Ishaan", "Shaurya", "Atharv",
    "Diya", "Ananya", "Aadhya", "Pihu", "Avani", "Saisha", "Ira", "Riya", "Aanya", "Prisha"
  ];
  
  const lastNames = [
    "Sharma", "Verma", "Gupta", "Patel", "Mehta", "Singh", "Reddy", "Rao", "Joshi", "Mishra",
    "Kumar", "Prasad", "Nair", "Pillai", "Bose", "Das", "Sen", "Roy", "Jain", "Shah"
  ];

  const statuses = ["Active", "Active", "Active", "Active", "On Leave", "Probation", "Active"];

  const hashedPassword = await bcrypt.hash("password123", 10);

  // Generate 20 entries
  for (let i = 0; i < 20; i++) {
    const firstName = firstNames[i];
    const lastName = lastNames[i];
    const email = `${firstName.toLowerCase()}.${lastName.toLowerCase()}${i}@hrms.com`;
    const employeeId = `EMP${2026000 + i}`;
    const dept = departments[i % departments.length];
    const designList = designations[dept];
    const design = designList[i % designList.length];
    const phone = `+91 ${9876500000 + i}`;
    const address = `${10 + i}, MG Road, Sector ${i * 3 + 1}, Bangalore, Karnataka`;
    const status = statuses[i % statuses.length];
    
    // Salaries: range from 35,000 to 120,500
    const baseSalary = 35000 + (i * 4500);

    const user = await prisma.user.create({
      data: {
        employeeId,
        email,
        password: hashedPassword,
        firstName,
        lastName,
        role: "EMPLOYEE",
        isVerified: true,
        profile: {
          create: {
            phone,
            address,
            department: dept,
            designation: design,
            joiningDate: new Date(2023, i % 12, 1 + (i % 28)),
            baseSalary,
            status,
          }
        }
      }
    });

    console.log(`Created employee: ${firstName} ${lastName} (${employeeId}) - Dept: ${dept}`);

    // Create 3 attendance logs for each
    const today = new Date();
    for (let dayOffset = 0; dayOffset < 3; dayOffset++) {
      const logDate = new Date(today);
      logDate.setDate(today.getDate() - dayOffset);
      logDate.setHours(0, 0, 0, 0);

      const checkInTime = new Date(logDate);
      checkInTime.setHours(9, 0 + (i % 30), 0);
      
      const checkOutTime = new Date(logDate);
      checkOutTime.setHours(17, 30 + (i % 30), 0);

      const statusMap = ["PRESENT", "PRESENT", "HALF_DAY", "PRESENT"];
      const dayStatus = statusMap[(i + dayOffset) % statusMap.length];

      await prisma.attendance.create({
        data: {
          userId: user.id,
          date: logDate,
          checkIn: checkInTime,
          checkOut: dayStatus === "PRESENT" || dayStatus === "HALF_DAY" ? checkOutTime : null,
          status: dayStatus,
        }
      }).catch(() => {}); // Prevent duplicate attendance index errors
    }

    // Create 1 leave request for each
    const leaveStart = new Date(today);
    leaveStart.setDate(today.getDate() + 10 + i);
    const leaveEnd = new Date(leaveStart);
    leaveEnd.setDate(leaveStart.getDate() + 2);

    const leaveTypes = ["PAID", "SICK", "UNPAID"];
    const leaveStatus = ["PENDING", "APPROVED", "REJECTED"];

    await prisma.leaveRequest.create({
      data: {
        userId: user.id,
        leaveType: leaveTypes[i % leaveTypes.length],
        startDate: leaveStart,
        endDate: leaveEnd,
        reason: `Personal work / medical leave request number ${i}`,
        status: leaveStatus[i % leaveStatus.length],
      }
    });

    // Create 1 payroll log
    await prisma.payroll.create({
      data: {
        userId: user.id,
        month: 6,
        year: 2026,
        basicSalary: baseSalary,
        allowances: baseSalary * 0.2,
        deductions: baseSalary * 0.05,
        netSalary: baseSalary + (baseSalary * 0.2) - (baseSalary * 0.05),
        houseRentAllowance: baseSalary * 0.1,
        medicalAllowance: baseSalary * 0.05,
        travelAllowance: baseSalary * 0.05,
        otherAllowances: 0,
        tax: baseSalary * 0.02,
        providentFund: baseSalary * 0.03,
        professionalTax: 200,
        otherDeductions: 0,
        bonus: 0,
        paymentStatus: "PAID",
      }
    });
  }

  console.log("DB seeding completed successfully with 20 dummy employees!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
