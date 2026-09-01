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
  Smartphone,
  Gift,
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
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-[#1a1a1a] border-b border-white/10">
        <div className="px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-lg bg-blue-500 flex items-center justify-center">
              <span className="text-sm font-bold text-white">m</span>
            </div>
            <div>
              <p className="text-sm text-white">
                {activeAccount?.phone
                  ? `+91 ${activeAccount.phone}`
                  : user?.email || "Guest"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate("/dashboard/account")}
              className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-green-500/20 text-green-400 text-sm font-medium"
            >
              💰 ₹{wallet?.balance ?? 0}
            </button>
            <button className="w-8 h-8 rounded-full bg-amber-500/20 flex items-center justify-center">
              🌟
            </button>
          </div>
        </div>
      </div>

      <div className="px-4 pt-4 space-y-4">
        {/* Quick Actions Grid */}
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => navigate("/dashboard/add-account")}
            className="bg-[#2a2a2a] rounded-xl p-4 border border-white/10 text-left hover:bg-[#3a3a3a] transition-colors"
          >
            <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center mb-2">
              <Smartphone className="h-5 w-5 text-blue-400" />
            </div>
            <p className="text-sm font-medium text-white">Add Account</p>
            <p className="text-xs text-gray-400 mt-0.5">Link & earn bonus</p>
          </button>

          <button
            onClick={() => navigate("/dashboard/offer-hunt")}
            className="bg-[#2a2a2a] rounded-xl p-4 border border-white/10 text-left hover:bg-[#3a3a3a] transition-colors"
          >
            <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center mb-2">
              <Target className="h-5 w-5 text-purple-400" />
            </div>
            <p className="text-sm font-medium text-white">Offer Hunt</p>
            <p className="text-xs text-gray-400 mt-0.5">Find max discount</p>
          </button>

          <button
            onClick={() => navigate("/dashboard/search")}
            className="bg-[#2a2a2a] rounded-xl p-4 border border-white/10 text-left hover:bg-[#3a3a3a] transition-colors"
          >
            <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center mb-2">
              <ShoppingBag className="h-5 w-5 text-green-400" />
            </div>
            <p className="text-sm font-medium text-white">Open Shop</p>
            <p className="text-xs text-gray-400 mt-0.5">Browse & order</p>
          </button>

          <button
            onClick={() => navigate("/dashboard/refer")}
            className="bg-[#2a2a2a] rounded-xl p-4 border border-white/10 text-left hover:bg-[#3a3a3a] transition-colors"
          >
            <div className="w-10 h-10 rounded-lg bg-amber-500/20 flex items-center justify-center mb-2">
              <Gift className="h-5 w-5 text-amber-400" />
            </div>
            <p className="text-sm font-medium text-white">Refer & Earn</p>
            <p className="text-xs text-gray-400 mt-0.5">Share your link</p>
          </button>
        </div>

        {/* Active Account Status */}
        {linkedAccounts && linkedAccounts.length > 0 && (
          <div className="bg-[#2a2a2a] rounded-xl p-4 border border-white/10">
            <p className="text-xs font-medium text-gray-400 mb-3">
              Linked Accounts
            </p>
            <div className="space-y-2">
              {linkedAccounts.slice(0, 3).map((acc) => (
                <div
                  key={acc._id}
                  className="flex items-center justify-between p-2 bg-[#1a1a1a] rounded-lg"
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
                      <p className="text-xs font-medium text-white capitalize">
                        {acc.platform}
                      </p>
                      <p className="text-[10px] text-gray-500">
                        •••{acc.phone.slice(-4)}
                      </p>
                    </div>
                  </div>
                  <span
                    className={`text-[10px] font-medium capitalize ${
                      acc.status === "verified"
                        ? "text-green-400"
                        : acc.status === "pending"
                          ? "text-amber-400"
                          : "text-red-400"
                    }`}
                  >
                    {acc.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recent Hunt */}
        {recentHunt && (
          <button
            onClick={() => navigate("/dashboard/offer-hunt")}
            className="w-full bg-[#2a2a2a] rounded-xl p-4 border border-white/10 text-left hover:bg-[#3a3a3a] transition-colors"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-400 mb-1">
                  Latest Offer Hunt
                </p>
                <p className="text-sm text-white">
                  Target: ₹{recentHunt.targetDiscount} · Best: ₹
                  {recentHunt.bestDiscount}
                </p>
              </div>
              <span
                className={`px-2 py-1 rounded text-xs font-medium ${
                  recentHunt.status === "success"
                    ? "bg-green-500/20 text-green-400"
                    : recentHunt.status === "fallback"
                      ? "bg-amber-500/20 text-amber-400"
                      : "bg-blue-500/20 text-blue-400"
                }`}
              >
                {recentHunt.status}
              </span>
            </div>
          </button>
        )}

        {/* Service Fee Notice */}
        <div className="bg-[#2a2a2a] rounded-xl p-4 border border-white/10">
          <div className="flex items-start gap-3">
            <CreditCard className="h-5 w-5 text-gray-500 shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-medium text-gray-400">Service Fee</p>
              <p className="text-[10px] text-gray-500 mt-0.5">
                A small fee is deducted from your wallet for order processing and
                offer hunting.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
