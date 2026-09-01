import { useState, useCallback } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  Target,
  Loader2,
  CheckCircle,
  AlertTriangle,
  Smartphone,
  Shield,
} from "lucide-react";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const DISCOUNT_BUCKETS = [110, 120, 135, 150, 180];

export default function OfferHuntPage() {
  const navigate = useNavigate();
  const [selectedTarget, setSelectedTarget] = useState<number | null>(null);
  const [hunting, setHunting] = useState(false);
  const [currentAttempt, setCurrentAttempt] = useState(0);
  const [liveLog, setLiveLog] = useState<string[]>([]);
  const [showFallback, setShowFallback] = useState(false);
  const [fallbackDiscount, setFallbackDiscount] = useState(0);
  const [completedHunt, setCompletedHunt] = useState<any>(null);

  const hunts = useQuery(api.offerHunts.list);
  const startHunt = useMutation(api.offerHunts.start);
  const runAttempt = useMutation(api.offerHunts.attempt);
  const runAll = useMutation(api.offerHunts.runAll);

  const addLog = useCallback((msg: string) => {
    setLiveLog((prev) => [
      ...prev,
      `[${new Date().toLocaleTimeString()}] ${msg}`,
    ]);
  }, []);

  const handleStartHunt = async () => {
    if (!selectedTarget) return;

    setHunting(true);
    setCurrentAttempt(0);
    setLiveLog([]);
    setShowFallback(false);
    setCompletedHunt(null);

    try {
      const huntId = await startHunt({ targetDiscount: selectedTarget });
      addLog(`Hunt started — Target: ₹${selectedTarget}`);
      addLog(`Max attempts: 15 · Simulating device rotation...`);

      // Run all attempts with visual delay
      for (let i = 1; i <= 15; i++) {
        await new Promise((r) => setTimeout(r, 800));
        setCurrentAttempt(i);

        const deviceFingerprints = [
          "Android/Chrome/1080x2400",
          "iOS/Safari/1170x2532",
          "Android/Firefox/1080x2340",
          "Android/Samsung/1080x2340",
          "iOS/Safari/1179x2556",
        ];
        const device = deviceFingerprints[i % deviceFingerprints.length];
        addLog(`Attempt ${i}/15 — Device: ${device}`);

        const result = await runAttempt({ huntId: huntId as any });

        if (result.success) {
          addLog(`✓ Target achieved! Discount: ₹${result.discount}`);
          setCompletedHunt(result);
          setHunting(false);
          toast.success(`Hunt successful! Found ₹${result.discount} discount`);
          return;
        }

        if (result.bestDiscount > 0) {
          addLog(`  Best so far: ₹${result.bestDiscount}`);
        }

        if (result.remainingAttempts === 0) {
          break;
        }
      }

      // Hunt completed without hitting target
      const finalResult = await runAll({ huntId: huntId as any });

      if (finalResult.status === "fallback" && finalResult.bestDiscount > 0) {
        setFallbackDiscount(finalResult.bestDiscount);
        setShowFallback(true);
        addLog(
          `Target ₹${selectedTarget} not reached. Best available: ₹${finalResult.bestDiscount}`,
        );
      } else {
        addLog("Hunt completed — no qualifying discount found");
        setCompletedHunt(finalResult);
      }

      setHunting(false);
    } catch (err) {
      setHunting(false);
      addLog("Error: hunt failed");
      toast.error("Hunt failed");
    }
  };

  const handleAcceptFallback = () => {
    toast.success(`Accepted ₹${fallbackDiscount} discount!`);
    setShowFallback(false);
    setCompletedHunt({ bestDiscount: fallbackDiscount, status: "fallback" });
  };

  const handleRejectFallback = () => {
    toast.info("Hunt cancelled");
    setShowFallback(false);
    setCompletedHunt(null);
    setSelectedTarget(null);
  };

  return (
    <div className="pb-24">
      <div className="sticky top-0 z-10 bg-white/95 backdrop-blur-sm border-b border-border">
        <div className="flex items-center px-4 py-3">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </button>
          <h1 className="ml-4 text-base font-semibold">Offer Hunt</h1>
        </div>
      </div>

      <div className="px-4 pt-4 space-y-4">
        {/* How it works */}
        <div className="rounded-lg bg-muted/50 p-3">
          <div className="flex items-start gap-2">
            <Shield className="h-3.5 w-3.5 text-muted-foreground mt-0.5 shrink-0" />
            <div>
              <p className="text-[10px] font-medium text-muted-foreground">
                How Offer Hunting Works
              </p>
              <p className="text-[10px] text-muted-foreground/70 mt-0.5">
                The system simulates new device sessions (up to 15 attempts) to
                find your target discount. Each attempt uses a different device
                fingerprint and user agent. If your exact target isn't found, the
                best available discount is presented as a fallback.
              </p>
            </div>
          </div>
        </div>

        {/* Target Selection */}
        {!hunting && !showFallback && !completedHunt && (
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-2">
              Select Target Discount
            </p>
            <div className="grid grid-cols-5 gap-2">
              {DISCOUNT_BUCKETS.map((bucket) => (
                <button
                  key={bucket}
                  onClick={() => setSelectedTarget(bucket)}
                  className={cn(
                    "rounded-lg border py-3 text-center transition-all",
                    selectedTarget === bucket
                      ? "border-foreground bg-foreground text-white"
                      : "border-border text-foreground hover:border-foreground/50",
                  )}
                >
                  <p className="text-sm font-semibold">₹{bucket}</p>
                  {bucket === 180 && (
                    <p className="text-[8px] opacity-60 mt-0.5">MAX</p>
                  )}
                </button>
              ))}
            </div>

            {/* Difficulty indicator */}
            {selectedTarget && (
              <div className="mt-3 rounded-lg border border-border p-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">Difficulty</span>
                  <div className="flex gap-0.5">
                    {[1, 2, 3, 4, 5].map((level) => (
                      <div
                        key={level}
                        className={cn(
                          "h-1.5 w-4 rounded-full",
                          level <=
                            Math.ceil(
                              (selectedTarget - 100) / 16,
                            )
                            ? "bg-foreground"
                            : "bg-muted",
                        )}
                      />
                    ))}
                  </div>
                </div>
                <p className="text-[10px] text-muted-foreground mt-1">
                  {selectedTarget === 180
                    ? "Very hard — rare high-value discount"
                    : selectedTarget >= 150
                      ? "Hard — requires multiple attempts"
                      : selectedTarget >= 135
                        ? "Moderate — achievable with patience"
                        : "Easy — commonly available"}
                </p>
              </div>
            )}

            <Button
              onClick={handleStartHunt}
              disabled={!selectedTarget}
              className="mt-4 w-full h-11 bg-foreground text-white"
            >
              <Target className="mr-2 h-4 w-4" />
              Start Hunt
            </Button>
          </div>
        )}

        {/* Hunting Progress */}
        {hunting && (
          <div className="space-y-3">
            <div className="rounded-lg border border-border p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="text-sm font-medium">Hunting...</span>
                </div>
                <span className="text-xs text-muted-foreground">
                  {currentAttempt}/15
                </span>
              </div>

              {/* Progress bar */}
              <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-foreground transition-all duration-500 rounded-full"
                  style={{ width: `${(currentAttempt / 15) * 100}%` }}
                />
              </div>

              <div className="flex items-center justify-between mt-2">
                <span className="text-[10px] text-muted-foreground">
                  Target: ₹{selectedTarget}
                </span>
                <span className="text-[10px] text-muted-foreground">
                  {Math.round((currentAttempt / 15) * 100)}%
                </span>
              </div>
            </div>

            {/* Live Log */}
            <div className="rounded-lg border border-border p-3 max-h-48 overflow-y-auto">
              <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground mb-2">
                Activity Log
              </p>
              <div className="space-y-0.5">
                {liveLog.map((line, i) => (
                  <p key={i} className="text-[10px] font-mono text-muted-foreground">
                    {line}
                  </p>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Fallback Confirmation */}
        {showFallback && (
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="h-4 w-4 text-amber-600" />
              <p className="text-sm font-medium text-amber-800">
                Fallback Available
              </p>
            </div>
            <p className="text-xs text-amber-700 mb-3">
              Target ₹{selectedTarget} wasn't reached after 15 attempts.
              The best available discount is{" "}
              <span className="font-semibold">₹{fallbackDiscount}</span>.
            </p>
            <p className="text-[10px] text-amber-600 mb-3">
              Would you like to accept this discount?
            </p>
            <div className="flex gap-2">
              <Button
                onClick={handleAcceptFallback}
                className="flex-1 bg-amber-600 text-white hover:bg-amber-700"
                size="sm"
              >
                Accept ₹{fallbackDiscount}
              </Button>
              <Button
                onClick={handleRejectFallback}
                variant="outline"
                className="flex-1"
                size="sm"
              >
                Try Again
              </Button>
            </div>
          </div>
        )}

        {/* Completed Result */}
        {completedHunt && !showFallback && (
          <div
            className={cn(
              "rounded-lg border p-4",
              completedHunt.status === "success" || completedHunt.bestDiscount >= selectedTarget!
                ? "border-green-200 bg-green-50"
                : "border-border",
            )}
          >
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle
                className={cn(
                  "h-4 w-4",
                  completedHunt.status === "success"
                    ? "text-green-600"
                    : "text-muted-foreground",
                )}
              />
              <p
                className={cn(
                  "text-sm font-medium",
                  completedHunt.status === "success"
                    ? "text-green-800"
                    : "text-foreground",
                )}
              >
                Hunt Complete
              </p>
            </div>
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Best Discount</span>
                <span className="font-semibold">
                  ₹{completedHunt.bestDiscount}
                </span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Target</span>
                <span>₹{selectedTarget}</span>
              </div>
              {completedHunt.attempts && (
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Attempts</span>
                  <span>{completedHunt.attempts}</span>
                </div>
              )}
            </div>
            <Button
              onClick={() => {
                setCompletedHunt(null);
                setSelectedTarget(null);
              }}
              variant="outline"
              className="mt-3 w-full"
              size="sm"
            >
              New Hunt
            </Button>
          </div>
        )}

        {/* Hunt History */}
        {hunts && hunts.length > 0 && (
          <div>
            <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground mb-2">
              Hunt History
            </p>
            <div className="space-y-1">
              {hunts.map((hunt) => (
                <div
                  key={hunt._id}
                  className="flex items-center justify-between rounded-lg border border-border px-3 py-2"
                >
                  <div className="flex items-center gap-2">
                    <Smartphone className="h-3 w-3 text-muted-foreground" />
                    <div>
                      <p className="text-xs font-medium">
                        Target ₹{hunt.targetDiscount}
                      </p>
                      <p className="text-[10px] text-muted-foreground">
                        Best ₹{hunt.bestDiscount} · {hunt.attempts} tries
                      </p>
                    </div>
                  </div>
                  <span
                    className={cn(
                      "rounded-full px-2 py-0.5 text-[10px] font-medium",
                      hunt.status === "success"
                        ? "bg-green-50 text-green-700"
                        : hunt.status === "fallback"
                          ? "bg-amber-50 text-amber-700"
                          : hunt.status === "hunting"
                            ? "bg-blue-50 text-blue-700"
                            : "bg-red-50 text-red-700",
                    )}
                  >
                    {hunt.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
