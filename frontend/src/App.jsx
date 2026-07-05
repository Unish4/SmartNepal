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

// Public only route - redirects authenticated users away from auth pages
const PublicOnlyRoute = ({ children }) => {
  const { isAuthenticated } = useAuthStore();
  return isAuthenticated ? <Navigate to="/" replace /> : children;
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
        <Route path="/" element={<Layout />}>
          {/* Public routes */}
          <Route index element={<HomePage />} />

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
