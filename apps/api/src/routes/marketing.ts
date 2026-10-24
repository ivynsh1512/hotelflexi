/**
 * HotelFlexi AI Marketing & Competitor Intelligence API
 * Enables hoteliers to draft targeted campaigns, track inquiries & direct booking attribution,
 * and monitor local competitor rates legitimately.
 */

import { Hono } from 'hono';
import { Env, AppVariables } from '../types';
import { authMiddleware, tenantMiddleware, requireRole } from '../auth/middleware';
import { isGroqConfigured, callGroqChat } from '../services/groqClient';

export const marketingRoutes = new Hono<{ Bindings: Env; Variables: AppVariables }>();

marketingRoutes.use('*', authMiddleware, tenantMiddleware);

// -----------------------------------------------------------------------------
// 1. MARKETING CAMPAIGNS & ATTRIBUTION
// -----------------------------------------------------------------------------
marketingRoutes.get('/campaigns', async (c) => {
  const tenantId = c.get('tenantId')!;
  const propertyId = c.req.query('property_id');

  let sql = `SELECT * FROM marketing_campaigns WHERE tenant_id = ?`;
  const params: any[] = [tenantId];
  if (propertyId) {
    sql += ` AND property_id = ?`;
    params.push(propertyId);
  }
  sql += ` ORDER BY created_at DESC LIMIT 50`;

  const rows = await c.env.DB.prepare(sql).bind(...params).all();
  return c.json({ campaigns: rows.results || [] });
});

marketingRoutes.post('/campaigns', requireRole(['owner', 'manager']), async (c) => {
  const tenantId = c.get('tenantId')!;
  const body = await c.req.json();
  const now = Math.floor(Date.now() / 1000);

  if (!body.propertyId || !body.title || !body.content) {
    return c.json({ error: 'propertyId, title, and content are required' }, 400);
  }

  const id = `camp_${crypto.randomUUID().slice(0, 8)}`;
  const utmCode = body.utmCampaign || `hf_${body.title.toLowerCase().replace(/[^a-z0-9]/g, '_')}_${Date.now().toString().slice(-4)}`;

  await c.env.DB.prepare(
    `INSERT INTO marketing_campaigns (
      id, tenant_id, property_id, title, channel, content, target_audience,
      utm_campaign, status, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'draft', ?, ?)`
  )
    .bind(
      id,
      tenantId,
      body.propertyId,
      body.title.trim(),
      body.channel || 'whatsapp',
      body.content.trim(),
      body.targetAudience || null,
      utmCode,
      now,
      now
    )
    .run();

  return c.json({ success: true, id, utmCampaign: utmCode });
});

marketingRoutes.post('/campaigns/generate-brief', requireRole(['owner', 'manager']), async (c) => {
  const tenantId = c.get('tenantId')!;
  const body = await c.req.json();
  const { propertyId, theme, channel = 'whatsapp' } = body;

  if (!propertyId || !theme) {
    return c.json({ error: 'propertyId and theme are required' }, 400);
  }

  const prop: any = await c.env.DB.prepare(
    `SELECT name, city, property_code FROM properties WHERE id = ? AND tenant_id = ?`
  )
    .bind(propertyId, tenantId)
    .first();

  const hotelName = prop?.name || 'Our Resort';
  const city = prop?.city || 'India';

  let generatedContent = '';
  let socialCaptions = '';
  let suggestedOffer = '';

  if (isGroqConfigured(c.env)) {
    try {
      const prompt = `You are a hospitality marketing strategist for ${hotelName} in ${city}.
Draft a high-converting promotional campaign for: "${theme}".
Channel: ${channel}.
RULES:
1. Target Indian domestic travelers, families, and couples.
2. Emphasize direct-booking benefits (e.g. complimentary breakfast, flexible cancellation, early check-in subject to availability).
3. Do NOT invent fake facilities. Keep tone warm, inviting, and professional.
4. Include:
- Headline
- 2-paragraph promotional body
- Clear Call to Action with booking URL placeholder`;

      const res = await callGroqChat(c.env, [{ role: 'user', content: prompt }], { taskType: 'reasoning' });
      if (res.success && res.content) {
        generatedContent = res.content;
      }
    } catch {}
  }

  if (!generatedContent) {
    generatedContent = `🌟 Special ${theme} at ${hotelName}, ${city}!\n\nEscape the city routine and enjoy an unforgettable stay surrounded by serenity. Book directly with zero platform fee and enjoy complimentary high-speed Wi-Fi and priority room check-in.\n\nReserve your stay today: https://hotelflexi.com/book/${prop?.property_code || propertyId}`;
  }

  return c.json({
    success: true,
    theme,
    channel,
    draftContent: generatedContent,
    utmSuggestion: `hf_${theme.toLowerCase().replace(/[^a-z0-9]/g, '_')}_${Date.now().toString().slice(-4)}`,
  });
});

// -----------------------------------------------------------------------------
// 2. COMPETITOR RATE TRACKING (Legitimate Owner Rate Shopper)
// -----------------------------------------------------------------------------
marketingRoutes.get('/competitor-rates', async (c) => {
  const tenantId = c.get('tenantId')!;
  const propertyId = c.req.query('property_id');
  const checkDate = c.req.query('check_date');

  let sql = `SELECT * FROM competitor_rates WHERE tenant_id = ?`;
  const params: any[] = [tenantId];

  if (propertyId) {
    sql += ` AND property_id = ?`;
    params.push(propertyId);
  }
  if (checkDate) {
    sql += ` AND check_date = ?`;
    params.push(checkDate);
  }
  sql += ` ORDER BY check_date ASC, competitor_name ASC`;

  const rows = await c.env.DB.prepare(sql).bind(...params).all();
  return c.json({ competitorRates: rows.results || [] });
});

marketingRoutes.post('/competitor-rates', requireRole(['owner', 'manager']), async (c) => {
  const tenantId = c.get('tenantId')!;
  const body = await c.req.json();
  const now = Math.floor(Date.now() / 1000);

  if (!body.propertyId || !body.competitorName || !body.checkDate || !body.observedRatePaise) {
    return c.json({ error: 'propertyId, competitorName, checkDate, and observedRatePaise are required' }, 400);
  }

  const id = `comp_${crypto.randomUUID().slice(0, 8)}`;
  await c.env.DB.prepare(
    `INSERT INTO competitor_rates (
      id, tenant_id, property_id, competitor_name, check_date, room_category,
      observed_rate_paise, currency, source_type, notes, observed_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  )
    .bind(
      id,
      tenantId,
      body.propertyId,
      body.competitorName.trim(),
      body.checkDate,
      body.roomCategory || 'Standard Room',
      Math.round(Number(body.observedRatePaise)),
      body.currency || 'INR',
      body.sourceType || 'manual',
      body.notes || null,
      now
    )
    .run();

  return c.json({ success: true, id });
});
