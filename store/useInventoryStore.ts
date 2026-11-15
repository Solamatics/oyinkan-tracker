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
  createProduct: (data: {
    name: string;
    unit: string;
    defaultPrice: number;
    lowStockAlert: number;
    quantity?: number;
  }) => Promise<void>;
  setProductArchived: (id: string, archived: boolean) => Promise<void>;
  deleteProduct: (id: string) => Promise<void>;
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
      products: s.products.map((p) =>
        p.id === id
          ? {
              ...p,
              ...updated,
              _count: {
                sales: p._count?.sales ?? 0,
                stockMovements: (p._count?.stockMovements ?? 0) + 1,
              },
            }
          : p,
      ),
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

  createProduct: async (data) => {
    const res = await fetch("/api/inventory", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    const result: Product | { error?: string } = await res.json();
    if (!res.ok) {
      throw new Error(
        "error" in result && result.error
          ? result.error
          : "Failed to create product",
      );
    }

    set((s) => ({ products: [...s.products, result as Product] }));
  },

  setProductArchived: async (id, archived) => {
    const res = await fetch(`/api/inventory/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: archived ? "archive" : "restore" }),
    });
    const result: Product | { error?: string } = await res.json();
    if (!res.ok) {
      throw new Error(
        "error" in result && result.error
          ? result.error
          : "Failed to update product",
      );
    }

    set((s) => ({
      products: s.products.map((p) => (p.id === id ? { ...p, ...result } : p)),
    }));
  },

  deleteProduct: async (id) => {
    const res = await fetch(`/api/inventory/${id}`, { method: "DELETE" });
    const result: { error?: string } = await res.json();
    if (!res.ok)
      throw new Error(result.error ?? "Failed to delete product");

    set((s) => ({ products: s.products.filter((p) => p.id !== id) }));
  },
}));
