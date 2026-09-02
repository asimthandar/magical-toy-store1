/**
 * Auth Store — Pure localStorage, no Convex
 *
 * Stores auth tokens from the API login flow.
 * Provides React hooks for auth state.
 */

const AUTH_KEY = "shop_auth";
const SESSION_KEY = "shop_session";

// ──────────────────────────────────────────────
// Types
// ──────────────────────────────────────────────

export interface AuthTokens {
  request_id: string;
  instance_id: string;
  phone_number: string;
  access_token?: string;
  token?: string;
  refresh_token?: string;
  user_id?: number;
  identifier?: string;
  cart_session?: string;
  session_state?: string;
  login_type?: string;
  createdAt: number;
  expiresAt: number;
}

export interface SessionData {
  identifier: string;
  cart_session: string;
  user_id: number;
  phone: string;
  platform: string;
  status: "active" | "expired";
  createdAt: number;
  expiresAt: number;
}

// ──────────────────────────────────────────────
// Storage helpers
// ──────────────────────────────────────────────

function safeGet<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function safeSet(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Storage full or blocked
  }
}

function safeRemove(key: string): void {
  try {
    localStorage.removeItem(key);
  } catch {
    // Ignore
  }
}

// ──────────────────────────────────────────────
// Auth functions
// ──────────────────────────────────────────────

/** Save auth tokens after login */
export function saveAuth(tokens: AuthTokens): void {
  safeSet(AUTH_KEY, tokens);
}

/** Get stored auth tokens */
export function getAuth(): AuthTokens | null {
  const auth = safeGet<AuthTokens>(AUTH_KEY);
  if (!auth) return null;
  // Check expiry (2 days)
  if (Date.now() > auth.expiresAt) {
    clearAuth();
    return null;
  }
  return auth;
}

/** Clear auth tokens */
export function clearAuth(): void {
  safeRemove(AUTH_KEY);
  safeRemove(SESSION_KEY);
}

/** Check if user is authenticated */
export function isAuthenticated(): boolean {
  return getAuth() !== null;
}

/** Get access token for API calls */
export function getAccessToken(): string {
  const auth = getAuth();
  if (!auth) return "";
  return auth.access_token || auth.token || "";
}

/** Get user identifier */
export function getIdentifier(): string {
  const auth = getAuth();
  if (!auth) return "";
  return auth.identifier || auth.phone_number || "";
}

/** Get user ID */
export function getUserId(): number {
  const auth = getAuth();
  if (!auth) return 0;
  return auth.user_id || 0;
}

/** Get cart session */
export function getCartSession(): string {
  const auth = getAuth();
  if (!auth) return "";
  return auth.cart_session || "";
}

/** Refresh session (extend expiry by 2 days) */
export function refreshSession(): void {
  const auth = getAuth();
  if (!auth) return;
  auth.expiresAt = Date.now() + 2 * 24 * 60 * 60 * 1000;
  safeSet(AUTH_KEY, auth);
}

/** Get session time left in milliseconds */
export function getSessionTimeLeft(): number {
  const auth = getAuth();
  if (!auth) return 0;
  return Math.max(0, auth.expiresAt - Date.now());
}

/** Export session as JSON */
export function exportSession(): string {
  const auth = getAuth();
  if (!auth) return "{}";
  return JSON.stringify(auth, null, 2);
}

// ──────────────────────────────────────────────
// Linked platform account session
// ──────────────────────────────────────────────

/** Save linked account session */
export function saveLinkedSession(session: SessionData): void {
  const sessions = getLinkedSessions();
  const idx = sessions.findIndex(
    (s) => s.identifier === session.identifier,
  );
  if (idx >= 0) {
    sessions[idx] = session;
  } else {
    sessions.push(session);
  }
  safeSet(SESSION_KEY, sessions);
}

/** Get all linked sessions */
export function getLinkedSessions(): SessionData[] {
  return safeGet<SessionData[]>(SESSION_KEY) || [];
}

/** Get active linked session */
export function getActiveLinkedSession(): SessionData | null {
  const sessions = getLinkedSessions();
  const active = sessions.find((s) => s.status === "active");
  if (!active) return null;
  if (Date.now() > active.expiresAt) {
    active.status = "expired";
  }
  return active;
}

/** Remove linked session */
export function removeLinkedSession(identifier: string): void {
  const sessions = getLinkedSessions().filter(
    (s) => s.identifier !== identifier,
  );
  safeSet(SESSION_KEY, sessions);
}
