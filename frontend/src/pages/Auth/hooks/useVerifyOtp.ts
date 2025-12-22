import { useMutation } from "@tanstack/react-query";
import { api } from "@/services/api";
import { useAuthStore } from "@/store/client/auth-store";
import { useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/store/config/query-client";

interface VerifyOtpRequest {
  email: string;
  otp: string;
}

interface VerifyOtpResponse {
  user: {
    id: number;
    email: string;
    name: string;
    avatar?: string;
    role: "student" | "admin";
    email_verified: boolean;
    created_at: string;
  };
  token: string;
  refreshToken: string;
}

interface ResendOtpRequest {
  email: string;
}

interface ResendOtpResponse {
  message: string;
  otpExpiresAt: string;
}

/**
 * Hook xác minh OTP sau khi đăng ký
 */
export function useVerifyOtp() {
  const queryClient = useQueryClient();
  const { setUser } = useAuthStore();

  return useMutation<VerifyOtpResponse, Error, VerifyOtpRequest>({
    mutationFn: async (payload: VerifyOtpRequest) => {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL || "http://localhost:8000"}/api/auth/register/otp/verify`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
          credentials: "include",
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Không thể xác minh OTP");
      }

      return data.data;
    },
    onSuccess: (data) => {
      const { user, token, refreshToken } = data;

      // Store tokens
      api.setToken(token);
      localStorage.setItem("refreshToken", refreshToken);

      // Update client store
      setUser(user);

      // Set query data for current user
      queryClient.setQueryData(queryKeys.auth.currentUser(), user);

      // Invalidate auth queries
      queryClient.invalidateQueries({ queryKey: queryKeys.auth.all });
    },
    onError: (error) => {
      console.error("Verify OTP error:", error);
    },
  });
}

/**
 * Hook gửi lại OTP
 */
export function useResendOtp() {
  return useMutation<ResendOtpResponse, Error, ResendOtpRequest>({
    mutationFn: async (payload: ResendOtpRequest) => {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL || "http://localhost:8000"}/api/auth/register/otp/resend`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
          credentials: "include",
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Không thể gửi lại OTP");
      }

      return {
        message: data.message,
        otpExpiresAt: data.data?.otpExpiresAt || "",
      };
    },
    onError: (error) => {
      console.error("Resend OTP error:", error);
    },
  });
}

