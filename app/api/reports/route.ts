import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

interface SaleGroupBy {
  productId: string;
  _sum: { total: number | null; quantity: number | null };
}

interface ExpenseGroupBy {
  category: string;
  _sum: { amount: number | null };
}

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const now = new Date();
  const year = Number(searchParams.get("year")) || now.getFullYear();
  const month = Number(searchParams.get("month")) || now.getMonth() + 1;

  const start = new Date(year, month - 1, 1);
  const end = new Date(year, month, 1);

  let summary = await prisma.monthlySummary.findUnique({
    where: { year_month: { year, month } },
  });

  if (!summary) {
    const [sales, expenses] = await Promise.all([
      prisma.sale.aggregate({
        where: { date: { gte: start, lt: end } },
        _sum: { total: true },
        _count: true,
      }),
      prisma.expense.aggregate({
        where: { date: { gte: start, lt: end } },
        _sum: { amount: true },
      }),
    ]);
    const totalRevenue = sales._sum.total ?? 0;
    const totalExpense = expenses._sum.amount ?? 0;
    summary = {
      id: "computed",
      year,
      month,
      totalRevenue,
      totalExpense,
      netProfit: totalRevenue - totalExpense,
      totalSales: sales._count,
      updatedAt: new Date(),
    };
  }

  const salesByProduct = await prisma.sale.groupBy({
    by: ["productId"],
    where: { date: { gte: start, lt: end } },
    _sum: { total: true, quantity: true },
  });

  const products = await prisma.product.findMany({
    where: { id: { in: (salesByProduct as SaleGroupBy[]).map((s) => s.productId) } },
  });

  const months: { year: number; month: number }[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(year, month - 1 - i, 1);
    months.push({ year: d.getFullYear(), month: d.getMonth() + 1 });
  }

  const last6Months = await Promise.all(
    months.map(async ({ year: y, month: m }) => {
      const existing = await prisma.monthlySummary.findUnique({
        where: { year_month: { year: y, month: m } },
      });
      if (existing) return existing;
      const s = new Date(y, m - 1, 1);
      const e = new Date(y, m, 1);
      const [sl, ex] = await Promise.all([
        prisma.sale.aggregate({
          where: { date: { gte: s, lt: e } },
          _sum: { total: true },
          _count: true,
        }),
        prisma.expense.aggregate({
          where: { date: { gte: s, lt: e } },
          _sum: { amount: true },
        }),
      ]);
      const rev = sl._sum.total ?? 0;
      const exp = ex._sum.amount ?? 0;
      return {
        id: `computed-${y}-${m}`,
        year: y,
        month: m,
        totalRevenue: rev,
        totalExpense: exp,
        netProfit: rev - exp,
        totalSales: sl._count,
        updatedAt: new Date(),
      };
    }),
  );

  const expensesByCategory = await prisma.expense.groupBy({
    by: ["category"],
    where: { date: { gte: start, lt: end } },
    _sum: { amount: true },
  });

  return NextResponse.json({
    summary,
    salesByProduct: (salesByProduct as SaleGroupBy[]).map((s) => ({
      productName:
        products.find((p) => p.id === s.productId)?.name ?? "Unknown",
      total: s._sum.total ?? 0,
      quantity: s._sum.quantity ?? 0,
    })),
    expensesByCategory: (expensesByCategory as ExpenseGroupBy[]).map((e) => ({
      category: e.category,
      total: e._sum.amount ?? 0,
    })),
    last6Months,
  });
}
