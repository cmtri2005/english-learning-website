import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { AppLayout } from "@/shared/components/layout";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card";
import { Alert, AlertDescription } from "@/shared/components/ui/alert";
import { Mail, ArrowLeft, Loader2 } from "lucide-react";
import { useForgotPassword } from "../hooks/useForgotPassword";

export default function ForgotPassword() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [submittedEmail, setSubmittedEmail] = useState<string | null>(null);
  const { mutateAsync, isPending, error, isSuccess } = useForgotPassword();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const result = await mutateAsync({ email });
      console.log("[ForgotPassword] Mutation success:", result);
      setSubmittedEmail(email);
    } catch (err) {
      // error đã được handle trong hook (throw Error với message từ backend)
      console.error("[ForgotPassword] Mutation error:", err);
    }
  };

  const successMessage =
    isSuccess && submittedEmail
      ? `Chúng tôi đã gửi hướng dẫn đặt lại mật khẩu vào email ${submittedEmail}. Vui lòng kiểm tra hộp thư của bạn (kể cả thư mục spam).`
      : undefined;

  return (
    <AppLayout>
      <div className="container mx-auto px-4 py-20">
        <div className="max-w-md mx-auto">
          <Card>
            <CardHeader className="space-y-1">
              <div className="flex items-center justify-center mb-4">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <Mail className="text-primary" size={24} />
                </div>
              </div>
              <CardTitle className="text-2xl text-center">
                Quên mật khẩu
              </CardTitle>
              <CardDescription className="text-center">
                Nhập email để nhận mã / liên kết đặt lại mật khẩu
              </CardDescription>
            </CardHeader>

            <form onSubmit={handleSubmit}>
              <CardContent className="space-y-4">
                {error && (
                  <Alert variant="destructive">
                    <AlertDescription>{error.message}</AlertDescription>
                  </Alert>
                )}

                {successMessage && !error && (
                  <Alert>
                    <AlertDescription>{successMessage}</AlertDescription>
                  </Alert>
                )}

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="you@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-10"
                      required
                      disabled={isPending}
                    />
                  </div>
                </div>
              </CardContent>

              <CardFooter className="flex flex-col space-y-4">
                <Button type="submit" className="w-full" disabled={isPending}>
                  {isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Đang gửi...
                    </>
                  ) : (
                    <>Gửi hướng dẫn đặt lại mật khẩu</>
                  )}
                </Button>

                <button
                  type="button"
                  onClick={() => navigate("/login")}
                  className="inline-flex items-center justify-center text-sm text-muted-foreground hover:text-primary"
                >
                  <ArrowLeft className="mr-1 h-4 w-4" />
                  Quay lại trang đăng nhập
                </button>
              </CardFooter>
            </form>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}


