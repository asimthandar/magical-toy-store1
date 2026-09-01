import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import { query, mutation } from "./_generated/server";

export const get = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;

    const wallet = await ctx.db
      .query("wallet")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();

    return wallet || { balance: 0, totalEarned: 0, totalSpent: 0 };
  },
});

export const transactions = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    const txns = await ctx.db
      .query("walletTransactions")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .order("desc")
      .take(args.limit ?? 50);

    return txns;
  },
});

export const ensure = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const existing = await ctx.db
      .query("wallet")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();

    if (existing) return existing;

    const walletId = await ctx.db.insert("wallet", {
      userId,
      balance: 0,
      totalEarned: 0,
      totalSpent: 0,
      updatedAt: Date.now(),
    });

    return await ctx.db.get(walletId);
  },
});

export const credit = mutation({
  args: {
    amount: v.number(),
    description: v.string(),
    referenceId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    let wallet = await ctx.db
      .query("wallet")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();

    if (!wallet) {
      const walletId = await ctx.db.insert("wallet", {
        userId,
        balance: args.amount,
        totalEarned: args.amount,
        totalSpent: 0,
        updatedAt: Date.now(),
      });
      wallet = await ctx.db.get(walletId);
    } else {
      await ctx.db.patch(wallet._id, {
        balance: wallet.balance + args.amount,
        totalEarned: wallet.totalEarned + args.amount,
        updatedAt: Date.now(),
      });
    }

    await ctx.db.insert("walletTransactions", {
      userId,
      type: "credit",
      amount: args.amount,
      description: args.description,
      referenceId: args.referenceId,
      createdAt: Date.now(),
    });

    return "credited";
  },
});

export const debit = mutation({
  args: {
    amount: v.number(),
    description: v.string(),
    referenceId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const wallet = await ctx.db
      .query("wallet")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();

    if (!wallet || wallet.balance < args.amount) {
      throw new Error("Insufficient balance");
    }

    await ctx.db.patch(wallet._id, {
      balance: wallet.balance - args.amount,
      totalSpent: wallet.totalSpent + args.amount,
      updatedAt: Date.now(),
    });

    await ctx.db.insert("walletTransactions", {
      userId,
      type: "debit",
      amount: args.amount,
      description: args.description,
      referenceId: args.referenceId,
      createdAt: Date.now(),
    });

    return "debited";
  },
});
