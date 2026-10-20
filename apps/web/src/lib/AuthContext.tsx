'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, onAuthStateChanged, signOut as fbSignOut } from 'firebase/auth';
import { auth } from './firebase';
import { apiClient } from './api';

export interface TenantSummary {
  membership_id: string;
  role: string;
  tenant_id: string;
  tenant_name: string;
  tenant_slug: string;
  account_access_status: string;
  subscription_status: string;
  current_plan_id: string;
  trial_ends_at?: number;
  current_period_ends_at?: number;
  suspension_reason?: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  tenantsLoaded: boolean;
  isPlatformAdmin: boolean;
  tenants: TenantSummary[];
  currentTenant: TenantSummary | null;
  setCurrentTenant: (t: TenantSummary | null) => void;
  refreshUser: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  tenantsLoaded: false,
  isPlatformAdmin: false,
  tenants: [],
  currentTenant: null,
  setCurrentTenant: () => {},
  refreshUser: async () => {},
  logout: async () => {},
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [tenantsLoaded, setTenantsLoaded] = useState(false);
  const [isPlatformAdmin, setIsPlatformAdmin] = useState(false);
  const [tenants, setTenants] = useState<TenantSummary[]>([]);
  const [currentTenant, setCurrentTenantState] = useState<TenantSummary | null>(null);

  const setCurrentTenant = (t: TenantSummary | null) => {
    setCurrentTenantState(t);
    if (t) {
      localStorage.setItem('hotelflexi_tenant_id', t.tenant_id);
    } else {
      localStorage.removeItem('hotelflexi_tenant_id');
    }
  };

  const syncAndFetchUser = async (fbUser: User) => {
    try {
      // 1. Sync user to D1 (non-blocking if already synced)
      await apiClient('/auth/sync', {
        method: 'POST',
        body: JSON.stringify({
          name: fbUser.displayName,
          picture: fbUser.photoURL,
        }),
      }).catch((e) => console.warn('User sync warning (non-fatal):', e));

      // 2. Fetch profile & memberships
      const data = await apiClient('/auth/me');
      setIsPlatformAdmin(Boolean(data.user?.isPlatformAdmin));
      const tenantList: TenantSummary[] = data.tenants || [];
      setTenants(tenantList);

      if (tenantList.length > 0) {
        const savedTenantId = localStorage.getItem('hotelflexi_tenant_id');
        const matched = tenantList.find((t) => t.tenant_id === savedTenantId);
        setCurrentTenant(matched || tenantList[0]);
      } else {
        setCurrentTenant(null);
      }
    } catch (e) {
      console.error('Error fetching user context from backend:', e);
    } finally {
      setTenantsLoaded(true);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      setLoading(true);
      setUser(fbUser);
      if (fbUser) {
        await syncAndFetchUser(fbUser);
      } else {
        setIsPlatformAdmin(false);
        setTenants([]);
        setCurrentTenant(null);
        setTenantsLoaded(true);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const refreshUser = async () => {
    if (auth.currentUser) {
      await auth.currentUser.reload().catch(() => {});
      setUser(auth.currentUser);
      await syncAndFetchUser(auth.currentUser);
    }
  };

  const logout = async () => {
    await fbSignOut(auth);
    localStorage.removeItem('hotelflexi_tenant_id');
    setUser(null);
    setCurrentTenant(null);
    setTenants([]);
    setTenantsLoaded(true);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        tenantsLoaded,
        isPlatformAdmin,
        tenants,
        currentTenant,
        setCurrentTenant,
        refreshUser,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
