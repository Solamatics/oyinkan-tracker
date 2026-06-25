"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MonthlyChart } from "@/components/dashboard/MonthlyChart";
import { formatNaira, monthLabel, percentChange } from "@/lib/utils";
import { ReportData } from "@/types";
import { Loader2, Download, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { toast } from "sonner";

function ChangeChip({
  current,
  previous,
}: {
  current: number;
  previous?: number;
}) {
  if (previous === undefined) return null;
  const change = percentChange(current, previous);
  if (change === null)
    return <span className="text-xs text-muted-foreground">—</span>;
  const pos = change > 0;
  const neg = change < 0;
  return (
    <span
      className={`inline-flex items-center gap-0.5 text-xs ${
        pos ? "text-green-600" : neg ? "text-red-500" : "text-muted-foreground"
      }`}
    >
      {pos && <TrendingUp className="h-3 w-3" />}
      {neg && <TrendingDown className="h-3 w-3" />}
      {!pos && !neg && <Minus className="h-3 w-3" />}
      {Math.abs(change)}%
    </span>
  );
}

export default function ReportsPage() {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [data, setData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(false);

  const monthValue = `${year}-${String(month).padStart(2, "0")}`;

  useEffect(() => {
    async function fetchReport() {
      setLoading(true);
      try {
        const res = await fetch(`/api/reports?year=${year}&month=${month}`);
        const d = await res.json();
        setData(d);
      } catch {
        toast.error("Failed to load report");
      } finally {
        setLoading(false);
      }
    }
    fetchReport();
  }, [year, month]);

  function handleMonthChange(value: string) {
    const [y, m] = value.split("-").map(Number);
    setYear(y);
    setMonth(m);
  }

  function exportCSV() {
    if (!data) return;
    const { summary, salesByProduct, expensesByCategory } = data;
    const label = monthLabel(summary.year, summary.month);

    const rows = [
      ["Biz Tracker — Monthly Report", label],
      [],
      ["Summary"],
      ["Total Revenue", summary.totalRevenue],
      ["Total Expenses", summary.totalExpense],
      ["Net Profit", summary.netProfit],
      ["Total Sales", summary.totalSales],
      [],
      ["Revenue by product", "Total (₦)", "Units sold"],
      ...salesByProduct.map((s) => [s.productName, s.total, s.quantity]),
      [],
      ["Expenses by category", "Total (₦)"],
      ...expensesByCategory.map((e) => [e.category, e.total]),
    ];

    const csv = rows.map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `report-${label.replace(" ", "-")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const prev = data?.last6Months?.[data.last6Months.length - 2];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-xl font-semibold">Reports</h1>
        <div className="flex items-center gap-2">
          <Input
            type="month"
            value={monthValue}
            onChange={(e) => handleMonthChange(e.target.value)}
            className="w-40 h-9"
          />
          <Button
            variant="outline"
            size="sm"
            onClick={exportCSV}
            disabled={!data}
          >
            <Download className="mr-1.5 h-4 w-4" />
            Export CSV
          </Button>
        </div>
      </div>

      {loading || !data ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <>
          {/* KPIs */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              {
                label: "Revenue",
                value: data.summary.totalRevenue,
                prev: prev?.totalRevenue,
                color: "text-green-600",
              },
              {
                label: "Expenses",
                value: data.summary.totalExpense,
                prev: prev?.totalExpense,
                color: "text-red-500",
              },
              {
                label: "Net profit",
                value: data.summary.netProfit,
                prev: prev?.netProfit,
                color:
                  data.summary.netProfit >= 0
                    ? "text-green-600"
                    : "text-red-500",
              },
              {
                label: "Sales count",
                value: data.summary.totalSales,
                prev: prev?.totalSales,
                format: "number" as const,
              },
            ].map(({ label, value, prev: p, color, format }) => (
              <Card key={label}>
                <CardContent className="pt-4 pb-3">
                  <p className="text-xs text-muted-foreground mb-1">{label}</p>
                  <p className={`text-lg md:text-xl font-semibold tabular-nums ${color ?? ""}`}>
                    {format === "number"
                      ? value.toLocaleString()
                      : formatNaira(value)}
                  </p>
                  <div className="flex items-center gap-1 mt-1">
                    <ChangeChip current={value} previous={p} />
                    <span className="text-xs text-muted-foreground">
                      vs prev month
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* 6-month trend */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">
                6-month trend
              </CardTitle>
            </CardHeader>
            <CardContent>
              <MonthlyChart data={data.last6Months} />
            </CardContent>
          </Card>

          <div className="grid md:grid-cols-2 gap-4">
            {/* Revenue by product */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">
                  Revenue by product
                </CardTitle>
              </CardHeader>
              <CardContent>
                {data.salesByProduct.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No sales this month
                  </p>
                ) : (
                  <div className="space-y-3">
                    {data.salesByProduct
                      .sort((a, b) => b.total - a.total)
                      .map((s) => {
                        const pct =
                          data.summary.totalRevenue > 0
                            ? Math.round(
                                (s.total / data.summary.totalRevenue) * 100
                              )
                            : 0;
                        return (
                          <div key={s.productName}>
                            <div className="flex justify-between text-sm mb-1">
                              <span className="text-muted-foreground truncate pr-2">
                                {s.productName}
                              </span>
                              <div className="flex items-center gap-2 shrink-0">
                                <span className="text-xs text-muted-foreground">
                                  {s.quantity} units
                                </span>
                                <span className="font-medium">
                                  {formatNaira(s.total)}
                                </span>
                              </div>
                            </div>
                            <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                              <div
                                className="h-full bg-green-500 rounded-full"
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                          </div>
                        );
                      })}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Expenses by category */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">
                  Expenses by category
                </CardTitle>
              </CardHeader>
              <CardContent>
                {data.expensesByCategory.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No expenses this month
                  </p>
                ) : (
                  <div className="space-y-3">
                    {data.expensesByCategory
                      .sort((a, b) => b.total - a.total)
                      .map((e) => {
                        const pct =
                          data.summary.totalExpense > 0
                            ? Math.round(
                                (e.total / data.summary.totalExpense) * 100
                              )
                            : 0;
                        return (
                          <div key={e.category}>
                            <div className="flex justify-between text-sm mb-1">
                              <span className="text-muted-foreground truncate pr-2">
                                {e.category}
                              </span>
                              <span className="font-medium shrink-0">
                                {formatNaira(e.total)}
                              </span>
                            </div>
                            <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                              <div
                                className="h-full bg-red-400 rounded-full"
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                          </div>
                        );
                      })}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}