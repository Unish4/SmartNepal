import { useEffect } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";

// Layout and pages
import Layout from "./components/layout/Layout";
import HomePage from "./pages/HomePage";
import NotFoundPage from "./pages/NotFoundPage";
import ProtectedRoute from "./components/ProtectedRoute";
import LoginPage from "./pages/auth/LoginPage";
import RegisterPage from "./pages/auth/RegisterPage";
import IssuesPage from "./pages/issues/IssuesPage";
import CreateIssuePage from "./pages/issues/CreateIssuePage";
import IssueDetailPage from "./pages/issues/IssueDetailPage";
import MyIssuesPage from "./pages/issues/MyIssuesPage";
import EditIssuePage from "./pages/issues/EditIssuePage";
import ProfilePage from "./pages/ProfilePage";
import ForgotPasswordPage from "./pages/auth/ForgotPasswordPage"; // ← Phase 25
import ResetPasswordPage from "./pages/auth/ResetPasswordPage"; // ← Phase 25
import VerifyEmailPage from "./pages/auth/VerifyEmailPage";

import AdminLayout from "./pages/admin/AdminLayout";
import AdminDashboardPage from "./pages/admin/AdminDashboardPage";
import AdminFieldWorkersPage from "./pages/admin/AdminFieldWorkersPage";
import AdminIssuesPage from "./pages/admin/AdminIssuesPage";
import AdminUsersPage from "./pages/admin/AdminUsersPage";
import AdminAdminsPage from "./pages/admin/AdminAdminsPage";
import AdminAnalyticsPage from "./pages/admin/AdminAnalyticsPage";
import AdminManagementPage from "./pages/admin/AdminManagementPage";

import FieldLayout from "./components/field/FieldLayout";
import FieldDashboardPage from "./pages/field/FieldDashboardPage";
import FieldIssueDetailPage from "./pages/field/FieldIssueDetailPage";

import useAuthStore from "./store/useAuthStore";
import OfflineBanner from "./components/pwa/OfflineBanner.jsx";
import InstallPrompt from "./components/pwa/InstallPrompt.jsx";
import UpdatePrompt from "./components/pwa/UpdatePrompt.jsx";
import SyncManager from "./components/pwa/SyncManager.jsx";
import PwaInstallModal from "./components/pwa/PwaInstallModal.jsx";

// Public only route - redirects authenticated users away from auth pages
const PublicOnlyRoute = ({ children }) => {
  const { isAuthenticated } = useAuthStore();
  return isAuthenticated ? <Navigate to="/" replace /> : children;
};

const AdminRoute = ({ children }) => {
  const { isAuthenticated, user } = useAuthStore();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (user?.role !== "admin" && user?.role !== "super_admin") return <Navigate to="/" replace />;
  return children;
};

const FieldWorkerRoute = ({ children }) => {
  const { isAuthenticated, user } = useAuthStore();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (user?.role !== "field_worker") return <Navigate to="/" replace />;
  return children;
};

const CitizenRoute = ({ children }) => {
  const { isAuthenticated, user } = useAuthStore();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (
    user?.role === "admin" ||
    user?.role === "field_worker" ||
    user?.role === "super_admin"
  )
    return <Navigate to="/" replace />;
  return children;
};

const SuperAdminRoute = ({ children }) => {
  const { isAuthenticated, user } = useAuthStore();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (user?.role !== "super_admin") return <Navigate to="/admin" replace />;
  return children;
};

function App() {
  const { checkAuth, isCheckingAuth } = useAuthStore();

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  if (isCheckingAuth) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-950">
        <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <>
      <SyncManager />
      <InstallPrompt />
      <UpdatePrompt />
      <PwaInstallModal />
      <OfflineBanner />
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3000,
          style: {
            fontSize: "14px",
          },
        }}
      />

      <Routes>
        {/* Auth pages - only accessible when NOT logged in */}
        <Route
          path="login"
          element={
            <PublicOnlyRoute>
              <LoginPage />
            </PublicOnlyRoute>
          }
        />

        <Route
          path="register"
          element={
            <PublicOnlyRoute>
              <RegisterPage />
            </PublicOnlyRoute>
          }
        />

        <Route
          path="forgot-password"
          element={
            <PublicOnlyRoute>
              <ForgotPasswordPage />
            </PublicOnlyRoute>
          }
        />

        <Route
          path="reset-password/:token"
          element={
            <PublicOnlyRoute>
              <ResetPasswordPage />
            </PublicOnlyRoute>
          }
        />

        <Route path="verify-email/:token" element={<VerifyEmailPage />} />

        <Route
          path="/admin"
          element={
            <AdminRoute>
              <AdminLayout />
            </AdminRoute>
          }
        >
          <Route index element={<AdminDashboardPage />} />
          <Route path="issues" element={<AdminIssuesPage />} />
          <Route path="field-workers" element={<AdminFieldWorkersPage />} />
          <Route path="users" element={<AdminUsersPage />} />
          <Route path="admins" element={<AdminAdminsPage />} />
          <Route path="analytics" element={<AdminAnalyticsPage />} />
          <Route
            path="manage"
            element={
              <SuperAdminRoute>
                <AdminManagementPage />
              </SuperAdminRoute>
            }
          />
        </Route>

        <Route
          path="/field"
          element={
            <FieldWorkerRoute>
              <FieldLayout />
            </FieldWorkerRoute>
          }
        >
          <Route index element={<FieldDashboardPage />} />
          <Route path="assignments/:id" element={<FieldIssueDetailPage />} />
        </Route>

        <Route path="/" element={<Layout />}>
          <Route index element={<HomePage />} />

          <Route
            path="profile"
            element={
              <ProtectedRoute>
                <ProfilePage />
              </ProtectedRoute>
            }
          />

          {/* Issues routes */}
          <Route path="issues" element={<IssuesPage />} />
          <Route
            path="issues/new"
            element={
              <CitizenRoute>
                <CreateIssuePage />
              </CitizenRoute>
            }
          />
          <Route
            path="issues/me"
            element={
              <CitizenRoute>
                <MyIssuesPage />
              </CitizenRoute>
            }
          />
          <Route path="issues/:id" element={<IssueDetailPage />} />
          <Route
            path="issues/:id/edit"
            element={
              <CitizenRoute>
                <EditIssuePage />
              </CitizenRoute>
            }
          />

          {/* 404 page */}
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>
    </>
  );
}

export default App;
