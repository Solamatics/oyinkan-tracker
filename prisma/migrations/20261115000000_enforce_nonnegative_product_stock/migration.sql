INSERT INTO "StockMovement" ("id", "productId", "type", "quantity", "note", "date")
SELECT
  'stock-adjustment-' || gen_random_uuid()::text,
  "id",
  'adjustment',
  -"currentStock",
  'Corrected negative stock to zero',
  CURRENT_TIMESTAMP
FROM "Product"
WHERE "currentStock" < 0;

UPDATE "Product"
SET "currentStock" = 0
WHERE "currentStock" < 0;

ALTER TABLE "Product"
ADD CONSTRAINT "Product_currentStock_nonnegative"
CHECK ("currentStock" >= 0);
