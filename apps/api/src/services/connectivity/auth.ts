/**
 * HotelFlexi Connectivity API — Authentication & Authorization Middleware
 * Enforces partner credentials, hashed secrets, rate limits, and cross-property isolation.
 */

import { Context, Next } from 'hono';
import { Env, AppVariables } from '../../types';
import { verifySecret } from './crypto';
import { recordAuditLog } from '../audit';

// In-memory sliding rate-limit tracker per worker isolate
const rateLimitMap = new Map<string, { count: number; windowStart: number }>();

export async function connectivityAuthMiddleware(
  c: Context<{ Bindings: Env; Variables: AppVariables }>,
  next: Next
) {
  // 1. Extract API Key and Secret
  let apiKey = c.req.header('x-api-key');
  let apiSecret = c.req.header('x-api-secret');

  // Also support standard Authorization header: Bearer <apiKey>:<apiSecret>
  const authHeader = c.req.header('authorization');
  if ((!apiKey || !apiSecret) && authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.slice(7).trim();
    const parts = token.split(':');
    if (parts.length === 2) {
      apiKey = parts[0];
      apiSecret = parts[1];
    }
  }

  if (!apiKey || !apiSecret) {
    return c.json(
      {
        error: 'Unauthorized',
        message: 'Missing integration credentials. Provide X-API-Key and X-API-Secret headers.',
        code: 'AUTH_CREDENTIALS_MISSING',
      },
      401
    );
  }

  // 2. Fetch Partner Record from DB
  const partner: any = await c.env.DB.prepare(
    `SELECT id, tenant_id, partner_name, partner_code, api_key, api_secret_hash,
            mode, rate_limit_per_minute, is_active
     FROM connectivity_partners
     WHERE api_key = ?`
  )
    .bind(apiKey)
    .first();

  if (!partner) {
    return c.json(
      {
        error: 'Unauthorized',
        message: 'Invalid API Key.',
        code: 'AUTH_KEY_INVALID',
      },
      401
    );
  }

  if (Number(partner.is_active) !== 1) {
    return c.json(
      {
        error: 'Forbidden',
        message: 'Partner credentials have been revoked or deactivated.',
        code: 'AUTH_PARTNER_INACTIVE',
      },
      403
    );
  }

  // 3. Verify Hashed API Secret
  const isSecretValid = await verifySecret(apiSecret, partner.api_secret_hash);
  if (!isSecretValid) {
    return c.json(
      {
        error: 'Unauthorized',
        message: 'Invalid API Secret.',
        code: 'AUTH_SECRET_INVALID',
      },
      401
    );
  }

  // 4. Rate Limiting (Per-Partner)
  const now = Math.floor(Date.now() / 1000);
  const limit = partner.rate_limit_per_minute || 120;
  const tracker = rateLimitMap.get(partner.id) || { count: 0, windowStart: now };

  if (now - tracker.windowStart >= 60) {
    tracker.count = 0;
    tracker.windowStart = now;
  }

  tracker.count++;
  rateLimitMap.set(partner.id, tracker);

  c.header('X-RateLimit-Limit', limit.toString());
  c.header('X-RateLimit-Remaining', Math.max(0, limit - tracker.count).toString());
  c.header('X-RateLimit-Reset', (tracker.windowStart + 60).toString());

  if (tracker.count > limit) {
    return c.json(
      {
        error: 'Too Many Requests',
        message: `Rate limit of ${limit} requests per minute exceeded. Retry after ${tracker.windowStart + 60 - now}s.`,
        code: 'RATE_LIMIT_EXCEEDED',
      },
      429
    );
  }

  // 5. Populate Context Variables
  c.set('connectivityPartner', {
    id: partner.id,
    tenantId: partner.tenant_id,
    partnerName: partner.partner_name,
    partnerCode: partner.partner_code,
    mode: partner.mode,
    rateLimitPerMinute: limit,
  });
  c.set('tenantId', partner.tenant_id);

  // 6. Property-Level Authorization Check
  // Extract propertyId from route param or directly from path URL (/properties/:propertyId/...)
  const pathMatch = c.req.path.match(/\/properties\/([^\/\?#]+)/);
  const propertyId = c.req.param('propertyId') || (pathMatch ? pathMatch[1] : undefined);

  if (propertyId) {
    const isAuthorized: any = await c.env.DB.prepare(
      `SELECT 1 FROM connectivity_partner_properties
       WHERE partner_id = ? AND property_id = ?`
    )
      .bind(partner.id, propertyId)
      .first();

    if (!isAuthorized) {
      return c.json(
        {
          error: 'Forbidden',
          message: `Access denied. Partner '${partner.partner_name}' is not authorized to manage property '${propertyId}'.`,
          code: 'PROPERTY_ACCESS_DENIED',
        },
        403
      );
    }
  }

  await next();
}
