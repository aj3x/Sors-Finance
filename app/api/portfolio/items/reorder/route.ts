import { NextRequest, NextResponse } from "next/server";
import { db, schema } from "@/lib/db/connection";
import { eq, asc, and } from "drizzle-orm";
import { requireAuth, AuthError } from "@/lib/auth/api-helper";

// POST /api/portfolio/items/reorder
export async function POST(request: NextRequest) {
  try {
    const { userId } = await requireAuth(request);

    const { accountId, activeId, overId } = await request.json();

    if (!accountId || !activeId || !overId) {
      return NextResponse.json(
        { error: "accountId, activeId, and overId are required", success: false },
        { status: 400 }
      );
    }

    // Get all items for this account and user
    const items = await db
      .select()
      .from(schema.portfolioItems)
      .where(
        and(
          eq(schema.portfolioItems.accountId, accountId),
          eq(schema.portfolioItems.userId, userId)
        )
      )
      .orderBy(asc(schema.portfolioItems.order));

    // Find indices
    const activeIndex = items.findIndex((i) => i.id === activeId);
    const overIndex = items.findIndex((i) => i.id === overId);

    if (activeIndex === -1 || overIndex === -1) {
      return NextResponse.json(
        { error: "Item not found", success: false },
        { status: 404 }
      );
    }

    // Reorder array
    const [movedItem] = items.splice(activeIndex, 1);
    items.splice(overIndex, 0, movedItem);

    // Update order values
    const now = new Date();
    for (let i = 0; i < items.length; i++) {
      await db
        .update(schema.portfolioItems)
        .set({ order: i, updatedAt: now })
        .where(
          and(
            eq(schema.portfolioItems.id, items[i].id),
            eq(schema.portfolioItems.userId, userId)
          )
        );
    }

    return NextResponse.json({ data: { reordered: true }, success: true });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json(
        { error: error.message, success: false },
        { status: error.statusCode }
      );
    }
    console.error("POST /api/portfolio/items/reorder error:", error);
    return NextResponse.json(
      { error: "Failed to reorder items", success: false },
      { status: 500 }
    );
  }
}
