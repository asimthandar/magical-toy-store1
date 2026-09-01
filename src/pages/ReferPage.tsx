import { useState, useEffect } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Copy, Check, Gift, Share2, Users } from "lucide-react";
import { toast } from "sonner";

export default function ReferPage() {
  const [referral, setReferral] = useState<any>(null);
  const [copied, setCopied] = useState(false);

  const getReferral = useMutation(api.referrals.getOrCreate);
  const orders = useQuery(api.orders.list);

  useEffect(() => {
    getReferral().then(setReferral).catch(() => {});
  }, [getReferral]);

  const referralLink = referral
    ? `${window.location.origin}?ref=${referral.code}`
    : "";

  const handleCopy = () => {
    navigator.clipboard.writeText(referralLink);
    setCopied(true);
    toast.success("Link copied to clipboard!");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: "Join Store — Earn Rewards",
          text: "Use my referral link to sign up and earn rewards!",
          url: referralLink,
        });
      } catch {
        // User cancelled share
      }
    } else {
      handleCopy();
    }
  };

  return (
    <div className="pb-24 px-4 pt-4 space-y-6">
      {/* Hero */}
      <div className="text-center py-6">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-foreground/5">
          <Gift className="h-8 w-8 text-foreground" />
        </div>
        <h1 className="text-xl font-semibold tracking-tight">
          Refer & Earn
        </h1>
        <p className="text-sm text-muted-foreground mt-2 max-w-xs mx-auto">
          Share your secret link with friends. When they sign up, you both earn
          rewards!
        </p>
      </div>

      {/* Referral Link */}
      {referral && (
        <div className="rounded-lg border border-border p-4">
          <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground mb-2">
            Your Referral Code
          </p>
          <div className="flex items-center gap-2">
            <div className="flex-1 rounded-md bg-muted px-3 py-2.5 text-xs font-mono">
              {referral.code}
            </div>
            <Button
              onClick={handleCopy}
              variant="outline"
              size="sm"
              className="shrink-0"
            >
              {copied ? (
                <Check className="h-3.5 w-3.5" />
              ) : (
                <Copy className="h-3.5 w-3.5" />
              )}
            </Button>
          </div>

          <div className="flex gap-2 mt-3">
            <Button
              onClick={handleCopy}
              className="flex-1 bg-foreground text-white"
              size="sm"
            >
              {copied ? (
                <>
                  <Check className="mr-1 h-3 w-3" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="mr-1 h-3 w-3" />
                  Copy Link
                </>
              )}
            </Button>
            <Button
              onClick={handleShare}
              variant="outline"
              className="flex-1"
              size="sm"
            >
              <Share2 className="mr-1 h-3 w-3" />
              Share
            </Button>
          </div>
        </div>
      )}

      {/* How it works */}
      <div>
        <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground mb-3">
          How It Works
        </p>
        <div className="space-y-3">
          {[
            {
              step: "1",
              title: "Share your link",
              desc: "Send your unique referral link to friends",
            },
            {
              step: "2",
              title: "Friend signs up",
              desc: "They create an account using your link",
            },
            {
              step: "3",
              title: "Both earn rewards",
              desc: "You get ₹120 credit, they get a welcome bonus",
            },
          ].map((item) => (
            <div key={item.step} className="flex items-start gap-3">
              <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-foreground text-[10px] font-bold text-white">
                {item.step}
              </div>
              <div>
                <p className="text-sm font-medium">{item.title}</p>
                <p className="text-xs text-muted-foreground">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Stats */}
      {referral && (
        <div className="rounded-lg bg-muted/50 p-4">
          <div className="flex items-center gap-2 mb-2">
            <Users className="h-4 w-4 text-muted-foreground" />
            <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
              Your Stats
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="text-lg font-semibold">
                ₹{referral.rewardAmount}
              </p>
              <p className="text-[10px] text-muted-foreground">Reward per referral</p>
            </div>
            <div>
              <p className="text-lg font-semibold">
                {referral.rewardClaimed ? "Claimed" : "Pending"}
              </p>
              <p className="text-[10px] text-muted-foreground">Status</p>
            </div>
          </div>
        </div>
      )}

      {/* Security Notice */}
      <div className="rounded-lg bg-muted/50 p-3">
        <p className="text-[10px] text-muted-foreground/70 text-center">
          Keep your referral link private. Sharing it publicly may result in
          account restrictions.
        </p>
      </div>
    </div>
  );
}
