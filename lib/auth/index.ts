/**
 * Authentication Library
 *
 * Barrel export for all auth-related functions.
 */

// Password utilities
export { hashPassword, verifyPassword } from "./password";

// Session management
export {
  generateSessionToken,
  createSession,
  validateSession,
  deleteSession,
  deleteExpiredSessions,
} from "./session";

// Cookie utilities
export {
  SESSION_COOKIE_NAME,
  setSessionCookie,
  getSessionCookie,
  clearSessionCookie,
} from "./cookies";

// API helpers
export { AuthError, requireAuth } from "./api-helper";
export type { User } from "./api-helper";
