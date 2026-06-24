import { prisma } from "@/lib/prisma";
import { KPICard } from "@/components/dashboard/KPICard";
import { MonthlyChart } from "@/components/dashboard/MonthlyChart";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatNaira, formatDate, monthLabel } from "@/lib/utils";
import { AlertTriangle } from "lucide-react";


export interface ProductItem {
  id: string;
  name: string;
  unit: string;
  defaultPrice: number;
  lowStockAlert: number;
  currentStock: number;
  createdAt: Date;
}


//dashboard data
async function getDashboardData() {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;

  const prevDate = new Date(year, month - 2, 1);
  const prevYear = prevDate.getFullYear();
  const prevMonth = prevDate.getMonth() + 1;

  const [current, previous, products, recentSales] = await Promise.all([
    prisma.monthlySummary.findUnique({ where: { year_month: { year, month } } }),
    prisma.monthlySummary.findUnique({
      where: { year_month: { year: prevYear, month: prevMonth } },
    }),
    prisma.product.findMany({ orderBy: { createdAt: "asc" } }),
    prisma.sale.findMany({
      take: 6,
      orderBy: { date: "desc" },
      include: { product: true },
    }),
  ]);

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
      return (
        existing ?? {
          id: `empty-${y}-${m}`,
          year: y,
          month: m,
          totalRevenue: 0,
          totalExpense: 0,
          netProfit: 0,
          totalSales: 0,
          updatedAt: new Date(),
        }
      );
    })
  );

  return { current, previous, products, recentSales, last6Months };
}

export default async function DashboardPage() {
  const { current, previous, products, recentSales, last6Months } =
    await getDashboardData();

  const now = new Date();
  const label = monthLabel(now.getFullYear(), now.getMonth() + 1);

  const cur = current ?? {
    totalRevenue: 0,
    totalExpense: 0,
    netProfit: 0,
    totalSales: 0,
  };

  const lowStock = products.filter((p: ProductItem) => p.currentStock <= p.lowStockAlert);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-0.5">{label}</p>
      </div>

      {/* Low stock alerts here */}
      {lowStock.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {lowStock.map((p: ProductItem) => (
            <div
              key={p.id}
              className="flex items-center gap-1.5 text-xs bg-amber-50 border border-amber-200 text-amber-800 rounded-md px-3 py-1.5"
            >
              <AlertTriangle className="h-3 w-3" />
              <span>
                {p.name} —{" "}
                {p.currentStock === 0 ? "out of stock" : `${p.currentStock} left`}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          label="Revenue"
          value={cur.totalRevenue}
          previousValue={previous?.totalRevenue}
          colorize
        />
        <KPICard
          label="Expenses"
          value={cur.totalExpense}
          previousValue={previous?.totalExpense}
        />
        <KPICard
          label="Net profit"
          value={cur.netProfit}
          previousValue={previous?.netProfit}
          colorize
        />
        <KPICard
          label="Sales"
          value={cur.totalSales}
          previousValue={previous?.totalSales}
          format="number"
        />
      </div>

      {/* Chart */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">6-month trend</CardTitle>
        </CardHeader>
        <CardContent>
          <MonthlyChart data={last6Months} />
        </CardContent>
      </Card>

      <div className="grid md:grid-cols-2 gap-4">
        {/* Recent sales */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Recent sales</CardTitle>
          </CardHeader>
          <CardContent>
            {recentSales.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">
                No sales yet
              </p>
            ) : (
              <div className="space-y-2">
                {recentSales.map((s) => (
                  <div
                    key={s.id}
                    className="flex justify-between items-center py-1.5 border-b last:border-0"
                  >
                    <div>
                      <p className="text-xs font-medium">{s.product.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {s.quantity} × {formatNaira(s.unitPrice)} ·{" "}
                        {formatDate(s.date)}
                      </p>
                    </div>
                    <span className="text-sm font-medium text-green-600">
                      {formatNaira(s.total)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Stock levels */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Stock levels</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {products.map((p: ProductItem) => {
                const status =
                  p.currentStock === 0
                    ? "out"
                    : p.currentStock <= p.lowStockAlert
                    ? "low"
                    : "ok";
                return (
                  <div
                    key={p.id}
                    className="flex items-center justify-between py-1.5 border-b last:border-0"
                  >
                    <p className="text-sm">{p.name}</p>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium tabular-nums">
                        {p.currentStock}
                      </span>
                      <Badge
                        variant={status === "out" ? "destructive" : "secondary"}
                        className={
                          status === "low"
                            ? "bg-amber-100 text-amber-800 hover:bg-amber-100"
                            : status === "ok"
                            ? "bg-green-100 text-green-800 hover:bg-green-100"
                            : ""
                        }
                      >
                        {status === "out" ? "Out" : status === "low" ? "Low" : "OK"}
                      </Badge>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}