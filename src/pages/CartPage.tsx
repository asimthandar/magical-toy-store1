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
  AlertTriangle,
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

  const discount = subtotal > 0 ? 120 : 0;
  const serviceFee = 10;
  const total = subtotal - discount + serviceFee;

  if (cartItems === undefined) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-gray-500">Loading...</div>
      </div>
    );
  }

  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen bg-background">
        <div className="sticky top-0 z-10 bg-[#1a1a1a] border-b border-white/10">
          <div className="px-4 py-3">
            <h1 className="text-lg font-bold">My Cart</h1>
          </div>
        </div>
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <ShoppingCart className="h-16 w-16 text-gray-600 mb-4" />
          <h2 className="text-lg font-semibold text-white">Cart is empty</h2>
          <p className="text-sm text-gray-400 mt-1">
            Start shopping to add items
          </p>
          <Button
            onClick={() => navigate("/dashboard/search")}
            className="mt-6 bg-blue-500 hover:bg-blue-600 text-white"
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
      <div className="sticky top-0 z-10 bg-[#1a1a1a] border-b border-white/10">
        <div className="px-4 py-3">
          <h1 className="text-lg font-bold">My Cart</h1>
        </div>
      </div>

      <div className="px-4 pt-4 space-y-4">
        {/* Address Selection */}
        <div className="bg-[#2a2a2a] rounded-xl p-4 border border-white/10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-red-500/20 flex items-center justify-center">
                <MapPin className="h-4 w-4 text-red-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-white">
                  {defaultAddress?.fullName || "No address"}
                </p>
                <p className="text-xs text-gray-400 line-clamp-1">
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
              className="border-white/20 text-blue-400 hover:bg-blue-500/10"
            >
              Change
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
                  className="bg-[#2a2a2a] rounded-xl p-4 border border-white/10"
                >
                  <div className="flex gap-3">
                    {/* Product Image */}
                    <div className="w-20 h-20 rounded-lg bg-[#1a1a1a] overflow-hidden shrink-0">
                      <img
                        src={item.product.image}
                        alt={item.product.name}
                        className="w-full h-full object-cover"
                      />
                    </div>

                    {/* Product Info */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white line-clamp-2">
                        {item.product.name}
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {item.product.category}
                      </p>
                      {item.size && (
                        <p className="text-xs text-gray-400 mt-0.5">
                          Size: {item.size}
                        </p>
                      )}

                      {/* Price */}
                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-sm font-bold text-white">
                          ₹{item.product.price}
                        </span>
                        {item.product.originalPrice && (
                          <>
                            <span className="text-xs text-gray-500 line-through">
                              ₹{item.product.originalPrice}
                            </span>
                            <span className="text-xs text-green-400">
                              {Math.round(
                                ((item.product.originalPrice - item.product.price) /
                                  item.product.originalPrice) *
                                  100,
                              )}
                              % Off
                            </span>
                          </>
                        )}
                      </div>

                      {/* Delivery */}
                      <p className="text-xs text-green-400 mt-1">
                        🚚 Free Delivery
                      </p>
                    </div>
                  </div>

                  {/* Quantity Controls */}
                  <div className="flex items-center justify-between mt-4 pt-3 border-t border-white/10">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() =>
                          updateQuantity({
                            cartItemId: item._id,
                            quantity: item.quantity - 1,
                          })
                        }
                        className="w-8 h-8 rounded-lg bg-[#1a1a1a] flex items-center justify-center hover:bg-[#3a3a3a] transition-colors"
                      >
                        <Minus className="h-4 w-4 text-white" />
                      </button>
                      <span className="w-8 text-center text-sm font-medium text-white">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() =>
                          updateQuantity({
                            cartItemId: item._id,
                            quantity: item.quantity + 1,
                          })
                        }
                        className="w-8 h-8 rounded-lg bg-[#1a1a1a] flex items-center justify-center hover:bg-[#3a3a3a] transition-colors"
                      >
                        <Plus className="h-4 w-4 text-white" />
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
        <div className="bg-[#2a2a2a] rounded-xl p-4 border border-white/10">
          <h3 className="text-sm font-semibold text-white mb-3">
            Price details
          </h3>

          {/* Discount Banner */}
          {discount > 0 && (
            <div className="bg-green-500/10 rounded-lg p-3 mb-3">
              <div className="flex items-center gap-2">
                <Tag className="h-4 w-4 text-green-400" />
                <p className="text-sm text-green-400">
                  Yay! Your total discount is ₹{discount}
                </p>
              </div>
            </div>
          )}

          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Product Price</span>
              <span className="text-white">₹{subtotal}</span>
            </div>
            {discount > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Total Discounts</span>
                <span className="text-green-400">- ₹{discount}</span>
              </div>
            )}
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Service Fee</span>
              <span className="text-white">₹{serviceFee}</span>
            </div>
            <div className="border-t border-white/10 pt-2 mt-2">
              <div className="flex justify-between">
                <span className="text-sm font-semibold text-white">
                  Order total
                </span>
                <span className="text-sm font-bold text-white">₹{total}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Service Fee Warning */}
        <div className="bg-amber-500/10 rounded-xl p-4 border border-amber-500/20">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-amber-400">
                Add funds to order
              </p>
              <p className="text-xs text-amber-400/70 mt-0.5">
                Order fee ₹{serviceFee} · Wallet balance ₹0. Add ₹{serviceFee} from the bot.
              </p>
            </div>
          </div>
        </div>

        {/* Checkout Button */}
        <Button
          onClick={() => navigate("/dashboard/checkout")}
          className="w-full h-12 bg-blue-500 hover:bg-blue-600 text-white font-medium"
        >
          Place Order — ₹{total}
        </Button>
      </div>
    </div>
  );
}
