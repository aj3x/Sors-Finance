/**
 * API Route: Delete Plaid Item
 * DELETE /api/plaid/items/[id]
 */

import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/api-helper";
import { db, schema } from "@/lib/db/connection";
import { eq, and, inArray } from "drizzle-orm";

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await requireAuth(req);
    const { id } = await params;
    const itemId = parseInt(id);

    if (isNaN(itemId)) {
      return NextResponse.json({ error: "Invalid item ID" }, { status: 400 });
    }

    console.log(`[DELETE Plaid Item] Starting deletion for itemId: ${itemId}, userId: ${userId}`);

    // Get all Plaid accounts for this item to find linked portfolio accounts
    const plaidAccountsForItem = await db
      .select()
      .from(schema.plaidAccounts)
      .where(
        and(
          eq(schema.plaidAccounts.plaidItemId, itemId),
          eq(schema.plaidAccounts.userId, userId)
        )
      );

    console.log(`[DELETE Plaid Item] Found ${plaidAccountsForItem.length} plaid accounts`);

    // Get portfolio account IDs that are linked to these Plaid accounts
    const portfolioAccountIds = plaidAccountsForItem
      .map(acc => acc.portfolioAccountId)
      .filter((id): id is number => id !== null);

    console.log(`[DELETE Plaid Item] Found ${portfolioAccountIds.length} linked portfolio accounts:`, portfolioAccountIds);

    // Delete linked portfolio accounts (will cascade delete portfolio items inside them)
    if (portfolioAccountIds.length > 0) {
      try {
        // First delete the portfolio items manually to avoid constraint issues
        await db
          .delete(schema.portfolioItems)
          .where(
            and(
              eq(schema.portfolioItems.userId, userId),
              inArray(schema.portfolioItems.accountId, portfolioAccountIds)
            )
          );
        console.log(`[DELETE Plaid Item] Deleted portfolio items for accounts:`, portfolioAccountIds);

        // Then delete the portfolio accounts
        for (const accountId of portfolioAccountIds) {
          await db
            .delete(schema.portfolioAccounts)
            .where(
              and(
                eq(schema.portfolioAccounts.userId, userId),
                eq(schema.portfolioAccounts.id, accountId)
              )
            );
        }
        console.log(`[DELETE Plaid Item] Deleted ${portfolioAccountIds.length} portfolio accounts`);
      } catch (err) {
        console.error('[DELETE Plaid Item] Error deleting portfolio accounts:', err);
        throw err;
      }
    }

    // Delete Plaid accounts
    try {
      const deletedPlaidAccounts = await db
        .delete(schema.plaidAccounts)
        .where(
          and(
            eq(schema.plaidAccounts.plaidItemId, itemId),
            eq(schema.plaidAccounts.userId, userId)
          )
        )
        .returning();
      console.log(`[DELETE Plaid Item] Deleted ${deletedPlaidAccounts.length} plaid accounts`);
    } catch (err) {
      console.error('[DELETE Plaid Item] Error deleting plaid accounts:', err);
      throw err;
    }

    // Delete the Plaid item itself
    try {
      const result = await db
        .delete(schema.plaidItems)
        .where(
          and(
            eq(schema.plaidItems.id, itemId),
            eq(schema.plaidItems.userId, userId)
          )
        )
        .returning();

      if (result.length === 0) {
        return NextResponse.json(
          { error: "Item not found or unauthorized" },
          { status: 404 }
        );
      }

      console.log(`[DELETE Plaid Item] Successfully deleted plaid item ${itemId}`);
    } catch (err) {
      console.error('[DELETE Plaid Item] Error deleting plaid item:', err);
      throw err;
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[DELETE Plaid Item] Full error:", error);
    return NextResponse.json(
      { 
        error: "Failed to delete item",
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}
