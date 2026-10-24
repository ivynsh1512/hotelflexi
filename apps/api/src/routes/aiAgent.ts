import { Hono } from 'hono';
import { Env, AppVariables } from '../types';
import { authMiddleware, tenantMiddleware } from '../auth/middleware';
import { executeAiTool, ToolExecutionContext, GROQ_TOOL_DEFINITIONS } from '../services/aiTools';
import { isGroqConfigured, callGroqChat, GroqMessage } from '../services/groqClient';
import { buildPropertyLiveContext, buildGroqSystemPrompt } from '../services/aiContext';

export const aiAgentRoutes = new Hono<{ Bindings: Env; Variables: AppVariables }>();

aiAgentRoutes.use('*', authMiddleware, tenantMiddleware);

// Detect language style: English, Hindi, Hinglish
function detectLanguage(text: string): 'en' | 'hi' | 'hinglish' {
  const lower = text.toLowerCase();
  const hindiIndicators = [
    'karo', 'dikhao', 'banao', 'aaj', 'kal', 'mahine', 'kitni', 'pichhle',
    'darj', 'kar do', 'chahiye', 'hoga', 'saare', 'sab', 'khol do', 'rakho',
    'baki', 'kamre', 'kamra', 'safai', 'kaun'
  ];
  const hasHindiKeywords = hindiIndicators.some((word) => lower.includes(word));
  
  if (hasHindiKeywords) {
    return 'hinglish';
  }
  return 'en';
}

export interface IntentContext {
  roomTypes?: any[];
  property?: any;
}

// Natural language intent matcher with contextual room category and price extraction
export function parseNaturalLanguageIntent(
  message: string,
  context: IntentContext = {}
): { toolName: string; params: any } | null {
  const lower = message.toLowerCase().trim();

  // -------------------------------------------------------------------------
  // 0. UNBLOCK ROOM(S)
  // -------------------------------------------------------------------------
  if (
    lower.includes('unblock') ||
    lower.includes('unbloack') ||
    lower.includes('un-block') ||
    lower.includes('khol do') ||
    lower.includes('kholo') ||
    lower.includes('release block') ||
    lower.includes('release room') ||
    (lower.includes('remove') && lower.includes('block'))
  ) {
    const isAll =
      lower.includes('all') ||
      lower.includes('saare') ||
      lower.includes('sab') ||
      lower.includes('them') ||
      lower.includes('sabko') ||
      lower.includes('har');

    const allMatches = Array.from(lower.matchAll(/(?:room|rooms|kamra|kamre|unit|units)?\s*#?(\d+[a-z]?)/gi));
    const roomNumbers = Array.from(new Set(allMatches.map((m) => m[1]))).filter(Boolean);

    return {
      toolName: 'unblock_room',
      params: {
        all: isAll || roomNumbers.length === 0,
        roomNumbers: roomNumbers.length > 0 ? roomNumbers : undefined,
      },
    };
  }

  // -------------------------------------------------------------------------
  // 1. BLOCK ROOM(S)
  // -------------------------------------------------------------------------
  if (
    !lower.includes('unblock') &&
    !lower.includes('unbloack') &&
    lower.includes('block') &&
    (lower.includes('room') || lower.includes('kamr') || lower.includes('unit'))
  ) {
    const allMatches = Array.from(lower.matchAll(/(?:room|rooms|kamra|kamre|unit|units)?\s*#?(\d+[a-z]?)/gi));
    const roomNumbers = Array.from(new Set(allMatches.map((m) => m[1]))).filter(Boolean);
    const primaryRoomNumber = roomNumbers[0] || '101';

    const today = new Date();
    let startDate: string;
    let endDate: string;

    const monthNames: Record<string, number> = {
      jan: 0, january: 0, feb: 1, february: 1, mar: 2, march: 2, apr: 3, april: 3,
      may: 4, jun: 5, june: 5, jul: 6, july: 6, aug: 7, august: 7,
      sep: 8, september: 8, oct: 9, october: 9, nov: 10, november: 10, dec: 11, december: 11,
    };

    const monthMatch = lower.match(/(\d{1,2})\s*(january|february|march|april|may|june|july|august|september|october|november|december|jan|feb|mar|apr|jun|jul|aug|sep|oct|nov|dec)/i);
    const isoMatch = lower.match(/(\d{4}-\d{2}-\d{2})/);

    if (monthMatch) {
      const day = parseInt(monthMatch[1], 10);
      const mStr = monthMatch[2].toLowerCase();
      const monthIdx = monthNames[mStr] ?? today.getMonth();
      const parsedDate = new Date(today.getFullYear(), monthIdx, day);
      startDate = parsedDate.toISOString().split('T')[0];
      const nextDay = new Date(parsedDate);
      nextDay.setDate(nextDay.getDate() + 1);
      endDate = nextDay.toISOString().split('T')[0];
    } else if (isoMatch) {
      startDate = isoMatch[1];
      const parsedDate = new Date(startDate);
      parsedDate.setDate(parsedDate.getDate() + 1);
      endDate = parsedDate.toISOString().split('T')[0];
    } else if (lower.includes('kal') || lower.includes('tomorrow')) {
      const d1 = new Date(today);
      d1.setDate(d1.getDate() + 1);
      const d2 = new Date(d1);
      d2.setDate(d2.getDate() + 1);
      startDate = d1.toISOString().split('T')[0];
      endDate = d2.toISOString().split('T')[0];
    } else {
      const d1 = new Date(today);
      d1.setDate(d1.getDate() + 1);
      const d2 = new Date(d1);
      d2.setDate(d2.getDate() + 1);
      startDate = d1.toISOString().split('T')[0];
      endDate = d2.toISOString().split('T')[0];
    }

    return {
      toolName: 'block_room',
      params: {
        roomNumber: primaryRoomNumber,
        roomNumbers: roomNumbers.length > 1 ? roomNumbers : undefined,
        startDate,
        endDate,
        reason: 'maintenance',
      },
    };
  }

  // -------------------------------------------------------------------------
  // 2. CHECKOUTS / DEPARTURES: "Pending checkouts dikhao", "aaj ke checkouts", "show departures"
  // -------------------------------------------------------------------------
  if (
    lower.includes('checkout') ||
    lower.includes('check-out') ||
    lower.includes('check out') ||
    lower.includes('departure') ||
    lower.includes('jane wale') ||
    lower.includes('nikalne wale')
  ) {
    let targetDate = new Date().toISOString().split('T')[0];
    if (lower.includes('tomorrow') || lower.includes('kal')) {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      targetDate = tomorrow.toISOString().split('T')[0];
    }
    const pendingOnly = lower.includes('pending') || lower.includes('baki') || !lower.includes('all');
    return {
      toolName: 'find_checkouts',
      params: { date: targetDate, pendingOnly },
    };
  }

  // -------------------------------------------------------------------------
  // 3. ARRIVALS / CHECK-INS: "Kal ke arrivals dikhao", "Find tomorrow's arrivals", "today arrivals"
  // -------------------------------------------------------------------------
  if (
    (lower.includes('arrival') || lower.includes('aane wale') || lower.includes('check-in') || lower.includes('checkin')) &&
    !lower.includes('checkout') && !lower.includes('check-out')
  ) {
    let targetDate = new Date().toISOString().split('T')[0];
    if (lower.includes('tomorrow') || lower.includes('kal')) {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      targetDate = tomorrow.toISOString().split('T')[0];
    }
    return {
      toolName: 'find_arrivals',
      params: { date: targetDate },
    };
  }

  // -------------------------------------------------------------------------
  // 4. IN-HOUSE GUESTS: "In-house guests dikhao", "currently staying guests"
  // -------------------------------------------------------------------------
  if (
    lower.includes('in-house') ||
    lower.includes('inhouse') ||
    lower.includes('staying guest') ||
    lower.includes('current guest') ||
    lower.includes('kaun ruke') ||
    lower.includes('currently staying')
  ) {
    return {
      toolName: 'get_inhouse_guests',
      params: {},
    };
  }

  // -------------------------------------------------------------------------
  // 5. VACANT / FREE ROOMS: "Kitne kamre khali hain", "vacant rooms", "free rooms"
  // -------------------------------------------------------------------------
  if (
    lower.includes('vacant') ||
    (lower.includes('khali') && (lower.includes('room') || lower.includes('kamr'))) ||
    lower.includes('free room') ||
    lower.includes('available room')
  ) {
    return {
      toolName: 'get_vacant_rooms',
      params: {},
    };
  }

  // -------------------------------------------------------------------------
  // 6. OCCUPANCY & STATUS: "Aaj ki occupancy dikhao", "hotel status", "revenue report"
  // -------------------------------------------------------------------------
  if (lower.includes('occupancy') || lower.includes('occupant') || lower.includes('occupancy rate')) {
    return {
      toolName: 'get_occupancy',
      params: {},
    };
  }

  // -------------------------------------------------------------------------
  // 7. PAYMENTS & COLLECTIONS: "Aaj kitni payment collect hui?", "collection report"
  // -------------------------------------------------------------------------
  if (
    lower.includes('collection') ||
    lower.includes('payment') ||
    lower.includes('kamai') ||
    lower.includes('collect') ||
    (lower.includes('hisab') && !lower.includes('safai'))
  ) {
    return {
      toolName: 'get_daily_collections',
      params: { date: new Date().toISOString().split('T')[0] },
    };
  }

  // -------------------------------------------------------------------------
  // 8. HOUSEKEEPING / CLEANING / DIRTY MARK
  // -------------------------------------------------------------------------
  if (
    lower.includes('housekeeping') ||
    lower.includes('safai') ||
    lower.includes('cleaning') ||
    lower.includes('clean') ||
    lower.includes('dirty')
  ) {
    const roomMatch = lower.match(/(?:room|kamra)\s*(\d+[a-z]?)/i);
    const roomNumber = roomMatch ? roomMatch[1] : '101';

    if (lower.includes('clean mark') || lower.includes('mark clean') || lower.includes('saaf ho gaya') || lower.includes('clean ho gaya')) {
      return { toolName: 'mark_room_clean', params: { roomNumber } };
    }
    if (lower.includes('dirty mark') || lower.includes('mark dirty') || lower.includes('ganda')) {
      return { toolName: 'mark_room_dirty', params: { roomNumber } };
    }
    return {
      toolName: 'create_housekeeping_task',
      params: { roomNumber, priority: 'high', notes: 'Scheduled via AI Assistant' },
    };
  }

  // -------------------------------------------------------------------------
  // 9. ROOM PRICING, EXTRA ADULT RATES & OCCUPANCY CONFIGURATION
  // Examples:
  // - "for cottage price for 2 people is rs. 5000 and above 2 people each one will additionally pay 3000"
  // - "deluxe room ka rate 4500 set karo"
  // - "cottage price 5000 extra adult 3000"
  // - "weekend rate 3500 set karo"
  // -------------------------------------------------------------------------
  if (
    lower.includes('price') ||
    lower.includes('rate') ||
    lower.includes('kiraya') ||
    lower.includes('pricing') ||
    lower.includes('tariff') ||
    lower.includes('additionally pay') ||
    lower.includes('additionally') ||
    lower.includes('extra adult') ||
    lower.includes('extra person')
  ) {
    // 1. Detect matching room type from context or text
    let matchedRt: any = null;
    if (Array.isArray(context.roomTypes) && context.roomTypes.length > 0) {
      matchedRt = context.roomTypes.find((rt: any) =>
        lower.includes(rt.name.toLowerCase()) || lower.includes(rt.code.toLowerCase())
      );
    }

    // Fallback category detection
    let detectedCategory = matchedRt ? matchedRt.name : '';
    if (!detectedCategory) {
      const commonCategories = [
        'cottage', 'deluxe', 'super deluxe', 'standard', 'suite', 'executive',
        'villa', 'tent', 'dormitory', 'dorm', 'family room', 'premium'
      ];
      for (const cat of commonCategories) {
        if (lower.includes(cat)) {
          detectedCategory = cat;
          break;
        }
      }
    }

    // 2. Extract Base Occupancy (e.g. "for 2 people", "2 adults", "base 2 persons", "2 guests", "2 log")
    let baseOccupancy: number | undefined = undefined;
    const occMatch = lower.match(/(?:for|base)?\s*(\d+)\s*(?:people|persons?|guests?|adults?|log|vyakti|members?)/i);
    if (occMatch) {
      const occ = parseInt(occMatch[1], 10);
      if (occ > 0 && occ <= 20) {
        baseOccupancy = occ;
      }
    }

    // 3. Extract Extra Adult Surcharge (e.g. "above 2 people each one will additionally pay 3000", "extra adult 3000", "extra person 1500")
    let extraAdultPriceRupees: number | undefined = undefined;
    const extraMatch = lower.match(/(?:above|extra|additional|additionally|each one|har ek|per person|per adult)[^0-9]*?(?:pay|charge|rate|₹|rs\.?|inr)?\s*(?:rs\.?|inr|₹)?\s*(\d{3,6})/i);
    if (extraMatch) {
      const parsedExtra = parseInt(extraMatch[1].replace(/,/g, ''), 10);
      if (parsedExtra >= 100) {
        extraAdultPriceRupees = parsedExtra;
      }
    }

    // 4. Extract Base Price (must be a realistic hotel tariff >= 100, not guest counts)
    let basePriceRupees: number | undefined = undefined;

    // Pattern A: "price ... is rs. 5000" or "price for 2 people is rs. 5000" or "rate 5000"
    const priceWithPrefix = lower.match(/(?:price|rate|kiraya|tariff|cost)(?:[^0-9]*?(?:for\s*\d+\s*(?:people|adults|persons?|guests?|log)))?[^0-9]*?(?:is|hoga|rakho|set karo|to)?\s*(?:rs\.?|inr|₹)?\s*(\d{3,7})/i);
    if (priceWithPrefix) {
      const parsedBase = parseInt(priceWithPrefix[1].replace(/,/g, ''), 10);
      if (parsedBase >= 100 && parsedBase !== extraAdultPriceRupees) {
        basePriceRupees = parsedBase;
      }
    }

    // Pattern B: Explicit currency prefixed number (e.g. "rs. 5000", "₹5,000", "5000 rs")
    if (!basePriceRupees) {
      const currencyMatches = Array.from(lower.matchAll(/(?:₹|rs\.?|inr)\s*(\d[\d,]*)/gi));
      for (const cm of currencyMatches) {
        const num = parseInt(cm[1].replace(/,/g, ''), 10);
        if (num >= 100 && num !== extraAdultPriceRupees) {
          basePriceRupees = num;
          break;
        }
      }
    }

    // Pattern C: Any 4-5 digit number that is not the extra adult price
    if (!basePriceRupees) {
      const allNumbers = Array.from(lower.matchAll(/\b(\d{3,6})\b/g));
      for (const nm of allNumbers) {
        const num = parseInt(nm[1], 10);
        if (num >= 500 && num !== extraAdultPriceRupees) {
          basePriceRupees = num;
          break;
        }
      }
    }

    const isWeekend = lower.includes('weekend') || lower.includes('hafta') || lower.includes('shanivar');

    // If we have room type or extra adult charge or base price
    if (detectedCategory || extraAdultPriceRupees || basePriceRupees) {
      return {
        toolName: 'update_room_type_pricing',
        params: {
          roomTypeName: matchedRt ? matchedRt.name : (detectedCategory || 'all'),
          roomTypeId: matchedRt ? matchedRt.id : undefined,
          basePriceRupees,
          baseOccupancy,
          extraAdultPriceRupees,
          weekendPriceRupees: isWeekend ? basePriceRupees : undefined,
        },
      };
    }

    // Fallback simple rate update
    if (basePriceRupees && basePriceRupees >= 100) {
      return {
        toolName: 'update_rate',
        params: {
          ratePaise: basePriceRupees * 100,
          isWeekend,
        },
      };
    }
  }

  // -------------------------------------------------------------------------
  // 10. COMPLAINTS & MAINTENANCE
  // -------------------------------------------------------------------------
  if (lower.includes('complaint') || lower.includes('shikayat') || lower.includes('kharab') || lower.includes('problem')) {
    const roomMatch = lower.match(/(?:room|kamra)\s*(\d+[a-z]?)/i);
    return {
      toolName: 'create_complaint',
      params: {
        guestName: 'Hotel Guest',
        roomNumber: roomMatch ? roomMatch[1] : undefined,
        description: message,
      },
    };
  }

  return null;
}

// Conversational guidance when user sends greetings, how-tos, or questions
function generateConversationalReply(
  message: string,
  lang: 'en' | 'hi' | 'hinglish',
  context: IntentContext
): string {
  const lower = message.toLowerCase().trim();
  const hotelName = context.property?.name || 'HotelFlexi';
  const slug = context.property?.slug || '';

  // 1. Greetings
  if (
    lower === 'hi' ||
    lower === 'hello' ||
    lower === 'hey' ||
    lower === 'namaste' ||
    lower === 'namaskar' ||
    lower.startsWith('good morning') ||
    lower.startsWith('good evening') ||
    lower.startsWith('kaise ho')
  ) {
    if (lang === 'hi' || lang === 'hinglish') {
      return `Namaste! 🙏 Main ${hotelName} ka AI Business Assistant hoon. Aap mujhe natural language mein direct command de sakte hain, jaise:
• "Pending checkouts dikhao"
• "for cottage price for 2 people is rs. 5000 and above 2 people each one will additionally pay 3000"
• "Saare rooms unblock kar do"
• "Kal ke arrivals dikhao"
• "Room 204 housekeeping assign karo"
• "Aaj ki payment collection dikhao"`;
    }
    return `Hello! 🙏 I am ${hotelName}'s AI Business Assistant. How can I help you today? You can command me in plain English or Hinglish:
• "Show pending checkouts"
• "for cottage price for 2 people is rs. 5000 and above 2 people each one will additionally pay 3000"
• "Unblock all rooms"
• "Show tomorrow's arrivals"
• "Mark Room 204 as requiring housekeeping"
• "Show today's collection and pending payments"`;
  }

  // 2. Direct Booking Engine Link
  if (
    lower.includes('booking engine') ||
    lower.includes('direct booking') ||
    lower.includes('website link') ||
    lower.includes('booking url') ||
    lower.includes('booking link')
  ) {
    const bookingUrl = slug ? `https://hotelflexi.com/book/${slug}` : 'https://hotelflexi.com/app/booking-engine';
    return lang === 'hi' || lang === 'hinglish'
      ? `Aapke property ka official 0% commission direct booking engine link ye hai:\n🌐 ${bookingUrl}\n\nGuests yahan se directly rooms book kar sakte hain aur payment seedhe aapke account mein settle hoti hai!`
      : `Your official 0% commission direct booking engine URL is:\n🌐 ${bookingUrl}\n\nGuests can book directly, with instant payment settlement into your bank account!`;
  }

  // 3. Channel Manager / OTA connections
  if (
    lower.includes('channel manager') ||
    lower.includes('makemytrip') ||
    lower.includes('agoda') ||
    lower.includes('booking.com') ||
    lower.includes('expedia') ||
    lower.includes('airbnb') ||
    lower.includes('ota')
  ) {
    return `To manage and connect OTAs (MakeMyTrip, Agoda, Booking.com, Expedia, Airbnb):
1. Navigate to Channel Manager (/app/channels).
2. Select your channel and click "Connect Channel".
3. Enter your Hotel ID and credentials. Availability, rates, and inventory (ARI) sync automatically in sub-seconds!`;
  }

  // 4. GST & Billing rules
  if (lower.includes('gst') || lower.includes('tax slab') || lower.includes('tax rate')) {
    return `Under Indian GST regulations for Hotels (SAC 9963):
• Room Tariff up to ₹7,500/night: 12% GST (6% CGST + 6% SGST)
• Room Tariff above ₹7,500/night: 18% Luxury GST (9% CGST + 9% SGST)
HotelFlexi automatically applies the correct slab on invoices and tax folios based on room tariff.`;
  }

  // 5. Capabilities / What can you do / Help
  if (
    lower.includes('what can you do') ||
    lower.includes('kya kar sakte ho') ||
    lower.includes('features') ||
    lower.includes('capabilities') ||
    lower === 'help'
  ) {
    return `I am your hotel's autonomous operational AI. Here is what I execute:
1. 🏨 Room Inventory: Block/unblock rooms ("Saare rooms unblock kar do"), check vacant rooms, view occupancy.
2. 💰 Pricing & Extra Person: Set room tariffs and extra adult charges ("for cottage price for 2 people is rs. 5000 and above 2 people each one will additionally pay 3000").
3. 🛎️ Front Desk Operations: View arrivals ("Kal ke arrivals dikhao"), departures ("Pending checkouts dikhao"), and in-house guests.
4. 🧹 Housekeeping: Assign cleaning tasks ("Room 204 housekeeping assign karo") or mark rooms clean/dirty.
5. 💳 Accounts: View daily payment collections and active folio dues.`;
  }

  // 6. Helpful clarification fallback
  if (lang === 'hi' || lang === 'hinglish') {
    return `Main aapki request samajh raha hoon, kripya thodi specific detail dein (jaise Room number, date ya amount).
Aap inme se koi command de sakte hain:
• "Pending checkouts dikhao"
• "for cottage price for 2 people is rs. 5000 and above 2 people each one will additionally pay 3000"
• "Saare rooms unblock kar do"
• "Room 101 block kar do kal ke liye"
• "Aaj ki payment collection dikhao"`;
  }
  return `I understand you want to operate ${hotelName}, but I need a specific room number, date, or amount.
You can try:
• "Show pending checkouts"
• "for cottage price for 2 people is rs. 5000 and above 2 people each one will additionally pay 3000"
• "Unblock all rooms"
• "Block Room 101 for tomorrow"
• "Show today's collection and pending payments"`;
}

// Chat API endpoint
aiAgentRoutes.post('/chat', async (c) => {
  const tenantId = c.get('tenantId')!;
  const user = c.get('user')!;
  const membership = c.get('membership')!;
  const body = await c.req.json();
  const now = Math.floor(Date.now() / 1000);

  const message = (body.message || '').trim();
  let conversationId = body.conversationId;

  if (!message) {
    return c.json({ error: 'Message cannot be empty' }, 400);
  }

  // Monthly AI Quota enforcement according to plan tiers:
  // - Essential (and 14-day Essential Trial): 50 AI chats / month
  // - Pro: 200 AI agent tasks / month
  // - Enterprise: 2,000 AI chats / month (fair-use policy)
  const tenant: any = await c.env.DB.prepare('SELECT current_plan_id, subscription_status FROM tenants WHERE id = ?')
    .bind(tenantId)
    .first();

  const planId = (tenant?.current_plan_id || 'essential').toLowerCase();
  let monthlyLimit = 50;
  if (planId === 'pro') {
    monthlyLimit = 200;
  } else if (planId === 'enterprise') {
    monthlyLimit = 2000;
  }

  // Calculate beginning of current calendar month in UTC
  const nowObj = new Date();
  const monthStart = Math.floor(new Date(Date.UTC(nowObj.getUTCFullYear(), nowObj.getUTCMonth(), 1)).getTime() / 1000);

  const monthlyCountRow: any = await c.env.DB.prepare(
    `SELECT COUNT(*) as count FROM ai_messages WHERE tenant_id = ? AND role = 'user' AND created_at >= ?`
  ).bind(tenantId, monthStart).first().catch(() => ({ count: 0 }));

  const currentCount = monthlyCountRow?.count || 0;
  if (currentCount >= monthlyLimit) {
    return c.json({
      error: `Monthly AI command limit reached (${currentCount}/${monthlyLimit} used this month on ${planId.toUpperCase()} plan). Upgrade to ${planId === 'essential' ? 'Pro' : 'Enterprise'} for higher AI limits.`,
      requiresUpgrade: true,
      currentCount,
      maxAllowed: monthlyLimit
    }, 403);
  }

  // Fetch contextual tenant data: room types and property details
  const roomTypesQuery: any = await c.env.DB.prepare(
    `SELECT id, name, code, base_occupancy, max_occupancy, base_price_paise, extra_adult_price_paise
     FROM room_types WHERE tenant_id = ?`
  ).bind(tenantId).all().catch(() => ({ results: [] }));
  const roomTypes = roomTypesQuery.results || [];

  const property: any = await c.env.DB.prepare(
    `SELECT id, name, property_code, slug, city, phone FROM properties WHERE tenant_id = ? LIMIT 1`
  ).bind(tenantId).first().catch(() => null);

  const intentContext: IntentContext = {
    roomTypes,
    property,
  };

  // Ensure conversation exists with valid user ID
  const dbUser: any = await c.env.DB.prepare(
    'SELECT id FROM users WHERE id = ? OR (email IS NOT NULL AND LOWER(email) = LOWER(?)) LIMIT 1'
  ).bind(user.uid, user.email).first().catch(() => null);
  const effectiveUserId = dbUser?.id || membership.user_id || user.uid;

  if (!conversationId) {
    conversationId = `conv_${crypto.randomUUID()}`;
    await c.env.DB.prepare(
      `INSERT INTO ai_conversations (id, tenant_id, user_id, title, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?)`
    )
      .bind(conversationId, tenantId, effectiveUserId, message.slice(0, 40), now, now)
      .run();
  }

  // Record user message
  const userMsgId = `msg_${crypto.randomUUID()}`;
  await c.env.DB.prepare(
    `INSERT INTO ai_messages (id, conversation_id, tenant_id, role, content, created_at)
     VALUES (?, ?, ?, 'user', ?, ?)`
  )
    .bind(userMsgId, conversationId, tenantId, message, now)
    .run();

  const lang = detectLanguage(message);
  let assistantReply = '';
  let executedToolCall: any = null;
  let toolResult: any = null;
  let groqModelUsed = 'local_fallback';

  const ctx: ToolExecutionContext = {
    env: c.env,
    tenantId,
    userId: effectiveUserId,
    role: membership.role,
    propertyId: property?.id,
    language: lang,
  };

  // 1. Try Groq AI Central Intelligence inference if configured
  if (isGroqConfigured(c.env)) {
    try {
      const liveContext = await buildPropertyLiveContext(c.env.DB, tenantId, property?.id);
      const systemPrompt = buildGroqSystemPrompt(liveContext);

      // Fetch recent conversation history
      const historyRows: any = await c.env.DB.prepare(
        `SELECT role, content FROM ai_messages
         WHERE conversation_id = ? AND tenant_id = ? AND id != ?
         ORDER BY created_at DESC LIMIT 6`
      )
        .bind(conversationId, tenantId, userMsgId)
        .all()
        .catch(() => ({ results: [] }));

      const historyMessages = ((historyRows.results || []) as any[])
        .reverse()
        .map((m) => ({
          role: m.role === 'assistant' ? ('assistant' as const) : ('user' as const),
          content: m.content || '',
        }));

      const groqMessages: GroqMessage[] = [
        { role: 'system', content: systemPrompt },
        ...historyMessages,
        { role: 'user', content: message },
      ];

      const groqRes = await callGroqChat(c.env, groqMessages, {
        taskType: 'reasoning',
        tools: GROQ_TOOL_DEFINITIONS,
      });

      if (groqRes.success) {
        groqModelUsed = groqRes.modelUsed;

        if (groqRes.toolCalls && groqRes.toolCalls.length > 0) {
          const firstCall = groqRes.toolCalls[0];
          executedToolCall = { toolName: firstCall.name, params: firstCall.arguments };
          const execution = await executeAiTool(firstCall.name, firstCall.arguments, ctx);
          toolResult = execution;

          // Call Groq again with tool execution result for a natural, comprehensive response
          const followupMessages: GroqMessage[] = [
            ...groqMessages,
            {
              role: 'assistant',
              content: groqRes.content || '',
              tool_calls: [
                {
                  id: firstCall.id,
                  type: 'function',
                  function: {
                    name: firstCall.name,
                    arguments: JSON.stringify(firstCall.arguments),
                  },
                },
              ],
            },
            {
              role: 'tool',
              tool_call_id: firstCall.id,
              name: firstCall.name,
              content: JSON.stringify(execution.result || { message: execution.humanMessage }),
            },
          ];

          const synthesisRes = await callGroqChat(c.env, followupMessages, {
            taskType: 'reasoning',
          });

          assistantReply = synthesisRes.success && synthesisRes.content
            ? synthesisRes.content
            : execution.humanMessage;
        } else if (groqRes.content) {
          assistantReply = groqRes.content;
        }
      }
    } catch (groqErr) {
      console.warn('Groq AI inference error, falling back to local engine:', groqErr);
    }
  }

  // 2. Fallback to natural language intent matcher if Groq was not used or failed
  if (!assistantReply) {
    const localToolCall = parseNaturalLanguageIntent(message, intentContext);

    if (localToolCall) {
      executedToolCall = localToolCall;
      const execution = await executeAiTool(localToolCall.toolName, localToolCall.params, ctx);
      assistantReply = execution.humanMessage;
      toolResult = execution;
    } else {
      assistantReply = generateConversationalReply(message, lang, intentContext);
    }
  }

  // Record assistant response
  const assistantMsgId = `msg_${crypto.randomUUID()}`;
  await c.env.DB.prepare(
    `INSERT INTO ai_messages (id, conversation_id, tenant_id, role, content, tool_calls_json, tool_results_json, created_at)
     VALUES (?, ?, ?, 'assistant', ?, ?, ?, ?)`
  )
    .bind(
      assistantMsgId,
      conversationId,
      tenantId,
      assistantReply,
      executedToolCall ? JSON.stringify(executedToolCall) : null,
      toolResult ? JSON.stringify(toolResult) : null,
      now
    )
    .run();

  return c.json({
    conversationId,
    reply: assistantReply,
    toolExecuted: Boolean(executedToolCall),
    toolResult,
    modelUsed: groqModelUsed,
  });
});

// List conversations
aiAgentRoutes.get('/conversations', async (c) => {
  const tenantId = c.get('tenantId')!;
  const user = c.get('user')!;

  const rows = await c.env.DB.prepare(
    `SELECT * FROM ai_conversations WHERE tenant_id = ? AND user_id = ? ORDER BY updated_at DESC LIMIT 20`
  )
    .bind(tenantId, user.uid)
    .all();

  return c.json({ conversations: rows.results || [] });
});

// Get messages in a conversation
aiAgentRoutes.get('/conversations/:id/messages', async (c) => {
  const tenantId = c.get('tenantId')!;
  const convId = c.req.param('id');

  const rows = await c.env.DB.prepare(
    `SELECT * FROM ai_messages WHERE conversation_id = ? AND tenant_id = ? ORDER BY created_at ASC`
  )
    .bind(convId, tenantId)
    .all();

  return c.json({ messages: rows.results || [] });
});
