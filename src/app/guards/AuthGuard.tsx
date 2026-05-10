import { Navigate, Outlet } from "react-router-dom";
import { tokenStorage } from "@/shared/api";

export const AuthGuard = () => {
  const token = tokenStorage.getAccessToken();

  if (!token) {
    return <Navigate to="/auth/login" replace />;
  }

  return <Outlet />;
};
