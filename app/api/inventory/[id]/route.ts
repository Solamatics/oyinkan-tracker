import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  const session = await getServerSession(authOptions);
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { action, quantity, cost, lowStockAlert, defaultPrice } = body;

  const product = await prisma.product.findUnique({ where: { id: params.id } });
  if (!product)
    return NextResponse.json({ error: "Product not found" }, { status: 404 });

  if (action === "settings") {
    const updated = await prisma.product.update({
      where: { id: params.id },
      data: {
        ...(lowStockAlert !== undefined && { lowStockAlert }),
        ...(defaultPrice !== undefined && { defaultPrice }),
      },
    });
    return NextResponse.json(updated);
  }

  if (!quantity || quantity < 1) {
    return NextResponse.json({ error: "Invalid quantity" }, { status: 400 });
  }

  const prevStock = product.currentStock;
  const newStock = action === "add" ? prevStock + quantity : quantity;
  const stockDelta = newStock - prevStock;

  const [updated] = await prisma.$transaction([
    prisma.product.update({
      where: { id: params.id },
      data: { currentStock: newStock },
    }),
    prisma.stockMovement.create({
      data: {
        productId: params.id,
        type: "restock",
        quantity: stockDelta,
        note: cost ? `Cost: ₦${cost.toLocaleString()}` : "Restock",
        date: new Date(),
      },
    }),
  ]);

  if (cost && cost > 0 && action === "add") {
    const today = new Date();
    const year = today.getFullYear();
    const month = today.getMonth() + 1;

    await prisma.expense.create({
      data: {
        category: "Restock / supplier",
        description: `Restock: ${product.name} (${quantity} units)`,
        amount: cost,
        date: today,
      },
    });

    await prisma.monthlySummary.upsert({
      where: { year_month: { year, month } },
      create: {
        year,
        month,
        totalRevenue: 0,
        totalExpense: cost,
        netProfit: -cost,
        totalSales: 0,
      },
      update: {
        totalExpense: { increment: cost },
        netProfit: { decrement: cost },
      },
    });
  }

  return NextResponse.json(updated);
}
