/**
 * HotelFlexi Connectivity API — Cryptographic Utilities
 * Cloudflare Workers Web Crypto API compliant
 */

export async function hashSecret(secret: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(secret);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

export async function verifySecret(providedSecret: string, storedHash: string): Promise<boolean> {
  const computedHash = await hashSecret(providedSecret);
  return constantTimeCompare(computedHash, storedHash);
}

export function constantTimeCompare(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}

export async function generateHmacSignature(
  secret: string,
  timestamp: number,
  payload: string
): Promise<string> {
  const encoder = new TextEncoder();
  const message = `${timestamp}.${payload}`;
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const signatureBuffer = await crypto.subtle.sign('HMAC', key, encoder.encode(message));
  const signatureArray = Array.from(new Uint8Array(signatureBuffer));
  return signatureArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

export async function verifyHmacSignature(
  secret: string,
  headerValue: string,
  payload: string,
  toleranceSeconds: number = 300
): Promise<{ valid: boolean; reason?: string }> {
  // Expected format: t=1729600000,v1=abcdef123456...
  const parts = headerValue.split(',');
  const tPart = parts.find((p) => p.startsWith('t='));
  const v1Part = parts.find((p) => p.startsWith('v1='));

  if (!tPart || !v1Part) {
    return { valid: false, reason: 'Malformed signature header' };
  }

  const timestamp = parseInt(tPart.slice(2), 10);
  const signature = v1Part.slice(3);

  if (isNaN(timestamp)) {
    return { valid: false, reason: 'Invalid signature timestamp' };
  }

  const now = Math.floor(Date.now() / 1000);
  if (Math.abs(now - timestamp) > toleranceSeconds) {
    return { valid: false, reason: 'Signature timestamp outside allowable replay window' };
  }

  const expectedSignature = await generateHmacSignature(secret, timestamp, payload);
  const isValid = constantTimeCompare(signature, expectedSignature);

  return {
    valid: isValid,
    reason: isValid ? undefined : 'HMAC signature mismatch',
  };
}
