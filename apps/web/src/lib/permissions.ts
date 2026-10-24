// HotelFlexi Role-Based Access Control (RBAC) System
// Roles: owner, manager, receptionist (front-desk), housekeeping, accountant, read_only

export type UserRole =
  | 'owner'
  | 'manager'
  | 'receptionist'
  | 'front_desk'
  | 'housekeeping'
  | 'accountant'
  | 'read_only';

export interface RolePermissions {
  canManageBookings: boolean;
  canViewBookings: boolean;
  canManageRooms: boolean;
  canManageRates: boolean;
  canManageChannels: boolean;
  canManageBilling: boolean;
  canManageTeam: boolean;
  canManageSettings: boolean;
  canManageHousekeeping: boolean;
  canManageMaintenance: boolean;
  canViewComplaints: boolean;
}

export const ROLE_PERMISSIONS: Record<string, RolePermissions> = {
  owner: {
    canManageBookings: true,
    canViewBookings: true,
    canManageRooms: true,
    canManageRates: true,
    canManageChannels: true,
    canManageBilling: true,
    canManageTeam: true,
    canManageSettings: true,
    canManageHousekeeping: true,
    canManageMaintenance: true,
    canViewComplaints: true,
  },
  manager: {
    canManageBookings: true,
    canViewBookings: true,
    canManageRooms: true,
    canManageRates: true,
    canManageChannels: true,
    canManageBilling: true,
    canManageTeam: true,
    canManageSettings: true,
    canManageHousekeeping: true,
    canManageMaintenance: true,
    canViewComplaints: true,
  },
  receptionist: {
    canManageBookings: true,
    canViewBookings: true,
    canManageRooms: false,
    canManageRates: false,
    canManageChannels: false,
    canManageBilling: true, // front-desk invoicing & payments
    canManageTeam: false,
    canManageSettings: false,
    canManageHousekeeping: true,
    canManageMaintenance: true,
    canViewComplaints: true,
  },
  front_desk: {
    canManageBookings: true,
    canViewBookings: true,
    canManageRooms: false,
    canManageRates: false,
    canManageChannels: false,
    canManageBilling: true,
    canManageTeam: false,
    canManageSettings: false,
    canManageHousekeeping: true,
    canManageMaintenance: true,
    canViewComplaints: true,
  },
  accountant: {
    canManageBookings: false,
    canViewBookings: true,
    canManageRooms: false,
    canManageRates: false,
    canManageChannels: false,
    canManageBilling: true,
    canManageTeam: false,
    canManageSettings: false,
    canManageHousekeeping: false,
    canManageMaintenance: false,
    canViewComplaints: false,
  },
  housekeeping: {
    canManageBookings: false,
    canViewBookings: false,
    canManageRooms: false,
    canManageRates: false,
    canManageChannels: false,
    canManageBilling: false,
    canManageTeam: false,
    canManageSettings: false,
    canManageHousekeeping: true,
    canManageMaintenance: true,
    canViewComplaints: true,
  },
  read_only: {
    canManageBookings: false,
    canViewBookings: true,
    canManageRooms: false,
    canManageRates: false,
    canManageChannels: false,
    canManageBilling: false,
    canManageTeam: false,
    canManageSettings: false,
    canManageHousekeeping: false,
    canManageMaintenance: false,
    canViewComplaints: true,
  },
};

// Route whitelist per role
export const ROLE_ALLOWED_ROUTES: Record<string, string[]> = {
  owner: ['*'],
  manager: ['*'],
  receptionist: [
    '/app',
    '/app/reservations',
    '/app/calendar',
    '/app/guests',
    '/app/reviews',
    '/app/housekeeping',
    '/app/laundry',
    '/app/food',
    '/app/maintenance',
    '/app/complaints',
    '/app/billing',
    '/app/payments',
    '/app/dining',
    '/app/wedding',
    '/app/addons',
    '/app/notifications',
    '/app/support',
  ],
  front_desk: [
    '/app',
    '/app/reservations',
    '/app/calendar',
    '/app/guests',
    '/app/reviews',
    '/app/housekeeping',
    '/app/laundry',
    '/app/food',
    '/app/maintenance',
    '/app/complaints',
    '/app/billing',
    '/app/payments',
    '/app/dining',
    '/app/wedding',
    '/app/addons',
    '/app/notifications',
    '/app/support',
  ],
  accountant: [
    '/app',
    '/app/billing',
    '/app/payments',
    '/app/expenses',
    '/app/accounting',
    '/app/tally',
    '/app/taxes',
    '/app/reports',
    '/app/notifications',
    '/app/support',
  ],
  housekeeping: [
    '/app/housekeeping',
    '/app/laundry',
    '/app/food',
    '/app/maintenance',
    '/app/complaints',
    '/app/notifications',
    '/app/support',
  ],
  read_only: [
    '/app',
    '/app/calendar',
    '/app/reservations',
    '/app/rooms',
    '/app/reports',
    '/app/notifications',
  ],
};

export function getRolePermissions(role?: string): RolePermissions {
  const norm = (role || 'owner').toLowerCase();
  return ROLE_PERMISSIONS[norm] || ROLE_PERMISSIONS.owner;
}

export function isRouteAllowedForRole(role: string = 'owner', pathname: string): boolean {
  const norm = (role || 'owner').toLowerCase();
  const allowed = ROLE_ALLOWED_ROUTES[norm] || ROLE_ALLOWED_ROUTES.owner;
  if (allowed.includes('*')) return true;

  return allowed.some(
    (allowedRoute) => pathname === allowedRoute || pathname.startsWith(allowedRoute + '/')
  );
}
