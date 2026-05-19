import { authApi } from "@/features/auth/model/auth.store";
import { tokenStorage } from "@/shared/api";
import { useMutation } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";

export const useLogin = () => {
  const navigate = useNavigate();

  return useMutation({
    mutationFn: authApi.login,
    onSuccess: (data) => {
      tokenStorage.setTokens(data.token);
      navigate("/");
    },
    onError: (error) => {
      console.error("[AUTH] Ошибка входа:", error);
    },
  });
};

export const useRegister = () => {
  const navigate = useNavigate();

  return useMutation({
    mutationFn: authApi.register,
    onSuccess: (data) => {
      tokenStorage.setTokens(data.token);
      navigate("/");
    },
    onError: (error) => {
      console.error("[AUTH] Ошибка регистрации:", error);
    },
  });
};

export const useLogout = () => {
  const navigate = useNavigate();

  return useMutation({
    mutationFn: async () => {
      tokenStorage.clear();
    },
    onSettled: () => {
      navigate("/auth/login");
    },
  });
};
