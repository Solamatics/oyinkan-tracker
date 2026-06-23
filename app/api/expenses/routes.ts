import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

async function upsertMonthlyExpense(date: Date, delta: number) {
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  await prisma.monthlySummary.upsert({
    where: { year_month: { year, month } },
    create: {
      year,
      month,
      totalRevenue: 0,
      totalExpense: Math.max(0, delta),
      netProfit: -Math.max(0, delta),
      totalSales: 0,
    },
    update: {
      totalExpense: { increment: delta },
      netProfit: { decrement: delta },
    },
  });
}

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const category = searchParams.get("category");
  const month = searchParams.get("month");

  const where: Record<string, unknown> = {};
  if (category) where.category = category;
  if (month) {
    const [y, m] = month.split("-").map(Number);
    where.date = {
      gte: new Date(y, m - 1, 1),
      lt: new Date(y, m, 1),
    };
  }

  const expenses = await prisma.expense.findMany({
    where,
    orderBy: { date: "desc" },
  });

  return NextResponse.json(expenses);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { category, description, amount, date } = body;

  if (!category || !amount || !date) {
    return NextResponse.json(
      { error: "Missing required fields" },
      { status: 400 },
    );
  }

  const expenseDate = new Date(date);
  const expense = await prisma.expense.create({
    data: { category, description, amount, date: expenseDate },
  });

  await upsertMonthlyExpense(expenseDate, amount);

  return NextResponse.json(expense, { status: 201 });
}

export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  const expense = await prisma.expense.findUnique({ where: { id } });
  if (!expense)
    return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.expense.delete({ where: { id } });
  await upsertMonthlyExpense(expense.date, -expense.amount);

  return NextResponse.json({ success: true });
}
