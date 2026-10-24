'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/lib/AuthContext';
import {
  Users,
  Shield,
  CheckCircle2,
  Lock,
  UserPlus,
  Mail,
  Trash2,
  Clock,
  Sparkles,
  AlertCircle,
  X,
  BadgeCheck,
} from 'lucide-react';

interface TeamMember {
  membership_id: string;
  user_id: string;
  role: string;
  joined_at: number;
  email: string;
  full_name: string;
  phone: string | null;
  avatar_url: string | null;
}

interface TeamInvitation {
  id: string;
  email: string;
  role: string;
  full_name: string | null;
  status: string;
  created_at: number;
  invited_by_name: string | null;
}

export default function TeamPage() {
  const { user, currentTenant } = useAuth();
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [invitations, setInvitations] = useState<TeamInvitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Modal state
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteName, setInviteName] = useState('');
  const [inviteRole, setInviteRole] = useState('receptionist');
  const [submitting, setSubmitting] = useState(false);

  const fetchTeam = async () => {
    if (!currentTenant?.tenant_id) return;
    try {
      setLoading(true);
      setError(null);
      const token = await user?.getIdToken();
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE || 'https://hotelflexi.divyansh-shukla.workers.dev'}/api/v1/team/members`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'X-Tenant-ID': currentTenant.tenant_id,
        },
      });

      if (!res.ok) {
        throw new Error('Failed to fetch team members');
      }

      const data = await res.json();
      setMembers(data.members || []);
      setInvitations(data.invitations || []);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Error loading team data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user && currentTenant) {
      fetchTeam();
    }
  }, [user, currentTenant]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && showInviteModal) {
        setShowInviteModal(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showInviteModal]);

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail.trim()) return;

    try {
      setSubmitting(true);
      setError(null);
      setSuccessMsg(null);
      const token = await user?.getIdToken();

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE || 'https://hotelflexi.divyansh-shukla.workers.dev'}/api/v1/team/invite`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
          'X-Tenant-ID': currentTenant!.tenant_id,
        },
        body: JSON.stringify({
          email: inviteEmail.trim().toLowerCase(),
          fullName: inviteName.trim() || undefined,
          role: inviteRole,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to send invitation');
      }

      setSuccessMsg(data.message || 'Staff member invited successfully!');
      setShowInviteModal(false);
      setInviteEmail('');
      setInviteName('');
      setInviteRole('receptionist');
      await fetchTeam();
    } catch (err: any) {
      setError(err.message || 'Could not invite staff member');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRemoveMember = async (membershipId: string, memberName: string) => {
    if (!confirm(`Are you sure you want to remove ${memberName} from this property?`)) return;

    try {
      const token = await user?.getIdToken();
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE || 'https://hotelflexi.divyansh-shukla.workers.dev'}/api/v1/team/members/${membershipId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
          'X-Tenant-ID': currentTenant!.tenant_id,
        },
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to remove member');
      }

      setSuccessMsg('Staff member removed successfully');
      await fetchTeam();
    } catch (err: any) {
      alert(err.message || 'Failed to remove member');
    }
  };

  const handleRevokeInvite = async (invitationId: string) => {
    try {
      const token = await user?.getIdToken();
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE || 'https://hotelflexi.divyansh-shukla.workers.dev'}/api/v1/team/invitations/${invitationId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
          'X-Tenant-ID': currentTenant!.tenant_id,
        },
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to revoke invite');
      }

      await fetchTeam();
    } catch (err: any) {
      alert(err.message || 'Failed to revoke invitation');
    }
  };

  const matrix = [
    { module: 'Room Calendar & Check-in', owner: true, manager: true, receptionist: true, accountant: false, housekeeping: false },
    { module: 'Create & Modify Reservations', owner: true, manager: true, receptionist: true, accountant: false, housekeeping: false },
    { module: 'Room Blocking & Maintenance', owner: true, manager: true, receptionist: true, accountant: false, housekeeping: false },
    { module: 'Issue GST Invoices & Receipts', owner: true, manager: true, receptionist: true, accountant: true, housekeeping: false },
    { module: 'Housekeeping Task Assignment', owner: true, manager: true, receptionist: true, accountant: false, housekeeping: true },
    { module: 'Operational Expenses Entry', owner: true, manager: true, receptionist: false, accountant: true, housekeeping: false },
    { module: 'Financial Statements & P&L', owner: true, manager: true, receptionist: false, accountant: true, housekeeping: false },
    { module: 'Channel Manager Connectivity', owner: true, manager: true, receptionist: false, accountant: false, housekeeping: false },
    { module: 'Subscription & Plan Changes', owner: true, manager: false, receptionist: false, accountant: false, housekeeping: false },
  ];

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'owner':
        return <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-purple-100 text-purple-700">Owner</span>;
      case 'manager':
        return <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-100 text-brand-blue">Manager</span>;
      case 'receptionist':
        return <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-700">Front Desk</span>;
      case 'accountant':
        return <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-700">Accountant</span>;
      case 'housekeeping':
        return <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-teal-100 text-teal-700">Housekeeping</span>;
      default:
        return <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-gray-100 text-gray-700">{role}</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-border-light">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-content-primary-light">
            Staff Members & Property Team
          </h1>
          <p className="text-xs text-content-secondary-light">
            Manage your hotel team, assign roles, and grant instant property access.
          </p>
        </div>
        <button
          onClick={() => setShowInviteModal(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-brand-blue text-white text-xs font-bold shadow hover:bg-brand-blue-hover transition shrink-0"
        >
          <UserPlus className="w-4 h-4" />
          Add Staff Member
        </button>
      </div>

      {/* Notifications */}
      {successMsg && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{successMsg}</span>
          </div>
          <button onClick={() => setSuccessMsg(null)} className="text-emerald-700 hover:text-emerald-900">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {error && (
        <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
            <span>{error}</span>
          </div>
          <button onClick={() => setError(null)} className="text-red-700 hover:text-red-900">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Auto-Linking Explainer Banner */}
      <div className="p-4 rounded-2xl bg-blue-50 border border-blue-200 text-xs text-blue-900 flex items-start gap-3">
        <Sparkles className="w-4 h-4 text-brand-blue shrink-0 mt-0.5" />
        <div>
          <span className="font-bold">Instant Auto-Link System:</span> Enter your staff member&apos;s email address.
          Whether they register fresh or sign in with their Google account or email &amp; password, HotelFlexi automatically
          links them directly to this hotel property and grants their role permissions immediately.
        </div>
      </div>

      {/* Active Team Members Table */}
      <div className="bg-white rounded-2xl border border-border-light shadow-sm overflow-hidden">
        <div className="p-4 border-b border-border-light font-bold text-sm text-content-primary-light flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-brand-blue" />
            <span>Active Team Members ({members.length})</span>
          </div>
        </div>

        {loading ? (
          <div className="p-8 text-center text-xs text-content-secondary-light">Loading team members...</div>
        ) : members.length === 0 ? (
          <div className="p-8 text-center text-xs text-content-secondary-light">
            No team members found. Click &quot;Add Staff Member&quot; to invite your team.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-surface-light border-b border-border-light font-bold text-content-primary-light uppercase text-[10px]">
                <tr>
                  <th className="p-3.5">Member Name &amp; Email</th>
                  <th className="p-3.5">Assigned Role</th>
                  <th className="p-3.5">Joined Date</th>
                  <th className="p-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-light">
                {members.map((m) => {
                  const isCurrent = m.user_id === user?.uid;
                  return (
                    <tr key={m.membership_id} className="hover:bg-surface-light/40">
                      <td className="p-3.5">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-brand-blue flex items-center justify-center text-white font-bold text-xs uppercase">
                            {m.full_name?.[0] || m.email[0]}
                          </div>
                          <div>
                            <div className="font-bold text-content-primary-light flex items-center gap-1.5">
                              {m.full_name || 'Staff Member'}
                              {isCurrent && (
                                <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-blue-100 text-brand-blue">
                                  You
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-content-secondary-light">{m.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="p-3.5">{getRoleBadge(m.role)}</td>
                      <td className="p-3.5 text-content-secondary-light">
                        {new Date(m.joined_at * 1000).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </td>
                      <td className="p-3.5 text-right">
                        {!isCurrent && (
                          <button
                            onClick={() => handleRemoveMember(m.membership_id, m.full_name || m.email)}
                            className="p-1.5 rounded-lg text-content-secondary-light hover:text-red-600 hover:bg-red-50 transition"
                            title="Remove from hotel team"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pending Invitations Section (If any) */}
      {invitations.length > 0 && (
        <div className="bg-white rounded-2xl border border-border-light shadow-sm overflow-hidden">
          <div className="p-4 border-b border-border-light font-bold text-sm text-content-primary-light flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-500" />
              <span>Pending Invitations ({invitations.length})</span>
            </div>
            <span className="text-[11px] font-normal text-content-secondary-light">
              Automatically activates upon their first login
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-surface-light border-b border-border-light font-bold text-content-primary-light uppercase text-[10px]">
                <tr>
                  <th className="p-3.5">Invited Email</th>
                  <th className="p-3.5">Assigned Role</th>
                  <th className="p-3.5">Invited On</th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-light">
                {invitations.map((inv) => (
                  <tr key={inv.id} className="hover:bg-surface-light/40">
                    <td className="p-3.5">
                      <div className="font-bold text-content-primary-light">{inv.email}</div>
                      {inv.full_name && <div className="text-[11px] text-content-secondary-light">{inv.full_name}</div>}
                    </td>
                    <td className="p-3.5">{getRoleBadge(inv.role)}</td>
                    <td className="p-3.5 text-content-secondary-light">
                      {new Date(inv.created_at * 1000).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </td>
                    <td className="p-3.5">
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                        <Clock className="w-2.5 h-2.5" />
                        Awaiting Login
                      </span>
                    </td>
                    <td className="p-3.5 text-right">
                      <button
                        onClick={() => handleRevokeInvite(inv.id)}
                        className="px-2.5 py-1 text-[11px] font-medium text-red-600 hover:bg-red-50 rounded-lg transition"
                      >
                        Revoke
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Role Permission Matrix (Clean - No SuperAdmin) */}
      <div className="bg-white rounded-2xl border border-border-light shadow-sm overflow-hidden">
        <div className="p-4 border-b border-border-light font-bold text-sm text-content-primary-light flex items-center gap-2">
          <Shield className="w-4 h-4 text-brand-blue" />
          <span>Role Capability &amp; Permission Matrix</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-surface-light border-b border-border-light font-bold text-content-primary-light uppercase text-[10px]">
              <tr>
                <th className="p-3.5">Operation / Capability</th>
                <th className="p-3.5 text-center">Owner</th>
                <th className="p-3.5 text-center">Manager</th>
                <th className="p-3.5 text-center">Front Desk</th>
                <th className="p-3.5 text-center">Accountant</th>
                <th className="p-3.5 text-center">Housekeeping</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-light">
              {matrix.map((row) => (
                <tr key={row.module} className="hover:bg-surface-light/40">
                  <td className="p-3.5 font-medium text-content-primary-light">{row.module}</td>
                  <td className="p-3.5 text-center">{row.owner ? <CheckCircle2 className="w-4 h-4 text-emerald-600 mx-auto" /> : <Lock className="w-4 h-4 text-gray-300 mx-auto" />}</td>
                  <td className="p-3.5 text-center">{row.manager ? <CheckCircle2 className="w-4 h-4 text-emerald-600 mx-auto" /> : <Lock className="w-4 h-4 text-gray-300 mx-auto" />}</td>
                  <td className="p-3.5 text-center">{row.receptionist ? <CheckCircle2 className="w-4 h-4 text-emerald-600 mx-auto" /> : <Lock className="w-4 h-4 text-gray-300 mx-auto" />}</td>
                  <td className="p-3.5 text-center">{row.accountant ? <CheckCircle2 className="w-4 h-4 text-emerald-600 mx-auto" /> : <Lock className="w-4 h-4 text-gray-300 mx-auto" />}</td>
                  <td className="p-3.5 text-center">{row.housekeeping ? <CheckCircle2 className="w-4 h-4 text-emerald-600 mx-auto" /> : <Lock className="w-4 h-4 text-gray-300 mx-auto" />}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Invite Staff Member Modal */}
      {showInviteModal && (
        <div
          onClick={() => setShowInviteModal(false)}
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="add-staff-modal-title"
            className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-border-light overflow-hidden animate-in fade-in zoom-in-95 duration-150"
          >
            <div className="p-5 border-b border-border-light flex items-center justify-between">
              <div className="flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-brand-blue" />
                <h3 id="add-staff-modal-title" className="font-extrabold text-base text-content-primary-light">Add Staff Member</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowInviteModal(false)}
                aria-label="Close dialog"
                className="p-1 rounded-lg text-content-secondary-light hover:bg-surface-light transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleInvite} className="p-5 space-y-4 text-xs">
              <div>
                <label className="block font-bold text-content-primary-light mb-1">
                  Email Address <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-content-secondary-light absolute left-3 top-2.5" />
                  <input
                    type="email"
                    required
                    placeholder="staff@example.com"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-surface-light border border-border-light rounded-xl text-xs text-content-primary-light focus:outline-none focus:ring-1 focus:ring-brand-blue"
                  />
                </div>
                <p className="text-[11px] text-content-secondary-light mt-1">
                  The staff member can log in using Google or Email/Password with this email.
                </p>
              </div>

              <div>
                <label className="block font-bold text-content-primary-light mb-1">
                  Full Name (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Ramesh Kumar"
                  value={inviteName}
                  onChange={(e) => setInviteName(e.target.value)}
                  className="w-full px-3 py-2 bg-surface-light border border-border-light rounded-xl text-xs text-content-primary-light focus:outline-none focus:ring-1 focus:ring-brand-blue"
                />
              </div>

              <div>
                <label className="block font-bold text-content-primary-light mb-1">
                  Assigned Staff Role <span className="text-red-500">*</span>
                </label>
                <select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value)}
                  className="w-full px-3 py-2 bg-surface-light border border-border-light rounded-xl text-xs text-content-primary-light focus:outline-none focus:ring-1 focus:ring-brand-blue font-medium"
                >
                  <option value="manager">Manager (Operations, Check-in, Financials, Team)</option>
                  <option value="receptionist">Front Desk Receptionist (Check-in, Invoices, Tasks)</option>
                  <option value="accountant">Accountant (Invoices, Expenses, Reports, P&amp;L)</option>
                  <option value="housekeeping">Housekeeping (Room Cleaning &amp; Task Execution)</option>
                  <option value="owner">Owner (Full Unrestricted Access)</option>
                </select>
              </div>

              <div className="p-3 rounded-xl bg-blue-50/80 border border-blue-100 text-[11px] text-blue-900 flex items-start gap-2">
                <BadgeCheck className="w-4 h-4 text-brand-blue shrink-0 mt-0.5" />
                <span>
                  No manual approval required later: HotelFlexi will automatically associate them with this hotel
                  dashboard the instant they authenticate.
                </span>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowInviteModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-content-secondary-light hover:bg-surface-light"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-brand-blue text-white hover:bg-brand-blue-hover shadow transition disabled:opacity-50"
                >
                  {submitting ? 'Adding...' : 'Grant Property Access'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
