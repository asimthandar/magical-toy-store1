import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import { query, mutation } from "./_generated/server";

export const list = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    return await ctx.db
      .query("addresses")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .order("desc")
      .collect();
  },
});

export const add = mutation({
  args: {
    fullName: v.string(),
    phone: v.string(),
    pinCode: v.string(),
    city: v.string(),
    state: v.string(),
    houseNumber: v.string(),
    area: v.string(),
    landmark: v.optional(v.string()),
    label: v.union(v.literal("home"), v.literal("work"), v.literal("other")),
    isDefault: v.boolean(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    if (args.isDefault) {
      const existing = await ctx.db
        .query("addresses")
        .withIndex("by_user", (q) => q.eq("userId", userId))
        .collect();

      for (const addr of existing) {
        if (addr.isDefault) {
          await ctx.db.patch(addr._id, { isDefault: false });
        }
      }
    }

    return await ctx.db.insert("addresses", {
      userId,
      ...args,
      createdAt: Date.now(),
    });
  },
});

export const update = mutation({
  args: {
    addressId: v.id("addresses"),
    fullName: v.string(),
    phone: v.string(),
    pinCode: v.string(),
    city: v.string(),
    state: v.string(),
    houseNumber: v.string(),
    area: v.string(),
    landmark: v.optional(v.string()),
    label: v.union(v.literal("home"), v.literal("work"), v.literal("other")),
    isDefault: v.boolean(),
  },
  handler: async (ctx, args) => {
    const { addressId, ...data } = args;
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const address = await ctx.db.get(addressId);
    if (!address || address.userId !== userId) throw new Error("Not authorized");

    if (data.isDefault) {
      const existing = await ctx.db
        .query("addresses")
        .withIndex("by_user", (q) => q.eq("userId", userId))
        .collect();

      for (const addr of existing) {
        if (addr.isDefault && addr._id !== addressId) {
          await ctx.db.patch(addr._id, { isDefault: false });
        }
      }
    }

    await ctx.db.patch(addressId, data);
    return "updated";
  },
});

export const remove = mutation({
  args: { addressId: v.id("addresses") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const address = await ctx.db.get(args.addressId);
    if (!address || address.userId !== userId) throw new Error("Not authorized");

    await ctx.db.delete(args.addressId);
    return "removed";
  },
});

export const getDefault = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;

    const addresses = await ctx.db
      .query("addresses")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();

    return addresses.find((a) => a.isDefault) || addresses[0] || null;
  },
});
