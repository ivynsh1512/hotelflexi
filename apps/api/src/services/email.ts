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
}

export async function sendBookingEmails(env: Env, data: BookingNotificationData) {
  const apiKey = env.RESEND_API_KEY;
  const fromEmail = env.RESEND_FROM_EMAIL || 'HotelFlexi Bookings <bookings@hotelflexi.app>';

  const guestHtml = `
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"><style>
      body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background: #f8fafc; color: #1e293b; padding: 20px; }
      .container { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; overflow: hidden; }
      .header { background: #1e40af; color: #ffffff; padding: 32px 24px; text-align: center; }
      .content { padding: 28px 24px; }
      .card { background: #f8fafc; border-radius: 12px; border: 1px solid #e2e8f0; padding: 20px; margin: 20px 0; }
      .btn { display: inline-block; background: #1e40af; color: #ffffff !important; font-weight: 600; text-decoration: none; padding: 14px 28px; border-radius: 10px; margin: 20px 0; }
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
          <p>Namaste! Your stay at <strong>${data.propertyName}</strong> is confirmed. We look forward to hosting you.</p>
          
          <div class="card">
            <div style="display:flex;justify-content:space-between;margin-bottom:12px;">
              <span style="font-size:12px;color:#64748b;">Booking Reference:</span>
              <strong style="color:#1e40af;font-family:monospace;">${data.reservationNumber}</strong>
            </div>
            <div style="border-top:1px dashed #cbd5e1;padding-top:12px;font-size:14px;line-height:1.6;">
              <div><strong>Dates:</strong> ${data.checkInDate} &rarr; ${data.checkOutDate}</div>
              <div><strong>Room Category:</strong> ${data.roomTypeName} ${data.roomNumber ? `(Room ${data.roomNumber})` : ''}</div>
              <div><strong>Guests:</strong> ${data.adults} Adult${data.adults > 1 ? 's' : ''} ${data.children > 0 ? `• ${data.children} Child${data.children > 1 ? 'ren' : ''}` : ''}</div>
              <div><strong>Total Amount:</strong> ${data.totalAmountRupees}</div>
              <div><strong>Advance Paid:</strong> ${data.paidAmountRupees}</div>
              <div><strong>Pending Balance:</strong> <strong style="color:#b45309;">${data.balanceAmountRupees}</strong></div>
            </div>
          </div>

          <div style="text-align:center;padding:10px 0;">
            <p style="font-size:13px;color:#475569;margin-bottom:8px;">Access your personal <strong>FlexiLink Guest Portal</strong> for express self check-in and digital billing:</p>
            <a href="${data.guestPortalUrl}" class="btn" target="_blank">Open Guest Portal & Self Check-In &rarr;</a>
            <p style="font-size:11px;color:#94a3b8;margin:0;">(Link expires 7 days after your scheduled checkout date)</p>
          </div>

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
            <div><strong>Room Category:</strong> ${data.roomTypeName} ${data.roomNumber ? `(Room ${data.roomNumber})` : '(Unassigned)'}</div>
            <div><strong>Occupancy:</strong> ${data.adults} Adults ${data.children > 0 ? `, ${data.children} Children` : ''}</div>
            <div style="margin-top:10px;padding-top:10px;border-top:1px dashed #cbd5e1;">
              <div>Total Tariff: <strong>${data.totalAmountRupees}</strong></div>
              <div>Advance Collected: <strong>${data.paidAmountRupees}</strong></div>
              <div>Outstanding Balance: <strong style="color:#b45309;">${data.balanceAmountRupees}</strong></div>
            </div>
          </div>
          <p style="font-size:12px;color:#64748b;">
            Guest FlexiLink: <a href="${data.guestPortalUrl}">${data.guestPortalUrl}</a>
          </p>
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
          subject: `Reservation Confirmed at ${data.propertyName} (Ref: ${data.reservationNumber})`,
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

  return { success: true, results };
}
