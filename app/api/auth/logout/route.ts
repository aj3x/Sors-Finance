import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db/connection";
import { deleteSession } from "@/lib/auth/session";
import { getSessionCookie, clearSessionCookie } from "@/lib/auth/cookies";

// POST /api/auth/logout
export async function POST(request: NextRequest) {
  try {
    // Get token from cookie
    const token = getSessionCookie(request);

    if (token) {
      // Delete session from database
      await deleteSession(db, token);
    }

    // Create response and clear cookie
    const response = NextResponse.json({ success: true });
    clearSessionCookie(response);

    return response;
  } catch (error) {
    console.error("POST /api/auth/logout error:", error);
    // Even if deletion fails, clear the cookie and return success
    const response = NextResponse.json({ success: true });
    clearSessionCookie(response);
    return response;
  }
}
