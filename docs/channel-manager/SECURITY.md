# HotelFlexi Channel Manager — Security & Compliance Architecture

---

## 1. Tenant Isolation & Access Control
- Every route and database interaction verifies the authenticated user's `tenant_id` and role membership.
- Only users with roles `owner` or `manager` may configure connections, update credentials, alter mappings, or trigger manual sync retries.
- Cross-tenant queries are blocked at both middleware and query layers.

---

## 2. Credential Security & Redaction
- **No Plaintext Storage**: Credentials (API tokens, secrets, client keys) are encrypted using AES-256-GCM before database insertion.
- **No Credential Echoing**: When querying connections via `/api/channel-manager/connections`, secrets are stripped and replaced with `has_credentials: true`.
- **Log Redaction**: All structured logger streams, sync job payload dumps, and audit logs automatically sanitize tokens, keys, passwords, and CVVs.

---

## 3. Webhook Authentication & Replay Protection
- Inbound OTA reservation webhooks must present valid provider signatures, authorization headers, or pre-shared webhook tokens.
- Every incoming event is hashed (`SHA-256(external_id + version + timestamp)`) and checked against `channel_reservations` to prevent replay attacks and duplicate booking folios.

---

## 4. Financial & PCI DSS Boundaries
- Card Verification Values (CVVs) are strictly never stored in the database.
- Online payments on HotelFlexi are processed via PCI-DSS Level 1 compliant gateway (Razorpay).
- Local folio calculations use minor currency units (integer paise) to ensure absolute financial precision.
