import type { Metadata } from 'next';
import './globals.css';
import { AuthProvider } from '../lib/AuthContext';

export const metadata: Metadata = {
  title: 'HotelFlexi — Your Hotel. One Intelligent System. | NovaX AI',
  description:
    'All-in-one hospitality management SaaS platform combining hotel PMS, channel manager, direct booking engine, GST billing, housekeeping, and AI business agent.',
  keywords: [
    'hotel management',
    'pms',
    'channel manager',
    'booking engine',
    'hotel billing',
    'hospitality saas',
    'hotel flexi',
    'novax ai',
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-white text-content-primary-light antialiased">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
