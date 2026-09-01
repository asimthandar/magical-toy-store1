/**
 * E-Commerce API Abstraction Layer
 *
 * All external e-commerce calls go through this module.
 * Uses the apiClient for HTTP calls with auth, retries, and error handling.
 *
 * Setup:
 * 1. Set ECOMMERCE_API_BASE_URL in Convex Environment Variables
 * 2. Set ECOMMERCE_API_KEY if your API requires it
 * 3. Fill in any endpoint paths in src/lib/apiConfig.ts that differ from defaults
 */

import { action } from "./_generated/server";
import { v } from "convex/values";
import { apiClient, resolvePath, ApiError } from "../lib/apiClient";
import {
  ENDPOINTS,
  type SendOtpResponse,
  type VerifyOtpResponse,
  type ProductSearchResponse,
  type CartResponse,
  type CreateOrderResponse,
  type VerifyPaymentResponse,
  type PriceValidationResponse,
  type WelcomeTier,
  type SessionExportData,
  type CreateQrResponse,
} from "../lib/apiConfig";

// ──────────────────────────────────────────────
// Helper: get session token from linked account
// ──────────────────────────────────────────────
function getTokenFromSession(sessionTokens: Record<string, unknown>): string {
  return (sessionTokens?.accessToken as string) || "";
}

// ══════════════════════════════════════════════
// AUTH
// ══════════════════════════════════════════════

/** Send OTP to phone number */
export const sendOtp = action({
  args: {
    phone: v.string(),
    deviceId: v.optional(v.string()),
  },
  handler: async (_ctx, args) => {
    const { data } = await apiClient.post<SendOtpResponse>(
      ENDPOINTS.auth.sendOtp,
      {
        phone: args.phone,
        deviceId: args.deviceId,
      },
    );
    return data;
  },
});

/** Verify OTP and get session tokens */
export const verifyOtp = action({
  args: {
    phone: v.string(),
    otp: v.string(),
    sessionId: v.optional(v.string()),
    deviceId: v.optional(v.string()),
  },
  handler: async (_ctx, args) => {
    const { data } = await apiClient.post<VerifyOtpResponse>(
      ENDPOINTS.auth.verifyOtp,
      {
        phone: args.phone,
        otp: args.otp,
        sessionId: args.sessionId,
        deviceId: args.deviceId,
      },
    );
    return data;
  },
});

// ══════════════════════════════════════════════
// PRODUCTS
// ══════════════════════════════════════════════

/** Search products */
export const searchProducts = action({
  args: {
    query: v.string(),
    category: v.optional(v.string()),
    limit: v.optional(v.number()),
    offset: v.optional(v.number()),
    sortBy: v.optional(v.string()),
  },
  handler: async (_ctx, args) => {
    const { data } = await apiClient.get<ProductSearchResponse>(
      ENDPOINTS.products.search,
      {
        query: {
          q: args.query,
          category: args.category,
          limit: args.limit ?? 20,
          offset: args.offset ?? 0,
          sort: args.sortBy,
        },
      },
    );
    return data;
  },
});

/** Fetch single product by ID */
export const fetchProduct = action({
  args: {
    productId: v.string(),
  },
  handler: async (_ctx, args) => {
    const path = resolvePath(ENDPOINTS.products.getById, {
      id: args.productId,
    });
    const { data } = await apiClient.get(path);
    return data;
  },
});

/** Fetch product by URL (for buy-link) */
export const fetchProductByUrl = action({
  args: {
    url: v.string(),
  },
  handler: async (_ctx, args) => {
    const { data } = await apiClient.get(ENDPOINTS.products.getByUrl, {
      query: { url: args.url },
    });
    return data;
  },
});

// ══════════════════════════════════════════════
// CART
// ══════════════════════════════════════════════

/** Get cart contents */
export const getCart = action({
  args: {
    token: v.string(),
  },
  handler: async (_ctx, args) => {
    const { data } = await apiClient.get<CartResponse>(ENDPOINTS.cart.get, {
      token: args.token,
    });
    return data;
  },
});

/** Add item to cart */
export const addToCart = action({
  args: {
    token: v.string(),
    productId: v.string(),
    quantity: v.number(),
    size: v.optional(v.string()),
  },
  handler: async (_ctx, args) => {
    const { data } = await apiClient.post<CartResponse>(
      ENDPOINTS.cart.addItem,
      {
        productId: args.productId,
        quantity: args.quantity,
        size: args.size,
      },
      { token: args.token },
    );
    return data;
  },
});

/** Update cart item quantity */
export const updateCartItem = action({
  args: {
    token: v.string(),
    itemId: v.string(),
    quantity: v.number(),
  },
  handler: async (_ctx, args) => {
    const path = resolvePath(ENDPOINTS.cart.updateItem, {
      itemId: args.itemId,
    });
    const { data } = await apiClient.put<CartResponse>(
      path,
      { quantity: args.quantity },
      { token: args.token },
    );
    return data;
  },
});

/** Remove item from cart */
export const removeFromCart = action({
  args: {
    token: v.string(),
    itemId: v.string(),
  },
  handler: async (_ctx, args) => {
    const path = resolvePath(ENDPOINTS.cart.removeItem, {
      itemId: args.itemId,
    });
    const { data } = await apiClient.del<CartResponse>(path, {
      token: args.token,
    });
    return data;
  },
});

/** Validate cart prices against current API prices */
export const validateCartPrices = action({
  args: {
    token: v.string(),
  },
  handler: async (_ctx, args) => {
    const { data } = await apiClient.post<PriceValidationResponse>(
      ENDPOINTS.cart.validatePrices,
      {},
      { token: args.token },
    );
    return data;
  },
});

// ══════════════════════════════════════════════
// ORDERS
// ══════════════════════════════════════════════

/** Place a new order */
export const createOrder = action({
  args: {
    token: v.string(),
    sessionToken: v.string(),
    items: v.array(
      v.object({
        productId: v.string(),
        quantity: v.number(),
        size: v.optional(v.string()),
      }),
    ),
    addressId: v.string(),
    paymentMethod: v.string(),
    idempotencyKey: v.optional(v.string()),
  },
  handler: async (_ctx, args) => {
    const { data } = await apiClient.post<CreateOrderResponse>(
      ENDPOINTS.orders.create,
      {
        items: args.items,
        addressId: args.addressId,
        paymentMethod: args.paymentMethod,
        idempotencyKey: args.idempotencyKey,
      },
      {
        token: args.token,
        headers: {
          "X-Session-Token": args.sessionToken,
        },
      },
    );
    return data;
  },
});

/** Get order details */
export const getOrder = action({
  args: {
    token: v.string(),
    orderId: v.string(),
  },
  handler: async (_ctx, args) => {
    const path = resolvePath(ENDPOINTS.orders.getById, {
      id: args.orderId,
    });
    const { data } = await apiClient.get(path, { token: args.token });
    return data;
  },
});

// ══════════════════════════════════════════════
// PAYMENTS
// ══════════════════════════════════════════════

/** Generate UPI QR code for payment */
export const createPaymentQr = action({
  args: {
    orderId: v.string(),
    amount: v.number(),
    upiId: v.optional(v.string()),
    token: v.string(),
  },
  handler: async (_ctx, args) => {
    const { data } = await apiClient.post<CreateQrResponse>(
      ENDPOINTS.payments.createQr,
      {
        orderId: args.orderId,
        amount: args.amount,
        upiId: args.upiId,
      },
      { token: args.token },
    );
    return data;
  },
});

/** Verify payment status with exponential backoff */
export const verifyPayment = action({
  args: {
    orderId: v.string(),
    transactionId: v.optional(v.string()),
    attemptNumber: v.optional(v.number()),
    token: v.string(),
  },
  handler: async (_ctx, args) => {
    const path = resolvePath(ENDPOINTS.payments.verify, {
      orderId: args.orderId,
    });
    const { data } = await apiClient.post<VerifyPaymentResponse>(
      path,
      {
        transactionId: args.transactionId,
        attemptNumber: args.attemptNumber ?? 0,
      },
      { token: args.token },
    );
    return data;
  },
});

/** Poll payment status */
export const getPaymentStatus = action({
  args: {
    orderId: v.string(),
    token: v.string(),
  },
  handler: async (_ctx, args) => {
    const path = resolvePath(ENDPOINTS.payments.status, {
      orderId: args.orderId,
    });
    const { data } = await apiClient.get(path, { token: args.token });
    return data;
  },
});

// ══════════════════════════════════════════════
// ADDRESSES
// ══════════════════════════════════════════════

/** Fetch all addresses */
export const getAddresses = action({
  args: {
    token: v.string(),
  },
  handler: async (_ctx, args) => {
    const { data } = await apiClient.get(ENDPOINTS.addresses.list, {
      token: args.token,
    });
    return data;
  },
});

/** Add a new address */
export const addAddress = action({
  args: {
    token: v.string(),
    address: v.object({
      name: v.string(),
      phone: v.string(),
      pincode: v.string(),
      city: v.string(),
      state: v.string(),
      houseNumber: v.string(),
      area: v.string(),
      landmark: v.optional(v.string()),
      label: v.union(
        v.literal("home"),
        v.literal("work"),
        v.literal("other"),
      ),
    }),
  },
  handler: async (_ctx, args) => {
    const { data } = await apiClient.post(
      ENDPOINTS.addresses.add,
      args.address,
      { token: args.token },
    );
    return data;
  },
});

// ══════════════════════════════════════════════
// SESSIONS
// ══════════════════════════════════════════════

/** Refresh platform session */
export const refreshSession = action({
  args: {
    token: v.string(),
    accountId: v.string(),
  },
  handler: async (_ctx, args) => {
    const { data } = await apiClient.post(
      ENDPOINTS.sessions.refresh,
      { accountId: args.accountId },
      { token: args.token },
    );
    return data;
  },
});

/** Export session data as JSON */
export const exportSessionData = action({
  args: {
    token: v.string(),
    accountId: v.string(),
  },
  handler: async (_ctx, args) => {
    const path = resolvePath(ENDPOINTS.accounts.exportSession, {
      id: args.accountId,
    });
    const { data } = await apiClient.get<SessionExportData>(path, {
      token: args.token,
    });
    return data;
  },
});

// ══════════════════════════════════════════════
// REFERRALS
// ══════════════════════════════════════════════

/** Generate referral code and link */
export const generateReferral = action({
  args: {
    token: v.string(),
  },
  handler: async (_ctx, args) => {
    const { data } = await apiClient.post(
      ENDPOINTS.referrals.generate,
      {},
      { token: args.token },
    );
    return data;
  },
});

/** Get referral stats */
export const getReferralStats = action({
  args: {
    token: v.string(),
  },
  handler: async (_ctx, args) => {
    const { data } = await apiClient.get(ENDPOINTS.referrals.getStats, {
      token: args.token,
    });
    return data;
  },
});

// ══════════════════════════════════════════════
// OFFER HUNTING
// ══════════════════════════════════════════════

/** Fetch available welcome bonus tiers */
export const fetchWelcomeTiers = action({
  args: {
    token: v.optional(v.string()),
  },
  handler: async (_ctx, args) => {
    const { data } = await apiClient.get<WelcomeTier[]>(
      ENDPOINTS.offers.welcomeTiers,
      {
        token: args.token,
        query: { timestamp: Date.now() },
      },
    );
    return data;
  },
});

/** Run offer hunt for a specific discount target */
export const huntOffer = action({
  args: {
    token: v.string(),
    targetDiscount: v.number(),
    maxAttempts: v.optional(v.number()),
  },
  handler: async (_ctx, args) => {
    const { data } = await apiClient.post(
      ENDPOINTS.offers.hunt,
      {
        targetDiscount: args.targetDiscount,
        maxAttempts: args.maxAttempts ?? 15,
      },
      { token: args.token },
    );
    return data;
  },
});

// ══════════════════════════════════════════════
// WALLET
// ══════════════════════════════════════════════

/** Get wallet balance */
export const getWallet = action({
  args: {
    token: v.string(),
  },
  handler: async (_ctx, args) => {
    const { data } = await apiClient.get(ENDPOINTS.wallet.get, {
      token: args.token,
    });
    return data;
  },
});

/** Get wallet transactions */
export const getWalletTransactions = action({
  args: {
    token: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (_ctx, args) => {
    const { data } = await apiClient.get(ENDPOINTS.wallet.transactions, {
      token: args.token,
      query: { limit: args.limit ?? 20 },
    });
    return data;
  },
});

// ══════════════════════════════════════════════
// LINKED ACCOUNTS
// ══════════════════════════════════════════════

/** Initiate account linking */
export const linkAccount = action({
  args: {
    token: v.string(),
    phone: v.string(),
    platform: v.string(),
    referralCode: v.optional(v.string()),
    welcomeBonus: v.number(),
  },
  handler: async (_ctx, args) => {
    const { data } = await apiClient.post(
      ENDPOINTS.accounts.link,
      {
        phone: args.phone,
        platform: args.platform,
        referralCode: args.referralCode,
        welcomeBonus: args.welcomeBonus,
      },
      { token: args.token },
    );
    return data;
  },
});

/** Verify OTP for linked account */
export const verifyLinkedAccount = action({
  args: {
    token: v.string(),
    accountId: v.string(),
    otp: v.string(),
  },
  handler: async (_ctx, args) => {
    const { data } = await apiClient.post(
      ENDPOINTS.accounts.verify,
      {
        accountId: args.accountId,
        otp: args.otp,
      },
      { token: args.token },
    );
    return data;
  },
});

/** Unlink an account */
export const unlinkAccount = action({
  args: {
    token: v.string(),
    accountId: v.string(),
  },
  handler: async (_ctx, args) => {
    const path = resolvePath(ENDPOINTS.accounts.unlink, {
      id: args.accountId,
    });
    const { data } = await apiClient.del(path, { token: args.token });
    return data;
  },
});
