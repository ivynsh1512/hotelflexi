/**
 * HotelFlexi Channel Manager — Tenant-Scoped Credential Encryption & Redaction
 * Uses standard Web Crypto API (AES-256-GCM) natively supported by Cloudflare Workers.
 */

const MASTER_SALT = 'hotelflexi-channel-salt-v1';

async function deriveKey(tenantId: string): Promise<CryptoKey> {
  const enc = new TextEncoder();
  const baseKey = await crypto.subtle.importKey(
    'raw',
    enc.encode(`tenant-secret-${tenantId}-${MASTER_SALT}`),
    { name: 'PBKDF2' },
    false,
    ['deriveKey']
  );

  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: enc.encode(tenantId),
      iterations: 100000,
      hash: 'SHA-256',
    },
    baseKey,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

export async function encryptCredentials(tenantId: string, plainText: string): Promise<string> {
  const key = await deriveKey(tenantId);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encoded = new TextEncoder().encode(plainText);

  const cipherBuffer = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    encoded
  );

  const combined = new Uint8Array(iv.length + cipherBuffer.byteLength);
  combined.set(iv, 0);
  combined.set(new Uint8Array(cipherBuffer), iv.length);

  // Return base64 representation
  let binary = '';
  for (let i = 0; i < combined.byteLength; i++) {
    binary += String.fromCharCode(combined[i]);
  }
  return btoa(binary);
}

export async function decryptCredentials(tenantId: string, encryptedBase64: string): Promise<string> {
  if (!encryptedBase64) return '';

  const binary = atob(encryptedBase64);
  const combined = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    combined[i] = binary.charCodeAt(i);
  }

  const iv = combined.slice(0, 12);
  const data = combined.slice(12);
  const key = await deriveKey(tenantId);

  const decrypted = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv },
    key,
    data
  );

  return new TextDecoder().decode(decrypted);
}

/**
 * Redacts sensitive credentials, tokens, and PII from logs and API payloads.
 */
export function redactSecrets(obj: any): any {
  if (!obj || typeof obj !== 'object') return obj;

  const sensitiveKeys = [
    'apikey', 'api_key', 'apisecret', 'api_secret', 'password', 'token',
    'authorization', 'credentials_encrypted', 'credentials_json',
    'cvv', 'card_number', 'pan', 'secret'
  ];

  if (Array.isArray(obj)) {
    return obj.map(redactSecrets);
  }

  const result: Record<string, any> = {};
  for (const [k, v] of Object.entries(obj)) {
    const isSensitive = sensitiveKeys.some(sk => k.toLowerCase().includes(sk));
    if (isSensitive) {
      if (typeof v === 'object' && v !== null && !Array.isArray(v)) {
        result[k] = redactSecrets(v);
      } else {
        result[k] = '[REDACTED]';
      }
    } else if (typeof v === 'object' && v !== null) {
      result[k] = redactSecrets(v);
    } else {
      result[k] = v;
    }
  }
  return result;
}
