/**
 * API Configuration — Real Endpoints
 *
 * Based on HAR analysis of api.localproject.dev
 * Base URL: https://api.localproject.dev
 *
 * Environment variables (set in Convex dashboard):
 *   ECOMMERCE_API_BASE_URL  – default: https://api.localproject.dev
 *   ECOMMERCE_API_KEY       – if needed
 */

// ──────────────────────────────────────────────
// Base URL
// ──────────────────────────────────────────────
export const API_BASE_URL = "https://api.localproject.dev";

export const API_KEY = "";

// ──────────────────────────────────────────────
// Timeout & retry settings
// ──────────────────────────────────────────────
export const API_TIMEOUT_MS = 15_000;
export const MAX_RETRIES = 3;
export const RETRY_DELAY_MS = 1_000;

// ──────────────────────────────────────────────
// Endpoint paths (exact from HAR)
// ──────────────────────────────────────────────
export const ENDPOINTS = {
  // ── Auth ───────────────────────────────────
  auth: {
    sendOtp: "/api/v1/user/login/request-otp",
    verifyOtp: "/api/v1/user/login",
  },

  // ── Products / Feed ────────────────────────
  products: {
    feed: "/api/v1/feed",
    feedFilterConfig: "/api/v1/products/feedFilterConfig",
    detail: "/api/v1/product/:productId",
    insights: "/api/v1/product/insights",
    recommendation: "/api/v1/productRecommendation/:productId",
    catalogs: "/api/v1/2.0/catalogs",
    navigationTree: "/api/v1/mweb-navigation-tree",
  },

  // ── Cart ───────────────────────────────────
  cart: {
    addToCart: "/checkout/api/v1/addToCart",
    cartQuantity: "/checkout/api/v1/cartQuantity",
    cartState: "/mcheckout/api/8.0/cart",
    cartLocation: "/mcheckout/api/1.0/cart/location",
    cartMinview: "/mcheckout/api/1.0/cart/minview",
    cartPage: "/mcheckout/cart",
  },

  // ── Checkout / Config ──────────────────────
  checkout: {
    config: "/mcheckout/api/1.0/config",
    userProfile: "/mcheckout/api/1.0/user-profile",
  },

  // ── Addresses ──────────────────────────────
  addresses: {
    list: "/mcheckout/api/3.0/addresses",
    update: "/mcheckout/api/2.0/addresses/:addressId",
  },

  // ── Payments ───────────────────────────────
  payments: {
    paymentOptions: "/mcheckout/api/v1/list/payment-options",
    userDetails: "/mcheckout/api/1.0/payments/user-details",
    juspayOffers: "/mcheckout/api/juspay/v1/offers/list",
    paymentInfo: "/mcheckout/api/1.0/cart/paymentinfo",
    juspayTxn: "/mcheckout/api/juspay/txns",
  },

  // ── Orders ─────────────────────────────────
  orders: {
    preorder: "/mcheckout/api/4.0/preorders",
    placeOrder: "/mcheckout/api/3.0/order",
    orderAnimation: "/mcheckout/api/order-animation",
  },

  // ── Offers ─────────────────────────────────
  offers: {
    hunt: "/api/v1/offers/hunt",
    welcomeTiers: "/api/v1/offers/welcome-tiers",
  },
} as const;

// ──────────────────────────────────────────────
// Helper: resolve path params like /product/:id
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

// ══════════════════════════════════════════════
// TypeScript types for API request/response
// ══════════════════════════════════════════════

// ── Auth ─────────────────────────────────────

export interface SendOtpRequest {
  phone_number: string;
}

export interface SendOtpResponse {
  request_id: string;
  instance_id?: string;
  message?: string;
  status?: string;
}

export interface VerifyOtpRequest {
  request_id: string;
  instance_id: string;
  phone_number: string;
  otp: string;
  login_type: string;
}

export interface VerifyOtpResponse {
  access_token?: string;
  token?: string;
  refresh_token?: string;
  user_id?: number;
  identifier?: string;
  cart_session?: string;
  session_state?: string;
  message?: string;
  status?: string;
  [key: string]: unknown;
}

// ── Products / Feed ──────────────────────────

export interface FeedFilterRequest {
  type: string;
  sort_option?: string | null;
  selected_filters?: string[];
  selectedFilterIds?: string[];
  session_state?: string;
  offset?: number;
  limit?: number;
}

export interface FeedFilterConfigRequest {
  type: string;
  sort_option?: string | null;
  selected_filters?: string[];
  selectedFilterIds?: string[];
  session_state?: string;
}

export interface ProductDetailRequest {
  include_catalog?: boolean;
  ad_active?: boolean;
}

export interface ProductInsightsRequest {
  pid: number;
}

export interface ProductRecommendationRequest {
  cursor?: string | null;
  offset?: number;
  limit?: number;
}

export interface CatalogRequest {
  catalogId: number;
  productId: string;
  reviewsWithMedia?: boolean;
  limit?: number;
}

export interface Product {
  id: string | number;
  name: string;
  price: number;
  original_price?: number;
  image?: string;
  images?: string[];
  thumbnail?: string;
  rating?: number;
  review_count?: number;
  discount?: number;
  brand?: string;
  category?: string;
  sizes?: string[];
  in_stock?: boolean;
  supplier_id?: number;
  variation?: string;
  variation_id?: string;
  pid?: number;
  [key: string]: unknown;
}

export interface FeedResponse {
  products: Product[];
  total?: number;
  has_more?: boolean;
  offset?: number;
  [key: string]: unknown;
}

// ── Cart ─────────────────────────────────────

export interface AddToCartRequest {
  identifier: string;
  items: {
    product_id: string;
    supplier_id: number;
    variation?: string;
    variation_id?: string;
    quantity: number;
    [key: string]: unknown;
  }[];
}

export interface CartStateRequest {
  context: string;
  identifier: string;
  cart_session: string;
  user_id: number;
}

export interface CartLocationRequest {
  address_id: number;
  cart_session: string;
  context: string;
  dest_pin: string;
  identifier: string;
  [key: string]: unknown;
}

export interface CartItem {
  product_id: string;
  name: string;
  price: number;
  quantity: number;
  image?: string;
  variation?: string;
  [key: string]: unknown;
}

export interface CartResponse {
  items?: CartItem[];
  cart_session?: string;
  total?: number;
  item_count?: number;
  [key: string]: unknown;
}

// ── Checkout ─────────────────────────────────

export interface CheckoutConfig {
  [key: string]: unknown;
}

export interface UserProfile {
  user_id?: number;
  name?: string;
  phone?: string;
  email?: string;
  identifier?: string;
  [key: string]: unknown;
}

// ── Addresses ────────────────────────────────

export interface Address {
  id: number;
  address_line_1: string;
  address_line_2?: string;
  address_type: "home" | "work" | "other";
  city: string;
  state: string;
  pincode: string;
  landmark?: string;
  name?: string;
  phone?: string;
  is_default?: boolean;
  [key: string]: unknown;
}

export interface UpdateAddressRequest {
  address_line_1: string;
  address_line_2?: string;
  address_type: string;
  city: string;
  landmark?: string;
  state: string;
  pincode: string;
}

// ── Payments ─────────────────────────────────

export interface PaymentOptionsRequest {
  cart_session: string;
  checkout_identifier: string;
  order_total: number;
  user_id: number;
  address_id?: number;
  [key: string]: unknown;
}

export interface PaymentUserDetailsRequest {
  is_headless_enabled?: boolean;
  actions?: string[];
  identifier: string;
  userId: number;
}

export interface JuspayOffersRequest {
  customer: {
    udf1?: string;
    email?: string;
    id?: string;
    phone?: string;
  };
  merchant_key_id?: string;
  [key: string]: unknown;
}

export interface PaymentInfoRequest {
  context: string;
  user_id: number;
  identifier: string;
  cart_session: string;
  payment_modes?: string[];
  [key: string]: unknown;
}

export interface JuspayTxnRequest {
  order_id: string;
  merchant_id?: string;
  redirect_after_payment?: boolean;
  format?: string;
  txnPayload?: Record<string, unknown>;
  [key: string]: unknown;
}

export interface PaymentOption {
  method: string;
  type: string;
  display_name?: string;
  amount?: number;
  [key: string]: unknown;
}

// ── Orders ───────────────────────────────────

export interface PreorderRequest {
  address_id: number;
  cart_session: string;
  customer_amount: number;
  enable_price_unbundling?: boolean;
  identifier: string;
  user_id: number;
  [key: string]: unknown;
}

export interface PlaceOrderRequest {
  order_num: string;
  pre_order_id: string;
  client_type?: string;
}

export interface OrderResponse {
  order_id?: string;
  order_num?: string;
  status?: string;
  message?: string;
  estimated_delivery?: string;
  [key: string]: unknown;
}

// ── Sessions / Linked Accounts ───────────────

export interface SessionInfo {
  identifier: string;
  cart_session: string;
  user_id: number;
  access_token?: string;
  phone?: string;
  status: "active" | "expired";
  createdAt: number;
  expiresAt: number;
}

export interface SessionExportData {
  identifier: string;
  access_token?: string;
  refresh_token?: string;
  user_id?: number;
  cart_session?: string;
  phone?: string;
  exportedAt: number;
}

// ── Referrals ────────────────────────────────

export interface ReferralInfo {
  code: string;
  link: string;
  totalReferred: number;
  totalEarned: number;
  pendingReward: number;
}

// ── Wallet ───────────────────────────────────

export interface WalletInfo {
  balance: number;
  totalEarned: number;
  totalSpent: number;
}
