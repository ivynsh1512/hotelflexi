# HotelFlexi Channel Manager — Operations & Incident Runbook

---

## 1. Incident Scenarios & Standard Operating Procedures (SOP)

### Incident 1: OTA Rate or Inventory Desynchronization
- **Symptom**: Hotelier reports Booking.com or MMT displays a different room rate or availability than the HotelFlexi Front Desk.
- **SOP**:
  1. Navigate to `/app/channels` $\rightarrow$ **Reconciliation**.
  2. Run **Instant Discrepancy Scan**.
  3. Inspect identified discrepancy records (room category, date, local price vs. remote price).
  4. Click **Force Push Central State** to immediately dispatch an authoritative outbox sync job.
  5. Check **Sync Queue** to confirm the job status transitions from `processing` to `succeeded`.

### Incident 2: Inbound Booking Overbooking Conflict
- **Symptom**: An OTA sends a reservation webhook when all physical rooms of that category are already booked.
- **SOP**:
  1. The Channel Ingestion engine creates the booking in `needs_room_assignment` state and logs a Critical Reconciliation event.
  2. Staff Siren alerts the reception team immediately.
  3. In `/app/channels` $\rightarrow$ **Reservation Synchronization**, staff can reassign the guest to an upgraded available category (e.g., Deluxe $\rightarrow$ Suite) with zero penalty to the guest.
  4. The engine automatically transmits an immediate **Stop-Sell** (`closed: 1`) to all connected OTAs for that date.

### Incident 3: OTA API Authentication Failure
- **Symptom**: Sync jobs fail with HTTP 401 Unauthorized (`last_error_code: "AUTH_FAILED"`).
- **SOP**:
  1. Connection status automatically transitions to `error`.
  2. The dashboard displays an alert: *"Credentials expired or rejected by provider."*
  3. Hotelier updates API Key / Password in **Connection Settings**.
  4. System executes `testConnection` handshake; upon HTTP 200, status returns to `active`.
