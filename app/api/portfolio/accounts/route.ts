import { NextRequest, NextResponse } from "next/server";
import { db, schema } from "@/lib/db/connection";
import { eq, asc, sql, and } from "drizzle-orm";
import { randomUUID } from "crypto";
import { requireAuth, AuthError } from "@/lib/auth/api-helper";

// GET /api/portfolio/accounts?bucket=Savings
export async function GET(request: NextRequest) {
  try {
    const { userId } = await requireAuth(request);

    const bucket = request.nextUrl.searchParams.get("bucket");

    let results;
    if (bucket) {
      results = await db
        .select()
        .from(schema.portfolioAccounts)
        .where(
          and(
            eq(schema.portfolioAccounts.bucket, bucket),
            eq(schema.portfolioAccounts.userId, userId)
          )
        )
        .orderBy(asc(schema.portfolioAccounts.order));
    } else {
      results = await db
        .select()
        .from(schema.portfolioAccounts)
        .where(eq(schema.portfolioAccounts.userId, userId))
        .orderBy(asc(schema.portfolioAccounts.order));
    }

    const accounts = results.map((row) => ({
      id: row.id,
      uuid: row.uuid,
      bucket: row.bucket,
      name: row.name,
      order: row.order,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    }));

    return NextResponse.json({ data: accounts, success: true });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json(
        { error: error.message, success: false },
        { status: error.statusCode }
      );
    }
    console.error("GET /api/portfolio/accounts error:", error);
    return NextResponse.json(
      { error: "Failed to fetch portfolio accounts", success: false },
      { status: 500 }
    );
  }
}

// POST /api/portfolio/accounts
export async function POST(request: NextRequest) {
  try {
    const { userId } = await requireAuth(request);

    const { bucket, name } = await request.json();

    if (!bucket || !name) {
      return NextResponse.json(
        { error: "bucket and name are required", success: false },
        { status: 400 }
      );
    }

    // Get max order for this bucket and user
    const maxOrderResult = await db
      .select({ maxOrder: sql<number>`MAX(${schema.portfolioAccounts.order})` })
      .from(schema.portfolioAccounts)
      .where(
        and(
          eq(schema.portfolioAccounts.bucket, bucket),
          eq(schema.portfolioAccounts.userId, userId)
        )
      );

    const order = (maxOrderResult[0]?.maxOrder ?? -1) + 1;
    const now = new Date();

    const result = await db
      .insert(schema.portfolioAccounts)
      .values({
        uuid: randomUUID(),
        bucket,
        name,
        order,
        userId,
        createdAt: now,
        updatedAt: now,
      })
      .returning({ id: schema.portfolioAccounts.id });

    return NextResponse.json({ data: { id: result[0].id }, success: true });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json(
        { error: error.message, success: false },
        { status: error.statusCode }
      );
    }
    console.error("POST /api/portfolio/accounts error:", error);
    return NextResponse.json(
      { error: "Failed to create portfolio account", success: false },
      { status: 500 }
    );
  }
}
