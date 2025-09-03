import { useAuth } from '@/hooks/use-auth';
import { useImpersonation } from '@/contexts/impersonation-context';
import { UserRole } from '@/lib/role-utils';
import type { User } from '@shared/schema';

/**
 * Hook that provides authentication with impersonation support
 * Returns effective user data taking impersonation into account
 */
export function useEffectiveAuth() {
  const { user, isLoading, error, loginMutation, logoutMutation, registerMutation } = useAuth();
  const { effectiveRole, isImpersonating, actualRole } = useImpersonation();

  // Create effective user based on impersonation
  const effectiveUser = user && effectiveRole ? 
    { ...user, role: effectiveRole } : user;

  const userRole = effectiveRole || (user?.role as UserRole);

  return {
    user,
    effectiveUser: effectiveUser as User | null,
    userRole,
    isLoading,
    error,
    loginMutation,
    logoutMutation,
    registerMutation,
    isImpersonating,
    actualRole,
    effectiveRole,
    // Helper functions for common role checks
    isHeadAdmin: userRole === 'head_admin',
    isSalesAdmin: userRole === 'sales_admin',
    isProjectAdmin: userRole === 'project_admin',
    isSalesPerson: userRole === 'sales_person',
    canViewPrices: userRole === 'head_admin' || userRole === 'sales_admin',
    canManagePrices: userRole === 'head_admin' || userRole === 'sales_admin',
    canManageProjects: userRole === 'head_admin' || userRole === 'project_admin',
    canManageUsers: userRole === 'head_admin' || userRole === 'sales_admin',
  };
}