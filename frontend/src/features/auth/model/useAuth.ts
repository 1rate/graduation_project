import { useMutation } from "@tanstack/react-query";
import { authApi } from "@/features/auth/model/auth.store";
import { tokenStorage } from "@/shared/api";

export const useLogin = () => {
  return useMutation({
    mutationFn: authApi.login,
    onSuccess: (data) => {
      tokenStorage.setTokens(data.token);
      // TODO: редирект на дашборд
    },
    onError: (error) => {
      console.error("[AUTH] Ошибка входа:", error);
    },
  });
};

export const useRegister = () => {
  return useMutation({
    mutationFn: authApi.register,
    onSuccess: (data) => {
      tokenStorage.setTokens(data.token);
      // TODO: редирект на дашборд
    },
    onError: (error) => {
      console.error("[AUTH] Ошибка регистрации:", error);
    },
  });
};

export const useLogout = () => {
  return useMutation({
    mutationFn: authApi.logout,
    onSettled: () => {
      tokenStorage.clear();
      // TODO: редирект на логин
    },
  });
};
