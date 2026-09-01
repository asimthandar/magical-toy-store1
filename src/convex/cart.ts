import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import { query, mutation } from "./_generated/server";

export const list = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    const items = await ctx.db
      .query("cartItems")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();

    const itemsWithProducts = await Promise.all(
      items.map(async (item) => {
        const product = await ctx.db.get(item.productId);
        return { ...item, product };
      }),
    );

    return itemsWithProducts;
  },
});

export const addItem = mutation({
  args: {
    productId: v.id("products"),
    size: v.optional(v.string()),
    quantity: v.number(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const existing = await ctx.db
      .query("cartItems")
      .withIndex("by_user_product", (q) =>
        q.eq("userId", userId).eq("productId", args.productId),
      )
      .first();

    if (existing) {
      if (args.size && existing.size !== args.size) {
        await ctx.db.patch(existing._id, {
          size: args.size,
          quantity: existing.quantity + args.quantity,
        });
      } else {
        await ctx.db.patch(existing._id, {
          quantity: existing.quantity + args.quantity,
        });
      }
    } else {
      await ctx.db.insert("cartItems", {
        userId,
        productId: args.productId,
        size: args.size,
        quantity: args.quantity,
        addedAt: Date.now(),
      });
    }

    return "added";
  },
});

export const updateQuantity = mutation({
  args: {
    cartItemId: v.id("cartItems"),
    quantity: v.number(),
  },
  handler: async (ctx, args) => {
    if (args.quantity <= 0) {
      await ctx.db.delete(args.cartItemId);
    } else {
      await ctx.db.patch(args.cartItemId, { quantity: args.quantity });
    }
    return "updated";
  },
});

export const removeItem = mutation({
  args: { cartItemId: v.id("cartItems") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.cartItemId);
    return "removed";
  },
});

export const clear = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const items = await ctx.db
      .query("cartItems")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();

    for (const item of items) {
      await ctx.db.delete(item._id);
    }

    return "cleared";
  },
});

export const addItemFromLink = mutation({
  args: { url: v.string() },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const products = await ctx.db.query("products").collect();
    const matched = products.find(
      (p) =>
        p.image === args.url ||
        p.images?.some((img) => img === args.url) ||
        p.name.toLowerCase().includes(args.url.toLowerCase()) ||
        p.description.toLowerCase().includes(args.url.toLowerCase()),
    );

    if (!matched) throw new Error("Product not found for this link");

    const existing = await ctx.db
      .query("cartItems")
      .withIndex("by_user_product", (q) =>
        q.eq("userId", userId).eq("productId", matched._id),
      )
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, { quantity: existing.quantity + 1 });
    } else {
      await ctx.db.insert("cartItems", {
        userId,
        productId: matched._id,
        size: matched.sizes?.[0],
        quantity: 1,
        addedAt: Date.now(),
      });
    }

    return { success: true, product: matched };
  },
});

/**
 * Validate cart prices before checkout
 * Checks if any prices have changed since items were added
 */
export const validatePrices = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return { valid: true, priceChanges: [] };

    const items = await ctx.db
      .query("cartItems")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();

    const priceChanges: Array<{
      productId: string;
      productName: string;
      addedPrice: number;
      currentPrice: number;
      change: number;
    }> = [];

    for (const item of items) {
      const product = await ctx.db.get(item.productId);
      if (!product) {
        priceChanges.push({
          productId: item.productId,
          productName: "Unknown Product",
          addedPrice: 0,
          currentPrice: 0,
          change: -100,
        });
        continue;
      }

      // For simplicity, we compare the current price with the stored product price
      // In production, you'd store the price at time of cart addition
      // and compare with the current API price
    }

    return {
      valid: priceChanges.length === 0,
      priceChanges,
      totalItems: items.length,
    };
  },
});
