import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  MapPin,
  CreditCard,
  Banknote,
  CheckCircle,
  Loader2,
  Clock,
  Truck,
  Tag,
  X,
} from "lucide-react";
import { useNavigate } from "react-router";
import { toast } from "sonner";

export default function CheckoutPage() {
  const navigate = useNavigate();
  const cartItems = useQuery(api.cart.list);
  const addresses = useQuery(api.addresses.list);
  const defaultAddress = useQuery(api.addresses.getDefault);
  const placeOrder = useMutation(api.orders.place);
  const verifyPayment = useMutation(api.orders.verifyPayment);
  const updateCart = useMutation(api.cart.updateQuantity);

  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(
    null,
  );
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "online" | null>(
    null,
  );
  const [step, setStep] = useState<
    "address" | "payment" | "qr" | "verifying" | "done" | "failed"
  >("address");
  const [orderId, setOrderId] = useState<string | null>(null);
  const [pollCount, setPollCount] = useState(0);
  const [idempotencyKey] = useState(
    () => `idem_${Date.now()}_${Math.random().toString(36).slice(2)}`,
  );

  const priceValidation = useQuery(api.cart.validatePrices);
  const activeAddress = addresses?.find(
    (a) => a._id === (selectedAddressId || defaultAddress?._id),
  );

  const total =
    cartItems?.reduce(
      (sum, item) => sum + (item.product?.price ?? 0) * item.quantity,
      0,
    ) ?? 0;

  const originalTotal =
    cartItems?.reduce(
      (sum, item) =>
        sum +
        (item.product?.originalPrice ?? item.product?.price ?? 0) *
          item.quantity,
      0,
    ) ?? 0;

  const productDiscount = originalTotal - total;
  const firstOrderDiscount =
    total > 0 && cartItems && cartItems.length > 0 ? 120 : 0;
  const discount = productDiscount + firstOrderDiscount;
  const finalTotal = total - firstOrderDiscount;

  const handlePlaceOrder = async () => {
    if (!activeAddress) {
      toast.error("Please select a delivery address");
      return;
    }
    if (!paymentMethod) {
      toast.error("Please select a payment method");
      return;
    }
    if (priceValidation && !priceValidation.valid) {
      toast.error("Cart prices have changed. Please review your cart.");
      return;
    }

    try {
      const id = await placeOrder({
        addressId: activeAddress._id as any,
        paymentMethod,
        paymentStatus: paymentMethod === "cash" ? "paid" : "pending",
      });
      setOrderId(id as string);

      if (paymentMethod === "cash") {
        setStep("done");
        toast.success("Order placed successfully!");
      } else {
        setStep("qr");
      }
    } catch {
      toast.error("Failed to place order");
    }
  };

  const handleVerifyPayment = async () => {
    if (!orderId) return;
    setStep("verifying");
    setPollCount(0);

    const maxPolls = 10;
    for (let i = 0; i < maxPolls; i++) {
      setPollCount(i + 1);
      await new Promise((r) => setTimeout(r, 1500));

      try {
        const result = await verifyPayment({
          orderId: orderId as any,
          success: true,
          idempotencyKey,
        });
        if (result === "verified") {
          setStep("done");
          toast.success("Payment verified! Order confirmed.");
          return;
        }
      } catch {
        // Continue polling
      }
    }

    setStep("failed");
    toast.error("Payment verification timed out. Please check later.");
  };

  const handleUpdateQty = async (cartItemId: string, newQty: number) => {
    if (newQty < 1) return;
    try {
      await updateCart({ cartItemId: cartItemId as any, quantity: newQty });
    } catch {
      toast.error("Failed to update quantity");
    }
  };

  const deliveryDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  const deliveryStr = deliveryDate.toLocaleDateString("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "short",
  });

  // ─── Done ─────────────────────────────────────────────────────────
  if (step === "done") {
    return (
      <div className="flex flex-col items-center justify-center px-4 py-20 pb-24 min-h-screen">
        <div className="w-20 h-20 rounded-full bg-green-500/10 flex items-center justify-center mb-5">
          <CheckCircle className="h-10 w-10 text-green-500" />
        </div>
        <h2 className="text-lg font-semibold">Order Placed!</h2>
        <p className="mt-1 text-sm text-muted-foreground text-center max-w-xs">
          Your order has been placed successfully. Track it in Orders.
        </p>
        <Button
          onClick={() => navigate("/dashboard/orders")}
          className="mt-6 bg-foreground text-background"
        >
          View Orders
        </Button>
        <Button
          onClick={() => navigate("/dashboard/search")}
          variant="ghost"
          className="mt-2"
        >
          Continue Shopping
        </Button>
      </div>
    );
  }

  // ─── Failed / Pending ─────────────────────────────────────────────
  if (step === "failed") {
    return (
      <div className="flex flex-col items-center justify-center px-4 py-20 pb-24 min-h-screen">
        <div className="w-20 h-20 rounded-full bg-amber-500/10 flex items-center justify-center mb-5">
          <Clock className="h-10 w-10 text-amber-500" />
        </div>
        <h2 className="text-lg font-semibold">Payment Pending</h2>
        <p className="mt-1 text-sm text-muted-foreground text-center max-w-xs">
          Your payment is still being verified. This can take a few minutes.
          Check your Orders for updates.
        </p>
        <Button
          onClick={() => navigate("/dashboard/orders")}
          className="mt-6 bg-foreground text-background"
        >
          Check Orders
        </Button>
      </div>
    );
  }

  // ─── QR Code ──────────────────────────────────────────────────────
  if (step === "qr") {
    return (
      <div className="flex flex-col items-center px-4 py-8 pb-24 min-h-screen">
        <div className="w-full max-w-sm">
          <button
            onClick={() => {
              setStep("payment");
              setOrderId(null);
            }}
            className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-6"
          >
            <ArrowLeft className="h-4 w-4" /> Back
          </button>

          <div className="text-center mb-6">
            <h2 className="text-base font-semibold">Scan to Pay</h2>
            <p className="text-3xl font-bold mt-2">&#x20B9;{finalTotal}</p>
          </div>

          {/* QR Code */}
          <div className="w-56 h-56 mx-auto rounded-xl border-2 border-dashed border-border flex flex-col items-center justify-center bg-white">
            <div className="grid grid-cols-7 gap-px p-4">
              {Array.from({ length: 49 }).map((_, i) => {
                const row = Math.floor(i / 7);
                const col = i % 7;
                const isCorner =
                  (row < 3 && col < 3) ||
                  (row < 3 && col > 3) ||
                  (row > 3 && col < 3);
                const isCenter = row === 3 && col === 3;
                const pattern =
                  (row * 7 + col) % 3 === 0 || isCorner || isCenter;
                return (
                  <div
                    key={i}
                    className={`h-4 w-4 ${
                      pattern ? "bg-foreground" : "bg-white"
                    }`}
                  />
                );
              })}
            </div>
            <p className="text-[10px] text-gray-500 mt-2">
              Scan with your UPI app
            </p>
          </div>

          <p className="mt-6 text-xs text-muted-foreground text-center">
            After completing the payment in your UPI app, click verify below
          </p>

          <div className="flex gap-3 mt-6">
            <Button
              onClick={handleVerifyPayment}
              className="flex-1 bg-green-600 text-white hover:bg-green-700 h-12"
            >
              <CheckCircle className="mr-2 h-4 w-4" />
              I've Paid
            </Button>
            <Button
              onClick={() => {
                setStep("payment");
                setOrderId(null);
              }}
              variant="outline"
              className="flex-1 h-12"
            >
              <X className="mr-2 h-4 w-4" />
              Cancel
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // ─── Verifying ────────────────────────────────────────────────────
  if (step === "verifying") {
    return (
      <div className="flex flex-col items-center justify-center px-4 py-20 pb-24 min-h-screen">
        <Loader2 className="h-12 w-12 animate-spin text-muted-foreground mb-4" />
        <p className="text-sm font-medium">Verifying payment...</p>
        <p className="text-xs text-muted-foreground mt-1">
          ({pollCount}/10 checks)
        </p>
        <div className="mt-4 bg-muted/50 rounded-xl px-4 py-3 max-w-xs text-center">
          <p className="text-sm text-muted-foreground">
            If you paid, please wait a few minutes while we verify your
            transaction.
          </p>
        </div>
      </div>
    );
  }

  // ─── Address Step ─────────────────────────────────────────────────
  return (
    <div className="pb-24 min-h-screen">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background border-b border-border">
        <div className="flex items-center px-4 py-3">
          <button
            onClick={() =>
              step === "payment" ? setStep("address") : navigate(-1)
            }
            className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            {step === "payment" ? "Back" : "Cart"}
          </button>
          <h1 className="ml-4 text-base font-semibold">
            {step === "address" ? "Select Address" : "My Cart"}
          </h1>
        </div>
      </div>

      {/* Step Indicator */}
      <div className="flex px-4 py-3 gap-2">
        <div
          className={`flex-1 h-1 rounded-full transition-colors ${
            step === "address" ? "bg-foreground" : "bg-muted"
          }`}
        />
        <div
          className={`flex-1 h-1 rounded-full transition-colors ${
            step === "payment" ? "bg-foreground" : "bg-muted"
          }`}
        />
      </div>

      {/* ─── Address Step ────────────────────────────────────────── */}
      {step === "address" && (
        <div className="px-4">
          <div className="flex items-center gap-2 mb-4">
            <MapPin className="h-4 w-4" />
            <h2 className="text-sm font-medium uppercase tracking-wider text-muted-foreground">
              Delivery Address
            </h2>
          </div>

          {addresses === undefined ? (
            <div className="space-y-2">
              {[1, 2].map((i) => (
                <div
                  key={i}
                  className="h-20 animate-pulse rounded-lg bg-muted"
                />
              ))}
            </div>
          ) : addresses.length === 0 ? (
            <div className="text-center py-12 rounded-xl border border-dashed border-border">
              <MapPin className="h-10 w-10 text-muted-foreground/40 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">
                No saved addresses
              </p>
              <Button
                onClick={() => navigate("/dashboard/addresses")}
                variant="outline"
                className="mt-3"
              >
                Add Address
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              {addresses.map((addr) => (
                <button
                  key={addr._id}
                  onClick={() => setSelectedAddressId(addr._id)}
                  className={`w-full text-left rounded-xl border p-4 transition-all ${
                    (selectedAddressId || defaultAddress?._id) === addr._id
                      ? "border-foreground bg-foreground/[0.03] ring-1 ring-foreground/10"
                      : "border-border hover:border-foreground/30"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                      {addr.label}
                    </span>
                    {(selectedAddressId || defaultAddress?._id) === addr._id && (
                      <div className="h-2 w-2 rounded-full bg-foreground" />
                    )}
                  </div>
                  <p className="text-sm font-medium mt-1.5">{addr.fullName}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {addr.houseNumber}, {addr.area}, {addr.city} - {addr.pinCode}
                  </p>
                </button>
              ))}
            </div>
          )}

          <Button
            onClick={() => {
              if (!activeAddress) {
                toast.error("Please select an address");
                return;
              }
              setStep("payment");
            }}
            className="mt-6 w-full h-12 bg-foreground text-background font-medium"
          >
            Continue
          </Button>
        </div>
      )}

      {/* ─── Payment Step ────────────────────────────────────────── */}
      {step === "payment" && (
        <div className="px-4 space-y-4">
          {/* Address Card */}
          {activeAddress && (
            <div className="rounded-xl border border-border p-3 bg-card flex items-center justify-between">
              <div className="flex items-start gap-2 min-w-0 flex-1">
                <MapPin className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium truncate">
                      {activeAddress.fullName}
                    </p>
                    <span className="text-[10px] font-medium uppercase bg-muted px-1.5 py-0.5 rounded text-muted-foreground">
                      {activeAddress.label}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5 truncate">
                    {activeAddress.houseNumber}, {activeAddress.area},{" "}
                    {activeAddress.city} - {activeAddress.pinCode}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setStep("address")}
                className="text-xs font-medium border border-border rounded-lg px-3 py-1.5 shrink-0 ml-2 hover:bg-muted transition-colors"
              >
                Change
              </button>
            </div>
          )}

          {/* Cart Items */}
          <div className="space-y-3">
            {cartItems?.map(
              (item) =>
                item.product && (
                  <div
                    key={item._id}
                    className="rounded-xl border border-border p-3 bg-card"
                  >
                    <div className="flex gap-3">
                      <div className="w-20 h-20 rounded-lg bg-muted shrink-0 overflow-hidden">
                        <img
                          src={item.product.image}
                          alt={item.product.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium line-clamp-2">
                          {item.product.name}
                        </p>
                        {item.size && (
                          <span className="inline-block text-[10px] font-medium bg-muted px-1.5 py-0.5 rounded mt-1 text-muted-foreground">
                            Size: {item.size}
                          </span>
                        )}
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
                                <span className="text-xs text-green-500 font-medium">
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
                        {item.product.originalPrice &&
                          item.product.originalPrice > item.product.price && (
                            <span className="text-[10px] bg-green-500/10 text-green-500 px-2 py-0.5 rounded-full font-medium inline-block mt-1.5">
                              &#x20B9;
                              {item.product.originalPrice -
                                item.product.price}{" "}
                              Less today
                            </span>
                          )}
                      </div>
                    </div>

                    <div className="flex items-center justify-between mt-3 pt-3 border-t border-border/50">
                      <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                        <Truck className="h-3 w-3" />
                        <span>Est. delivery {deliveryStr}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() =>
                            handleUpdateQty(item._id, item.quantity - 1)
                          }
                          className="w-7 h-7 rounded border border-border flex items-center justify-center text-sm hover:bg-muted transition-colors"
                        >
                          -
                        </button>
                        <span className="text-sm font-medium w-5 text-center">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() =>
                            handleUpdateQty(item._id, item.quantity + 1)
                          }
                          className="w-7 h-7 rounded border border-border flex items-center justify-center text-sm hover:bg-muted transition-colors"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  </div>
                ),
            )}
          </div>

          {/* Price Details */}
          <div className="rounded-xl border border-border p-4 bg-card">
            <h3 className="text-sm font-semibold mb-3">Price details</h3>
            {discount > 0 && (
              <div className="flex items-center gap-2 bg-green-500/10 text-green-500 rounded-lg px-3 py-2 mb-3">
                <Tag className="h-4 w-4 shrink-0" />
                <span className="text-sm font-medium">
                  Yay! Your total discount is &#x20B9;{discount}
                </span>
              </div>
            )}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Product Price</span>
                <span>&#x20B9;{originalTotal}</span>
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
              <div className="border-t border-dashed border-border pt-3 mt-3">
                <div className="flex justify-between text-base font-bold">
                  <span>Order total</span>
                  <span>&#x20B9;{finalTotal}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Payment Method — with visible prices */}
          <div className="space-y-2">
            <p className="text-sm font-semibold">Select payment method</p>

            <button
              onClick={() => setPaymentMethod("cash")}
              className={`w-full text-left rounded-xl border p-4 transition-all ${
                paymentMethod === "cash"
                  ? "border-foreground bg-foreground/[0.03] ring-1 ring-foreground/10"
                  : "border-border hover:border-foreground/30"
              }`}
            >
              <div className="flex items-center gap-3">
                <Banknote className="h-5 w-5 text-muted-foreground shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">Cash on Delivery</p>
                  <p className="text-xs text-muted-foreground">
                    Pay when your order arrives
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-sm font-bold">&#x20B9;{finalTotal}</p>
                  <p className="text-[10px] text-muted-foreground">
                    Pay at delivery
                  </p>
                </div>
                {paymentMethod === "cash" && (
                  <div className="h-2 w-2 rounded-full bg-foreground shrink-0" />
                )}
              </div>
            </button>

            <button
              onClick={() => setPaymentMethod("online")}
              className={`w-full text-left rounded-xl border p-4 transition-all ${
                paymentMethod === "online"
                  ? "border-foreground bg-foreground/[0.03] ring-1 ring-foreground/10"
                  : "border-border hover:border-foreground/30"
              }`}
            >
              <div className="flex items-center gap-3">
                <CreditCard className="h-5 w-5 text-muted-foreground shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">Pay Online (UPI)</p>
                  <p className="text-xs text-muted-foreground">
                    Scan QR code to pay
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-sm font-bold text-green-500">
                    &#x20B9;{finalTotal}
                  </p>
                  <p className="text-[10px] text-green-500/70">
                    Pay now via UPI
                  </p>
                </div>
                {paymentMethod === "online" && (
                  <div className="h-2 w-2 rounded-full bg-foreground shrink-0" />
                )}
              </div>
            </button>
          </div>

          {/* Place Order */}
          <Button
            onClick={handlePlaceOrder}
            className="w-full h-12 bg-foreground text-background font-medium"
          >
            Place Order — &#x20B9;{finalTotal}
          </Button>
        </div>
      )}
    </div>
  );
}
