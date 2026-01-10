import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db/connection";
import { validateSession } from "@/lib/auth/session";
import { getSessionCookie } from "@/lib/auth/cookies";

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
