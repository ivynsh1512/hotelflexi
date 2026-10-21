import { Env } from '../types';

interface BookingNotificationData {
  reservationNumber: string;
  guestName: string;
  guestEmail?: string;
  guestPhone?: string;
  propertyName: string;
  propertyAddress?: string;
  propertyPhone?: string;
  propertyEmail?: string;
  ownerEmail?: string;
  checkInDate: string;
  checkOutDate: string;
  roomTypeName: string;
  roomNumber?: string;
  adults: number;
  children: number;
  totalAmountRupees: string;
  paidAmountRupees: string;
  balanceAmountRupees: string;
  guestPortalUrl: string;
  hasFlexiLink?: boolean;
}

export async function sendBookingEmails(env: Env, data: BookingNotificationData) {
  const apiKey = env.RESEND_API_KEY;
  const fromEmail = env.RESEND_FROM_EMAIL || 'HotelFlexi <info@novaxai.in>';
  const playStoreUrl = env.PLAY_STORE_APP_URL || 'https://play.google.com/store/apps/details?id=in.novaxai.hotelflexiso';
  const adminEmail = env.ADMIN_NOTIFICATION_EMAIL || 'info@novaxai.in';

  const safeRoomTypeName =
    data.roomTypeName &&
    String(data.roomTypeName).toLowerCase() !== 'undefined' &&
    String(data.roomTypeName).trim() !== ''
      ? String(data.roomTypeName).trim()
      : 'Deluxe Room';

  const guestHtml = `
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"><style>
      body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background: #f8fafc; color: #1e293b; padding: 20px; }
      .container { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; overflow: hidden; }
      .header { background: #1e40af; color: #ffffff; padding: 32px 24px; text-align: center; }
      .content { padding: 28px 24px; }
      .card { background: #f8fafc; border-radius: 12px; border: 1px solid #e2e8f0; padding: 20px; margin: 20px 0; }
      .room-box { background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 12px; padding: 16px; margin: 18px 0; text-align: center; }
      .btn { display: inline-block; background: #1e40af; color: #ffffff !important; font-weight: 700; text-decoration: none; padding: 14px 28px; border-radius: 10px; margin: 12px 0; font-size: 14px; }
      .app-box { background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 12px; padding: 18px; margin: 20px 0; text-align: center; }
      .app-btn { display: inline-block; background: #15803d; color: #ffffff !important; font-weight: 700; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-size: 13px; }
      .footer { padding: 20px; text-align: center; font-size: 12px; color: #64748b; background: #f1f5f9; }
      .badge { display: inline-block; padding: 4px 10px; border-radius: 20px; background: #dcfce7; color: #166534; font-weight: 700; font-size: 12px; }
    </style></head>
    <body>
      <div class="container">
        <div class="header">
          <h1 style="margin:0;font-size:24px;">Booking Confirmed!</h1>
          <p style="margin:8px 0 0 0;opacity:0.9;">${data.propertyName}</p>
        </div>
        <div class="content">
          <p>Dear <strong>${data.guestName}</strong>,</p>
          <p>Namaste! Your stay at <strong>${data.propertyName}</strong> has been successfully booked. We look forward to welcoming you.</p>
          
          <!-- ALLOCATED ROOM CODE BOX -->
          <div class="room-box">
            <div style="font-size:11px;color:#1e40af;text-transform:uppercase;font-weight:700;letter-spacing:0.8px;">Allocated Room Code</div>
            <div style="font-size:24px;font-weight:800;color:#1e3a8a;margin:4px 0;font-family:monospace;">
              ${data.roomNumber ? `Room ${data.roomNumber}` : 'Allocated On Check-In'}
            </div>
            <div style="font-size:12px;color:#3b82f6;font-weight:600;">Category: ${safeRoomTypeName}</div>
          </div>

          <div class="card">
            <div style="display:flex;justify-content:space-between;margin-bottom:12px;">
              <span style="font-size:12px;color:#64748b;">Booking Reference:</span>
              <strong style="color:#1e40af;font-family:monospace;">${data.reservationNumber}</strong>
            </div>
            <div style="border-top:1px dashed #cbd5e1;padding-top:12px;font-size:14px;line-height:1.6;">
              <div><strong>Dates:</strong> ${data.checkInDate} &rarr; ${data.checkOutDate}</div>
              <div><strong>Room Category:</strong> ${safeRoomTypeName} ${data.roomNumber ? `(Room ${data.roomNumber})` : ''}</div>
              <div><strong>Guests:</strong> ${data.adults} Adult${data.adults > 1 ? 's' : ''} ${data.children > 0 ? `• ${data.children} Child${data.children > 1 ? 'ren' : ''}` : ''}</div>
              <div><strong>Total Amount:</strong> ${data.totalAmountRupees}</div>
              <div><strong>Advance Paid:</strong> ${data.paidAmountRupees}</div>
              <div><strong>Pending Balance:</strong> <strong style="color:#b45309;">${data.balanceAmountRupees}</strong></div>
            </div>
          </div>

          ${data.hasFlexiLink !== false ? `
          <!-- DIRECT GUEST ACCESS (NO LOGIN REQUIRED) -->
          <div style="text-align:center;padding:10px 0;">
            <p style="font-size:13px;color:#475569;margin-bottom:6px;">
              Tap the link below to access your <strong>FlexiLink Guest Portal</strong> with zero login or signup required:
            </p>
            <a href="${data.guestPortalUrl}" class="btn" target="_blank">
              Open Guest Portal (Direct Access &bull; No Login) &rarr;
            </a>
            <p style="font-size:11px;color:#64748b;margin:6px 0 0 0;">
              Express self check-in, Aadhaar/ID upload, food ordering & digital folio.
            </p>
          </div>

          <!-- GOOGLE PLAY STORE APP DOWNLOAD -->
          <div class="app-box">
            <div style="font-size:14px;font-weight:800;color:#166534;margin-bottom:4px;">
              📱 Download HotelFlexi Guest Android App
            </div>
            <p style="font-size:12px;color:#15803d;margin:0 0 12px 0;line-height:1.5;">
              Download the app from Google Play Store. When opened via your link, all login screens are skipped, giving you direct access to your room services and billing.
            </p>
            <a href="${playStoreUrl}" class="app-btn" target="_blank">
              Download on Google Play Store &rarr;
            </a>
          </div>

          <p style="font-size:11px;color:#64748b;margin:18px 0 0 0;text-align:center;line-height:1.5;">
            🔒 <em>Security &amp; Privacy: Your digital guest portal access is securely active during your stay and will be automatically removed 7 days after checkout (${data.checkOutDate}).</em>
          </p>
          ` : `
          <div style="text-align:center;padding:12px;background:#f8fafc;border-radius:10px;margin:12px 0;border:1px dashed #cbd5e1;">
            <p style="font-size:12px;color:#475569;margin:0;">
              Please present your booking reference <strong>#${data.reservationNumber}</strong> and a valid government ID upon arrival at the front desk for check-in.
            </p>
          </div>
          `}

          <div style="margin-top:24px;padding:16px;background:#eff6ff;border-radius:10px;font-size:12px;color:#1e40af;">
            <strong>Hotel Contact:</strong><br/>
            ${data.propertyAddress || 'India'}<br/>
            Phone: ${data.propertyPhone || 'Front Desk'}<br/>
            Email: ${data.propertyEmail || 'Support'}
          </div>
        </div>
        <div class="footer">
          Powered by HotelFlexi &bull; Your Hotel. One Intelligent System.
        </div>
      </div>
    </body>
    </html>
  `;

  const ownerHtml = `
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"><style>
      body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background: #f8fafc; color: #1e293b; padding: 20px; }
      .container { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; overflow: hidden; }
      .header { background: #0f172a; color: #ffffff; padding: 28px 24px; text-align: center; }
      .content { padding: 28px 24px; }
      .card { background: #f8fafc; border-radius: 12px; border: 1px solid #e2e8f0; padding: 20px; margin: 20px 0; }
      .btn { display: inline-block; background: #0f172a; color: #ffffff !important; font-weight: 600; text-decoration: none; padding: 12px 24px; border-radius: 8px; }
    </style></head>
    <body>
      <div class="container">
        <div class="header">
          <h1 style="margin:0;font-size:22px;">New Reservation Alert</h1>
          <p style="margin:4px 0 0 0;opacity:0.8;font-size:13px;">${data.propertyName}</p>
        </div>
        <div class="content">
          <p>A new guest reservation has been created:</p>
          <div class="card">
            <div style="margin-bottom:8px;"><strong>Booking Reference:</strong> <span style="color:#1e40af;font-family:monospace;">${data.reservationNumber}</span></div>
            <div><strong>Guest:</strong> ${data.guestName} (${data.guestPhone || 'No phone'} &bull; ${data.guestEmail || 'No email'})</div>
            <div><strong>Stay:</strong> ${data.checkInDate} to ${data.checkOutDate}</div>
            <div><strong>Allocated Room:</strong> ${data.roomNumber ? `Room ${data.roomNumber}` : 'Auto-allocated on arrival'} (${safeRoomTypeName})</div>
            <div><strong>Occupancy:</strong> ${data.adults} Adults ${data.children > 0 ? `, ${data.children} Children` : ''}</div>
            <div style="margin-top:10px;padding-top:10px;border-top:1px dashed #cbd5e1;">
              <div>Total Tariff: <strong>${data.totalAmountRupees}</strong></div>
              <div>Advance Collected: <strong>${data.paidAmountRupees}</strong></div>
              <div>Outstanding Balance: <strong style="color:#b45309;">${data.balanceAmountRupees}</strong></div>
            </div>
          </div>
          ${data.hasFlexiLink !== false ? `
          <p style="font-size:12px;color:#64748b;">
            Guest Direct FlexiLink: <a href="${data.guestPortalUrl}">${data.guestPortalUrl}</a><br/>
            <em>(Access automatically expires 7 days after checkout)</em>
          </p>` : ''}
        </div>
      </div>
    </body>
    </html>
  `;

  // If no API key configured, log details gracefully and return
  if (!apiKey) {
    console.log('[Resend Email Service] RESEND_API_KEY not configured. Simulating email delivery:');
    console.log(`- Guest email to ${data.guestEmail} with FlexiLink: ${data.guestPortalUrl}`);
    console.log(`- Owner email to ${data.ownerEmail} for Ref: ${data.reservationNumber}`);
    return { success: false, simulated: true, reason: 'RESEND_API_KEY_NOT_CONFIGURED' };
  }

  const results: any = {};

  // 1. Send Guest Email
  if (data.guestEmail && data.guestEmail.includes('@')) {
    try {
      const resp = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: fromEmail,
          to: [data.guestEmail],
          subject: `Booking Confirmed at ${data.propertyName} - Room ${data.roomNumber || ''} (Ref: ${data.reservationNumber})`,
          html: guestHtml,
        }),
      });
      results.guest = await resp.json();
    } catch (err: any) {
      console.error('[Resend Error] Guest email failed:', err);
      results.guestError = err.message;
    }
  }

  // 2. Send Owner / Property Admin Email
  if (data.ownerEmail && data.ownerEmail.includes('@')) {
    try {
      const resp = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: fromEmail,
          to: [data.ownerEmail],
          subject: `New Booking: ${data.reservationNumber} - ${data.guestName} (${data.propertyName})`,
          html: ownerHtml,
        }),
      });
      results.owner = await resp.json();
    } catch (err: any) {
      console.error('[Resend Error] Owner email failed:', err);
      results.ownerError = err.message;
    }
  }

  // 3. Send Platform Admin Notification (to info@novaxai.in)
  if (adminEmail && adminEmail !== data.ownerEmail && adminEmail !== data.guestEmail) {
    try {
      await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: fromEmail,
          to: [adminEmail],
          subject: `[Platform Notification] New Reservation: ${data.reservationNumber} at ${data.propertyName}`,
          html: ownerHtml,
        }),
      });
    } catch (err) {
      console.warn('[Resend Warning] Admin notification copy failed:', err);
    }
  }

  return { success: true, results };
}

export interface CancellationNotificationData {
  reservationNumber: string;
  guestName: string;
  guestEmail?: string;
  guestPhone?: string;
  propertyName: string;
  propertyAddress?: string;
  propertyPhone?: string;
  propertyEmail?: string;
  ownerEmail?: string;
  checkInDate: string;
  checkOutDate: string;
  roomTypeName: string;
  reason?: string;
  totalAmountRupees: string;
  paidAmountRupees: string;
}

export async function sendCancellationEmail(env: Env, data: CancellationNotificationData) {
  const apiKey = env.RESEND_API_KEY;
  const fromEmail = env.RESEND_FROM_EMAIL || 'HotelFlexi <info@novaxai.in>';
  const adminEmail = env.ADMIN_NOTIFICATION_EMAIL || 'info@novaxai.in';

  const safeRoomTypeName =
    data.roomTypeName &&
    String(data.roomTypeName).toLowerCase() !== 'undefined' &&
    String(data.roomTypeName).trim() !== ''
      ? String(data.roomTypeName).trim()
      : 'Deluxe Room';

  const guestHtml = `
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"><style>
      body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background: #f8fafc; color: #1e293b; padding: 20px; }
      .container { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; overflow: hidden; }
      .header { background: #dc2626; color: #ffffff; padding: 32px 24px; text-align: center; }
      .content { padding: 28px 24px; }
      .card { background: #fef2f2; border-radius: 12px; border: 1px solid #fecaca; padding: 20px; margin: 20px 0; }
      .btn { display: inline-block; background: #0f172a; color: #ffffff !important; font-weight: 700; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-size: 13px; }
      .footer { padding: 20px; text-align: center; font-size: 12px; color: #64748b; background: #f1f5f9; }
    </style></head>
    <body>
      <div class="container">
        <div class="header">
          <h1 style="margin:0;font-size:24px;">Booking Cancelled</h1>
          <p style="margin:8px 0 0 0;opacity:0.9;">${data.propertyName}</p>
        </div>
        <div class="content">
          <p>Dear <strong>${data.guestName}</strong>,</p>
          <p>This email is to confirm that your reservation at <strong>${data.propertyName}</strong> has been cancelled.</p>
          
          <div class="card">
            <div style="display:flex;justify-content:space-between;margin-bottom:12px;">
              <span style="font-size:12px;color:#991b1b;font-weight:700;">Booking Reference:</span>
              <strong style="color:#b91c1c;font-family:monospace;">${data.reservationNumber}</strong>
            </div>
            <div style="border-top:1px dashed #f87171;padding-top:12px;font-size:14px;line-height:1.6;color:#7f1d1d;">
              <div><strong>Dates:</strong> ${data.checkInDate} &rarr; ${data.checkOutDate}</div>
              <div><strong>Room Category:</strong> ${safeRoomTypeName}</div>
              <div><strong>Cancellation Reason:</strong> ${data.reason || 'Requested by guest / hotelier'}</div>
              <div><strong>Total Booking Tariff:</strong> ${data.totalAmountRupees}</div>
              <div><strong>Advance Paid:</strong> ${data.paidAmountRupees}</div>
            </div>
          </div>

          <p style="font-size:13px;color:#475569;line-height:1.6;">
            If you made an advance deposit, our front-desk accounts team will process applicable refunds in accordance with the property's cancellation terms.
          </p>

          ${data.propertyPhone || data.propertyEmail ? `
            <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;padding:16px;margin:20px 0;font-size:13px;">
              <strong>Property Front Desk:</strong><br/>
              ${data.propertyPhone ? `📞 Phone: <a href="tel:${data.propertyPhone}">${data.propertyPhone}</a><br/>` : ''}
              ${data.propertyEmail ? `✉️ Email: <a href="mailto:${data.propertyEmail}">${data.propertyEmail}</a><br/>` : ''}
              ${data.propertyAddress ? `📍 Address: ${data.propertyAddress}` : ''}
            </div>
          ` : ''}

          <p style="font-size:12px;color:#94a3b8;margin-top:20px;">
            Thank you for considering ${data.propertyName}. We hope to welcome you again on future journeys.
          </p>
        </div>
        <div class="footer">
          &copy; ${new Date().getFullYear()} ${data.propertyName} &bull; Powered by HotelFlexi
        </div>
      </div>
    </body>
    </html>
  `;

  if (!apiKey) {
    console.log('[Resend Email Service] Simulation: Cancellation email to', data.guestEmail, 'for', data.reservationNumber);
    return { success: false, simulated: true };
  }

  const results: any = {};
  if (data.guestEmail && data.guestEmail.includes('@')) {
    try {
      const resp = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: fromEmail,
          to: [data.guestEmail],
          subject: `Booking Cancelled: ${data.reservationNumber} - ${data.propertyName}`,
          html: guestHtml,
        }),
      });
      results.guest = await resp.json();
    } catch (e: any) {
      console.error('[Resend Error] Cancellation email failed:', e);
      results.error = e.message;
    }
  }

  return { success: true, results };
}

// Generic transactional email sender for platform alerts, password resets, subscriptions
export async function sendEmail(
  env: Env,
  params: { to: string | string[]; subject: string; html: string; from?: string }
) {
  const apiKey = env.RESEND_API_KEY;
  const fromEmail = params.from || env.RESEND_FROM_EMAIL || 'HotelFlexi <info@novaxai.in>';

  if (!apiKey) {
    console.log('[Resend Email Service] RESEND_API_KEY not configured. Simulating email:', params.to, params.subject);
    return { success: false, simulated: true };
  }

  try {
    const toRecipients = Array.isArray(params.to) ? params.to : [params.to];
    const resp = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: fromEmail,
        to: toRecipients,
        subject: params.subject,
        html: params.html,
      }),
    });
    const data = await resp.json();
    return { success: resp.ok, data };
  } catch (err: any) {
    console.error('[Resend Error] sendEmail failed:', err);
    return { success: false, error: err.message };
  }
}

// -----------------------------------------------------------------------------
// NOTIFY SUPERADMIN OF HOTELIER COMPLAINTS & TECHNICAL BUGS
// -----------------------------------------------------------------------------
export async function sendComplaintNotificationEmail(
  env: Env,
  data: {
    ticketNumber: string;
    hotelName: string;
    hotelCode: string;
    category: string;
    priority: string;
    subject: string;
    description: string;
    requesterName: string;
    requesterEmail: string;
    requesterPhone?: string;
  }
) {
  const adminEmail = env.ADMIN_NOTIFICATION_EMAIL || 'info@novaxai.in';
  const html = `
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"><style>
      body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background: #f8fafc; color: #1e293b; padding: 20px; }
      .container { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; overflow: hidden; }
      .header { background: #dc2626; color: #ffffff; padding: 24px; text-align: center; }
      .content { padding: 24px; }
      .card { background: #fef2f2; border: 1px solid #fecaca; border-radius: 12px; padding: 16px; margin: 16px 0; }
      .btn { display: inline-block; background: #0f172a; color: #ffffff !important; font-weight: 700; text-decoration: none; padding: 12px 24px; border-radius: 8px; margin-top: 16px; font-size: 13px; }
      .footer { padding: 16px; text-align: center; font-size: 11px; color: #64748b; background: #f1f5f9; }
    </style></head>
    <body>
      <div class="container">
        <div class="header">
          <h2 style="margin:0;font-size:20px;">🚨 New Hotel Complaint / Bug Raised</h2>
          <p style="margin:6px 0 0 0;opacity:0.9;font-size:13px;">${data.hotelName} (Code: #${data.hotelCode})</p>
        </div>
        <div class="content">
          <p style="font-size:14px;margin-bottom:12px;">A hotelier has raised an urgent support ticket on HotelFlexi Central Command:</p>
          <div class="card">
            <div style="display:flex;justify-content:space-between;margin-bottom:8px;">
              <span style="font-size:12px;color:#991b1b;font-weight:700;">Ticket Reference:</span>
              <span style="font-family:monospace;font-weight:800;color:#991b1b;">${data.ticketNumber}</span>
            </div>
            <div style="font-size:13px;line-height:1.6;color:#1e293b;">
              <div><strong>Property:</strong> ${data.hotelName} (Code: #${data.hotelCode})</div>
              <div><strong>Category:</strong> ${data.category} &bull; <strong>Priority:</strong> <span style="color:#b91c1c;font-weight:700;">${data.priority.toUpperCase()}</span></div>
              <div><strong>Requester:</strong> ${data.requesterName} (<a href="mailto:${data.requesterEmail}">${data.requesterEmail}</a>${data.requesterPhone ? ` &bull; <a href="tel:${data.requesterPhone}">${data.requesterPhone}</a>` : ''})</div>
              <div style="margin-top:10px;padding-top:10px;border-top:1px solid #fecaca;">
                <strong>Subject:</strong> ${data.subject}
              </div>
              <div style="margin-top:8px;background:#ffffff;padding:12px;border-radius:8px;border:1px solid #fed7d7;white-space:pre-wrap;font-family:inherit;">
${data.description}
              </div>
            </div>
          </div>
          <div style="text-align:center;">
            <a href="https://hotelflexi.com/central-command/complaints" class="btn" target="_blank">
              Open Central Command &rarr;
            </a>
          </div>
        </div>
        <div class="footer">
          HotelFlexi Core Alert &bull; Automated SuperAdmin Dispatch
        </div>
      </div>
    </body>
    </html>
  `;

  return sendEmail(env, {
    to: adminEmail,
    subject: `🚨 [Hotel Complaint] #${data.ticketNumber} from ${data.hotelName} (Code: #${data.hotelCode}): ${data.subject}`,
    html,
  });
}

// -----------------------------------------------------------------------------
// NOTIFY SUPERADMIN OF NEW DEMO REQUEST
// -----------------------------------------------------------------------------
export async function sendDemoRequestNotificationEmail(
  env: Env,
  data: {
    hotelName: string;
    contactName: string;
    phone: string;
    email?: string;
    city?: string;
    propertyType?: string;
    roomCount?: string;
    preferredDate?: string;
    preferredTime?: string;
  }
) {
  const adminEmail = env.ADMIN_NOTIFICATION_EMAIL || 'info@novaxai.in';
  const cleanPhone = (data.phone || '').replace(/\D/g, '');
  const waLink = cleanPhone ? `https://wa.me/${cleanPhone.length === 10 ? '91' + cleanPhone : cleanPhone}` : null;

  const html = `
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"><style>
      body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background: #f8fafc; color: #1e293b; padding: 20px; }
      .container { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; overflow: hidden; }
      .header { background: #2563eb; color: #ffffff; padding: 24px; text-align: center; }
      .content { padding: 24px; }
      .card { background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 12px; padding: 18px; margin: 16px 0; }
      .btn { display: inline-block; background: #16a34a; color: #ffffff !important; font-weight: 700; text-decoration: none; padding: 12px 24px; border-radius: 8px; margin: 8px 4px; font-size: 13px; }
      .footer { padding: 16px; text-align: center; font-size: 11px; color: #64748b; background: #f1f5f9; }
    </style></head>
    <body>
      <div class="container">
        <div class="header">
          <h2 style="margin:0;font-size:22px;">🎯 New 1-on-1 VIP Demo Scheduled</h2>
          <p style="margin:6px 0 0 0;opacity:0.9;font-size:13px;">${data.hotelName} (${data.city || 'India'})</p>
        </div>
        <div class="content">
          <p style="font-size:14px;margin-bottom:12px;">A hotelier has requested a personalized demonstration of HotelFlexi:</p>
          <div class="card">
            <div style="font-size:14px;line-height:1.7;color:#1e293b;">
              <div><strong>Hotel / Property:</strong> ${data.hotelName}</div>
              <div><strong>Contact Person:</strong> ${data.contactName}</div>
              <div><strong>Phone Number:</strong> <a href="tel:${data.phone}" style="font-weight:700;color:#2563eb;">${data.phone}</a></div>
              <div><strong>Email:</strong> <a href="mailto:${data.email || ''}">${data.email || 'N/A'}</a></div>
              <div><strong>Location:</strong> ${data.city || 'India'}</div>
              <div><strong>Property Type:</strong> ${data.propertyType || 'Hotel'}</div>
              <div><strong>Inventory:</strong> ${data.roomCount || 'N/A'} Rooms</div>
              <div style="margin-top:8px;padding-top:8px;border-top:1px dashed #93c5fd;">
                <strong>Preferred Slot:</strong> ${data.preferredDate || 'Earliest Available'} at ${data.preferredTime || '11:00 AM'}
              </div>
            </div>
          </div>
          <div style="text-align:center;margin-top:16px;">
            ${waLink ? `<a href="${waLink}" class="btn" target="_blank">Chat on WhatsApp &rarr;</a>` : ''}
            <a href="tel:${data.phone}" class="btn" style="background:#2563eb;" target="_blank">Call Hotelier &rarr;</a>
          </div>
        </div>
        <div class="footer">
          HotelFlexi Lead Dispatch &bull; novaxai.in
        </div>
      </div>
    </body>
    </html>
  `;

  return sendEmail(env, {
    to: adminEmail,
    subject: `🎯 [New Demo Request] ${data.hotelName} (${data.city || 'India'}) - ${data.contactName} (${data.phone})`,
    html,
  });
}

// -----------------------------------------------------------------------------
// IMMEDIATE PAYMENT CONFIRMATION EMAIL (RAZORPAY)
// -----------------------------------------------------------------------------
export interface PaymentSuccessEmailData {
  ownerEmail?: string;
  propertyName: string;
  reservationNumber: string;
  guestName: string;
  amountRupees: string;
  paymentMethod: string;
  paymentId: string;
  checkInDate: string;
  checkOutDate: string;
  remainingBalanceRupees: string;
}

export async function sendPaymentSuccessEmail(env: Env, data: PaymentSuccessEmailData) {
  const adminEmail = env.ADMIN_NOTIFICATION_EMAIL || 'info@novaxai.in';

  const html = `
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"><style>
      body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f8fafc; color: #1e293b; padding: 20px; }
      .container { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; overflow: hidden; }
      .header { background: #059669; color: #ffffff; padding: 24px; text-align: center; }
      .content { padding: 24px; }
      .card { background: #f0fdf4; border-radius: 12px; border: 1px solid #bbf7d0; padding: 20px; margin: 16px 0; }
    </style></head>
    <body>
      <div class="container">
        <div class="header">
          <h1 style="margin:0;font-size:22px;">✅ Payment Received: ${data.amountRupees}</h1>
          <p style="margin:4px 0 0 0;opacity:0.9;font-size:13px;">${data.propertyName}</p>
        </div>
        <div class="content">
          <p>Online payment has been successfully captured and reconciled for booking <strong>#${data.reservationNumber}</strong>.</p>
          <div class="card">
            <div style="margin-bottom:6px;"><strong>Guest Name:</strong> ${data.guestName}</div>
            <div style="margin-bottom:6px;"><strong>Amount Collected:</strong> <span style="font-size:18px;font-weight:bold;color:#059669;">${data.amountRupees}</span></div>
            <div style="margin-bottom:6px;"><strong>Transaction / Reference ID:</strong> <code style="font-size:12px;">${data.paymentId}</code></div>
            <div style="margin-bottom:6px;"><strong>Payment Method:</strong> ${data.paymentMethod.toUpperCase()}</div>
            <div style="margin-bottom:6px;"><strong>Stay Dates:</strong> ${data.checkInDate} &rarr; ${data.checkOutDate}</div>
            <div><strong>Remaining Balance:</strong> ${data.remainingBalanceRupees}</div>
          </div>
          <p style="font-size:12px;color:#64748b;">The reservation ledger, guest folio, and GST invoice have been automatically updated in your HotelFlexi admin panel.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  const recipients = [data.ownerEmail, adminEmail].filter((e): e is string => Boolean(e && e.includes('@')));
  for (const to of Array.from(new Set(recipients))) {
    try {
      await sendEmail(env, {
        to,
        subject: `💰 Payment Received: ${data.amountRupees} - Booking #${data.reservationNumber} (${data.guestName})`,
        html,
      });
    } catch (e) {
      console.error('[Payment Email Error]:', e);
    }
  }
}
