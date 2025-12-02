import { useState } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
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
import { Lock, AlertTriangle, CheckCircle2, Loader2 } from "lucide-react";
import { useResetPassword } from "../hooks/useResetPassword";

export default function ResetPassword() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") || "";

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const { mutateAsync, isPending, error, isSuccess, data } = useResetPassword();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!token) return;

    try {
      await mutateAsync({ token, password, confirmPassword });
    } catch {
      // error đã được handle trong hook (throw Error với message từ backend)
    }
  };

  const invalidToken = !token;

  return (
    <AppLayout>
      <div className="container mx-auto px-4 py-20">
        <div className="max-w-md mx-auto">
          <Card>
            <CardHeader className="space-y-1">
              <div className="flex items-center justify-center mb-4">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <Lock className="text-primary" size={24} />
                </div>
              </div>
              <CardTitle className="text-2xl text-center">
                Đặt lại mật khẩu
              </CardTitle>
              <CardDescription className="text-center">
                Nhập mật khẩu mới cho tài khoản của bạn
              </CardDescription>
            </CardHeader>

            <form onSubmit={handleSubmit}>
              <CardContent className="space-y-4">
                {invalidToken && (
                  <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      Liên kết đặt lại mật khẩu không hợp lệ. Vui lòng gửi lại yêu cầu{" "}
                      <Link
                        to="/forgot-password"
                        className="underline underline-offset-4 font-medium"
                      >
                        quên mật khẩu
                      </Link>
                      .
                    </AlertDescription>
                  </Alert>
                )}

                {!invalidToken && error && (
                  <Alert variant="destructive">
                    <AlertDescription>{error.message}</AlertDescription>
                  </Alert>
                )}

                {!invalidToken && isSuccess && (
                  <Alert>
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                    <AlertDescription>
                      {data?.message ||
                        "Đặt lại mật khẩu thành công. Bạn có thể đăng nhập với mật khẩu mới."}
                    </AlertDescription>
                  </Alert>
                )}

                {!invalidToken && !isSuccess && (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="password">Mật khẩu mới</Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="password"
                          type="password"
                          placeholder="••••••••"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          className="pl-10"
                          required
                          disabled={isPending}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="confirmPassword">Xác nhận mật khẩu</Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="confirmPassword"
                          type="password"
                          placeholder="••••••••"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          className="pl-10"
                          required
                          disabled={isPending}
                        />
                      </div>
                    </div>
                  </>
                )}
              </CardContent>

              <CardFooter className="flex flex-col space-y-4">
                {!invalidToken && !isSuccess && (
                  <Button type="submit" className="w-full" disabled={isPending}>
                    {isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Đang đặt lại mật khẩu...
                      </>
                    ) : (
                      <>Đặt lại mật khẩu</>
                    )}
                  </Button>
                )}

                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={() => navigate("/login")}
                >
                  Quay lại đăng nhập
                </Button>
              </CardFooter>
            </form>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}


