import { Env, AppVariables } from '../types';
import { recordAuditLog } from './audit';
import { GroqToolDefinition } from './groqClient';

export interface ToolExecutionContext {
  env: Env;
  tenantId: string;
  userId: string;
  role: string;
  propertyId?: string;
  language?: 'en' | 'hi' | 'hinglish';
}

export const GROQ_TOOL_DEFINITIONS: GroqToolDefinition[] = [
  {
    type: 'function',
    function: {
      name: 'get_property_performance',
      description: 'Get verified revenue, ADR (Average Daily Rate), RevPAR, and occupancy for a requested period.',
      parameters: {
        type: 'object',
        properties: {
          period: {
            type: 'string',
            enum: ['today', 'yesterday', 'this_month', 'last_month'],
            description: 'Time window for performance analysis',
          },
        },
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_occupancy_forecast',
      description: 'Get forward-looking occupancy forecast and demand pace for upcoming dates.',
      parameters: {
        type: 'object',
        properties: {
          daysAhead: { type: 'number', description: 'Number of upcoming days to forecast (default 7)' },
        },
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_payment_reconciliation',
      description: 'Get payment collections, outstanding balances, unpaid folios, and settlement status.',
      parameters: { type: 'object', properties: {} },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_room_status',
      description: 'Get live inventory summary of vacant, occupied, dirty, cleaning, inspected, ready, and maintenance rooms.',
      parameters: { type: 'object', properties: {} },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_open_guest_complaints',
      description: 'Get unresolved guest complaints, room numbers, priorities, and SLA timers.',
      parameters: { type: 'object', properties: {} },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_housekeeping_tasks',
      description: 'Get list of pending housekeeping turnover tasks, assigned staff, and inspection status.',
      parameters: { type: 'object', properties: {} },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_laundry_stock',
      description: 'Get clean linen inventory, in rooms, at external laundry vendor, and stock below par levels.',
      parameters: { type: 'object', properties: {} },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_food_stock_forecast',
      description: 'Forecast food & rasan requirements based on confirmed covers, recipe grams, usable stock, and supplier lead times.',
      parameters: {
        type: 'object',
        properties: {
          daysAhead: { type: 'number', description: 'Forecast window in days (default 7)' },
        },
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_profit_and_loss',
      description: 'Calculate operating revenue, expenses (salaries, supplies, utilities), and estimated net operating profit.',
      parameters: {
        type: 'object',
        properties: {
          period: { type: 'string', enum: ['today', 'this_month', 'last_month'] },
        },
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_marketing_performance',
      description: 'Get marketing campaigns results, inquiries generated, and attributed direct bookings revenue.',
      parameters: { type: 'object', properties: {} },
    },
  },
  {
    type: 'function',
    function: {
      name: 'create_staff_task',
      description: 'Assign a housekeeping cleaning task or maintenance ticket to hotel staff.',
      parameters: {
        type: 'object',
        required: ['notes'],
        properties: {
          taskType: { type: 'string', enum: ['housekeeping', 'maintenance'] },
          roomNumber: { type: 'string' },
          notes: { type: 'string' },
          priority: { type: 'string', enum: ['normal', 'urgent'] },
        },
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'draft_marketing_campaign',
      description: 'Draft a promotional campaign brief for festivals, weekends, or low-demand dates with UTM tracking.',
      parameters: {
        type: 'object',
        required: ['theme'],
        properties: {
          theme: { type: 'string', description: 'Campaign theme e.g. Diwali Weekend, Monsoon Retreat' },
          channel: { type: 'string', enum: ['whatsapp', 'instagram', 'google_business', 'sms'] },
        },
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'prepare_rate_recommendation',
      description: 'Evaluate demand pace and recommend dynamic rate adjustments for low or high demand dates.',
      parameters: {
        type: 'object',
        properties: {
          targetDate: { type: 'string', description: 'YYYY-MM-DD target date' },
        },
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'block_room',
      description: 'Block one or more rooms for maintenance or private hold.',
      parameters: {
        type: 'object',
        required: ['roomNumber', 'startDate', 'endDate'],
        properties: {
          roomNumber: { type: 'string' },
          startDate: { type: 'string' },
          endDate: { type: 'string' },
          reason: { type: 'string' },
        },
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'unblock_room',
      description: 'Unblock previously blocked rooms to make them available for sale.',
      parameters: {
        type: 'object',
        properties: {
          all: { type: 'boolean' },
          roomNumbers: { type: 'array', items: { type: 'string' } },
        },
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'mark_room_clean',
      description: 'Mark a dirty room as clean after housekeeping turnover.',
      parameters: {
        type: 'object',
        required: ['roomNumber'],
        properties: {
          roomNumber: { type: 'string' },
        },
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_property_setup_status',
      description: 'Get authoritative onboarding and configuration status for the property.',
      parameters: { type: 'object', properties: {} },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_room_categories',
      description: 'List all existing room categories and types with pricing and occupancy.',
      parameters: { type: 'object', properties: {} },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_room_types',
      description: 'List all existing room types with assigned room numbers count.',
      parameters: { type: 'object', properties: {} },
    },
  },
  {
    type: 'function',
    function: {
      name: 'prepare_room_category',
      description: 'Create or configure a room category/type.',
      parameters: {
        type: 'object',
        required: ['name', 'basePriceRupees'],
        properties: {
          name: { type: 'string', description: 'Room category name, e.g. Deluxe Room' },
          code: { type: 'string', description: '3-4 letter uppercase code, e.g. DLX' },
          baseOccupancy: { type: 'number', description: 'Base guests, default 2' },
          maxOccupancy: { type: 'number', description: 'Max guests, default 3' },
          basePriceRupees: { type: 'number', description: 'Base price in INR' },
          extraAdultPriceRupees: { type: 'number', description: 'Extra adult charge in INR' },
          description: { type: 'string' },
          amenities: { type: 'array', items: { type: 'string' } },
        },
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'prepare_room_type',
      description: 'Create or configure a room type with inventory count.',
      parameters: {
        type: 'object',
        required: ['name', 'basePriceRupees'],
        properties: {
          name: { type: 'string' },
          code: { type: 'string' },
          basePriceRupees: { type: 'number' },
          maxOccupancy: { type: 'number' },
          roomCount: { type: 'number', description: 'Number of room units to automatically generate' },
        },
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'prepare_rate_plan',
      description: 'Create or configure a rate plan (meal plan / cancellation policy).',
      parameters: {
        type: 'object',
        required: ['name', 'mealPlan'],
        properties: {
          name: { type: 'string', description: 'Rate plan name, e.g. Bed & Breakfast CP' },
          code: { type: 'string', description: 'Rate plan code, e.g. CP01' },
          roomCategoryName: { type: 'string', description: 'Associated room category' },
          mealPlan: { type: 'string', enum: ['EP', 'CP', 'MAP', 'AP'] },
          priceMultiplier: { type: 'number', description: 'Percentage multiplier, default 100' },
          surchargeRupees: { type: 'number', description: 'Fixed surcharge in INR' },
          isNonRefundable: { type: 'boolean' },
        },
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'prepare_amenities',
      description: 'Update the amenities list for property or room categories.',
      parameters: {
        type: 'object',
        required: ['amenities'],
        properties: {
          amenities: { type: 'array', items: { type: 'string' } },
          roomCategoryName: { type: 'string', description: 'Optional specific room category' },
        },
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'prepare_property_profile',
      description: 'Update property contact details, address, and check-in / check-out timings.',
      parameters: {
        type: 'object',
        properties: {
          phone: { type: 'string' },
          email: { type: 'string' },
          address: { type: 'string' },
          city: { type: 'string' },
          state: { type: 'string' },
          checkInTime: { type: 'string' },
          checkOutTime: { type: 'string' },
          description: { type: 'string' },
        },
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'prepare_tax_configuration',
      description: 'Configure Indian GSTIN or custom percentage / fixed taxes.',
      parameters: {
        type: 'object',
        properties: {
          gstNumber: { type: 'string', description: '15-digit Indian GSTIN' },
          taxName: { type: 'string', description: 'Name of tax or fee' },
          taxType: { type: 'string', enum: ['percentage', 'fixed'] },
          ratePercentage: { type: 'number' },
          fixedAmountRupees: { type: 'number' },
          scope: { type: 'string', enum: ['room', 'fnb', 'all'] },
        },
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'validate_setup_draft',
      description: 'Validate a staged property setup draft for missing prices, duplicate room numbers, or unassigned categories.',
      parameters: {
        type: 'object',
        properties: {
          draftId: { type: 'string' },
        },
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'apply_approved_setup_draft',
      description: 'Execute the approved property setup draft to create real rooms, categories, rate plans, and taxes.',
      parameters: {
        type: 'object',
        required: ['draftId'],
        properties: {
          draftId: { type: 'string' },
        },
      },
    },
  },
];

export async function executeAiTool(
  toolName: string,
  params: any,
  ctx: ToolExecutionContext
): Promise<{ success: boolean; result?: any; error?: string; humanMessage: string }> {
  const { env, tenantId, userId, role } = ctx;
  const now = Math.floor(Date.now() / 1000);

  // Validate or fallback user ID to guarantee satisfaction of foreign key constraints
  const dbUserCheck: any = await env.DB.prepare(
    'SELECT id FROM users WHERE id = ? LIMIT 1'
  ).bind(userId).first().catch(() => null);

  let effectiveUserId = dbUserCheck?.id || null;
  if (!effectiveUserId) {
    const ownerRow: any = await env.DB.prepare(
      'SELECT owner_user_id FROM tenants WHERE id = ? LIMIT 1'
    ).bind(tenantId).first().catch(() => null);
    effectiveUserId = ownerRow?.owner_user_id || userId;
  }

  let success = false;
  let result: any = null;
  let error: string | undefined = undefined;
  let humanMessage = '';

  try {
    switch (toolName) {
      // -----------------------------------------------------------------------
      // 1. BLOCK ROOM
      // -----------------------------------------------------------------------
      // 1. BLOCK ROOM (Single or Bulk)
      // -----------------------------------------------------------------------
      case 'block_room': {
        const { roomNumber, roomNumbers, startDate, endDate, reason = 'maintenance' } = params;
        const inputRooms: string[] = Array.isArray(roomNumbers) && roomNumbers.length > 0
          ? roomNumbers.map(String)
          : roomNumber
          ? [String(roomNumber)]
          : [];

        if (inputRooms.length === 0 || !startDate || !endDate) {
          throw new Error('Room number(s), start date, and end date are required');
        }

        // Validate present or future dates
        const todayStr = new Date().toISOString().split('T')[0];
        if (startDate < todayStr) {
          throw new Error('Please enter present or future dates. Cannot block rooms for past dates.');
        }
        if (endDate < startDate) {
          throw new Error('End date must be on or after start date.');
        }

        const blocked: string[] = [];
        const skipped: string[] = [];

        for (const num of inputRooms) {
          // Find room in tenant
          const room: any = await env.DB.prepare(
            `SELECT id, property_id, room_number FROM rooms WHERE room_number = ? AND tenant_id = ? AND is_active = 1`
          )
            .bind(num, tenantId)
            .first();

          if (!room) {
            skipped.push(`Room ${num} (not found)`);
            continue;
          }

          // Conflict check with reservations
          const conflict: any = await env.DB.prepare(
            `SELECT id, reservation_number FROM reservations
             WHERE room_id = ? AND tenant_id = ? AND status NOT IN ('cancelled', 'checked_out')
               AND check_in_date < ? AND check_out_date > ?`
          )
            .bind(room.id, tenantId, endDate, startDate)
            .first();

          if (conflict) {
            skipped.push(`Room ${num} (reserved #${conflict.reservation_number})`);
            continue;
          }

          // Conflict check with existing room blocks
          const blockConflict: any = await env.DB.prepare(
            `SELECT id, reason FROM room_blocks
             WHERE room_id = ? AND tenant_id = ? AND is_active = 1
               AND start_date < ? AND end_date > ?`
          )
            .bind(room.id, tenantId, endDate, startDate)
            .first();

          if (blockConflict) {
            skipped.push(`Room ${num} (already blocked for ${blockConflict.reason})`);
            continue;
          }

          const blockId = `blk_${crypto.randomUUID()}`;
          await env.DB.prepare(
            `INSERT INTO room_blocks (id, property_id, tenant_id, room_id, start_date, end_date, reason, created_by_user_id, is_active, created_at, updated_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?)`
          )
            .bind(blockId, room.property_id, tenantId, room.id, startDate, endDate, reason, dbUserCheck?.id || null, now, now)
            .run();

          blocked.push(num);
        }

        if (blocked.length === 0) {
          throw new Error(`Could not block rooms: ${skipped.join(', ')}`);
        }

        success = true;
        result = { blocked, skipped, startDate, endDate, reason };

        if (blocked.length === 1) {
          humanMessage = ctx.language === 'hi' || ctx.language === 'hinglish'
            ? `Room ${blocked[0]} ko ${startDate} se ${endDate} tak successfully block kar diya gaya hai (${reason}).`
            : `Room ${blocked[0]} has been successfully blocked from ${startDate} to ${endDate} for ${reason}.`;
        } else {
          humanMessage = ctx.language === 'hi' || ctx.language === 'hinglish'
            ? `Total ${blocked.length} rooms (${blocked.join(', ')}) ko ${startDate} se ${endDate} tak successfully block kar diya gaya hai.${skipped.length > 0 ? ` (${skipped.join(', ')} skip hue)` : ''}`
            : `Successfully blocked ${blocked.length} room(s) (${blocked.join(', ')}) from ${startDate} to ${endDate} for ${reason}.${skipped.length > 0 ? ` (${skipped.length} skipped due to conflicts)` : ''}`;
        }
        break;
      }

      // -----------------------------------------------------------------------
      // 1B. UNBLOCK ROOM (Single, Bulk, or All)
      // -----------------------------------------------------------------------
      case 'unblock_room': {
        const { all = false, roomNumbers } = params;
        const targetRooms: string[] = Array.isArray(roomNumbers) && roomNumbers.length > 0
          ? roomNumbers.map(String)
          : [];

        let unblockedBlocks: any[] = [];
        if (all || targetRooms.length === 0) {
          // Fetch all active blocks for this tenant
          const activeRows: any = await env.DB.prepare(
            `SELECT rb.id, rb.room_id, r.room_number
             FROM room_blocks rb
             JOIN rooms r ON r.id = rb.room_id
             WHERE rb.tenant_id = ? AND rb.is_active = 1`
          )
            .bind(tenantId)
            .all();
          unblockedBlocks = activeRows.results || [];

          if (unblockedBlocks.length === 0) {
            humanMessage = ctx.language === 'hi' || ctx.language === 'hinglish'
              ? 'Abhi koi rooms blocked nahi hain. Sabhi rooms already available hain.'
              : 'There are currently no blocked rooms. All rooms are already open and available.';
            success = true;
            result = { unblockedCount: 0, rooms: [] };
            break;
          }

          // Unblock all
          await env.DB.prepare(
            `UPDATE room_blocks SET is_active = 0, updated_at = ? WHERE tenant_id = ? AND is_active = 1`
          )
            .bind(now, tenantId)
            .run();

          // Restore room statuses to available
          await env.DB.prepare(
            `UPDATE rooms SET status = 'available', updated_at = ? WHERE tenant_id = ? AND status = 'blocked'`
          )
            .bind(now, tenantId)
            .run()
            .catch(() => {});
        } else {
          // Unblock specific room numbers
          for (const num of targetRooms) {
            const room: any = await env.DB.prepare(
              `SELECT id, room_number FROM rooms WHERE room_number = ? AND tenant_id = ?`
            )
              .bind(num, tenantId)
              .first();

            if (room) {
              const blocksToDeactivate: any = await env.DB.prepare(
                `SELECT id FROM room_blocks WHERE room_id = ? AND tenant_id = ? AND is_active = 1`
              )
                .bind(room.id, tenantId)
                .all();

              const blockList = blocksToDeactivate.results || [];
              if (blockList.length > 0) {
                await env.DB.prepare(
                  `UPDATE room_blocks SET is_active = 0, updated_at = ? WHERE room_id = ? AND tenant_id = ? AND is_active = 1`
                )
                  .bind(now, room.id, tenantId)
                  .run();

                await env.DB.prepare(
                  `UPDATE rooms SET status = 'available', updated_at = ? WHERE id = ? AND status = 'blocked'`
                )
                  .bind(now, room.id)
                  .run()
                  .catch(() => {});

                unblockedBlocks.push({ room_number: num });
              }
            }
          }

          if (unblockedBlocks.length === 0) {
            humanMessage = ctx.language === 'hi' || ctx.language === 'hinglish'
              ? `Room ${targetRooms.join(', ')} pe koi active block nahi mila.`
              : `No active blocks found for Room ${targetRooms.join(', ')}.`;
            success = true;
            result = { unblockedCount: 0, rooms: [] };
            break;
          }
        }

        const roomNumbersList = Array.from(new Set(unblockedBlocks.map((b) => b.room_number))).filter(Boolean);
        success = true;
        result = { unblockedCount: unblockedBlocks.length, rooms: roomNumbersList };

        humanMessage = ctx.language === 'hi' || ctx.language === 'hinglish'
          ? `Successfully unblocked! ${roomNumbersList.length > 0 ? `Rooms (${roomNumbersList.join(', ')})` : 'Sabhi rooms'} ab available aur booking ke liye open hain.`
          : `Successfully unblocked ${roomNumbersList.length > 0 ? `Room(s) ${roomNumbersList.join(', ')}` : 'all rooms'}. Rooms are now available and open for reservations.`;
        break;
      }

      // -----------------------------------------------------------------------
      // 2. FIND ARRIVALS
      // -----------------------------------------------------------------------
      case 'find_arrivals':
      case 'search_reservations': {
        const targetDate = params.date || new Date().toISOString().split('T')[0];
        const rows = await env.DB.prepare(
          `SELECT res.reservation_number, res.check_in_date, res.check_out_date, res.status,
                  res.total_amount_paise, res.balance_amount_paise,
                  rg.full_name as guest_name, rg.phone as guest_phone, r.room_number, rt.name as room_type
           FROM reservations res
           LEFT JOIN reservation_guests rg ON rg.reservation_id = res.id AND rg.is_primary = 1
           LEFT JOIN rooms r ON r.id = res.room_id
           LEFT JOIN room_types rt ON rt.id = res.room_type_id
           WHERE res.tenant_id = ? AND res.check_in_date = ? AND res.status NOT IN ('cancelled')
           ORDER BY res.created_at ASC`
        )
          .bind(tenantId, targetDate)
          .all();

        const arrivals = rows.results || [];
        success = true;
        result = { date: targetDate, count: arrivals.length, arrivals };

        if (arrivals.length === 0) {
          humanMessage = ctx.language === 'hi' || ctx.language === 'hinglish'
            ? `${targetDate} ke liye koi arrivals schedule nahi hain.`
            : `There are no scheduled arrivals for ${targetDate}.`;
        } else {
          const list = arrivals.map((a: any) => `• ${a.guest_name} (Room: ${a.room_number || 'Unassigned'}, Res: ${a.reservation_number})`).join('\n');
          humanMessage = ctx.language === 'hi' || ctx.language === 'hinglish'
            ? `${targetDate} ko total ${arrivals.length} arrivals hain:\n${list}`
            : `Found ${arrivals.length} arrival(s) for ${targetDate}:\n${list}`;
        }
        break;
      }

      // -----------------------------------------------------------------------
      // 2B. FIND CHECKOUTS / DEPARTURES (Pending or Completed)
      // -----------------------------------------------------------------------
      case 'find_checkouts': {
        const targetDate = params.date || new Date().toISOString().split('T')[0];
        const pendingOnly = params.pendingOnly !== false;

        let query = `
          SELECT res.reservation_number, res.check_in_date, res.check_out_date, res.status,
                 res.total_amount_paise, res.balance_amount_paise,
                 rg.full_name as guest_name, rg.phone as guest_phone, r.room_number, rt.name as room_type
          FROM reservations res
          LEFT JOIN reservation_guests rg ON rg.reservation_id = res.id AND rg.is_primary = 1
          LEFT JOIN rooms r ON r.id = res.room_id
          LEFT JOIN room_types rt ON rt.id = res.room_type_id
          WHERE res.tenant_id = ? AND res.check_out_date = ? AND res.status NOT IN ('cancelled')
        `;

        if (pendingOnly) {
          query += ` AND res.status NOT IN ('checked_out')`;
        }

        query += ` ORDER BY r.room_number ASC, res.created_at ASC`;

        const rows: any = await env.DB.prepare(query)
          .bind(tenantId, targetDate)
          .all();

        const checkouts = rows.results || [];
        success = true;
        result = { date: targetDate, count: checkouts.length, checkouts };

        if (checkouts.length === 0) {
          humanMessage = ctx.language === 'hi' || ctx.language === 'hinglish'
            ? `${targetDate} ke liye koi ${pendingOnly ? 'pending ' : ''}checkouts nahi hain. Sabhi status clear hai.`
            : `No ${pendingOnly ? 'pending ' : ''}checkouts found for ${targetDate}. All reservations are clear.`;
        } else {
          const list = checkouts.map((c: any) => {
            const balanceRs = (c.balance_amount_paise || 0) / 100;
            const balStr = balanceRs > 0 ? `⚠️ Dues Pending: ₹${balanceRs.toLocaleString('en-IN')}` : '✅ Fully Paid';
            return `• Room ${c.room_number || 'Unassigned'} — ${c.guest_name || 'Guest'} (Res: #${c.reservation_number}, Status: ${c.status.toUpperCase()}, ${balStr})`;
          }).join('\n');

          humanMessage = ctx.language === 'hi' || ctx.language === 'hinglish'
            ? `${targetDate} ko total ${checkouts.length} ${pendingOnly ? 'pending ' : ''}checkout(s) hain:\n${list}`
            : `Found ${checkouts.length} ${pendingOnly ? 'pending ' : ''}checkout(s) scheduled for ${targetDate}:\n${list}`;
        }
        break;
      }

      // -----------------------------------------------------------------------
      // 2C. IN-HOUSE GUESTS
      // -----------------------------------------------------------------------
      case 'get_inhouse_guests': {
        const rows: any = await env.DB.prepare(`
          SELECT res.reservation_number, res.check_in_date, res.check_out_date,
                 res.total_amount_paise, res.balance_amount_paise,
                 rg.full_name as guest_name, rg.phone as guest_phone, r.room_number, rt.name as room_type
          FROM reservations res
          LEFT JOIN reservation_guests rg ON rg.reservation_id = res.id AND rg.is_primary = 1
          LEFT JOIN rooms r ON r.id = res.room_id
          LEFT JOIN room_types rt ON rt.id = res.room_type_id
          WHERE res.tenant_id = ? AND res.status = 'checked_in'
          ORDER BY r.room_number ASC
        `).bind(tenantId).all();

        const inHouse = rows.results || [];
        success = true;
        result = { count: inHouse.length, inHouse };

        if (inHouse.length === 0) {
          humanMessage = ctx.language === 'hi' || ctx.language === 'hinglish'
            ? 'Abhi hotel mein koi checked-in in-house guests nahi hain.'
            : 'There are currently no checked-in in-house guests.';
        } else {
          const list = inHouse.map((g: any) => {
            const balRs = (g.balance_amount_paise || 0) / 100;
            return `• Room ${g.room_number || 'N/A'} (${g.room_type || 'Room'}) — ${g.guest_name || 'Guest'} | Departs: ${g.check_out_date}${balRs > 0 ? ` | Dues: ₹${balRs.toLocaleString('en-IN')}` : ''}`;
          }).join('\n');

          humanMessage = ctx.language === 'hi' || ctx.language === 'hinglish'
            ? `Filhal hotel mein ${inHouse.length} in-house guest(s) checked-in hain:\n${list}`
            : `Currently ${inHouse.length} in-house guest(s) staying at the hotel:\n${list}`;
        }
        break;
      }

      // -----------------------------------------------------------------------
      // 2D. VACANT / AVAILABLE ROOMS
      // -----------------------------------------------------------------------
      case 'get_vacant_rooms': {
        const rows: any = await env.DB.prepare(`
          SELECT r.room_number, r.floor, rt.name as room_type
          FROM rooms r
          LEFT JOIN room_types rt ON rt.id = r.room_type_id
          WHERE r.tenant_id = ? AND r.is_active = 1 AND r.status = 'available'
          ORDER BY r.room_number ASC
        `).bind(tenantId).all();

        const available = rows.results || [];
        success = true;
        result = { count: available.length, rooms: available };

        if (available.length === 0) {
          humanMessage = ctx.language === 'hi' || ctx.language === 'hinglish'
            ? 'Sabhi rooms filhal occupied ya blocked hain. Zero vacancies (100% Sold Out)!'
            : 'All rooms are currently occupied or blocked. Zero vacancies (100% Sold Out)!';
        } else {
          const roomsByCat: Record<string, string[]> = {};
          for (const rm of available) {
            const cat = rm.room_type || 'Standard';
            if (!roomsByCat[cat]) roomsByCat[cat] = [];
            roomsByCat[cat].push(rm.room_number);
          }
          const catSummary = Object.entries(roomsByCat)
            .map(([cat, nums]) => `• ${cat} (${nums.length} available): ${nums.join(', ')}`)
            .join('\n');

          humanMessage = ctx.language === 'hi' || ctx.language === 'hinglish'
            ? `Abhi total ${available.length} vacant rooms available hain:\n${catSummary}`
            : `Currently ${available.length} vacant room(s) available for booking:\n${catSummary}`;
        }
        break;
      }

      // -----------------------------------------------------------------------
      // 3. GET DAILY COLLECTIONS
      // -----------------------------------------------------------------------
      case 'get_daily_collections': {
        const targetDate = params.date || new Date().toISOString().split('T')[0];
        const startOfDay = Math.floor(new Date(`${targetDate}T00:00:00Z`).getTime() / 1000);
        const endOfDay = Math.floor(new Date(`${targetDate}T23:59:59Z`).getTime() / 1000);

        const row: any = await env.DB.prepare(
          `SELECT COALESCE(SUM(amount_paise), 0) as total_collected,
                  COUNT(*) as total_transactions
           FROM payments
           WHERE tenant_id = ? AND created_at >= ? AND created_at <= ? AND status = 'captured'`
        )
          .bind(tenantId, startOfDay, endOfDay)
          .first();

        const pendingRow: any = await env.DB.prepare(
          `SELECT COALESCE(SUM(balance_amount_paise), 0) as total_pending
           FROM reservations
           WHERE tenant_id = ? AND status IN ('confirmed', 'checked_in')`
        )
          .bind(tenantId)
          .first();

        const collectedRupees = (row?.total_collected || 0) / 100;
        const pendingRupees = (pendingRow?.total_pending || 0) / 100;

        success = true;
        result = { date: targetDate, collectedPaise: row?.total_collected || 0, pendingPaise: pendingRow?.total_pending || 0 };
        humanMessage = ctx.language === 'hi' || ctx.language === 'hinglish'
          ? `Aaj ki collection: ₹${collectedRupees.toLocaleString('en-IN')}. Current pending balance: ₹${pendingRupees.toLocaleString('en-IN')}.`
          : `Today's collection: ₹${collectedRupees.toLocaleString('en-IN')} across ${row?.total_transactions || 0} transaction(s). Active pending balance: ₹${pendingRupees.toLocaleString('en-IN')}.`;
        break;
      }

      // -----------------------------------------------------------------------
      // 4. HOUSEKEEPING TASK ASSIGNMENT
      // -----------------------------------------------------------------------
      case 'create_housekeeping_task': {
        const { roomNumber, priority = 'medium', notes = 'Housekeeping requested via AI agent' } = params;
        const room: any = await env.DB.prepare(
          'SELECT id, property_id FROM rooms WHERE room_number = ? AND tenant_id = ?'
        )
          .bind(String(roomNumber), tenantId)
          .first();

        if (!room) {
          throw new Error(`Room ${roomNumber} not found.`);
        }

        const taskId = `hk_${crypto.randomUUID()}`;
        const today = new Date().toISOString().split('T')[0];

        await env.DB.batch([
          env.DB.prepare(
            `INSERT INTO housekeeping_tasks (id, property_id, tenant_id, room_id, task_type, priority, status, scheduled_date, notes, created_at, updated_at)
             VALUES (?, ?, ?, ?, 'cleaning', ?, 'pending', ?, ?, ?, ?)`
          ).bind(taskId, room.property_id, tenantId, room.id, priority, today, notes, now, now),
          env.DB.prepare(
            `UPDATE rooms SET housekeeping_status = 'dirty', updated_at = ? WHERE id = ?`
          ).bind(now, room.id)
        ]);

        success = true;
        result = { taskId, roomNumber, status: 'pending' };
        humanMessage = ctx.language === 'hi' || ctx.language === 'hinglish'
          ? `Room ${roomNumber} ke liye housekeeping task create kar diya gaya hai aur room dirty mark kar diya gaya hai.`
          : `Housekeeping task created for Room ${roomNumber}. Room marked as requiring cleaning.`;
        break;
      }

      // -----------------------------------------------------------------------
      // 5. UPDATE RATE (Generic base or weekend)
      // -----------------------------------------------------------------------
      case 'update_rate': {
        const { ratePaise, isWeekend = false, roomTypeCode } = params;
        if (!ratePaise || ratePaise <= 0) {
          throw new Error('Valid rate amount is required');
        }

        let updateSql = isWeekend
          ? 'UPDATE room_types SET weekend_price_paise = ?, updated_at = ? WHERE tenant_id = ?'
          : 'UPDATE room_types SET base_price_paise = ?, updated_at = ? WHERE tenant_id = ?';
        
        const bindParams = [ratePaise, now, tenantId];
        if (roomTypeCode) {
          updateSql += ' AND code = ?';
          bindParams.push(roomTypeCode);
        }

        await env.DB.prepare(updateSql).bind(...bindParams).run();

        const rateInRupees = ratePaise / 100;
        success = true;
        result = { ratePaise, isWeekend };
        humanMessage = ctx.language === 'hi' || ctx.language === 'hinglish'
          ? `${isWeekend ? 'Weekend' : 'Base'} rate ko update karke ₹${rateInRupees.toLocaleString('en-IN')} kar diya gaya hai.`
          : `${isWeekend ? 'Weekend' : 'Base'} rate successfully updated to ₹${rateInRupees.toLocaleString('en-IN')}.`;
        break;
      }

      // -----------------------------------------------------------------------
      // 5B. UPDATE ROOM TYPE PRICING & OCCUPANCY (Smart rate + extra adult pricing)
      // -----------------------------------------------------------------------
      case 'update_room_type_pricing': {
        const {
          roomTypeId,
          roomTypeName,
          basePriceRupees,
          baseOccupancy,
          extraAdultPriceRupees,
          extraChildPriceRupees,
          weekendPriceRupees,
          maxOccupancy,
        } = params;

        // Find room type(s)
        let query = 'SELECT id, name, code, base_occupancy, max_occupancy, base_price_paise, extra_adult_price_paise FROM room_types WHERE tenant_id = ?';
        const queryParams: any[] = [tenantId];

        if (roomTypeId) {
          query += ' AND id = ?';
          queryParams.push(roomTypeId);
        } else if (roomTypeName && roomTypeName !== 'all') {
          query += ' AND (LOWER(name) LIKE ? OR LOWER(code) LIKE ?)';
          queryParams.push(`%${roomTypeName.toLowerCase()}%`, `%${roomTypeName.toLowerCase()}%`);
        }

        const rtRows: any = await env.DB.prepare(query).bind(...queryParams).all();
        const targets = rtRows.results || [];

        if (targets.length === 0) {
          const allRts: any = await env.DB.prepare('SELECT name FROM room_types WHERE tenant_id = ?').bind(tenantId).all();
          const names = (allRts.results || []).map((r: any) => r.name).join(', ');
          throw new Error(`Room category "${roomTypeName || ''}" nahi mili. Available categories: ${names || 'None'}`);
        }

        const updatedNames: string[] = [];

        for (const target of targets) {
          const sets: string[] = ['updated_at = ?'];
          const setValues: any[] = [now];

          if (basePriceRupees !== undefined && basePriceRupees > 0) {
            sets.push('base_price_paise = ?');
            setValues.push(Math.round(basePriceRupees * 100));
          }

          if (baseOccupancy !== undefined && baseOccupancy > 0) {
            sets.push('base_occupancy = ?');
            setValues.push(Number(baseOccupancy));
          }

          if (extraAdultPriceRupees !== undefined && extraAdultPriceRupees >= 0) {
            sets.push('extra_adult_price_paise = ?');
            setValues.push(Math.round(extraAdultPriceRupees * 100));
          }

          if (extraChildPriceRupees !== undefined && extraChildPriceRupees >= 0) {
            sets.push('extra_child_price_paise = ?');
            setValues.push(Math.round(extraChildPriceRupees * 100));
          }

          if (weekendPriceRupees !== undefined && weekendPriceRupees > 0) {
            sets.push('weekend_price_paise = ?');
            setValues.push(Math.round(weekendPriceRupees * 100));
          }

          if (maxOccupancy !== undefined && maxOccupancy > 0) {
            sets.push('max_occupancy = ?');
            setValues.push(Number(maxOccupancy));
          }

          setValues.push(target.id, tenantId);
          await env.DB.prepare(`UPDATE room_types SET ${sets.join(', ')} WHERE id = ? AND tenant_id = ?`)
            .bind(...setValues)
            .run();

          updatedNames.push(target.name);
        }

        success = true;
        result = { targets: updatedNames, basePriceRupees, baseOccupancy, extraAdultPriceRupees };

        const detailsParts: string[] = [];
        if (basePriceRupees) detailsParts.push(`Base Tariff: ₹${basePriceRupees.toLocaleString('en-IN')}${baseOccupancy ? ` (Base Occupancy: ${baseOccupancy} adults)` : ''}`);
        if (extraAdultPriceRupees) detailsParts.push(`Extra Adult Charge: ₹${extraAdultPriceRupees.toLocaleString('en-IN')}/night`);
        if (weekendPriceRupees) detailsParts.push(`Weekend Tariff: ₹${weekendPriceRupees.toLocaleString('en-IN')}`);

        if (ctx.language === 'hi' || ctx.language === 'hinglish') {
          humanMessage = `${updatedNames.join(', ')} ki pricing successfully update kar di gayi hai!\n• ${detailsParts.join('\n• ')}`;
        } else {
          humanMessage = `Pricing for ${updatedNames.join(', ')} successfully updated!\n• ${detailsParts.join('\n• ')}`;
        }
        break;
      }

      // -----------------------------------------------------------------------
      // 6. CREATE COMPLAINT
      // -----------------------------------------------------------------------
      case 'create_complaint': {
        const { guestName = 'Hotel Guest', roomNumber, description = 'Issue reported', category = 'service', priority = 'medium' } = params;
        const complaintId = `cmp_${crypto.randomUUID()}`;

        // Get property
        const prop: any = await env.DB.prepare('SELECT id FROM properties WHERE tenant_id = ? LIMIT 1')
          .bind(tenantId)
          .first();

        await env.DB.prepare(
          `INSERT INTO complaints (id, property_id, tenant_id, guest_name, room_number, category, description, priority, status, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'open', ?, ?)`
        )
          .bind(complaintId, prop?.id || 'prop_default', tenantId, guestName, roomNumber || null, category, description, priority, now, now)
          .run();

        success = true;
        result = { complaintId, guestName, roomNumber, description };
        humanMessage = ctx.language === 'hi' || ctx.language === 'hinglish'
          ? `Complaint #${complaintId.slice(-6)} darj kar li gayi hai (Guest: ${guestName}, Room: ${roomNumber || 'N/A'}).`
          : `Complaint ticket #${complaintId.slice(-6)} recorded for ${guestName} (Room ${roomNumber || 'N/A'}).`;
        break;
      }

      // -----------------------------------------------------------------------
      // 7. OCCUPANCY & REPORTS
      // -----------------------------------------------------------------------
      case 'generate_report':
      case 'get_occupancy': {
        const totalRoomsRow: any = await env.DB.prepare(
          'SELECT COUNT(*) as count FROM rooms WHERE tenant_id = ? AND is_active = 1'
        )
          .bind(tenantId)
          .first();

        const occupiedRoomsRow: any = await env.DB.prepare(
          `SELECT COUNT(*) as count FROM rooms WHERE tenant_id = ? AND status = 'occupied'`
        )
          .bind(tenantId)
          .first();

        const totalRooms = totalRoomsRow?.count || 1;
        const occupied = occupiedRoomsRow?.count || 0;
        const occupancyRate = Math.round((occupied / totalRooms) * 100);

        success = true;
        result = { totalRooms, occupied, occupancyRate };
        humanMessage = ctx.language === 'hi' || ctx.language === 'hinglish'
          ? `Total rooms: ${totalRooms}. Filhal occupied: ${occupied}. Current occupancy rate: ${occupancyRate}%.`
          : `Total rooms: ${totalRooms}, Occupied: ${occupied}. Current occupancy rate: ${occupancyRate}%.`;
        break;
      }



      // -----------------------------------------------------------------------
      // 9. SET DATE-SPECIFIC RATE
      // -----------------------------------------------------------------------
      case 'set_daily_rate':
      case 'set_date_rate': {
        const { startDate, endDate, priceRupees, pricePaise, roomTypeCode } = params;
        const targetPricePaise = pricePaise || (priceRupees ? Math.round(priceRupees * 100) : 0);

        if (!startDate || targetPricePaise <= 0) {
          throw new Error('Start date and valid price are required');
        }

        // Find room type
        let rtQuery = 'SELECT id, property_id, name FROM room_types WHERE tenant_id = ?';
        const rtParams: any[] = [tenantId];
        if (roomTypeCode) {
          rtQuery += ' AND (code = ? OR name LIKE ?)';
          rtParams.push(roomTypeCode, `%${roomTypeCode}%`);
        }
        rtQuery += ' LIMIT 1';

        const rt: any = await env.DB.prepare(rtQuery).bind(...rtParams).first();
        if (!rt) {
          throw new Error('Room type not found');
        }

        const start = new Date(startDate);
        const end = endDate ? new Date(endDate) : new Date(startDate);
        const statements: any[] = [];
        let count = 0;

        const cur = new Date(start);
        while (cur <= end) {
          const dStr = cur.toISOString().split('T')[0];
          const id = `drt_${crypto.randomUUID()}`;
          statements.push(
            env.DB.prepare(
              `INSERT INTO daily_rates (id, property_id, tenant_id, room_type_id, date, price_paise, note, created_at, updated_at)
               VALUES (?, ?, ?, ?, ?, ?, 'AI Agent dynamic update', ?, ?)
               ON CONFLICT(room_type_id, date) DO UPDATE SET price_paise = excluded.price_paise, updated_at = excluded.updated_at`
            ).bind(id, rt.property_id, tenantId, rt.id, dStr, targetPricePaise, now, now)
          );
          count++;
          cur.setDate(cur.getDate() + 1);
        }

        await env.DB.batch(statements);

        success = true;
        result = { roomType: rt.name, startDate, endDate: endDate || startDate, priceRupees: targetPricePaise / 100, daysUpdated: count };
        humanMessage = ctx.language === 'hi' || ctx.language === 'hinglish'
          ? `${rt.name} ke liye ${startDate}${endDate && endDate !== startDate ? ' se ' + endDate : ''} ka rate ₹${(targetPricePaise / 100).toLocaleString('en-IN')} update kar diya gaya hai.`
          : `Updated rate for ${rt.name} to ₹${(targetPricePaise / 100).toLocaleString('en-IN')} for ${startDate}${endDate && endDate !== startDate ? ' to ' + endDate : ''} (${count} date(s)).`;
        break;
      }

      // -----------------------------------------------------------------------
      // 10. MARK ROOM CLEAN / DIRTY
      // -----------------------------------------------------------------------
      case 'mark_room_clean': {
        const { roomNumber } = params;
        const room: any = await env.DB.prepare('SELECT id FROM rooms WHERE room_number = ? AND tenant_id = ?')
          .bind(String(roomNumber), tenantId)
          .first();

        if (!room) {
          throw new Error(`Room ${roomNumber} not found.`);
        }

        await env.DB.prepare('UPDATE rooms SET housekeeping_status = "clean", updated_at = ? WHERE id = ?')
          .bind(now, room.id)
          .run();

        success = true;
        result = { roomNumber, housekeepingStatus: 'clean' };
        humanMessage = ctx.language === 'hi' || ctx.language === 'hinglish'
          ? `Room ${roomNumber} ko clean mark kar diya gaya hai.`
          : `Room ${roomNumber} has been marked as clean.`;
        break;
      }

      case 'mark_room_dirty': {
        const { roomNumber } = params;
        const room: any = await env.DB.prepare('SELECT id FROM rooms WHERE room_number = ? AND tenant_id = ?')
          .bind(String(roomNumber), tenantId)
          .first();

        if (!room) {
          throw new Error(`Room ${roomNumber} not found.`);
        }

        await env.DB.prepare('UPDATE rooms SET housekeeping_status = "dirty", updated_at = ? WHERE id = ?')
          .bind(now, room.id)
          .run();

        success = true;
        result = { roomNumber, housekeepingStatus: 'dirty' };
        humanMessage = ctx.language === 'hi' || ctx.language === 'hinglish'
          ? `Room ${roomNumber} ko dirty mark kar diya gaya hai.`
          : `Room ${roomNumber} has been marked as dirty.`;
        break;
      }

      // -----------------------------------------------------------------------
      // 18. GET PROPERTY PERFORMANCE (Revenue, ADR, RevPAR, Occupancy)
      // -----------------------------------------------------------------------
      case 'get_property_performance': {
        const period = params.period || 'this_month';
        const propRow: any = await env.DB.prepare(
          `SELECT id, name FROM properties WHERE tenant_id = ? ${ctx.propertyId ? 'AND id = ?' : ''} LIMIT 1`
        )
          .bind(...(ctx.propertyId ? [tenantId, ctx.propertyId] : [tenantId]))
          .first();

        const propertyId = propRow?.id;
        const todayIso = new Date().toISOString().slice(0, 10);
        const yesterdayIso = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
        const startOfMonth = Math.floor(new Date(Date.UTC(new Date().getUTCFullYear(), new Date().getUTCMonth(), 1)).getTime() / 1000);

        let queryStart = startOfMonth;
        let queryEnd = Math.floor(Date.now() / 1000);
        let dateFilterIso = '';

        if (period === 'today') {
          queryStart = Math.floor(new Date(Date.UTC(new Date().getUTCFullYear(), new Date().getUTCMonth(), new Date().getUTCDate())).getTime() / 1000);
          dateFilterIso = todayIso;
        } else if (period === 'yesterday') {
          queryStart = Math.floor(new Date(Date.UTC(new Date().getUTCFullYear(), new Date().getUTCMonth(), new Date().getUTCDate() - 1)).getTime() / 1000);
          queryEnd = queryStart + 86400;
          dateFilterIso = yesterdayIso;
        }

        const [payRow, totRoomsRow, occRoomsRow]: any = await Promise.all([
          env.DB.prepare(
            `SELECT SUM(amount_paise) as sum FROM payments
             WHERE tenant_id = ? ${propertyId ? 'AND property_id = ?' : ''} AND status = 'successful' AND created_at >= ? AND created_at <= ?`
          ).bind(...(propertyId ? [tenantId, propertyId, queryStart, queryEnd] : [tenantId, queryStart, queryEnd])).first().catch(() => ({ sum: 0 })),

          env.DB.prepare(
            `SELECT COUNT(*) as count FROM rooms WHERE tenant_id = ? ${propertyId ? 'AND property_id = ?' : ''} AND is_active = 1`
          ).bind(...(propertyId ? [tenantId, propertyId] : [tenantId])).first().catch(() => ({ count: 0 })),

          env.DB.prepare(
            `SELECT COUNT(*) as count, SUM(total_room_charge_paise) as room_rev FROM reservations
             WHERE tenant_id = ? ${propertyId ? 'AND property_id = ?' : ''}
               AND status IN ('confirmed', 'checked_in')
               ${dateFilterIso ? 'AND check_in_date <= ? AND check_out_date > ?' : ''}`
          ).bind(...(dateFilterIso ? (propertyId ? [tenantId, propertyId, dateFilterIso, dateFilterIso] : [tenantId, dateFilterIso, dateFilterIso]) : (propertyId ? [tenantId, propertyId] : [tenantId]))).first().catch(() => ({ count: 0, room_rev: 0 })),
        ]);

        const totalRevenuePaise = Number(payRow?.sum || 0);
        const totalRooms = Number(totRoomsRow?.count || 1);
        const occupiedRooms = Number(occRoomsRow?.count || 0);
        const roomRevenuePaise = Number(occRoomsRow?.room_rev || totalRevenuePaise);

        const occupancyPercent = Math.min(100, Math.round((occupiedRooms / totalRooms) * 100));
        const adrPaise = occupiedRooms > 0 ? Math.round(roomRevenuePaise / occupiedRooms) : 0;
        const revParPaise = totalRooms > 0 ? Math.round(roomRevenuePaise / totalRooms) : 0;

        success = true;
        result = {
          period,
          totalRevenuePaise,
          roomRevenuePaise,
          totalRooms,
          occupiedRooms,
          occupancyPercent,
          adrPaise,
          revParPaise,
        };

        const revRs = (totalRevenuePaise / 100).toLocaleString('en-IN');
        const adrRs = (adrPaise / 100).toLocaleString('en-IN');
        const revParRs = (revParPaise / 100).toLocaleString('en-IN');

        humanMessage = ctx.language === 'hi' || ctx.language === 'hinglish'
          ? `${period.toUpperCase()} Performance: Total Revenue: ₹${revRs}, Occupancy: ${occupancyPercent}% (${occupiedRooms}/${totalRooms} rooms), ADR: ₹${adrRs}, RevPAR: ₹${revParRs}.`
          : `${period.toUpperCase()} Performance: Total Revenue: ₹${revRs}, Occupancy: ${occupancyPercent}% (${occupiedRooms}/${totalRooms} rooms), ADR: ₹${adrRs}, RevPAR: ₹${revParRs}.`;
        break;
      }

      // -----------------------------------------------------------------------
      // 19. GET OCCUPANCY FORECAST
      // -----------------------------------------------------------------------
      case 'get_occupancy_forecast': {
        const daysAhead = Math.min(30, Math.max(1, Number(params.daysAhead || 7)));
        const propRow: any = await env.DB.prepare(
          `SELECT id FROM properties WHERE tenant_id = ? ${ctx.propertyId ? 'AND id = ?' : ''} LIMIT 1`
        )
          .bind(...(ctx.propertyId ? [tenantId, ctx.propertyId] : [tenantId]))
          .first();

        const propertyId = propRow?.id;
        const totRoomsRow: any = await env.DB.prepare(
          `SELECT COUNT(*) as count FROM rooms WHERE tenant_id = ? ${propertyId ? 'AND property_id = ?' : ''} AND is_active = 1`
        ).bind(...(propertyId ? [tenantId, propertyId] : [tenantId])).first().catch(() => ({ count: 10 }));

        const totalRooms = Number(totRoomsRow?.count || 10);
        const forecast: Array<{ date: string; bookedRooms: number; availableRooms: number; occupancyPercent: number }> = [];

        const startDate = new Date();
        for (let i = 0; i < daysAhead; i++) {
          const d = new Date(startDate.getTime() + i * 86400000);
          const dateStr = d.toISOString().slice(0, 10);

          const countRow: any = await env.DB.prepare(
            `SELECT COUNT(*) as count FROM reservations
             WHERE tenant_id = ? ${propertyId ? 'AND property_id = ?' : ''}
               AND status IN ('confirmed', 'checked_in', 'guaranteed')
               AND check_in_date <= ? AND check_out_date > ?`
          ).bind(...(propertyId ? [tenantId, propertyId, dateStr, dateStr] : [tenantId, dateStr, dateStr])).first().catch(() => ({ count: 0 }));

          const booked = Number(countRow?.count || 0);
          const available = Math.max(0, totalRooms - booked);
          const occ = Math.min(100, Math.round((booked / totalRooms) * 100));

          forecast.push({
            date: dateStr,
            bookedRooms: booked,
            availableRooms: available,
            occupancyPercent: occ,
          });
        }

        const avgOcc = Math.round(forecast.reduce((acc, f) => acc + f.occupancyPercent, 0) / forecast.length);

        success = true;
        result = { totalRooms, daysAhead, averageOccupancyPercent: avgOcc, forecast };
        humanMessage = ctx.language === 'hi' || ctx.language === 'hinglish'
          ? `Agale ${daysAhead} dinon ka average occupancy forecast ${avgOcc}% hai. ${forecast[0].date} ko ${forecast[0].bookedRooms} rooms booked (${forecast[0].availableRooms} available) hain.`
          : `Upcoming ${daysAhead}-day forecast average occupancy is ${avgOcc}%. On ${forecast[0].date}, ${forecast[0].bookedRooms} rooms are booked with ${forecast[0].availableRooms} rooms available.`;
        break;
      }

      // -----------------------------------------------------------------------
      // 20. GET PAYMENT RECONCILIATION
      // -----------------------------------------------------------------------
      case 'get_payment_reconciliation': {
        const propRow: any = await env.DB.prepare(
          `SELECT id FROM properties WHERE tenant_id = ? ${ctx.propertyId ? 'AND id = ?' : ''} LIMIT 1`
        )
          .bind(...(ctx.propertyId ? [tenantId, ctx.propertyId] : [tenantId]))
          .first();

        const propertyId = propRow?.id;
        const [payRow, dueRow]: any = await Promise.all([
          env.DB.prepare(
            `SELECT COUNT(*) as count, SUM(amount_paise) as sum FROM payments
             WHERE tenant_id = ? ${propertyId ? 'AND property_id = ?' : ''} AND status = 'successful'`
          ).bind(...(propertyId ? [tenantId, propertyId] : [tenantId])).first().catch(() => ({ count: 0, sum: 0 })),

          env.DB.prepare(
            `SELECT COUNT(*) as count, SUM(balance_amount_paise) as sum FROM reservations
             WHERE tenant_id = ? ${propertyId ? 'AND property_id = ?' : ''}
               AND status IN ('confirmed', 'checked_in') AND balance_amount_paise > 0`
          ).bind(...(propertyId ? [tenantId, propertyId] : [tenantId])).first().catch(() => ({ count: 0, sum: 0 })),
        ]);

        const totalCollectedPaise = Number(payRow?.sum || 0);
        const pendingReceivablesPaise = Number(dueRow?.sum || 0);
        const unpaidFoliosCount = Number(dueRow?.count || 0);

        success = true;
        result = {
          totalCollectedPaise,
          pendingReceivablesPaise,
          unpaidFoliosCount,
          reconciliationStatus: pendingReceivablesPaise === 0 ? 'fully_reconciled' : 'action_required',
        };

        const colRs = (totalCollectedPaise / 100).toLocaleString('en-IN');
        const dueRs = (pendingReceivablesPaise / 100).toLocaleString('en-IN');

        humanMessage = ctx.language === 'hi' || ctx.language === 'hinglish'
          ? `Payment Reconciliation: Total Successful Collections: ₹${colRs}. Pending guest folio balances: ₹${dueRs} (${unpaidFoliosCount} bookings pending settlement).`
          : `Payment Reconciliation: Total Successful Collections: ₹${colRs}. Pending guest folio receivables: ₹${dueRs} across ${unpaidFoliosCount} unsettled bookings.`;
        break;
      }

      // -----------------------------------------------------------------------
      // 21. GET ROOM STATUS
      // -----------------------------------------------------------------------
      case 'get_room_status': {
        const propRow: any = await env.DB.prepare(
          `SELECT id FROM properties WHERE tenant_id = ? ${ctx.propertyId ? 'AND id = ?' : ''} LIMIT 1`
        )
          .bind(...(ctx.propertyId ? [tenantId, ctx.propertyId] : [tenantId]))
          .first();

        const propertyId = propRow?.id;
        const rows: any = await env.DB.prepare(
          `SELECT room_number, status, readiness_status FROM rooms
           WHERE tenant_id = ? ${propertyId ? 'AND property_id = ?' : ''} AND is_active = 1
           ORDER BY room_number ASC`
        ).bind(...(propertyId ? [tenantId, propertyId] : [tenantId])).all().catch(() => ({ results: [] }));

        const rooms = (rows.results || []) as any[];
        const counts = {
          total: rooms.length,
          occupied: rooms.filter((r) => r.status === 'occupied').length,
          vacant: rooms.filter((r) => r.status === 'vacant' || r.status === 'available').length,
          dirty: rooms.filter((r) => r.readiness_status === 'dirty').length,
          cleaning: rooms.filter((r) => r.readiness_status === 'cleaning').length,
          inspected: rooms.filter((r) => r.readiness_status === 'inspected').length,
          ready: rooms.filter((r) => r.readiness_status === 'ready').length,
          maintenance: rooms.filter((r) => r.status === 'maintenance' || r.readiness_status === 'maintenance').length,
        };

        success = true;
        result = { counts, rooms };
        humanMessage = ctx.language === 'hi' || ctx.language === 'hinglish'
          ? `Room Status Summary: Total ${counts.total} rooms. ${counts.occupied} Occupied, ${counts.vacant} Vacant. Readiness: ${counts.ready} Ready, ${counts.inspected} Inspected, ${counts.cleaning} Cleaning, ${counts.dirty} Dirty, ${counts.maintenance} Maintenance.`
          : `Room Status Summary: Total ${counts.total} rooms. ${counts.occupied} Occupied, ${counts.vacant} Vacant. Readiness: ${counts.ready} Ready, ${counts.inspected} Inspected, ${counts.cleaning} Cleaning, ${counts.dirty} Dirty, ${counts.maintenance} Maintenance.`;
        break;
      }

      // -----------------------------------------------------------------------
      // 22. GET OPEN GUEST COMPLAINTS
      // -----------------------------------------------------------------------
      case 'get_open_guest_complaints': {
        const propRow: any = await env.DB.prepare(
          `SELECT id FROM properties WHERE tenant_id = ? ${ctx.propertyId ? 'AND id = ?' : ''} LIMIT 1`
        )
          .bind(...(ctx.propertyId ? [tenantId, ctx.propertyId] : [tenantId]))
          .first();

        const propertyId = propRow?.id;
        const rows: any = await env.DB.prepare(
          `SELECT id, room_number, guest_name, category, description, priority, status, created_at
           FROM complaints
           WHERE tenant_id = ? ${propertyId ? 'AND property_id = ?' : ''} AND status != 'resolved'
           ORDER BY created_at DESC LIMIT 15`
        ).bind(...(propertyId ? [tenantId, propertyId] : [tenantId])).all().catch(() => ({ results: [] }));

        const complaints = (rows.results || []) as any[];
        const urgentCount = complaints.filter((c) => c.priority === 'urgent' || c.priority === 'high').length;

        success = true;
        result = { count: complaints.length, urgentCount, complaints };
        humanMessage = ctx.language === 'hi' || ctx.language === 'hinglish'
          ? `Total ${complaints.length} open complaints hain (${urgentCount} high/urgent priority). ${complaints.length > 0 ? `Latest: Room ${complaints[0].room_number || 'General'} - "${complaints[0].description}"` : 'Koi open complaint nahi hai.'}`
          : `There are ${complaints.length} open complaints (${urgentCount} high/urgent priority). ${complaints.length > 0 ? `Latest: Room ${complaints[0].room_number || 'General'} - "${complaints[0].description}"` : 'No open complaints.'}`;
        break;
      }

      // -----------------------------------------------------------------------
      // 23. GET HOUSEKEEPING TASKS
      // -----------------------------------------------------------------------
      case 'get_housekeeping_tasks': {
        const propRow: any = await env.DB.prepare(
          `SELECT id FROM properties WHERE tenant_id = ? ${ctx.propertyId ? 'AND id = ?' : ''} LIMIT 1`
        )
          .bind(...(ctx.propertyId ? [tenantId, ctx.propertyId] : [tenantId]))
          .first();

        const propertyId = propRow?.id;
        const rows: any = await env.DB.prepare(
          `SELECT id, room_number, task_type, priority, status, notes, assigned_to_name, created_at
           FROM housekeeping_tasks
           WHERE tenant_id = ? ${propertyId ? 'AND property_id = ?' : ''} AND status IN ('pending', 'in_progress')
           ORDER BY priority DESC, created_at ASC`
        ).bind(...(propertyId ? [tenantId, propertyId] : [tenantId])).all().catch(() => ({ results: [] }));

        const tasks = (rows.results || []) as any[];

        success = true;
        result = { count: tasks.length, tasks };
        humanMessage = ctx.language === 'hi' || ctx.language === 'hinglish'
          ? `Housekeeping Tasks: ${tasks.length} active tasks hain. ${tasks.length > 0 ? `Room ${tasks[0].room_number || 'General'} status: ${tasks[0].status} (Assigned: ${tasks[0].assigned_to_name || 'Unassigned'}).` : 'Sabhi rooms clean hain.'}`
          : `Housekeeping Tasks: ${tasks.length} active tasks. ${tasks.length > 0 ? `Room ${tasks[0].room_number || 'General'} status: ${tasks[0].status} (Assigned: ${tasks[0].assigned_to_name || 'Unassigned'}).` : 'All housekeeping tasks completed.'}`;
        break;
      }

      // -----------------------------------------------------------------------
      // 24. GET LAUNDRY & LINEN STOCK
      // -----------------------------------------------------------------------
      case 'get_laundry_stock': {
        const propRow: any = await env.DB.prepare(
          `SELECT id FROM properties WHERE tenant_id = ? ${ctx.propertyId ? 'AND id = ?' : ''} LIMIT 1`
        )
          .bind(...(ctx.propertyId ? [tenantId, ctx.propertyId] : [tenantId]))
          .first();

        const propertyId = propRow?.id;
        const rows: any = await env.DB.prepare(
          `SELECT item_name, category, total_stock, in_rooms, in_stock_clean, in_laundry, par_level, unit
           FROM linen_inventory
           WHERE tenant_id = ? ${propertyId ? 'AND property_id = ?' : ''}
           ORDER BY in_stock_clean ASC`
        ).bind(...(propertyId ? [tenantId, propertyId] : [tenantId])).all().catch(() => ({ results: [] }));

        const items = (rows.results || []) as any[];
        const belowPar = items.filter((it) => it.in_stock_clean < it.par_level);

        success = true;
        result = { totalItems: items.length, itemsBelowPar: belowPar.length, items };
        humanMessage = ctx.language === 'hi' || ctx.language === 'hinglish'
          ? `Linen Inventory: ${items.length} items tracked. ${belowPar.length > 0 ? `Warning: ${belowPar.length} items par level se neeche hain (${belowPar.map((b) => `${b.item_name}: ${b.in_stock_clean}/${b.par_level}`).join(', ')}).` : 'Sabhi linen items safe par level par hain.'}`
          : `Linen Inventory: ${items.length} items tracked. ${belowPar.length > 0 ? `Warning: ${belowPar.length} items below safety par (${belowPar.map((b) => `${b.item_name}: ${b.in_stock_clean}/${b.par_level}`).join(', ')}).` : 'All linen inventory items are above configured par levels.'}`;
        break;
      }

      // -----------------------------------------------------------------------
      // 25. GET FOOD STOCK & RASAN FORECAST
      // -----------------------------------------------------------------------
      case 'get_food_stock_forecast': {
        const daysAhead = Math.min(14, Math.max(1, Number(params.daysAhead || 7)));
        const propRow: any = await env.DB.prepare(
          `SELECT id FROM properties WHERE tenant_id = ? ${ctx.propertyId ? 'AND id = ?' : ''} LIMIT 1`
        )
          .bind(...(ctx.propertyId ? [tenantId, ctx.propertyId] : [tenantId]))
          .first();

        const propertyId = propRow?.id;

        // 1. Calculate projected covers
        const nowIso = new Date().toISOString().slice(0, 10);
        const endIso = new Date(Date.now() + daysAhead * 86400000).toISOString().slice(0, 10);

        const guestRow: any = await env.DB.prepare(
          `SELECT SUM(adults + children) as total_guests FROM reservations
           WHERE tenant_id = ? ${propertyId ? 'AND property_id = ?' : ''}
             AND status IN ('confirmed', 'checked_in')
             AND check_in_date < ? AND check_out_date > ?`
        ).bind(...(propertyId ? [tenantId, propertyId, endIso, nowIso] : [tenantId, endIso, nowIso])).first().catch(() => ({ total_guests: 0 }));

        const estimatedGuests = Math.max(10, Number(guestRow?.total_guests || 25));

        // 2. Fetch inventory and recipe assumptions
        const [invRows, recRows]: any = await Promise.all([
          env.DB.prepare(
            `SELECT id, item_name, current_usable_stock, unit, safety_stock, supplier_lead_days, cost_per_unit_paise
             FROM food_inventory_items WHERE tenant_id = ? ${propertyId ? 'AND property_id = ?' : ''}`
          ).bind(...(propertyId ? [tenantId, propertyId] : [tenantId])).all().catch(() => ({ results: [] })),

          env.DB.prepare(
            `SELECT item_id, standard_name, grams_per_guest
             FROM food_recipes_assumptions WHERE tenant_id = ? ${propertyId ? 'AND property_id = ?' : ''}`
          ).bind(...(propertyId ? [tenantId, propertyId] : [tenantId])).all().catch(() => ({ results: [] })),
        ]);

        const inventory = (invRows.results || []) as any[];
        const recipes = (recRows.results || []) as any[];

        const recipeMap = new Map<string, number>();
        for (const r of recipes) {
          recipeMap.set(r.item_id, Number(r.grams_per_guest || 0));
        }

        const itemsForecast: any[] = [];
        let shortagesCount = 0;

        for (const item of inventory) {
          const gramsPerGuest = recipeMap.get(item.id) || 400; // Default 400g/guest if not explicitly configured
          const requiredKg = (gramsPerGuest * estimatedGuests * daysAhead) / 1000;
          const currentStock = Number(item.current_usable_stock || 0);
          const shortage = Math.max(0, requiredKg - currentStock);
          const needsReorder = currentStock < item.safety_stock || shortage > 0;

          if (needsReorder) shortagesCount++;

          const reorderDays = Math.max(1, (item.supplier_lead_days || 2));
          const suggestDate = new Date(Date.now() + Math.max(1, reorderDays - 1) * 86400000).toISOString().slice(0, 10);

          itemsForecast.push({
            itemName: item.item_name,
            currentStock: `${currentStock} ${item.unit}`,
            requiredForecast: `${requiredKg.toFixed(1)} ${item.unit}`,
            shortage: `${shortage.toFixed(1)} ${item.unit}`,
            suggestedReorderDate: needsReorder ? suggestDate : 'Stock Adequate',
            needsReorder,
          });
        }

        success = true;
        result = {
          daysAhead,
          estimatedGuests,
          shortagesCount,
          itemsForecast,
        };

        humanMessage = ctx.language === 'hi' || ctx.language === 'hinglish'
          ? `Food & Rasan Forecast (${daysAhead} days, est. ${estimatedGuests} guests): ${shortagesCount} items ko reorder ki zaroorat hai. (e.g. Potato/Rice requirements calculated against kitchen consumption standards).`
          : `Food & Rasan Procurement Forecast (${daysAhead} days, est. ${estimatedGuests} guests): ${shortagesCount} items require reordering based on recipe consumption standards.`;
        break;
      }

      // -----------------------------------------------------------------------
      // 26. GET PROFIT AND LOSS
      // -----------------------------------------------------------------------
      case 'get_profit_and_loss': {
        const period = params.period || 'this_month';
        const propRow: any = await env.DB.prepare(
          `SELECT id FROM properties WHERE tenant_id = ? ${ctx.propertyId ? 'AND id = ?' : ''} LIMIT 1`
        )
          .bind(...(ctx.propertyId ? [tenantId, ctx.propertyId] : [tenantId]))
          .first();

        const propertyId = propRow?.id;
        const nowTime = Math.floor(Date.now() / 1000);
        let startTimestamp = Math.floor(new Date(Date.UTC(new Date().getUTCFullYear(), new Date().getUTCMonth(), 1)).getTime() / 1000);

        if (period === 'today') {
          startTimestamp = Math.floor(new Date(Date.UTC(new Date().getUTCFullYear(), new Date().getUTCMonth(), new Date().getUTCDate())).getTime() / 1000);
        }

        const [revRow, expRow, salRow]: any = await Promise.all([
          env.DB.prepare(
            `SELECT SUM(amount_paise) as sum FROM payments
             WHERE tenant_id = ? ${propertyId ? 'AND property_id = ?' : ''} AND status = 'successful' AND created_at >= ?`
          ).bind(...(propertyId ? [tenantId, propertyId, startTimestamp] : [tenantId, startTimestamp])).first().catch(() => ({ sum: 0 })),

          env.DB.prepare(
            `SELECT SUM(amount_paise) as sum FROM property_expenses
             WHERE tenant_id = ? ${propertyId ? 'AND property_id = ?' : ''} AND expense_date >= ?`
          ).bind(...(propertyId ? [tenantId, propertyId, new Date(startTimestamp * 1000).toISOString().slice(0, 10)] : [tenantId, new Date(startTimestamp * 1000).toISOString().slice(0, 10)])).first().catch(() => ({ sum: 0 })),

          env.DB.prepare(
            `SELECT SUM(paid_amount_paise) as sum FROM salary_payments
             WHERE tenant_id = ? ${propertyId ? 'AND property_id = ?' : ''} AND payment_date >= ?`
          ).bind(...(propertyId ? [tenantId, propertyId, new Date(startTimestamp * 1000).toISOString().slice(0, 10)] : [tenantId, new Date(startTimestamp * 1000).toISOString().slice(0, 10)])).first().catch(() => ({ sum: 0 })),
        ]);

        const revenuePaise = Number(revRow?.sum || 0);
        const propertyExpensesPaise = Number(expRow?.sum || 0);
        const salaryExpensesPaise = Number(salRow?.sum || 0);
        const totalExpensesPaise = propertyExpensesPaise + salaryExpensesPaise;
        const netOperatingProfitPaise = revenuePaise - totalExpensesPaise;

        const revRs = (revenuePaise / 100).toLocaleString('en-IN');
        const expRs = (totalExpensesPaise / 100).toLocaleString('en-IN');
        const profitRs = (netOperatingProfitPaise / 100).toLocaleString('en-IN');

        success = true;
        result = {
          period,
          revenuePaise,
          propertyExpensesPaise,
          salaryExpensesPaise,
          totalExpensesPaise,
          netOperatingProfitPaise,
        };

        humanMessage = ctx.language === 'hi' || ctx.language === 'hinglish'
          ? `Profit & Loss (${period.toUpperCase()}): Total Revenue: ₹${revRs}, Operating Expenses: ₹${expRs}, Estimated Net Operating Profit: ₹${profitRs}.`
          : `Profit & Loss Statement (${period.toUpperCase()}): Operating Revenue: ₹${revRs}, Total Expenses: ₹${expRs}, Estimated Net Operating Profit: ₹${profitRs}.`;
        break;
      }

      // -----------------------------------------------------------------------
      // 27. GET MARKETING PERFORMANCE
      // -----------------------------------------------------------------------
      case 'get_marketing_performance': {
        const propRow: any = await env.DB.prepare(
          `SELECT id FROM properties WHERE tenant_id = ? ${ctx.propertyId ? 'AND id = ?' : ''} LIMIT 1`
        )
          .bind(...(ctx.propertyId ? [tenantId, ctx.propertyId] : [tenantId]))
          .first();

        const propertyId = propRow?.id;
        const rows: any = await env.DB.prepare(
          `SELECT title, channel, utm_campaign, status, inquiries_count, bookings_count, revenue_generated_paise
           FROM marketing_campaigns
           WHERE tenant_id = ? ${propertyId ? 'AND property_id = ?' : ''}
           ORDER BY created_at DESC LIMIT 10`
        ).bind(...(propertyId ? [tenantId, propertyId] : [tenantId])).all().catch(() => ({ results: [] }));

        const campaigns = (rows.results || []) as any[];
        const totalInquiries = campaigns.reduce((acc, c) => acc + Number(c.inquiries_count || 0), 0);
        const totalBookings = campaigns.reduce((acc, c) => acc + Number(c.bookings_count || 0), 0);
        const totalRevenuePaise = campaigns.reduce((acc, c) => acc + Number(c.revenue_generated_paise || 0), 0);

        success = true;
        result = { campaignsCount: campaigns.length, totalInquiries, totalBookings, totalRevenuePaise, campaigns };
        const revRs = (totalRevenuePaise / 100).toLocaleString('en-IN');

        humanMessage = ctx.language === 'hi' || ctx.language === 'hinglish'
          ? `Marketing Performance: ${campaigns.length} campaigns tracked. Generated ${totalInquiries} inquiries, ${totalBookings} confirmed bookings, and ₹${revRs} direct revenue.`
          : `Marketing Performance: ${campaigns.length} campaigns tracked. Generated ${totalInquiries} inquiries, ${totalBookings} confirmed bookings, and ₹${revRs} direct revenue.`;
        break;
      }

      // -----------------------------------------------------------------------
      // 28. CREATE STAFF TASK
      // -----------------------------------------------------------------------
      case 'create_staff_task': {
        const { taskType = 'housekeeping', roomNumber, notes, priority = 'normal' } = params;
        if (!notes) {
          throw new Error('Task notes/instructions are required.');
        }

        const propRow: any = await env.DB.prepare(
          `SELECT id FROM properties WHERE tenant_id = ? ${ctx.propertyId ? 'AND id = ?' : ''} LIMIT 1`
        )
          .bind(...(ctx.propertyId ? [tenantId, ctx.propertyId] : [tenantId]))
          .first();

        const propertyId = propRow?.id || ctx.propertyId;
        const taskId = `task_${crypto.randomUUID().slice(0, 8)}`;

        if (taskType === 'housekeeping') {
          await env.DB.prepare(
            `INSERT INTO housekeeping_tasks (id, property_id, tenant_id, room_number, task_type, priority, status, notes, created_at, updated_at)
             VALUES (?, ?, ?, ?, 'turnover_clean', ?, 'pending', ?, ?, ?)`
          )
            .bind(taskId, propertyId, tenantId, roomNumber ? String(roomNumber) : null, priority, notes, now, now)
            .run();
        } else {
          await env.DB.prepare(
            `INSERT INTO maintenance_tickets (id, property_id, tenant_id, room_id, title, description, priority, status, created_at, updated_at)
             VALUES (?, ?, ?, NULL, ?, ?, ?, 'open', ?, ?)`
          )
            .bind(taskId, propertyId, tenantId, roomNumber ? `Room ${roomNumber}` : 'General Maintenance', notes, priority, now, now)
            .run();
        }

        success = true;
        result = { taskId, taskType, roomNumber, notes, priority };
        humanMessage = ctx.language === 'hi' || ctx.language === 'hinglish'
          ? `Staff task (${taskType.toUpperCase()}) successfully create kar diya gaya hai for ${roomNumber ? `Room ${roomNumber}` : 'General'}.`
          : `Staff task (${taskType.toUpperCase()}) successfully created for ${roomNumber ? `Room ${roomNumber}` : 'General'}.`;
        break;
      }

      // -----------------------------------------------------------------------
      // 29. DRAFT MARKETING CAMPAIGN
      // -----------------------------------------------------------------------
      case 'draft_marketing_campaign': {
        const { theme, channel = 'whatsapp' } = params;
        if (!theme) {
          throw new Error('Campaign theme is required.');
        }

        const propRow: any = await env.DB.prepare(
          `SELECT id, name FROM properties WHERE tenant_id = ? ${ctx.propertyId ? 'AND id = ?' : ''} LIMIT 1`
        )
          .bind(...(ctx.propertyId ? [tenantId, ctx.propertyId] : [tenantId]))
          .first();

        const propertyId = propRow?.id;
        const propertyName = propRow?.name || 'Hotel';
        const campaignId = `camp_${crypto.randomUUID().slice(0, 8)}`;
        const utmCode = `hf_${theme.toLowerCase().replace(/[^a-z0-9]/g, '_')}_${Date.now().toString().slice(-4)}`;

        const draftContent = `Celebrate ${theme} at ${propertyName}! Enjoy luxurious stays, pure hospitality, and exclusive direct-booking savings. Book directly with zero platform fee: https://hotelflexi.com/book/${propRow?.id}?utm_campaign=${utmCode}`;

        await env.DB.prepare(
          `INSERT INTO marketing_campaigns (id, tenant_id, property_id, title, channel, content, utm_campaign, status, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, 'draft', ?, ?)`
        )
          .bind(campaignId, tenantId, propertyId, `${theme} Offer`, channel, draftContent, utmCode, now, now)
          .run();

        success = true;
        result = { campaignId, title: `${theme} Offer`, channel, utmCode, draftContent };
        humanMessage = ctx.language === 'hi' || ctx.language === 'hinglish'
          ? `Marketing campaign draft "${theme} Offer" create ho gaya hai (${channel}). UTM code: ${utmCode}.`
          : `Marketing campaign draft "${theme} Offer" created for ${channel}. Tracked with UTM: ${utmCode}.`;
        break;
      }

      // -----------------------------------------------------------------------
      // 30. PREPARE RATE RECOMMENDATION
      // -----------------------------------------------------------------------
      case 'prepare_rate_recommendation': {
        const targetDate = params.targetDate || new Date(Date.now() + 86400000).toISOString().slice(0, 10);
        const propRow: any = await env.DB.prepare(
          `SELECT id FROM properties WHERE tenant_id = ? ${ctx.propertyId ? 'AND id = ?' : ''} LIMIT 1`
        )
          .bind(...(ctx.propertyId ? [tenantId, ctx.propertyId] : [tenantId]))
          .first();

        const propertyId = propRow?.id;
        const [totRow, bookedRow]: any = await Promise.all([
          env.DB.prepare(`SELECT COUNT(*) as count FROM rooms WHERE tenant_id = ? ${propertyId ? 'AND property_id = ?' : ''} AND is_active = 1`)
            .bind(...(propertyId ? [tenantId, propertyId] : [tenantId])).first().catch(() => ({ count: 10 })),

          env.DB.prepare(
            `SELECT COUNT(*) as count FROM reservations
             WHERE tenant_id = ? ${propertyId ? 'AND property_id = ?' : ''}
               AND status IN ('confirmed', 'checked_in')
               AND check_in_date <= ? AND check_out_date > ?`
          ).bind(...(propertyId ? [tenantId, propertyId, targetDate, targetDate] : [tenantId, targetDate, targetDate])).first().catch(() => ({ count: 0 })),
        ]);

        const totalRooms = Number(totRow?.count || 10);
        const bookedRooms = Number(bookedRow?.count || 0);
        const occupancy = Math.round((bookedRooms / totalRooms) * 100);

        let recommendation = '';
        let adjustmentPct = 0;

        if (occupancy >= 80) {
          recommendation = `High demand detected (${occupancy}% booked). Recommend increasing base tariff by +15% to maximize RevPAR.`;
          adjustmentPct = 15;
        } else if (occupancy <= 30) {
          recommendation = `Low booking pace (${occupancy}% booked). Recommend a temporary -10% early-bird promotion on direct booking engine to stimulate occupancy.`;
          adjustmentPct = -10;
        } else {
          recommendation = `Balanced booking pace (${occupancy}% booked). Current rate plan is performing optimally.`;
          adjustmentPct = 0;
        }

        success = true;
        result = { targetDate, totalRooms, bookedRooms, occupancyPercent: occupancy, adjustmentPct, recommendation };
        humanMessage = ctx.language === 'hi' || ctx.language === 'hinglish'
          ? `Rate Recommendation for ${targetDate}: ${occupancy}% occupancy. ${recommendation}`
          : `Rate Recommendation for ${targetDate}: ${occupancy}% occupancy. ${recommendation}`;
        break;
      }

      // -----------------------------------------------------------------------
      // 14. GET PROPERTY SETUP STATUS
      // -----------------------------------------------------------------------
      case 'get_property_setup_status': {
        const propRow: any = await env.DB.prepare(
          `SELECT p.*, ps.gst_number, ps.razorpay_enabled, ps.razorpay_key_id
           FROM properties p
           LEFT JOIN property_settings ps ON ps.property_id = p.id
           WHERE p.tenant_id = ? ${ctx.propertyId ? 'AND p.id = ?' : ''} LIMIT 1`
        )
          .bind(...(ctx.propertyId ? [tenantId, ctx.propertyId] : [tenantId]))
          .first();

        if (!propRow) {
          throw new Error('No active property found for this hotel workspace.');
        }

        const [typesRow, roomsRow, ratesRow, taxesRow]: any = await Promise.all([
          env.DB.prepare(`SELECT COUNT(*) as cnt FROM room_types WHERE property_id = ? AND is_active = 1`).bind(propRow.id).first(),
          env.DB.prepare(`SELECT COUNT(*) as cnt FROM rooms WHERE property_id = ? AND is_active = 1`).bind(propRow.id).first(),
          env.DB.prepare(`SELECT COUNT(*) as cnt FROM rate_plans WHERE property_id = ? AND is_active = 1`).bind(propRow.id).first(),
          env.DB.prepare(`SELECT COUNT(*) as cnt FROM property_tax_rules WHERE property_id = ? AND is_active = 1`).bind(propRow.id).first(),
        ]);

        const catCount = typesRow?.cnt || 0;
        const rmCount = roomsRow?.cnt || 0;
        const rateCount = ratesRow?.cnt || 0;
        const taxCount = taxesRow?.cnt || 0;

        success = true;
        result = {
          propertyId: propRow.id,
          propertyName: propRow.name,
          categoriesCount: catCount,
          roomsCount: rmCount,
          ratePlansCount: rateCount,
          customTaxesCount: taxCount,
          hasGst: Boolean(propRow.gst_number),
          hasRazorpay: Boolean(propRow.razorpay_enabled === 1 && propRow.razorpay_key_id),
        };

        humanMessage = ctx.language === 'hi' || ctx.language === 'hinglish'
          ? `Property Setup Status for ${propRow.name}: ${catCount} room categories, ${rmCount} physical rooms, ${rateCount} rate plans. GST: ${propRow.gst_number ? 'Configured' : 'Pending'}.`
          : `Property Setup Status for ${propRow.name}: ${catCount} room categories, ${rmCount} physical rooms, ${rateCount} rate plans. GST: ${propRow.gst_number ? 'Configured' : 'Pending'}.`;
        break;
      }

      // -----------------------------------------------------------------------
      // 15. GET ROOM CATEGORIES & ROOM TYPES
      // -----------------------------------------------------------------------
      case 'get_room_categories':
      case 'get_room_types': {
        const propRow: any = await env.DB.prepare(
          `SELECT id FROM properties WHERE tenant_id = ? ${ctx.propertyId ? 'AND id = ?' : ''} LIMIT 1`
        )
          .bind(...(ctx.propertyId ? [tenantId, ctx.propertyId] : [tenantId]))
          .first();

        if (!propRow) throw new Error('Property not found');

        const types: any = await env.DB.prepare(
          `SELECT rt.*, (SELECT COUNT(*) FROM rooms r WHERE r.room_type_id = rt.id AND r.is_active = 1) as room_count
           FROM room_types rt
           WHERE rt.property_id = ? AND rt.tenant_id = ? AND rt.is_active = 1
           ORDER BY rt.base_price_paise ASC`
        )
          .bind(propRow.id, tenantId)
          .all();

        const categories = (types.results || []).map((t: any) => ({
          id: t.id,
          name: t.name,
          code: t.code,
          baseOccupancy: t.base_occupancy,
          maxOccupancy: t.max_occupancy,
          basePriceRupees: t.base_price_paise / 100,
          extraAdultPriceRupees: (t.extra_adult_price_paise || 0) / 100,
          roomCount: t.room_count,
        }));

        success = true;
        result = { categories };
        humanMessage = `Found ${categories.length} room categories:\n` +
          categories.map((c: any) => `• ${c.name} (${c.code}): ₹${c.basePriceRupees}/night for ${c.baseOccupancy} guests (${c.roomCount} rooms)`).join('\n');
        break;
      }

      // -----------------------------------------------------------------------
      // 16. PREPARE ROOM CATEGORY & ROOM TYPE
      // -----------------------------------------------------------------------
      case 'prepare_room_category':
      case 'prepare_room_type': {
        const { name, code, baseOccupancy = 2, maxOccupancy = 3, basePriceRupees, extraAdultPriceRupees = 0, roomCount = 0, description } = params;

        if (!name || basePriceRupees === undefined) {
          throw new Error('Room category name and basePriceRupees are required.');
        }

        const propRow: any = await env.DB.prepare(
          `SELECT id FROM properties WHERE tenant_id = ? ${ctx.propertyId ? 'AND id = ?' : ''} LIMIT 1`
        )
          .bind(...(ctx.propertyId ? [tenantId, ctx.propertyId] : [tenantId]))
          .first();

        if (!propRow) throw new Error('Property not found');

        const catCode = (code || name.slice(0, 3)).toUpperCase().replace(/[^A-Z0-9]/g, '');
        const basePricePaise = Math.round(Number(basePriceRupees) * 100);
        const extraAdultPaise = Math.round(Number(extraAdultPriceRupees) * 100);

        // Check if exists
        const existingCat: any = await env.DB.prepare(
          `SELECT id FROM room_types WHERE property_id = ? AND tenant_id = ? AND (LOWER(name) = LOWER(?) OR code = ?)`
        )
          .bind(propRow.id, tenantId, name.trim(), catCode)
          .first();

        let typeId = existingCat?.id;
        if (existingCat) {
          await env.DB.prepare(
            `UPDATE room_types SET
              base_occupancy = ?, max_occupancy = ?, base_price_paise = ?, extra_adult_price_paise = ?
             WHERE id = ?`
          )
            .bind(Number(baseOccupancy), Number(maxOccupancy), basePricePaise, extraAdultPaise, existingCat.id)
            .run();
        } else {
          typeId = `rt_${crypto.randomUUID().slice(0, 8)}`;
          await env.DB.prepare(
            `INSERT INTO room_types (
              id, property_id, tenant_id, name, code,
              base_occupancy, max_occupancy, base_price_paise, extra_adult_price_paise, description, is_active
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)`
          )
            .bind(typeId, propRow.id, tenantId, name.trim(), catCode, Number(baseOccupancy), Number(maxOccupancy), basePricePaise, extraAdultPaise, description || null)
            .run();
        }

        // Auto-generate rooms if roomCount provided
        let generatedRooms: string[] = [];
        if (Number(roomCount) > 0) {
          for (let i = 1; i <= Number(roomCount); i++) {
            const roomNum = `${catCode.slice(0, 2)}-${100 + i}`;
            const rId = `rm_${crypto.randomUUID().slice(0, 8)}`;
            try {
              await env.DB.prepare(
                `INSERT INTO rooms (id, property_id, tenant_id, room_type_id, room_number, floor, status, housekeeping_status, is_active, created_at, updated_at)
                 VALUES (?, ?, ?, ?, ?, '1st Floor', 'available', 'clean', 1, ?, ?)`
              )
                .bind(rId, propRow.id, tenantId, typeId, roomNum, now, now)
                .run();
              generatedRooms.push(roomNum);
            } catch {}
          }
        }

        success = true;
        result = { typeId, name, code: catCode, basePriceRupees, generatedRooms };
        humanMessage = `Room category "${name}" (${catCode}) configured successfully at ₹${basePriceRupees}/night for ${baseOccupancy} guests.` +
          (generatedRooms.length > 0 ? ` Automatically generated ${generatedRooms.length} rooms: ${generatedRooms.join(', ')}.` : '');
        break;
      }

      // -----------------------------------------------------------------------
      // 17. PREPARE RATE PLAN
      // -----------------------------------------------------------------------
      case 'prepare_rate_plan': {
        const { name, code, roomCategoryName, mealPlan = 'EP', priceMultiplier = 100, surchargeRupees = 0, isNonRefundable = false } = params;

        if (!name) throw new Error('Rate plan name is required.');

        const propRow: any = await env.DB.prepare(
          `SELECT id FROM properties WHERE tenant_id = ? ${ctx.propertyId ? 'AND id = ?' : ''} LIMIT 1`
        )
          .bind(...(ctx.propertyId ? [tenantId, ctx.propertyId] : [tenantId]))
          .first();

        if (!propRow) throw new Error('Property not found');

        let roomTypeId: string | null = null;
        if (roomCategoryName) {
          const catRow: any = await env.DB.prepare(
            `SELECT id FROM room_types WHERE property_id = ? AND tenant_id = ? AND LOWER(name) = LOWER(?) LIMIT 1`
          )
            .bind(propRow.id, tenantId, roomCategoryName.trim())
            .first();
          roomTypeId = catRow?.id || null;
        }

        const planId = `rp_${crypto.randomUUID().slice(0, 8)}`;
        const planCode = (code || name.slice(0, 4)).toUpperCase().replace(/[^A-Z0-9]/g, '');

        await env.DB.prepare(
          `INSERT INTO rate_plans (
            id, property_id, tenant_id, room_type_id, name, code,
            meal_plan, price_multiplier, surcharge_paise, is_non_refundable, is_active, created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?)`
        )
          .bind(
            planId,
            propRow.id,
            tenantId,
            roomTypeId,
            name.trim(),
            planCode,
            mealPlan,
            Number(priceMultiplier) || 100,
            Math.round(Number(surchargeRupees || 0) * 100),
            isNonRefundable ? 1 : 0,
            now,
            now
          )
          .run();

        success = true;
        result = { planId, name, code: planCode, mealPlan };
        humanMessage = `Rate plan "${name}" (${planCode} - ${mealPlan}) created successfully.`;
        break;
      }

      // -----------------------------------------------------------------------
      // 18. PREPARE TAX CONFIGURATION
      // -----------------------------------------------------------------------
      case 'prepare_tax_configuration': {
        const { gstNumber, taxName, taxType = 'percentage', ratePercentage, fixedAmountRupees, scope = 'room' } = params;

        const propRow: any = await env.DB.prepare(
          `SELECT id FROM properties WHERE tenant_id = ? ${ctx.propertyId ? 'AND id = ?' : ''} LIMIT 1`
        )
          .bind(...(ctx.propertyId ? [tenantId, ctx.propertyId] : [tenantId]))
          .first();

        if (!propRow) throw new Error('Property not found');

        let msg = '';
        if (gstNumber) {
          await env.DB.prepare(
            `UPDATE property_settings SET gst_number = ?, updated_at = ? WHERE property_id = ? AND tenant_id = ?`
          )
            .bind(gstNumber.trim().toUpperCase(), now, propRow.id, tenantId)
            .run();
          msg += `GSTIN updated to ${gstNumber.toUpperCase()}. `;
        }

        if (taxName) {
          const ruleId = `tax_${crypto.randomUUID().slice(0, 8)}`;
          const rateBps = Math.round((Number(ratePercentage) || 0) * 100);
          const fixedPaise = Math.round((Number(fixedAmountRupees) || 0) * 100);

          await env.DB.prepare(
            `INSERT INTO property_tax_rules (
              id, property_id, tenant_id, name, tax_type, rate_basis_points,
              fixed_amount_paise, scope, frequency, is_inclusive, is_active, created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'per_stay', 0, 1, ?, ?)`
          )
            .bind(ruleId, propRow.id, tenantId, taxName.trim(), taxType, rateBps, fixedPaise, scope, now, now)
            .run();
          msg += `Tax rule "${taxName}" (${taxType === 'percentage' ? `${ratePercentage}%` : `₹${fixedAmountRupees}`}) configured.`;
        }

        success = true;
        result = { gstNumber, taxName, status: 'configured' };
        humanMessage = msg || 'Tax settings updated.';
        break;
      }

      // -----------------------------------------------------------------------
      // 19. PREPARE PROPERTY PROFILE & AMENITIES
      // -----------------------------------------------------------------------
      case 'prepare_property_profile':
      case 'prepare_amenities': {
        const propRow: any = await env.DB.prepare(
          `SELECT id, name FROM properties WHERE tenant_id = ? ${ctx.propertyId ? 'AND id = ?' : ''} LIMIT 1`
        )
          .bind(...(ctx.propertyId ? [tenantId, ctx.propertyId] : [tenantId]))
          .first();

        if (!propRow) throw new Error('Property not found');

        const { phone, email, address, city, state, checkInTime, checkOutTime, description, amenities } = params;

        await env.DB.prepare(
          `UPDATE properties SET
            phone = COALESCE(?, phone),
            email = COALESCE(?, email),
            address_line1 = COALESCE(?, address_line1),
            city = COALESCE(?, city),
            state = COALESCE(?, state),
            check_in_time = COALESCE(?, check_in_time),
            check_out_time = COALESCE(?, check_out_time),
            description = COALESCE(?, description),
            updated_at = ?
           WHERE id = ? AND tenant_id = ?`
        )
          .bind(phone || null, email || null, address || null, city || null, state || null, checkInTime || null, checkOutTime || null, description || null, now, propRow.id, tenantId)
          .run();

        success = true;
        result = { propertyId: propRow.id, updated: true };
        humanMessage = `Property profile for ${propRow.name} successfully updated.`;
        break;
      }

      // -----------------------------------------------------------------------
      // 20. VALIDATE & APPLY APPROVED SETUP DRAFT
      // -----------------------------------------------------------------------
      case 'validate_setup_draft': {
        const { draftId } = params;
        if (!draftId) throw new Error('draftId is required.');

        const draft: any = await env.DB.prepare(
          `SELECT * FROM property_setup_drafts WHERE id = ? AND tenant_id = ?`
        )
          .bind(draftId, tenantId)
          .first();

        if (!draft) throw new Error('Draft session not found.');

        const config = draft.extracted_draft ? JSON.parse(draft.extracted_draft) : {};
        const errors: string[] = [];

        for (const cat of config.roomCategories || []) {
          if (!cat.name) errors.push('Room category missing name.');
          if (!cat.basePriceRupees || cat.basePriceRupees <= 0) errors.push(`Category "${cat.name}" has invalid price.`);
        }

        success = errors.length === 0;
        result = { draftId, isValid: errors.length === 0, errors, ambiguities: config.missingOrAmbiguous || [] };
        humanMessage = success
          ? `Draft session ${draftId} is fully valid and ready to be applied!`
          : `Draft session has ${errors.length} validation issues:\n` + errors.map((e) => `• ${e}`).join('\n');
        break;
      }

      case 'apply_approved_setup_draft': {
        const { draftId } = params;
        if (!draftId) throw new Error('draftId is required.');

        const draft: any = await env.DB.prepare(
          `SELECT * FROM property_setup_drafts WHERE id = ? AND tenant_id = ?`
        )
          .bind(draftId, tenantId)
          .first();

        if (!draft) throw new Error('Draft session not found.');
        if (draft.status === 'applied') throw new Error('This draft has already been applied.');

        const config = draft.extracted_draft ? JSON.parse(draft.extracted_draft) : {};
        const propertyId = draft.property_id;

        let createdCats = 0;
        let createdRooms = 0;

        for (const cat of config.roomCategories || []) {
          const typeId = `rt_${crypto.randomUUID().slice(0, 8)}`;
          const code = (cat.code || cat.name.slice(0, 3)).toUpperCase().replace(/[^A-Z0-9]/g, '');
          const basePricePaise = Math.round((Number(cat.basePriceRupees) || 2000) * 100);

          await env.DB.prepare(
            `INSERT INTO room_types (id, property_id, tenant_id, name, code, base_occupancy, max_occupancy, base_price_paise, extra_adult_price_paise, is_active)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1)`
          )
            .bind(typeId, propertyId, tenantId, cat.name.trim(), code, Number(cat.baseOccupancy) || 2, Number(cat.maxOccupancy) || 3, basePricePaise, 0)
            .run();
          createdCats++;
        }

        await env.DB.prepare(`UPDATE property_setup_drafts SET status = 'applied', updated_at = ? WHERE id = ?`)
          .bind(now, draftId)
          .run();

        success = true;
        result = { draftId, createdCategories: createdCats, createdRooms };
        humanMessage = `Draft successfully approved & applied! Created ${createdCats} room categories in your property.`;
        break;
      }

      default:
        throw new Error(`Unknown tool action: ${toolName}`);
    }
  } catch (err: any) {
    success = false;
    error = err.message || 'Execution error';
    humanMessage = ctx.language === 'hi' || ctx.language === 'hinglish'
      ? `Action poora nahi ho saka: ${error}`
      : `Action could not be completed: ${error}`;
  }

  // Record into ai_action_logs safely
  try {
    const logId = `act_${crypto.randomUUID()}`;
    await env.DB.prepare(
      `INSERT INTO ai_action_logs (id, tenant_id, property_id, user_id, tool_name, input_params_json, output_result_json, status, error_message, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
      .bind(
        logId,
        tenantId,
        ctx.propertyId || null,
        effectiveUserId,
        toolName,
        JSON.stringify(params),
        result ? JSON.stringify(result) : null,
        success ? 'success' : 'failure',
        error || null,
        now
      )
      .run();
  } catch (logErr) {
    console.error('Failed to record AI action log:', logErr);
  }

  return { success, result, error, humanMessage };
}
