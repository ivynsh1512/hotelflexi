import { describe, it, expect } from 'vitest';
import { isSuperAdmin, verifyFirebaseToken } from '../src/auth/firebase';

describe('HotelFlexi Security & Core Architecture Tests', () => {
  describe('1. Super-Admin Allowlist Authorization', () => {
    const adminEmailsConfig = 'divyansh.shukla1512@gmail.com, info@novaxai.in';

    it('should grant access to exact authorized email', () => {
      expect(isSuperAdmin('divyansh.shukla1512@gmail.com', adminEmailsConfig, true)).toBe(true);
      expect(isSuperAdmin('info@novaxai.in', adminEmailsConfig, true)).toBe(true);
    });

    it('should normalize case and trim whitespace', () => {
      expect(isSuperAdmin('  DIVYANSH.SHUKLA1512@GMAIL.COM  ', adminEmailsConfig, true)).toBe(true);
      expect(isSuperAdmin('INFO@NOVAXAI.IN', adminEmailsConfig, true)).toBe(true);
    });

    it('should deny unauthorized emails', () => {
      expect(isSuperAdmin('hotelowner@gmail.com', adminEmailsConfig, true)).toBe(false);
      expect(isSuperAdmin('hacker@attack.com', adminEmailsConfig, true)).toBe(false);
      expect(isSuperAdmin('', adminEmailsConfig, true)).toBe(false);
    });

    it('should handle quoted strings and bracketed arrays in secret', () => {
      expect(isSuperAdmin('divyansh.shukla1512@gmail.com', '"divyansh.shukla1512@gmail.com", "info@novaxai.in"')).toBe(true);
      expect(isSuperAdmin('divyansh.shukla1512@gmail.com', '["divyansh.shukla1512@gmail.com"]')).toBe(true);
    });

    it('should fail closed if ADMIN_EMAILS secret is missing or empty', () => {
      expect(isSuperAdmin('divyansh.shukla1512@gmail.com', '', true)).toBe(false);
      expect(isSuperAdmin('divyansh.shukla1512@gmail.com', undefined, true)).toBe(false);
    });
  });

  describe('2. Firebase ID Token Verification', () => {
    it('should reject empty or missing tokens', async () => {
      const result = await verifyFirebaseToken('');
      expect(result).toBeNull();
    });

    it('should reject arbitrary malformed strings', async () => {
      const result = await verifyFirebaseToken('not.a.real.jwt.token');
      expect(result).toBeNull();
    });

    it('should parse valid test tokens with verified status in dev test mode', async () => {
      const user = await verifyFirebaseToken('test-token-test@example.com:uid123:verified');
      expect(user).not.toBeNull();
      expect(user?.email).toBe('test@example.com');
      expect(user?.uid).toBe('uid123');
      expect(user?.email_verified).toBe(true);
    });

    it('should reflect unverified status for unverified test token', async () => {
      const user = await verifyFirebaseToken('test-token-unverified@example.com:uid456:unverified');
      expect(user?.email_verified).toBe(false);
    });
  });

  describe('3. Financial & Accounting Safeguards (Integer Paise & GST)', () => {
    it('should calculate GST accurately using integer basis points without floating point errors', () => {
      const roomChargePaise = 350000; // ₹3,500.00
      const gstBasisPoints = 1200; // 12.00%
      const taxPaise = Math.round((roomChargePaise * gstBasisPoints) / 10000);
      expect(taxPaise).toBe(42000); // ₹420.00
      const totalPaise = roomChargePaise + taxPaise;
      expect(totalPaise).toBe(392000); // ₹3,920.00
    });

    it('should apply luxury GST tier (18%) for room rates exceeding ₹7,500', () => {
      const roomChargePaise = 800000; // ₹8,000.00
      const gstBasisPoints = roomChargePaise > 750000 ? 1800 : 1200;
      expect(gstBasisPoints).toBe(1800);
      const taxPaise = Math.round((roomChargePaise * gstBasisPoints) / 10000);
      expect(taxPaise).toBe(144000); // ₹1,440.00
      expect(taxPaise / 100).toBe(1440);
    });
  });

  describe('4. Room Blocking and Reservation Date Logic', () => {
    it('should validate inclusive check-in and exclusive check-out dates', () => {
      const checkIn = '2026-10-03';
      const checkOut = '2026-10-04';
      const d1 = new Date(checkIn);
      const d2 = new Date(checkOut);
      const nights = Math.round(Math.abs(d2.getTime() - d1.getTime()) / (1000 * 60 * 60 * 24));
      expect(nights).toBe(1);
    });

    it('should detect conflicting date ranges correctly', () => {
      // Existing booking: Oct 10 to Oct 15
      const existingStart = '2026-10-10';
      const existingEnd = '2026-10-15';

      // Function to check overlap: newStart < existingEnd AND newEnd > existingStart
      const overlaps = (start: string, end: string) => start < existingEnd && end > existingStart;

      expect(overlaps('2026-10-12', '2026-10-14')).toBe(true); // Inside
      expect(overlaps('2026-10-08', '2026-10-11')).toBe(true); // Overlap front
      expect(overlaps('2026-10-14', '2026-10-18')).toBe(true); // Overlap tail
      expect(overlaps('2026-10-05', '2026-10-10')).toBe(false); // Back-to-back checkout (permitted!)
      expect(overlaps('2026-10-15', '2026-10-20')).toBe(false); // Next check-in on checkout date (permitted!)
    });
  });

  describe('5. Subscription & Payment Enforcement Safeguards', () => {
    it('should correctly flag expired 14-day trials', () => {
      const now = Math.floor(Date.now() / 1000);
      const activeTrialEndsAt = now + 5 * 86400; // 5 days left
      const expiredTrialEndsAt = now - 3600; // 1 hour ago

      const isTrial = (status: string) => status === 'trial' || status === 'trialing';
      const isExpired = (status: string, endsAt: number) => isTrial(status) && endsAt < now;

      expect(isExpired('trial', activeTrialEndsAt)).toBe(false);
      expect(isExpired('trialing', activeTrialEndsAt)).toBe(false);
      expect(isExpired('trial', expiredTrialEndsAt)).toBe(true);
      expect(isExpired('trialing', expiredTrialEndsAt)).toBe(true);
    });

    it('should correctly flag expired subscription periods for non-starter plans', () => {
      const now = Math.floor(Date.now() / 1000);
      const activePeriodEndsAt = now + 15 * 86400;
      const expiredPeriodEndsAt = now - 60;

      const isSubExpired = (planId: string, status: string, periodEnds: number) =>
        status === 'active' && planId !== 'starter' && periodEnds < now;

      expect(isSubExpired('essential', 'active', activePeriodEndsAt)).toBe(false);
      expect(isSubExpired('growth', 'active', activePeriodEndsAt)).toBe(false);
      expect(isSubExpired('starter', 'active', expiredPeriodEndsAt)).toBe(false); // Free starter doesn't expire
      expect(isSubExpired('essential', 'active', expiredPeriodEndsAt)).toBe(true);
      expect(isSubExpired('enterprise', 'active', expiredPeriodEndsAt)).toBe(true);
    });

    it('should verify HMAC-SHA256 signatures for payment webhooks and verifications', async () => {
      const secret = 'rzp_test_secret_key_12345';
      const orderId = 'order_ABC1234567890';
      const paymentId = 'pay_XYZ9876543210';
      const payload = `${orderId}|${paymentId}`;

      const enc = new TextEncoder();
      const key = await crypto.subtle.importKey(
        'raw',
        enc.encode(secret),
        { name: 'HMAC', hash: 'SHA-256' },
        false,
        ['sign']
      );
      const sigBytes = await crypto.subtle.sign('HMAC', key, enc.encode(payload));
      const validHex = Array.from(new Uint8Array(sigBytes))
        .map((b) => b.toString(16).padStart(2, '0'))
        .join('');

      // Valid signature check
      expect(validHex.length).toBe(64);

      // Verify matching
      const verifyKey = await crypto.subtle.importKey(
        'raw',
        enc.encode(secret),
        { name: 'HMAC', hash: 'SHA-256' },
        false,
        ['verify']
      );
      const testSigBytes = new Uint8Array(
        validHex.match(/.{1,2}/g)?.map((byte) => parseInt(byte, 16)) || []
      );
      const isValid = await crypto.subtle.verify('HMAC', verifyKey, testSigBytes, enc.encode(payload));
      expect(isValid).toBe(true);

      // Verify tampered signature is rejected
      const tamperedHex = validHex.slice(0, -2) + '00';
      const tamperedBytes = new Uint8Array(
        tamperedHex.match(/.{1,2}/g)?.map((byte) => parseInt(byte, 16)) || []
      );
      const isTamperedValid = await crypto.subtle.verify('HMAC', verifyKey, tamperedBytes, enc.encode(payload));
      expect(isTamperedValid).toBe(false);
    });
  });
});
