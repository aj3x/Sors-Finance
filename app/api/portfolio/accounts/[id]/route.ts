import { NextRequest, NextResponse } from "next/server";
import { db, schema } from "@/lib/db/connection";
import { eq, and } from "drizzle-orm";
import { requireAuth, AuthError } from "@/lib/auth/api-helper";

type RouteContext = { params: Promise<{ id: string }> };

// GET /api/portfolio/accounts/[id]
export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const { userId } = await requireAuth(request);

    const { id } = await context.params;
    const accountId = parseInt(id, 10);

    if (isNaN(accountId)) {
      return NextResponse.json(
        { error: "Invalid account ID", success: false },
        { status: 400 }
      );
    }

    const result = await db
      .select()
      .from(schema.portfolioAccounts)
      .where(
        and(
          eq(schema.portfolioAccounts.id, accountId),
          eq(schema.portfolioAccounts.userId, userId)
        )
      )
      .limit(1);

    if (result.length === 0) {
      return NextResponse.json(
        { error: "Account not found", success: false },
        { status: 404 }
      );
    }

    return NextResponse.json({ data: result[0], success: true });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json(
        { error: error.message, success: false },
        { status: error.statusCode }
      );
    }
    console.error("GET /api/portfolio/accounts/[id] error:", error);
    return NextResponse.json(
      { error: "Failed to fetch account", success: false },
      { status: 500 }
    );
  }
}

// PUT /api/portfolio/accounts/[id]
export async function PUT(request: NextRequest, context: RouteContext) {
  try {
    const { userId } = await requireAuth(request);

    const { id } = await context.params;
    const accountId = parseInt(id, 10);

    if (isNaN(accountId)) {
      return NextResponse.json(
        { error: "Invalid account ID", success: false },
        { status: 400 }
      );
    }

    const { name } = await request.json();
    const now = new Date();

    await db
      .update(schema.portfolioAccounts)
      .set({ name, updatedAt: now })
      .where(
        and(
          eq(schema.portfolioAccounts.id, accountId),
          eq(schema.portfolioAccounts.userId, userId)
        )
      );

    return NextResponse.json({ data: { updated: true }, success: true });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json(
        { error: error.message, success: false },
        { status: error.statusCode }
      );
    }
    console.error("PUT /api/portfolio/accounts/[id] error:", error);
    return NextResponse.json(
      { error: "Failed to update account", success: false },
      { status: 500 }
    );
  }
}

// DELETE /api/portfolio/accounts/[id]
export async function DELETE(request: NextRequest, context: RouteContext) {
  try {
    const { userId } = await requireAuth(request);

    const { id } = await context.params;
    const accountId = parseInt(id, 10);

    if (isNaN(accountId)) {
      return NextResponse.json(
        { error: "Invalid account ID", success: false },
        { status: 400 }
      );
    }

    // Unlink any Plaid accounts that reference this portfolio account
    await db
      .update(schema.plaidAccounts)
      .set({ portfolioAccountId: null })
      .where(eq(schema.plaidAccounts.portfolioAccountId, accountId));

    // Delete portfolio items for this account (cascade)
    await db
      .delete(schema.portfolioItems)
      .where(
        and(
          eq(schema.portfolioItems.accountId, accountId),
          eq(schema.portfolioItems.userId, userId)
        )
      );

    // Delete the portfolio account itself
    await db
      .delete(schema.portfolioAccounts)
      .where(
        and(
          eq(schema.portfolioAccounts.id, accountId),
          eq(schema.portfolioAccounts.userId, userId)
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
    console.error("DELETE /api/portfolio/accounts/[id] error:", error);
    return NextResponse.json(
      { error: "Failed to delete account", success: false },
      { status: 500 }
    );
  }
}
