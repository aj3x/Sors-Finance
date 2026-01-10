/**
 * Session Management
 *
 * Handles creation, validation, and deletion of user sessions.
 */

import { randomBytes } from "crypto";
import { eq, lt } from "drizzle-orm";
import type { BetterSQLite3Database } from "drizzle-orm/better-sqlite3";
import * as schema from "@/lib/db/schema";
import type { User } from "@/lib/db/schema";

type Database = BetterSQLite3Database<typeof schema>;

const SESSION_DURATION_DAYS = 30;

/**
 * Generate a cryptographically secure session token.
 * Uses 32 bytes of random data encoded as base64url.
 * @returns A secure session token string
 */
export function generateSessionToken(): string {
  const bytes = randomBytes(32);
  // Convert to base64url (URL-safe base64 without padding)
  return bytes
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=/g, "");
}

/**
 * Create a new session for a user.
 * @param db - The database instance
 * @param userId - The ID of the user to create a session for
 * @returns Promise resolving to the session token and expiration date
 */
export async function createSession(
  db: Database,
  userId: number
): Promise<{ token: string; expiresAt: Date }> {
  const token = generateSessionToken();
  const now = new Date();
  const expiresAt = new Date(
    now.getTime() + SESSION_DURATION_DAYS * 24 * 60 * 60 * 1000
  );

  db.insert(schema.sessions)
    .values({
      token,
      userId,
      expiresAt,
      createdAt: now,
    })
    .run();

  return { token, expiresAt };
}

/**
 * Validate a session token and return the associated user.
 * @param db - The database instance
 * @param token - The session token to validate
 * @returns Promise resolving to the user if valid, null otherwise
 */
export async function validateSession(
  db: Database,
  token: string
): Promise<{ user: User } | null> {
  const result = db
    .select({
      session: schema.sessions,
      user: schema.users,
    })
    .from(schema.sessions)
    .innerJoin(schema.users, eq(schema.sessions.userId, schema.users.id))
    .where(eq(schema.sessions.token, token))
    .get();

  if (!result) {
    return null;
  }

  // Check if session has expired
  if (result.session.expiresAt < new Date()) {
    // Delete expired session
    db.delete(schema.sessions)
      .where(eq(schema.sessions.token, token))
      .run();
    return null;
  }

  return { user: result.user };
}

/**
 * Delete a session by token.
 * @param db - The database instance
 * @param token - The session token to delete
 */
export async function deleteSession(
  db: Database,
  token: string
): Promise<void> {
  db.delete(schema.sessions)
    .where(eq(schema.sessions.token, token))
    .run();
}

/**
 * Delete all expired sessions from the database.
 * @param db - The database instance
 */
export async function deleteExpiredSessions(db: Database): Promise<void> {
  db.delete(schema.sessions)
    .where(lt(schema.sessions.expiresAt, new Date()))
    .run();
}
