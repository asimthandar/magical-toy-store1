import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import {
  Copy,
  Gift,
  CheckCircle,
  Clock,
  XCircle,
  Wallet,
  RefreshCw,
} from "lucide-react";
import { toast } from "sonner";
import { useCallback, useEffect, useState } from "react";

export default function ReferPage() {
  const { user } = useAuth();
  const wallet = useQuery(api.wallet.get);
  const referrals = useQuery(api.referrals.list);
  const ensureReferral = useMutation(api.referrals.ensure);

  const [referralCode, setReferralCode] = useState("");

  useEffect(() => {
    if (user) {
      ensureReferral().then((code) => {
        if (code) setReferralCode(code as string);
      });
    }
  }, [user, ensureReferral]);

  const completedReferrals =
    referrals?.filter((r) => r.rewardClaimed).length ?? 0;
  const pendingReferrals =
    referrals?.filter((r) => !r.rewardClaimed).length ?? 0;

  const handleCopyLink = useCallback(() => {
    const link = `https://freebuff.com/ref/${referralCode}`;
    navigator.clipboard.writeText(link);
    toast.success("Invite link copied!");
  }, [referralCode]);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-[#1a1a1a] border-b border-white/10">
        <div className="px-4 py-3 flex items-center justify-between">
          <h1 className="text-lg font-bold">Refer & Earn</h1>
          <button className="p-2 text-gray-400 hover:text-white">
            <RefreshCw className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="px-4 pt-4 space-y-4">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-green-500/10 rounded-xl p-4 border border-green-500/20">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-medium text-green-400 bg-green-500/20 px-2 py-0.5 rounded">
                ✅ Credited
              </span>
              <Wallet className="h-4 w-4 text-green-400 ml-auto" />
            </div>
            <p className="text-2xl font-bold text-green-400">
              ₹{wallet?.totalEarned ?? 0}
            </p>
            <p className="text-xs text-green-400/70 mt-1">
              Total Cash Earned
            </p>
            <p className="text-[10px] text-green-400/50">
              Credited to your bank/wallet
            </p>
          </div>

          <div className="bg-amber-500/10 rounded-xl p-4 border border-amber-500/20">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-medium text-amber-400 bg-amber-500/20 px-2 py-0.5 rounded">
                🔓 Unlocking
              </span>
              <Gift className="h-4 w-4 text-amber-400 ml-auto" />
            </div>
            <p className="text-2xl font-bold text-amber-400">₹0</p>
            <p className="text-xs text-amber-400/70 mt-1">Pending Reward</p>
            <p className="text-[10px] text-amber-400/50">
              Unlocks when orders deliver
            </p>
          </div>
        </div>

        {/* Info Card */}
        <div className="bg-[#2a2a2a] rounded-xl p-4 border border-white/10">
          <p className="text-sm text-white">
            🎉 Earn up to ₹100 per friend
          </p>
          <p className="text-xs text-gray-400 mt-1">
            Reward is unlocked as soon as your friend's first order is delivered.
          </p>
        </div>

        {/* Referral Stats */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-green-500/10 rounded-xl p-3 text-center border border-green-500/20">
            <p className="text-2xl font-bold text-green-400">
              {completedReferrals}
            </p>
            <p className="text-xs text-green-400">✅ Done</p>
          </div>
          <div className="bg-amber-500/10 rounded-xl p-3 text-center border border-amber-500/20">
            <p className="text-2xl font-bold text-amber-400">
              {pendingReferrals}
            </p>
            <p className="text-xs text-amber-400">⏳ Pending</p>
          </div>
          <div className="bg-red-500/10 rounded-xl p-3 text-center border border-red-500/20">
            <p className="text-2xl font-bold text-red-400">0</p>
            <p className="text-xs text-red-400">❌ Cancelled</p>
          </div>
        </div>

        {/* Pending Steps */}
        <div className="bg-[#2a2a2a] rounded-xl p-4 border border-white/10">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-white">
              📌 Pending Steps Breakdown
            </h3>
            <span className="text-xs text-gray-400">0 in progress</span>
          </div>

          <div className="space-y-3">
            {[
              {
                step: "Step 1: App Installed",
                desc: "App installed, waiting for first order",
                icon: "📱",
                count: 0,
                color: "text-blue-400",
              },
              {
                step: "Step 2: Order In Transit",
                desc: "Order placed, waiting for delivery",
                icon: "🚚",
                count: 0,
                color: "text-amber-400",
              },
              {
                step: "Step 3: Cash Credit",
                desc: "Order delivered, cash crediting soon",
                icon: "💵",
                count: 0,
                color: "text-green-400",
              },
            ].map((item) => (
              <div
                key={item.step}
                className="flex items-center gap-3 p-3 bg-[#1a1a1a] rounded-lg"
              >
                <div className="w-10 h-10 rounded-lg bg-[#2a2a2a] flex items-center justify-center text-xl">
                  {item.icon}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-white">{item.step}</p>
                  <p className="text-xs text-gray-400">{item.desc}</p>
                </div>
                <span className={`text-sm font-bold ${item.color}`}>
                  {item.count}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Referred Contacts */}
        <div className="bg-[#2a2a2a] rounded-xl p-4 border border-white/10">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-white">
              👥 Referred Contacts
            </h3>
            <span className="text-xs text-gray-400">0 total</span>
          </div>

          <div className="flex gap-2 mb-3">
            {[
              { label: "Pending (0)", color: "text-amber-400" },
              { label: "Done (0)", color: "text-green-400" },
              { label: "Cancelled (0)", color: "text-red-400" },
              { label: "All (0)", color: "text-gray-400" },
            ].map((filter) => (
              <span
                key={filter.label}
                className={`text-xs ${filter.color}`}
              >
                {filter.label}
              </span>
            ))}
          </div>

          <div className="text-center py-6 text-gray-500 text-sm">
            No contacts found in this section.
          </div>
        </div>

        {/* Invite Link */}
        <div className="bg-[#2a2a2a] rounded-xl p-4 border border-white/10">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-lg">🔗</span>
            <h3 className="text-sm font-semibold text-white">
              Your Invite Link
            </h3>
          </div>

          <div className="bg-[#1a1a1a] rounded-lg p-3 mb-3">
            <p className="text-xs text-gray-400 break-all">
              https://freebuff.com/ref/{referralCode || "..."}
            </p>
          </div>

          <p className="text-xs text-gray-400 mb-4">
            Share this link with friends to earn up to ₹100 per completed
            order.
          </p>

          <Button
            onClick={handleCopyLink}
            className="w-full h-12 bg-blue-500 hover:bg-blue-600 text-white font-medium"
          >
            <Copy className="mr-2 h-4 w-4" />
            Copy invite link
          </Button>

          <p className="text-[10px] text-gray-500 text-center mt-3">
            Referrals complete when your invitee installs and their first order
            is delivered.
          </p>
        </div>
      </div>
    </div>
  );
}
