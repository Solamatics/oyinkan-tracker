import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const prisma = new PrismaClient({
  adapter: new PrismaPg(process.env.DATABASE_URL!),
});

async function main() {
  const oldName = "Soursoup Pack (30 bags)";
  const newName = "Soursoup Pack";

  const oldProduct = await prisma.product.findUnique({ where: { name: oldName } });
  const newProduct = await prisma.product.findUnique({ where: { name: newName } });

  if (!oldProduct) {
    console.log(`"${oldName}" not found — nothing to migrate.`);
    return;
  }

  if (!newProduct) {
    // Simple rename — no duplicate exists
    await prisma.product.update({
      where: { id: oldProduct.id },
      data: { name: newName },
    });
    console.log(`✅ Renamed "${oldName}" → "${newName}"`);
    return;
  }

  // Both exist — move all relations from old to new, then delete old
  console.log(`Both products exist. Migrating relations from "${oldName}" to "${newName}"...`);

  const [salesMoved, movementsMoved] = await prisma.$transaction([
    prisma.sale.updateMany({
      where: { productId: oldProduct.id },
      data: { productId: newProduct.id },
    }),
    prisma.stockMovement.updateMany({
      where: { productId: oldProduct.id },
      data: { productId: newProduct.id },
    }),
  ]);

  console.log(`  Moved ${salesMoved.count} sales, ${movementsMoved.count} stock movements`);

  await prisma.product.delete({ where: { id: oldProduct.id } });
  console.log(`✅ Deleted old "${oldName}" product. Done.`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
