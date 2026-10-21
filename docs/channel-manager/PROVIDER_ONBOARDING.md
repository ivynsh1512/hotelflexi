# HotelFlexi Channel Manager — Provider Onboarding Guide
**Audience:** Hotel Owners, General Managers & Connectivity Engineers

---

## 1. Prerequisites for Live Distribution
To connect an OTA channel in live production mode, the hotelier must hold an active commercial contract with the respective OTA and obtain their Channel Manager / PMS connectivity credentials.

---

## 2. Onboarding Steps by Channel

### 2.1 Booking.com Connectivity
1. Log in to the [Booking.com Extranet](https://admin.booking.com).
2. Navigate to **Account** $\rightarrow$ **Channel Manager**.
3. Search for and select **HotelFlexi by NovaX AI** as your Connectivity Provider.
4. Confirm two-way connection for **Rates & Availability** and **Reservations**.
5. Once approved, Booking.com issues a 7-digit **Hotel ID**.
6. In HotelFlexi Central Dashboard:
   - Navigate to `/app/channels`.
   - Click **Connect** on Booking.com.
   - Enter your **Hotel ID** and **API Access Token**.
   - Set environment to `production` and click **Verify & Connect**.

### 2.2 MakeMyTrip & Goibibo (IngoMMT)
1. Log in to [IngoMMT Extranet](https://in.goibibo.com/extranet/).
2. Go to **Channel Manager Settings**.
3. Choose **HotelFlexi** as your Channel Manager partner.
4. Note your **MMT Property Code** (e.g. `MMT_102948`).
5. In HotelFlexi, enter your MMT Property Code and Secret Key to activate.

### 2.3 Agoda (YCS)
1. Log in to [Agoda YCS](https://ycs.agoda.com).
2. Go to **Settings** $\rightarrow$ **Channel Manager**.
3. Select **HotelFlexi** and save.
4. Enter the Agoda Hotel ID in HotelFlexi.

### 2.4 Expedia Group
1. Log in to [Expedia Partner Central](https://www.expediapartnercentral.com).
2. Go to **Rooms and Rates** $\rightarrow$ **Expedia Connectivity Settings**.
3. Select **HotelFlexi** for both ARI and Bookings.
4. Enter your Expedia Hotel ID and EPC Username/Password in HotelFlexi.
