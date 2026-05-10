import { createBrowserRouter, Navigate } from "react-router-dom";
import App from "@/App";
import RegisterPage from "@/pages/RegisterPage";
import VerifyEmailPage from "@/pages/VerifyEmailPage";
import LoginPage from "@/pages/LoginPage";
import ForgotPasswordPage from "@/pages/ForgotPasswordPage";
import DashboardPage from "@/pages/DashboardPage";
import TaskCreatePage from "@/pages/TaskCreatePage";
import TaskEditPage from "@/pages/TaskEditPage";
import ProfilePage from "@/pages/ProfilePage";
import NotificationsPage from "@/pages/NotificationsPage";
import AdminUsersPage from "@/pages/AdminUsersPage";
import AdminTasksPage from "@/pages/AdminTasksPage";
import AdminStatsPage from "@/pages/AdminStatsPage";
import NotFoundPage from "@/pages/NotFoundPage";
import ProtectedRoute from "@/components/common/ProtectedRoute";
import AdminRoute from "@/components/common/AdminRoute";
import TaskActivityLog from "@/components/tasks/TaskActivityLog";
import AppLayout from "@/components/layout/AppLayout";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
    children: [
      { index: true, element: <LoginPage /> },
      { path: "register", element: <RegisterPage /> },
      { path: "verify-email", element: <VerifyEmailPage /> },
      { path: "login", element: <LoginPage /> },
      { path: "forgot-password", element: <ForgotPasswordPage /> },
      {
        element: <ProtectedRoute />,
        children: [
          {
            element: <AppLayout />,
            children: [
              { path: "dashboard", element: <DashboardPage /> },
              { path: "tasks/new", element: <TaskCreatePage /> },
              { path: "tasks/:id/edit", element: <TaskEditPage /> },
              { path: "tasks/:id/activity", element: <TaskActivityLog /> },
              { path: "profile", element: <ProfilePage /> },
              { path: "notifications", element: <NotificationsPage /> },
              {
                element: <AdminRoute />,
                children: [
                  { path: "admin/stats", element: <AdminStatsPage /> },
                  { path: "admin/users", element: <AdminUsersPage /> },
                  { path: "admin/tasks", element: <AdminTasksPage /> },
                  { path: "admin", element: <Navigate to="/admin/stats" replace /> }
                ]
              }
            ]
          }
        ]
      },
      { path: "*", element: <NotFoundPage /> }
    ]
  }
]);
