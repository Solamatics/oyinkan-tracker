import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getServerSession(authOptions);
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await req.json();
  const { action, quantity, cost, lowStockAlert, defaultPrice } = body;

  const product = await prisma.product.findUnique({
    where: { id },
    include: { _count: { select: { sales: true, stockMovements: true } } },
  });
  if (!product)
    return NextResponse.json({ error: "Product not found" }, { status: 404 });

  if (action === "archive") {
    if (product._count.sales === 0 && product._count.stockMovements === 0)
      return NextResponse.json(
        { error: "Products without history should be deleted instead" },
        { status: 409 },
      );

    const updated = await prisma.product.update({
      where: { id },
      data: { isActive: false },
    });
    return NextResponse.json(updated);
  }

  if (action === "restore") {
    const updated = await prisma.product.update({
      where: { id },
      data: { isActive: true },
    });
    return NextResponse.json(updated);
  }

  if (!product.isActive)
    return NextResponse.json(
      { error: "Restore this product before changing it" },
      { status: 409 },
    );

  if (action === "settings") {
    const updated = await prisma.product.update({
      where: { id },
      data: {
        ...(lowStockAlert !== undefined && { lowStockAlert }),
        ...(defaultPrice !== undefined && { defaultPrice }),
      },
    });
    return NextResponse.json(updated);
  }

  if (action !== "add" && action !== "set")
    return NextResponse.json({ error: "Invalid action" }, { status: 400 });

  if (
    typeof quantity !== "number" ||
    !Number.isInteger(quantity) ||
    quantity < (action === "add" ? 1 : 0)
  )
    return NextResponse.json(
      {
        error:
          action === "set"
            ? "Stock must be a non-negative whole number"
            : "Quantity must be a positive whole number",
      },
      { status: 400 },
    );

  const prevStock = product.currentStock;
  const newStock = action === "add" ? prevStock + quantity : quantity;
  const stockDelta = newStock - prevStock;

  const updated = await prisma.$transaction(async (tx) => {
    const stockUpdate = await tx.product.updateMany({
      where: {
        id,
        isActive: true,
        ...(action === "add" && { currentStock: { gte: 0 } }),
      },
      data:
        action === "add"
          ? { currentStock: { increment: quantity } }
          : { currentStock: quantity },
    });

    if (stockUpdate.count === 0) return null;

    await tx.stockMovement.create({
      data: {
        productId: id,
        type: action === "add" ? "restock" : "adjustment",
        quantity: stockDelta,
        note:
          action === "set"
            ? "Stock count adjustment"
            : cost
              ? `Cost: ₦${cost.toLocaleString()}`
              : "Restock",
        date: new Date(),
      },
    });

    return tx.product.findUniqueOrThrow({ where: { id } });
  });

  if (!updated) {
    const currentProduct = await prisma.product.findUnique({
      where: { id },
      select: { isActive: true, currentStock: true },
    });
    if (!currentProduct)
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    if (!currentProduct.isActive)
      return NextResponse.json(
        { error: "Product is no longer active; refresh and try again" },
        { status: 409 },
      );
    return NextResponse.json(
      {
        error: "Current stock is below zero; set a corrected stock count first",
      },
      { status: 409 },
    );
  }

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

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getServerSession(authOptions);
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const deleted = await prisma.product.deleteMany({
    where: {
      id,
      sales: { none: {} },
      stockMovements: { none: {} },
    },
  });

  if (deleted.count === 0) {
    const product = await prisma.product.findUnique({ where: { id } });
    if (!product)
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    return NextResponse.json(
      { error: "Products with sales or stock history cannot be deleted" },
      { status: 409 },
    );
  }

  return NextResponse.json({ success: true });
}
