import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import {
  ArrowLeft,
  Smartphone,
  Gift,
  Link,
  CheckCircle,
  Loader2,
} from "lucide-react";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { authApi } from "@/lib/api";
import { saveAuth, getAuth } from "@/lib/auth";

const BONUS_TIERS = [
  { amount: 110, label: "₹110", description: "Starter" },
  { amount: 120, label: "₹120", description: "Basic" },
  { amount: 135, label: "₹135", description: "Plus" },
  { amount: 150, label: "₹150", description: "Premium" },
  { amount: 180, label: "₹180", description: "Max" },
];

export default function AddAccountPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState<"referral" | "tier" | "phone" | "otp" | "done">("referral");
  const [referralCode, setReferralCode] = useState("");
  const [selectedTier, setSelectedTier] = useState<number | null>(null);
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [requestId, setRequestId] = useState("");
  const [instanceId, setInstanceId] = useState("");
  const [loading, setLoading] = useState(false);

  const handleReferral = () => {
    setStep("tier");
  };

  const handleSkipReferral = () => {
    setReferralCode("");
    setStep("tier");
  };

  const handleTierSelect = (amount: number) => {
    setSelectedTier(amount);
    setStep("phone");
  };

  const handleSendOtp = async () => {
    if (!/^\d{10}$/.test(phone)) {
      toast.error("Enter a valid 10-digit mobile number");
      return;
    }
    if (!selectedTier) return;

    setLoading(true);
    try {
      const result = await authApi.sendOtp(phone) as any;
      setRequestId(result.request_id || "");
      setInstanceId(result.instance_id || "");
      setStep("otp");
      toast.success("OTP sent!");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to send OTP");
    }
    setLoading(false);
  };

  const handleVerifyOtp = async () => {
    if (otp.length < 4) return;

    setLoading(true);
    try {
      const result = await authApi.verifyOtp({
        request_id: requestId,
        instance_id: instanceId,
        phone_number: phone,
        otp,
        login_type: "otp",
      }) as any;

      // Save auth tokens
      saveAuth({
        request_id: requestId,
        instance_id: instanceId,
        phone_number: phone,
        access_token: result.access_token || result.token,
        token: result.token,
        refresh_token: result.refresh_token,
        user_id: result.user_id,
        identifier: result.identifier,
        cart_session: result.cart_session,
        session_state: result.session_state,
        login_type: "otp",
        createdAt: Date.now(),
        expiresAt: Date.now() + 2 * 24 * 60 * 60 * 1000,
      });

      setStep("done");
      toast.success("Account linked! Welcome bonus credited.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Invalid OTP");
      setOtp("");
    }
    setLoading(false);
  };

  return (
    <div className="pb-24">
      <div className="sticky top-0 z-10 bg-white/95 backdrop-blur-sm border-b border-border">
        <div className="flex items-center px-4 py-3">
          <button
            onClick={() => (step === "referral" ? navigate(-1) : setStep(step === "otp" ? "phone" : step === "phone" ? "tier" : step === "done" ? "phone" : "referral"))}
            className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </button>
          <h1 className="ml-4 text-base font-semibold">Add Account</h1>
        </div>
      </div>

      {/* Step Indicator */}
      <div className="flex px-4 py-3 gap-1.5">
        {["referral", "tier", "phone", "otp"].map((s, i) => (
          <div
            key={s}
            className={cn(
              "flex-1 h-1 rounded-full transition-colors",
              ["referral", "tier", "phone", "otp"].indexOf(step) >= i
                ? "bg-foreground"
                : "bg-muted",
            )}
          />
        ))}
      </div>

      <div className="px-4 pt-2 space-y-4">
        {/* Step 1: Referral */}
        {step === "referral" && (
          <div className="space-y-4">
            <div className="text-center py-4">
              <Gift className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
              <h2 className="text-lg font-semibold">Have a referral link?</h2>
              <p className="text-sm text-muted-foreground mt-1">
                Enter a friend's referral code to earn extra rewards
              </p>
            </div>

            <div className="relative">
              <Link className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Enter referral code (optional)"
                value={referralCode}
                onChange={(e) => setReferralCode(e.target.value)}
                className="pl-10"
              />
            </div>

            <Button
              onClick={handleReferral}
              className="w-full h-11 bg-foreground text-white"
            >
              Continue
            </Button>
            <Button
              onClick={handleSkipReferral}
              variant="ghost"
              className="w-full"
            >
              Skip for now
            </Button>
          </div>
        )}

        {/* Step 2: Welcome Bonus Tier */}
        {step === "tier" && (
          <div className="space-y-4">
            <div className="text-center py-4">
              <h2 className="text-lg font-semibold">Select Welcome Bonus</h2>
              <p className="text-sm text-muted-foreground mt-1">
                Choose your target bonus tier
              </p>
            </div>

            <div className="grid grid-cols-5 gap-2">
              {BONUS_TIERS.map((tier) => (
                <button
                  key={tier.amount}
                  onClick={() => handleTierSelect(tier.amount)}
                  className={cn(
                    "rounded-lg border py-3 text-center transition-all",
                    selectedTier === tier.amount
                      ? "border-foreground bg-foreground text-white"
                      : "border-border text-foreground hover:border-foreground/50",
                  )}
                >
                  <p className="text-sm font-semibold">{tier.label}</p>
                  <p className="text-[8px] opacity-60 mt-0.5">
                    {tier.description}
                  </p>
                </button>
              ))}
            </div>

            {selectedTier && (
              <div className="rounded-lg border border-border p-3">
                <p className="text-xs text-muted-foreground">
                  You selected <span className="font-semibold text-foreground">₹{selectedTier}</span>{" "}
                  welcome bonus. This will be credited to your wallet after
                  successful account linking.
                </p>
              </div>
            )}
          </div>
        )}

        {/* Step 3: Phone Number */}
        {step === "phone" && (
          <div className="space-y-4">
            <div className="text-center py-4">
              <Smartphone className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
              <h2 className="text-lg font-semibold">Enter Mobile Number</h2>
              <p className="text-sm text-muted-foreground mt-1">
                We'll send an OTP to verify your account
              </p>
            </div>

            <Input
              placeholder="10-digit mobile number"
              value={phone}
              onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
              type="tel"
              className="text-center text-lg tracking-widest"
            />

            <Button
              onClick={handleSendOtp}
              disabled={phone.length !== 10 || loading}
              className="w-full h-11 bg-foreground text-white"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Send OTP"
              )}
            </Button>
          </div>
        )}

        {/* Step 4: OTP Verification */}
        {step === "otp" && (
          <div className="space-y-4">
            <div className="text-center py-4">
              <h2 className="text-lg font-semibold">Verify OTP</h2>
              <p className="text-sm text-muted-foreground mt-1">
                Enter the code sent to {phone}
              </p>
            </div>

            <div className="flex justify-center">
              <InputOTP
                value={otp}
                onChange={setOtp}
                maxLength={6}
                disabled={loading}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && otp.length >= 4 && !loading) {
                    handleVerifyOtp();
                  }
                }}
              >
                <InputOTPGroup>
                  {Array.from({ length: 6 }).map((_, i) => (
                    <InputOTPSlot key={i} index={i} />
                  ))}
                </InputOTPGroup>
              </InputOTP>
            </div>

            <Button
              onClick={handleVerifyOtp}
              disabled={otp.length < 4 || loading}
              className="w-full h-11 bg-foreground text-white"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Verify & Link"
              )}
            </Button>

            <Button
              onClick={() => {
                setOtp("");
                handleSendOtp();
              }}
              variant="ghost"
              className="w-full"
              disabled={loading}
            >
              Resend OTP
            </Button>
          </div>
        )}

        {/* Step 5: Done */}
        {step === "done" && (
          <div className="space-y-4 text-center py-8">
            <CheckCircle className="h-16 w-16 mx-auto text-green-600" />
            <h2 className="text-lg font-semibold">Account Linked!</h2>
            <p className="text-sm text-muted-foreground max-w-xs mx-auto">
              Your account has been linked successfully. ₹{selectedTier} welcome
              bonus has been credited to your wallet.
            </p>
            <div className="flex gap-2 mt-6">
              <Button
                onClick={() => navigate("/dashboard/offer-hunt")}
                className="flex-1 bg-foreground text-white"
              >
                Start Offer Hunt
              </Button>
              <Button
                onClick={() => navigate("/dashboard")}
                variant="outline"
                className="flex-1"
              >
                Go to Dashboard
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
