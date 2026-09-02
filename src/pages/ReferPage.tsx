import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Copy,
  Gift,
  Wallet,
  RefreshCw,
} from "lucide-react";
import { toast } from "sonner";
import { isAuthenticated } from "@/lib/auth";

export default function ReferPage() {
  const [referralCode] = useState(() => {
    // Generate a random referral code
    return Math.random().toString(36).substring(2, 10).toUpperCase();
  });

  const handleCopyLink = () => {
    const link = `https://freebuff.com/ref/${referralCode}`;
    navigator.clipboard.writeText(link);
    toast.success("Invite link copied!");
  };

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
            <p className="text-2xl font-bold text-green-400">₹0</p>
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
            <p className="text-2xl font-bold text-green-400">0</p>
            <p className="text-xs text-green-400">✅ Done</p>
          </div>
          <div className="bg-amber-500/10 rounded-xl p-3 text-center border border-amber-500/20">
            <p className="text-2xl font-bold text-amber-400">0</p>
            <p className="text-xs text-amber-400">⏳ Pending</p>
          </div>
          <div className="bg-red-500/10 rounded-xl p-3 text-center border border-red-500/20">
            <p className="text-2xl font-bold text-red-400">0</p>
            <p className="text-xs text-red-400">❌ Cancelled</p>
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
              https://freebuff.com/ref/{referralCode}
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
