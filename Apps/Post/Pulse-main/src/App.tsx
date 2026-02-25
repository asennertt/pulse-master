import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./Contexts/AuthContext";
import { ProtectedRoute } from "./Contexts/ProtectedRoute";

// Import your pages (paths may vary based on your structure)
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import AdminPanel from "./pages/AdminPanel";
import Inventory from "./pages/Inventory";
import Billing from "./pages/Billing";
import NotFound from "./pages/NotFound";

function App() {
  return (
    <BrowserRouter>
      {/* 1. Wrap the entire app in AuthProvider so useAuth() works everywhere */}
      <AuthProvider>
        <Routes>
          {/* PUBLIC ROUTES */}
          <Route path="/auth" element={<Auth />} />
          <Route path="/" element={<Index />} />

          {/* GENERAL PROTECTED ROUTES (Any logged-in user) */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />

          {/* DEALER ADMIN + SUBSCRIBED ONLY */}
          <Route
            path="/inventory"
            element={
              <ProtectedRoute requireDealerAdmin requireSubscription>
                <Inventory />
              </ProtectedRoute>
            }
          />

          {/* BILLING (Protected but doesn't require subscription to view) */}
          <Route
            path="/billing"
            element={
              <ProtectedRoute>
                <Billing />
              </ProtectedRoute>
            }
          />

          {/* SUPER ADMIN ONLY */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute requireSuperAdmin>
                <AdminPanel />
              </ProtectedRoute>
            }
          />

          {/* 404 CATCH-ALL */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;