import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { api } from "@/services/api";

interface RegisterFormData {
  email: string;
  password: string;
  confirmPassword: string;
  name: string;
}

interface RegisterResponse {
  requiresVerification: boolean;
  email: string;
  otpExpiresAt: string;
}

export function useRegisterForm() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState<RegisterFormData>({
    email: "",
    password: "",
    confirmPassword: "",
    name: "",
  });
  const [error, setError] = useState("");

  // Custom register mutation that handles OTP flow
  const registerMutation = useMutation({
    mutationFn: async (data: RegisterFormData) => {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL || "http://localhost:8000"}/api/auth/register`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(data),
          credentials: "include",
        }
      );

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Registration failed");
      }

      return result.data as RegisterResponse;
    },
    onSuccess: (data) => {
      // Redirect to OTP verification page with email and expiry time
      navigate("/verify-otp", {
        state: {
          email: data.email,
          otpExpiresAt: data.otpExpiresAt,
        },
      });
    },
    onError: (err: Error) => {
      setError(err.message || "Registration failed. Please try again.");
    },
  });

  const handleChange =
    (field: keyof RegisterFormData) =>
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setFormData((prev) => ({
        ...prev,
        [field]: e.target.value,
      }));
    };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Client-side validation
    if (formData.password !== formData.confirmPassword) {
      setError("Mật khẩu xác nhận không khớp");
      return;
    }

    if (formData.password.length < 8) {
      setError("Mật khẩu phải có ít nhất 8 ký tự");
      return;
    }

    if (!/[A-Za-z]/.test(formData.password) || !/[0-9]/.test(formData.password)) {
      setError("Mật khẩu phải chứa ít nhất 1 chữ cái và 1 số");
      return;
    }

    registerMutation.mutate(formData);
  };

  return {
    formData,
    setFormData,
    error,
    isLoading: registerMutation.isPending,
    handleChange,
    handleSubmit,
  };
}


