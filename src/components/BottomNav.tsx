import { useLocation, useNavigate } from "react-router";
import { cn } from "@/lib/utils";
import {
  Search,
  ShoppingCart,
  Package,
  MapPin,
  Gift,
  User,
} from "lucide-react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";

const navItems = [
  { path: "/dashboard/search", icon: Search, label: "Search" },
  { path: "/dashboard/cart", icon: ShoppingCart, label: "Cart" },
  { path: "/dashboard/orders", icon: Package, label: "Orders" },
  { path: "/dashboard/addresses", icon: MapPin, label: "Address" },
  { path: "/dashboard/refer", icon: Gift, label: "Refer" },
  { path: "/dashboard/account", icon: User, label: "Account" },
];

export function BottomNav() {
  const location = useLocation();
  const navigate = useNavigate();
  const cartItems = useQuery(api.cart.list);

  const cartCount =
    cartItems?.reduce((sum, item) => sum + item.quantity, 0) ?? 0;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 glass border-t border-border/50">
      <div className="mx-auto flex max-w-lg items-center justify-around py-1.5 px-2">
        {navItems.map((item) => {
          const isActive = location.pathname.startsWith(item.path);
          const Icon = item.icon;
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={cn(
                "relative flex flex-col items-center gap-0.5 px-2.5 py-1.5 text-[10px] font-medium transition-all duration-200 rounded-xl",
                isActive
                  ? "text-foreground"
                  : "text-muted-foreground hover:text-foreground/70",
              )}
            >
              {isActive && (
                <div className="absolute inset-0 bg-muted/50 rounded-xl" />
              )}
              <div className="relative">
                <Icon
                  className={cn(
                    "h-5 w-5 relative z-10 transition-all",
                    isActive ? "stroke-[2.2]" : "stroke-[1.5]",
                  )}
                />
                {item.label === "Cart" && cartCount > 0 && (
                  <span className="absolute -right-2 -top-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-blue-500 text-[8px] font-bold text-white px-1 shadow-sm shadow-blue-500/30 z-20">
                    {cartCount > 9 ? "9+" : cartCount}
                  </span>
                )}
              </div>
              <span className="relative z-10">{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
