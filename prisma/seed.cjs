const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

async function main() {
  const existing = await prisma.user.findUnique({ where: { phone: "0500000000" } });
  if (existing) {
    console.log("Admin already exists: phone=0500000000");
    return;
  }

  const hashed = await bcrypt.hash("admin123", 10);
  await prisma.user.create({
    data: {
      phone: "0500000000",
      password: hashed,
      name: "المدير",
      role: "admin",
    },
  });

  console.log("Admin created: phone=0500000000 / password=admin123");
}

main().catch(console.error).finally(() => prisma.$disconnect());
