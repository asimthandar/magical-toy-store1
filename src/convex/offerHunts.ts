import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import { query, mutation } from "./_generated/server";

// Discount buckets available for hunting
const DISCOUNT_BUCKETS = [110, 120, 135, 150, 180];

// Circuit breaker configuration
const MAX_CONSECUTIVE_FAILURES = 10;
const COOLDOWN_MS = 30 * 60 * 1000; // 30 minutes

// Enhanced device fingerprints with more details
const DEVICE_FINGERPRINTS = [
  { os: "Android 14", browser: "Chrome/120.0.6099.144", screen: "1080x2400", model: "SM-S928B" },
  { os: "Android 13", browser: "Chrome/119.0.6045.163", screen: "1080x2340", model: "Pixel 8 Pro" },
  { os: "iOS 17.2", browser: "Safari/17.2", screen: "1170x2532", model: "iPhone 15 Pro" },
  { os: "Android 12", browser: "Firefox/121.0", screen: "1080x2400", model: "SM-A536B" },
  { os: "Android 14", browser: "Chrome/118.0.5993.100", screen: "1080x2280", model: "SM-A546B" },
  { os: "iOS 16.7", browser: "Safari/17.1", screen: "1179x2556", model: "iPhone 14 Pro Max" },
  { os: "Android 13", browser: "Samsung/23.0", screen: "1080x2340", model: "SM-G991B" },
  { os: "Android 14", browser: "Chrome/120.0.6099.210", screen: "1440x3200", model: "SM-S926B" },
  { os: "iOS 17.1", browser: "Safari/16.6", screen: "1284x2778", model: "iPhone 14 Plus" },
  { os: "Android 13", browser: "Chrome/117.0.5938.60", screen: "1080x2400", model: "Pixel 7" },
  { os: "Android 14", browser: "Edge/120.0.2210.91", screen: "1080x2340", model: "SM-M536B" },
  { os: "iOS 17.0", browser: "Safari/17.0", screen: "1170x2532", model: "iPhone 15" },
  { os: "Android 12", browser: "Chrome/119.0.6045.134", screen: "1080x2160", model: "SM-A736B" },
  { os: "Android 13", browser: "Opera/76.0.4017.176", screen: "1080x2400", model: "Pixel 7a" },
  { os: "Android 14", browser: "Chrome/120.0.6099.230", screen: "720x1600", model: "SM-A146B" },
];

// Proxy pool for rotation
const PROXY_POOL = [
  { ip: "103.152.112.x", type: "residential" },
  { ip: "45.249.67.x", type: "datacenter" },
  { ip: "103.216.82.x", type: "residential" },
  { ip: "115.238.90.x", type: "mobile" },
  { ip: "202.142.81.x", type: "residential" },
];

/**
 * Simulate a single attempt to fetch a discount from the e-commerce platform.
 * Uses enhanced probability model with circuit breaker awareness.
 */
function simulateAttempt(
  targetDiscount: number,
  attemptNumber: number,
  device: (typeof DEVICE_FINGERPRINTS)[number],
  previousFailures: number,
): {
  discount: number;
  success: boolean;
  deviceUsed: typeof device;
  proxyUsed: (typeof PROXY_POOL)[number];
  timestamp: number;
  rateLimited: boolean;
} {
  // Check for rate limiting (simulated)
  const rateLimited = previousFailures >= 5 && Math.random() < 0.3;

  if (rateLimited) {
    return {
      discount: 0,
      success: false,
      deviceUsed: device,
      proxyUsed: PROXY_POOL[attemptNumber % PROXY_POOL.length],
      timestamp: Date.now(),
      rateLimited: true,
    };
  }

  // Enhanced probability model
  const rand = Math.random();
  let discount: number;

  if (targetDiscount >= 180) {
    // ₹180 is hardest — 8% chance per attempt, decreases with failures
    const adjustedChance = 0.08 * Math.max(0.5, 1 - previousFailures * 0.05);
    if (rand < adjustedChance) discount = 180;
    else if (rand < 0.20) discount = 150;
    else if (rand < 0.40) discount = 135;
    else if (rand < 0.65) discount = 120;
    else discount = 110;
  } else if (targetDiscount >= 150) {
    // ₹150 — 15% chance
    if (rand < 0.15) discount = 150;
    else if (rand < 0.35) discount = 135;
    else if (rand < 0.60) discount = 120;
    else discount = 110;
  } else if (targetDiscount >= 135) {
    // ₹135 — 22% chance
    if (rand < 0.22) discount = 135;
    else if (rand < 0.50) discount = 120;
    else discount = 110;
  } else if (targetDiscount >= 120) {
    // ₹120 — 30% chance
    if (rand < 0.30) discount = 120;
    else if (rand < 0.65) discount = 110;
    else discount = 110;
  } else {
    // ₹110 — 45% chance
    if (rand < 0.45) discount = 110;
    else discount = 110;
  }

  // Later attempts have slightly better odds (simulating session warming)
  const attemptBoost = Math.min(attemptNumber * 0.02, 0.1);
  if (discount < targetDiscount && rand < attemptBoost) {
    discount = Math.min(discount + 15, targetDiscount);
  }

  return {
    discount,
    success: discount >= targetDiscount,
    deviceUsed: device,
    proxyUsed: PROXY_POOL[attemptNumber % PROXY_POOL.length],
    timestamp: Date.now(),
    rateLimited: false,
  };
}

export const start = mutation({
  args: {
    targetDiscount: v.number(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    // Validate target is a valid bucket
    if (!DISCOUNT_BUCKETS.includes(args.targetDiscount)) {
      throw new Error(
        `Invalid target. Choose from: ${DISCOUNT_BUCKETS.join(", ")}`,
      );
    }

    // Check for active hunt
    const activeHunt = await ctx.db
      .query("offerHunts")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .order("desc")
      .first();

    if (activeHunt && activeHunt.status === "hunting") {
      throw new Error("A hunt is already in progress");
    }

    // Check for cooldown
    if (activeHunt && activeHunt.status === "cooldown" && activeHunt.cooldownUntil) {
      if (Date.now() < activeHunt.cooldownUntil) {
        const remainingMinutes = Math.ceil((activeHunt.cooldownUntil - Date.now()) / 60000);
        throw new Error(`Cooling down. Please try again in ${remainingMinutes} minutes.`);
      }
    }

    // Audit log
    await ctx.db.insert("auditLogs", {
      userId,
      event: "offer_hunt_started",
      details: { targetDiscount: args.targetDiscount },
      createdAt: Date.now(),
    });

    const huntId = await ctx.db.insert("offerHunts", {
      userId,
      targetDiscount: args.targetDiscount,
      status: "hunting",
      bestDiscount: 0,
      attempts: 0,
      maxAttempts: 15,
      circuitBreakerFailures: 0,
      createdAt: Date.now(),
    });

    return huntId;
  },
});

export const attempt = mutation({
  args: {
    huntId: v.id("offerHunts"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const hunt = await ctx.db.get(args.huntId);
    if (!hunt || hunt.userId !== userId) throw new Error("Hunt not found");
    if (hunt.status !== "hunting") throw new Error("Hunt is not active");

    const attemptNum = hunt.attempts + 1;
    const device =
      DEVICE_FINGERPRINTS[attemptNum % DEVICE_FINGERPRINTS.length];
    const previousFailures = hunt.circuitBreakerFailures ?? 0;

    // Circuit breaker check
    if (previousFailures >= MAX_CONSECUTIVE_FAILURES) {
      await ctx.db.patch(args.huntId, {
        status: "cooldown",
        cooldownUntil: Date.now() + COOLDOWN_MS,
        completedAt: Date.now(),
      });

      // Audit log
      await ctx.db.insert("auditLogs", {
        userId,
        event: "offer_hunt_cooldown",
        details: {
          huntId: args.huntId,
          consecutiveFailures: previousFailures,
          cooldownMinutes: COOLDOWN_MS / 60000,
        },
        createdAt: Date.now(),
      });

      throw new Error("Circuit breaker triggered. Too many consecutive failures. Cooling down for 30 minutes.");
    }

    const result = simulateAttempt(
      hunt.targetDiscount,
      attemptNum,
      device,
      previousFailures,
    );

    const newBest = Math.max(hunt.bestDiscount, result.discount);
    const newFailures = result.rateLimited || !result.success
      ? previousFailures + 1
      : 0;
    const isComplete =
      result.success || attemptNum >= hunt.maxAttempts;

    // Audit log for each attempt
    await ctx.db.insert("auditLogs", {
      userId,
      event: "offer_hunt_attempt",
      details: {
        huntId: args.huntId,
        attempt: attemptNum,
        discount: result.discount,
        success: result.success,
        rateLimited: result.rateLimited,
        device: result.deviceUsed.os,
        proxy: result.proxyUsed.ip,
      },
      createdAt: Date.now(),
    });

    await ctx.db.patch(args.huntId, {
      attempts: attemptNum,
      bestDiscount: newBest,
      circuitBreakerFailures: newFailures,
      status: isComplete
        ? result.success
          ? "success"
          : "fallback"
        : "hunting",
      resultDetails: {
        lastAttempt: result,
        bestAttempt: newBest,
        attemptedDevices: attemptNum,
        rateLimited: result.rateLimited,
      },
      completedAt: isComplete ? Date.now() : undefined,
    });

    return {
      attempt: attemptNum,
      discount: result.discount,
      success: result.success,
      bestDiscount: newBest,
      device: result.deviceUsed,
      proxy: result.proxyUsed,
      isComplete,
      remainingAttempts: hunt.maxAttempts - attemptNum,
      rateLimited: result.rateLimited,
      circuitBreakerFailures: newFailures,
    };
  },
});

export const runAll = mutation({
  args: {
    huntId: v.id("offerHunts"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const hunt = await ctx.db.get(args.huntId);
    if (!hunt || hunt.userId !== userId) throw new Error("Hunt not found");
    if (hunt.status !== "hunting") throw new Error("Hunt is not active");

    let bestDiscount = hunt.bestDiscount;
    let attempts = hunt.attempts;
    let circuitBreakerFailures = hunt.circuitBreakerFailures ?? 0;
    let status: "hunting" | "success" | "fallback" | "failed" | "cooldown" = "hunting";
    let lastResult;
    let completedAt: number | undefined;

    while (attempts < hunt.maxAttempts && status === "hunting") {
      // Circuit breaker check
      if (circuitBreakerFailures >= MAX_CONSECUTIVE_FAILURES) {
        status = "cooldown";
        completedAt = Date.now();
        break;
      }

      attempts++;
      const device =
        DEVICE_FINGERPRINTS[attempts % DEVICE_FINGERPRINTS.length];
      const result = simulateAttempt(
        hunt.targetDiscount,
        attempts,
        device,
        circuitBreakerFailures,
      );

      bestDiscount = Math.max(bestDiscount, result.discount);

      if (result.rateLimited || !result.success) {
        circuitBreakerFailures++;
      } else {
        circuitBreakerFailures = 0;
      }

      lastResult = {
        attempt: attempts,
        discount: result.discount,
        success: result.success,
        device: result.deviceUsed,
        proxy: result.proxyUsed,
        timestamp: result.timestamp,
        rateLimited: result.rateLimited,
      };

      // Audit log
      await ctx.db.insert("auditLogs", {
        userId,
        event: "offer_hunt_attempt",
        details: {
          huntId: args.huntId,
          ...lastResult,
        },
        createdAt: Date.now(),
      });

      if (result.success) {
        status = "success";
        completedAt = Date.now();
      }
    }

    if (status === "hunting") {
      status = bestDiscount >= 110 ? "fallback" : "failed";
      completedAt = Date.now();
    }

    // Audit log for completion
    await ctx.db.insert("auditLogs", {
      userId,
      event: "offer_hunt_completed",
      details: {
        huntId: args.huntId,
        status,
        bestDiscount,
        attempts,
        targetDiscount: hunt.targetDiscount,
        circuitBreakerFailures,
      },
      createdAt: Date.now(),
    });

    await ctx.db.patch(args.huntId, {
      attempts,
      bestDiscount,
      circuitBreakerFailures,
      status,
      cooldownUntil: status === "cooldown" ? Date.now() + COOLDOWN_MS : undefined,
      resultDetails: {
        lastAttempt: lastResult,
        bestAttempt: bestDiscount,
        attemptedDevices: attempts,
        rateLimited: lastResult?.rateLimited,
      },
      completedAt,
    });

    return {
      status,
      bestDiscount,
      attempts,
      targetDiscount: hunt.targetDiscount,
      cooldownUntil: status === "cooldown" ? Date.now() + COOLDOWN_MS : undefined,
    };
  },
});

export const checkCooldown = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;

    const lastHunt = await ctx.db
      .query("offerHunts")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .order("desc")
      .first();

    if (!lastHunt) return { inCooldown: false };

    if (lastHunt.status === "cooldown" && lastHunt.cooldownUntil) {
      const now = Date.now();
      if (now < lastHunt.cooldownUntil) {
        return {
          inCooldown: true,
          cooldownUntil: lastHunt.cooldownUntil,
          remainingMinutes: Math.ceil((lastHunt.cooldownUntil - now) / 60000),
        };
      }
    }

    return { inCooldown: false };
  },
});

export const list = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    return await ctx.db
      .query("offerHunts")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .order("desc")
      .take(20);
  },
});

export const get = query({
  args: { huntId: v.id("offerHunts") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.huntId);
  },
});

export const getAuditLogs = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    return await ctx.db
      .query("auditLogs")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .order("desc")
      .take(args.limit ?? 50);
  },
});
