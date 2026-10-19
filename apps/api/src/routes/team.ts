import { Hono } from 'hono';
import { Env, AppVariables } from '../types';
import { authMiddleware, tenantMiddleware, requireRole } from '../auth/middleware';
import { recordAuditLog } from '../services/audit';

export const teamRoutes = new Hono<{ Bindings: Env; Variables: AppVariables }>();

// All team routes require authentication and a selected tenant context
teamRoutes.use('*', authMiddleware, tenantMiddleware);

// 1. Get all active members and pending invitations for the tenant
teamRoutes.get('/members', async (c) => {
  const tenantId = c.get('tenantId')!;

  const [membersResult, invitesResult] = await Promise.all([
    c.env.DB.prepare(
      `SELECT tm.id as membership_id, tm.user_id, tm.role, tm.created_at as joined_at,
              u.email, u.full_name, u.phone, u.avatar_url
       FROM tenant_memberships tm
       JOIN users u ON u.id = tm.user_id
       WHERE tm.tenant_id = ?
       ORDER BY tm.created_at ASC`
    )
      .bind(tenantId)
      .all(),

    c.env.DB.prepare(
      `SELECT ti.id, ti.email, ti.role, ti.full_name, ti.status, ti.created_at,
              u.full_name as invited_by_name
       FROM team_invitations ti
       LEFT JOIN users u ON u.id = ti.invited_by_user_id
       WHERE ti.tenant_id = ? AND ti.status = 'pending'
       ORDER BY ti.created_at DESC`
    )
      .bind(tenantId)
      .all(),
  ]);

  return c.json({
    members: membersResult.results || [],
    invitations: invitesResult.results || [],
  });
});

// 2. Invite a new team member
teamRoutes.post('/invite', requireRole(['owner', 'manager']), async (c) => {
  const tenantId = c.get('tenantId')!;
  const user = c.get('user')!;
  const body = await c.req.json();
  const now = Math.floor(Date.now() / 1000);

  const email = (body.email || '').trim().toLowerCase();
  const fullName = (body.fullName || '').trim() || null;
  const role = body.role || 'receptionist';
  const propertyId = body.propertyId || null;

  if (!email || !email.includes('@')) {
    return c.json({ error: 'A valid email address is required' }, 400);
  }

  const validRoles = ['owner', 'manager', 'receptionist', 'accountant', 'housekeeping', 'read_only'];
  if (!validRoles.includes(role)) {
    return c.json({ error: `Invalid role. Allowed roles: ${validRoles.join(', ')}` }, 400);
  }

  // Check if an existing registered user matches this email
  const existingUser: any = await c.env.DB.prepare(
    'SELECT id, email, full_name FROM users WHERE LOWER(email) = ?'
  )
    .bind(email)
    .first();

  if (existingUser) {
    // Check if already a member
    const existingMembership = await c.env.DB.prepare(
      'SELECT id, role FROM tenant_memberships WHERE tenant_id = ? AND user_id = ?'
    )
      .bind(tenantId, existingUser.id)
      .first();

    if (existingMembership) {
      return c.json({ error: 'This user is already a member of this property team' }, 400);
    }

    // Auto-link immediately since user is registered
    const membershipId = `mem_${crypto.randomUUID()}`;
    await c.env.DB.prepare(
      `INSERT INTO tenant_memberships (id, tenant_id, user_id, role, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?)`
    )
      .bind(membershipId, tenantId, existingUser.id, role, now, now)
      .run();

    await recordAuditLog(c, {
      action: 'team.member_added',
      resourceType: 'tenant_membership',
      resourceId: membershipId,
      newValues: { email, role, userId: existingUser.id },
    });

    return c.json({
      success: true,
      message: 'User already had a HotelFlexi account and was linked directly to your property team.',
      linkedImmediately: true,
      membershipId,
    });
  }

  // User not yet registered — record invitation for automatic linking upon signup/login
  const invitationId = `inv_${crypto.randomUUID()}`;
  await c.env.DB.prepare(
    `INSERT INTO team_invitations (id, tenant_id, property_id, email, role, full_name, invited_by_user_id, status, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, 'pending', ?, ?)
     ON CONFLICT(id) DO NOTHING`
  )
    .bind(invitationId, tenantId, propertyId, email, role, fullName, user.uid, now, now)
    .run();

  await recordAuditLog(c, {
    action: 'team.invitation_created',
    resourceType: 'team_invitation',
    resourceId: invitationId,
    newValues: { email, role, fullName },
  });

  return c.json({
    success: true,
    message: `Invitation saved for ${email}. When they log in with Google or Email/Password, they will automatically gain access.`,
    linkedImmediately: false,
    invitationId,
  });
});

// 3. Remove a member from the team
teamRoutes.delete('/members/:membershipId', requireRole(['owner', 'manager']), async (c) => {
  const tenantId = c.get('tenantId')!;
  const user = c.get('user')!;
  const membershipId = c.req.param('membershipId');

  const membership: any = await c.env.DB.prepare(
    'SELECT * FROM tenant_memberships WHERE id = ? AND tenant_id = ?'
  )
    .bind(membershipId, tenantId)
    .first();

  if (!membership) {
    return c.json({ error: 'Team member not found' }, 404);
  }

  if (membership.user_id === user.uid) {
    return c.json({ error: 'You cannot remove yourself from the team' }, 400);
  }

  await c.env.DB.prepare('DELETE FROM tenant_memberships WHERE id = ? AND tenant_id = ?')
    .bind(membershipId, tenantId)
    .run();

  await recordAuditLog(c, {
    action: 'team.member_removed',
    resourceType: 'tenant_membership',
    resourceId: membershipId,
    oldValues: { userId: membership.user_id, role: membership.role },
  });

  return c.json({ success: true, message: 'Member removed successfully' });
});

// 4. Update member role
teamRoutes.patch('/members/:membershipId/role', requireRole(['owner']), async (c) => {
  const tenantId = c.get('tenantId')!;
  const membershipId = c.req.param('membershipId');
  const body = await c.req.json();
  const now = Math.floor(Date.now() / 1000);

  const role = body.role;
  const validRoles = ['owner', 'manager', 'receptionist', 'accountant', 'housekeeping', 'read_only'];
  if (!validRoles.includes(role)) {
    return c.json({ error: 'Invalid role specified' }, 400);
  }

  await c.env.DB.prepare(
    'UPDATE tenant_memberships SET role = ?, updated_at = ? WHERE id = ? AND tenant_id = ?'
  )
    .bind(role, now, membershipId, tenantId)
    .run();

  return c.json({ success: true, message: 'Role updated successfully' });
});

// 5. Revoke or delete pending invitation
teamRoutes.delete('/invitations/:invitationId', requireRole(['owner', 'manager']), async (c) => {
  const tenantId = c.get('tenantId')!;
  const invitationId = c.req.param('invitationId');

  await c.env.DB.prepare(
    'DELETE FROM team_invitations WHERE id = ? AND tenant_id = ?'
  )
    .bind(invitationId, tenantId)
    .run();

  return c.json({ success: true, message: 'Invitation revoked' });
});
