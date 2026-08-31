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
