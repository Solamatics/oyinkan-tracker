"use client";

import { useEffect, useState } from "react";
import { useExpenseStore } from "@/store/useExpenseStore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatNaira, formatDate, EXPENSE_CATEGORIES } from "@/lib/utils";
import { Loader2, Trash2, Plus } from "lucide-react";
import { toast } from "sonner";

function todayStr() {
  return new Date().toISOString().split("T")[0];
}

export default function ExpensesPage() {
  const {
    expenses,
    loading,
    fetchExpenses,
    addExpense,
    deleteExpense,
    filterCategory,
    filterMonth,
    setFilterCategory,
    setFilterMonth,
  } = useExpenseStore();

  const [category, setCategory] = useState<string>(EXPENSE_CATEGORIES[0]);
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(todayStr());
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchExpenses();
  }, []);

  useEffect(() => {
    fetchExpenses(filterCategory || undefined, filterMonth || undefined);
  }, [filterCategory, filterMonth]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!amount || !date) return;
    setSubmitting(true);
    try {
      await addExpense({
        category,
        description,
        amount: Number(amount),
        date,
      });
      toast.success("Expense recorded");
      setDescription("");
      setAmount("");
      setDate(todayStr());
    } catch (err) {
     toast.error(err instanceof Error ? err.message : "Failed to record sale");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this expense?")) return;
    try {
      await deleteExpense(id);
      toast.success("Expense deleted");
    } catch {
      toast.error("Failed to delete");
    }
  }

  const total = expenses.reduce((a, e) => a + e.amount, 0);

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold">Expenses</h1>

      {/* Form */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium">Record an expense</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="space-y-1.5">
                <Label>Category</Label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {EXPENSE_CATEGORIES.map((c) => (
                      <SelectItem key={c} value={c}>
                        {c}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label>Description</Label>
                <Input
                  placeholder="e.g. honey supplier payment"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>

              <div className="space-y-1.5">
                <Label>Amount (₦)</Label>
                <Input
                  type="number"
                  min="0"
                  placeholder="0"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label>Date</Label>
                <Input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  required
                />
              </div>
            </div>

            <Button type="submit" disabled={submitting} size="sm">
              {submitting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Plus className="mr-2 h-4 w-4" />
              )}
              Record expense
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* History */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <CardTitle className="text-sm font-medium">Expenses history</CardTitle>
            <div className="flex flex-wrap gap-2">
              <Select value={filterCategory} onValueChange={setFilterCategory}>
                <SelectTrigger className="w-44 h-8 text-xs">
                  <SelectValue placeholder="All categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All categories</SelectItem>
                  {EXPENSE_CATEGORIES.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input
                type="month"
                value={filterMonth}
                onChange={(e) => setFilterMonth(e.target.value)}
                className="w-36 h-8 text-xs"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : expenses.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              No expenses found
            </p>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left font-medium text-muted-foreground pb-2 pr-4">Date</th>
                      <th className="text-left font-medium text-muted-foreground pb-2 pr-4">Category</th>
                      <th className="text-left font-medium text-muted-foreground pb-2 pr-4">Description</th>
                      <th className="text-right font-medium text-muted-foreground pb-2 pr-4">Amount</th>
                      <th className="pb-2"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {expenses.map((e) => (
                      <tr key={e.id} className="border-b last:border-0">
                        <td className="py-2.5 pr-4 text-muted-foreground">
                          {formatDate(e.date)}
                        </td>
                        <td className="py-2.5 pr-4">
                          <span className="text-xs bg-secondary px-2 py-0.5 rounded-full">
                            {e.category}
                          </span>
                        </td>
                        <td className="py-2.5 pr-4 text-muted-foreground">
                          {e.description || "—"}
                        </td>
                        <td className="py-2.5 pr-4 text-right tabular-nums font-medium text-red-500">
                          {formatNaira(e.amount)}
                        </td>
                        <td className="py-2.5">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-muted-foreground hover:text-destructive"
                            onClick={() => handleDelete(e.id)}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="text-right text-sm font-medium pt-3 border-t mt-2">
                Total:{" "}
                <span className="text-red-500">{formatNaira(total)}</span>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}