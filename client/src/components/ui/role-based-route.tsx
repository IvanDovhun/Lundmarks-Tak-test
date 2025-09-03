import React from 'react';
import { Route, RouteProps } from 'wouter';
import { useEffectiveAuth } from '@/hooks/use-effective-auth';
import { canAccessRoute, UserRole } from '@/lib/role-utils';
import { Card, CardContent } from '@/components/ui/card';
import { AlertTriangle } from 'lucide-react';

interface RoleBasedRouteProps extends RouteProps {
  component: React.ComponentType<any>;
  path: string;
  requiredRole?: UserRole | UserRole[];
}

const AccessDenied: React.FC = () => (
  <div className="container mx-auto p-6 max-w-2xl">
    <Card className="border-red-200 bg-red-50">
      <CardContent className="p-8 text-center">
        <AlertTriangle className="w-16 h-16 mx-auto mb-4 text-red-500" />
        <h2 className="text-2xl font-bold text-red-800 mb-2">Åtkomst nekad</h2>
        <p className="text-red-600 mb-4">
          Du har inte behörighet att komma åt denna sida.
        </p>
        <p className="text-sm text-red-500">
          Kontakta din administratör om du tror att detta är ett fel.
        </p>
      </CardContent>
    </Card>
  </div>
);

export const RoleBasedRoute: React.FC<RoleBasedRouteProps> = ({ 
  component: Component, 
  path, 
  requiredRole,
  ...props 
}) => {
  const { user, userRole, isLoading } = useEffectiveAuth();

  return (
    <Route 
      path={path} 
      {...props}
    >
      {(params) => {
        // Show loading while checking auth
        if (isLoading) {
          return (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            </div>
          );
        }

        // Check if user exists and has role
        if (!user || !user.role) {
          return <AccessDenied />;
        }

        // Check specific role requirements if provided
        if (requiredRole) {
          const allowedRoles = Array.isArray(requiredRole) ? requiredRole : [requiredRole];
          if (!allowedRoles.includes(userRole)) {
            return <AccessDenied />;
          }
        }

        // Check general route access
        if (!canAccessRoute(userRole, path)) {
          return <AccessDenied />;
        }

        // Render the component if access is granted
        return <Component {...params} />;
      }}
    </Route>
  );
};