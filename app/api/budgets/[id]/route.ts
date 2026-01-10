import { NextRequest, NextResponse } from "next/server";
import { db, schema } from "@/lib/db/connection";
import { eq, and } from "drizzle-orm";
import { requireAuth, AuthError } from "@/lib/auth/api-helper";

type RouteContext = { params: Promise<{ id: string }> };

// DELETE /api/budgets/[id]
export async function DELETE(request: NextRequest, context: RouteContext) {
  try {
    const { userId } = await requireAuth(request);

    const { id } = await context.params;
    const budgetId = parseInt(id, 10);

    if (isNaN(budgetId)) {
      return NextResponse.json(
        { error: "Invalid budget ID", success: false },
        { status: 400 }
      );
    }

    // Check if budget exists and belongs to user
    const existing = await db
      .select()
      .from(schema.budgets)
      .where(
        and(
          eq(schema.budgets.id, budgetId),
          eq(schema.budgets.userId, userId)
        )
      )
      .limit(1);

    if (existing.length === 0) {
      return NextResponse.json(
        { error: "Budget not found", success: false },
        { status: 404 }
      );
    }

    await db
      .delete(schema.budgets)
      .where(
        and(
          eq(schema.budgets.id, budgetId),
          eq(schema.budgets.userId, userId)
        )
      );

    return NextResponse.json({ data: { deleted: true }, success: true });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json(
        { error: error.message, success: false },
        { status: error.statusCode }
      );
    }
    console.error("DELETE /api/budgets/[id] error:", error);
    return NextResponse.json(
      { error: "Failed to delete budget", success: false },
      { status: 500 }
    );
  }
}
