import { v } from "convex/values";
import { query, mutation } from "./_generated/server";

export const list = query({
  args: {
    category: v.optional(v.string()),
    search: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    let results;

    if (args.category) {
      results = await ctx.db
        .query("products")
        .withIndex("by_category", (q) => q.eq("category", args.category!))
        .collect();
    } else {
      results = await ctx.db.query("products").collect();
    }

    let filtered = results;

    if (args.search) {
      const searchLower = args.search.toLowerCase();
      filtered = results.filter(
        (p) =>
          p.name.toLowerCase().includes(searchLower) ||
          p.description.toLowerCase().includes(searchLower) ||
          p.category.toLowerCase().includes(searchLower),
      );
    }

    if (args.limit) {
      filtered = filtered.slice(0, args.limit);
    }

    return filtered;
  },
});

export const get = query({
  args: { productId: v.id("products") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.productId);
  },
});

export const getByUrl = query({
  args: { url: v.string() },
  handler: async (ctx, args) => {
    const products = await ctx.db.query("products").collect();
    return products.find(
      (p) =>
        p.image === args.url ||
        p.images?.some((img) => img === args.url),
    );
  },
});

export const seed = mutation({
  args: {},
  handler: async (ctx) => {
    const existing = await ctx.db.query("products").first();
    if (existing) return "already_seeded";

    const products = [
      {
        name: "Minimal Cotton Tee",
        description: "Premium organic cotton t-shirt with a clean, relaxed fit. Perfect for everyday wear.",
        price: 899,
        originalPrice: 1299,
        category: "clothing",
        image: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400&h=500&fit=crop",
        sizes: ["XS", "S", "M", "L", "XL"],
        inStock: true,
        rating: 4.5,
        reviewCount: 128,
      },
      {
        name: "Classic Denim Jacket",
        description: "Timeless denim jacket with a modern silhouette. Layer it up.",
        price: 2499,
        originalPrice: 3499,
        category: "clothing",
        image: "https://images.unsplash.com/photo-1551028719-00167b16eac5?w=400&h=500&fit=crop",
        sizes: ["S", "M", "L", "XL"],
        inStock: true,
        rating: 4.7,
        reviewCount: 89,
      },
      {
        name: "Running Sneakers",
        description: "Lightweight performance sneakers with responsive cushioning.",
        price: 3999,
        originalPrice: 5499,
        category: "shoes",
        image: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400&h=500&fit=crop",
        sizes: ["6", "7", "8", "9", "10", "11"],
        inStock: true,
        rating: 4.3,
        reviewCount: 256,
      },
      {
        name: "Canvas Backpack",
        description: "Durable canvas backpack with padded laptop compartment. Clean lines, maximum utility.",
        price: 1799,
        originalPrice: 2499,
        category: "accessories",
        image: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=400&h=500&fit=crop",
        inStock: true,
        rating: 4.6,
        reviewCount: 178,
      },
      {
        name: "Linen Summer Dress",
        description: "Breathable linen dress with a minimalist cut. Ideal for warm days.",
        price: 1999,
        originalPrice: 2999,
        category: "clothing",
        image: "https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=400&h=500&fit=crop",
        sizes: ["XS", "S", "M", "L"],
        inStock: true,
        rating: 4.4,
        reviewCount: 67,
      },
      {
        name: "Leather Chelsea Boots",
        description: "Handcrafted leather boots with elastic side panels. Sophisticated yet comfortable.",
        price: 4999,
        originalPrice: 6999,
        category: "shoes",
        image: "https://images.unsplash.com/photo-1638247025967-b4e38f787b76?w=400&h=500&fit=crop",
        sizes: ["7", "8", "9", "10", "11"],
        inStock: true,
        rating: 4.8,
        reviewCount: 45,
      },
      {
        name: "Oversized Hoodie",
        description: "Heavyweight cotton hoodie with a relaxed oversized fit. Cozy meets style.",
        price: 1499,
        originalPrice: 1999,
        category: "clothing",
        image: "https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=400&h=500&fit=crop",
        sizes: ["S", "M", "L", "XL", "XXL"],
        inStock: true,
        rating: 4.6,
        reviewCount: 203,
      },
      {
        name: "Minimal Watch",
        description: "Swiss-movement analog watch with a clean dial and leather strap.",
        price: 5999,
        originalPrice: 7999,
        category: "accessories",
        image: "https://images.unsplash.com/photo-1524592094714-0f0654e20314?w=400&h=500&fit=crop",
        inStock: true,
        rating: 4.9,
        reviewCount: 112,
      },
      {
        name: "Slim Chinos",
        description: "Tailored slim-fit chinos with stretch fabric for all-day comfort.",
        price: 1299,
        originalPrice: 1799,
        category: "clothing",
        image: "https://images.unsplash.com/photo-1473966968600-fa801b869a1a?w=400&h=500&fit=crop",
        sizes: ["28", "30", "32", "34", "36"],
        inStock: true,
        rating: 4.3,
        reviewCount: 156,
      },
      {
        name: "Crossbody Bag",
        description: "Compact crossbody bag in sustainable nylon. Water-resistant and lightweight.",
        price: 2199,
        originalPrice: 2999,
        category: "accessories",
        image: "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=400&h=500&fit=crop",
        inStock: true,
        rating: 4.5,
        reviewCount: 94,
      },
      {
        name: "Striped Long Sleeve",
        description: "Classic Breton stripe long-sleeve tee. A wardrobe essential.",
        price: 1099,
        originalPrice: 1499,
        category: "clothing",
        image: "https://images.unsplash.com/photo-1618354691373-d851c5c3a990?w=400&h=500&fit=crop",
        sizes: ["S", "M", "L", "XL"],
        inStock: true,
        rating: 4.2,
        reviewCount: 88,
      },
      {
        name: "Suede Loafers",
        description: "Premium suede loafers with a cushioned insole. Effortless elegance.",
        price: 3499,
        originalPrice: 4999,
        category: "shoes",
        image: "https://images.unsplash.com/photo-1614252369475-531eba835eb1?w=400&h=500&fit=crop",
        sizes: ["7", "8", "9", "10"],
        inStock: true,
        rating: 4.4,
        reviewCount: 67,
      },
    ];

    for (const product of products) {
      await ctx.db.insert("products", product);
    }

    return "seeded";
  },
});
