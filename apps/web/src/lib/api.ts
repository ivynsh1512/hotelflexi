import { auth } from './firebase';

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  (typeof window !== 'undefined' && window.location.hostname === 'localhost'
    ? 'http://127.0.0.1:8787/api/v1'
    : 'https://hotelflexi.divyansh-shukla.workers.dev/api/v1');

export interface ApiFetchOptions extends RequestInit {
  tenantId?: string;
}

export async function apiClient<T = any>(
  endpoint: string,
  options: ApiFetchOptions = {}
): Promise<T> {
  const url = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${endpoint.startsWith('/') ? '' : '/'}${endpoint}`;
  
  const headers = new Headers(options.headers || {});
  if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  // Attach Firebase ID Token if logged in
  if (auth.currentUser) {
    try {
      const idToken = await auth.currentUser.getIdToken();
      headers.set('Authorization', `Bearer ${idToken}`);
    } catch (e) {
      console.warn('Failed to retrieve Firebase ID token:', e);
    }
  }

  // Attach Tenant ID if provided or present in localStorage
  const activeTenantId =
    options.tenantId ||
    (typeof window !== 'undefined' ? localStorage.getItem('hotelflexi_tenant_id') : null);

  if (activeTenantId && !headers.has('X-Tenant-ID')) {
    headers.set('X-Tenant-ID', activeTenantId);
  }

  const res = await fetch(url, {
    ...options,
    headers,
  });

  const data = await res.json().catch(() => null);

  if (!res.ok) {
    const errorMsg = data?.error || data?.message || `HTTP Error ${res.status}`;
    const err: any = new Error(errorMsg);
    err.status = res.status;
    err.code = data?.code;
    err.data = data;
    throw err;
  }

  return data as T;
}

export function formatINR(paise: number = 0): string {
  const rupees = Math.round(paise) / 100;
  return `₹${rupees.toLocaleString('en-IN')}`;
}
