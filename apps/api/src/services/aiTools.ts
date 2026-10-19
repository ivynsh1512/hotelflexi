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

  let success = false;
  let result: any = null;
  let error: string | undefined = undefined;
  let humanMessage = '';

  try {
    switch (toolName) {
      // -----------------------------------------------------------------------
      // 1. BLOCK ROOM
      // -----------------------------------------------------------------------
      case 'block_room': {
        const { roomNumber, startDate, endDate, reason = 'maintenance' } = params;
        if (!roomNumber || !startDate || !endDate) {
          throw new Error('Room number, start date, and end date are required');
        }

        // Find room in tenant
        const room: any = await env.DB.prepare(
          `SELECT id, property_id, room_number FROM rooms WHERE room_number = ? AND tenant_id = ? AND is_active = 1`
        )
          .bind(String(roomNumber), tenantId)
          .first();

        if (!room) {
          throw new Error(`Room ${roomNumber} not found in this hotel.`);
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
          throw new Error(`Cannot block: Room ${roomNumber} is already reserved (#${conflict.reservation_number}) during this period.`);
        }

        const blockId = `blk_${crypto.randomUUID()}`;
        await env.DB.prepare(
          `INSERT INTO room_blocks (id, property_id, tenant_id, room_id, start_date, end_date, reason, created_by_user_id, is_active, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?)`
        )
          .bind(blockId, room.property_id, tenantId, room.id, startDate, endDate, reason, userId, now, now)
          .run();

        success = true;
        result = { blockId, roomNumber, startDate, endDate, reason };
        humanMessage = ctx.language === 'hi' || ctx.language === 'hinglish'
          ? `Room ${roomNumber} ko ${startDate} se ${endDate} tak successfully block kar diya gaya hai (${reason}).`
          : `Room ${roomNumber} has been successfully blocked from ${startDate} to ${endDate} for ${reason}.`;
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
      // 5. UPDATE RATE
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
      // 8. UNBLOCK ROOM
      // -----------------------------------------------------------------------
      case 'unblock_room': {
        const { roomNumber } = params;
        if (!roomNumber) {
          throw new Error('Room number is required');
        }

        const room: any = await env.DB.prepare(
          'SELECT id FROM rooms WHERE room_number = ? AND tenant_id = ?'
        )
          .bind(String(roomNumber), tenantId)
          .first();

        if (!room) {
          throw new Error(`Room ${roomNumber} not found.`);
        }

        await env.DB.prepare(
          'UPDATE room_blocks SET is_active = 0, updated_at = ? WHERE room_id = ? AND tenant_id = ? AND is_active = 1'
        )
          .bind(now, room.id, tenantId)
          .run();

        await env.DB.prepare('UPDATE rooms SET status = "available", updated_at = ? WHERE id = ?')
          .bind(now, room.id)
          .run();

        success = true;
        result = { roomNumber, unblocked: true };
        humanMessage = ctx.language === 'hi' || ctx.language === 'hinglish'
          ? `Room ${roomNumber} ko unblock kar diya gaya hai aur ab booking ke liye available hai.`
          : `Room ${roomNumber} has been unblocked and is now marked as available.`;
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

  // Record into ai_action_logs
  const logId = `act_${crypto.randomUUID()}`;
  await env.DB.prepare(
    `INSERT INTO ai_action_logs (id, tenant_id, property_id, user_id, tool_name, input_params_json, output_result_json, status, error_message, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  )
    .bind(
      logId,
      tenantId,
      ctx.propertyId || null,
      userId,
      toolName,
      JSON.stringify(params),
      result ? JSON.stringify(result) : null,
      success ? 'success' : 'failure',
      error || null,
      now
    )
    .run();

  return { success, result, error, humanMessage };
}
