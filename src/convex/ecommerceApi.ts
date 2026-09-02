/**
 * E-Commerce API Abstraction Layer
 *
 * All external calls go through this module.
 * Endpoints matched from HAR analysis of api.localproject.dev
 *
 * Setup:
 * 1. Set ECOMMERCE_API_BASE_URL in Convex Environment Variables
 * 2. Set ECOMMERCE_API_KEY if needed
 */

import { action } from "./_generated/server";
import { v } from "convex/values";
import { apiClient, resolvePath } from "../lib/apiClient";
import {
  ENDPOINTS,
  type SendOtpResponse,
  type VerifyOtpResponse,
  type FeedResponse,
  type CartResponse,
  type OrderResponse,
  type PaymentOption,
  type Address,
} from "../lib/apiConfig";

// ══════════════════════════════════════════════
// AUTH
// ══════════════════════════════════════════════

/** Send OTP to phone number */
export const sendOtp = action({
  args: {
    phone_number: v.string(),
  },
  handler: async (_ctx, args) => {
    const { data } = await apiClient.post<SendOtpResponse>(
      ENDPOINTS.auth.sendOtp,
      {
        phone_number: args.phone_number,
      },
    );
    return data;
  },
});

/** Verify OTP and get session tokens */
export const verifyOtp = action({
  args: {
    request_id: v.string(),
    instance_id: v.string(),
    phone_number: v.string(),
    otp: v.string(),
    login_type: v.optional(v.string()),
  },
  handler: async (_ctx, args) => {
    const { data } = await apiClient.post<VerifyOtpResponse>(
      ENDPOINTS.auth.verifyOtp,
      {
        request_id: args.request_id,
        instance_id: args.instance_id,
        phone_number: args.phone_number,
        otp: args.otp,
        login_type: args.login_type || "otp",
      },
    );
    return data;
  },
});

// ══════════════════════════════════════════════
// PRODUCTS / FEED
// ══════════════════════════════════════════════

/** Get product feed with filters */
export const getFeed = action({
  args: {
    type: v.string(),
    sort_option: v.optional(v.string()),
    selected_filters: v.optional(v.array(v.string())),
    selectedFilterIds: v.optional(v.array(v.string())),
    session_state: v.optional(v.string()),
    offset: v.optional(v.number()),
    limit: v.optional(v.number()),
  },
  handler: async (_ctx, args) => {
    const { data } = await apiClient.post<FeedResponse>(
      ENDPOINTS.products.feed,
      {
        filter: {
          type: args.type,
          sort_option: args.sort_option ?? null,
          selected_filters: args.selected_filters ?? [],
          session_state: args.session_state ?? "",
          selectedFilterIds: args.selectedFilterIds ?? [],
        },
        offset: args.offset ?? 0,
        limit: args.limit ?? 20,
      },
    );
    return data;
  },
});

/** Get feed filter configuration */
export const getFeedFilterConfig = action({
  args: {
    type: v.string(),
    sort_option: v.optional(v.string()),
    selected_filters: v.optional(v.array(v.string())),
    selectedFilterIds: v.optional(v.array(v.string())),
    session_state: v.optional(v.string()),
  },
  handler: async (_ctx, args) => {
    const { data } = await apiClient.post(
      ENDPOINTS.products.feedFilterConfig,
      {
        type: args.type,
        sort_option: args.sort_option ?? null,
        selected_filters: args.selected_filters ?? [],
        selectedFilterIds: args.selectedFilterIds ?? [],
        session_state: args.session_state ?? "",
      },
    );
    return data;
  },
});

/** Get product detail by ID */
export const getProductDetail = action({
  args: {
    productId: v.string(),
    include_catalog: v.optional(v.boolean()),
    ad_active: v.optional(v.boolean()),
  },
  handler: async (_ctx, args) => {
    const path = resolvePath(ENDPOINTS.products.detail, {
      productId: args.productId,
    });
    const { data } = await apiClient.post(path, {
      include_catalog: args.include_catalog ?? true,
      ad_active: args.ad_active ?? false,
    });
    return data;
  },
});

/** Get product insights */
export const getProductInsights = action({
  args: {
    pid: v.number(),
  },
  handler: async (_ctx, args) => {
    const { data } = await apiClient.post(ENDPOINTS.products.insights, {
      pid: args.pid,
    });
    return data;
  },
});

/** Get product recommendations */
export const getRecommendations = action({
  args: {
    productId: v.string(),
    cursor: v.optional(v.string()),
    offset: v.optional(v.number()),
    limit: v.optional(v.number()),
  },
  handler: async (_ctx, args) => {
    const path = resolvePath(ENDPOINTS.products.recommendation, {
      productId: args.productId,
    });
    const { data } = await apiClient.post(path, {
      cursor: args.cursor ?? null,
      offset: args.offset ?? 0,
      limit: args.limit ?? 10,
    });
    return data;
  },
});

/** Get catalog/review data */
export const getCatalogs = action({
  args: {
    catalogId: v.number(),
    productId: v.string(),
    reviewsWithMedia: v.optional(v.boolean()),
    limit: v.optional(v.number()),
  },
  handler: async (_ctx, args) => {
    const { data } = await apiClient.post(ENDPOINTS.products.catalogs, {
      catalogId: args.catalogId,
      productId: args.productId,
      reviewsWithMedia: args.reviewsWithMedia ?? false,
      limit: args.limit ?? 10,
    });
    return data;
  },
});

/** Get navigation tree */
export const getNavigationTree = action({
  args: {},
  handler: async (_ctx) => {
    const { data } = await apiClient.get(ENDPOINTS.products.navigationTree);
    return data;
  },
});

// ══════════════════════════════════════════════
// CART
// ══════════════════════════════════════════════

/** Add item to cart */
export const addToCart = action({
  args: {
    identifier: v.string(),
    items: v.array(
      v.object({
        product_id: v.string(),
        supplier_id: v.number(),
        variation: v.optional(v.string()),
        variation_id: v.optional(v.string()),
        quantity: v.number(),
      }),
    ),
  },
  handler: async (_ctx, args) => {
    const { data } = await apiClient.post<CartResponse>(
      ENDPOINTS.cart.addToCart,
      {
        identifier: args.identifier,
        items: args.items,
      },
    );
    return data;
  },
});

/** Get cart quantity */
export const getCartQuantity = action({
  args: {},
  handler: async (_ctx) => {
    const { data } = await apiClient.get(ENDPOINTS.cart.cartQuantity);
    return data;
  },
});

/** Get full cart state */
export const getCartState = action({
  args: {
    context: v.string(),
    identifier: v.string(),
    cart_session: v.string(),
    user_id: v.number(),
  },
  handler: async (_ctx, args) => {
    const { data } = await apiClient.post<CartResponse>(
      ENDPOINTS.cart.cartState,
      {
        context: args.context,
        identifier: args.identifier,
        cart_session: args.cart_session,
        user_id: args.user_id,
      },
    );
    return data;
  },
});

/** Set cart delivery location */
export const setCartLocation = action({
  args: {
    address_id: v.number(),
    cart_session: v.string(),
    context: v.string(),
    dest_pin: v.string(),
    identifier: v.string(),
  },
  handler: async (_ctx, args) => {
    const { data } = await apiClient.post(
      ENDPOINTS.cart.cartLocation,
      {
        address_id: args.address_id,
        cart_session: args.cart_session,
        context: args.context,
        dest_pin: args.dest_pin,
        identifier: args.identifier,
      },
    );
    return data;
  },
});

/** Get compact cart view */
export const getCartMinview = action({
  args: {},
  handler: async (_ctx) => {
    const { data } = await apiClient.get(ENDPOINTS.cart.cartMinview);
    return data;
  },
});

// ══════════════════════════════════════════════
// CHECKOUT
// ══════════════════════════════════════════════

/** Get checkout config */
export const getCheckoutConfig = action({
  args: {},
  handler: async (_ctx) => {
    const { data } = await apiClient.get(ENDPOINTS.checkout.config);
    return data;
  },
});

/** Get user profile for checkout */
export const getUserProfile = action({
  args: {},
  handler: async (_ctx) => {
    const { data } = await apiClient.get(ENDPOINTS.checkout.userProfile);
    return data;
  },
});

// ══════════════════════════════════════════════
// ADDRESSES
// ══════════════════════════════════════════════

/** Get all addresses */
export const getAddresses = action({
  args: {},
  handler: async (_ctx) => {
    const { data } = await apiClient.get<Address[]>(
      ENDPOINTS.addresses.list,
    );
    return data;
  },
});

/** Update an address */
export const updateAddress = action({
  args: {
    addressId: v.number(),
    address_line_1: v.string(),
    address_line_2: v.optional(v.string()),
    address_type: v.string(),
    city: v.string(),
    state: v.string(),
    pincode: v.string(),
    landmark: v.optional(v.string()),
  },
  handler: async (_ctx, args) => {
    const path = resolvePath(ENDPOINTS.addresses.update, {
      addressId: args.addressId,
    });
    const { data } = await apiClient.put(path, {
      address_line_1: args.address_line_1,
      address_line_2: args.address_line_2 ?? "",
      address_type: args.address_type,
      city: args.city,
      state: args.state,
      pincode: args.pincode,
      landmark: args.landmark ?? "",
    });
    return data;
  },
});

// ══════════════════════════════════════════════
// PAYMENTS
// ══════════════════════════════════════════════

/** Get available payment options */
export const getPaymentOptions = action({
  args: {
    cart_session: v.string(),
    checkout_identifier: v.string(),
    order_total: v.number(),
    user_id: v.number(),
    address_id: v.optional(v.number()),
  },
  handler: async (_ctx, args) => {
    const { data } = await apiClient.post<PaymentOption[]>(
      ENDPOINTS.payments.paymentOptions,
      {
        cart_session: args.cart_session,
        checkout_identifier: args.checkout_identifier,
        order_total: args.order_total,
        user_id: args.user_id,
        address_id: args.address_id,
      },
    );
    return data;
  },
});

/** Get payment user details */
export const getPaymentUserDetails = action({
  args: {
    identifier: v.string(),
    userId: v.number(),
    is_headless_enabled: v.optional(v.boolean()),
    actions: v.optional(v.array(v.string())),
  },
  handler: async (_ctx, args) => {
    const { data } = await apiClient.post(
      ENDPOINTS.payments.userDetails,
      {
        identifier: args.identifier,
        userId: args.userId,
        is_headless_enabled: args.is_headless_enabled ?? false,
        actions: args.actions ?? [],
      },
    );
    return data;
  },
});

/** Get Juspay offers */
export const getJuspayOffers = action({
  args: {
    customer: v.object({
      phone: v.string(),
      email: v.optional(v.string()),
      id: v.optional(v.string()),
    }),
    merchant_key_id: v.optional(v.string()),
  },
  handler: async (_ctx, args) => {
    const { data } = await apiClient.post(
      ENDPOINTS.payments.juspayOffers,
      {
        customer: args.customer,
        merchant_key_id: args.merchant_key_id,
      },
    );
    return data;
  },
});

/** Submit payment info */
export const submitPaymentInfo = action({
  args: {
    context: v.string(),
    user_id: v.number(),
    identifier: v.string(),
    cart_session: v.string(),
    payment_modes: v.optional(v.array(v.string())),
  },
  handler: async (_ctx, args) => {
    const { data } = await apiClient.post(
      ENDPOINTS.payments.paymentInfo,
      {
        context: args.context,
        user_id: args.user_id,
        identifier: args.identifier,
        cart_session: args.cart_session,
        payment_modes: args.payment_modes,
      },
    );
    return data;
  },
});

/** Create Juspay transaction */
export const createJuspayTxn = action({
  args: {
    order_id: v.string(),
    merchant_id: v.optional(v.string()),
    redirect_after_payment: v.optional(v.boolean()),
    format: v.optional(v.string()),
    txnPayload: v.optional(v.any()),
  },
  handler: async (_ctx, args) => {
    const { data } = await apiClient.post(
      ENDPOINTS.payments.juspayTxn,
      {
        order_id: args.order_id,
        merchant_id: args.merchant_id,
        redirect_after_payment: args.redirect_after_payment ?? true,
        format: args.format ?? "json",
        txnPayload: args.txnPayload,
      },
    );
    return data;
  },
});

// ══════════════════════════════════════════════
// ORDERS
// ══════════════════════════════════════════════

/** Create preorder (pre-order state before final order) */
export const createPreorder = action({
  args: {
    address_id: v.number(),
    cart_session: v.string(),
    customer_amount: v.number(),
    enable_price_unbundling: v.optional(v.boolean()),
    identifier: v.string(),
    user_id: v.number(),
  },
  handler: async (_ctx, args) => {
    const { data } = await apiClient.post(
      ENDPOINTS.orders.preorder,
      {
        address_id: args.address_id,
        cart_session: args.cart_session,
        customer_amount: args.customer_amount,
        enable_price_unbundling: args.enable_price_unbundling ?? false,
        identifier: args.identifier,
        user_id: args.user_id,
      },
    );
    return data;
  },
});

/** Place final order */
export const placeOrder = action({
  args: {
    order_num: v.string(),
    pre_order_id: v.string(),
    client_type: v.optional(v.string()),
  },
  handler: async (_ctx, args) => {
    const { data } = await apiClient.post<OrderResponse>(
      ENDPOINTS.orders.placeOrder,
      {
        order_num: args.order_num,
        pre_order_id: args.pre_order_id,
        client_type: args.client_type ?? "mweb",
      },
    );
    return data;
  },
});

/** Get order animation (confirmation resource) */
export const getOrderAnimation = action({
  args: {},
  handler: async (_ctx) => {
    const { data } = await apiClient.get(ENDPOINTS.orders.orderAnimation);
    return data;
  },
});
