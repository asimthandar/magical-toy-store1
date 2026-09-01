import { useState, useEffect, useCallback } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useAuth } from "@/hooks/use-auth";
import { useNavigate } from "react-router";
import { Button } from "@/components/ui/button";
import {
  RefreshCw,
  Download,
  ChevronRight,
  LogIn,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";

function formatCountdown(expiresAt: number) {
  const diff = expiresAt - Date.now();
  if (diff <= 0) return { expired: true, hours: 0, minutes: 0, seconds: 0 };
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diff % (1000 * 60)) / 1000);
  return { expired: false, hours, minutes, seconds };
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

function CountdownTimer({ expiresAt }: { expiresAt: number }) {
  const [cd, setCd] = useState(() => formatCountdown(expiresAt));

  useEffect(() => {
    const id = setInterval(() => setCd(formatCountdown(expiresAt)), 1000);
    return () => clearInterval(id);
  }, [expiresAt]);

  if (cd.expired) {
    return (
      <span className="text-sm font-bold text-red-400 animate-pulse">
        Expired
      </span>
    );
  }

  return (
    <div className="flex items-center gap-1.5">
      <TimeUnit value={cd.hours} label="h" />
      <span className="text-green-400/50 text-xs">:</span>
      <TimeUnit value={cd.minutes} label="m" />
      <span className="text-green-400/50 text-xs">:</span>
      <TimeUnit value={cd.seconds} label="s" />
    </div>
  );
}

function TimeUnit({ value, label }: { value: number; label: string }) {
  return (
    <div className="flex flex-col items-center">
      <div className="bg-green-500/20 rounded-md px-2 py-0.5 min-w-[36px] text-center">
        <span className="text-sm font-bold text-green-400 tabular-nums">
          {String(value).padStart(2, "0")}
        </span>
      </div>
      <span className="text-[9px] text-green-400/60 mt-0.5">{label}</span>
    </div>
  );
}

export default function AccountPage() {
  const { isLoading, isAuthenticated, user, signOut } = useAuth();
  const navigate = useNavigate();
  const session = useQuery(api.sessions.current);
  const ensureSession = useMutation(api.sessions.ensure);
  const refreshSession = useMutation(api.sessions.refresh);
  const wallet = useQuery(api.wallet.get);
  const linkedAccounts = useQuery(api.linkedAccounts.list);
  const canExport = useQuery(api.sessions.canExport);
  const exportData = useQuery(api.sessions.getExportData);
  const logExport = useMutation(api.sessions.logExport);

  const [isExporting, setIsExporting] = useState(false);

  useEffect(() => {
    if (isAuthenticated) ensureSession();
  }, [ensureSession, isAuthenticated]);

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
      toast.success("Session exported! Keep this file secure.");
    } catch {
      toast.error("Failed to export session");
    }
    setIsExporting(false);
  }, [user, exportData, canExport, logExport]);

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // Not authenticated — show login prompt
  if (!isAuthenticated || !user) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6">
        <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mb-6">
          <LogIn className="h-8 w-8 text-muted-foreground" />
        </div>
        <h2 className="text-lg font-semibold">Log in to your account</h2>
        <p className="text-sm text-muted-foreground mt-1 text-center max-w-xs">
          Sign in to view your session, wallet, orders, and account settings.
        </p>
        <Button
          onClick={() => navigate("/")}
          className="mt-6 bg-foreground text-background"
        >
          Go to Home
        </Button>
      </div>
    );
  }

  const activeAccount = linkedAccounts?.find((a) => a.status === "verified");

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background border-b border-border">
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
                {activeAccount?.phone?.slice(-2) || user.name?.[0] || "?"}
              </span>
            </div>
            <div className="flex-1">
              <p className="text-white font-medium">
                {activeAccount?.phone
                  ? `+91 ${activeAccount.phone}`
                  : user.email || "Guest"}
              </p>
              <p className="text-white/70 text-xs">
                User ID: {user._id?.slice(-6) || "..."}
              </p>
            </div>
          </div>
          <div className="flex gap-2 mt-3">
            <span className="text-xs bg-white/20 text-white px-2 py-1 rounded">
              OTP login
            </span>
            <span className="text-xs bg-green-500/30 text-white px-2 py-1 rounded">
              Order placed
            </span>
          </div>
        </div>

        {/* Session Active */}
        <div className="bg-green-500/10 rounded-xl p-4 border border-green-500/30">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className="text-base">&#x1F512;</span>
              <div>
                <p className="text-sm font-semibold text-green-400">
                  Session active
                </p>
                <p className="text-[10px] text-green-400/70">
                  Expires:{" "}
                  {session ? formatDateTime(session.expiresAt) : "--"}
                </p>
              </div>
            </div>
          </div>
          {session && <CountdownTimer expiresAt={session.expiresAt} />}
        </div>

        {/* 1st Order Discount */}
        <div className="bg-gradient-to-br from-amber-500/20 via-orange-500/10 to-amber-500/5 rounded-xl p-4 border border-amber-500/20">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-base">&#x1F389;</span>
            <p className="text-xs font-semibold text-amber-400 uppercase tracking-wider">
              Your 1st order discount
            </p>
          </div>
          <p className="text-2xl font-bold text-white">Upto &#x20B9;120 off</p>
          <p className="text-[10px] text-gray-400 mt-1">
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
          <div className="bg-card rounded-xl p-4 border border-border">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-base">&#x1F4B0;</span>
              <p className="text-xs text-muted-foreground">Wallet balance</p>
            </div>
            <p className="text-xl font-bold text-foreground">
              &#x20B9;{wallet?.balance ?? 0}
            </p>
          </div>
          <div className="bg-card rounded-xl p-4 border border-border">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-base">&#x1F517;</span>
              <p className="text-xs text-muted-foreground">Linked accounts</p>
            </div>
            <p className="text-xl font-bold text-foreground">
              {linkedAccounts?.length ?? 0}
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="space-y-2">
          <button
            onClick={handleRefresh}
            className="w-full flex items-center gap-3 p-4 bg-card rounded-xl border border-border hover:bg-muted/50 transition-colors"
          >
            <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
              <RefreshCw className="h-5 w-5 text-blue-400" />
            </div>
            <div className="flex-1 text-left">
              <p className="text-sm font-medium">Refresh Session</p>
              <p className="text-xs text-muted-foreground">
                Get a new token for 2 more days
              </p>
            </div>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </button>

          <button
            onClick={handleExport}
            disabled={isExporting || (canExport && !canExport.canExport)}
            className="w-full flex items-center gap-3 p-4 bg-card rounded-xl border border-border hover:bg-muted/50 transition-colors disabled:opacity-50"
          >
            <div className="w-10 h-10 rounded-lg bg-orange-500/10 flex items-center justify-center">
              <Download className="h-5 w-5 text-orange-400" />
            </div>
            <div className="flex-1 text-left">
              <p className="text-sm font-medium">Export Session</p>
              <p className="text-xs text-muted-foreground">
                {isExporting
                  ? "Exporting..."
                  : canExport && !canExport.canExport
                    ? canExport.reason
                    : "Download session data as JSON"}
              </p>
            </div>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </button>
        </div>

        {/* Footer Note */}
        <p className="text-xs text-muted-foreground text-center py-2">
          To add or remove accounts, use the bot chat.
        </p>

        {/* Sign Out */}
        <Button
          onClick={handleSignOut}
          variant="outline"
          className="w-full border-red-500/30 text-red-400 hover:bg-red-500/10"
        >
          <LogIn className="mr-2 h-4 w-4" />
          Sign Out
        </Button>
      </div>
    </div>
  );
}
