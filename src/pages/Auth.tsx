import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Mail, ArrowRight, Loader2 } from "lucide-react";
import { authApi } from "@/lib/api";
import { saveAuth, isAuthenticated } from "@/lib/auth";

interface AuthPageProps {
  redirectAfterAuth?: string;
}

export default function AuthPage({ redirectAfterAuth = "/dashboard" }: AuthPageProps) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [step, setStep] = useState<"phone" | "otp">("phone");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [requestId, setRequestId] = useState("");
  const [instanceId, setInstanceId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Redirect if already logged in
  useEffect(() => {
    if (isAuthenticated()) {
      const returnTo = searchParams.get("returnTo") || redirectAfterAuth;
      navigate(returnTo, { replace: true });
    }
  }, [navigate, searchParams, redirectAfterAuth]);

  const handleSendOtp = async () => {
    if (phone.length < 10) {
      setError("Enter a valid 10-digit phone number");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await authApi.sendOtp(phone) as any;
      setRequestId(res.request_id || "");
      setInstanceId(res.instance_id || "");
      setStep("otp");
    } catch (err: any) {
      setError(err?.message || "Failed to send OTP");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (otp.length < 4) {
      setError("Enter a valid OTP");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await authApi.verifyOtp({
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
        access_token: res.access_token || res.token,
        token: res.token,
        refresh_token: res.refresh_token,
        user_id: res.user_id,
        identifier: res.identifier,
        cart_session: res.cart_session,
        session_state: res.session_state,
        login_type: "otp",
        createdAt: Date.now(),
        expiresAt: Date.now() + 2 * 24 * 60 * 60 * 1000,
      });

      const returnTo = searchParams.get("returnTo") || redirectAfterAuth;
      navigate(returnTo, { replace: true });
    } catch (err: any) {
      setError(err?.message || "Invalid OTP");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex flex-col items-center justify-center px-6 relative overflow-hidden">
      {/* Ambient glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-blue-500/5 rounded-full blur-[120px] pointer-events-none" />

      <div className="w-full max-w-sm relative z-10">
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-white flex items-center justify-center shadow-lg shadow-white/10">
            <span className="text-2xl">🛍️</span>
          </div>
        </div>

        {/* Title */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-white mb-2">
            {step === "phone" ? "Welcome back" : "Verify OTP"}
          </h1>
          <p className="text-sm text-gray-500">
            {step === "phone"
              ? "Enter your phone number to continue"
              : `OTP sent to ${phone}`}
          </p>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-4 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm text-center">
            {error}
          </div>
        )}

        {/* Phone Input */}
        {step === "phone" && (
          <div className="space-y-3">
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
              <Input
                type="tel"
                placeholder="Phone number"
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
                onKeyDown={(e) => e.key === "Enter" && handleSendOtp()}
                className="pl-11 h-13 bg-[#141414] border-white/10 text-white placeholder:text-gray-600 rounded-xl text-base focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20 transition-all"
              />
            </div>
            <Button
              onClick={handleSendOtp}
              disabled={loading || phone.length < 10}
              className="w-full h-13 bg-white text-black hover:bg-gray-100 rounded-xl font-semibold text-base transition-all disabled:opacity-30"
            >
              {loading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <>
                  Continue
                  <ArrowRight className="h-4 w-4 ml-2" />
                </>
              )}
            </Button>
          </div>
        )}

        {/* OTP Input */}
        {step === "otp" && (
          <div className="space-y-3">
            <Input
              type="text"
              inputMode="numeric"
              placeholder="Enter OTP"
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
              onKeyDown={(e) => e.key === "Enter" && handleVerifyOtp()}
              className="h-13 bg-[#141414] border-white/10 text-white placeholder:text-gray-600 rounded-xl text-center text-xl tracking-[0.5em] font-mono focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20 transition-all"
            />
            <Button
              onClick={handleVerifyOtp}
              disabled={loading || otp.length < 4}
              className="w-full h-13 bg-white text-black hover:bg-gray-100 rounded-xl font-semibold text-base transition-all disabled:opacity-30"
            >
              {loading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                "Verify & Login"
              )}
            </Button>
            <button
              onClick={() => {
                setStep("phone");
                setOtp("");
                setError("");
              }}
              className="w-full text-center text-sm text-gray-500 hover:text-gray-300 transition-colors py-2"
            >
              Change phone number
            </button>
          </div>
        )}

        {/* Footer */}
        <p className="text-center text-[11px] text-gray-600 mt-8 leading-relaxed">
          By continuing, you agree to our Terms of Service
          <br />
          and Privacy Policy
        </p>
      </div>
    </div>
  );
}
