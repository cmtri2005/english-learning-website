import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/shared/hooks/useAuth";

export function useLogoutHandler() {
  const navigate = useNavigate();
  const { logout } = useAuth();

  useEffect(() => {
    const run = async () => {
      try {
        await logout();
      } finally {
        navigate("/login", { replace: true });
      }
    };
    run();
  }, [logout, navigate]);
}


