import { ReactNode, useEffect } from "react";
import { useAuth } from "./AuthContext"; // Ensure this path points to your AuthContext file
import { useNavigate } from "react-router-dom";
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

  useEffect(() => {
    // Wait until the AuthProvider has finished checking the session and roles
    if (!loading) {
      if (!user) {
        // 1. Not logged in? Go to login
        navigate("/auth"); 
      } else if (requireSuperAdmin && !isSuperAdmin) {
        // 2. Needs Super Admin but doesn't have it
        navigate("/"); 
      } else if (requireDealerAdmin && !isDealerAdmin && !isSuperAdmin) {
        // 3. Needs Dealer Admin (Super Admins bypass this)
        navigate("/");
      } else if (requireSubscription && !subscribed && !isSuperAdmin) {
        // 4. Needs active sub (Super Admins bypass this)
        navigate("/billing");
      }
    }
  }, [user, loading, isSuperAdmin, isDealerAdmin, subscribed, navigate, requireSuperAdmin, requireDealerAdmin, requireSubscription]);

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