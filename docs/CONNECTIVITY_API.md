# HotelFlexi — Secure External Connectivity Provider API Specification (v1.0)

This document provides the technical integration specification for third-party channel managers, OTA aggregators (such as **Channellyx**, SiteMinder, DerbySoft), and Central Reservation Systems (CRS) connecting to **HotelFlexi** (NovaX AI).

---

## 1. Overview & Architecture

- **Protocol**: REST over HTTPS
- **Data Format**: JSON (`application/json; charset=utf-8`)
- **Base URL (Production)**: `https://hotelflexi.divyansh-shukla.workers.dev/api/v1/connectivity`
- **Interactive Documentation**: `https://hotelflexi.divyansh-shukla.workers.dev/api/v1/connectivity/docs`
- **OpenAPI 3.1 Spec**: `https://hotelflexi.divyansh-shukla.workers.dev/api/v1/connectivity/openapi.json`
- **Rate Limits**: 120 requests/minute per partner (configurable). Exceeding requests receive `429 Too Many Requests` with `X-RateLimit-*` headers.

---

## 2. Authentication & Access Control

All protected endpoints require partner authentication via HTTP headers:

| Header | Description | Example |
| :--- | :--- | :--- |
| `X-API-Key` | Partner Unique Public Key | `hf_live_chx_9a8b7c6d5e4f` |
| `X-API-Secret` | Partner Integration Secret | `sk_live_1234567890abcdef...` |

Alternatively, standard HTTP Authorization header is supported:
```http
Authorization: Bearer <X-API-Key>:<X-API-Secret>
```

### Security Architecture:
- API secrets are stored as salted SHA-256 hashes in Cloudflare D1.
- Partners are strictly scoped to authorized properties via `connectivity_partner_properties`. Accessing any unmapped property returns `403 Forbidden` (`PROPERTY_ACCESS_DENIED`).
- HTTPS is strictly enforced in production.

---

## 3. Endpoints Inventory

### A. Partner Identity & Metadata
- `GET /me`: Returns partner profile, active environment mode (`production` vs `sandbox`), rate limit, and list of authorized hotel properties.

### B. Property & Inventory Mapping
- `GET /properties`: List authorized properties.
- `GET /properties/:propertyId`: Get property profile (currency, address, check-in/out times).
- `GET /properties/:propertyId/room-types`: List room categories, base & max occupancies, and total physical room units.
- `GET /properties/:propertyId/rate-plans`: List active rate plans, meal plans (EP, CP, MAP, AP), and cancellation policies.
- `GET /properties/:propertyId/inventory-summary?start_date=YYYY-MM-DD&end_date=YYYY-MM-DD`: Live physical capacity, booked rooms, override inventory, and restrictions.

### C. Rate Push (Pricing & Restrictions)
- `POST /properties/:propertyId/rates`: Bulk or single rate and restriction updates.

#### Request Schema:
```json
{
  "rates": [
    {
      "room_type_id": "rt_deluxe_ocean_01",
      "rate_plan_id": "rp_ep_standard",
      "start_date": "2026-11-01",
      "end_date": "2026-11-05",
      "currency": "INR",
      "price_paise": 450000,
      "min_stay_arrival": 2,
      "min_stay_through": 1,
      "max_stay": 14,
      "closed_to_arrival": false,
      "closed_to_departure": false,
      "stop_sell": false
    }
  ]
}
```

### D. Availability Push
- `POST /properties/:propertyId/availability`: Updates inventory override and stop-sell flags.

#### Request Schema:
```json
{
  "availability": [
    {
      "room_type_id": "rt_deluxe_ocean_01",
      "start_date": "2026-11-01",
      "end_date": "2026-11-05",
      "available_rooms": 4,
      "stop_sell": false
    }
  ]
}
```
*Note: Negative values are strictly rejected. The system ensures availability does not exceed physical capacity.*

### E. Inbound Reservations (Receive Bookings)
- `POST /properties/:propertyId/reservations`: Ingests bookings from OTAs idempotently.

#### Request Schema:
```json
{
  "external_reservation_id": "CHX-2026-99014",
  "channel_code": "channellyx",
  "room_type_id": "rt_deluxe_ocean_01",
  "rate_plan_id": "rp_ep_standard",
  "check_in_date": "2026-11-10",
  "check_out_date": "2026-11-12",
  "adults": 2,
  "children": 0,
  "currency": "INR",
  "total_amount_minor": 900000,
  "payment_mode": "ota_vcc",
  "guest": {
    "full_name": "Aarav Sharma",
    "email": "aarav.sharma@example.com",
    "phone": "+919876543210"
  },
  "special_requests": "Late arrival expected after 9 PM"
}
```

#### Idempotency Behavior:
Repeated deliveries of the same `external_reservation_id` return `200 OK` with `idempotent: true` and the existing reservation details. No duplicate bookings are created.

### F. Reservation Modifications & Cancellations
- **Modify**: `PUT /properties/:propertyId/reservations/:externalReservationId`
  - Supports updates to stay dates, guest counts, room type, or amounts.
  - Automatically re-checks availability for new dates.
- **Cancel**: `POST /properties/:propertyId/reservations/:externalReservationId/cancel`
  - Idempotently cancels the booking, unassigns the physical room, and restores inventory.
  - Does NOT automatically refund guest payments; adheres to property refund workflows.

### G. Controlled No-Show Handling
- `POST /properties/:propertyId/reservations/:externalReservationId/no-show`
  - Validates that reservation status is `confirmed`.
  - Rejects premature attempts prior to scheduled `check_in_date`.
  - Releases room inventory and records `no_show_at` timestamp and actor audit trail.

---

## 4. Two-Way Outbox & Webhook Notifications

HotelFlexi supports both outbound push (webhooks) and pull (polling outbox) for full two-way synchronization.

### Outbound Webhooks:
When reservations or inventory change inside HotelFlexi, an event is dispatched to the partner's configured `webhook_url`.

#### Signature Verification:
Each outbound webhook payload is signed with HMAC-SHA256:
```http
X-HotelFlexi-Event: reservation.created
X-HotelFlexi-Delivery: cout_8a7b6c5d4e3f
X-HotelFlexi-Signature: t=1729600000,v1=5d41402abc4b2a76b9719d911017c592...
```
Verification procedure:
1. Extract `t` (timestamp) and `v1` (signature) from `X-HotelFlexi-Signature`.
2. Ensure `|current_time - t| <= 300` seconds (prevents replay attacks).
3. Compute `expected_signature = HMAC_SHA256(webhook_secret, "${t}.${raw_body}")`.
4. Perform constant-time string comparison.

### Pull Outbox:
- `GET /outbox?limit=20`: Fetch unacknowledged events.
- `POST /outbox/:eventId/ack`: Acknowledge event receipt.

---

## 5. Isolated Sandbox Environment

Partners can perform end-to-end integration testing in a fully isolated sandbox:
- **Seed Sandbox**: `POST /sandbox/seed`
  - Creates synthetic resort (`HotelFlexi Sandbox Luxury Resort`), 3 room types, 6 physical rooms, 3 rate plans, and a sample reservation.
- **Reset Sandbox**: `POST /sandbox/reset`
  - Purges synthetic data back to a clean state.
- Sandbox credentials (`mode: 'sandbox'`) cannot modify or view live hotel guest data.

---

## 6. Compliance & Security Boundaries

- **PCI DSS**: HotelFlexi does not store raw credit card numbers or CVVs. All OTA virtual credit cards (VCCs) are tokenized or collected via compliant gateway partners.
- **Data Minimization**: Only essential guest details (name, contact, stay dates) are collected. Sensitive IDs expire 7 days after checkout.
- **HTNG / OTA 2014B**: REST/JSON API aligns with HTNG Express and OpenTravel Alliance semantics for availability, rates, and reservations.
