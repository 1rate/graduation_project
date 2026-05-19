import { tokenStorage } from "@/shared/api";
import { Navigate, Outlet } from "react-router-dom";

function parseJwt(token: string): { role?: string } | null {
  try {
    const payload = token.split(".")[1];
    return JSON.parse(atob(payload));
  } catch {
    return null;
  }
}

export const AuthGuard = () => {
  const token = tokenStorage.getAccessToken();

  if (!token) {
    return <Navigate to="/auth/login" replace />;
  }

  const jwt = parseJwt(token);

  if (!jwt || jwt.role !== "admin") {
    return <Navigate to="/auth/login" replace />;
  }

  return <Outlet />;
};
