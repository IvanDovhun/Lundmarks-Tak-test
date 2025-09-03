import { QueryClientProvider } from "@tanstack/react-query";
import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from "@/hooks/use-auth";
import { CityProvider } from "@/contexts/city-context";
import { ImpersonationProvider } from "@/contexts/impersonation-context";
import { ProtectedRoute } from "./lib/protected-route";
import { RoleBasedRoute } from "./components/ui/role-based-route";


import NotFound from "@/pages/not-found";
import AuthPage from "@/pages/auth-page";
import CalculatorPage from "@/pages/calculator-page";
import AdminDashboard from "@/pages/admin-dashboard";
import DemonstrationsPage from "@/pages/demonstrations-page";
import DealsPage from "@/pages/deals-page";
import KanbanDealsPage from "@/pages/kanban-deals-page";

import MontagePage from "./pages/montage-page";
import FillFormPage from "./pages/fill-form-page";
import RevisedCalculationForm from "./pages/revised-calculation-form";
import ProjectManagementPage from "./pages/project-management-page";
import SchedulePage from "./pages/schedule-page";
import ScheduleTVPage from "./pages/schedule-tv-page";
import MaterialManagementPage from "./pages/material-management-page";
import SettingsPage from "./pages/settings-page";
import ReportsPage from "./pages/reports-page";
import NotificationsPage from "./pages/notifications-page";
import ProfilePage from "./pages/profile-page";
import ScrollToTop from './components/ui/scrolltotop';
import DashboardPage from "./pages/dashboard-page";
import AnalyticsPage from "./pages/analytics-page";
import EmployeeManagementPage from "./pages/employee-management-page";
import ProjectManagementV2Page from "./pages/project-management-v2-page";
import ProjectLeaderDashboard from "./pages/project-leader-dashboard";
import ProjectLeaderZendesk from "./pages/project-leader-zendesk";
import PlanningGantt from "./pages/planning-gantt";
import PlanningPage from "./pages/planning-page";
import TVDisplayPage from "./pages/tv-display";
import SalesPersonDashboard from "./pages/sales-person-dashboard";
import SystemSettingsPage from "./pages/system-settings-page";
import CustomerRegistry from "./pages/customer-registry";


function Router() {
  return (
    <>
      <ScrollToTop />
      <Switch>
        <Route path="/auth" component={AuthPage} />
        <Route path="/" component={DashboardPage} />
        <ProtectedRoute path="/calculator" component={CalculatorPage} />
        <ProtectedRoute path="/demos" component={DemonstrationsPage} />
        <RoleBasedRoute path="/admin" component={AdminDashboard} requiredRole={["head_admin", "sales_admin"]} />
        <ProtectedRoute path="/deals" component={DealsPage} />
        <ProtectedRoute path="/customer-registry" component={CustomerRegistry} />
        <ProtectedRoute path="/projects" component={MontagePage} />
        <ProtectedRoute path="/revised-calculation" component={RevisedCalculationForm} />
        <ProtectedRoute path="/revised-calculation/:id" component={RevisedCalculationForm} />
        <RoleBasedRoute path="/project-management" component={ProjectManagementPage} requiredRole={["head_admin", "project_admin"]} />
        <RoleBasedRoute path="/project-management-v2" component={ProjectManagementV2Page} requiredRole={["head_admin", "project_admin"]} />
        <RoleBasedRoute path="/project-leader" component={ProjectLeaderDashboard} requiredRole={["head_admin", "project_admin"]} />
        <RoleBasedRoute path="/project-leader-zendesk" component={ProjectLeaderZendesk} requiredRole={["head_admin", "project_admin"]} />
        <RoleBasedRoute path="/planning" component={PlanningGantt} requiredRole={["head_admin", "project_admin"]} />
        <RoleBasedRoute path="/planning-gantt" component={PlanningGantt} requiredRole={["head_admin", "project_admin"]} />
        <RoleBasedRoute path="/tv-display" component={TVDisplayPage} requiredRole={["head_admin", "project_admin"]} />
        <ProtectedRoute path="/schedule" component={SchedulePage} />
        <ProtectedRoute path="/schedule/tv" component={ScheduleTVPage} />
        <RoleBasedRoute path="/material-management" component={MaterialManagementPage} requiredRole={["head_admin", "project_admin"]} />
        <RoleBasedRoute path="/settings" component={SettingsPage} requiredRole={["head_admin", "sales_admin"]} />
        <RoleBasedRoute path="/system-settings" component={SystemSettingsPage} requiredRole={["head_admin"]} />
        <RoleBasedRoute path="/reports" component={ReportsPage} requiredRole={["head_admin", "sales_admin", "project_admin"]} />
        <RoleBasedRoute path="/analytics" component={AnalyticsPage} requiredRole={["head_admin", "sales_admin", "project_admin"]} />
        <RoleBasedRoute path="/employees" component={EmployeeManagementPage} requiredRole={["head_admin", "sales_admin"]} />
        <ProtectedRoute path="/notifications" component={NotificationsPage} />
        <ProtectedRoute path="/profile" component={ProfilePage} />
        <Route component={NotFound} />
      </Switch>
    </>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <ImpersonationProvider>
          <CityProvider>
            <Router />
            <Toaster />
          </CityProvider>
        </ImpersonationProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;