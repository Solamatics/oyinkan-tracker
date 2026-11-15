import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn, formatNaira, percentChange } from "@/lib/utils";

interface KPICardProps {
  label: string;
  value: number;
  previousValue?: number;
  format?: "currency" | "number";
  colorize?: boolean;
}

export function KPICard({
  label,
  value,
  previousValue,
  format = "currency",
  colorize = false,
}: KPICardProps) {
  const change =
    previousValue !== undefined ? percentChange(value, previousValue) : null;
  const display =
    format === "currency" ? formatNaira(value) : value.toLocaleString();

  const positive = change !== null && change > 0;
  const negative = change !== null && change < 0;

  return (
    <Card>
      <CardContent className="pt-5 pb-4">
        <p className="text-muted-foreground mb-1 text-xs">{label}</p>
        <p
          className={cn(
            "text-xl font-semibold tabular-nums md:text-2xl",
            colorize && value > 0 && "text-green-600",
            colorize && value < 0 && "text-red-500",
          )}
        >
          {display}
        </p>
        {change !== null && (
          <div
            className={cn(
              "mt-1.5 flex items-center gap-1 text-xs",
              positive && "text-green-600",
              negative && "text-red-500",
              !positive && !negative && "text-muted-foreground",
            )}
          >
            {positive && <TrendingUp className="h-3 w-3" />}
            {negative && <TrendingDown className="h-3 w-3" />}
            {!positive && !negative && <Minus className="h-3 w-3" />}
            <span>
              {change === null ? "—" : `${Math.abs(change)}%`} vs last month
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
