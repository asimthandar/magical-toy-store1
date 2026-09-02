import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import {
  ShoppingBag,
  Target,
  Smartphone,
  Gift,
  TrendingUp,
  Loader2,
} from "lucide-react";
import { isAuthenticated, getAuth } from "@/lib/auth";

export default function DashboardHome() {
  const navigate = useNavigate();
  const [auth, setAuth] = useState(getAuth());

  useEffect(() => {
    setAuth(getAuth());
  }, []);

  const quickActions = [
    {
      label: "Add Account",
      desc: "Link & earn bonus",
      icon: Smartphone,
      color: "blue",
      path: "/dashboard/add-account",
    },
    {
      label: "Offer Hunt",
      desc: "Find max discount",
      icon: Target,
      color: "purple",
      path: "/dashboard/offer-hunt",
    },
    {
      label: "Open Shop",
      desc: "Browse & order",
      icon: ShoppingBag,
      color: "emerald",
      path: "/dashboard/search",
    },
    {
      label: "Refer & Earn",
      desc: "Share your link",
      icon: Gift,
      color: "amber",
      path: "/dashboard/refer",
    },
  ];

  const colorMap: Record<string, { bg: string; text: string; glow: string }> = {
    blue: {
      bg: "bg-blue-500/10",
      text: "text-blue-400",
      glow: "shadow-blue-500/5",
    },
    purple: {
      bg: "bg-purple-500/10",
      text: "text-purple-400",
      glow: "shadow-purple-500/5",
    },
    emerald: {
      bg: "bg-emerald-500/10",
      text: "text-emerald-400",
      glow: "shadow-emerald-500/5",
    },
    amber: {
      bg: "bg-amber-500/10",
      text: "text-amber-400",
      glow: "shadow-amber-500/5",
    },
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-10 glass border-b border-border/50">
        <div className="px-4 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
              <span className="text-sm font-bold text-white">m</span>
            </div>
            <div>
              <p className="text-sm font-medium">
                {auth?.phone_number
                  ? `+91 ${auth.phone_number}`
                  : "Guest"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate("/dashboard/account")}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-500/10 text-emerald-400 text-sm font-medium hover:bg-emerald-500/15 transition-colors"
            >
              <span className="text-xs">💰</span>
              ₹0
            </button>
          </div>
        </div>
      </div>

      <div className="px-4 pt-5 space-y-5">
        {/* Welcome Banner */}
        <div className="animate-fade-in relative rounded-2xl overflow-hidden bg-gradient-to-br from-blue-500/10 via-purple-500/5 to-transparent border border-blue-500/10 p-5">
          <div className="relative z-10">
            <p className="text-xs text-blue-400/80 font-medium uppercase tracking-wider mb-1">
              Welcome back
            </p>
            <h2 className="text-lg font-bold">Explorer</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Find the best deals and discounts
            </p>
          </div>
          <div className="absolute top-3 right-3 w-16 h-16 rounded-full bg-blue-500/10 blur-xl" />
        </div>

        {/* Quick Actions Grid */}
        <div className="stagger-children grid grid-cols-2 gap-3">
          {quickActions.map((action) => {
            const colors = colorMap[action.color];
            const Icon = action.icon;
            return (
              <button
                key={action.path}
                onClick={() => navigate(action.path)}
                className={`relative group bg-card rounded-2xl p-4 border border-border/50 text-left hover:border-border transition-all duration-200 hover:shadow-lg ${colors.glow}`}
              >
                <div
                  className={`w-10 h-10 rounded-xl ${colors.bg} flex items-center justify-center mb-3 group-hover:scale-105 transition-transform`}
                >
                  <Icon className={`h-5 w-5 ${colors.text}`} />
                </div>
                <p className="text-sm font-semibold">{action.label}</p>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  {action.desc}
                </p>
              </button>
            );
          })}
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-2 gap-3 stagger-children">
          <div className="bg-card rounded-2xl p-4 border border-border/50">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                <TrendingUp className="h-4 w-4 text-emerald-400" />
              </div>
              <p className="text-[11px] text-muted-foreground">
                Wallet Balance
              </p>
            </div>
            <p className="text-xl font-bold">₹0</p>
          </div>
          <div className="bg-card rounded-2xl p-4 border border-border/50">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
                <Smartphone className="h-4 w-4 text-blue-400" />
              </div>
              <p className="text-[11px] text-muted-foreground">Accounts</p>
            </div>
            <p className="text-xl font-bold">0</p>
          </div>
        </div>
      </div>
    </div>
  );
}
