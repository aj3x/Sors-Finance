/**
 * API Authentication Helper
 *
 * Provides utilities for protecting API routes with session-based authentication.
 */

import { NextRequest } from "next/server";
import { db } from "@/lib/db/connection";
import type { User as SchemaUser } from "@/lib/db/schema";
import { getSessionCookie } from "./cookies";
import { validateSession } from "./session";

/**
 * Custom error class for authentication errors.
 */
export class AuthError extends Error {
  public readonly statusCode: number;

  constructor(message: string, statusCode: number = 401) {
    super(message);
    this.name = "AuthError";
    this.statusCode = statusCode;
  }
}

/**
 * User data returned from authentication.
 * Excludes the password hash for security.
 */
export type User = Omit<SchemaUser, "passwordHash">;

/**
 * Require authentication for an API route.
 * Throws AuthError if the request is not authenticated.
 *
 * @param request - The incoming request
 * @returns Promise resolving to the authenticated user's ID and data
 * @throws AuthError if not authenticated
 */
export async function requireAuth(
  request: NextRequest
): Promise<{ userId: number; user: User }> {
  const token = getSessionCookie(request);

  if (!token) {
    throw new AuthError("Authentication required", 401);
  }

  const result = await validateSession(db, token);

  if (!result) {
    throw new AuthError("Invalid or expired session", 401);
  }

  // Return user data without password hash
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { passwordHash: _, ...userWithoutPassword } = result.user;

  return {
    userId: result.user.id,
    user: userWithoutPassword,
  };
}
