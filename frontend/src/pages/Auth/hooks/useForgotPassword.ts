import { useMutation } from "@tanstack/react-query";
import { api } from "@/services/api";

interface ForgotPasswordRequest {
  email: string;
}

interface ForgotPasswordResponse {
  message: string;
}

/**
 * Hook gửi yêu cầu quên mật khẩu.
 * Gửi email người dùng lên backend để tạo token và gửi mail reset password.
 */
export function useForgotPassword() {
  return useMutation<ForgotPasswordResponse, Error, ForgotPasswordRequest>({
    mutationFn: async (payload: ForgotPasswordRequest) => {
      const res = await api.forgotPassword(payload);

      if (!res.success) {
        throw new Error(res.message || "Không thể gửi yêu cầu quên mật khẩu");
      }

      return {
        message: res.message,
      };
    },
  });
}


