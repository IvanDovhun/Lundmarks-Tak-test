import React from "react";
import { useEffectiveAuth } from "@/hooks/use-effective-auth";
import { UserRole } from "@/lib/role-utils";
import HeadAdminDashboard from "./head-admin-dashboard";
import SalesAdminDashboard from "./sales-admin-dashboard";
import ProjectLeaderDashboard from "./project-leader-dashboard";
import SalesPersonDashboard from "./sales-person-dashboard";

const DashboardPage: React.FC = () => {
  const { user, userRole, isLoading } = useEffectiveAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!user || !userRole) {
    return (
      <div className="container mx-auto p-6">
        <h1 className="text-2xl font-bold text-red-600">Fel: Användarroll saknas</h1>
        <p>Kontakta administratör för att tilldela en roll.</p>
      </div>
    );
  }

  // Route to the appropriate dashboard based on effective user role (including impersonation)
  switch (userRole) {
    case 'head_admin':
      return <HeadAdminDashboard />;
    case 'sales_admin':
      return <SalesAdminDashboard />;
    case 'project_admin':
      return <ProjectLeaderDashboard />;
    case 'sales_person':
      return <SalesPersonDashboard />;
    default:
      return (
        <div className="container mx-auto p-6">
          <h1 className="text-2xl font-bold text-red-600">Okänd användarroll: {userRole}</h1>
          <p>Kontakta administratör för hjälp.</p>
        </div>
      );
  }
};

export default DashboardPage;