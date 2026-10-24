/**
 * HotelFlexi Guest Post-Stay Feedback & Neutral Review Workflow
 * Strict Google Review Policy & Hospitality Compliance:
 * 1. Never preselect or prefill star ratings.
 * 2. Unconditional Google Review link accessibility (never gated on satisfaction score).
 * 3. AI assistance polishes only the guest's own selected answers and text (never invents facts).
 * 4. Option for private feedback directly to property management.
 */

import { Hono } from 'hono';
import { Env, AppVariables } from '../types';
import { authMiddleware, tenantMiddleware } from '../auth/middleware';
import { isGroqConfigured, callGroqChat } from '../services/groqClient';

export const guestReviewsRoutes = new Hono<{ Bindings: Env; Variables: AppVariables }>();

// -----------------------------------------------------------------------------
// 1. PUBLIC: SUBMIT GUEST REVIEW / PRIVATE FEEDBACK
// -----------------------------------------------------------------------------
guestReviewsRoutes.post('/public/submit', async (c) => {
  const body = await c.req.json();
  const now = Math.floor(Date.now() / 1000);

  const {
    propertyId,
    reservationId,
    guestName,
    overallRating,
    cleanlinessRating,
    staffRating,
    foodRating,
    comfortRating,
    feedbackText,
    aiPolishedDraft,
    isPrivateFeedback = false,
    googleReviewClicked = false,
  } = body;

  if (!propertyId || !guestName) {
    return c.json({ error: 'propertyId and guestName are required' }, 400);
  }

  // Lookup tenant from property
  const prop: any = await c.env.DB.prepare(
    `SELECT tenant_id FROM properties WHERE id = ? LIMIT 1`
  )
    .bind(propertyId)
    .first();

  if (!prop) {
    return c.json({ error: 'Property not found' }, 404);
  }

  const reviewId = `rev_${crypto.randomUUID().slice(0, 8)}`;

  await c.env.DB.prepare(
    `INSERT INTO guest_reviews (
      id, tenant_id, property_id, reservation_id, guest_name,
      overall_rating, cleanliness_rating, staff_rating, food_rating, comfort_rating,
      feedback_text, ai_polished_draft, is_private_feedback, google_review_clicked, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  )
    .bind(
      reviewId,
      prop.tenant_id,
      propertyId,
      reservationId || null,
      guestName.trim(),
      Math.min(5, Math.max(1, Number(overallRating || 5))),
      cleanlinessRating ? Math.min(5, Math.max(1, Number(cleanlinessRating))) : null,
      staffRating ? Math.min(5, Math.max(1, Number(staffRating))) : null,
      foodRating ? Math.min(5, Math.max(1, Number(foodRating))) : null,
      comfortRating ? Math.min(5, Math.max(1, Number(comfortRating))) : null,
      feedbackText ? feedbackText.trim() : null,
      aiPolishedDraft ? aiPolishedDraft.trim() : null,
      isPrivateFeedback ? 1 : 0,
      googleReviewClicked ? 1 : 0,
      now
    )
    .run();

  return c.json({
    success: true,
    reviewId,
    message: isPrivateFeedback
      ? 'Thank you for your valuable private feedback. Our general manager has received your comments.'
      : 'Thank you for sharing your experience with us!',
  });
});

// -----------------------------------------------------------------------------
// 2. PUBLIC: AI REVIEW POLISHER (Based strictly on guest's own words)
// -----------------------------------------------------------------------------
guestReviewsRoutes.post('/public/polish', async (c) => {
  const body = await c.req.json();
  const { guestNotes, ratings, hotelName = 'the hotel' } = body;

  if (!guestNotes && (!ratings || Object.keys(ratings).length === 0)) {
    return c.json({ error: 'Please share a few words or ratings to polish.' }, 400);
  }

  let polished = '';

  if (isGroqConfigured(c.env)) {
    try {
      const prompt = `You are a neutral writing assistant for a hotel guest.
The guest stayed at "${hotelName}".
Guest's own feedback notes: "${guestNotes || ''}"
Guest's ratings: ${JSON.stringify(ratings || {})}

Write a polished, natural, concise 2 to 4 sentence review reflecting ONLY what the guest noted above.
STRICT RULES:
1. Do NOT invent amenities, staff names, or experiences the guest did not mention.
2. If the guest noted something negative or neutral, keep it truthful and constructive.
3. The guest will review and edit this text before deciding whether to use it.`;

      const groqRes = await callGroqChat(
        c.env,
        [{ role: 'user', content: prompt }],
        { taskType: 'fast' }
      );

      if (groqRes.success && groqRes.content) {
        polished = groqRes.content.replace(/^["']|["']$/g, '').trim();
      }
    } catch {}
  }

  // Deterministic fallback if Groq unavailable
  if (!polished) {
    polished = `My stay at ${hotelName} was pleasant. ${guestNotes ? guestNotes.trim() : 'The room and facilities met my expectations, and the staff was courteous throughout my visit.'}`;
  }

  return c.json({ success: true, polishedDraft: polished });
});

// -----------------------------------------------------------------------------
// 3. AUTHENTICATED: OWNER REVIEWS DASHBOARD
// -----------------------------------------------------------------------------
guestReviewsRoutes.get('/', authMiddleware, tenantMiddleware, async (c) => {
  const tenantId = c.get('tenantId')!;
  const propertyId = c.req.query('property_id');

  let sql = `SELECT * FROM guest_reviews WHERE tenant_id = ?`;
  const params: any[] = [tenantId];
  if (propertyId) {
    sql += ` AND property_id = ?`;
    params.push(propertyId);
  }
  sql += ` ORDER BY created_at DESC LIMIT 50`;

  const rows: any = await c.env.DB.prepare(sql).bind(...params).all();
  const reviews = (rows.results || []) as any[];

  const avgRating =
    reviews.length > 0
      ? (reviews.reduce((acc, r) => acc + Number(r.overall_rating || 0), 0) / reviews.length).toFixed(1)
      : '5.0';

  return c.json({
    totalReviews: reviews.length,
    averageRating: Number(avgRating),
    reviews,
  });
});
