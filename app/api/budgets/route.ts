import { NextRequest, NextResponse } from "next/server";
import { db, schema } from "@/lib/db/connection";
import { eq, and, isNull } from "drizzle-orm";
import { requireAuth, AuthError } from "@/lib/auth/api-helper";

// GET /api/budgets?year=2024&month=1
export async function GET(request: NextRequest) {
  try {
    const { userId } = await requireAuth(request);

    const year = request.nextUrl.searchParams.get("year");
    const month = request.nextUrl.searchParams.get("month");

    if (!year) {
      return NextResponse.json(
        { error: "Year is required", success: false },
        { status: 400 }
      );
    }

    const yearNum = parseInt(year, 10);
    let results;

    if (month === null || month === "null" || month === "") {
      // Get yearly budgets (month is null) for this user
      results = await db
        .select()
        .from(schema.budgets)
        .where(
          and(
            eq(schema.budgets.year, yearNum),
            isNull(schema.budgets.month),
            eq(schema.budgets.userId, userId)
          )
        );
    } else {
      // Get monthly budgets for this user
      const monthNum = parseInt(month, 10);
      results = await db
        .select()
        .from(schema.budgets)
        .where(
          and(
            eq(schema.budgets.year, yearNum),
            eq(schema.budgets.month, monthNum),
            eq(schema.budgets.userId, userId)
          )
        );
    }

    const budgets = results.map((row) => ({
      id: row.id,
      categoryId: row.categoryId,
      year: row.year,
      month: row.month,
      amount: row.amount,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    }));

    return NextResponse.json({ data: budgets, success: true });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json(
        { error: error.message, success: false },
        { status: error.statusCode }
      );
    }
    console.error("GET /api/budgets error:", error);
    return NextResponse.json(
      { error: "Failed to fetch budgets", success: false },
      { status: 500 }
    );
  }
}

// POST /api/budgets (upsert)
export async function POST(request: NextRequest) {
  try {
    const { userId } = await requireAuth(request);

    const { categoryId, year, month, amount } = await request.json();

    if (!categoryId || !year || amount === undefined) {
      return NextResponse.json(
        { error: "categoryId, year, and amount are required", success: false },
        { status: 400 }
      );
    }

    const now = new Date();
    const monthValue = month === null || month === undefined ? null : month;

    // Check if budget exists for this user
    let existing;
    if (monthValue === null) {
      existing = await db
        .select()
        .from(schema.budgets)
        .where(
          and(
            eq(schema.budgets.categoryId, categoryId),
            eq(schema.budgets.year, year),
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
            eq(schema.budgets.categoryId, categoryId),
            eq(schema.budgets.year, year),
            eq(schema.budgets.month, monthValue),
            eq(schema.budgets.userId, userId)
          )
        )
        .limit(1);
    }

    let budgetId: number;

    if (existing.length > 0) {
      // Update existing
      await db
        .update(schema.budgets)
        .set({ amount, updatedAt: now })
        .where(
          and(
            eq(schema.budgets.id, existing[0].id),
            eq(schema.budgets.userId, userId)
          )
        );
      budgetId = existing[0].id;
    } else {
      // Create new
      const result = await db
        .insert(schema.budgets)
        .values({
          categoryId,
          year,
          month: monthValue,
          amount,
          userId,
          createdAt: now,
          updatedAt: now,
        })
        .returning({ id: schema.budgets.id });
      budgetId = result[0].id;
    }

    return NextResponse.json({ data: { id: budgetId }, success: true });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json(
        { error: error.message, success: false },
        { status: error.statusCode }
      );
    }
    console.error("POST /api/budgets error:", error);
    return NextResponse.json(
      { error: "Failed to save budget", success: false },
      { status: 500 }
    );
  }
}
