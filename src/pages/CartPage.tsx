import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router";
import { Button } from "@/components/ui/button";
import {
  ShoppingCart,
  Plus,
  Minus,
  Trash2,
  MapPin,
  Tag,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { cartApi, addressesApi } from "@/lib/api";
import { getIdentifier, getUserId, getCartSession } from "@/lib/auth";
import type { CartItem, Address } from "@/lib/apiConfig";

export default function CartPage() {
  const navigate = useNavigate();
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [defaultAddress, setDefaultAddress] = useState<Address | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);

  const fetchCart = useCallback(async () => {
    try {
      const identifier = getIdentifier();
      const userId = getUserId();
      const cartSession = getCartSession();
      if (!identifier) return;

      const res = await cartApi.getState({
        context: "cart",
        identifier,
        cart_session: cartSession,
        user_id: userId,
      }) as any;
      setCartItems(res?.items || []);
    } catch (err) {
      console.error("Failed to load cart:", err);
    }
  }, []);

  const fetchAddress = useCallback(async () => {
    try {
      const res = await addressesApi.list() as any;
      const addresses = Array.isArray(res) ? res : [];
      setDefaultAddress(addresses.find((a) => a.is_default) || addresses[0] || null);
    } catch (err) {
      console.error("Failed to load addresses:", err);
    }
  }, []);

  useEffect(() => {
    Promise.all([fetchCart(), fetchAddress()]).finally(() => setLoading(false));
  }, [fetchCart, fetchAddress]);

  const handleUpdateQuantity = async (itemId: string, newQty: number) => {
    if (newQty < 1) return;
    setUpdating(itemId);
    try {
      // TODO: implement updateQuantity via API
      setCartItems((prev) =>
        prev.map((item) =>
          item.product_id === itemId ? { ...item, quantity: newQty } : item,
        ),
      );
    } catch {
      toast.error("Failed to update quantity");
    } finally {
      setUpdating(null);
    }
  };

  const handleRemoveItem = async (itemId: string) => {
    setUpdating(itemId);
    try {
      // TODO: implement removeItem via API
      setCartItems((prev) => prev.filter((item) => item.product_id !== itemId));
    } catch {
      toast.error("Failed to remove item");
    } finally {
      setUpdating(null);
    }
  };

  const subtotal = cartItems.reduce(
    (sum, item) => sum + (item.price || 0) * item.quantity,
    0,
  );

  const originalSubtotal = cartItems.reduce(
    (sum, item) => sum + (item.price || 0) * item.quantity,
    0,
  );

  const productDiscount = originalSubtotal - subtotal;
  const firstOrderDiscount = subtotal > 0 ? 120 : 0;
  const totalDiscount = productDiscount + firstOrderDiscount;
  const total = subtotal - firstOrderDiscount;

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-6 w-6 text-blue-500 animate-spin" />
      </div>
    );
  }

  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen bg-background">
        <div className="sticky top-0 z-10 bg-background border-b border-border">
          <div className="px-4 py-3">
            <h1 className="text-lg font-bold">My Cart</h1>
          </div>
        </div>
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <ShoppingCart className="h-16 w-16 text-muted-foreground/50 mb-4" />
          <h2 className="text-lg font-semibold">Cart is empty</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Start shopping to add items
          </p>
          <Button
            onClick={() => navigate("/dashboard/search")}
            className="mt-6 bg-foreground text-background"
          >
            Start Shopping
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background border-b border-border">
        <div className="px-4 py-3">
          <h1 className="text-lg font-bold">My Cart</h1>
        </div>
      </div>

      <div className="px-4 pt-4 space-y-4">
        {/* Address Selection */}
        <div className="rounded-xl p-4 border border-border bg-card">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <div className="w-8 h-8 rounded-full bg-red-500/10 flex items-center justify-center shrink-0">
                <MapPin className="h-4 w-4 text-red-400" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium">
                  {defaultAddress?.name || "No address"}
                </p>
                <p className="text-xs text-muted-foreground line-clamp-1">
                  {defaultAddress
                    ? `${defaultAddress.address_line_1}, ${defaultAddress.city}`
                    : "Add a delivery address"}
                </p>
              </div>
            </div>
            <Button
              onClick={() => navigate("/dashboard/addresses")}
              variant="outline"
              size="sm"
              className="border-border text-foreground shrink-0 ml-2"
            >
              {defaultAddress ? "Change" : "Add"}
            </Button>
          </div>
        </div>

        {/* Cart Items */}
        <div className="space-y-3">
          {cartItems.map((item) => (
            <div
              key={item.product_id}
              className="rounded-xl p-4 border border-border bg-card"
            >
              <div className="flex gap-3">
                {/* Product Image */}
                <div className="w-20 h-20 rounded-lg bg-muted overflow-hidden shrink-0">
                  <img
                    src={item.image || ""}
                    alt={item.name || ""}
                    className="w-full h-full object-cover"
                  />
                </div>

                {/* Product Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium line-clamp-2">
                    {item.name || `Product #${item.product_id}`}
                  </p>
                  {item.variation && (
                    <span className="inline-block text-[10px] font-medium bg-muted px-1.5 py-0.5 rounded mt-1 text-muted-foreground">
                      Size: {item.variation}
                    </span>
                  )}

                  {/* Price */}
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-sm font-bold bg-foreground text-background px-2 py-0.5 rounded">
                      ₹{item.price}
                    </span>
                  </div>

                  <p className="text-xs text-green-500 mt-1">
                    Free Delivery
                  </p>
                </div>
              </div>

              {/* Quantity Controls */}
              <div className="flex items-center justify-between mt-3 pt-3 border-t border-border/50">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() =>
                      handleUpdateQuantity(item.product_id, item.quantity - 1)
                    }
                    disabled={updating === item.product_id}
                    className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center hover:bg-muted/80 transition-colors disabled:opacity-50"
                  >
                    <Minus className="h-4 w-4" />
                  </button>
                  <span className="w-8 text-center text-sm font-medium">
                    {item.quantity}
                  </span>
                  <button
                    onClick={() =>
                      handleUpdateQuantity(item.product_id, item.quantity + 1)
                    }
                    disabled={updating === item.product_id}
                    className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center hover:bg-muted/80 transition-colors disabled:opacity-50"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
                <button
                  onClick={() => handleRemoveItem(item.product_id)}
                  disabled={updating === item.product_id}
                  className="p-2 text-red-400 hover:bg-red-500/10 rounded-lg transition-colors disabled:opacity-50"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Price Details */}
        <div className="rounded-xl p-4 border border-border bg-card">
          <h3 className="text-sm font-semibold mb-3">Price details</h3>

          {totalDiscount > 0 && (
            <div className="bg-green-500/10 rounded-lg p-3 mb-3">
              <div className="flex items-center gap-2">
                <Tag className="h-4 w-4 text-green-500" />
                <p className="text-sm text-green-500 font-medium">
                  Yay! Your total discount is ₹{totalDiscount}
                </p>
              </div>
            </div>
          )}

          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Product Price</span>
              <span>₹{originalSubtotal}</span>
            </div>
            {productDiscount > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Total Discounts</span>
                <span className="text-green-500">
                  - ₹{productDiscount}
                </span>
              </div>
            )}
            {firstOrderDiscount > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">
                  1st Order Discount
                </span>
                <span className="text-green-500">
                  - ₹{firstOrderDiscount}
                </span>
              </div>
            )}
            <div className="border-t border-border pt-2 mt-2">
              <div className="flex justify-between">
                <span className="text-sm font-semibold">Order total</span>
                <span className="text-sm font-bold">₹{total}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Checkout Button */}
        <Button
          onClick={() => navigate("/dashboard/checkout")}
          className="w-full h-12 bg-foreground text-background font-medium"
        >
          Place Order — ₹{total}
        </Button>
      </div>
    </div>
  );
}
