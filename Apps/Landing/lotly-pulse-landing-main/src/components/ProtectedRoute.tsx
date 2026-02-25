import { Navigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredModule: 'post' | 'value';
}

export const ProtectedRoute = ({ children, requiredModule }: ProtectedRouteProps) => {
  const [loading, setLoading] = useState(true);
  const [hasAccess, setHasAccess] = useState(false);

  useEffect(() => {
    const checkAccess = async () => {
      // 1. Check if a session exists
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        setLoading(false);
        return;
      }

      // 2. Fetch user roles from the Neon-backed user_roles table
      const { data: roles, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', session.user.id);

      if (error) {
        console.error("Error fetching roles:", error);
        setLoading(false);
        return;
      }

      if (roles && roles.length > 0) {
        const userRoles = roles.map(r => r.role);
        
        // 3. Logic: Super Admins get in everywhere. 
        // Others must have the specific role for the module.
        const isSuperAdmin = userRoles.includes('super_admin');
        const hasPostRole = userRoles.includes('dealer_admin') || userRoles.includes('dealer_user');
        // Note: You can differentiate 'post' vs 'value' specifically 
        // if you add those specific roles to your Enum later.
        
        if (isSuperAdmin) {
          setHasAccess(true);
        } else if (requiredModule === 'post' && hasPostRole) {
          setHasAccess(true);
        } else if (requiredModule === 'value' && userRoles.includes('dealer_value_user')) {
          // Placeholder for when you add value-specific roles
          setHasAccess(true);
        }
      }
      
      setLoading(false);
    };

    checkAccess();
  }, [requiredModule]);

  // Loading State
  if (loading) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-slate-950 text-white">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mb-4"></div>
        <div className="text-xl font-bold italic tracking-widest animate-pulse">PULSE SYNCING...</div>
      </div>
    );
  }

  // 4. Redirect to landing page if access is denied
  if (!hasAccess) {
    console.warn(`Access denied for module: ${requiredModule}`);
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};