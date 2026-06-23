export interface Product {
  id: string;
  name: string;
  unit: string;
  defaultPrice: number;
  lowStockAlert: number;
  currentStock: number;
  createdAt: string;
}

export interface Sale {
  id: string;
  productId: string;
  product: Product;
  quantity: number;
  unitPrice: number;
  total: number;
  note: string | null;
  date: string;
  createdAt: string;
}

export interface Expense {
  id: string;
  category: string;
  description: string | null;
  amount: number;
  date: string;
  createdAt: string;
}

export interface StockMovement {
  id: string;
  productId: string;
  product: Product;
  type: "sale" | "restock" | "adjustment";
  quantity: number;
  note: string | null;
  date: string;
}

export interface MonthlySummary {
  id: string;
  year: number;
  month: number;
  totalRevenue: number;
  totalExpense: number;
  netProfit: number;
  totalSales: number;
}

export interface ReportData {
  summary: MonthlySummary;
  salesByProduct: { productName: string; total: number; quantity: number }[];
  expensesByCategory: { category: string; total: number }[];
  last6Months: MonthlySummary[];
}
