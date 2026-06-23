"use client";

import { useEffect, useState } from "react";
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
import { Badge } from "@/components/ui/badge";
import { formatNaira, formatDate } from "@/lib/utils";
import { Loader2, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { Product } from "@/types";

function StockBadge({ product }: { product: Product }) {
  if (product.currentStock === 0)
    return <Badge variant="destructive">Out of stock</Badge>;
  if (product.currentStock <= product.lowStockAlert)
    return (
      <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100">
        Low stock
      </Badge>
    );
  return (
    <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
      In stock
    </Badge>
  );
}

export default function InventoryPage() {
  const { products, loading, fetchProducts, updateStock, updateSettings } =
    useInventoryStore();

  const [selectedId, setSelectedId] = useState("");
  const [action, setAction] = useState<"add" | "set">("add");
  const [quantity, setQuantity] = useState("1");
  const [cost, setCost] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchProducts(true);
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedId || !quantity) return;
    setSubmitting(true);
    try {
      await updateStock(
        selectedId,
        action,
        Number(quantity),
        cost ? Number(cost) : undefined
      );
      toast.success("Stock updated");
      setQuantity("1");
      setCost("");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update stock");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleLowAlertChange(id: string, val: string) {
    const n = Number(val);
    if (isNaN(n)) return;
    try {
      await updateSettings(id, { lowStockAlert: n });
      toast.success("Alert threshold updated");
    } catch {
      toast.error("Failed to update");
    }
  }

  async function handleDefaultPriceChange(id: string, val: string) {
    const n = Number(val);
    if (isNaN(n)) return;
    try {
      await updateSettings(id, { defaultPrice: n });
      toast.success("Default price updated");
    } catch {
      toast.error("Failed to update");
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold">Inventory</h1>

      {/* Update stock form */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium">Update stock</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="space-y-1.5">
                <Label>Product</Label>
                <Select value={selectedId} onValueChange={setSelectedId}>
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
                <Label>Action</Label>
                <Select
                  value={action}
                  onValueChange={(v) => setAction(v as "add" | "set")}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="add">Add stock (restock)</SelectItem>
                    <SelectItem value="set">Set stock (full count)</SelectItem>
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
                <Label>Restock cost (₦, optional)</Label>
                <Input
                  type="number"
                  min="0"
                  placeholder="0"
                  value={cost}
                  onChange={(e) => setCost(e.target.value)}
                />
              </div>
            </div>

            <Button type="submit" disabled={submitting} size="sm">
              {submitting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="mr-2 h-4 w-4" />
              )}
              Update stock
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Products grid */}
      {loading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 gap-4">
          {products.map((p) => (
            <Card key={p.id}>
              <CardContent className="pt-5">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="font-medium text-sm">{p.name}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      per {p.unit}
                    </p>
                  </div>
                  <StockBadge product={p} />
                </div>

                <p className="text-3xl font-semibold tabular-nums mb-4">
                  {p.currentStock}
                </p>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs">Low stock alert at</Label>
                    <Input
                      type="number"
                      min="0"
                      defaultValue={p.lowStockAlert}
                      className="h-8 text-xs"
                      onBlur={(e) =>
                        handleLowAlertChange(p.id, e.target.value)
                      }
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Default price (₦)</Label>
                    <Input
                      type="number"
                      min="0"
                      defaultValue={p.defaultPrice}
                      className="h-8 text-xs"
                      onBlur={(e) =>
                        handleDefaultPriceChange(p.id, e.target.value)
                      }
                    />
                  </div>
                </div>

                {/* Stock movement log */}
                {p.stockMovements && p.stockMovements.length > 0 && (
                  <div className="mt-4 space-y-1.5">
                    <p className="text-xs font-medium text-muted-foreground">
                      Recent movements
                    </p>
                    {p.stockMovements.slice(0, 5).map((m) => (
                      <div
                        key={m.id}
                        className="flex items-center justify-between text-xs py-1 border-b last:border-0"
                      >
                        <div className="flex items-center gap-2">
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              m.type === "sale"
                                ? "bg-red-500"
                                : m.type === "restock"
                                ? "bg-green-500"
                                : "bg-amber-500"
                            }`}
                          />
                          <span className="capitalize text-muted-foreground">
                            {m.type}
                          </span>
                        </div>
                        <span
                          className={
                            m.quantity > 0 ? "text-green-600" : "text-red-500"
                          }
                        >
                          {m.quantity > 0 ? "+" : ""}
                          {m.quantity}
                        </span>
                        <span className="text-muted-foreground">
                          {formatDate(m.date)}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}