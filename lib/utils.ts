import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatNaira(amount: number): string {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatDate(date: string | Date): string {
  return new Intl.DateTimeFormat("en-NG", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(date));
}

export function monthLabel(year: number, month: number): string {
  return new Intl.DateTimeFormat("en-NG", {
    month: "long",
    year: "numeric",
  }).format(new Date(year, month - 1));
}

export function percentChange(
  current: number,
  previous: number,
): number | null {
  if (previous === 0) return null;
  return Math.round(((current - previous) / previous) * 100);
}

export const EXPENSE_CATEGORIES = [
  "Restock / supplier",
  "Packaging",
  "Transport / logistics",
  "Marketing",
  "Platform fee",
  "Other",
] as const;

export type ExpenseCategory = (typeof EXPENSE_CATEGORIES)[number];
