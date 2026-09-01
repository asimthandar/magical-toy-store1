import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import { query, mutation } from "./_generated/server";

function generateCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "REF-";
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

export const getOrCreate = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const existing = await ctx.db
      .query("referrals")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();

    if (existing) return existing;

    const code = generateCode();
    const referralId = await ctx.db.insert("referrals", {
      userId,
      code,
      rewardClaimed: false,
      rewardAmount: 120,
      createdAt: Date.now(),
    });

    return await ctx.db.get(referralId);
  },
});

export const getByCode = query({
  args: { code: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("referrals")
      .withIndex("by_code", (q) => q.eq("code", args.code))
      .first();
  },
});

export const claimReward = mutation({
  args: { referralId: v.id("referrals") },
  handler: async (ctx, args) => {
    const referral = await ctx.db.get(args.referralId);
    if (!referral) throw new Error("Referral not found");
    if (referral.rewardClaimed) throw new Error("Reward already claimed");

    await ctx.db.patch(args.referralId, { rewardClaimed: true });
    return "claimed";
  },
});

// List all referrals for the current user
export const list = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    return await ctx.db
      .query("referrals")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .order("desc")
      .collect();
  },
});
