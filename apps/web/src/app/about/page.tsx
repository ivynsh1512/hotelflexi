import React from 'react';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { Hotel, Shield, Sparkles, Target, Zap } from 'lucide-react';

export default function AboutPage() {
  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Navbar />

      <section className="pt-16 pb-14 bg-surface-light border-b border-border-light text-center">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <span className="text-xs font-semibold uppercase tracking-wider text-brand-blue">About Us</span>
          <h1 className="text-3xl sm:text-5xl font-extrabold text-content-primary-light mt-2 tracking-tight">
            Building the Modern Operating System for Indian Hospitality
          </h1>
          <p className="mt-4 text-base sm:text-lg text-content-secondary-light max-w-2xl mx-auto">
            HotelFlexi is created by NovaX AI to empower hoteliers, resorts, homestays, and serviced apartments with intelligent, automated operations.
          </p>
        </div>
      </section>

      <section className="py-16 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-content-primary-light">Our Mission</h2>
          <p className="text-sm text-content-secondary-light leading-relaxed">
            In India's thriving travel and tourism sector, thousands of independent hotel owners, boutique resort managers, and homestay hosts still juggle multiple disconnected platforms: one legacy offline desktop PMS, complicated channel manager dashboards, paper invoices, and manual WhatsApp notes.
          </p>
          <p className="text-sm text-content-secondary-light leading-relaxed">
            NovaX AI created HotelFlexi to replace this chaos with one unified cloud system that is fast, accessible on any smartphone or tablet, and controllable through plain language in English, Hindi, and Hinglish.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
          <div className="p-6 rounded-xl border border-border-light bg-surface-light space-y-2">
            <Zap className="w-6 h-6 text-brand-blue" />
            <h3 className="text-base font-bold text-content-primary-light">Sub-100ms Speed</h3>
            <p className="text-xs text-content-secondary-light">
              Built on Cloudflare Workers and global edge D1 database, ensuring your front desk never experiences lag.
            </p>
          </div>
          <div className="p-6 rounded-xl border border-border-light bg-surface-light space-y-2">
            <Sparkles className="w-6 h-6 text-brand-blue" />
            <h3 className="text-base font-bold text-content-primary-light">Bilingual Intelligence</h3>
            <p className="text-xs text-content-secondary-light">
              Designed from the ground up for Hindi, Hinglish, and English commands for non-technical hotel operators.
            </p>
          </div>
          <div className="p-6 rounded-xl border border-border-light bg-surface-light space-y-2">
            <Shield className="w-6 h-6 text-brand-blue" />
            <h3 className="text-base font-bold text-content-primary-light">Indian Market Native</h3>
            <p className="text-xs text-content-secondary-light">
              Native INR currency, integer paise accounting safeguards, and automatic GST slab calculations.
            </p>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
