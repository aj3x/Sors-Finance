import { NextRequest, NextResponse } from "next/server";
import { db, schema } from "@/lib/db/connection";
import { validateSession } from "@/lib/auth/session";
import { getSessionCookie, clearSessionCookie } from "@/lib/auth/cookies";
import { eq } from "drizzle-orm";

// GET /api/auth/me
export async function GET(request: NextRequest) {
  try {
    // Get token from cookie
    const token = getSessionCookie(request);

    if (!token) {
      return NextResponse.json(
        { error: "Unauthorized", success: false },
        { status: 401 }
      );
    }

    // Validate session
    const result = await validateSession(db, token);

    if (!result) {
      return NextResponse.json(
        { error: "Unauthorized", success: false },
        { status: 401 }
      );
    }

    return NextResponse.json({
      success: true,
      user: {
        id: result.user.id,
        uuid: result.user.uuid,
        username: result.user.username,
      },
    });
  } catch (error) {
    console.error("GET /api/auth/me error:", error);
    return NextResponse.json(
      { error: "Failed to get user", success: false },
      { status: 500 }
    );
  }
}

// DELETE /api/auth/me - Delete user account and all associated data
export async function DELETE(request: NextRequest) {
  try {
    // Get token from cookie
    const token = getSessionCookie(request);

    if (!token) {
      return NextResponse.json(
        { error: "Unauthorized", success: false },
        { status: 401 }
      );
    }

    // Validate session
    const result = await validateSession(db, token);

    if (!result) {
      return NextResponse.json(
        { error: "Unauthorized", success: false },
        { status: 401 }
      );
    }

    const userId = result.user.id;

    // Manually delete all user data in correct order (reverse of dependencies)
    // This ensures deletion works even if cascade isn't functioning
    await db.delete(schema.portfolioSnapshots).where(eq(schema.portfolioSnapshots.userId, userId));
    await db.delete(schema.portfolioItems).where(eq(schema.portfolioItems.userId, userId));
    await db.delete(schema.portfolioAccounts).where(eq(schema.portfolioAccounts.userId, userId));
    await db.delete(schema.budgets).where(eq(schema.budgets.userId, userId));
    await db.delete(schema.transactions).where(eq(schema.transactions.userId, userId));
    await db.delete(schema.imports).where(eq(schema.imports.userId, userId));
    await db.delete(schema.categories).where(eq(schema.categories.userId, userId));
    await db.delete(schema.settings).where(eq(schema.settings.userId, userId));
    await db.delete(schema.sessions).where(eq(schema.sessions.userId, userId));

    // Finally delete the user
    await db.delete(schema.users).where(eq(schema.users.id, userId));

    // Clear the session cookie
    const response = NextResponse.json({
      success: true,
      message: "Account deleted successfully",
    });

    clearSessionCookie(response);

    return response;
  } catch (error) {
    console.error("DELETE /api/auth/me error:", error);
    return NextResponse.json(
      { error: "Failed to delete account", success: false },
      { status: 500 }
    );
  }
}
