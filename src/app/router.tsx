import { createBrowserRouter, Navigate } from "react-router-dom";
import { DashboardPage, LoginPage, NotFoundPage, RegisterPage, UploadPage } from "@/pages";
import { AppLayout } from "@/app/AppLayout";
import { AuthGuard } from "@/app/guards/AuthGuard";

export const router = createBrowserRouter([
  {
    path: "/auth",
    children: [
      { index: true, element: <Navigate to="/auth/login" replace /> },
      { path: "login", element: <LoginPage /> },
      { path: "register", element: <RegisterPage /> },
      { path: "*", element: <NotFoundPage /> },
    ],
  },
  {
    path: "/",
    element: <AuthGuard />,
    children: [
      {
        element: <AppLayout />,
        children: [
          { index: true, element: <DashboardPage /> },
          { path: "upload", element: <UploadPage /> },
          { path: "history", element: <UploadPage /> },
          { path: "calls/:id", element: <DashboardPage /> },
          { path: "*", element: <NotFoundPage /> },
        ],
      },
    ],
  },
  {
    path: "*",
    element: <NotFoundPage />,
  },
]);
