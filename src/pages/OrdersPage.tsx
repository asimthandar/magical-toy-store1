import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Package, ChevronRight } from "lucide-react";

export default function OrdersPage() {
  const [selectedOrder, setSelectedOrder] = useState<string | null>(null);
  const orders = useQuery(api.orders.list);
  const selectedOrderData = useQuery(
    api.orders.get,
    selectedOrder ? { orderId: selectedOrder as any } : "skip",
  );

  if (selectedOrder && selectedOrderData !== undefined) {
    const order = selectedOrderData;
    if (!order) {
      return (
        <div className="flex flex-col items-center justify-center py-20 pb-24">
          <p className="text-sm text-muted-foreground">Order not found</p>
          <Button
            variant="ghost"
            onClick={() => setSelectedOrder(null)}
            className="mt-2"
          >
            Back to orders
          </Button>
        </div>
      );
    }

    return (
      <div className="pb-24">
        <div className="sticky top-0 z-10 bg-white/95 backdrop-blur-sm border-b border-border">
          <div className="flex items-center px-4 py-3">
            <button
              onClick={() => setSelectedOrder(null)}
              className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="h-4 w-4" />
              Orders
            </button>
            <h1 className="ml-4 text-base font-semibold">Order Details</h1>
          </div>
        </div>

        <div className="px-4 pt-4 space-y-4">
          {/* Order Header */}
          <div className="rounded-lg bg-muted/50 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                  Order ID
                </p>
                <p className="text-xs font-mono mt-0.5">
                  {order._id.slice(0, 16)}...
                </p>
              </div>
              <span
                className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${
                  order.status === "delivered"
                    ? "bg-green-50 text-green-700"
                    : order.status === "cancelled"
                      ? "bg-red-50 text-red-700"
                      : "bg-blue-50 text-blue-700"
                }`}
              >
                {order.status}
              </span>
            </div>
            <p className="text-[10px] text-muted-foreground mt-2">
              {new Date(order.createdAt).toLocaleDateString("en-IN", {
                day: "numeric",
                month: "long",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </p>
          </div>

          {/* Items */}
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-2">
              Items
            </p>
            <div className="space-y-2">
              {order.items.map((item, i) => (
                <div
                  key={i}
                  className="flex gap-3 rounded-lg border border-border p-3"
                >
                  <div className="h-16 w-16 shrink-0 overflow-hidden rounded-md bg-muted">
                    <img
                      src={item.image}
                      alt={item.name}
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">{item.name}</p>
                    {item.size && (
                      <p className="text-[10px] text-muted-foreground">
                        Size: {item.size}
                      </p>
                    )}
                    <div className="flex items-center justify-between mt-1">
                      <p className="text-xs text-muted-foreground">
                        Qty: {item.quantity}
                      </p>
                      <p className="text-sm font-semibold">
                        ₹{item.price * item.quantity}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Delivery Address */}
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-2">
              Delivery Address
            </p>
            <div className="rounded-lg border border-border p-3">
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                {order.addressSnapshot.label}
              </p>
              <p className="text-sm font-medium mt-1">
                {order.addressSnapshot.fullName}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {order.addressSnapshot.houseNumber},{" "}
                {order.addressSnapshot.area}, {order.addressSnapshot.city} -{" "}
                {order.addressSnapshot.pinCode}
              </p>
              {order.addressSnapshot.landmark && (
                <p className="text-xs text-muted-foreground">
                  Landmark: {order.addressSnapshot.landmark}
                </p>
              )}
            </div>
          </div>

          {/* Payment */}
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-2">
              Payment
            </p>
            <div className="rounded-lg border border-border p-3">
              <div className="flex items-center justify-between">
                <span className="text-sm">Method</span>
                <span className="text-sm font-medium capitalize">
                  {order.paymentMethod === "cash" ? "Cash on Delivery" : "Online"}
                </span>
              </div>
              <div className="flex items-center justify-between mt-1">
                <span className="text-sm">Status</span>
                <span
                  className={`text-xs font-medium ${
                    order.paymentStatus === "paid"
                      ? "text-green-600"
                      : order.paymentStatus === "failed"
                        ? "text-red-600"
                        : "text-amber-600"
                  }`}
                >
                  {order.paymentStatus}
                </span>
              </div>
              {order.discountApplied && (
                <div className="flex items-center justify-between mt-1">
                  <span className="text-sm text-green-600">Discount</span>
                  <span className="text-sm text-green-600">
                    -₹{order.discountApplied}
                  </span>
                </div>
              )}
              <div className="border-t border-border mt-2 pt-2 flex items-center justify-between">
                <span className="text-sm font-semibold">Total</span>
                <span className="text-base font-bold">₹{order.totalAmount}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="pb-24">
      <div className="sticky top-0 z-10 bg-white/95 backdrop-blur-sm border-b border-border">
        <div className="px-4 py-3">
          <h1 className="text-base font-semibold">Orders</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Your order history
          </p>
        </div>
      </div>

      <div className="px-4 pt-4">
        {orders === undefined ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-24 animate-pulse rounded-lg bg-muted" />
            ))}
          </div>
        ) : orders.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Package className="h-12 w-12 text-muted-foreground/30 mb-4" />
            <h2 className="text-base font-medium text-foreground">
              No orders yet
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Your order history will appear here
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {orders.map((order) => (
              <button
                key={order._id}
                onClick={() => setSelectedOrder(order._id)}
                className="w-full text-left rounded-lg border border-border p-3 transition-all hover:border-foreground/30"
              >
                <div className="flex items-start gap-3">
                  <div className="h-14 w-14 shrink-0 overflow-hidden rounded-md bg-muted">
                    {order.items[0] && (
                      <img
                        src={order.items[0].image}
                        alt={order.items[0].name}
                        className="h-full w-full object-cover"
                      />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium line-clamp-1">
                        {order.items.map((i) => i.name).join(", ")}
                      </p>
                      <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {new Date(order.createdAt).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </p>
                    <div className="flex items-center justify-between mt-1">
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${
                          order.status === "delivered"
                            ? "bg-green-50 text-green-700"
                            : order.status === "cancelled"
                              ? "bg-red-50 text-red-700"
                              : "bg-blue-50 text-blue-700"
                        }`}
                      >
                        {order.status}
                      </span>
                      <span className="text-sm font-semibold">
                        ₹{order.totalAmount}
                      </span>
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
