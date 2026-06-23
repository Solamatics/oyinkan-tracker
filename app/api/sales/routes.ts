import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

async function upsertMonthlySummary(
  date: Date,
  revDelta: number,
  salesDelta: number,
) {
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  await prisma.monthlySummary.upsert({
    where: { year_month: { year, month } },
    create: {
      year,
      month,
      totalRevenue: Math.max(0, revDelta),
      totalExpense: 0,
      netProfit: Math.max(0, revDelta),
      totalSales: Math.max(0, salesDelta),
    },
    update: {
      totalRevenue: { increment: revDelta },
      netProfit: { increment: revDelta },
      totalSales: { increment: salesDelta },
    },
  });
}

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const productId = searchParams.get("productId");
  const month = searchParams.get("month");

  const where: Record<string, unknown> = {};
  if (productId) where.productId = productId;
  if (month) {
    const [y, m] = month.split("-").map(Number);
    where.date = {
      gte: new Date(y, m - 1, 1),
      lt: new Date(y, m, 1),
    };
  }

  const sales = await prisma.sale.findMany({
    where,
    include: { product: true },
    orderBy: { date: "desc" },
  });

  return NextResponse.json(sales);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { productId, quantity, unitPrice, note, date } = body;

  if (!productId || !quantity || !unitPrice || !date) {
    return NextResponse.json(
      { error: "Missing required fields" },
      { status: 400 },
    );
  }

  const total = quantity * unitPrice;
  const saleDate = new Date(date);

  const [sale] = await prisma.$transaction([
    prisma.sale.create({
      data: { productId, quantity, unitPrice, total, note, date: saleDate },
      include: { product: true },
    }),
    prisma.product.update({
      where: { id: productId },
      data: { currentStock: { decrement: quantity } },
    }),
    prisma.stockMovement.create({
      data: {
        productId,
        type: "sale",
        quantity: -quantity,
        note: note || "Sale recorded",
        date: saleDate,
      },
    }),
  ]);

  await upsertMonthlySummary(saleDate, total, 1);

  return NextResponse.json(sale, { status: 201 });
}

export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  const sale = await prisma.sale.findUnique({ where: { id } });
  if (!sale) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.$transaction([
    prisma.sale.delete({ where: { id } }),
    prisma.product.update({
      where: { id: sale.productId },
      data: { currentStock: { increment: sale.quantity } },
    }),
    prisma.stockMovement.create({
      data: {
        productId: sale.productId,
        type: "adjustment",
        quantity: sale.quantity,
        note: "Sale deleted — stock restored",
        date: new Date(),
      },
    }),
  ]);

  await upsertMonthlySummary(sale.date, -sale.total, -1);

  return NextResponse.json({ success: true });
}
