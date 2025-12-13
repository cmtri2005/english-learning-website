import { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { AppLayout } from "@/shared/components/layout";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card";
import { Alert, AlertDescription } from "@/shared/components/ui/alert";
import {
  ShieldCheck,
  Loader2,
  RefreshCw,
  CheckCircle2,
  ArrowLeft,
} from "lucide-react";
import { useVerifyOtp, useResendOtp } from "../hooks/useVerifyOtp";

export default function VerifyOtp() {
  const navigate = useNavigate();
  const location = useLocation();

  // Get email from navigation state (passed from register page)
  const email = location.state?.email || "";
  const initialExpiresAt = location.state?.otpExpiresAt || "";

  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [timeLeft, setTimeLeft] = useState(0);
  const [canResend, setCanResend] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const verifyOtpMutation = useVerifyOtp();
  const resendOtpMutation = useResendOtp();

  // Calculate initial time left
  useEffect(() => {
    if (initialExpiresAt) {
      const expiresAt = new Date(initialExpiresAt).getTime();
      const now = Date.now();
      const diff = Math.max(0, Math.floor((expiresAt - now) / 1000));
      setTimeLeft(diff);
    } else {
      setTimeLeft(600); // Default 10 minutes
    }
  }, [initialExpiresAt]);

  // Countdown timer
  useEffect(() => {
    if (timeLeft <= 0) {
      setCanResend(true);
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          setCanResend(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft]);

  // Redirect if no email provided
  useEffect(() => {
    if (!email) {
      navigate("/register");
    }
  }, [email, navigate]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const handleChange = (index: number, value: string) => {
    // Only allow numbers
    if (value && !/^\d$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    // Handle backspace
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text").trim();

    // Only allow 6 digit numbers
    if (!/^\d{6}$/.test(pastedData)) return;

    const newOtp = pastedData.split("");
    setOtp(newOtp);

    // Focus last input
    inputRefs.current[5]?.focus();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const otpString = otp.join("");
    if (otpString.length !== 6) return;

    try {
      await verifyOtpMutation.mutateAsync({ email, otp: otpString });
      navigate("/dashboard");
    } catch {
      // Error handled by mutation
    }
  };

  const handleResend = async () => {
    if (!canResend) return;

    try {
      const result = await resendOtpMutation.mutateAsync({ email });
      setOtp(["", "", "", "", "", ""]);
      inputRefs.current[0]?.focus();

      // Reset timer
      if (result.otpExpiresAt) {
        const expiresAt = new Date(result.otpExpiresAt).getTime();
        const now = Date.now();
        const diff = Math.max(0, Math.floor((expiresAt - now) / 1000));
        setTimeLeft(diff);
      } else {
        setTimeLeft(600);
      }
      setCanResend(false);
    } catch {
      // Error handled by mutation
    }
  };

  const isComplete = otp.every((digit) => digit !== "");
  const isPending = verifyOtpMutation.isPending || resendOtpMutation.isPending;

  return (
    <AppLayout>
      <div className="container mx-auto px-4 py-20">
        <div className="max-w-md mx-auto">
          <Card>
            <CardHeader className="space-y-1">
              <div className="flex items-center justify-center mb-4">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <ShieldCheck className="text-primary" size={24} />
                </div>
              </div>
              <CardTitle className="text-2xl text-center">
                Xác minh email
              </CardTitle>
              <CardDescription className="text-center">
                Chúng tôi đã gửi mã OTP 6 chữ số đến
                <br />
                <span className="font-medium text-foreground">{email}</span>
              </CardDescription>
            </CardHeader>

            <form onSubmit={handleSubmit}>
              <CardContent className="space-y-6">
                {verifyOtpMutation.error && (
                  <Alert variant="destructive">
                    <AlertDescription>
                      {verifyOtpMutation.error.message}
                    </AlertDescription>
                  </Alert>
                )}

                {resendOtpMutation.isSuccess && (
                  <Alert>
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                    <AlertDescription>
                      Đã gửi lại mã OTP. Vui lòng kiểm tra email.
                    </AlertDescription>
                  </Alert>
                )}

                {/* OTP Input */}
                <div className="flex justify-center gap-2">
                  {otp.map((digit, index) => (
                    <Input
                      key={index}
                      ref={(el) => (inputRefs.current[index] = el)}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleChange(index, e.target.value)}
                      onKeyDown={(e) => handleKeyDown(index, e)}
                      onPaste={handlePaste}
                      className="w-12 h-14 text-center text-2xl font-bold"
                      disabled={isPending}
                      autoFocus={index === 0}
                    />
                  ))}
                </div>

                {/* Timer */}
                <div className="text-center text-sm text-muted-foreground">
                  {timeLeft > 0 ? (
                    <span>
                      Mã OTP hết hạn sau:{" "}
                      <span className="font-medium text-primary">
                        {formatTime(timeLeft)}
                      </span>
                    </span>
                  ) : (
                    <span className="text-destructive">
                      Mã OTP đã hết hạn. Vui lòng gửi lại.
                    </span>
                  )}
                </div>
              </CardContent>

              <CardFooter className="flex flex-col space-y-4">
                <Button
                  type="submit"
                  className="w-full"
                  disabled={!isComplete || isPending || timeLeft === 0}
                >
                  {verifyOtpMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Đang xác minh...
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="mr-2 h-4 w-4" />
                      Xác minh
                    </>
                  )}
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={handleResend}
                  disabled={!canResend || resendOtpMutation.isPending}
                >
                  {resendOtpMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Đang gửi...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="mr-2 h-4 w-4" />
                      Gửi lại mã OTP
                    </>
                  )}
                </Button>

                <button
                  type="button"
                  onClick={() => navigate("/register")}
                  className="inline-flex items-center justify-center text-sm text-muted-foreground hover:text-primary"
                >
                  <ArrowLeft className="mr-1 h-4 w-4" />
                  Quay lại đăng ký
                </button>
              </CardFooter>
            </form>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}

