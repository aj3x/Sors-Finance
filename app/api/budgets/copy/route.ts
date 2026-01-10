import { NextRequest, NextResponse } from "next/server";
import { db, schema } from "@/lib/db/connection";
import { eq, and, isNull } from "drizzle-orm";
import { requireAuth, AuthError } from "@/lib/auth/api-helper";

// POST /api/budgets/copy
export async function POST(request: NextRequest) {
  try {
    const { userId } = await requireAuth(request);

    const { fromYear, fromMonth, toYear, toMonth } = await request.json();

    if (fromYear === undefined || toYear === undefined) {
      return NextResponse.json(
        { error: "fromYear and toYear are required", success: false },
        { status: 400 }
      );
    }

    const now = new Date();

    // Get source budgets for this user
    let sourceBudgets;
    if (fromMonth === null || fromMonth === undefined) {
      sourceBudgets = await db
        .select()
        .from(schema.budgets)
        .where(
          and(
            eq(schema.budgets.year, fromYear),
            isNull(schema.budgets.month),
            eq(schema.budgets.userId, userId)
          )
        );
    } else {
      sourceBudgets = await db
        .select()
        .from(schema.budgets)
        .where(
          and(
            eq(schema.budgets.year, fromYear),
            eq(schema.budgets.month, fromMonth),
            eq(schema.budgets.userId, userId)
          )
        );
    }

    if (sourceBudgets.length === 0) {
      return NextResponse.json(
        { data: { copied: 0 }, success: true }
      );
    }

    const toMonthValue = toMonth === undefined ? null : toMonth;
    let copiedCount = 0;

    for (const budget of sourceBudgets) {
      // Check if target budget already exists for this user
      let existing;
      if (toMonthValue === null) {
        existing = await db
          .select()
          .from(schema.budgets)
          .where(
            and(
              eq(schema.budgets.categoryId, budget.categoryId),
              eq(schema.budgets.year, toYear),
              isNull(schema.budgets.month),
              eq(schema.budgets.userId, userId)
            )
          )
          .limit(1);
      } else {
        existing = await db
          .select()
          .from(schema.budgets)
          .where(
            and(
              eq(schema.budgets.categoryId, budget.categoryId),
              eq(schema.budgets.year, toYear),
              eq(schema.budgets.month, toMonthValue),
              eq(schema.budgets.userId, userId)
            )
          )
          .limit(1);
      }

      // Only copy if target doesn't exist
      if (existing.length === 0) {
        await db.insert(schema.budgets).values({
          categoryId: budget.categoryId,
          year: toYear,
          month: toMonthValue,
          amount: budget.amount,
          userId,
          createdAt: now,
          updatedAt: now,
        });
        copiedCount++;
      }
    }

    return NextResponse.json({ data: { copied: copiedCount }, success: true });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json(
        { error: error.message, success: false },
        { status: error.statusCode }
      );
    }
    console.error("POST /api/budgets/copy error:", error);
    return NextResponse.json(
      { error: "Failed to copy budgets", success: false },
      { status: 500 }
    );
  }
}
