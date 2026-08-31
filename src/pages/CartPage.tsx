import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Trash2, Plus, Minus, ShoppingBag, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router";

export default function CartPage() {
  const navigate = useNavigate();
  const cartItems = useQuery(api.cart.list);
  const updateQuantity = useMutation(api.cart.updateQuantity);
  const removeItem = useMutation(api.cart.removeItem);

  const total =
    cartItems?.reduce(
      (sum, item) => sum + (item.product?.price ?? 0) * item.quantity,
      0,
    ) ?? 0;

  if (cartItems === undefined) {
    return (
      <div className="pb-24 px-4 pt-4">
        <div className="animate-pulse space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex gap-3 rounded-lg bg-muted p-3">
              <div className="h-20 w-20 shrink-0 rounded bg-white" />
              <div className="flex-1 space-y-2">
                <div className="h-3 w-3/4 rounded bg-white" />
                <div className="h-3 w-1/2 rounded bg-white" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (cartItems.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center px-4 py-20 pb-24">
        <ShoppingBag className="h-12 w-12 text-muted-foreground/30 mb-4" />
        <h2 className="text-base font-medium text-foreground">
          Your basket is empty
        </h2>
        <p className="mt-1 text-sm text-muted-foreground text-center max-w-xs">
          Start shopping to add items to your basket
        </p>
        <Button
          onClick={() => navigate("/dashboard/search")}
          className="mt-4 bg-foreground text-white"
        >
          Start Shopping
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    );
  }

  return (
    <div className="pb-24">
      <div className="sticky top-0 z-10 bg-white/95 backdrop-blur-sm border-b border-border">
        <div className="px-4 py-3">
          <h1 className="text-base font-semibold">Your Basket</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            {cartItems.length} item{cartItems.length !== 1 ? "s" : ""}
          </p>
        </div>
      </div>

      <div className="divide-y divide-border">
        {cartItems.map(
          (item) =>
            item.product && (
              <div key={item._id} className="flex gap-3 px-4 py-3">
                <div className="h-20 w-20 shrink-0 overflow-hidden rounded-lg bg-muted">
                  <img
                    src={item.product.image}
                    alt={item.product.name}
                    className="h-full w-full object-cover"
                  />
                </div>
                <div className="flex flex-1 flex-col justify-between">
                  <div>
                    <p className="text-sm font-medium leading-tight line-clamp-1">
                      {item.product.name}
                    </p>
                    {item.size && (
                      <p className="text-[10px] text-muted-foreground mt-0.5">
                        Size: {item.size}
                      </p>
                    )}
                    <p className="text-sm font-semibold mt-0.5">
                      ₹{item.product.price * item.quantity}
                    </p>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() =>
                          updateQuantity({
                            cartItemId: item._id,
                            quantity: item.quantity - 1,
                          })
                        }
                        className="flex h-7 w-7 items-center justify-center rounded-md border border-border hover:bg-muted transition-colors"
                      >
                        <Minus className="h-3 w-3" />
                      </button>
                      <span className="w-8 text-center text-xs font-medium">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() =>
                          updateQuantity({
                            cartItemId: item._id,
                            quantity: item.quantity + 1,
                          })
                        }
                        className="flex h-7 w-7 items-center justify-center rounded-md border border-border hover:bg-muted transition-colors"
                      >
                        <Plus className="h-3 w-3" />
                      </button>
                    </div>
                    <button
                      onClick={() => removeItem({ cartItemId: item._id })}
                      className="text-muted-foreground hover:text-destructive transition-colors"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            ),
        )}
      </div>

      {/* Total & Checkout */}
      <div className="sticky bottom-16 bg-white/95 backdrop-blur-sm border-t border-border">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-muted-foreground">Total</span>
            <span className="text-lg font-bold">₹{total}</span>
          </div>
          <Button
            onClick={() => navigate("/dashboard/checkout")}
            className="w-full h-12 bg-foreground text-white font-medium"
          >
            Proceed to Checkout
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
