import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useNavigate } from "react-router";
import { Button } from "@/components/ui/button";
import {
  Package,
  ChevronRight,
  Clock,
  Truck,
  CheckCircle,
  XCircle,
  ArrowLeft,
} from "lucide-react";
import { cn } from "@/lib/utils";

type FilterType = "all" | "placed" | "processing" | "shipped" | "delivered" | "cancelled";

const FILTERS: { label: string; value: FilterType }[] = [
  { label: "All", value: "all" },
  { label: "Ordered", value: "placed" },
  { label: "Shipped", value: "shipped" },
  { label: "Delivered", value: "delivered" },
  { label: "Cancelled", value: "cancelled" },
];

const STATUS_CONFIG = {
  placed: { label: "Ordered", color: "text-blue-400 bg-blue-500/20", icon: Clock },
  processing: { label: "Processing", color: "text-amber-400 bg-amber-500/20", icon: Package },
  shipped: { label: "Shipped", color: "text-purple-400 bg-purple-500/20", icon: Truck },
  delivered: { label: "Delivered", color: "text-green-400 bg-green-500/20", icon: CheckCircle },
  cancelled: { label: "Cancelled", color: "text-red-400 bg-red-500/20", icon: XCircle },
};

export default function OrdersPage() {
  const navigate = useNavigate();
  const orders = useQuery(api.orders.list);
  const [activeFilter, setActiveFilter] = useState<FilterType>("all");

  const filteredOrders =
    orders?.filter(
      (order) => activeFilter === "all" || order.status === activeFilter,
    ) ?? [];

  function formatDate(ts: number) {
    return new Date(ts).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
    });
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-[#1a1a1a] border-b border-white/10">
        <div className="px-4 py-3">
          <h1 className="text-lg font-bold">My Orders</h1>
        </div>
      </div>

      <div className="px-4 pt-4 space-y-4">
        {/* Filter Tabs */}
        <div className="flex gap-2 overflow-x-auto pb-2">
          {FILTERS.map((filter) => (
            <button
              key={filter.value}
              onClick={() => setActiveFilter(filter.value)}
              className={cn(
                "px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors",
                activeFilter === filter.value
                  ? "bg-blue-500 text-white"
                  : "bg-[#2a2a2a] text-gray-400 hover:text-white",
              )}
            >
              {filter.label}
            </button>
          ))}
        </div>

        {/* Orders List */}
        {orders === undefined ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-40 animate-pulse rounded-xl bg-[#2a2a2a]" />
            ))}
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="text-center py-16">
            <Package className="h-16 w-16 text-gray-600 mx-auto mb-4" />
            <p className="text-lg font-semibold text-white">No orders found</p>
            <p className="text-sm text-gray-400 mt-1">
              {activeFilter === "all"
                ? "You haven't placed any orders yet"
                : `No ${activeFilter} orders`}
            </p>
            <Button
              onClick={() => navigate("/dashboard/search")}
              className="mt-6 bg-blue-500 hover:bg-blue-600 text-white"
            >
              Start Shopping
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredOrders.map((order) => {
              const statusConfig = STATUS_CONFIG[order.status];
              const StatusIcon = statusConfig.icon;

              return (
                <div
                  key={order._id}
                  className="bg-[#2a2a2a] rounded-xl p-4 border border-white/10"
                >
                  {/* Order Header */}
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <p className="text-xs text-gray-400">
                        #{order._id.slice(-8).toUpperCase()}
                      </p>
                      <p className="text-xs text-gray-500">
                        {formatDate(order.createdAt)}
                      </p>
                    </div>
                    <span
                      className={cn(
                        "px-2 py-1 rounded text-xs font-medium",
                        statusConfig.color,
                      )}
                    >
                      {statusConfig.label}
                    </span>
                  </div>

                  {/* Order Items */}
                  <div className="space-y-2">
                    {order.items.slice(0, 2).map((item, idx) => (
                      <div key={idx} className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-lg bg-[#1a1a1a] overflow-hidden shrink-0">
                          <img
                            src={item.image}
                            alt={item.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-white line-clamp-1">
                            {item.name}
                          </p>
                          <p className="text-xs text-gray-400">
                            Size: {item.size || "Free"} · Qty {item.quantity}
                          </p>
                        </div>
                      </div>
                    ))}
                    {order.items.length > 2 && (
                      <p className="text-xs text-gray-500">
                        +{order.items.length - 2} more items
                      </p>
                    )}
                  </div>

                  {/* Order Footer */}
                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-white/10">
                    <div>
                      <p className="text-xs text-gray-400">
                        Updated {formatDate(order.createdAt)}
                      </p>
                    </div>
                    <button
                      onClick={() => navigate(`/dashboard/orders`)}
                      className="text-xs text-blue-400 hover:text-blue-300"
                    >
                      View details ›
                    </button>
                  </div>

                  {/* Total */}
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-xs text-gray-400">
                      {order.paymentMethod === "cash" ? "💵 COD" : "💳 Online"}
                    </span>
                    <span className="text-sm font-bold text-white">
                      ₹{order.totalAmount}
                    </span>
                  </div>
                </div>
              );
            })}

            {/* End of Orders */}
            <p className="text-center text-xs text-gray-500 py-4">
              — No more orders —
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
