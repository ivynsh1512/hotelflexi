export interface Env {
  DB: D1Database;
  ADMIN_EMAILS?: string;
  RAZORPAY_KEY_ID?: string;
  RAZORPAY_KEY_SECRET?: string;
  RAZORPAY_WEBHOOK_SECRET?: string;
  AI_PROVIDER_API_KEY?: string;
  ENVIRONMENT?: string;
  API_BASE?: string;
  APP_NAME?: string;
}

export interface AuthUser {
  uid: string;
  email: string;
  email_verified: boolean;
  name?: string;
  picture?: string;
}

export type TenantRole = 
  | 'owner' 
  | 'manager' 
  | 'receptionist' 
  | 'accountant' 
  | 'housekeeping' 
  | 'read_only';

export interface TenantMembership {
  id: string;
  tenant_id: string;
  user_id: string;
  role: TenantRole;
  permissions?: string;
  tenant_name?: string;
  account_access_status?: string;
  subscription_status?: string;
}

export interface AppVariables {
  user?: AuthUser;
  membership?: TenantMembership;
  tenantId?: string;
  propertyId?: string;
  requestId: string;
}
