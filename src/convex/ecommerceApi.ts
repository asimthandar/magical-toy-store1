import { action } from "./_generated/server";
import { v } from "convex/values";

/**
 * E-Commerce API Abstraction Layer
 * 
 * In production, these would make real HTTP calls to the target e-commerce platform.
 * For v1, they simulate API responses with realistic behavior.
 * 
 * Architecture note: This is the "API Abstraction Layer" from the blueprint.
 * All external e-commerce calls should go through this module.
 */

// User-Agent pool for device rotation (50+ variations)
const USER_AGENT_POOL = [
  "Mozilla/5.0 (Linux; Android 14; SM-S928B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.6099.144 Mobile Safari/537.36",
  "Mozilla/5.0 (iPhone; CPU iPhone OS 17_2_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Mobile/15E148 Safari/604.1",
  "Mozilla/5.0 (Linux; Android 13; Pixel 8 Pro) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.6045.163 Mobile Safari/537.36",
  "Mozilla/5.0 (Linux; Android 12; SM-A536B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/118.0.5993.100 Mobile Safari/537.36",
  "Mozilla/5.0 (iPhone; CPU iPhone OS 16_7_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1",
  "Mozilla/5.0 (Linux; Android 14; SM-A546B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.6099.210 Mobile Safari/537.36",
  "Mozilla/5.0 (Linux; Android 13; SM-G991B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.6045.134 Mobile Safari/537.36",
  "Mozilla/5.0 (iPhone; CPU iPhone OS 17_1_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.1 Mobile/15E148 Safari/604.1",
  "Mozilla/5.0 (Linux; Android 12; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/117.0.5938.60 Mobile Safari/537.36",
  "Mozilla/5.0 (Linux; Android 13; SM-M536B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/118.0.5993.80 Mobile Safari/537.36",
];

// Device ID pool (MD5-based hashing in production)
const DEVICE_ID_POOL = [
  "dev_a1b2c3d4e5f6",
  "dev_f6e5d4c3b2a1",
  "dev_1a2b3c4d5e6f",
  "dev_6f5e4d3c2b1a",
  "dev_a1b2c3d4e5f7",
  "dev_f6e5d4c3b2a2",
  "dev_1a2b3c4d5e6g",
  "dev_6f5e4d3c2b1b",
  "dev_a1b2c3d4e5f8",
  "dev_f6e5d4c3b2a3",
];

// Proxy pool (in production: Bright Data / Oxylabs rotating residential proxies)
const PROXY_POOL = [
  { ip: "103.152.112.0", country: "IN", type: "residential" },
  { ip: "45.249.67.0", country: "IN", type: "datacenter" },
  { ip: "103.216.82.0", country: "IN", type: "residential" },
  { ip: "115.238.90.0", country: "IN", type: "mobile" },
  { ip: "202.142.81.0", country: "IN", type: "residential" },
];

// Circuit breaker state (in-memory for v1, Redis in production)
let consecutiveFailures = 0;
let circuitOpenUntil = 0;
const MAX_FAILURES = 10;
const COOLDOWN_MS = 30 * 60 * 1000; // 30 minutes

/**
 * Check if circuit breaker is open (too many consecutive failures)
 */
function isCircuitOpen(): boolean {
  if (Date.now() < circuitOpenUntil) return true;
  if (consecutiveFailures >= MAX_FAILURES) {
    circuitOpenUntil = Date.now() + COOLDOWN_MS;
    return true;
  }
  return false;
}

/**
 * Generate a random device fingerprint for API calls
 */
function getDeviceFingerprint(attemptNumber: number) {
  return {
    userAgent: USER_AGENT_POOL[attemptNumber % USER_AGENT_POOL.length],
    deviceId: DEVICE_ID_POOL[attemptNumber % DEVICE_ID_POOL.length],
    proxy: PROXY_POOL[attemptNumber % PROXY_POOL.length],
    screenWidth: [1080, 1440, 720, 1170, 1179][attemptNumber % 5],
    screenHeight: [2400, 3200, 1600, 2532, 2556][attemptNumber % 5],
  };
}

/**
 * Simulate a delay to avoid pattern detection (2-5 seconds random)
 */
function simulateNetworkDelay(): Promise<void> {
  const delay = 2000 + Math.random() * 3000;
  return new Promise((resolve) => setTimeout(resolve, Math.min(delay, 1000))); // Capped at 1s for v1
}

/**
 * Send OTP via e-commerce platform API
 * In production: POST /api/auth/send-otp with phone, device_id, user_agent
 */
export const sendOtp = action({
  args: {
    phone: v.string(),
    attemptNumber: v.optional(v.number()),
  },
  handler: async (_ctx, args) => {
    if (isCircuitOpen()) {
      throw new Error("System is cooling down due to multiple failures. Please try again in 30 minutes.");
    }

    const attempt = args.attemptNumber ?? 0;
    const fingerprint = getDeviceFingerprint(attempt);

    console.log(`[ECommerce API] Sending OTP to ${args.phone}`);
    console.log(`[ECommerce API] Device: ${fingerprint.deviceId}`);
    console.log(`[ECommerce API] User-Agent: ${fingerprint.userAgent}`);
    console.log(`[ECommerce API] Proxy: ${fingerprint.proxy.ip} (${fingerprint.proxy.country})`);

    // Simulate API call delay
    await simulateNetworkDelay();

    // In production, this would be:
    // const response = await fetch('https://ecommerce.com/api/auth/send-otp', {
    //   method: 'POST',
    //   headers: {
    //     'Content-Type': 'application/json',
    //     'User-Agent': fingerprint.userAgent,
    //     'X-Device-ID': fingerprint.deviceId,
    //   },
    //   body: JSON.stringify({ phone: args.phone }),
    // });

    // Simulate success (in production, handle 429/403 for rate limiting)
    return {
      success: true,
      message: `OTP sent to ${args.phone}`,
      deviceId: fingerprint.deviceId,
      proxy: fingerprint.proxy.ip,
    };
  },
});

/**
 * Verify OTP via e-commerce platform API
 * In production: POST /api/auth/verify-otp with phone, otp, device_id
 */
export const verifyOtp = action({
  args: {
    phone: v.string(),
    otp: v.string(),
    attemptNumber: v.optional(v.number()),
  },
  handler: async (_ctx, args) => {
    if (isCircuitOpen()) {
      throw new Error("System is cooling down. Please try again later.");
    }

    const attempt = args.attemptNumber ?? 0;
    const fingerprint = getDeviceFingerprint(attempt);

    console.log(`[ECommerce API] Verifying OTP for ${args.phone}`);
    console.log(`[ECommerce API] Device: ${fingerprint.deviceId}`);

    await simulateNetworkDelay();

    // In production: POST /api/auth/verify-otp
    // Returns: { accessToken, refreshToken, userId, expiresIn }

    // Simulate token generation
    const tokens = {
      accessToken: `acc_${Date.now()}_${Math.random().toString(36).slice(2)}`,
      refreshToken: `ref_${Date.now()}_${Math.random().toString(36).slice(2)}`,
      userId: `platform_${args.phone}`,
      expiresAt: Date.now() + 24 * 60 * 60 * 1000,
      issuedAt: Date.now(),
      deviceId: fingerprint.deviceId,
    };

    consecutiveFailures = 0; // Reset on success

    return {
      success: true,
      tokens,
      message: "OTP verified successfully",
    };
  },
});

/**
 * Search products via e-commerce platform API
 * In production: GET /api/products/search?query=...&limit=...&offset=...
 */
export const searchProducts = action({
  args: {
    query: v.string(),
    limit: v.optional(v.number()),
    offset: v.optional(v.number()),
  },
  handler: async (_ctx, args) => {
    console.log(`[ECommerce API] Searching products: "${args.query}"`);

    // In production, this would call the actual e-commerce search API
    // For v1, return the query for the frontend to handle via Convex queries
    return {
      query: args.query,
      limit: args.limit ?? 20,
      offset: args.offset ?? 0,
      message: "Search query processed",
    };
  },
});

/**
 * Fetch product details via e-commerce platform API
 * In production: GET /api/products/{id}
 */
export const fetchProduct = action({
  args: {
    productId: v.string(),
    attemptNumber: v.optional(v.number()),
  },
  handler: async (_ctx, args) => {
    console.log(`[ECommerce API] Fetching product: ${args.productId}`);

    const attempt = args.attemptNumber ?? 0;
    const fingerprint = getDeviceFingerprint(attempt);

    await simulateNetworkDelay();

    // In production: GET /api/products/{id} with auth headers
    return {
      productId: args.productId,
      fetched: true,
      device: fingerprint.deviceId,
    };
  },
});

/**
 * Create order via e-commerce platform API
 * In production: POST /api/orders/create with session_id, items, address_id
 */
export const createOrder = action({
  args: {
    sessionId: v.string(),
    items: v.array(v.object({
      productId: v.string(),
      quantity: v.number(),
      size: v.optional(v.string()),
    })),
    addressId: v.string(),
    paymentMethod: v.string(),
  },
  handler: async (_ctx, args) => {
    console.log(`[ECommerce API] Creating order with ${args.items.length} items`);
    console.log(`[ECommerce API] Session: ${args.sessionId}`);
    console.log(`[ECommerce API] Address: ${args.addressId}`);

    await simulateNetworkDelay();

    // In production: POST /api/orders/create
    // Returns: { orderId, orderNumber, status, estimatedDelivery }

    const orderNumber = `ORD${Date.now().toString().slice(-8)}`;

    return {
      success: true,
      orderNumber,
      status: "confirmed",
      estimatedDelivery: "3-5 business days",
      message: "Order placed successfully",
    };
  },
});

/**
 * Verify payment via e-commerce platform API
 * In production: GET /api/payments/{orderId}/status
 * Uses exponential backoff for retries
 */
export const verifyPaymentStatus = action({
  args: {
    orderId: v.string(),
    transactionId: v.optional(v.string()),
    attemptNumber: v.optional(v.number()),
  },
  handler: async (_ctx, args) => {
    console.log(`[ECommerce API] Verifying payment for order: ${args.orderId}`);

    const attempt = args.attemptNumber ?? 0;

    // Exponential backoff: 1s, 2s, 4s, 8s...
    const backoffMs = Math.min(1000 * Math.pow(2, attempt), 15000);
    await new Promise((r) => setTimeout(r, Math.min(backoffMs, 500))); // Capped for v1

    // In production: GET /api/payments/{orderId}/status
    // Returns: { status: 'pending' | 'completed' | 'failed', transactionId }

    // Simulate: 70% success after 3+ attempts
    const successProbability = Math.min(0.3 + attempt * 0.15, 0.85);
    const isSuccess = Math.random() < successProbability;

    if (isSuccess) {
      consecutiveFailures = 0;
      return {
        status: "completed" as const,
        transactionId: args.transactionId || `txn_${Date.now()}`,
        message: "Payment verified successfully",
      };
    }

    if (attempt >= 5) {
      // After 5 attempts, assume pending
      return {
        status: "pending" as const,
        transactionId: args.transactionId,
        message: "Payment is still being processed. Please check again later.",
      };
    }

    return {
      status: "pending" as const,
      transactionId: args.transactionId,
      message: "Payment verification in progress",
    };
  },
});

/**
 * Fetch available welcome bonus tiers
 * In production: GET /api/offers/welcome-bonus with device fingerprint
 */
export const fetchWelcomeTiers = action({
  args: {
    attemptNumber: v.optional(v.number()),
  },
  handler: async (_ctx, args) => {
    if (isCircuitOpen()) {
      throw new Error("System is cooling down. Please try again later.");
    }

    const attempt = args.attemptNumber ?? 0;
    const fingerprint = getDeviceFingerprint(attempt);

    console.log(`[ECommerce API] Fetching welcome tiers`);
    console.log(`[ECommerce API] Device: ${fingerprint.deviceId}`);
    console.log(`[ECommerce API] Proxy: ${fingerprint.proxy.ip}`);

    await simulateNetworkDelay();

    // In production: GET /api/offers/welcome-bonus
    // The tiers available depend on the device fingerprint and proxy

    return {
      tiers: [110, 120, 135, 150, 180],
      deviceUsed: fingerprint.deviceId,
      proxyUsed: fingerprint.proxy.ip,
    };
  },
});
