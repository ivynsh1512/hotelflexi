# HotelFlexi Channel Manager — Architecture Specification
**Author:** Principal Software Architect, NovaX AI  
**System:** HotelFlexi Multi-Tenant Cloud Channel Manager

---

## 1. High-Level Architecture Topology

```
                  ┌────────────────────────────────────────┐
                  │          External OTA Channels         │
                  │ (Booking.com, Agoda, Expedia, MMT, TA) │
                  └────▲──────────────────────────────┬────┘
                       │                              │
          Push ARI     │                              │ Webhooks / Pull
      (Availability,   │                              │ (New, Mod, Cancel)
       Rates, Restr)   │                              │
                       │                              ▼
         ┌─────────────┴──────────┐       ┌────────────────────────┐
         │  OTA Provider Adapters │       │ Webhook Authentication │
         │   (Official Schema &   │       │   & Signature Check    │
         │   Signature Handling)  │       └───────────┬────────────┘
         └─────────────▲──────────┘                   │
                       │                              ▼
         ┌─────────────┴──────────┐       ┌────────────────────────┐
         │ Durable Sync Outbox    │       │ Ingestion & Idempotent │
         │ & Retry Engine         │       │ Deduplication Engine   │
         └─────────────▲──────────┘       └───────────┬────────────┘
                       │                              │
                       │                              │ Atomic Alloc
                       ▼                              ▼
    ┌──────────────────────────────────────────────────────────────┐
    │          HotelFlexi Canonical Core Inventory & PMS           │
    │               (Single Authority of Truth)                    │
    │                                                              │
    │  - Physical Rooms & Allocation Ledger                        │
    │  - Dated Rate Plans & Price Overrides                        │
    │  - Stop-Sell, CTA, CTD & Min/Max Stay Restrictions           │
    │  - Master Folio & Guest Reservation Records                  │
    └──────────────────────────────────────────────────────────────┘
```

---

## 2. Core Architectural Principles

### 2.1 Single Authority of Truth
The HotelFlexi central PMS database is the authoritative source for all physical inventory, rate plans, and commercial restrictions.
External OTAs never dictate physical room counts; they receive synchronized allocations pushed from the PMS.
When a reservation arrives from any channel (OTA, direct booking engine, walk-in, or wedding block), it immediately mutates the central room allocation.

### 2.2 Strict Authenticity & No Fabricated Integrations
In accordance with production integration standards:
- No mock or simulated adapter is ever designated as a verified live OTA connection.
- Channels lacking verified production credentials or partner certification status remain explicitly tagged as `pending_credentials`, `pending_approval`, or `sandbox`.
- Real network interactions strictly conform to published OTA API schemas (Booking.com B.XML/ARI, Expedia Partner API, Agoda YCS API, MakeMyTrip Channel Manager API, TripAdvisor Direct Connect).

### 2.3 Durable Outbox Pattern
PMS inventory and pricing changes are decoupled from synchronous external network requests:
1. When a room is reserved, modified, blocked, or a rate is updated, a local database mutation occurs.
2. In the same atomic batch, a `channel_sync_jobs` record is created with a unique idempotency key.
3. The background synchronization worker executes the job, handles transient network issues with exponential backoff and jitter, and logs permanent rejections into an audited discrepancy queue.

### 2.4 Overbooking Prevention & Concurrency
To eliminate double-booking hazards on Cloudflare D1 (SQLite distributed edge):
- Inventory checks and physical room state updates employ atomic conditional writes:
  ```sql
  UPDATE rooms SET status = 'occupied', updated_at = ?
  WHERE id = ? AND status = 'available';
  ```
- If the conditional write modifies zero rows, the room is no longer free, immediately triggering automated re-allocation to an equivalent available unit of the same category, or notifying staff through the Urgency Siren and discrepancy log.

---

## 3. Provider Adapter Abstraction Contract

All provider integrations adhere to the standardized `IChannelAdapter` contract:
- `validateConfiguration(context)`: Verifies hotel credentials, property IDs, and endpoint routing.
- `testConnection(context)`: Non-destructive handshake checking API credentials and partner status.
- `pushAvailability(context, updates)`: Pushes room availability counts.
- `pushRates(context, updates)`: Pushes currency-tagged nightly pricing per rate plan.
- `pushRestrictions(context, updates)`: Pushes Stop-Sell, CTA, CTD, and Min/Max stay limits.
- `fetchReservations(context, cursor)`: Ingests new and modified bookings via polling API.
- `parseReservationWebhook(context, payload)`: Validates signatures and maps raw inbound payloads to canonical `NormalizedReservationEvent`.
