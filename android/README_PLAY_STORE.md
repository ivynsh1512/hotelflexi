# HotelFlexi Android & Google Play Store Publication Guide

**Product Name:** HotelFlexi  
**Company:** NovaX AI  
**Package ID:** `in.novaxai.hotelflexi`  
**Production Host:** `https://hotelflexi.com`  
**Mandatory Launch URL:** `https://hotelflexi.com/login`  

---

## 1. Prerequisites Verified

- [x] **Web App Manifest**: Live at `https://hotelflexi.com/manifest.webmanifest` (`start_url: "/login"`, `display: "standalone"`, icons 192, 512, maskable).
- [x] **Safe Production Service Worker**: Live at `https://hotelflexi.com/sw.js` (offline fallback to `/offline`, API & auth bypass).
- [x] **Digital Asset Links**: Configured at `https://hotelflexi.com/.well-known/assetlinks.json`.
- [x] **Android Launcher Icons**: Generated at `android/app/src/main/res/mipmap-*` (48px to 192px).
- [x] **Bubblewrap TWA Manifest**: Generated at `android/twa-manifest.json`.

---

## 2. Generating Your Production Release Keystore

If you don't already have an Android release keystore, run:

```bash
keytool -genkey -v -keystore hotelflexi-release.keystore -alias hotelflexi -keyalg RSA -keysize 2048 -validity 10000
```

Extract the SHA-256 fingerprint:

```bash
keytool -list -v -keystore hotelflexi-release.keystore -alias hotelflexi
```

Copy the `SHA256: XX:XX:XX...` fingerprint and verify it matches the one in:
- `apps/web/public/.well-known/assetlinks.json`
- `android/app/src/main/res/values/strings.xml`

---

## 3. Building the Release Android App Bundle (.aab)

### Option A: Using Bubblewrap CLI (Fastest & Google-Recommended)

```bash
cd android
npx @bubblewrap/cli build
```
Bubblewrap reads `twa-manifest.json` and outputs `app-release-bundle.aab`.

### Option B: Using Android Studio / Gradle

1. Open the `android` folder in **Android Studio**.
2. Go to **Build > Generate Signed Bundle / APK...**
3. Select **Android App Bundle (.aab)**.
4. Select your `hotelflexi-release.keystore` and enter credentials.
5. Choose **release** build variant and click **Finish**.
6. Your `.aab` file will be generated in `android/app/release/app-release.aab`.

---

## 4. Google Play Console Listing Checklist

1. **Create App in Play Console:**
   - App Name: `HotelFlexi — Hotel PMS & Booking`
   - Default Language: `English (India)`
   - App type: `App`, Free / Commercial SaaS.
2. **Set up Store Presence:**
   - **Short Description (80 chars):** Cloud Hotel PMS, channel manager, direct bookings & GST billing by NovaX AI.
   - **Full Description:**
     HotelFlexi by NovaX AI is an all-in-one hospitality management and front desk operating platform.
     - Cloud PMS Calendar & fast check-in / check-out
     - 2-way OTA Channel Manager sync (MakeMyTrip, Booking.com, Agoda, Airbnb)
     - Direct zero-commission booking engine with FlexiLink guest check-in
     - Indian GST compliance (12% / 18% tax calculation & SAC 9963 invoicing)
     - Housekeeping task assignment & room readiness tracking
     - Bilingual AI Business Concierge & Front-Desk Agent
   - **App Icon:** `apps/web/public/icon-512.png` (512×512 PNG, no transparency if required by Play Console).
   - **Feature Graphic:** 1024×500 PNG.
   - **Phone Screenshots:** At least 4 screenshots (PMS calendar, booking engine, housekeeping, GST invoice).
3. **App Content & Declarations:**
   - **Privacy Policy URL:** `https://hotelflexi.com/privacy`
   - **App Access:** "All functionality is available without special access" or provide test credentials (`demo@novaxai.in`).
   - **Content Rating:** Everyone (Complete the questionnaire).
   - **Target Audience:** 18 and older (Business / Hospitality).
4. **Release Track:**
   - Upload `app-release.aab` to **Production** or **Internal Testing**.
   - Send for Google Review!
