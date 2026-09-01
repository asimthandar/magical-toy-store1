import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import { query, mutation } from "./_generated/server";

export const list = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    return await ctx.db
      .query("linkedAccounts")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .order("desc")
      .collect();
  },
});

export const getActive = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;

    const accounts = await ctx.db
      .query("linkedAccounts")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();

    return accounts.find((a) => a.status === "verified") || null;
  },
});

export const initiateLink = mutation({
  args: {
    phone: v.string(),
    platform: v.string(),
    referralCode: v.optional(v.string()),
    welcomeBonus: v.number(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    // Validate phone (10 digits)
    if (!/^\d{10}$/.test(args.phone)) {
      throw new Error("Phone must be 10 digits");
    }

    // Check if already linked
    const existing = await ctx.db
      .query("linkedAccounts")
      .withIndex("by_phone", (q) => q.eq("phone", args.phone))
      .first();

    if (existing && existing.userId === userId && existing.status === "verified") {
      throw new Error("This account is already linked");
    }

    // In production: trigger OTP via SMS gateway
    // For v1: simulate OTP sent
    const otpCode = String(Math.floor(100000 + Math.random() * 900000));

    const accountId = await ctx.db.insert("linkedAccounts", {
      userId,
      phone: args.phone,
      platform: args.platform,
      status: "pending",
      sessionTokens: { otpCode, otpExpiresAt: Date.now() + 5 * 60 * 1000 },
      welcomeBonus: args.welcomeBonus,
      referredByCode: args.referralCode,
      createdAt: Date.now(),
    });

    // In production, send OTP via SMS API
    console.log(`[OTP] Code for ${args.phone}: ${otpCode}`);

    return {
      accountId,
      message: `OTP sent to ${args.phone}`,
      // In dev mode, include the OTP for testing
      ...(process.env.NODE_ENV === "development" && { devOtp: otpCode }),
    };
  },
});

export const verifyOtp = mutation({
  args: {
    accountId: v.id("linkedAccounts"),
    otp: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const account = await ctx.db.get(args.accountId);
    if (!account || account.userId !== userId) throw new Error("Account not found");
    if (account.status !== "pending") throw new Error("Account not in pending state");

    const tokens = account.sessionTokens as any;
    if (!tokens?.otpCode || !tokens?.otpExpiresAt) {
      throw new Error("No OTP pending for this account");
    }

    if (Date.now() > tokens.otpExpiresAt) {
      await ctx.db.patch(args.accountId, { status: "expired" });
      throw new Error("OTP expired. Please try again.");
    }

    if (tokens.otpCode !== args.otp) {
      throw new Error("Invalid OTP code");
    }

    // Generate mock session tokens (in production, these come from the platform API)
    const mockSessionTokens = {
      accessToken: `acc_${Date.now()}_${Math.random().toString(36).slice(2)}`,
      refreshToken: `ref_${Date.now()}_${Math.random().toString(36).slice(2)}`,
      userId: `platform_${account.phone}`,
      expiresAt: Date.now() + 24 * 60 * 60 * 1000,
      issuedAt: Date.now(),
    };

    await ctx.db.patch(args.accountId, {
      status: "verified",
      sessionTokens: mockSessionTokens,
    });

    // Credit welcome bonus to wallet
    if (account.welcomeBonus && account.welcomeBonus > 0) {
      const wallet = await ctx.db
        .query("wallet")
        .withIndex("by_user", (q) => q.eq("userId", userId))
        .first();

      if (wallet) {
        await ctx.db.patch(wallet._id, {
          balance: wallet.balance + account.welcomeBonus,
          totalEarned: wallet.totalEarned + account.welcomeBonus,
          updatedAt: Date.now(),
        });
      } else {
        await ctx.db.insert("wallet", {
          userId,
          balance: account.welcomeBonus,
          totalEarned: account.welcomeBonus,
          totalSpent: 0,
          updatedAt: Date.now(),
        });
      }

      await ctx.db.insert("walletTransactions", {
        userId,
        type: "credit",
        amount: account.welcomeBonus,
        description: `Welcome bonus (${account.platform})`,
        referenceId: args.accountId,
        createdAt: Date.now(),
      });
    }

    return "verified";
  },
});

export const injectSession = mutation({
  args: {
    accountId: v.id("linkedAccounts"),
    tokens: v.any(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const account = await ctx.db.get(args.accountId);
    if (!account || account.userId !== userId) throw new Error("Account not found");

    await ctx.db.patch(args.accountId, {
      sessionTokens: args.tokens,
      status: "verified",
    });

    return "injected";
  },
});

export const unlink = mutation({
  args: {
    accountId: v.id("linkedAccounts"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const account = await ctx.db.get(args.accountId);
    if (!account || account.userId !== userId) throw new Error("Account not found");

    await ctx.db.patch(args.accountId, { status: "expired" });
    return "unlinked";
  },
});

export const exportSession = query({
  args: {
    accountId: v.id("linkedAccounts"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const account = await ctx.db.get(args.accountId);
    if (!account || account.userId !== userId) throw new Error("Account not found");

    return {
      platform: account.platform,
      phone: account.phone,
      status: account.status,
      tokens: account.sessionTokens,
      exportedAt: Date.now(),
    };
  },
});
