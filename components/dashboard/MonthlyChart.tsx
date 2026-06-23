"use client";

import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from "@/components/ui/chart";
import { MonthlySummary } from "@/types";

interface MonthlyChartProps {
  data: MonthlySummary[];
}

const chartConfig = {
  totalRevenue: { label: "Revenue", color: "hsl(142 76% 36%)" },
  totalExpense: { label: "Expenses", color: "hsl(0 84% 60%)" },
  netProfit: { label: "Profit", color: "hsl(221 83% 53%)" },
};

function shortMonth(year: number, month: number) {
  return new Intl.DateTimeFormat("en-NG", { month: "short" }).format(
    new Date(year, month - 1)
  );
}

function formatK(value: number) {
  if (value >= 1000000) return `₦${(value / 1000000).toFixed(1)}M`;
  if (value >= 1000) return `₦${(value / 1000).toFixed(0)}k`;
  return `₦${value}`;
}

export function MonthlyChart({ data }: MonthlyChartProps) {
  const chartData = data.map((m) => ({
    month: shortMonth(m.year, m.month),
    totalRevenue: m.totalRevenue,
    totalExpense: m.totalExpense,
    netProfit: m.netProfit,
  }));

  return (
    <ChartContainer config={chartConfig} className="h-[260px] w-full">
      <BarChart data={chartData}>
        <CartesianGrid vertical={false} />
        <XAxis
          dataKey="month"
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          tick={{ fontSize: 12 }}
        />
        <YAxis
          tickFormatter={formatK}
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          tick={{ fontSize: 11 }}
          width={52}
        />
        <ChartTooltip content={<ChartTooltipContent />} />
        <ChartLegend content={<ChartLegendContent />} />
        <Bar dataKey="totalRevenue" fill="hsl(142 76% 36%)" radius={[4, 4, 0, 0]} maxBarSize={28} />
        <Bar dataKey="totalExpense" fill="hsl(0 84% 60%)" radius={[4, 4, 0, 0]} maxBarSize={28} />
        <Bar dataKey="netProfit" fill="hsl(221 83% 53%)" radius={[4, 4, 0, 0]} maxBarSize={28} />
      </BarChart>
    </ChartContainer>
  );
}