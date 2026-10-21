# HotelFlexi Channel Manager — Official OTA Capabilities Matrix
**Strict Compliance Notice:** In compliance with core engineering principles, capabilities are strictly marked based on actual verification status. No unapproved connection is marked as production-verified.

---

## 1. Provider Capabilities Status Matrix

| Channel Provider | Code | Interface Implemented | Official Docs Validated | Sandbox Tested | Production Approved | Verified in Production | Primary Integration Protocol |
| :--- | :--- | :---: | :---: | :---: | :---: | :---: | :--- |
| **Booking.com** | `booking_com` | ✅ Yes | ✅ Yes | ✅ Yes (Synthetic) | ⏳ Awaiting Partner Account | ⏳ Pending Credentials | BookingSuite B.XML & ARI REST v2.0 |
| **Agoda** | `agoda` | ✅ Yes | ✅ Yes | ✅ Yes (Synthetic) | ⏳ Awaiting YCS Partner ID | ⏳ Pending Credentials | Agoda YCS Inbound ARI / Booking JSON |
| **Expedia Group** | `expedia` | ✅ Yes | ✅ Yes | ✅ Yes (Synthetic) | ⏳ Awaiting Expedia Partner Central | ⏳ Pending Credentials | Expedia QuickConnect / EPC REST API |
| **MakeMyTrip / Goibibo** | `makemytrip` | ✅ Yes | ✅ Yes | ✅ Yes (Synthetic) | ⏳ Awaiting IngoMMT Channel Credentials | ⏳ Pending Credentials | IngoMMT Direct Connect / Channel Engine v3 |
| **Tripadvisor** | `tripadvisor` | ✅ Yes | ✅ Yes | ⏳ In Development | ⏳ Awaiting Plus Metasearch Partner | ⏳ Pending Credentials | Tripadvisor Instant Booking & Plus API |

---

## 2. Granular Operation Support by Provider

### 2.1 Booking.com (`booking_com`)
- **Availability Push (`pushAvailability`)**: Supported via `/2.0/json/availability`. Pushes physical room inventory count per date range.
- **Rates Push (`pushRates`)**: Supported via `/2.0/json/rateChange`. Pushes base nightly prices per mapped rate plan in local currency (INR).
- **Restrictions Push (`pushRestrictions`)**: Supported via `/2.0/json/restrictions`. Supports `closed` (stop-sell), `closed_to_arrival` (CTA), `closed_to_departure` (CTD), and `min_stay`.
- **Reservations Pull (`fetchReservations`)**: Supported via `/2.0/json/reservations`. Pulls unread bookings and marks them acknowledged.
- **Webhook Processing (`parseReservationWebhook`)**: Supported. Verifies HTTP Basic/Bearer auth, extracts reservation XML/JSON, and normalizes into HotelFlexi PMS.

### 2.2 Agoda (`agoda`)
- **Availability Push**: Supported via Agoda YCS ARI Gateway.
- **Rates Push**: Supported via Agoda Multi-Tariff Engine.
- **Restrictions Push**: Supported (CTA, CTD, Stop-Sell).
- **Reservation Processing**: Supported. Accepts Agoda Booking notification payload and deduplicates on Agoda Booking ID.

### 2.3 Expedia Group (`expedia`)
- **Availability & Rates Push**: Supported via Expedia QuickConnect (EQC) Product API.
- **Restrictions Push**: Supported via EQC Restriction endpoints.
- **Reservation Ingestion**: Supports Booking Retrieval & Confirmation API.

### 2.4 MakeMyTrip / Goibibo (`makemytrip`)
- **Availability & Rates Push**: Supported via IngoMMT ARI XML/JSON gateway.
- **Restrictions Push**: Supported (Stop-Sell & Min-Stay rules).
- **Reservation Ingestion**: Ingests IngoMMT new bookings, cancellations, and modifications.

### 2.5 Tripadvisor (`tripadvisor`)
- **Metasearch & Direct Connect**: In development. Metasearch price-feed and instant booking handshakes require verified Tripadvisor Plus partner validation.
