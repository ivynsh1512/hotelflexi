/**
 * HotelFlexi Channel Manager — iCal Calendar Feed & Inbound Sync Routes
 * Public export: GET /api/v1/channels/ical/:roomTypeId/calendar.ics
 * Authenticated sync: POST /api/v1/channels/ical/sync
 */

import { Hono } from 'hono';
import { Env, AppVariables } from '../types';
import { authMiddleware, tenantMiddleware } from '../auth/middleware';
import { generateIcalFeed, syncInboundIcalFeed, parseIcalContent } from '../services/channelManager/icalService';

export const channelIcalRoutes = new Hono<{ Bindings: Env; Variables: AppVariables }>();

// -----------------------------------------------------------------------------
// 1. PUBLIC OUTBOUND ICAL FEED (Subscribed to by Airbnb, VRBO, OTAs)
// -----------------------------------------------------------------------------
channelIcalRoutes.get('/:roomTypeId/calendar.ics', async (c) => {
  const roomTypeId = c.req.param('roomTypeId');

  try {
    const icsContent = await generateIcalFeed(c.env.DB, roomTypeId);

    return new Response(icsContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/calendar; charset=utf-8',
        'Content-Disposition': `inline; filename="hotelflexi-${roomTypeId}.ics"`,
        'Cache-Control': 'public, max-age=300, s-maxage=300', // 5-minute cache
      },
    });
  } catch (err: any) {
    return c.text(`Error generating calendar feed: ${err.message}`, 404);
  }
});

// -----------------------------------------------------------------------------
// 2. PARSE ICAL TEST / PREVIEW (Helper for validating external Airbnb/VRBO URLs)
// -----------------------------------------------------------------------------
channelIcalRoutes.post('/preview', async (c) => {
  try {
    const body = await c.req.json().catch(() => ({}));
    let icsText = body.ics_content;

    if (!icsText && body.ical_url) {
      const resp = await fetch(body.ical_url, {
        headers: {
          'User-Agent': 'HotelFlexi-ChannelManager-iCal/2.0',
        },
      });
      if (!resp.ok) {
        return c.json({ error: `External iCal HTTP ${resp.status}` }, 400);
      }
      icsText = await resp.text();
    }

    if (!icsText) {
      return c.json({ error: 'Either ics_content or ical_url is required.' }, 400);
    }

    const events = parseIcalContent(icsText);
    return c.json({
      success: true,
      totalEvents: events.length,
      events,
    });
  } catch (err: any) {
    return c.json({ error: err.message }, 500);
  }
});

// -----------------------------------------------------------------------------
// 3. AUTHENTICATED INBOUND ICAL SYNC (Triggered manually or via background cron)
// -----------------------------------------------------------------------------
channelIcalRoutes.post('/sync', authMiddleware, tenantMiddleware, async (c) => {
  const tenantId = c.get('tenantId')!;
  const body = await c.req.json().catch(() => ({}));
  const { property_id, room_type_id, ical_url, channel_code = 'airbnb' } = body;

  if (!property_id || !room_type_id || !ical_url) {
    return c.json(
      { error: 'Missing required parameters: property_id, room_type_id, ical_url are required.' },
      400
    );
  }

  // Verify property belongs to tenant
  const prop = await c.env.DB.prepare(
    `SELECT id FROM properties WHERE id = ? AND tenant_id = ?`
  )
    .bind(property_id, tenantId)
    .first();

  if (!prop) {
    return c.json({ error: 'Property not found or unauthorized' }, 403);
  }

  try {
    const syncResult = await syncInboundIcalFeed(
      c.env.DB,
      tenantId,
      property_id,
      room_type_id,
      ical_url,
      channel_code
    );

    return c.json({
      success: true,
      ...syncResult,
    });
  } catch (err: any) {
    return c.json({ error: `Sync failed: ${err.message}` }, 500);
  }
});
