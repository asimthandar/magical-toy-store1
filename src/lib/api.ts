/**
 * Direct API Client — Frontend
 *
 * Makes real HTTP calls to api.localproject.dev
 * No Convex dependency.
 */

import { API_BASE_URL, ENDPOINTS, resolvePath } from "./apiConfig";
import { getAccessToken } from "./auth";

// ──────────────────────────────────────────────
// Core fetch wrapper
// ──────────────────────────────────────────────

async function apiFetch<T = any>(
  method: string,
  path: string,
  body?: unknown,
  options?: { token?: string; query?: Record<string, any> },
): Promise<T> {
  const token = options?.token || getAccessToken();
  const url = new URL(path, API_BASE_URL);

  if (options?.query) {
    for (const [k, v] of Object.entries(options.query)) {
      if (v !== undefined && v !== null) url.searchParams.set(k, String(v));
    }
  }

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(url.toString(), {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    let data: any;
    try { data = JSON.parse(text); } catch { data = { message: text }; }
    throw new Error(data?.message || data?.error || `API error ${res.status}`);
  }

  const text = await res.text();
  if (!text) return {} as T;
  try { return JSON.parse(text); } catch { return text as unknown as T; }
}

// ══════════════════════════════════════════════
// AUTH
// ══════════════════════════════════════════════

export const authApi = {
  sendOtp: (phone_number: string) =>
    apiFetch("POST", ENDPOINTS.auth.sendOtp, { phone_number }),

  verifyOtp: (data: {
    request_id: string;
    instance_id: string;
    phone_number: string;
    otp: string;
    login_type?: string;
  }) => apiFetch("POST", ENDPOINTS.auth.verifyOtp, data),
};

// ══════════════════════════════════════════════
// PRODUCTS
// ══════════════════════════════════════════════

export const productsApi = {
  getFeed: (params: {
    type: string;
    sort_option?: string;
    selected_filters?: string[];
    selectedFilterIds?: string[];
    session_state?: string;
    offset?: number;
    limit?: number;
  }) =>
    apiFetch("POST", ENDPOINTS.products.feed, {
      filter: {
        type: params.type,
        sort_option: params.sort_option ?? null,
        selected_filters: params.selected_filters ?? [],
        session_state: params.session_state ?? "",
        selectedFilterIds: params.selectedFilterIds ?? [],
      },
      offset: params.offset ?? 0,
      limit: params.limit ?? 20,
    }),

  getDetail: (productId: string, opts?: { include_catalog?: boolean; ad_active?: boolean }) =>
    apiFetch("POST", resolvePath(ENDPOINTS.products.detail, { productId }), {
      include_catalog: opts?.include_catalog ?? true,
      ad_active: opts?.ad_active ?? false,
    }),

  getRecommendations: (productId: string, opts?: { offset?: number; limit?: number }) =>
    apiFetch("POST", resolvePath(ENDPOINTS.products.recommendation, { productId }), {
      cursor: null,
      offset: opts?.offset ?? 0,
      limit: opts?.limit ?? 10,
    }),

  getNavigationTree: () => apiFetch("GET", ENDPOINTS.products.navigationTree),
};

// ══════════════════════════════════════════════
// CART
// ══════════════════════════════════════════════

export const cartApi = {
  getState: (params: {
    context: string;
    identifier: string;
    cart_session: string;
    user_id: number;
  }) => apiFetch("POST", ENDPOINTS.cart.cartState, params),

  addItem: (data: {
    identifier: string;
    items: {
      product_id: string;
      supplier_id: number;
      variation?: string;
      variation_id?: string;
      quantity: number;
    }[];
  }) => apiFetch("POST", ENDPOINTS.cart.addToCart, data),

  getQuantity: () => apiFetch("GET", ENDPOINTS.cart.cartQuantity),
};

// ══════════════════════════════════════════════
// ADDRESSES
// ══════════════════════════════════════════════

export const addressesApi = {
  list: () => apiFetch("GET", ENDPOINTS.addresses.list),

  update: (addressId: number, data: {
    address_line_1: string;
    address_line_2?: string;
    address_type: string;
    city: string;
    state: string;
    pincode: string;
    landmark?: string;
  }) => apiFetch("PUT", resolvePath(ENDPOINTS.addresses.update, { addressId }), data),
};

// ══════════════════════════════════════════════
// ORDERS
// ══════════════════════════════════════════════

export const ordersApi = {
  createPreorder: (data: {
    address_id: number;
    cart_session: string;
    customer_amount: number;
    enable_price_unbundling?: boolean;
    identifier: string;
    user_id: number;
  }) => apiFetch("POST", ENDPOINTS.orders.preorder, data),

  placeOrder: (data: {
    order_num: string;
    pre_order_id: string;
    client_type?: string;
  }) => apiFetch("POST", ENDPOINTS.orders.placeOrder, data),
};

// ══════════════════════════════════════════════
// PAYMENTS
// ══════════════════════════════════════════════

export const paymentsApi = {
  getOptions: (data: {
    cart_session: string;
    checkout_identifier: string;
    order_total: number;
    user_id: number;
    address_id?: number;
  }) => apiFetch("POST", ENDPOINTS.payments.paymentOptions, data),

  createJuspayTxn: (data: {
    order_id: string;
    merchant_id?: string;
    redirect_after_payment?: boolean;
    format?: string;
    txnPayload?: any;
  }) => apiFetch("POST", ENDPOINTS.payments.juspayTxn, data),

  getPaymentInfo: (data: {
    context: string;
    user_id: number;
    identifier: string;
    cart_session: string;
    payment_modes?: string[];
  }) => apiFetch("POST", ENDPOINTS.payments.paymentInfo, data),
};

// ══════════════════════════════════════════════
// OFFERS
// ══════════════════════════════════════════════

export const offersApi = {
  hunt: (data: {
    targetDiscount: number;
    maxAttempts?: number;
  }) => apiFetch("POST", ENDPOINTS.offers?.hunt || "/api/v1/offers/hunt", data),
};
