import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const prisma = new PrismaClient({
  adapter: new PrismaPg(process.env.DATABASE_URL!),
});

async function main() {
  const products = await prisma.product.findMany({
    select: { id: true, isActive: true },
  });

  if (products.length === 0) {
    console.log("No products found.");
    return;
  }

  const archivedProducts = products.filter((product) => !product.isActive);
  if (archivedProducts.length === 0) {
    console.log("No archived products to restore.");
    return;
  }

  if (archivedProducts.length !== products.length) {
    throw new Error(
      "Repair stopped: not all products are archived. Restore products individually to avoid undoing an intentional archive.",
    );
  }

  const restored = await prisma.product.updateMany({
    where: { id: { in: archivedProducts.map((product) => product.id) } },
    data: { isActive: true },
  });

  console.log(`Restored ${restored.count} products.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
