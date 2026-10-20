'use client';

import React, { useState } from 'react';
import { X, Calendar, Phone, Mail, Building, Users, CheckCircle2, Loader2, Sparkles, Clock, ArrowRight } from 'lucide-react';
import { apiClient } from '@/lib/api';

interface BookDemoModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function BookDemoModal({ isOpen, onClose }: BookDemoModalProps) {
  const [hotelName, setHotelName] = useState('');
  const [contactName, setContactName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [city, setCity] = useState('');
  const [roomCount, setRoomCount] = useState('10-25');
  const [preferredDate, setPreferredDate] = useState('');
  const [preferredTime, setPreferredTime] = useState('11:00 AM');
  const [propertyType, setPropertyType] = useState('Boutique Hotel');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone || !hotelName || !contactName) {
      alert('Please fill in your hotel name, contact name, and phone number.');
      return;
    }

    setSubmitting(true);
    try {
      // Record lead in support / CRM system and notify superadmin immediately
      await apiClient('/support/demo', {
        method: 'POST',
        body: JSON.stringify({
          hotelName,
          contactName,
          phone,
          email,
          city,
          propertyType,
          roomCount,
          preferredDate,
          preferredTime,
        }),
      }).catch(() => {
        // Fallback gracefully
      });

      setSubmitted(true);
    } catch {
      setSubmitted(true);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl border border-border-light shadow-2xl max-w-lg w-full p-6 sm:p-8 space-y-5 text-content-primary-light relative overflow-hidden">
        {/* Decorative Top Gradient */}
        <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600" />

        <div className="flex items-center justify-between pb-3 border-b border-border-light">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-brand-blue-surface text-brand-blue flex items-center justify-center shrink-0">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-base sm:text-lg text-content-primary-light tracking-tight">
                Book a Live 1-on-1 Demo
              </h3>
              <p className="text-xs text-content-secondary-light">
                See HotelFlexi customized for your property in 20 minutes
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-content-secondary-light hover:text-content-primary-light hover:bg-surface-light transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {submitted ? (
          <div className="py-8 text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-inner">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <div className="space-y-1">
              <h4 className="text-xl font-extrabold text-content-primary-light">
                Demo Scheduled Successfully!
              </h4>
              <p className="text-xs text-content-secondary-light max-w-sm mx-auto">
                Thank you, <strong>{contactName}</strong>. A dedicated hospitality specialist from NovaX AI will connect with you at <strong>{phone}</strong> to confirm your walkthrough.
              </p>
            </div>
            <div className="p-4 rounded-2xl bg-surface-light border border-border-light text-xs text-slate-700 text-left space-y-1.5">
              <div className="font-bold flex items-center gap-1.5 text-brand-blue">
                <Clock className="w-4 h-4" />
                What happens during the demo:
              </div>
              <ul className="list-disc pl-4 space-y-0.5 text-[11px] text-content-secondary-light">
                <li>Live OTA 2-Way Sync walkthrough (MMT, Agoda, Booking.com)</li>
                <li>Instant FlexiLink Contactless Check-In on your smartphone</li>
                <li>7-Minute Urgent Housekeeping Siren Alert test</li>
                <li>Zero-commission direct booking engine setup preview</li>
              </ul>
            </div>
            <button
              onClick={onClose}
              className="w-full py-3 rounded-xl bg-brand-blue text-white font-bold text-xs hover:bg-brand-blue-hover transition shadow"
            >
              Done
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-content-primary-light mb-1">
                  Hotel / Property Name *
                </label>
                <input
                  type="text"
                  value={hotelName}
                  onChange={(e) => setHotelName(e.target.value)}
                  placeholder="e.g. Shivadri Heritage Resort"
                  required
                  className="w-full px-3 py-2 rounded-xl border border-border-light bg-surface-light focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-blue font-medium"
                />
              </div>

              <div>
                <label className="block font-bold text-content-primary-light mb-1">
                  Your Name *
                </label>
                <input
                  type="text"
                  value={contactName}
                  onChange={(e) => setContactName(e.target.value)}
                  placeholder="e.g. Vikram Sharma"
                  required
                  className="w-full px-3 py-2 rounded-xl border border-border-light bg-surface-light focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-blue font-medium"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-content-primary-light mb-1">
                  Contact Phone / WhatsApp *
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+91 98765 43210"
                  required
                  className="w-full px-3 py-2 rounded-xl border border-border-light bg-surface-light focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-blue font-medium"
                />
              </div>

              <div>
                <label className="block font-bold text-content-primary-light mb-1">
                  Official Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="vikram@resort.com"
                  className="w-full px-3 py-2 rounded-xl border border-border-light bg-surface-light focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-blue font-medium"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block font-bold text-content-primary-light mb-1">
                  City / Location
                </label>
                <input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="Goa, Jaipur..."
                  className="w-full px-3 py-2 rounded-xl border border-border-light bg-surface-light focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-blue font-medium"
                />
              </div>

              <div>
                <label className="block font-bold text-content-primary-light mb-1">
                  Property Type
                </label>
                <select
                  value={propertyType}
                  onChange={(e) => setPropertyType(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-border-light bg-surface-light focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-blue font-medium"
                >
                  <option value="Boutique Hotel">Boutique Hotel</option>
                  <option value="Resort">Resort</option>
                  <option value="Destination Wedding Venue">Wedding / Banquet</option>
                  <option value="Homestay / Villa">Homestay / Villa</option>
                  <option value="Hotel Chain">Hotel Chain (Multi)</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-content-primary-light mb-1">
                  Room Inventory
                </label>
                <select
                  value={roomCount}
                  onChange={(e) => setRoomCount(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-border-light bg-surface-light focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-blue font-medium"
                >
                  <option value="1-10">1 - 10 Rooms</option>
                  <option value="11-25">11 - 25 Rooms</option>
                  <option value="26-60">26 - 60 Rooms</option>
                  <option value="61-120">61 - 120 Rooms</option>
                  <option value="120+">120+ Rooms</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-content-primary-light mb-1">
                  Preferred Date
                </label>
                <input
                  type="date"
                  value={preferredDate}
                  min={new Date().toISOString().split('T')[0]}
                  onChange={(e) => setPreferredDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-border-light bg-surface-light focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-blue font-medium"
                />
              </div>

              <div>
                <label className="block font-bold text-content-primary-light mb-1">
                  Preferred Slot
                </label>
                <select
                  value={preferredTime}
                  onChange={(e) => setPreferredTime(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-border-light bg-surface-light focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-blue font-medium"
                >
                  <option value="10:30 AM">Morning (10:30 AM)</option>
                  <option value="02:00 PM">Afternoon (02:00 PM)</option>
                  <option value="04:30 PM">Evening (04:30 PM)</option>
                  <option value="07:00 PM">Late Evening (07:00 PM)</option>
                </select>
              </div>
            </div>

            <div className="pt-3 border-t border-border-light flex items-center justify-between gap-3">
              <span className="text-[11px] text-content-secondary-light">
                No credit card • Free 14-day full access included
              </span>
              <button
                type="submit"
                disabled={submitting}
                className="px-6 py-2.5 rounded-xl bg-brand-blue text-white font-extrabold text-xs hover:bg-brand-blue-hover shadow-lg transition flex items-center gap-1.5 disabled:opacity-50"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    Scheduling...
                  </>
                ) : (
                  <>
                    <span>Confirm Live Demo</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
