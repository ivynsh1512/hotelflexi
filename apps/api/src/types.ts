export interface Env {
  DB: D1Database;
  ADMIN_EMAILS?: string;
  RAZORPAY_KEY_ID?: string;
  RAZORPAY_KEY_SECRET?: string;
  RAZORPAY_WEBHOOK_SECRET?: string;
  AI_PROVIDER_API_KEY?: string;
  RESEND_API_KEY?: string;
  RESEND_FROM_EMAIL?: string;
  ADMIN_NOTIFICATION_EMAIL?: string;
  PLAY_STORE_APP_URL?: string;
  ENVIRONMENT?: string;
  API_BASE?: string;
  APP_NAME?: string;
}

export interface AuthUser {
  uid: string;
  email: string;
  email_verified: boolean;
  sign_in_provider?: string; // 'google.com', 'password', 'phone', etc.
  name?: string;
  picture?: string;
  phone?: string;
  is_platform_admin?: boolean;
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

export interface ConnectivityPartnerContext {
  id: string;
  tenantId: string;
  partnerName: string;
  partnerCode: string;
  mode: 'production' | 'sandbox';
  rateLimitPerMinute: number;
}

export interface AppVariables {
  user?: AuthUser;
  membership?: TenantMembership;
  tenantId?: string;
  propertyId?: string;
  requestId: string;
  connectivityPartner?: ConnectivityPartnerContext;
}
