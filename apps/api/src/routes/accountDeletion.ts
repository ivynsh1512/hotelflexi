import { Hono } from 'hono';
import { Env, AppVariables } from '../types';
import { authMiddleware, tenantMiddleware, requireRole } from '../auth/middleware';
import { sendEmail } from '../services/email';

export const accountDeletionRoutes = new Hono<{ Bindings: Env; Variables: AppVariables }>();

accountDeletionRoutes.use('*', authMiddleware, tenantMiddleware);

// GET /account/deletion-status - Check current deletion request status
accountDeletionRoutes.get('/deletion-status', async (c) => {
  const tenantId = c.get('tenantId')!;

  const tenant: any = await c.env.DB.prepare(
    `SELECT deletion_requested_at, deletion_reason, deletion_status, name
     FROM tenants WHERE id = ?`
  )
    .bind(tenantId)
    .first();

  return c.json({
    hasPendingRequest: tenant?.deletion_status === 'pending',
    deletionRequestedAt: tenant?.deletion_requested_at || null,
    deletionReason: tenant?.deletion_reason || null,
    deletionStatus: tenant?.deletion_status || null,
  });
});

// POST /account/request-deletion - Submit formal account & data deletion request
accountDeletionRoutes.post('/request-deletion', requireRole(['owner']), async (c) => {
  const tenantId = c.get('tenantId')!;
  const user = c.get('user')!;
  const body = await c.req.json();
  const { reason = 'Hotelier requested account closure', confirmText } = body;

  if (confirmText !== 'DELETE') {
    return c.json({ error: 'Please type "DELETE" exactly to confirm your request.' }, 400);
  }

  const tenant: any = await c.env.DB.prepare('SELECT name, slug FROM tenants WHERE id = ?')
    .bind(tenantId)
    .first();

  const now = new Date().toISOString();

  await c.env.DB.prepare(
    `UPDATE tenants SET
       deletion_requested_at = ?,
       deletion_reason = ?,
       deletion_status = 'pending',
       updated_at = ?
     WHERE id = ?`
  )
    .bind(now, reason, Math.floor(Date.now() / 1000), tenantId)
    .run();

  // Notify Super Admin of deletion request
  const adminEmail = c.env.ADMIN_NOTIFICATION_EMAIL || 'info@novaxai.in';
  try {
    await sendEmail(c.env, {
      to: adminEmail,
      subject: `🚨 [Urgent Deletion Request] ${tenant?.name || 'Hotel'} (${tenant?.slug})`,
      html: `
        <div style="font-family:sans-serif;padding:20px;background:#fef2f2;border-radius:12px;border:1px solid #fecaca;max-width:600px;">
          <h2 style="color:#b91c1c;margin-top:0;">Account & Data Purge Request</h2>
          <p><strong>Hotel:</strong> ${tenant?.name} (${tenant?.slug})</p>
          <p><strong>Owner Email:</strong> ${user.email}</p>
          <p><strong>Requested At:</strong> ${now}</p>
          <p><strong>Reason provided:</strong></p>
          <blockquote style="background:#fff;padding:12px;border-left:4px solid #b91c1c;border-radius:4px;margin:12px 0;">
            ${reason}
          </blockquote>
          <p style="font-size:12px;color:#666;">
            Review and approve or reject this request in your Super Admin Central Command &rarr; Tenants dashboard.
          </p>
        </div>
      `,
    });
  } catch (err) {
    console.error('[Deletion Notification Email Error]:', err);
  }

  return c.json({
    success: true,
    message: 'Your deletion request has been submitted. Our compliance team will review and process your request within 24-48 hours.',
    status: 'pending',
  });
});
