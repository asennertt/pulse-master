import { BrowserRouter, Routes, Route, Navigate, useSearchParams } from "react-router-dom";
import { AuthProvider } from "./Contexts/AuthContext";
import { ProtectedRoute } from "./Contexts/ProtectedRoute";

// Pages
import Auth from "./pages/Auth";
import PostDashboard from "./pages/PostDashboard";
import Admin from "./pages/Admin";
import SuperAdmin from "./pages/SuperAdmin";
import Onboarding from "./pages/Onboarding";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import TermsOfService from "./pages/TermsOfService";
import NotFound from "./pages/NotFound";

/**
 * Redirects / → /auth while preserving all query-string parameters.
 * This is critical for the cross-domain auth flow: the Landing page
 * sends access_token + refresh_token as query params, and a plain
 * <Navigate to="/auth" replace /> would strip them.
 */
function RedirectToAuth() {
  const [searchParams] = useSearchParams();
  const qs = searchParams.toString();
  const target = qs ? `/auth?${qs}` : "/auth";
  return <Navigate to={target} replace />;
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* PUBLIC ROUTES */}
          <Route path="/auth" element={<Auth />} />
          <Route path="/" element={<RedirectToAuth />} />

          {/* PROTECTED ROUTES */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <PostDashboard />
              </ProtectedRoute>
            }
          />

          <Route
            path="/onboarding"
            element={
              <ProtectedRoute>
                <Onboarding />
              </ProtectedRoute>
            }
          />

          {/* ADMIN ROUTES */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute>
                <Admin />
              </ProtectedRoute>
            }
          />

          <Route
            path="/super-admin"
            element={
              <ProtectedRoute requireSuperAdmin>
                <SuperAdmin />
              </ProtectedRoute>
            }
          />

          {/* LEGAL */}
          <Route path="/privacy" element={<PrivacyPolicy />} />
          <Route path="/terms" element={<TermsOfService />} />

          {/* 404 CATCH-ALL */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
