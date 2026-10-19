import { Hono } from 'hono';
import { Env, AppVariables } from '../types';
import { authMiddleware, tenantMiddleware } from '../auth/middleware';
import { executeAiTool, ToolExecutionContext } from '../services/aiTools';

export const aiAgentRoutes = new Hono<{ Bindings: Env; Variables: AppVariables }>();

aiAgentRoutes.use('*', authMiddleware, tenantMiddleware);

// Detect language style: English, Hindi, Hinglish
function detectLanguage(text: string): 'en' | 'hi' | 'hinglish' {
  const lower = text.toLowerCase();
  const hindiIndicators = ['karo', 'dikhao', 'banao', 'aaj', 'kal', 'mahine', 'kitni', 'pichhle', 'darj', 'kar do', 'chahiye', 'hoga'];
  const hasHindiKeywords = hindiIndicators.some((word) => lower.includes(word));
  
  if (hasHindiKeywords) {
    return 'hinglish';
  }
  return 'en';
}

// Natural language intent matcher
function parseNaturalLanguageIntent(message: string): { toolName: string; params: any } | null {
  const lower = message.toLowerCase().trim();

  // 1. Block Room: "Block Room 101 from 3 October to 4 October" or "3 October ko Room 101 block kar do"
  if (lower.includes('block') && (lower.includes('room') || lower.includes('kamra'))) {
    const roomMatch = lower.match(/(?:room|kamra)\s*(\d+[a-z]?)/i);
    const roomNumber = roomMatch ? roomMatch[1] : '101';
    
    // Default dates if none parsed: next 2 days
    const today = new Date();
    const d1 = new Date(today);
    d1.setDate(d1.getDate() + 1);
    const d2 = new Date(d1);
    d2.setDate(d2.getDate() + 1);

    const startDate = d1.toISOString().split('T')[0];
    const endDate = d2.toISOString().split('T')[0];

    return {
      toolName: 'block_room',
      params: { roomNumber, startDate, endDate, reason: 'maintenance' },
    };
  }

  // 2. Arrivals: "Kal ke arrivals dikhao", "Find tomorrow's arrivals", "today arrivals"
  if (lower.includes('arrival') || lower.includes('aane wale') || lower.includes('check-in')) {
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

  // 3. Collections & Payments: "Aaj kitni payment collect hui?", "Show today's collection and pending payments"
  if (lower.includes('collection') || lower.includes('payment') || lower.includes('kamai') || lower.includes('collect')) {
    return {
      toolName: 'get_daily_collections',
      params: { date: new Date().toISOString().split('T')[0] },
    };
  }

  // 4. Housekeeping: "Room 204 ki housekeeping assign karo", "Mark Room 204 as requiring housekeeping"
  if (lower.includes('housekeeping') || lower.includes('safai') || lower.includes('cleaning') || lower.includes('clean')) {
    const roomMatch = lower.match(/(?:room|kamra)\s*(\d+[a-z]?)/i);
    const roomNumber = roomMatch ? roomMatch[1] : '101';
    return {
      toolName: 'create_housekeeping_task',
      params: { roomNumber, priority: 'high', notes: 'Scheduled via AI Assistant' },
    };
  }

  // 5. Update Rates: "Weekend ka rate ₹3,500 kar do", "Change the weekend rate to ₹3,500"
  if (lower.includes('rate') || lower.includes('price') || lower.includes('kiraya')) {
    const amountMatch = lower.match(/(?:₹|rs\.?|inr)?\s*([\d,]+)/i);
    let ratePaise = 350000; // default ₹3,500
    if (amountMatch) {
      const parsedNum = parseInt(amountMatch[1].replace(/,/g, ''), 10);
      if (parsedNum > 0) {
        ratePaise = parsedNum * 100;
      }
    }
    const isWeekend = lower.includes('weekend') || lower.includes('hafta');
    return {
      toolName: 'update_rate',
      params: { ratePaise, isWeekend },
    };
  }

  // 6. Occupancy / Reports: "Pichhle mahine ki revenue report banao", "Show occupancy"
  if (lower.includes('occupancy') || lower.includes('revenue') || lower.includes('report') || lower.includes('occupant')) {
    return {
      toolName: 'get_occupancy',
      params: {},
    };
  }

  // 7. Complaint: "Create a complaint", "shikayat", "complaint"
  if (lower.includes('complaint') || lower.includes('shikayat')) {
    const roomMatch = lower.match(/(?:room|kamra)\s*(\d+[a-z]?)/i);
    return {
      toolName: 'create_complaint',
      params: {
        guestName: 'Guest',
        roomNumber: roomMatch ? roomMatch[1] : undefined,
        description: message,
      },
    };
  }

  return null;
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

  // Quota enforcement: Free trial / Starter plan allows maximum 2 AI chats per day
  const tenant: any = await c.env.DB.prepare('SELECT current_plan_id, subscription_status FROM tenants WHERE id = ?')
    .bind(tenantId)
    .first();

  const isFreeOrStarter = !tenant?.current_plan_id || tenant.current_plan_id === 'starter' || tenant.subscription_status === 'trial';
  if (isFreeOrStarter) {
    const todayStart = Math.floor(new Date().setHours(0, 0, 0, 0) / 1000);
    const dailyCountRow: any = await c.env.DB.prepare(
      `SELECT COUNT(*) as count FROM ai_messages WHERE tenant_id = ? AND role = 'user' AND created_at >= ?`
    ).bind(tenantId, todayStart).first();

    const currentCount = dailyCountRow?.count || 0;
    if (currentCount >= 2) {
      return c.json({
        error: 'Daily free AI limit reached (2 chats/day on Starter Trial). Please upgrade to Essential, Growth, or Pro plan for unlimited AI commands.',
        requiresUpgrade: true,
        currentCount,
        maxAllowed: 2
      }, 403);
    }
  }

  // Ensure conversation exists
  if (!conversationId) {
    conversationId = `conv_${crypto.randomUUID()}`;
    await c.env.DB.prepare(
      `INSERT INTO ai_conversations (id, tenant_id, user_id, title, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?)`
    )
      .bind(conversationId, tenantId, user.uid, message.slice(0, 40), now, now)
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
  const toolCall = parseNaturalLanguageIntent(message);

  let assistantReply = '';
  let toolResult = null;

  if (toolCall) {
    const ctx: ToolExecutionContext = {
      env: c.env,
      tenantId,
      userId: user.uid,
      role: membership.role,
      language: lang,
    };

    const execution = await executeAiTool(toolCall.toolName, toolCall.params, ctx);
    assistantReply = execution.humanMessage;
    toolResult = execution;
  } else {
    // Helpful guidance when query doesn't match an exact tool pattern
    if (lang === 'hi' || lang === 'hinglish') {
      assistantReply = `Namaste! Main HotelFlexi ka AI Business Agent hoon. Aap mujhse natural language mein hotel operate karne ke liye keh sakte hain, jaise:
• "Kal ke arrivals dikhao"
• "3 October ko Room 101 block kar do"
• "Weekend ka rate ₹3,500 kar do"
• "Aaj kitni payment collect hui?"
• "Room 204 ki housekeeping assign karo"
• "Pichhle mahine ki occupancy dikhao"`;
    } else {
      assistantReply = `Hello! I am HotelFlexi's AI Business Assistant. You can give me simple instructions to operate your hotel, such as:
• "Show tomorrow's arrivals"
• "Block Room 101 from 3 October to 4 October"
• "Change the weekend rate to ₹3,500"
• "Show today's collection and pending payments"
• "Mark Room 204 as requiring housekeeping"
• "Show occupancy for this month"`;
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
      toolCall ? JSON.stringify(toolCall) : null,
      toolResult ? JSON.stringify(toolResult) : null,
      now
    )
    .run();

  return c.json({
    conversationId,
    reply: assistantReply,
    toolExecuted: Boolean(toolCall),
    toolResult,
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
