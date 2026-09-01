import { useState, useEffect, useCallback } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useAuth } from "@/hooks/use-auth";
import { useNavigate } from "react-router";
import { Button } from "@/components/ui/button";
import {
  Clock,
  RefreshCw,
  Download,
  Target,
  CreditCard,
  LogOut,
  ChevronRight,
  Wallet,
  Smartphone,
  Shield,
  AlertTriangle,
} from "lucide-react";
import { toast } from "sonner";

function formatTimeLeft(expiresAt: number) {
  const diff = expiresAt - Date.now();
  if (diff <= 0) return "Expired";
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  return `${hours}h ${minutes}m left`;
}

function formatDateTime(ts: number) {
  return new Date(ts).toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function AccountPage() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const session = useQuery(api.sessions.current);
  const ensureSession = useMutation(api.sessions.ensure);
  const refreshSession = useMutation(api.sessions.refresh);
  const wallet = useQuery(api.wallet.get);
  const linkedAccounts = useQuery(api.linkedAccounts.list);
  const canExport = useQuery(api.sessions.canExport);
  const exportData = useQuery(api.sessions.getExportData);
  const logExport = useMutation(api.sessions.logExport);

  const [timeLeft, setTimeLeft] = useState("");
  const [isExporting, setIsExporting] = useState(false);

  useEffect(() => {
    ensureSession();
  }, [ensureSession]);

  useEffect(() => {
    if (!session) return;
    const interval = setInterval(() => {
      setTimeLeft(formatTimeLeft(session.expiresAt));
    }, 1000);
    return () => clearInterval(interval);
  }, [session]);

  const handleRefresh = useCallback(async () => {
    try {
      await refreshSession();
      toast.success("Session refreshed for 2 more days!");
    } catch {
      toast.error("Failed to refresh session");
    }
  }, [refreshSession]);

  const handleExport = useCallback(async () => {
    if (!user || !exportData) return;

    if (canExport && !canExport.canExport) {
      toast.error(canExport.reason || "Export limit reached. Try again later.");
      return;
    }

    setIsExporting(true);
    try {
      const blob = new Blob([JSON.stringify(exportData, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `session-${user._id}.json`;
      a.click();
      URL.revokeObjectURL(url);

      await logExport();
      toast.success("Session exported! ⚠️ Keep this file secure.");
    } catch (err) {
      toast.error("Failed to export session");
    }
    setIsExporting(false);
  }, [user, exportData, canExport, logExport]);

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  const activeAccount = linkedAccounts?.find((a) => a.status === "verified");

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-[#1a1a1a] border-b border-white/10">
        <div className="px-4 py-3">
          <h1 className="text-lg font-bold">Account</h1>
        </div>
      </div>

      <div className="px-4 pt-4 space-y-4">
        {/* User Card */}
        <div className="bg-blue-500 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-full bg-white/20 flex items-center justify-center">
              <span className="text-lg font-bold text-white">
                {activeAccount?.phone?.slice(-2) || user?.name?.[0] || "?"}
              </span>
            </div>
            <div className="flex-1">
              <p className="text-white font-medium">
                {activeAccount?.phone
                  ? `+91 ${activeAccount.phone}`
                  : user?.email || "Guest"}
              </p>
              <p className="text-white/70 text-xs">
                User ID: {user?._id?.slice(-6) || "..."}
              </p>
            </div>
          </div>
          <div className="flex gap-2 mt-3">
            <span className="text-xs bg-white/20 text-white px-2 py-1 rounded">
              OTP login
            </span>
            <span className="text-xs bg-green-500/30 text-white px-2 py-1 rounded">
              ✅ Order placed
            </span>
          </div>
        </div>

        {/* Session Active */}
        <div className="bg-green-500/10 rounded-xl p-4 border border-green-500/30">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-lg">🔒</span>
              <div>
                <p className="text-sm font-semibold text-green-400">
                  Session active
                </p>
                <p className="text-xs text-green-400/70">
                  Expires: {session ? formatDateTime(session.expiresAt) : "—"}
                </p>
              </div>
            </div>
            <span className="text-sm font-bold text-green-400">
              {timeLeft || "—"}
            </span>
          </div>
        </div>

        {/* 1st Order Discount */}
        <div className="bg-gradient-to-r from-amber-500/20 to-orange-500/20 rounded-xl p-4 border border-amber-500/30">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-lg">🎉</span>
            <p className="text-sm font-semibold text-amber-400">
              Your 1st order discount
            </p>
          </div>
          <p className="text-2xl font-bold text-white">
            Upto ₹120 off
          </p>
          <p className="text-xs text-gray-400 mt-1">
            on 1st order · valid 3 days · bucket 120
          </p>
          <Button
            variant="outline"
            size="sm"
            className="mt-3 border-amber-500/30 text-amber-400 hover:bg-amber-500/10"
          >
            <RefreshCw className="mr-1 h-3 w-3" />
            Refresh offer
          </Button>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-[#2a2a2a] rounded-xl p-4 border border-white/10">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-lg">💰</span>
              <p className="text-xs text-gray-400">Wallet balance</p>
            </div>
            <p className="text-xl font-bold text-white">
              ₹{wallet?.balance ?? 0}
            </p>
          </div>
          <div className="bg-[#2a2a2a] rounded-xl p-4 border border-white/10">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-lg">🔗</span>
              <p className="text-xs text-gray-400">Linked accounts</p>
            </div>
            <p className="text-xl font-bold text-white">
              {linkedAccounts?.length ?? 0}
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="space-y-2">
          <button
            onClick={handleRefresh}
            className="w-full flex items-center gap-3 p-4 bg-[#2a2a2a] rounded-xl border border-white/10 hover:bg-[#3a3a3a] transition-colors"
          >
            <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
              <RefreshCw className="h-5 w-5 text-blue-400" />
            </div>
            <div className="flex-1 text-left">
              <p className="text-sm font-medium text-white">Refresh Session</p>
              <p className="text-xs text-gray-400">
                Get a new token for 2 more days
              </p>
            </div>
            <ChevronRight className="h-4 w-4 text-gray-500" />
          </button>

          <button
            onClick={handleExport}
            disabled={isExporting || (canExport && !canExport.canExport)}
            className="w-full flex items-center gap-3 p-4 bg-[#2a2a2a] rounded-xl border border-white/10 hover:bg-[#3a3a3a] transition-colors disabled:opacity-50"
          >
            <div className="w-10 h-10 rounded-lg bg-red-500/20 flex items-center justify-center">
              <Download className="h-5 w-5 text-red-400" />
            </div>
            <div className="flex-1 text-left">
              <p className="text-sm font-medium text-white">Export Session</p>
              <p className="text-xs text-gray-400">
                {isExporting
                  ? "Exporting..."
                  : canExport && !canExport.canExport
                    ? canExport.reason
                    : "Send this account's session file to your chat"}
              </p>
            </div>
            <ChevronRight className="h-4 w-4 text-gray-500" />
          </button>
        </div>

        {/* Footer Note */}
        <p className="text-xs text-gray-500 text-center py-2">
          To add or remove accounts, use the bot chat.
        </p>

        {/* Sign Out */}
        <Button
          onClick={handleSignOut}
          variant="outline"
          className="w-full border-red-500/30 text-red-400 hover:bg-red-500/10"
        >
          <LogOut className="mr-2 h-4 w-4" />
          Sign Out
        </Button>
      </div>
    </div>
  );
}
