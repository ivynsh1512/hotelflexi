import React from 'react';
import Link from 'next/link';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import {
  Calendar,
  Globe,
  Layers,
  Receipt,
  BedDouble,
  ShieldCheck,
  Sparkles,
  BarChart3,
  Users,
  CheckCircle2,
  ChevronRight,
} from 'lucide-react';

export default function FeaturesPage() {
  const featureList = [
    {
      icon: Calendar,
      title: 'Hotel PMS & Reservation Calendar',
      desc: 'Interactive room grid displaying real-time occupancy. Handle walk-ins, advance reservations, check-ins, check-outs, room blocks, and guest notes seamlessly.',
      link: '/hotel-management',
    },
    {
      icon: Sparkles,
      title: 'Bilingual AI Business Agent',
      desc: 'Operate the hotel using English, Hindi, and Hinglish. Check arrivals, update rates, block rooms, and view collections instantly without touching complex menus.',
      link: '/ai-hotel-agent',
    },
    {
      icon: Layers,
      title: 'OTA Channel Manager',
      desc: 'Centralized channel synchronization framework for Booking.com, Agoda, MakeMyTrip, and Airbnb. Prevents double bookings and maintains uniform room rates.',
      link: '/channel-manager',
    },
    {
      icon: Globe,
      title: 'Direct Booking Engine',
      desc: 'Commission-free booking portal published at /book/[property-slug]. Provides real-time room availability, GST calculation, and Razorpay checkout.',
      link: '/booking-engine',
    },
    {
      icon: Receipt,
      title: 'Indian GST Billing & Invoicing',
      desc: 'Accurate tax breakdown (12% and 18% standard slabs), immutable invoice records stored in integer paise, support for UPI, cash, card, and print-ready invoices.',
      link: '/pricing',
    },
    {
      icon: BedDouble,
      title: 'Housekeeping & Maintenance',
      desc: 'Automated dirty room status triggers upon checkout. Assign housekeeping tasks, track priority, inspect cleanliness, and log maintenance tickets.',
      link: '/hotel-management',
    },
    {
      icon: BarChart3,
      title: 'Financial Reports & Analytics',
      desc: 'Daily collections reports, Average Daily Rate (ADR), occupancy rates, outstanding balances, and expense categorization for complete financial visibility.',
      link: '/pricing',
    },
    {
      icon: Users,
      title: 'Role-Based Staff Access',
      desc: 'Granular database permissions for Owner, Manager, Receptionist, Accountant, and Housekeeping staff with tenant isolation and audit logging.',
      link: '/hotel-management',
    },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Navbar />

      <section className="pt-16 pb-14 bg-surface-light border-b border-border-light text-center">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <span className="text-xs font-semibold uppercase tracking-wider text-brand-blue">Platform Capabilities</span>
          <h1 className="text-3xl sm:text-5xl font-extrabold text-content-primary-light mt-2 tracking-tight">
            Built for Modern Hotel Operations
          </h1>
          <p className="mt-4 text-base sm:text-lg text-content-secondary-light max-w-2xl mx-auto">
            HotelFlexi unifies front desk, reservations, revenue management, distribution, and housekeeping into one coherent operating system.
          </p>
        </div>
      </section>

      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {featureList.map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.title} className="p-7 rounded-2xl border border-border-light bg-white hover:border-brand-blue transition flex flex-col justify-between">
                  <div>
                    <div className="w-12 h-12 rounded-xl bg-blue-50 text-brand-blue flex items-center justify-center mb-5">
                      <Icon className="w-6 h-6" />
                    </div>
                    <h3 className="text-xl font-bold text-content-primary-light">{item.title}</h3>
                    <p className="mt-2.5 text-sm text-content-secondary-light leading-relaxed">{item.desc}</p>
                  </div>
                  <div className="mt-6 pt-4 border-t border-border-light">
                    <Link href={item.link} className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-blue hover:text-brand-blue-hover">
                      Learn more <ChevronRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
