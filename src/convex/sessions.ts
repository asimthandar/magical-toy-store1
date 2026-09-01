import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import { query, mutation } from "./_generated/server";

const TWO_DAYS_MS = 2 * 24 * 60 * 60 * 1000;

export const current = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;

    const session = await ctx.db
      .query("sessions")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .order("desc")
      .first();

    return session;
  },
});

export const create = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const now = Date.now();
    const sessionId = await ctx.db.insert("sessions", {
      userId,
      createdAt: now,
      expiresAt: now + TWO_DAYS_MS,
      lastRefreshedAt: now,
    });

    return sessionId;
  },
});

export const refresh = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const session = await ctx.db
      .query("sessions")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .order("desc")
      .first();

    if (!session) throw new Error("No active session");

    const now = Date.now();
    await ctx.db.patch(session._id, {
      expiresAt: now + TWO_DAYS_MS,
      lastRefreshedAt: now,
    });

    return "refreshed";
  },
});

export const ensure = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const existing = await ctx.db
      .query("sessions")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .order("desc")
      .first();

    if (existing && existing.expiresAt > Date.now()) {
      return existing;
    }

    const now = Date.now();
    const sessionId = await ctx.db.insert("sessions", {
      userId,
      createdAt: now,
      expiresAt: now + TWO_DAYS_MS,
      lastRefreshedAt: now,
    });

    return await ctx.db.get(sessionId);
  },
});

/**
 * Check if user can export (rate limiting: 1 export per 24 hours)
 */
export const canExport = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return { canExport: false, reason: "Not authenticated" };

    const lastExport = await ctx.db
      .query("auditLogs")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .order("desc")
      .first();

    if (lastExport && lastExport.event === "session_export") {
      const hoursSinceLastExport = (Date.now() - lastExport.createdAt) / (1000 * 60 * 60);
      if (hoursSinceLastExport < 24) {
        return {
          canExport: false,
          reason: `Export limit reached. Try again in ${Math.ceil(24 - hoursSinceLastExport)} hours.`,
          nextExportAt: lastExport.createdAt + 24 * 60 * 60 * 1000,
        };
      }
    }

    return { canExport: true };
  },
});

/**
 * Get data for session export
 */
export const getExportData = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    // Get session data
    const session = await ctx.db
      .query("sessions")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .order("desc")
      .first();

    // Get wallet data
    const wallet = await ctx.db
      .query("wallet")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();

    // Get linked accounts
    const linkedAccounts = await ctx.db
      .query("linkedAccounts")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();

    // Get user data
    const user = await ctx.db.get(userId);

    return {
      userId,
      name: user?.name,
      email: user?.email,
      session: session ? {
        id: session._id,
        createdAt: session.createdAt,
        expiresAt: session.expiresAt,
      } : null,
      wallet: wallet ? {
        balance: wallet.balance,
        totalEarned: wallet.totalEarned,
        totalSpent: wallet.totalSpent,
      } : null,
      linkedAccounts: linkedAccounts.map(a => ({
        platform: a.platform,
        phone: a.phone,
        status: a.status,
        welcomeBonus: a.welcomeBonus,
      })),
      exportedAt: Date.now(),
      warning: "This file contains sensitive auth tokens. Never share it publicly.",
    };
  },
});

/**
 * Log session export (called after successful download)
 */
export const logExport = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    await ctx.db.insert("auditLogs", {
      userId,
      event: "session_export",
      details: {
        exportedAt: Date.now(),
      },
      createdAt: Date.now(),
    });

    return "logged";
  },
});
