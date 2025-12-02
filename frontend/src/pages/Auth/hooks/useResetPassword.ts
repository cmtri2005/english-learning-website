import { useMutation } from "@tanstack/react-query";
import { api } from "@/services/api";

interface ResetPasswordRequest {
  token: string;
  password: string;
  confirmPassword: string;
}

interface ResetPasswordResponse {
  message: string;
}

/**
 * Hook đặt lại mật khẩu với token.
 * Gọi POST /reset-password trên backend.
 */
export function useResetPassword() {
  return useMutation<ResetPasswordResponse, Error, ResetPasswordRequest>({
    mutationFn: async (payload: ResetPasswordRequest) => {
      const res = await api.request<ResetPasswordResponse>("/reset-password", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      if (!res.success) {
        throw new Error(res.message || "Không thể đặt lại mật khẩu");
      }

      return {
        message: res.message,
      };
    },
  });
}


