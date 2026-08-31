import { useLocation, useNavigate } from "react-router";
import { cn } from "@/lib/utils";
import {
  Search,
  ShoppingCart,
  Package,
  User,
} from "lucide-react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";

const navItems = [
  { path: "/dashboard/search", icon: Search, label: "Search" },
  { path: "/dashboard/cart", icon: ShoppingCart, label: "Cart" },
  { path: "/dashboard/orders", icon: Package, label: "Orders" },
  { path: "/dashboard/account", icon: User, label: "Account" },
];

export function BottomNav() {
  const location = useLocation();
  const navigate = useNavigate();
  const cartItems = useQuery(api.cart.list);

  const cartCount =
    cartItems?.reduce((sum, item) => sum + item.quantity, 0) ?? 0;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-white/95 backdrop-blur-sm">
      <div className="mx-auto flex max-w-lg items-center justify-around py-2">
        {navItems.map((item) => {
          const isActive = location.pathname.startsWith(item.path);
          const Icon = item.icon;
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={cn(
                "flex flex-col items-center gap-0.5 px-4 py-1 text-[10px] font-medium tracking-wide transition-colors",
                isActive
                  ? "text-foreground"
                  : "text-muted-foreground hover:text-foreground/70",
              )}
            >
              <div className="relative">
                <Icon
                  className={cn(
                    "h-5 w-5",
                    isActive ? "stroke-[2]" : "stroke-[1.5]",
                  )}
                />
                {item.label === "Cart" && cartCount > 0 && (
                  <span className="absolute -right-2 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-foreground text-[8px] font-bold text-white">
                    {cartCount > 9 ? "9+" : cartCount}
                  </span>
                )}
              </div>
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
