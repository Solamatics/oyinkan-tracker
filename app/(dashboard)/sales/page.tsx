"use client";

import { useEffect, useState } from "react";
import { useSalesStore } from "@/store/useSalesStore";
import { useInventoryStore } from "@/store/useInventoryStore";
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

export default function SalesPage() {
  const {
    sales,
    loading,
    fetchSales,
    addSale,
    deleteSale,
    filterProduct,
    filterMonth,
    setFilterProduct,
    setFilterMonth,
  } = useSalesStore();


  const { products, fetchProducts } = useInventoryStore();

  const [productId, setProductId] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [unitPrice, setUnitPrice] = useState("");
  const [note, setNote] = useState("");
  const [date, setDate] = useState(todayStr());
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchProducts();
    fetchSales();
  }, []);

  useEffect(() => {
    fetchSales(filterProduct || undefined, filterMonth || undefined);
  }, [filterProduct, filterMonth]);

  const total = (Number(quantity) || 0) * (Number(unitPrice) || 0);

  function handleProductChange(id: string) {
    setProductId(id);
    const p = products.find((x) => x.id === id);
    if (p && p.defaultPrice > 0) setUnitPrice(String(p.defaultPrice));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!productId || !quantity || !unitPrice || !date) return;
    setSubmitting(true);
    try {
      await addSale({
        productId,
        quantity: Number(quantity),
        unitPrice: Number(unitPrice),
        note,
        date,
      });
      toast.success("Sale recorded");
      setProductId("");
      setQuantity("1");
      setUnitPrice("");
      setNote("");
      setDate(todayStr());
      fetchProducts();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to record sale");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this sale? Stock will be restored.")) return;
    try {
      await deleteSale(id);
      fetchProducts();
      toast.success("Sale deleted");
    } catch {
      toast.error("Failed to delete");
    }
  }

  const totalAmount = sales.reduce((a, s) => a + s.total, 0);

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold">Sales</h1>

      {/* Form */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium">Record a sale</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="space-y-1.5">
                <Label>Product</Label>
                <Select value={productId} onValueChange={handleProductChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select product" />
                  </SelectTrigger>
                  <SelectContent>
                    {products.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label>Quantity</Label>
                <Input
                  type="number"
                  min="1"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label>Unit price (₦)</Label>
                <Input
                  type="number"
                  min="0"
                  placeholder="0"
                  value={unitPrice}
                  onChange={(e) => setUnitPrice(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label>Total</Label>
                <Input
                  value={total > 0 ? formatNaira(total) : "—"}
                  readOnly
                  className="bg-muted"
                />
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Date</Label>
                <Input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label>Note (optional)</Label>
                <Input
                  placeholder="e.g. customer name"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                />
              </div>
            </div>

            <Button type="submit" disabled={submitting} size="sm">
              {submitting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Plus className="mr-2 h-4 w-4" />
              )}
              Record sale
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* History */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <CardTitle className="text-sm font-medium">Sales history</CardTitle>
            <div className="flex flex-wrap gap-2">
              <Select value={filterProduct} onValueChange={setFilterProduct}>
                <SelectTrigger className="w-44 h-8 text-xs">
                  <SelectValue placeholder="All products" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All products</SelectItem>
                  {products.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name}
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
          ) : sales.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              No sales found
            </p>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left font-medium text-muted-foreground pb-2 pr-4">Date</th>
                      <th className="text-left font-medium text-muted-foreground pb-2 pr-4">Product</th>
                      <th className="text-right font-medium text-muted-foreground pb-2 pr-4">Qty</th>
                      <th className="text-right font-medium text-muted-foreground pb-2 pr-4">Price</th>
                      <th className="text-right font-medium text-muted-foreground pb-2 pr-4">Total</th>
                      <th className="pb-2"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {sales.map((s) => (
                      <tr key={s.id} className="border-b last:border-0">
                        <td className="py-2.5 pr-4 text-muted-foreground">
                          {formatDate(s.date)}
                        </td>
                        <td className="py-2.5 pr-4">{s.product.name}</td>
                        <td className="py-2.5 pr-4 text-right tabular-nums">
                          {s.quantity}
                        </td>
                        <td className="py-2.5 pr-4 text-right tabular-nums">
                          {formatNaira(s.unitPrice)}
                        </td>
                        <td className="py-2.5 pr-4 text-right tabular-nums font-medium text-green-600">
                          {formatNaira(s.total)}
                        </td>
                        <td className="py-2.5">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-muted-foreground hover:text-destructive"
                            onClick={() => handleDelete(s.id)}
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
                Total: {formatNaira(totalAmount)}
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}