import { useState, useMemo } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  MapPin,
  CreditCard,
  Banknote,
  CheckCircle,
  XCircle,
  Loader2,
  Clock,
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
  const debitWallet = useMutation(api.wallet.debit);

  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(
    null,
  );
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "online" | null>(
    null,
  );
  const [step, setStep] = useState<"address" | "payment" | "qr" | "verifying" | "done" | "failed">("address");
  const [orderId, setOrderId] = useState<string | null>(null);
  const [pollCount, setPollCount] = useState(0);
  const [idempotencyKey] = useState(() => `idem_${Date.now()}_${Math.random().toString(36).slice(2)}`);

  // Price validation - check if cart prices are still valid
  const priceValidation = useQuery(api.cart.validatePrices);

  const activeAddressId = selectedAddressId || defaultAddress?._id;

  const total =
    cartItems?.reduce(
      (sum, item) => sum + (item.product?.price ?? 0) * item.quantity,
      0,
    ) ?? 0;

  const SERVICE_FEE = 10;
  const discount = total > 0 && cartItems && cartItems.length > 0 ? 120 : 0;
  const finalTotal = total - discount + SERVICE_FEE;

  const handlePlaceOrder = async () => {
    if (!activeAddressId) {
      toast.error("Please select a delivery address");
      return;
    }
    if (!paymentMethod) {
      toast.error("Please select a payment method");
      return;
    }

    // Validate prices before placing order
    if (priceValidation && !priceValidation.valid) {
      toast.error("Cart prices have changed. Please review your cart.");
      return;
    }

    try {
      // Deduct service fee from wallet
      try {
        await debitWallet({
          amount: SERVICE_FEE,
          description: "Order processing fee",
        });
      } catch {
        // Wallet might not have enough — continue with order anyway
        toast.warning("Could not deduct service fee from wallet");
      }

      const id = await placeOrder({
        addressId: activeAddressId as any,
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

  const handleVerifyPayment = async (success: boolean) => {
    if (!orderId) return;
    setStep("verifying");
    setPollCount(0);

    if (!success) {
      // User says payment failed — retry
      try {
        await verifyPayment({ orderId: orderId as any, success: false });
      } catch {
        // ignore
      }
      setStep("payment");
      toast.error("Payment failed. Please try again.");
      return;
    }

    // Poll for payment verification
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

    // Max polls reached — show pending state
    setStep("failed");
    toast.error("Payment verification timed out. Please check later.");
  };

  if (step === "done") {
    return (
      <div className="flex flex-col items-center justify-center px-4 py-20 pb-24">
        <CheckCircle className="h-16 w-16 text-green-600 mb-4" />
        <h2 className="text-lg font-semibold">Order Placed!</h2>
        <p className="mt-1 text-sm text-muted-foreground text-center max-w-xs">
          Your order has been placed successfully. You can track it in Orders.
        </p>
        <Button
          onClick={() => navigate("/dashboard/orders")}
          className="mt-6 bg-foreground text-white"
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

  if (step === "failed") {
    return (
      <div className="flex flex-col items-center justify-center px-4 py-20 pb-24">
        <Clock className="h-16 w-16 text-amber-500 mb-4" />
        <h2 className="text-lg font-semibold">Payment Pending</h2>
        <p className="mt-1 text-sm text-muted-foreground text-center max-w-xs">
          Your payment is being verified. This may take a few minutes. Check
          your Orders for updates.
        </p>
        <Button
          onClick={() => navigate("/dashboard/orders")}
          className="mt-6 bg-foreground text-white"
        >
          Check Orders
        </Button>
      </div>
    );
  }

  if (step === "qr") {
    return (
      <div className="flex flex-col items-center px-4 py-8 pb-24">
        <button
          onClick={() => setStep("payment")}
          className="self-start flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-6"
        >
          <ArrowLeft className="h-4 w-4" /> Back
        </button>

        <div className="text-center mb-6">
          <h2 className="text-base font-semibold">Scan to Pay</h2>
          <p className="text-2xl font-bold mt-2">₹{finalTotal}</p>
        </div>

        {/* QR Code */}
        <div className="w-56 h-56 rounded-xl border-2 border-dashed border-border flex flex-col items-center justify-center bg-white">
          <div className="grid grid-cols-7 gap-px p-4">
            {Array.from({ length: 49 }).map((_, i) => {
              // Create a deterministic QR-like pattern
              const row = Math.floor(i / 7);
              const col = i % 7;
              const isCorner =
                (row < 3 && col < 3) ||
                (row < 3 && col > 3) ||
                (row > 3 && col < 3);
              const isCenter = row === 3 && col === 3;
              const pattern = (row * 7 + col) % 3 === 0 || isCorner || isCenter;
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
          <p className="text-[10px] text-muted-foreground mt-2">
            Scan with your UPI app
          </p>
        </div>

        <p className="mt-6 text-xs text-muted-foreground text-center max-w-xs">
          After scanning and completing the payment, click verify below
        </p>

        <div className="flex gap-3 mt-6 w-full max-w-xs">
          <Button
            onClick={() => handleVerifyPayment(true)}
            className="flex-1 bg-green-600 text-white hover:bg-green-700"
          >
            <CheckCircle className="mr-2 h-4 w-4" />
            I've Paid
          </Button>
          <Button
            onClick={() => handleVerifyPayment(false)}
            variant="outline"
            className="flex-1"
          >
            <XCircle className="mr-2 h-4 w-4" />
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  if (step === "verifying") {
    return (
      <div className="flex flex-col items-center justify-center px-4 py-20 pb-24">
        <Loader2 className="h-10 w-10 animate-spin text-muted-foreground mb-4" />
        <p className="text-sm text-muted-foreground">
          Verifying payment... ({pollCount}/10)
        </p>
        <p className="text-[10px] text-muted-foreground/60 mt-1">
          Do not close this page
        </p>
      </div>
    );
  }

  return (
    <div className="pb-24">
      <div className="sticky top-0 z-10 bg-white/95 backdrop-blur-sm border-b border-border">
        <div className="flex items-center px-4 py-3">
          <button
            onClick={() => (step === "payment" ? setStep("address") : navigate(-1))}
            className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            {step === "payment" ? "Back" : "Cart"}
          </button>
          <h1 className="ml-4 text-base font-semibold">Checkout</h1>
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
                <div key={i} className="h-20 animate-pulse rounded-lg bg-muted" />
              ))}
            </div>
          ) : addresses.length === 0 ? (
            <div className="text-center py-8">
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
                  className={`w-full text-left rounded-lg border p-3 transition-all ${
                    activeAddressId === addr._id
                      ? "border-foreground bg-foreground/[0.03]"
                      : "border-border hover:border-foreground/30"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                      {addr.label}
                    </span>
                    {activeAddressId === addr._id && (
                      <div className="h-2 w-2 rounded-full bg-foreground" />
                    )}
                  </div>
                  <p className="text-sm font-medium mt-1">{addr.fullName}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {addr.houseNumber}, {addr.area}, {addr.city} - {addr.pinCode}
                  </p>
                </button>
              ))}
            </div>
          )}

          <Button
            onClick={() => {
              if (!activeAddressId) {
                toast.error("Please select an address");
                return;
              }
              setStep("payment");
            }}
            className="mt-6 w-full h-12 bg-foreground text-white"
          >
            Continue
          </Button>
        </div>
      )}

      {step === "payment" && (
        <div className="px-4">
          <div className="flex items-center gap-2 mb-4">
            <CreditCard className="h-4 w-4" />
            <h2 className="text-sm font-medium uppercase tracking-wider text-muted-foreground">
              Payment Method
            </h2>
          </div>

          <div className="space-y-2">
            <button
              onClick={() => setPaymentMethod("cash")}
              className={`w-full text-left rounded-lg border p-4 transition-all ${
                paymentMethod === "cash"
                  ? "border-foreground bg-foreground/[0.03]"
                  : "border-border hover:border-foreground/30"
              }`}
            >
              <div className="flex items-center gap-3">
                <Banknote className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Cash on Delivery</p>
                  <p className="text-xs text-muted-foreground">
                    Pay when your order arrives
                  </p>
                </div>
                {paymentMethod === "cash" && (
                  <div className="ml-auto h-2 w-2 rounded-full bg-foreground" />
                )}
              </div>
            </button>

            <button
              onClick={() => setPaymentMethod("online")}
              className={`w-full text-left rounded-lg border p-4 transition-all ${
                paymentMethod === "online"
                  ? "border-foreground bg-foreground/[0.03]"
                  : "border-border hover:border-foreground/30"
              }`}
            >
              <div className="flex items-center gap-3">
                <CreditCard className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Pay Online (UPI)</p>
                  <p className="text-xs text-muted-foreground">
                    Scan QR code to pay
                  </p>
                </div>
                {paymentMethod === "online" && (
                  <div className="ml-auto h-2 w-2 rounded-full bg-foreground" />
                )}
              </div>
            </button>
          </div>

          {/* Order Summary */}
          <div className="mt-6 rounded-lg bg-muted/50 p-4">
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-3">
              Order Summary
            </p>
            <div className="space-y-2">
              {cartItems?.map(
                (item) =>
                  item.product && (
                    <div
                      key={item._id}
                      className="flex items-center justify-between text-sm"
                    >
                      <span className="text-muted-foreground">
                        {item.product.name} × {item.quantity}
                      </span>
                      <span>
                        ₹{item.product.price * item.quantity}
                      </span>
                    </div>
                  ),
              )}
              <div className="border-t border-border pt-2 mt-2 space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span>₹{total}</span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-sm text-green-600">
                    <span>1st Order Discount</span>
                    <span>-₹{discount}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Service Fee</span>
                  <span>₹{SERVICE_FEE}</span>
                </div>
                <div className="flex justify-between text-base font-bold mt-2 pt-2 border-t border-border">
                  <span>Total</span>
                  <span>₹{finalTotal}</span>
                </div>
              </div>
            </div>
          </div>

          <Button
            onClick={handlePlaceOrder}
            className="mt-6 w-full h-12 bg-foreground text-white font-medium"
          >
            Place Order — ₹{finalTotal}
          </Button>
        </div>
      )}
    </div>
  );
}
