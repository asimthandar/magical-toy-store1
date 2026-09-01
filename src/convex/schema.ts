import { authTables } from "@convex-dev/auth/server";
import { defineSchema, defineTable } from "convex/server";
import { Infer, v } from "convex/values";

export const ROLES = {
  ADMIN: "admin",
  USER: "user",
  MEMBER: "member",
} as const;

export const roleValidator = v.union(
  v.literal(ROLES.ADMIN),
  v.literal(ROLES.USER),
  v.literal(ROLES.MEMBER),
);
export type Role = Infer<typeof roleValidator>;

const schema = defineSchema(
  {
    ...authTables,

    users: defineTable({
      name: v.optional(v.string()),
      image: v.optional(v.string()),
      email: v.optional(v.string()),
      emailVerificationTime: v.optional(v.number()),
      isAnonymous: v.optional(v.boolean()),
      role: v.optional(roleValidator),
      referralCode: v.optional(v.string()),
      referredBy: v.optional(v.string()),
    }).index("email", ["email"]),

    sessions: defineTable({
      userId: v.id("users"),
      createdAt: v.number(),
      expiresAt: v.number(),
      lastRefreshedAt: v.number(),
    }).index("by_user", ["userId"]),

    products: defineTable({
      name: v.string(),
      description: v.string(),
      price: v.number(),
      originalPrice: v.optional(v.number()),
      category: v.string(),
      image: v.string(),
      images: v.optional(v.array(v.string())),
      sizes: v.optional(v.array(v.string())),
      inStock: v.boolean(),
      rating: v.optional(v.number()),
      reviewCount: v.optional(v.number()),
    }).index("by_category", ["category"])
      .index("by_name", ["name"]),

    cartItems: defineTable({
      userId: v.id("users"),
      productId: v.id("products"),
      size: v.optional(v.string()),
      quantity: v.number(),
      addedAt: v.number(),
    }).index("by_user", ["userId"])
      .index("by_user_product", ["userId", "productId"]),

    addresses: defineTable({
      userId: v.id("users"),
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
      createdAt: v.number(),
    }).index("by_user", ["userId"]),

    orders: defineTable({
      userId: v.id("users"),
      items: v.array(v.object({
        productId: v.id("products"),
        name: v.string(),
        image: v.string(),
        price: v.number(),
        size: v.optional(v.string()),
        quantity: v.number(),
      })),
      addressId: v.id("addresses"),
      addressSnapshot: v.object({
        fullName: v.string(),
        phone: v.string(),
        pinCode: v.string(),
        city: v.string(),
        state: v.string(),
        houseNumber: v.string(),
        area: v.string(),
        landmark: v.optional(v.string()),
        label: v.union(v.literal("home"), v.literal("work"), v.literal("other")),
      }),
      paymentMethod: v.union(v.literal("cash"), v.literal("online")),
      paymentStatus: v.union(
        v.literal("pending"),
        v.literal("paid"),
        v.literal("failed"),
      ),
      totalAmount: v.number(),
      discountApplied: v.optional(v.number()),
      status: v.union(
        v.literal("placed"),
        v.literal("processing"),
        v.literal("shipped"),
        v.literal("delivered"),
        v.literal("cancelled"),
      ),
      createdAt: v.number(),
    }).index("by_user", ["userId"]),

    referrals: defineTable({
      userId: v.id("users"),
      code: v.string(),
      referredUserId: v.optional(v.id("users")),
      rewardClaimed: v.boolean(),
      rewardAmount: v.number(),
      createdAt: v.number(),
    }).index("by_code", ["code"])
      .index("by_user", ["userId"]),

    wallet: defineTable({
      userId: v.id("users"),
      balance: v.number(),
      totalEarned: v.number(),
      totalSpent: v.number(),
      updatedAt: v.number(),
    }).index("by_user", ["userId"]),

    walletTransactions: defineTable({
      userId: v.id("users"),
      type: v.union(
        v.literal("credit"),
        v.literal("debit"),
        v.literal("hold"),
        v.literal("refund"),
      ),
      amount: v.number(),
      description: v.string(),
      referenceId: v.optional(v.string()),
      createdAt: v.number(),
    }).index("by_user", ["userId"]),

    linkedAccounts: defineTable({
      userId: v.id("users"),
      phone: v.string(),
      platform: v.string(),
      status: v.union(
        v.literal("pending"),
        v.literal("verified"),
        v.literal("expired"),
        v.literal("banned"),
      ),
      sessionTokens: v.optional(v.any()),
      welcomeBonus: v.optional(v.number()),
      referredByCode: v.optional(v.string()),
      createdAt: v.number(),
    }).index("by_user", ["userId"])
      .index("by_phone", ["phone"]),

    offerHunts: defineTable({
      userId: v.id("users"),
      targetDiscount: v.number(),
      status: v.union(
        v.literal("hunting"),
        v.literal("success"),
        v.literal("fallback"),
        v.literal("failed"),
      ),
      bestDiscount: v.number(),
      attempts: v.number(),
      maxAttempts: v.number(),
      resultDetails: v.optional(v.any()),
      createdAt: v.number(),
      completedAt: v.optional(v.number()),
    }).index("by_user", ["userId"]),

    serviceFees: defineTable({
      userId: v.id("users"),
      type: v.union(
        v.literal("order_processing"),
        v.literal("offer_hunt"),
        v.literal("subscription"),
      ),
      amount: v.number(),
      deducted: v.boolean(),
      createdAt: v.number(),
    }).index("by_user", ["userId"]),
  },
  {
    schemaValidation: false,
  },
);

export default schema;
