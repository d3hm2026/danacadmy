const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

async function main() {
  const hashed = await bcrypt.hash("admin123", 10);
  await prisma.user.upsert({
    where: { phone: "0500000000" },
    update: { role: "owner", name: "صاحب المنصة" },
    create: {
      phone: "0500000000",
      password: hashed,
      name: "صاحب المنصة",
      role: "owner",
    },
  });

  console.log("Owner created/updated: phone=0500000000 / password=admin123");
}

main().catch(console.error).finally(() => prisma.$disconnect());
