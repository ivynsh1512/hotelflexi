const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const publicDir = path.join(__dirname, '..', 'apps', 'web', 'public');

// 1. Desktop Screenshot (1280 x 720) - Wide form factor
const desktopSvg = `
<svg width="1280" height="720" viewBox="0 0 1280 720" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0f172a" />
      <stop offset="100%" stop-color="#1e293b" />
    </linearGradient>
    <linearGradient id="cardGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#1e3a8a" />
      <stop offset="100%" stop-color="#2563eb" />
    </linearGradient>
    <linearGradient id="accentGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#10b981" />
      <stop offset="100%" stop-color="#059669" />
    </linearGradient>
  </defs>

  <!-- Background -->
  <rect width="1280" height="720" fill="url(#bgGrad)" />

  <!-- App Header -->
  <rect x="0" y="0" width="1280" height="64" fill="#0b1120" />
  <rect x="24" y="16" width="32" height="32" rx="8" fill="#2563eb" />
  <text x="35" y="38" font-family="system-ui, -apple-system, sans-serif" font-weight="900" font-size="18" fill="#ffffff">H</text>
  <text x="68" y="38" font-family="system-ui, -apple-system, sans-serif" font-weight="800" font-size="20" fill="#ffffff">Hotel<tspan fill="#60a5fa">Flexi</tspan></text>

  <rect x="220" y="18" width="120" height="28" rx="6" fill="#1e293b" />
  <text x="240" y="36" font-family="sans-serif" font-weight="600" font-size="12" fill="#94a3b8">Front Desk</text>

  <rect x="350" y="18" width="130" height="28" rx="6" fill="#1e3a8a" />
  <text x="366" y="36" font-family="sans-serif" font-weight="700" font-size="12" fill="#bfdbfe">Live Channel Mgr</text>

  <rect x="490" y="18" width="110" height="28" rx="6" fill="#1e293b" />
  <text x="506" y="36" font-family="sans-serif" font-weight="600" font-size="12" fill="#94a3b8">Housekeeping</text>

  <!-- Live Status Badge -->
  <rect x="1080" y="18" width="160" height="28" rx="14" fill="#064e3b" stroke="#10b981" stroke-width="1" />
  <circle cx="1096" cy="32" r="4" fill="#34d399" />
  <text x="1108" y="36" font-family="sans-serif" font-weight="700" font-size="11" fill="#a7f3d0">2-Way OTA Active</text>

  <!-- Sidebar -->
  <rect x="0" y="64" width="220" height="656" fill="#090d16" />
  <text x="24" y="105" font-family="sans-serif" font-weight="700" font-size="11" fill="#64748b" letter-spacing="1">HOTEL MANAGEMENT</text>
  <rect x="16" y="120" width="188" height="36" rx="8" fill="#1e293b" />
  <text x="48" y="143" font-family="sans-serif" font-weight="600" font-size="13" fill="#f8fafc">Dashboard Overview</text>
  <text x="48" y="185" font-family="sans-serif" font-weight="500" font-size="13" fill="#94a3b8">Room Calendar</text>
  <text x="48" y="225" font-family="sans-serif" font-weight="500" font-size="13" fill="#94a3b8">OTA Distribution</text>
  <text x="48" y="265" font-family="sans-serif" font-weight="500" font-size="13" fill="#94a3b8">Direct Booking Engine</text>
  <text x="48" y="305" font-family="sans-serif" font-weight="500" font-size="13" fill="#94a3b8">Housekeeping &amp; Siren</text>
  <text x="48" y="345" font-family="sans-serif" font-weight="500" font-size="13" fill="#94a3b8">GST Folios &amp; Accounts</text>
  <text x="48" y="385" font-family="sans-serif" font-weight="500" font-size="13" fill="#94a3b8">AI Concierge Agent</text>

  <!-- Main Content Area -->
  <!-- Top Stat Cards -->
  <g transform="translate(250, 90)">
    <rect x="0" y="0" width="230" height="100" rx="16" fill="#1e293b" stroke="#334155" stroke-width="1" />
    <text x="20" y="32" font-family="sans-serif" font-weight="600" font-size="12" fill="#94a3b8">TOTAL ROOMS OCCUPIED</text>
    <text x="20" y="70" font-family="sans-serif" font-weight="900" font-size="28" fill="#ffffff">88.5%</text>
    <text x="130" y="68" font-family="sans-serif" font-weight="700" font-size="12" fill="#34d399">+14.2% YoY</text>

    <rect x="250" y="0" width="230" height="100" rx="16" fill="#1e293b" stroke="#334155" stroke-width="1" />
    <text x="270" y="32" font-family="sans-serif" font-weight="600" font-size="12" fill="#94a3b8">TODAY'S REVENUE (INR)</text>
    <text x="270" y="70" font-family="sans-serif" font-weight="900" font-size="28" fill="#ffffff">&#8377;94,500</text>
    <text x="400" y="68" font-family="sans-serif" font-weight="700" font-size="12" fill="#34d399">Direct + OTA</text>

    <rect x="500" y="0" width="230" height="100" rx="16" fill="#1e293b" stroke="#334155" stroke-width="1" />
    <text x="520" y="32" font-family="sans-serif" font-weight="600" font-size="12" fill="#94a3b8">CONNECTED CHANNELS</text>
    <text x="520" y="70" font-family="sans-serif" font-weight="900" font-size="28" fill="#ffffff">5 / 5 OTAs</text>
    <text x="640" y="68" font-family="sans-serif" font-weight="700" font-size="12" fill="#60a5fa">Live IngoMMT</text>

    <rect x="750" y="0" width="230" height="100" rx="16" fill="#1e293b" stroke="#334155" stroke-width="1" />
    <text x="770" y="32" font-family="sans-serif" font-weight="600" font-size="12" fill="#94a3b8">HOUSEKEEPING SIREN</text>
    <text x="770" y="70" font-family="sans-serif" font-weight="900" font-size="22" fill="#10b981">ALL CLEAR</text>
    <text x="890" y="68" font-family="sans-serif" font-weight="600" font-size="11" fill="#94a3b8">0 Urgent</text>
  </g>

  <!-- Channel Manager Matrix Mock -->
  <g transform="translate(250, 215)">
    <rect x="0" y="0" width="980" height="470" rx="16" fill="#1e293b" stroke="#334155" stroke-width="1" />
    <text x="24" y="38" font-family="sans-serif" font-weight="800" font-size="18" fill="#ffffff">Live Inventory &amp; Rate Matrix Calendar</text>
    <text x="24" y="60" font-family="sans-serif" font-weight="500" font-size="12" fill="#94a3b8">Single Source of Truth synchronized across MakeMyTrip, Agoda, Booking.com, Airbnb &amp; Expedia</text>

    <!-- Table Header -->
    <rect x="24" y="80" width="932" height="40" rx="8" fill="#0f172a" />
    <text x="40" y="105" font-family="sans-serif" font-weight="700" font-size="12" fill="#cbd5e1">Room Category</text>
    <text x="260" y="105" font-family="sans-serif" font-weight="700" font-size="12" fill="#cbd5e1">Today (Oct 20)</text>
    <text x="400" y="105" font-family="sans-serif" font-weight="700" font-size="12" fill="#cbd5e1">Tue (Oct 21)</text>
    <text x="540" y="105" font-family="sans-serif" font-weight="700" font-size="12" fill="#cbd5e1">Wed (Oct 22)</text>
    <text x="680" y="105" font-family="sans-serif" font-weight="700" font-size="12" fill="#f59e0b">Fri (Weekend)</text>
    <text x="820" y="105" font-family="sans-serif" font-weight="700" font-size="12" fill="#f59e0b">Sat (Weekend)</text>

    <!-- Row 1: Deluxe Suite -->
    <g transform="translate(24, 130)">
      <rect x="0" y="0" width="932" height="90" rx="8" fill="#1e293b" stroke="#334155" stroke-width="0.5" />
      <text x="16" y="32" font-family="sans-serif" font-weight="700" font-size="14" fill="#ffffff">Deluxe King Suite</text>
      <text x="16" y="52" font-family="monospace" font-weight="700" font-size="11" fill="#60a5fa">DLX-KNG</text>

      <!-- Cells -->
      <text x="240" y="32" font-family="sans-serif" font-weight="800" font-size="14" fill="#34d399">4 Available</text>
      <text x="240" y="52" font-family="sans-serif" font-weight="700" font-size="13" fill="#ffffff">&#8377;4,500/nt</text>

      <text x="380" y="32" font-family="sans-serif" font-weight="800" font-size="14" fill="#34d399">4 Available</text>
      <text x="380" y="52" font-family="sans-serif" font-weight="700" font-size="13" fill="#ffffff">&#8377;4,500/nt</text>

      <text x="520" y="32" font-family="sans-serif" font-weight="800" font-size="14" fill="#fbbf24">1 Available</text>
      <text x="520" y="52" font-family="sans-serif" font-weight="700" font-size="13" fill="#ffffff">&#8377;4,800/nt</text>

      <text x="660" y="32" font-family="sans-serif" font-weight="800" font-size="14" fill="#f87171">SOLD OUT</text>
      <text x="660" y="52" font-family="sans-serif" font-weight="700" font-size="13" fill="#ffffff">&#8377;5,900/nt</text>

      <text x="800" y="32" font-family="sans-serif" font-weight="800" font-size="14" fill="#f87171">SOLD OUT</text>
      <text x="800" y="52" font-family="sans-serif" font-weight="700" font-size="13" fill="#ffffff">&#8377;6,200/nt</text>
    </g>

    <!-- Row 2: Executive Room -->
    <g transform="translate(24, 230)">
      <rect x="0" y="0" width="932" height="90" rx="8" fill="#1e293b" stroke="#334155" stroke-width="0.5" />
      <text x="16" y="32" font-family="sans-serif" font-weight="700" font-size="14" fill="#ffffff">Executive Premium</text>
      <text x="16" y="52" font-family="monospace" font-weight="700" font-size="11" fill="#60a5fa">EXE-PRM</text>

      <text x="240" y="32" font-family="sans-serif" font-weight="800" font-size="14" fill="#34d399">8 Available</text>
      <text x="240" y="52" font-family="sans-serif" font-weight="700" font-size="13" fill="#ffffff">&#8377;3,200/nt</text>

      <text x="380" y="32" font-family="sans-serif" font-weight="800" font-size="14" fill="#34d399">7 Available</text>
      <text x="380" y="52" font-family="sans-serif" font-weight="700" font-size="13" fill="#ffffff">&#8377;3,200/nt</text>

      <text x="520" y="32" font-family="sans-serif" font-weight="800" font-size="14" fill="#34d399">5 Available</text>
      <text x="520" y="52" font-family="sans-serif" font-weight="700" font-size="13" fill="#ffffff">&#8377;3,500/nt</text>

      <text x="660" y="32" font-family="sans-serif" font-weight="800" font-size="14" fill="#fbbf24">2 Available</text>
      <text x="660" y="52" font-family="sans-serif" font-weight="700" font-size="13" fill="#ffffff">&#8377;4,200/nt</text>

      <text x="800" y="32" font-family="sans-serif" font-weight="800" font-size="14" fill="#fbbf24">1 Available</text>
      <text x="800" y="52" font-family="sans-serif" font-weight="700" font-size="13" fill="#ffffff">&#8377;4,500/nt</text>
    </g>

    <!-- Bottom Feature Callout -->
    <rect x="24" y="340" width="932" height="100" rx="12" fill="#0f172a" stroke="#2563eb" stroke-width="1" />
    <text x="44" y="375" font-family="sans-serif" font-weight="800" font-size="14" fill="#60a5fa">AUTONOMOUS AI CONCIERGE &amp; PMS INTEGRATION</text>
    <text x="44" y="400" font-family="sans-serif" font-weight="500" font-size="12" fill="#cbd5e1">Bilingual voice &amp; text AI manages room allocations, guest queries, GST tax folios, and OTA rate parity 24/7 without staff intervention.</text>
    <text x="44" y="422" font-family="sans-serif" font-weight="700" font-size="11" fill="#34d399">&#10003; Zero commission on direct bookings &#8226; &#10003; &#8377;499/mo Starter Plan includes Channel Manager &#8226; &#10003; 7-minute Housekeeping Siren</text>
  </g>
</svg>
`;

// 2. Mobile Screenshot (750 x 1334) - Narrow form factor
const mobileSvg = `
<svg width="750" height="1334" viewBox="0 0 750 1334" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="mBg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0b1120" />
      <stop offset="100%" stop-color="#1e293b" />
    </linearGradient>
  </defs>

  <!-- Background -->
  <rect width="750" height="1334" fill="url(#mBg)" />

  <!-- Status Bar -->
  <rect x="0" y="0" width="750" height="60" fill="#070c18" />
  <text x="40" y="40" font-family="sans-serif" font-weight="700" font-size="18" fill="#ffffff">9:41</text>
  <text x="650" y="40" font-family="sans-serif" font-weight="700" font-size="16" fill="#ffffff">5G</text>

  <!-- Mobile App Header -->
  <rect x="0" y="60" width="750" height="100" fill="#0f172a" />
  <rect x="36" y="80" width="60" height="60" rx="16" fill="#2563eb" />
  <text x="56" y="122" font-family="system-ui, sans-serif" font-weight="900" font-size="32" fill="#ffffff">H</text>
  <text x="116" y="115" font-family="sans-serif" font-weight="900" font-size="28" fill="#ffffff">Hotel<tspan fill="#60a5fa">Flexi</tspan></text>
  <text x="116" y="138" font-family="sans-serif" font-weight="600" font-size="14" fill="#94a3b8">Mobile Front Desk &amp; Siren</text>

  <!-- Urgent Siren Notification Banner -->
  <g transform="translate(36, 180)">
    <rect x="0" y="0" width="678" height="110" rx="20" fill="#450a0a" stroke="#ef4444" stroke-width="2" />
    <circle cx="45" cy="55" r="22" fill="#dc2626" />
    <text x="35" y="62" font-family="sans-serif" font-size="22" fill="#ffffff">&#128680;</text>
    <text x="85" y="42" font-family="sans-serif" font-weight="900" font-size="17" fill="#fca5a5">URGENT HOUSEKEEPING SIREN</text>
    <text x="85" y="68" font-family="sans-serif" font-weight="700" font-size="14" fill="#ffffff">Room 204: Dirty bedsheet replacement</text>
    <text x="85" y="92" font-family="sans-serif" font-weight="600" font-size="12" fill="#f87171">Siren sounding across staff devices &#8226; Tap to pick</text>
  </g>

  <!-- Mobile Quick Action Cards -->
  <g transform="translate(36, 310)">
    <rect x="0" y="0" width="325" height="150" rx="20" fill="#1e293b" stroke="#334155" stroke-width="1" />
    <text x="24" y="45" font-family="sans-serif" font-weight="700" font-size="14" fill="#94a3b8">TODAY'S OCCUPANCY</text>
    <text x="24" y="95" font-family="sans-serif" font-weight="900" font-size="38" fill="#ffffff">92%</text>
    <text x="24" y="125" font-family="sans-serif" font-weight="700" font-size="13" fill="#34d399">23 / 25 Rooms Sold</text>

    <rect x="353" y="0" width="325" height="150" rx="20" fill="#1e293b" stroke="#334155" stroke-width="1" />
    <text x="377" y="45" font-family="sans-serif" font-weight="700" font-size="14" fill="#94a3b8">TODAY'S COLLECTIONS</text>
    <text x="377" y="95" font-family="sans-serif" font-weight="900" font-size="34" fill="#ffffff">&#8377;84,200</text>
    <text x="377" y="125" font-family="sans-serif" font-weight="700" font-size="13" fill="#60a5fa">GST Folios Auto-Saved</text>
  </g>

  <!-- OTA Channel Health Section -->
  <g transform="translate(36, 480)">
    <rect x="0" y="0" width="678" height="240" rx="20" fill="#1e293b" stroke="#334155" stroke-width="1" />
    <text x="28" y="45" font-family="sans-serif" font-weight="800" font-size="20" fill="#ffffff">Connected OTA Channels</text>
    <text x="28" y="72" font-family="sans-serif" font-weight="600" font-size="13" fill="#94a3b8">2-Way Live Sync Active (Starter &#8377;499/mo)</text>

    <rect x="28" y="95" width="622" height="55" rx="14" fill="#0f172a" />
    <text x="48" y="130" font-family="sans-serif" font-weight="800" font-size="16" fill="#ffffff">MakeMyTrip / Goibibo</text>
    <text x="520" y="130" font-family="sans-serif" font-weight="700" font-size="13" fill="#34d399">&#10003; 100% Synced</text>

    <rect x="28" y="160" width="622" height="55" rx="14" fill="#0f172a" />
    <text x="48" y="195" font-family="sans-serif" font-weight="800" font-size="16" fill="#ffffff">Booking.com &amp; Agoda</text>
    <text x="520" y="195" font-family="sans-serif" font-weight="700" font-size="13" fill="#34d399">&#10003; Rates Live</text>
  </g>

  <!-- Quick Guest Self Check-In / FlexiLink Section -->
  <g transform="translate(36, 740)">
    <rect x="0" y="0" width="678" height="220" rx="20" fill="#1e293b" stroke="#334155" stroke-width="1" />
    <text x="28" y="45" font-family="sans-serif" font-weight="800" font-size="20" fill="#ffffff">FlexiLink Direct Guest Check-in</text>
    <text x="28" y="72" font-family="sans-serif" font-weight="600" font-size="13" fill="#94a3b8">Instant WhatsApp &amp; Mail check-in with ID verification</text>

    <rect x="28" y="95" width="622" height="95" rx="14" fill="#0b1120" stroke="#2563eb" stroke-width="1" />
    <text x="48" y="135" font-family="sans-serif" font-weight="700" font-size="16" fill="#bfdbfe">Rajesh Verma &#8226; Deluxe Suite 201</text>
    <text x="48" y="165" font-family="sans-serif" font-weight="600" font-size="13" fill="#34d399">Self Check-In Complete &#8226; Aadhaar ID Verified</text>
  </g>

  <!-- Bottom Navigation Bar -->
  <rect x="0" y="1234" width="750" height="100" fill="#090d16" />
  <text x="80" y="1290" font-family="sans-serif" font-weight="700" font-size="14" fill="#2563eb">Calendar</text>
  <text x="250" y="1290" font-family="sans-serif" font-weight="600" font-size="14" fill="#94a3b8">Channels</text>
  <text x="420" y="1290" font-family="sans-serif" font-weight="600" font-size="14" fill="#94a3b8">Urgency Siren</text>
  <text x="610" y="1290" font-family="sans-serif" font-weight="600" font-size="14" fill="#94a3b8">AI Agent</text>
</svg>
`;

async function run() {
  await sharp(Buffer.from(desktopSvg))
    .png()
    .toFile(path.join(publicDir, 'screenshot-desktop.png'));
  console.log('Created screenshot-desktop.png');

  await sharp(Buffer.from(mobileSvg))
    .png()
    .toFile(path.join(publicDir, 'screenshot-mobile.png'));
  console.log('Created screenshot-mobile.png');
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
