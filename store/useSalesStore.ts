import { create } from "zustand";
import { Sale } from "@/types";

interface SalesState {
  sales: Sale[];
  loading: boolean;
  filterProduct: string;
  filterMonth: string;
  setFilterProduct: (v: string) => void;
  setFilterMonth: (v: string) => void;
  fetchSales: (productId?: string, month?: string) => Promise<void>;
  addSale: (data: {
    productId: string;
    quantity: number;
    unitPrice: number;
    note?: string;
    date: string;
  }) => Promise<Sale>;
  deleteSale: (id: string) => Promise<void>;
}

export const useSalesStore = create<SalesState>((set) => ({
  sales: [],
  loading: false,
  filterProduct: "",
  filterMonth: "",

  setFilterProduct: (v) => set({ filterProduct: v }),
  setFilterMonth: (v) => set({ filterMonth: v }),

  fetchSales: async (productId, month) => {
    set({ loading: true });
    try {
      const params = new URLSearchParams();
      if (productId) params.set("productId", productId);
      if (month) params.set("month", month);
      const res = await fetch(`/api/sales?${params}`);
      const data = await res.json();
      set({ sales: data });
    } finally {
      set({ loading: false });
    }
  },

  addSale: async (payload) => {
    const res = await fetch("/api/sales", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || "Failed to record sale");
    }
    const sale: Sale = await res.json();
    set((s) => ({ sales: [sale, ...s.sales] }));
    return sale;
  },

  deleteSale: async (id) => {
    const res = await fetch(`/api/sales?id=${id}`, { method: "DELETE" });
    if (!res.ok) throw new Error("Failed to delete sale");
    set((s) => ({ sales: s.sales.filter((x) => x.id !== id) }));
  },
}));
