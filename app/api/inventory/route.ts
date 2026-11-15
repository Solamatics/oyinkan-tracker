import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: unknown;
  try {
    body = await req.json();
  } catch (error) {
    if (error instanceof SyntaxError)
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    throw error;
  }

  if (typeof body !== "object" || body === null || Array.isArray(body))
    return NextResponse.json(
      { error: "Invalid product details" },
      { status: 400 },
    );

  const fields = body as Record<string, unknown>;
  const name = typeof fields.name === "string" ? fields.name.trim() : "";
  const unit = typeof fields.unit === "string" ? fields.unit.trim() : "";
  const defaultPrice = fields.defaultPrice ?? 0;
  const lowStockAlert = fields.lowStockAlert ?? 5;
  const quantity = fields.quantity ?? 0;

  if (!name || !unit)
    return NextResponse.json(
      { error: "Product name and unit are required" },
      { status: 400 },
    );

  if (name.length > 100 || unit.length > 40)
    return NextResponse.json(
      {
        error:
          "Product name must be at most 100 characters and unit at most 40",
      },
      { status: 400 },
    );

  if (
    typeof defaultPrice !== "number" ||
    !Number.isFinite(defaultPrice) ||
    defaultPrice < 0
  )
    return NextResponse.json(
      { error: "Default price must be a non-negative number" },
      { status: 400 },
    );

  if (
    typeof lowStockAlert !== "number" ||
    !Number.isInteger(lowStockAlert) ||
    lowStockAlert < 0
  )
    return NextResponse.json(
      { error: "Low-stock alert must be a non-negative whole number" },
      { status: 400 },
    );

  if (
    typeof quantity !== "number" ||
    !Number.isInteger(quantity) ||
    quantity < 0
  )
    return NextResponse.json(
      { error: "Initial quantity must be a non-negative whole number" },
      { status: 400 },
    );

  try {
    const product = await prisma.$transaction(async (tx) => {
      const created = await tx.product.create({
        data: {
          name,
          unit,
          defaultPrice,
          lowStockAlert,
          currentStock: quantity,
          isActive: true,
        },
      });

      if (quantity > 0) {
        await tx.stockMovement.create({
          data: {
            productId: created.id,
            type: "restock",
            quantity,
            note: "Initial stock",
          },
        });
      }

      return tx.product.findUniqueOrThrow({
        where: { id: created.id },
        include: {
          _count: { select: { sales: true, stockMovements: true } },
          stockMovements: { orderBy: { date: "desc" }, take: 30 },
        },
      });
    });
    return NextResponse.json(product, { status: 201 });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    )
      return NextResponse.json(
        { error: "A product with this name already exists" },
        { status: 409 },
      );
    throw error;
  }
}

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const withLog = searchParams.get("withLog") === "true";

  const products = await prisma.product.findMany({
    orderBy: { createdAt: "asc" },
    include: {
      _count: { select: { sales: true, stockMovements: true } },
      ...(withLog && {
        stockMovements: { orderBy: { date: "desc" as const }, take: 30 },
      }),
    },
  });

  return NextResponse.json(products);
}
