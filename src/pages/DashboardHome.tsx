import { useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useAuth } from "@/hooks/use-auth";
import { useNavigate } from "react-router";
import { Button } from "@/components/ui/button";
import {
  Wallet,
  Plus,
  ShoppingBag,
  Target,
  CreditCard,
  ChevronRight,
  Zap,
} from "lucide-react";

export default function DashboardHome() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const ensureWallet = useMutation(api.wallet.ensure);
  const wallet = useQuery(api.wallet.get);
  const linkedAccounts = useQuery(api.linkedAccounts.list);
  const offerHunts = useQuery(api.offerHunts.list);

  useEffect(() => {
    ensureWallet();
  }, [ensureWallet]);

  const activeAccount = linkedAccounts?.find((a) => a.status === "verified");
  const recentHunt = offerHunts?.[0];

  return (
    <div className="pb-24 px-4 pt-4 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-muted-foreground">
            Welcome back
          </p>
          <h1 className="text-lg font-semibold tracking-tight">
            {user?.name || "Explorer"}
          </h1>
        </div>
        <div className="h-8 w-8 rounded-full bg-foreground/10 flex items-center justify-center">
          <span className="text-xs font-semibold">
            {user?.name?.[0] || user?.email?.[0] || "?"}
          </span>
        </div>
      </div>

      {/* Wallet Card */}
      <div className="rounded-xl bg-foreground text-white p-5">
        <div className="flex items-center gap-2 mb-3">
          <Wallet className="h-4 w-4 opacity-70" />
          <span className="text-xs font-medium opacity-70 uppercase tracking-wider">
            Wallet Balance
          </span>
        </div>
        <p className="text-3xl font-light">
          ₹{wallet?.balance ?? 0}
        </p>
        <div className="flex gap-4 mt-3">
          <div>
            <p className="text-[10px] opacity-50">Earned</p>
            <p className="text-xs font-medium">₹{wallet?.totalEarned ?? 0}</p>
          </div>
          <div>
            <p className="text-[10px] opacity-50">Spent</p>
            <p className="text-xs font-medium">₹{wallet?.totalSpent ?? 0}</p>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div>
        <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground mb-2">
          Quick Actions
        </p>
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => navigate("/dashboard/add-account")}
            className="rounded-lg border border-border p-3 text-left hover:border-foreground/30 transition-all"
          >
            <Plus className="h-4 w-4 text-muted-foreground mb-1.5" />
            <p className="text-xs font-medium">Add Account</p>
            <p className="text-[10px] text-muted-foreground mt-0.5">
              Link & earn bonus
            </p>
          </button>
          <button
            onClick={() => navigate("/dashboard/offer-hunt")}
            className="rounded-lg border border-border p-3 text-left hover:border-foreground/30 transition-all"
          >
            <Target className="h-4 w-4 text-muted-foreground mb-1.5" />
            <p className="text-xs font-medium">Offer Hunt</p>
            <p className="text-[10px] text-muted-foreground mt-0.5">
              Find max discount
            </p>
          </button>
          <button
            onClick={() => navigate("/dashboard/search")}
            className="rounded-lg border border-border p-3 text-left hover:border-foreground/30 transition-all"
          >
            <ShoppingBag className="h-4 w-4 text-muted-foreground mb-1.5" />
            <p className="text-xs font-medium">Open Shop</p>
            <p className="text-[10px] text-muted-foreground mt-0.5">
              Browse & order
            </p>
          </button>
          <button
            onClick={() => navigate("/dashboard/refer")}
            className="rounded-lg border border-border p-3 text-left hover:border-foreground/30 transition-all"
          >
            <Zap className="h-4 w-4 text-muted-foreground mb-1.5" />
            <p className="text-xs font-medium">Refer & Earn</p>
            <p className="text-[10px] text-muted-foreground mt-0.5">
              Share your link
            </p>
          </button>
        </div>
      </div>

      {/* Active Account Status */}
      <div>
        <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground mb-2">
          Linked Accounts
        </p>
        {linkedAccounts === undefined ? (
          <div className="h-16 animate-pulse rounded-lg bg-muted" />
        ) : !linkedAccounts.length ? (
          <div className="rounded-lg border border-dashed border-border p-4 text-center">
            <p className="text-xs text-muted-foreground">
              No accounts linked yet
            </p>
            <Button
              onClick={() => navigate("/dashboard/add-account")}
              variant="ghost"
              size="sm"
              className="mt-1 text-xs"
            >
              Add your first account
            </Button>
          </div>
        ) : (
          <div className="space-y-1">
            {linkedAccounts.slice(0, 3).map((acc) => (
              <div
                key={acc._id}
                className="flex items-center justify-between rounded-lg border border-border p-3"
              >
                <div className="flex items-center gap-2">
                  <div
                    className={`h-2 w-2 rounded-full ${
                      acc.status === "verified"
                        ? "bg-green-500"
                        : acc.status === "pending"
                          ? "bg-amber-500"
                          : "bg-red-500"
                    }`}
                  />
                  <div>
                    <p className="text-xs font-medium capitalize">
                      {acc.platform}
                    </p>
                    <p className="text-[10px] text-muted-foreground">
                      •••{acc.phone.slice(-4)}
                    </p>
                  </div>
                </div>
                <span
                  className={`text-[10px] font-medium capitalize ${
                    acc.status === "verified"
                      ? "text-green-600"
                      : acc.status === "pending"
                        ? "text-amber-600"
                        : "text-red-600"
                  }`}
                >
                  {acc.status}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Recent Hunt */}
      {recentHunt && (
        <div>
          <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground mb-2">
            Latest Offer Hunt
          </p>
          <button
            onClick={() => navigate("/dashboard/offer-hunt")}
            className="w-full rounded-lg border border-border p-3 text-left hover:border-foreground/30 transition-all"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium">
                  Target: ₹{recentHunt.targetDiscount}
                </p>
                <p className="text-[10px] text-muted-foreground mt-0.5">
                  Best: ₹{recentHunt.bestDiscount} · {recentHunt.attempts} attempts
                </p>
              </div>
              <span
                className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${
                  recentHunt.status === "success"
                    ? "bg-green-50 text-green-700"
                    : recentHunt.status === "fallback"
                      ? "bg-amber-50 text-amber-700"
                      : recentHunt.status === "hunting"
                        ? "bg-blue-50 text-blue-700"
                        : "bg-red-50 text-red-700"
                }`}
              >
                {recentHunt.status}
              </span>
            </div>
            <ChevronRight className="h-3 w-3 text-muted-foreground mt-2" />
          </button>
        </div>
      )}

      {/* Service Fee Notice */}
      <div className="rounded-lg bg-muted/50 p-3">
        <div className="flex items-start gap-2">
          <CreditCard className="h-3.5 w-3.5 text-muted-foreground mt-0.5 shrink-0" />
          <div>
            <p className="text-[10px] font-medium text-muted-foreground">
              Service Fee
            </p>
            <p className="text-[10px] text-muted-foreground/70 mt-0.5">
              A small fee is deducted from your wallet for order processing and
              offer hunting. Check your transaction history for details.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
