import { create } from "zustand";
import { Product } from "@/types";

interface InventoryState {
  products: Product[];
  loading: boolean;
  fetchProducts: (withLog?: boolean) => Promise<void>;
  updateStock: (
    id: string,
    action: "add" | "set",
    quantity: number,
    cost?: number,
  ) => Promise<void>;
  updateSettings: (
    id: string,
    data: { lowStockAlert?: number; defaultPrice?: number },
  ) => Promise<void>;
}

export const useInventoryStore = create<InventoryState>((set) => ({
  products: [],
  loading: false,

  fetchProducts: async (withLog = false) => {
    set({ loading: true });
    const res = await fetch(`/api/inventory?withLog=${withLog}`);
    const data = await res.json();
    set({ products: data, loading: false });
  },

  updateStock: async (id, action, quantity, cost) => {
    const res = await fetch(`/api/inventory/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, quantity, cost }),
    });
    if (!res.ok) throw new Error("Failed to update stock");
    const updated: Product = await res.json();
    set((s) => ({
      products: s.products.map((p) => (p.id === id ? { ...p, ...updated } : p)),
    }));
  },

  updateSettings: async (id, data) => {
    const res = await fetch(`/api/inventory/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "settings", ...data }),
    });
    if (!res.ok) throw new Error("Failed to update settings");
    const updated: Product = await res.json();
    set((s) => ({
      products: s.products.map((p) => (p.id === id ? { ...p, ...updated } : p)),
    }));
  },
}));
