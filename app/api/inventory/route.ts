import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const withLog = searchParams.get("withLog") === "true";

  const products = await prisma.product.findMany({
    orderBy: { createdAt: "asc" },
    include: withLog
      ? { stockMovements: { orderBy: { date: "desc" }, take: 30 } }
      : undefined,
  });

  return NextResponse.json(products);
}
