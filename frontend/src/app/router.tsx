import { AppLayout } from "@/app/AppLayout";
import { AuthGuard } from "@/app/guards/AuthGuard";
import {
  CallDetailPage,
  DashboardPage,
  HistoryPage,
  LoginPage,
  NotFoundPage,
  RegisterPage,
  SummaryPage,
  UploadPage,
} from "@/pages";
import { createBrowserRouter, Navigate } from "react-router-dom";

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
          { path: "history", element: <HistoryPage /> },
          { path: "history/:id", element: <CallDetailPage /> },
          { path: "summary", element: <SummaryPage /> },
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
