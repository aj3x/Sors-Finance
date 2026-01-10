import { NextRequest, NextResponse } from "next/server";
import { db, schema } from "@/lib/db/connection";
import { verifyPassword } from "@/lib/auth/password";
import { createSession } from "@/lib/auth/session";
import { setSessionCookie } from "@/lib/auth/cookies";
import { eq } from "drizzle-orm";

// POST /api/auth/login
export async function POST(request: NextRequest) {
  try {
    const { username, password } = await request.json();

    // Validate input
    if (!username || typeof username !== "string") {
      return NextResponse.json(
        { error: "Username is required", success: false },
        { status: 400 }
      );
    }

    if (!password || typeof password !== "string") {
      return NextResponse.json(
        { error: "Password is required", success: false },
        { status: 400 }
      );
    }

    // Get user by username
    const user = db
      .select({
        id: schema.users.id,
        uuid: schema.users.uuid,
        username: schema.users.username,
        passwordHash: schema.users.passwordHash,
      })
      .from(schema.users)
      .where(eq(schema.users.username, username))
      .get();

    if (!user) {
      return NextResponse.json(
        { error: "Invalid username or password", success: false },
        { status: 401 }
      );
    }

    // Verify password
    const isValid = await verifyPassword(password, user.passwordHash);

    if (!isValid) {
      return NextResponse.json(
        { error: "Invalid username or password", success: false },
        { status: 401 }
      );
    }

    // Create session
    const { token, expiresAt } = await createSession(db, user.id);

    // Create response and set cookie
    const response = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        uuid: user.uuid,
        username: user.username,
      },
    });

    setSessionCookie(response, token, expiresAt);

    return response;
  } catch (error) {
    console.error("POST /api/auth/login error:", error);
    return NextResponse.json(
      { error: "Failed to login", success: false },
      { status: 500 }
    );
  }
}
