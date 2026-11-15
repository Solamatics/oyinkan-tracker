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
import { formatDate } from "@/lib/utils";
import {
  Archive,
  ArchiveRestore,
  Loader2,
  Plus,
  RefreshCw,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { Product } from "@/types";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

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
  const {
    products,
    loading,
    fetchProducts,
    updateStock,
    updateSettings,
    createProduct,
    setProductArchived,
    deleteProduct,
  } = useInventoryStore();

  console.log("products", products);

  const [selectedId, setSelectedId] = useState("");
  const [action, setAction] = useState<"add" | "set">("add");
  const [quantity, setQuantity] = useState("1");
  const [cost, setCost] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [creatingProduct, setCreatingProduct] = useState(false);
  const [newProductName, setNewProductName] = useState("");
  const [newProductUnit, setNewProductUnit] = useState("");
  const [newProductPrice, setNewProductPrice] = useState("0");
  const [newProductLowStockAlert, setNewProductLowStockAlert] = useState("5");
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);
  const [productToArchive, setProductToArchive] = useState<Product | null>(
    null,
  );
  const [deleting, setDeleting] = useState(false);
  const [archiving, setArchiving] = useState(false);

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
        cost ? Number(cost) : undefined,
      );
      toast.success("Stock updated");
      setQuantity("1");
      setCost("");
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to update stock",
      );
    } finally {
      setSubmitting(false);
    }
  }

  async function handleCreateProduct(e: React.FormEvent) {
    e.preventDefault();
    setCreatingProduct(true);
    try {
      await createProduct({
        name: newProductName.trim(),
        unit: newProductUnit.trim(),
        defaultPrice: Number(newProductPrice),
        quantity: Number(quantity),
        lowStockAlert: Number(newProductLowStockAlert),
      });
      toast.success("Product added");
      setNewProductName("");
      setNewProductUnit("");
      setNewProductPrice("0");
      setNewProductLowStockAlert("5");
      setQuantity("1");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to add product");
    } finally {
      setCreatingProduct(false);
    }
  }

  async function confirmArchiveProduct() {
    if (!productToArchive) return;
    setArchiving(true);
    try {
      await setProductArchived(productToArchive.id, true);
      toast.success("Product archived");
      setProductToArchive(null);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to archive product",
      );
    } finally {
      setArchiving(false);
    }
  }

  async function confirmDeleteProduct() {
    if (!productToDelete) return;
    setDeleting(true);
    try {
      await deleteProduct(productToDelete.id);
      toast.success("Product deleted");
      setProductToDelete(null);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to delete product",
      );
    } finally {
      setDeleting(false);
    }
  }

  async function handleLowAlertChange(id: string, val: string, current: number) {
  const n = Number(val);
  if (val.trim() === "" || isNaN(n)) return;
  if (n === current) return;
  try {
    await updateSettings(id, { lowStockAlert: n });
    toast.success("Alert threshold updated");
  } catch {
    toast.error("Failed to update");
  }
}

async function handleDefaultPriceChange(id: string, val: string, current: number) {
  const n = Number(val);
  if (val.trim() === "" || isNaN(n)) return;
  if (n === current) return;
  try {
    await updateSettings(id, { defaultPrice: n });
    toast.success("Default price updated");
  } catch {
    toast.error("Failed to update");
  }
}

  return (
    <>
      <div className="space-y-6">
        <h1 className="text-xl font-semibold">Inventory</h1>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Add product</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreateProduct} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div className="space-y-1.5">
                  <Label htmlFor="new-product-name">Product name</Label>
                  <Input
                    id="new-product-name"
                    value={newProductName}
                    onChange={(e) => setNewProductName(e.target.value)}
                    required
                    maxLength={100}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="new-product-unit">Unit</Label>
                  <Input
                    id="new-product-unit"
                    placeholder="e.g. jar, pack, bottle"
                    value={newProductUnit}
                    onChange={(e) => setNewProductUnit(e.target.value)}
                    required
                    maxLength={40}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="new-product-price">Default price (₦)</Label>
                  <Input
                    id="new-product-price"
                    type="number"
                    min="0"
                    step="0.01"
                    value={newProductPrice}
                    onChange={(e) => setNewProductPrice(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="new-product-quantity">Quantity</Label>
                  <Input
                    id="new-product-quantity"
                    type="number"
                    min="0"
                    step="1"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="new-product-low-stock">
                    Low stock alert at
                  </Label>
                  <Input
                    id="new-product-low-stock"
                    type="number"
                    min="0"
                    step="1"
                    value={newProductLowStockAlert}
                    onChange={(e) => setNewProductLowStockAlert(e.target.value)}
                    required
                  />
                </div>
              </div>
              <Button type="submit" disabled={creatingProduct} size="sm">
                {creatingProduct ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Plus className="mr-2 h-4 w-4" />
                )}
                Add product
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Update stock form here */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Update stock</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div className="space-y-1.5">
                  <Label>Product</Label>
                  <Select value={selectedId} onValueChange={setSelectedId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select product" />
                    </SelectTrigger>
                    <SelectContent>
                      {products
                        .filter((p) => p.isActive)
                        .map((p) => (
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
                      <SelectItem value="set">
                        Set stock (full count)
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label>Quantity</Label>
                  <Input
                    type="number"
                    min={action === "set" ? "0" : "1"}
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
            <Loader2 className="text-muted-foreground h-5 w-5 animate-spin" />
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {products.map((p) => (
              <Card key={p.id}>
                <CardContent className="pt-5">
                  <div className="mb-3 flex items-start justify-between">
                    <div>
                      <p className="text-sm font-medium">{p.name}</p>
                      <p className="text-muted-foreground mt-0.5 text-xs">
                        per {p.unit}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {p.isActive ? (
                        <StockBadge product={p} />
                      ) : (
                        <Badge variant="secondary">Archived</Badge>
                      )}
                      {p._count?.sales || p._count?.stockMovements ? (
                        <Button
                          type="button"
                          variant="outline"
                          size="icon-sm"
                          title={
                            p.isActive ? "Archive product" : "Restore product"
                          }
                          aria-label={
                            p.isActive ? "Archive product" : "Restore product"
                          }
                          onClick={() => setProductToArchive(p)}
                        >
                          {p.isActive ? <Archive /> : <ArchiveRestore />}
                        </Button>
                      ) : (
                        <Button
                          type="button"
                          variant="outline"
                          size="icon-sm"
                          title="Delete product"
                          aria-label="Delete product"
                          onClick={() => setProductToDelete(p)}
                        >
                          <Trash2 />
                        </Button>
                      )}
                    </div>
                  </div>

                  <p className="mb-4 text-3xl font-semibold tabular-nums">
                    {p.currentStock}
                  </p>

                  {p.isActive ? (
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <Label className="text-xs">Low stock alert at</Label>
                        <Input
                          type="number"
                          min="0"
                          defaultValue={p.lowStockAlert}
                          className="h-8 text-xs"
                           onBlur={(e) => handleLowAlertChange(p.id, e.target.value, p.lowStockAlert)}
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Default price (₦)</Label>
                        <Input
                          type="number"
                          min="0"
                          defaultValue={p.defaultPrice}
                          className="h-8 text-xs"
                          onBlur={(e) => handleDefaultPriceChange(p.id, e.target.value, p.defaultPrice)}
                        />
                      </div>
                    </div>
                  ) : (
                    <p className="text-muted-foreground text-xs">
                      Archived products are unavailable for new sales and stock
                      updates.
                    </p>
                  )}

                  {/* Stock movement log */}
                  {p.stockMovements && p.stockMovements.length > 0 && (
                    <div className="mt-4 space-y-1.5">
                      <p className="text-muted-foreground text-xs font-medium">
                        Recent movements
                      </p>
                      {p.stockMovements.slice(0, 5).map((m) => (
                        <div
                          key={m.id}
                          className="flex items-center justify-between border-b py-1 text-xs last:border-0"
                        >
                          <div className="flex items-center gap-2">
                            <span
                              className={`h-1.5 w-1.5 rounded-full ${
                                m.type === "sale"
                                  ? "bg-red-500"
                                  : m.type === "restock"
                                    ? "bg-green-500"
                                    : "bg-amber-500"
                              }`}
                            />
                            <span className="text-muted-foreground capitalize">
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

      <AlertDialog
        open={productToDelete !== null}
        onOpenChange={(open) => {
          if (!open) setProductToDelete(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Delete &quot;{productToDelete?.name}&quot;?
            </AlertDialogTitle>
            <AlertDialogDescription>
              This cannot be undone. Products with sales or stock history cannot
              be deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeleteProduct}
              disabled={deleting}
              className="bg-destructive hover:bg-destructive/90 text-white"
            >
              {deleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={productToArchive !== null}
        onOpenChange={(open) => {
          if (!open) setProductToArchive(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Archive &quot;{productToArchive?.name}&quot;?
            </AlertDialogTitle>
            <AlertDialogDescription>
              This cannot be undone. Archived products will be moved to the
              archive section.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={archiving}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmArchiveProduct}
              disabled={archiving}
              className="bg-destructive hover:bg-destructive/90 text-white"
            >
              {archiving ? "Archiving..." : "Archive"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
