import { create } from "zustand";
import { Expense } from "@/types";

interface ExpenseState {
  expenses: Expense[];
  loading: boolean;
  filterCategory: string;
  filterMonth: string;
  setFilterCategory: (v: string) => void;
  setFilterMonth: (v: string) => void;
  fetchExpenses: (category?: string, month?: string) => Promise<void>;
  addExpense: (data: {
    category: string;
    description?: string;
    amount: number;
    date: string;
  }) => Promise<Expense>;
  deleteExpense: (id: string) => Promise<void>;
}

export const useExpenseStore = create<ExpenseState>((set) => ({
  expenses: [],
  loading: false,
  filterCategory: "",
  filterMonth: "",

  setFilterCategory: (v) => set({ filterCategory: v }),
  setFilterMonth: (v) => set({ filterMonth: v }),

  fetchExpenses: async (category, month) => {
    set({ loading: true });
    const params = new URLSearchParams();
    if (category) params.set("category", category);
    if (month) params.set("month", month);
    const res = await fetch(`/api/expenses?${params}`);
    const data = await res.json();
    set({ expenses: data, loading: false });
  },

  addExpense: async (payload) => {
    const res = await fetch("/api/expenses", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || "Failed to record expense");
    }
    const expense: Expense = await res.json();
    set((s) => ({ expenses: [expense, ...s.expenses] }));
    return expense;
  },

  deleteExpense: async (id) => {
    const res = await fetch(`/api/expenses?id=${id}`, { method: "DELETE" });
    if (!res.ok) throw new Error("Failed to delete expense");
    set((s) => ({ expenses: s.expenses.filter((x) => x.id !== id) }));
  },
}));
