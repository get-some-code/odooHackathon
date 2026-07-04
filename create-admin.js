const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

async function main() {
  const email = "admin@nexus.com";
  const employeeId = "ADM001";
  
  // Check if admin already exists
  const existing = await prisma.user.findUnique({
    where: { email }
  });
  
  if (existing) {
    console.log("Admin already exists!");
    return;
  }
  
  const hashedPassword = await bcrypt.hash("admin123", 12);
  
  const admin = await prisma.user.create({
    data: {
      employeeId,
      email,
      password: hashedPassword,
      firstName: "System",
      lastName: "Administrator",
      role: "ADMIN",
      isVerified: true,
      profile: {
        create: {
          phone: "9999999999",
          address: "HQ, Bangalore",
          department: "HR",
          designation: "HR Generalist",
          baseSalary: 100000,
          status: "Active"
        }
      }
    }
  });
  
  console.log("Admin created successfully:", admin.email);
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
