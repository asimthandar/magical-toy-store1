/**
 * API Configuration
 *
 * Set your base URL and all endpoint paths here.
 * The API client reads from this file to make real HTTP calls.
 *
 * Environment variables (set in Convex dashboard under Settings → Environment Variables):
 *   ECOMMERCE_API_BASE_URL  – your API base URL (e.g. https://api.yoursite.com)
 *   ECOMMERCE_API_KEY       – optional API key for server-to-server calls
 */

// ──────────────────────────────────────────────
// Base URL – override via env or edit directly
// ──────────────────────────────────────────────
export const API_BASE_URL =
  process.env.ECOMMERCE_API_BASE_URL || "https://api.yoursite.com";

export const API_KEY = process.env.ECOMMERCE_API_KEY || "";

// ──────────────────────────────────────────────
// Timeout & retry settings
// ──────────────────────────────────────────────
export const API_TIMEOUT_MS = 15_000;
export const MAX_RETRIES = 3;
export const RETRY_DELAY_MS = 1_000;

// ──────────────────────────────────────────────
// Endpoint paths
// ──────────────────────────────────────────────
export const ENDPOINTS = {
  // ── Auth ───────────────────────────────────
  auth: {
    sendOtp: "/auth/send-otp",
    verifyOtp: "/auth/verify-otp",
    refreshToken: "/auth/refresh-token",
    logout: "/auth/logout",
  },

  // ── Products ───────────────────────────────
  products: {
    search: "/products/search",
    getById: "/products/:id",
    getByUrl: "/products/by-url",
    categories: "/products/categories",
    trending: "/products/trending",
  },

  // ── Cart ───────────────────────────────────
  cart: {
    get: "/cart",
    addItem: "/cart/items",
    updateItem: "/cart/items/:itemId",
    removeItem: "/cart/items/:itemId",
    clear: "/cart/clear",
    validatePrices: "/cart/validate-prices",
  },

  // ── Orders ─────────────────────────────────
  orders: {
    create: "/orders",
    list: "/orders",
    getById: "/orders/:id",
    cancel: "/orders/:id/cancel",
  },

  // ── Payments ───────────────────────────────
  payments: {
    createQr: "/payments/qr",
    verify: "/payments/:orderId/verify",
    status: "/payments/:orderId/status",
    generateUpiLink: "/payments/upi-link",
  },

  // ── Addresses ──────────────────────────────
  addresses: {
    list: "/addresses",
    add: "/addresses",
    update: "/addresses/:id",
    delete: "/addresses/:id",
    setDefault: "/addresses/:id/default",
  },

  // ── Sessions (linked platform accounts) ────
  sessions: {
    get: "/sessions",
    refresh: "/sessions/refresh",
    export: "/sessions/export",
    inject: "/sessions/inject",
  },

  // ── Referrals ──────────────────────────────
  referrals: {
    generate: "/referrals/generate",
    getByCode: "/referrals/:code",
    getStats: "/referrals/stats",
    claimReward: "/referrals/claim",
  },

  // ── Offer Hunting ──────────────────────────
  offers: {
    welcomeTiers: "/offers/welcome-tiers",
    hunt: "/offers/hunt",
    status: "/offers/status",
  },

  // ── Wallet ─────────────────────────────────
  wallet: {
    get: "/wallet",
    transactions: "/wallet/transactions",
    credit: "/wallet/credit",
    debit: "/wallet/debit",
  },

  // ── User / Linked Accounts ─────────────────
  accounts: {
    link: "/accounts/link",
    verify: "/accounts/verify",
    list: "/accounts",
    unlink: "/accounts/:id",
    exportSession: "/accounts/:id/export",
  },
} as const;

// ──────────────────────────────────────────────
// Helper: resolve path params like /orders/:id
// ──────────────────────────────────────────────
export function resolvePath(
  path: string,
  params: Record<string, string | number> = {},
): string {
  let resolved = path;
  for (const [key, value] of Object.entries(params)) {
    resolved = resolved.replace(`:${key}`, String(value));
  }
  return resolved;
}

// ──────────────────────────────────────────────
// TypeScript types for API request/response
// ──────────────────────────────────────────────

// Auth
export interface SendOtpRequest {
  phone: string;
  deviceId?: string;
}

export interface SendOtpResponse {
  success: boolean;
  message: string;
  sessionId?: string;
}

export interface VerifyOtpRequest {
  phone: string;
  otp: string;
  sessionId?: string;
  deviceId?: string;
}

export interface VerifyOtpResponse {
  success: boolean;
  accessToken: string;
  refreshToken: string;
  userId: string;
  expiresAt: number;
  message: string;
}

// Products
export interface ProductSearchParams {
  query: string;
  category?: string;
  limit?: number;
  offset?: number;
  sortBy?: "price_asc" | "price_desc" | "rating" | "newest";
}

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  originalPrice: number;
  image: string;
  images?: string[];
  category: string;
  sizes?: string[];
  inStock: boolean;
  rating: number;
  reviewCount: number;
  discount?: number;
}

export interface ProductSearchResponse {
  products: Product[];
  total: number;
  hasMore: boolean;
}

// Cart
export interface CartItem {
  id: string;
  productId: string;
  product: Product;
  quantity: number;
  size?: string;
  addedAt: number;
}

export interface CartResponse {
  items: CartItem[];
  total: number;
  itemCount: number;
}

export interface AddToCartRequest {
  productId: string;
  quantity: number;
  size?: string;
}

export interface UpdateCartItemRequest {
  itemId: string;
  quantity: number;
}

export interface PriceValidationResponse {
  valid: boolean;
  updatedPrices?: { itemId: string; oldPrice: number; newPrice: number }[];
}

// Orders
export interface OrderItem {
  productId: string;
  name: string;
  image: string;
  price: number;
  quantity: number;
  size?: string;
}

export interface Order {
  id: string;
  orderNumber: string;
  items: OrderItem[];
  address: Address;
  paymentMethod: "cod" | "online";
  status: "pending" | "confirmed" | "shipped" | "delivered" | "cancelled";
  total: number;
  discount: number;
  firstOrderDiscount: number;
  createdAt: number;
  estimatedDelivery?: string;
}

export interface CreateOrderRequest {
  items: { productId: string; quantity: number; size?: string }[];
  addressId: string;
  paymentMethod: "cod" | "online";
  idempotencyKey?: string;
  sessionToken?: string;
}

export interface CreateOrderResponse {
  success: boolean;
  orderId: string;
  orderNumber: string;
  status: string;
  estimatedDelivery: string;
}

// Payments
export interface CreateQrRequest {
  orderId: string;
  amount: number;
  upiId?: string;
}

export interface CreateQrResponse {
  qrData: string;
  qrImageUrl: string;
  upiLink: string;
  amount: number;
  transactionId: string;
}

export interface VerifyPaymentRequest {
  orderId: string;
  transactionId?: string;
  attemptNumber?: number;
}

export interface VerifyPaymentResponse {
  status: "pending" | "completed" | "failed";
  transactionId?: string;
  message: string;
}

// Addresses
export interface Address {
  id: string;
  name: string;
  phone: string;
  pincode: string;
  city: string;
  state: string;
  houseNumber: string;
  area: string;
  landmark?: string;
  label: "home" | "work" | "other";
  isDefault: boolean;
}

export interface AddAddressRequest {
  name: string;
  phone: string;
  pincode: string;
  city: string;
  state: string;
  houseNumber: string;
  area: string;
  landmark?: string;
  label: "home" | "work" | "other";
  isDefault?: boolean;
}

// Sessions
export interface SessionInfo {
  sessionId: string;
  phone: string;
  platform: string;
  status: "active" | "expired";
  createdAt: number;
  expiresAt: number;
  timeLeft: number;
}

export interface SessionExportData {
  platform: string;
  phone: string;
  tokens: {
    accessToken: string;
    refreshToken: string;
    userId: string;
    expiresAt: number;
  };
  exportedAt: number;
}

// Referrals
export interface ReferralInfo {
  code: string;
  link: string;
  totalReferred: number;
  totalEarned: number;
  pendingReward: number;
  recentReferrals: {
    name: string;
    joinedAt: number;
    reward: number;
  }[];
}

// Offers
export interface WelcomeTier {
  amount: number;
  available: boolean;
  description: string;
}

export interface OfferHuntResult {
  success: boolean;
  discount: number;
  attempts: number;
  message: string;
}

// Wallet
export interface WalletInfo {
  balance: number;
  totalEarned: number;
  totalSpent: number;
  currency: string;
}

export interface WalletTransaction {
  id: string;
  type: "credit" | "debit";
  amount: number;
  description: string;
  createdAt: number;
}
