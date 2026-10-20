import type { Metadata, Viewport } from 'next';
import './globals.css';
import { Inter } from 'next/font/google';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});
import { AuthProvider } from '../lib/AuthContext';
import { ServiceWorkerRegister } from '../components/ServiceWorkerRegister';
import { NotificationPermissionPrompt } from '../components/NotificationPermissionPrompt';

export const viewport: Viewport = {
  themeColor: '#1e40af',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
};

export const metadata: Metadata = {
  metadataBase: new URL('https://hotelflexi.novaxai.in'),
  title: {
    default: 'HotelFlexi — Your Hotel. One Intelligent System. | NovaX AI',
    template: '%s | HotelFlexi by NovaX AI',
  },
  description:
    'All-in-one hotel management SaaS platform for Indian hotels, resorts & homestays. Cloud PMS, 2-way OTA channel manager, direct booking engine with FlexiLink, 12%/18% GST billing, and bilingual AI business agent.',
  applicationName: 'HotelFlexi',
  authors: [{ name: 'NovaX AI', url: 'https://novaxai.in' }],
  generator: 'Next.js',
  keywords: [
    'hotel management system india',
    'hotel pms software',
    'cloud hotel software',
    'channel manager makemytrip booking.com agoda airbnb',
    'direct booking engine',
    'indian hotel gst billing software',
    'hospitality ai agent',
    'hotel front desk management',
    'hotel flexi',
    'novax ai',
  ],
  manifest: '/manifest.webmanifest',
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/favicon.png', type: 'image/png', sizes: '32x32' },
      { url: '/icon-192.png', type: 'image/png', sizes: '192x192' },
    ],
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
  },
  openGraph: {
    type: 'website',
    locale: 'en_IN',
    url: 'https://hotelflexi.novaxai.in',
    title: 'HotelFlexi — Cloud Hotel PMS, Channel Manager & AI Agent',
    description:
      'Empower your hotel with cloud reservations, 2-way OTA synchronization, direct guest check-in via FlexiLink, and Indian GST compliant billing.',
    siteName: 'HotelFlexi',
    images: [
      {
        url: '/dark-logo.png',
        width: 1200,
        height: 675,
        alt: 'HotelFlexi by NovaX AI',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'HotelFlexi — Cloud PMS & Channel Manager for Hotels',
    description:
      'Manage room reservations, live OTA channels, guest check-in, and GST invoices seamlessly.',
    images: ['/dark-logo.png'],
  },
  other: {
    'geo.region': 'IN',
    'geo.placename': 'India',
    'mobile-web-app-capable': 'yes',
    'apple-mobile-web-app-capable': 'yes',
    'apple-mobile-web-app-status-bar-style': 'black-translucent',
    'apple-mobile-web-app-title': 'HotelFlexi',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'SoftwareApplication',
        '@id': 'https://hotelflexi.novaxai.in/#software',
        name: 'HotelFlexi',
        applicationCategory: 'BusinessApplication',
        operatingSystem: 'Web, Android (PWA/TWA)',
        offers: {
          '@type': 'Offer',
          price: '499',
          priceCurrency: 'INR',
          priceValidUntil: '2027-12-31',
        },
        author: {
          '@type': 'Organization',
          name: 'NovaX AI',
          url: 'https://novaxai.in',
        },
        aggregateRating: {
          '@type': 'AggregateRating',
          ratingValue: '4.9',
          ratingCount: '128',
        },
        description:
          'Comprehensive cloud-native hotel property management system (PMS), OTA channel manager, and bilingual AI concierge for Indian hospitality operators.',
      },
      {
        '@type': 'Organization',
        '@id': 'https://hotelflexi.novaxai.in/#organization',
        name: 'HotelFlexi by NovaX AI',
        url: 'https://hotelflexi.novaxai.in',
        logo: 'https://hotelflexi.novaxai.in/light-logo.png',
        contactPoint: {
          '@type': 'ContactPoint',
          email: 'info@novaxai.in',
          contactType: 'customer support',
          areaServed: 'IN',
          availableLanguage: ['English', 'Hindi'],
        },
      },
      {
        '@type': 'FAQPage',
        '@id': 'https://hotelflexi.novaxai.in/#faq',
        mainEntity: [
          {
            '@type': 'Question',
            name: 'What is HotelFlexi?',
            acceptedAnswer: {
              '@type': 'Answer',
              text: 'HotelFlexi is a modern, unified hotel operating platform developed by NovaX AI. It combines a front-desk Property Management System (PMS), 2-way OTA Channel Manager, direct commission-free Booking Engine, digital guest check-in via FlexiLink, Indian GST billing folios, and an AI hotel agent.',
            },
          },
          {
            '@type': 'Question',
            name: 'Does HotelFlexi support Indian GST invoices and rates?',
            acceptedAnswer: {
              '@type': 'Answer',
              text: 'Yes. HotelFlexi is fully tailored for Indian taxation compliance, automatically applying 0%, 12%, or 18% GST brackets based on room tariffs, and generating SAC 9963 compliant GST tax invoices.',
            },
          },
          {
            '@type': 'Question',
            name: 'How does the FlexiLink guest check-in work?',
            acceptedAnswer: {
              '@type': 'Answer',
              text: 'When a booking is confirmed, a secure FlexiLink URL is automatically sent to the guest. Guests can review booking details, complete self check-in by uploading government ID proof, and verify payment before arrival.',
            },
          },
          {
            '@type': 'Question',
            name: 'Which OTA platforms does HotelFlexi connect with?',
            acceptedAnswer: {
              '@type': 'Answer',
              text: 'HotelFlexi syncs 2-way room availability and rates with MakeMyTrip, Goibibo, Booking.com, Agoda, Airbnb, and Expedia.',
            },
          },
        ],
      },
    ],
  };

  return (
    <html lang="en" className={inter.variable}>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&display=swap" rel="stylesheet" />
        <link rel="manifest" href="/manifest.webmanifest" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="HotelFlexi" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <script
          dangerouslySetInnerHTML={{
            __html: `if('serviceWorker' in navigator){window.addEventListener('load',function(){navigator.serviceWorker.register('/sw.js').catch(function(){});});}`,
          }}
        />
      </head>
      <body className={`min-h-screen bg-white text-content-primary-light antialiased ${inter.className}`}>
        <AuthProvider>{children}</AuthProvider>
        <ServiceWorkerRegister />
        <NotificationPermissionPrompt />
      </body>
    </html>
  );
}
