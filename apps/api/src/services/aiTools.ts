import { Env, AppVariables } from '../types';
import { recordAuditLog } from './audit';

export interface ToolExecutionContext {
  env: Env;
  tenantId: string;
  userId: string;
  role: string;
  propertyId?: string;
  language?: 'en' | 'hi' | 'hinglish';
}

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
