// Role definitions and permissions
export type UserRole = 'head_admin' | 'sales_admin' | 'project_admin' | 'sales_person';

export interface RolePermissions {
  canViewAdmin: boolean;
  canManageUsers: boolean;
  canViewReports: boolean;
  canManageProjects: boolean;
  canViewAllDeals: boolean;
  canViewGanttPlanning: boolean;
  canViewTVDisplay: boolean;
  canManagePrices: boolean;
  canViewAnalytics: boolean;
  canViewCalculator: boolean;
  canViewDemos: boolean;

  canViewMaterialManagement: boolean;
  canViewSettings: boolean;
}

export const rolePermissions: Record<UserRole, RolePermissions> = {
  head_admin: {
    canViewAdmin: true,
    canManageUsers: true,
    canViewReports: true,
    canManageProjects: true,
    canViewAllDeals: true,
    canViewGanttPlanning: true,
    canViewTVDisplay: true,
    canManagePrices: true,
    canViewAnalytics: true,
    canViewCalculator: true,
    canViewDemos: true,
    canViewMaterialManagement: true,
    canViewSettings: true,
  },
  sales_admin: {
    canViewAdmin: true,
    canManageUsers: true,
    canViewReports: true,
    canManageProjects: false,
    canViewAllDeals: true,
    canViewGanttPlanning: false,
    canViewTVDisplay: false,
    canManagePrices: true,
    canViewAnalytics: true,
    canViewCalculator: true,
    canViewDemos: true,
    canViewMaterialManagement: false,
    canViewSettings: true,
  },
  project_admin: {
    canViewAdmin: false,
    canManageUsers: false,
    canViewReports: true,
    canManageProjects: true,
    canViewAllDeals: true,
    canViewGanttPlanning: true,
    canViewTVDisplay: true,
    canManagePrices: false,
    canViewAnalytics: true,
    canViewCalculator: false,
    canViewDemos: false,
    canViewMaterialManagement: true,
    canViewSettings: false,
  },
  sales_person: {
    canViewAdmin: false,
    canManageUsers: false,
    canViewReports: false,
    canManageProjects: false,
    canViewAllDeals: false, // Only their own deals
    canViewGanttPlanning: false,
    canViewTVDisplay: false,
    canManagePrices: false,
    canViewAnalytics: false,
    canViewCalculator: true,
    canViewDemos: true,

    canViewMaterialManagement: false,
    canViewSettings: false,
  },
};

export const getRoleDisplayName = (role: UserRole): string => {
  switch (role) {
    case 'head_admin':
      return 'Teknikchef/Huvudadmin';
    case 'sales_admin':
      return 'Säljchef';
    case 'project_admin':
      return 'Projektledare';
    case 'sales_person':
      return 'Säljare';
    default:
      return 'Okänd roll';
  }
};

export const hasPermission = (userRole: UserRole, permission: keyof RolePermissions): boolean => {
  return rolePermissions[userRole][permission];
};

export const canAccessRoute = (userRole: UserRole, route: string): boolean => {
  const permissions = rolePermissions[userRole];
  
  switch (route) {
    case '/admin':
      return permissions.canViewAdmin;
    case '/reports':
    case '/analytics':
      return permissions.canViewReports || permissions.canViewAnalytics;
    case '/project-management':
    case '/project-management-v2':
    case '/project-leader':
    case '/project-leader-zendesk':
      return permissions.canManageProjects;
    case '/planning-gantt':
    case '/planning':
      return permissions.canViewGanttPlanning;
    case '/tv-display':
      return permissions.canViewTVDisplay;
    case '/calculator':
      return permissions.canViewCalculator;
    case '/demos':
      return permissions.canViewDemos;
    case '/deals':
    case '/crm':
      return permissions.canViewCRM || permissions.canViewAllDeals;
    case '/material-management':
      return permissions.canViewMaterialManagement;
    case '/settings':
      return permissions.canViewSettings;
    case '/employees':
      return permissions.canManageUsers;
    default:
      return true; // Allow access to common routes like dashboard, profile, etc.
  }
};