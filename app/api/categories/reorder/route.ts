import { NextRequest, NextResponse } from "next/server";
import { db, schema } from "@/lib/db/connection";
import { eq, asc, and } from "drizzle-orm";
import { requireAuth, AuthError } from "@/lib/auth/api-helper";

// POST /api/categories/reorder
export async function POST(request: NextRequest) {
  try {
    const { userId } = await requireAuth(request);

    const { activeId, overId } = await request.json();

    if (!activeId || !overId) {
      return NextResponse.json(
        { error: "activeId and overId are required", success: false },
        { status: 400 }
      );
    }

    // Get all categories ordered for this user
    const categories = await db
      .select()
      .from(schema.categories)
      .where(eq(schema.categories.userId, userId))
      .orderBy(asc(schema.categories.order));

    // Find indices
    const activeIndex = categories.findIndex((c) => c.id === activeId);
    const overIndex = categories.findIndex((c) => c.id === overId);

    if (activeIndex === -1 || overIndex === -1) {
      return NextResponse.json(
        { error: "Category not found", success: false },
        { status: 404 }
      );
    }

    // Reorder array
    const [movedCategory] = categories.splice(activeIndex, 1);
    categories.splice(overIndex, 0, movedCategory);

    // Update order values
    const now = new Date();
    for (let i = 0; i < categories.length; i++) {
      await db
        .update(schema.categories)
        .set({ order: i, updatedAt: now })
        .where(
          and(
            eq(schema.categories.id, categories[i].id),
            eq(schema.categories.userId, userId)
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
    console.error("POST /api/categories/reorder error:", error);
    return NextResponse.json(
      { error: "Failed to reorder categories", success: false },
      { status: 500 }
    );
  }
}
