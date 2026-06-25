import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient({
  adapter: new PrismaPg(process.env.DATABASE_URL!),
});

async function main() {
  const hashed = await bcrypt.hash("admin123", 12);
  await prisma.user.upsert({
    where: { email: "admin@oyinkantracker.com" },
    update: {},
    create: { email: "admin@oyinkantracker.com", password: hashed },
  });

  const products = [
    {
      name: "Soursoup Pack",
      unit: "pack",
      defaultPrice: 8000,
      lowStockAlert: 5,
    },
    { name: "Honey 350g", unit: "jar", defaultPrice: 5500, lowStockAlert: 5 },
    { name: "Honey 500g", unit: "jar", defaultPrice: 8000, lowStockAlert: 5 },
    {
      name: "Honey 1 litre",
      unit: "bottle",
      defaultPrice: 16000,
      lowStockAlert: 3,
    },
  ];

  for (const product of products) {
    await prisma.product.upsert({
      where: { name: product.name },
      update: {},
      create: product,
    });
  }

  console.log("✅ Seed complete — admin@oyinkantracker.com / admin123");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
