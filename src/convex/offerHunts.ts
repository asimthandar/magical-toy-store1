import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import { query, mutation, action } from "./_generated/server";

// Discount buckets available for hunting
const DISCOUNT_BUCKETS = [110, 120, 135, 150, 180];

// Simulated device fingerprints for attempting new sessions
const DEVICE_FINGERPRINTS = [
  { os: "Android", browser: "Chrome/120.0", screen: "1080x2400" },
  { os: "Android", browser: "Chrome/119.0", screen: "1080x2340" },
  { os: "iOS", browser: "Safari/17.2", screen: "1170x2532" },
  { os: "Android", browser: "Firefox/121.0", screen: "1080x2400" },
  { os: "Android", browser: "Chrome/118.0", screen: "1080x2280" },
  { os: "iOS", browser: "Safari/17.1", screen: "1179x2556" },
  { os: "Android", browser: "Samsung/23.0", screen: "1080x2340" },
  { os: "Android", browser: "Chrome/120.0", screen: "1440x3200" },
  { os: "iOS", browser: "Safari/16.6", screen: "1284x2778" },
  { os: "Android", browser: "Chrome/117.0", screen: "1080x2400" },
  { os: "Android", browser: "Edge/120.0", screen: "1080x2340" },
  { os: "iOS", browser: "Safari/17.0", screen: "1170x2532" },
  { os: "Android", browser: "Chrome/119.0", screen: "1080x2160" },
  { os: "Android", browser: "Opera/76.0", screen: "1080x2400" },
  { os: "Android", browser: "Chrome/120.0", screen: "720x1600" },
];

/**
 * Simulate a single attempt to fetch a discount from the e-commerce platform.
 * In production, this would be an actual API call with proxy rotation and UA spoofing.
 * For v1, we simulate the outcome based on probability.
 */
function simulateAttempt(
  targetDiscount: number,
  attemptNumber: number,
  device: (typeof DEVICE_FINGERPRINTS)[number],
): {
  discount: number;
  success: boolean;
  deviceUsed: typeof device;
  timestamp: number;
} {
  // Simulate: higher chance of getting lower discounts, lower chance of target
  const rand = Math.random();
  let discount: number;

  if (targetDiscount >= 180) {
    // ₹180 is hardest — 8% chance per attempt
    if (rand < 0.08) discount = 180;
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
    timestamp: Date.now(),
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

    const huntId = await ctx.db.insert("offerHunts", {
      userId,
      targetDiscount: args.targetDiscount,
      status: "hunting",
      bestDiscount: 0,
      attempts: 0,
      maxAttempts: 15,
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

    const result = simulateAttempt(
      hunt.targetDiscount,
      attemptNum,
      device,
    );

    const newBest = Math.max(hunt.bestDiscount, result.discount);
    const isComplete =
      result.success || attemptNum >= hunt.maxAttempts;

    await ctx.db.patch(args.huntId, {
      attempts: attemptNum,
      bestDiscount: newBest,
      status: isComplete
        ? result.success
          ? "success"
          : "fallback"
        : "hunting",
      resultDetails: {
        lastAttempt: result,
        bestAttempt: newBest,
        attemptedDevices: attemptNum,
      },
      completedAt: isComplete ? Date.now() : undefined,
    });

    return {
      attempt: attemptNum,
      discount: result.discount,
      success: result.success,
      bestDiscount: newBest,
      device: result.deviceUsed,
      isComplete,
      remainingAttempts: hunt.maxAttempts - attemptNum,
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
    let status: "hunting" | "success" | "fallback" | "failed" = "hunting";
    let lastResult;
    let completedAt: number | undefined;

    while (attempts < hunt.maxAttempts && status === "hunting") {
      attempts++;
      const device =
        DEVICE_FINGERPRINTS[attempts % DEVICE_FINGERPRINTS.length];
      const result = simulateAttempt(hunt.targetDiscount, attempts, device);
      bestDiscount = Math.max(bestDiscount, result.discount);

      lastResult = {
        attempt: attempts,
        discount: result.discount,
        success: result.success,
        device: result.deviceUsed,
        timestamp: result.timestamp,
      };

      if (result.success) {
        status = "success";
        completedAt = Date.now();
      }
    }

    if (status === "hunting") {
      status = bestDiscount >= 110 ? "fallback" : "failed";
      completedAt = Date.now();
    }

    await ctx.db.patch(args.huntId, {
      attempts,
      bestDiscount,
      status,
      resultDetails: {
        lastAttempt: lastResult,
        bestAttempt: bestDiscount,
        attemptedDevices: attempts,
      },
      completedAt,
    });

    return {
      status,
      bestDiscount,
      attempts,
      targetDiscount: hunt.targetDiscount,
    };
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
