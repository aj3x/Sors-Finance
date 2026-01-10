import { NextRequest, NextResponse } from "next/server";
import { db, schema } from "@/lib/db/connection";
import { hashPassword } from "@/lib/auth/password";
import { createSession } from "@/lib/auth/session";
import { setSessionCookie } from "@/lib/auth/cookies";
import { seedDefaultCategoriesForUser } from "@/lib/db/seed";
import { eq, isNull, sql } from "drizzle-orm";
import { randomUUID } from "crypto";

// Username validation: 3-50 chars, alphanumeric + underscore only
const USERNAME_REGEX = /^[a-zA-Z0-9_]{3,50}$/;

/**
 * Migrate existing data with userId=NULL to the specified user.
 * This should be called when the first user registers.
 */
async function migrateExistingDataToUser(userId: number): Promise<void> {
  // Update categories
  db.update(schema.categories)
    .set({ userId })
    .where(isNull(schema.categories.userId))
    .run();

  // Update transactions
  db.update(schema.transactions)
    .set({ userId })
    .where(isNull(schema.transactions.userId))
    .run();

  // Update budgets
  db.update(schema.budgets)
    .set({ userId })
    .where(isNull(schema.budgets.userId))
    .run();

  // Update imports
  db.update(schema.imports)
    .set({ userId })
    .where(isNull(schema.imports.userId))
    .run();

  // Update settings
  db.update(schema.settings)
    .set({ userId })
    .where(isNull(schema.settings.userId))
    .run();

  // Update portfolio accounts
  db.update(schema.portfolioAccounts)
    .set({ userId })
    .where(isNull(schema.portfolioAccounts.userId))
    .run();

  // Update portfolio items
  db.update(schema.portfolioItems)
    .set({ userId })
    .where(isNull(schema.portfolioItems.userId))
    .run();

  // Update portfolio snapshots
  db.update(schema.portfolioSnapshots)
    .set({ userId })
    .where(isNull(schema.portfolioSnapshots.userId))
    .run();
}

// POST /api/auth/register
export async function POST(request: NextRequest) {
  try {
    const { username, password } = await request.json();

    // Validate username
    if (!username || typeof username !== "string") {
      return NextResponse.json(
        { error: "Username is required", success: false },
        { status: 400 }
      );
    }

    if (!USERNAME_REGEX.test(username)) {
      return NextResponse.json(
        {
          error:
            "Username must be 3-50 characters and contain only letters, numbers, and underscores",
          success: false,
        },
        { status: 400 }
      );
    }

    // Validate password
    if (!password || typeof password !== "string") {
      return NextResponse.json(
        { error: "Password is required", success: false },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters", success: false },
        { status: 400 }
      );
    }

    // Check if username already exists
    const existingUser = db
      .select({ id: schema.users.id })
      .from(schema.users)
      .where(eq(schema.users.username, username))
      .get();

    if (existingUser) {
      return NextResponse.json(
        { error: "Username already exists", success: false },
        { status: 409 }
      );
    }

    // Check if this is the first user
    const userCountResult = db
      .select({ count: sql<number>`COUNT(*)` })
      .from(schema.users)
      .get();
    const isFirstUser = (userCountResult?.count ?? 0) === 0;

    // Hash password
    const passwordHash = await hashPassword(password);

    // Generate UUID and timestamps
    const uuid = randomUUID();
    const now = new Date();

    // Insert user
    const result = db
      .insert(schema.users)
      .values({
        uuid,
        username,
        passwordHash,
        createdAt: now,
        updatedAt: now,
      })
      .returning({
        id: schema.users.id,
        uuid: schema.users.uuid,
        username: schema.users.username,
      })
      .get();

    if (!result) {
      return NextResponse.json(
        { error: "Failed to create user", success: false },
        { status: 500 }
      );
    }

    // If this is the first user, migrate existing data
    // Otherwise, seed default categories for the new user
    if (isFirstUser) {
      await migrateExistingDataToUser(result.id);
    } else {
      await seedDefaultCategoriesForUser(result.id);
    }

    // Create session
    const { token, expiresAt } = await createSession(db, result.id);

    // Create response and set cookie
    const response = NextResponse.json({
      success: true,
      user: {
        id: result.id,
        uuid: result.uuid,
        username: result.username,
      },
    });

    setSessionCookie(response, token, expiresAt);

    return response;
  } catch (error) {
    console.error("POST /api/auth/register error:", error);
    return NextResponse.json(
      { error: "Failed to register user", success: false },
      { status: 500 }
    );
  }
}
