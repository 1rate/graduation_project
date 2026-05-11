import { Outlet } from "react-router-dom";

export const AuthGuard = () => {
  // const token = tokenStorage.getAccessToken();

  // if (!token) {
  //   return <Navigate to="/auth/login" replace />;
  // }

  return <Outlet />;
};
