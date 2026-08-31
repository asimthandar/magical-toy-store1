import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import { query, mutation } from "./_generated/server";

export const list = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    return await ctx.db
      .query("orders")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .order("desc")
      .collect();
  },
});

export const get = query({
  args: { orderId: v.id("orders") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;

    const order = await ctx.db.get(args.orderId);
    if (!order || order.userId !== userId) return null;

    return order;
  },
});

export const place = mutation({
  args: {
    addressId: v.id("addresses"),
    paymentMethod: v.union(v.literal("cash"), v.literal("online")),
    paymentStatus: v.union(
      v.literal("pending"),
      v.literal("paid"),
      v.literal("failed"),
    ),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const address = await ctx.db.get(args.addressId);
    if (!address || address.userId !== userId) throw new Error("Not authorized");

    const cartItems = await ctx.db
      .query("cartItems")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();

    if (cartItems.length === 0) throw new Error("Cart is empty");

    const orderItems = await Promise.all(
      cartItems.map(async (item) => {
        const product = await ctx.db.get(item.productId);
        if (!product) throw new Error("Product not found");
        return {
          productId: item.productId,
          name: product.name,
          image: product.image,
          price: product.price,
          size: item.size,
          quantity: item.quantity,
        };
      }),
    );

    const totalAmount = orderItems.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0,
    );

    const firstOrder = await ctx.db
      .query("orders")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();

    const discountApplied = !firstOrder ? 120 : undefined;
    const finalTotal = totalAmount - (discountApplied || 0);

    const orderId = await ctx.db.insert("orders", {
      userId,
      items: orderItems,
      addressId: args.addressId,
      addressSnapshot: {
        fullName: address.fullName,
        phone: address.phone,
        pinCode: address.pinCode,
        city: address.city,
        state: address.state,
        houseNumber: address.houseNumber,
        area: address.area,
        landmark: address.landmark,
        label: address.label,
      },
      paymentMethod: args.paymentMethod,
      paymentStatus: args.paymentStatus,
      totalAmount: finalTotal,
      discountApplied,
      status: "placed",
      createdAt: Date.now(),
    });

    for (const item of cartItems) {
      await ctx.db.delete(item._id);
    }

    return orderId;
  },
});

export const verifyPayment = mutation({
  args: {
    orderId: v.id("orders"),
    success: v.boolean(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const order = await ctx.db.get(args.orderId);
    if (!order || order.userId !== userId) throw new Error("Not authorized");

    await ctx.db.patch(args.orderId, {
      paymentStatus: args.success ? "paid" : "failed",
      status: args.success ? "processing" : "placed",
    });

    return args.success ? "verified" : "failed";
  },
});
