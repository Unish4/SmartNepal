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
import useAuthStore from "./store/useAuthStore";

import AdminLayout from "./pages/admin/AdminLayout";
import AdminDashboardPage from "./pages/admin/AdminDashboardPage";
import AdminIssuesPage from "./pages/admin/AdminIssuesPage";
import AdminUsersPage from "./pages/admin/AdminUsersPage";
import AdminAnalyticsPage from "./pages/admin/AdminAnalyticsPage"; 


// Public only route - redirects authenticated users away from auth pages
const PublicOnlyRoute = ({ children }) => {
  const { isAuthenticated } = useAuthStore();
  return isAuthenticated ? <Navigate to="/" replace /> : children;
};

const AdminRoute = ({ children }) => {
  const { isAuthenticated, user } = useAuthStore();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (user?.role !== "admin") return <Navigate to="/" replace />;
  return children;
};

function App() {
  return (
    <>
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
          <Route path="users" element={<AdminUsersPage />} />
          <Route path="analytics" element={<AdminAnalyticsPage />} />
        </Route>

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
        <Route path="/" element={<Layout />}>
          {/* Public routes */}
          <Route index element={<HomePage />} />

          {/* Issues routes */}
          <Route path="issues" element={<IssuesPage />} />
          <Route
            path="issues/new"
            element={
              <ProtectedRoute>
                <CreateIssuePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="issues/me"
            element={
              <ProtectedRoute>
                <MyIssuesPage />
              </ProtectedRoute>
            }
          />
          <Route path="issues/:id" element={<IssueDetailPage />} />
          <Route
            path="issues/:id/edit"
            element={
              <ProtectedRoute>
                <EditIssuePage />
              </ProtectedRoute>
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
