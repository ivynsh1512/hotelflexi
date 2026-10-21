# HotelFlexi Channel Manager — Testing & Quality Assurance Plan

---

## 1. Test Architecture
Channel Manager testing is organized into 3 complementary tiers:
1. **Unit & Contract Tests (`apps/api/test/channelManager.test.ts`)**:
   - Tests provider adapter contracts, schema validation, payload serialization, and status resolution.
   - Verifies exponential backoff timing, jitter, and idempotency key enforcement.
   - Tests tenant boundary enforcement and role authorization gates.
2. **Integration Tests (`apps/api/test/channelEngine.test.ts`)**:
   - Tests the Outbox pattern: PMS room booking mutates inventory $\rightarrow$ creates `sync_jobs` $\rightarrow$ pushes to mock/sandbox adapters.
   - Tests overbooking protection: concurrent simulated bookings for the last remaining physical room; guarantees exactly 1 succeeds and second is rejected/escalated.
   - Tests webhook idempotency: identical reservation webhook arriving multiple times yields single reservation folio without double-count.
3. **Frontend Component & Route Verification**:
   - Verifies complete compilation (`next build`) across all channel manager dashboard views.
