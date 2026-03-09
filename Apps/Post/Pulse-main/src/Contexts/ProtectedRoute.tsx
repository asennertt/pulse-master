import { ReactNode, useEffect } from "react";
import { useAuth } from "./AuthContext"; // Ensure this path points to your AuthContext file
import { useNavigate, useLocation } from "react-router-dom";
import { Loader2 } from "lucide-react"; // Common in many setups, or replace with your spinner

interface ProtectedRouteProps {
  children: ReactNode;
  requireSuperAdmin?: boolean;
  requireDealerAdmin?: boolean;
  requireSubscription?: boolean;
}

export const ProtectedRoute = ({ 
  children, 
  requireSuperAdmin, 
  requireDealerAdmin,
  requireSubscription 
}: ProtectedRouteProps) => {
  const { user, loading, isSuperAdmin, isDealerAdmin, subscribed } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Determine login redirect based on current path
  const isPlatformRoute = location.pathname.startsWith("/platform");
  const loginPath = isPlatformRoute ? "/platform" : "/auth";

  useEffect(() => {
    // Wait until the AuthProvider has finished checking the session and roles
    if (!loading) {
      if (!user) {
        // 1. Not logged in? Go to appropriate login
        navigate(loginPath); 
      } else if (requireSuperAdmin && !isSuperAdmin) {
        // 2. Needs Super Admin but doesn't have it
        navigate(isPlatformRoute ? "/platform" : "/"); 
      } else if (requireDealerAdmin && !isDealerAdmin && !isSuperAdmin) {
        // 3. Needs Dealer Admin (Super Admins bypass this)
        navigate("/");
      } else if (requireSubscription && !subscribed && !isSuperAdmin) {
        // 4. Needs active sub (Super Admins bypass this)
        navigate("/billing");
      }
    }
  }, [user, loading, isSuperAdmin, isDealerAdmin, subscribed, navigate, requireSuperAdmin, requireDealerAdmin, requireSubscription, loginPath, isPlatformRoute]);

  // While checking the database, show a full-screen loader
  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-blue-600" />
      </div>
    );
  }

  // If we passed all checks, render the page; otherwise, render nothing (redirecting)
  return user ? <>{children}</> : null;
};