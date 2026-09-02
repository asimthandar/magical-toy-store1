/**
 * API Client
 *
 * Centralized HTTP client with:
 *  - Bearer token auth (JWT)
 *  - Automatic retries with exponential backoff
 *  - Request timeout
 *  - Error normalization
 *  - Path param resolution
 *
 * Usage from Convex actions (server-side):
 *   import { apiClient } from "../lib/apiClient";
 *   const result = await apiClient.get("/products/search", { query: "shoes" });
 */

import {
  API_BASE_URL,
  API_KEY,
  API_TIMEOUT_MS,
  MAX_RETRIES,
  RETRY_DELAY_MS,
  resolvePath,
} from "./apiConfig";
import { getAccessToken } from "./auth";

// ──────────────────────────────────────────────
// Types
// ──────────────────────────────────────────────

export interface ApiRequestOptions {
  /** Override the base URL for this request */
  baseUrl?: string;
  /** Bearer token – auto-attached from auth store if not provided */
  token?: string;
  /** Skip auto auth header */
  noAuth?: boolean;
  /** Extra headers merged into the request */
  headers?: Record<string, string>;
  /** Query parameters (appended to URL as ?key=value) */
  query?: Record<string, string | number | boolean | undefined>;
  /** Request timeout in ms (default: API_TIMEOUT_MS) */
  timeout?: number;
  /** Number of retries on transient failures (default: MAX_RETRIES) */
  retries?: number;
  /** Raw body – used for non-JSON payloads */
  rawBody?: string | FormData;
  /** Skip JSON parsing of response */
  raw?: boolean;
}

export interface ApiResponse<T = unknown> {
  ok: boolean;
  status: number;
  data: T;
  headers: Headers;
}

export class ApiError extends Error {
  status: number;
  data: unknown;

  constructor(message: string, status: number, data?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.data = data;
  }
}

// ──────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

function buildUrl(
  baseUrl: string,
  path: string,
  query?: Record<string, string | number | boolean | undefined>,
): string {
  const url = new URL(path, baseUrl);
  if (query) {
    for (const [key, value] of Object.entries(query)) {
      if (value !== undefined && value !== null) {
        url.searchParams.set(key, String(value));
      }
    }
  }
  return url.toString();
}

function isTransient(status: number): boolean {
  // Retry on 408, 429, 500, 502, 503, 504
  return [408, 429, 500, 502, 503, 504].includes(status);
}

// ──────────────────────────────────────────────
// Core request function
// ──────────────────────────────────────────────

async function request<T = unknown>(
  method: string,
  path: string,
  body?: unknown,
  options: ApiRequestOptions = {},
): Promise<ApiResponse<T>> {
  const {
    baseUrl = API_BASE_URL,
    token,
    noAuth = false,
    headers: extraHeaders = {},
    query,
    timeout = API_TIMEOUT_MS,
    retries = MAX_RETRIES,
    rawBody,
    raw = false,
  } = options;

  // Auto-attach token from auth store if not explicitly provided
  const authToken = token || getAccessToken();

  const url = buildUrl(baseUrl, path, query);

  const headers: Record<string, string> = {
    ...extraHeaders,
  };

  // Auth
  if (!noAuth && authToken) {
    headers["Authorization"] = `Bearer ${authToken}`;
  }

  // API key (server-to-server)
  if (API_KEY) {
    headers["X-API-Key"] = API_KEY;
  }

  // Body
  let requestBody: string | FormData | undefined;
  if (rawBody) {
    requestBody = rawBody;
    if (typeof rawBody !== "string" && !(rawBody instanceof FormData)) {
      headers["Content-Type"] = "application/json";
    }
  } else if (body !== undefined) {
    headers["Content-Type"] = "application/json";
    requestBody = JSON.stringify(body);
  }

  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), timeout);

      const response = await fetch(url, {
        method,
        headers,
        body: requestBody,
        signal: controller.signal,
      });

      clearTimeout(timer);

      // Parse response
      let data: T;
      if (raw) {
        data = (await response.text()) as unknown as T;
      } else {
        const text = await response.text();
        try {
          data = JSON.parse(text) as T;
        } catch {
          data = text as unknown as T;
        }
      }

      // Non-success
      if (!response.ok) {
        // Retry on transient errors
        if (isTransient(response.status) && attempt < retries) {
          const delay = RETRY_DELAY_MS * Math.pow(2, attempt);
          await sleep(delay);
          continue;
        }

        const message =
          (data as Record<string, string>)?.message ||
          (data as Record<string, string>)?.error ||
          `API error ${response.status}`;

        throw new ApiError(message, response.status, data);
      }

      return {
        ok: true,
        status: response.status,
        data,
        headers: response.headers,
      };
    } catch (err) {
      lastError = err as Error;

      // Don't retry on client errors (4xx) or aborts
      if (err instanceof ApiError && err.status < 500) {
        throw err;
      }

      // Retry on network errors / timeouts
      if (attempt < retries) {
        const delay = RETRY_DELAY_MS * Math.pow(2, attempt);
        await sleep(delay);
        continue;
      }
    }
  }

  throw lastError || new Error("Request failed after retries");
}

// ──────────────────────────────────────────────
// Public client with typed methods
// ──────────────────────────────────────────────

export const apiClient = {
  /** GET request */
  async get<T = unknown>(
    path: string,
    options?: ApiRequestOptions,
  ): Promise<ApiResponse<T>> {
    return request<T>("GET", path, undefined, options);
  },

  /** POST request */
  async post<T = unknown>(
    path: string,
    body?: unknown,
    options?: ApiRequestOptions,
  ): Promise<ApiResponse<T>> {
    return request<T>("POST", path, body, options);
  },

  /** PUT request */
  async put<T = unknown>(
    path: string,
    body?: unknown,
    options?: ApiRequestOptions,
  ): Promise<ApiResponse<T>> {
    return request<T>("PUT", path, body, options);
  },

  /** PATCH request */
  async patch<T = unknown>(
    path: string,
    body?: unknown,
    options?: ApiRequestOptions,
  ): Promise<ApiResponse<T>> {
    return request<T>("PATCH", path, body, options);
  },

  /** DELETE request */
  async del<T = unknown>(
    path: string,
    options?: ApiRequestOptions,
  ): Promise<ApiResponse<T>> {
    return request<T>("DELETE", path, undefined, options);
  },
};

// Re-export for convenience
export { resolvePath };
