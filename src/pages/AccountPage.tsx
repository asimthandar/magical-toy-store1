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
} from "lucide-react";
import { toast } from "sonner";

function formatTimeLeft(expiresAt: number) {
  const diff = expiresAt - Date.now();
  if (diff <= 0) return "Expired";
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  return `${hours}h ${minutes}m`;
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

  const [timeLeft, setTimeLeft] = useState("");

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

  const handleExport = useCallback(() => {
    if (!user) return;
    const data = {
      userId: user._id,
      name: user.name,
      email: user.email,
      sessionId: session?._id,
      createdAt: session?.createdAt,
      expiresAt: session?.expiresAt,
      wallet: wallet
        ? { balance: wallet.balance, totalEarned: wallet.totalEarned }
        : null,
      linkedAccounts:
        linkedAccounts?.map((a) => ({
          platform: a.platform,
          phone: a.phone,
          status: a.status,
        })) || [],
      exportedAt: Date.now(),
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `session-${user._id}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Session exported! ⚠️ Keep this file secure.");
  }, [user, session, wallet, linkedAccounts]);

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  return (
    <div className="pb-24">
      <div className="sticky top-0 z-10 bg-white/95 backdrop-blur-sm border-b border-border">
        <div className="px-4 py-3">
          <h1 className="text-base font-semibold">Account</h1>
        </div>
      </div>

      <div className="px-4 pt-4 space-y-4">
        {/* Profile */}
        <div className="rounded-lg bg-muted/50 p-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-foreground/10 flex items-center justify-center">
              <span className="text-sm font-semibold text-foreground">
                {user?.name?.[0] || user?.email?.[0] || "?"}
              </span>
            </div>
            <div>
              <p className="text-sm font-medium">
                {user?.name || "Guest User"}
              </p>
              <p className="text-xs text-muted-foreground">
                {user?.email || "No email"}
              </p>
            </div>
          </div>
        </div>

        {/* Wallet Quick View */}
        <button
          onClick={() => navigate("/dashboard/home")}
          className="w-full rounded-lg bg-foreground text-white p-4 text-left"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Wallet className="h-4 w-4 opacity-70" />
              <span className="text-xs font-medium opacity-70">Balance</span>
            </div>
            <ChevronRight className="h-4 w-4 opacity-50" />
          </div>
          <p className="text-2xl font-light mt-1">₹{wallet?.balance ?? 0}</p>
        </button>

        {/* Session Active */}
        <div className="rounded-lg border border-border p-4">
          <div className="flex items-center gap-2 mb-3">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Session Active
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-md bg-muted/50 p-2">
              <p className="text-[10px] text-muted-foreground">Login Time</p>
              <p className="text-xs font-medium mt-0.5">
                {session ? formatDateTime(session.createdAt) : "—"}
              </p>
            </div>
            <div className="rounded-md bg-muted/50 p-2">
              <p className="text-[10px] text-muted-foreground">Time Left</p>
              <p className="text-xs font-medium mt-0.5">{timeLeft || "—"}</p>
            </div>
          </div>

          <div className="flex gap-2 mt-3">
            <Button
              onClick={handleRefresh}
              variant="outline"
              size="sm"
              className="flex-1"
            >
              <RefreshCw className="mr-1 h-3 w-3" />
              Refresh
            </Button>
            <Button
              onClick={handleExport}
              variant="outline"
              size="sm"
              className="flex-1"
            >
              <Download className="mr-1 h-3 w-3" />
              Export JSON
            </Button>
          </div>

          {/* Security Warning */}
          <div className="mt-3 rounded-md bg-amber-50 p-2">
            <div className="flex items-start gap-1.5">
              <Shield className="h-3 w-3 text-amber-600 mt-0.5 shrink-0" />
              <p className="text-[10px] text-amber-700">
                The exported JSON contains sensitive auth tokens. Never share it
                publicly. Store it in an encrypted vault.
              </p>
            </div>
          </div>
        </div>

        {/* Quick Links */}
        <div className="rounded-lg border border-border divide-y divide-border">
          <button
            onClick={() => navigate("/dashboard/home")}
            className="flex w-full items-center justify-between px-4 py-3 text-sm hover:bg-muted/50 transition-colors"
          >
            <div className="flex items-center gap-2">
              <Wallet className="h-4 w-4 text-muted-foreground" />
              <span>Dashboard</span>
            </div>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </button>
          <button
            onClick={() => navigate("/dashboard/add-account")}
            className="flex w-full items-center justify-between px-4 py-3 text-sm hover:bg-muted/50 transition-colors"
          >
            <div className="flex items-center gap-2">
              <Smartphone className="h-4 w-4 text-muted-foreground" />
              <span>Add Account</span>
            </div>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </button>
          <button
            onClick={() => navigate("/dashboard/offer-hunt")}
            className="flex w-full items-center justify-between px-4 py-3 text-sm hover:bg-muted/50 transition-colors"
          >
            <div className="flex items-center gap-2">
              <Target className="h-4 w-4 text-muted-foreground" />
              <span>Offer Hunt</span>
            </div>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </button>
          <button
            onClick={() => navigate("/dashboard/addresses")}
            className="flex w-full items-center justify-between px-4 py-3 text-sm hover:bg-muted/50 transition-colors"
          >
            <div className="flex items-center gap-2">
              <CreditCard className="h-4 w-4 text-muted-foreground" />
              <span>Address Book</span>
            </div>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </button>
          <button
            onClick={() => navigate("/dashboard/orders")}
            className="flex w-full items-center justify-between px-4 py-3 text-sm hover:bg-muted/50 transition-colors"
          >
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span>Order History</span>
            </div>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </button>
        </div>

        {/* Sign Out */}
        <Button
          onClick={handleSignOut}
          variant="outline"
          className="w-full text-red-600 hover:text-red-700 hover:bg-red-50"
        >
          <LogOut className="mr-2 h-4 w-4" />
          Sign Out
        </Button>
      </div>
    </div>
  );
}
