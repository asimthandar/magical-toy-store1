import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useNavigate } from "react-router";
import { Button } from "@/components/ui/button";
import {
  ShoppingCart,
  Plus,
  Minus,
  Trash2,
  MapPin,
  Tag,
} from "lucide-react";
import { toast } from "sonner";

export default function CartPage() {
  const navigate = useNavigate();
  const cartItems = useQuery(api.cart.list);
  const updateQuantity = useMutation(api.cart.updateQuantity);
  const removeItem = useMutation(api.cart.removeItem);
  const defaultAddress = useQuery(api.addresses.getDefault);

  const subtotal =
    cartItems?.reduce(
      (sum, item) => sum + (item.product?.price ?? 0) * item.quantity,
      0,
    ) ?? 0;

  const originalSubtotal =
    cartItems?.reduce(
      (sum, item) =>
        sum +
        (item.product?.originalPrice ?? item.product?.price ?? 0) *
          item.quantity,
      0,
    ) ?? 0;

  const productDiscount = originalSubtotal - subtotal;
  const firstOrderDiscount = subtotal > 0 ? 120 : 0;
  const totalDiscount = productDiscount + firstOrderDiscount;
  const total = subtotal - firstOrderDiscount;

  if (cartItems === undefined) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
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
                  {defaultAddress?.fullName || "No address"}
                </p>
                <p className="text-xs text-muted-foreground line-clamp-1">
                  {defaultAddress
                    ? `${defaultAddress.houseNumber}, ${defaultAddress.area}, ${defaultAddress.city}`
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
          {cartItems.map(
            (item) =>
              item.product && (
                <div
                  key={item._id}
                  className="rounded-xl p-4 border border-border bg-card"
                >
                  <div className="flex gap-3">
                    {/* Product Image */}
                    <div className="w-20 h-20 rounded-lg bg-muted overflow-hidden shrink-0">
                      <img
                        src={item.product.image}
                        alt={item.product.name}
                        className="w-full h-full object-cover"
                      />
                    </div>

                    {/* Product Info */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium line-clamp-2">
                        {item.product.name}
                      </p>
                      {item.size && (
                        <span className="inline-block text-[10px] font-medium bg-muted px-1.5 py-0.5 rounded mt-1 text-muted-foreground">
                          Size: {item.size}
                        </span>
                      )}

                      {/* Price */}
                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-sm font-bold bg-foreground text-background px-2 py-0.5 rounded">
                          &#x20B9;{item.product.price}
                        </span>
                        {item.product.originalPrice &&
                          item.product.originalPrice > item.product.price && (
                            <>
                              <span className="text-xs text-muted-foreground line-through">
                                &#x20B9;{item.product.originalPrice}
                              </span>
                              <span className="text-xs text-green-500">
                                {Math.round(
                                  ((item.product.originalPrice -
                                    item.product.price) /
                                    item.product.originalPrice) *
                                    100,
                                )}
                                % Off
                              </span>
                            </>
                          )}
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
                          updateQuantity({
                            cartItemId: item._id,
                            quantity: item.quantity - 1,
                          })
                        }
                        className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center hover:bg-muted/80 transition-colors"
                      >
                        <Minus className="h-4 w-4" />
                      </button>
                      <span className="w-8 text-center text-sm font-medium">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() =>
                          updateQuantity({
                            cartItemId: item._id,
                            quantity: item.quantity + 1,
                          })
                        }
                        className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center hover:bg-muted/80 transition-colors"
                      >
                        <Plus className="h-4 w-4" />
                      </button>
                    </div>
                    <button
                      onClick={() => removeItem({ cartItemId: item._id })}
                      className="p-2 text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ),
          )}
        </div>

        {/* Price Details */}
        <div className="rounded-xl p-4 border border-border bg-card">
          <h3 className="text-sm font-semibold mb-3">Price details</h3>

          {totalDiscount > 0 && (
            <div className="bg-green-500/10 rounded-lg p-3 mb-3">
              <div className="flex items-center gap-2">
                <Tag className="h-4 w-4 text-green-500" />
                <p className="text-sm text-green-500 font-medium">
                  Yay! Your total discount is &#x20B9;{totalDiscount}
                </p>
              </div>
            </div>
          )}

          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Product Price</span>
              <span>&#x20B9;{originalSubtotal}</span>
            </div>
            {productDiscount > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Total Discounts</span>
                <span className="text-green-500">
                  - &#x20B9;{productDiscount}
                </span>
              </div>
            )}
            {firstOrderDiscount > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">
                  1st Order Discount
                </span>
                <span className="text-green-500">
                  - &#x20B9;{firstOrderDiscount}
                </span>
              </div>
            )}
            <div className="border-t border-border pt-2 mt-2">
              <div className="flex justify-between">
                <span className="text-sm font-semibold">Order total</span>
                <span className="text-sm font-bold">&#x20B9;{total}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Checkout Button */}
        <Button
          onClick={() => navigate("/dashboard/checkout")}
          className="w-full h-12 bg-foreground text-background font-medium"
        >
          Place Order — &#x20B9;{total}
        </Button>
      </div>
    </div>
  );
}
