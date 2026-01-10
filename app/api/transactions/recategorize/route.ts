import { NextRequest, NextResponse } from "next/server";
import { db, schema } from "@/lib/db/connection";
import { eq, ne, and, isNull, or } from "drizzle-orm";
import { requireAuth, AuthError } from "@/lib/auth/api-helper";

// POST /api/transactions/recategorize
export async function POST(request: NextRequest) {
  try {
    const { userId } = await requireAuth(request);

    const { mode = "uncategorized" } = await request.json();

    const now = new Date();

    // Get all categories with keywords for this user
    const categories = await db
      .select()
      .from(schema.categories)
      .where(eq(schema.categories.userId, userId));

    // Get the special categories for this user
    const excludedCat = categories.find((c) => c.name === "Excluded");
    const uncategorizedCat = categories.find((c) => c.name === "Uncategorized");

    // Get transactions to recategorize for this user
    let transactions;
    if (mode === "uncategorized") {
      // Uncategorized transactions have categoryId = null OR categoryId = uncategorizedCat.id
      const uncategorizedCondition = uncategorizedCat
        ? or(
            isNull(schema.transactions.categoryId),
            eq(schema.transactions.categoryId, uncategorizedCat.id)
          )
        : isNull(schema.transactions.categoryId);

      transactions = await db
        .select()
        .from(schema.transactions)
        .where(
          and(
            uncategorizedCondition,
            eq(schema.transactions.userId, userId)
          )
        );
    } else {
      // mode === "all" - get all non-excluded transactions for this user
      if (excludedCat) {
        // Need to handle null categoryId separately since ne() doesn't match null
        transactions = await db
          .select()
          .from(schema.transactions)
          .where(
            and(
              or(
                isNull(schema.transactions.categoryId),
                ne(schema.transactions.categoryId, excludedCat.id)
              ),
              eq(schema.transactions.userId, userId)
            )
          );
      } else {
        transactions = await db
          .select()
          .from(schema.transactions)
          .where(eq(schema.transactions.userId, userId));
      }
    }

    let processed = 0;
    let updated = 0;
    let conflicts = 0;

    // Categorizable categories (excluding system ones for matching)
    const matchableCategories = categories.filter(
      (c) => !c.isSystem || c.name === "Income"
    );

    for (const t of transactions) {
      processed++;
      const matchText = t.matchField.toLowerCase();

      // Find matching categories
      const matches = matchableCategories.filter((cat) =>
        cat.keywords.some((kw) => matchText.includes(kw.toLowerCase()))
      );

      if (matches.length === 1) {
        // Single match - assign
        await db
          .update(schema.transactions)
          .set({ categoryId: matches[0].id, updatedAt: now })
          .where(
            and(
              eq(schema.transactions.id, t.id),
              eq(schema.transactions.userId, userId)
            )
          );
        updated++;
      } else if (matches.length > 1) {
        // Multiple matches - conflict
        conflicts++;
      }
      // No matches - leave as is
    }

    return NextResponse.json({
      data: { processed, updated, conflicts },
      success: true,
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json(
        { error: error.message, success: false },
        { status: error.statusCode }
      );
    }
    console.error("POST /api/transactions/recategorize error:", error);
    return NextResponse.json(
      { error: "Failed to recategorize transactions", success: false },
      { status: 500 }
    );
  }
}
