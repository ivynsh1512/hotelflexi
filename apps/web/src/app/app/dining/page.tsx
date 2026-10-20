'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { apiClient } from '@/lib/api';
import {
  UtensilsCrossed,
  Clock,
  Plus,
  Trash2,
  CheckCircle2,
  Calendar,
  Users,
  Copy,
  ExternalLink,
  Loader2,
  Sparkles,
  DollarSign,
  Share2,
  ChevronRight,
  ShieldCheck,
  AlertCircle,
} from 'lucide-react';

export default function AppDiningPage() {
  const { currentTenant } = useAuth();
  const [activeTab, setActiveTab] = useState<'bookings' | 'menu' | 'settings'>('bookings');
  const [loading, setLoading] = useState(true);

  // Restaurant Profile
  const [restaurant, setRestaurant] = useState<any>({
    name: 'Resort Fine Dine',
    description: 'Heritage dining with authentic flavors and fine ambience.',
    cuisine_type: 'North Indian & Continental',
    is_pure_veg: 1,
    open_time: '07:30',
    close_time: '23:00',
    seating_capacity: 50,
    allow_outside_guests: 1,
  });

  // Menu Items & Bookings
  const [menu, setMenu] = useState<any[]>([]);
  const [bookings, setBookings] = useState<any[]>([]);
  const [isPureVegDetected, setIsPureVegDetected] = useState(false);

  // Add Item Modal
  const [showAddDish, setShowAddDish] = useState(false);
  const [dishName, setDishName] = useState('');
  const [dishCategory, setDishCategory] = useState('Main Course');
  const [dishPrice, setDishPrice] = useState('350');
  const [dishIsVeg, setDishIsVeg] = useState(true);
  const [dishDesc, setDishDesc] = useState('');
  const [savingDish, setSavingDish] = useState(false);

  // Saving settings
  const [savingSettings, setSavingSettings] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  const hotelCode = currentTenant?.tenant_id ? (currentTenant as any).hotel_code || '58291' : '58291';
  const dineOutPublicUrl = `https://hotelflexi.novaxai.in/dine/${currentTenant?.tenant_slug || hotelCode}`;

  const fetchData = async () => {
    if (!currentTenant) return;
    setLoading(true);
    try {
      const [restRes, menuRes, bookingsRes] = await Promise.all([
        apiClient('/dining/restaurant').catch(() => ({ restaurant: null })),
        apiClient('/dining/menu').catch(() => ({ menu: [], is_pure_veg: 0 })),
        apiClient('/dining/bookings').catch(() => ({ bookings: [] })),
      ]);

      if (restRes.restaurant) {
        setRestaurant(restRes.restaurant);
      }
      setMenu(menuRes.menu || []);
      setIsPureVegDetected(menuRes.is_pure_veg === 1);
      setBookings(bookingsRes.bookings || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [currentTenant]);

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingSettings(true);
    try {
      await apiClient('/dining/restaurant', {
        method: 'POST',
        body: JSON.stringify(restaurant),
      });
      alert('Restaurant settings updated successfully!');
      fetchData();
    } catch (err) {
      alert('Failed to update restaurant settings.');
    } finally {
      setSavingSettings(false);
    }
  };

  const handleAddDish = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dishName || !dishPrice) return;
    setSavingDish(true);
    try {
      await apiClient('/dining/menu', {
        method: 'POST',
        body: JSON.stringify({
          name: dishName,
          category: dishCategory,
          price_paise: Math.round(parseFloat(dishPrice) * 100),
          is_veg: dishIsVeg ? 1 : 0,
          description: dishDesc,
        }),
      });
      setShowAddDish(false);
      setDishName('');
      setDishPrice('350');
      setDishDesc('');
      fetchData();
    } catch (err: any) {
      alert(err.message || 'Failed to save dish.');
    } finally {
      setSavingDish(false);
    }
  };

  const handleDeleteDish = async (id: string) => {
    if (!confirm('Are you sure you want to remove this dish?')) return;
    try {
      await apiClient(`/dining/menu/${id}`, { method: 'DELETE' });
      fetchData();
    } catch (err) {
      alert('Failed to delete dish.');
    }
  };

  const handleUpdateBookingStatus = async (id: string, status: string) => {
    try {
      await apiClient(`/dining/bookings/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      });
      setBookings((prev) =>
        prev.map((b) => (b.id === id ? { ...b, booking_status: status } : b))
      );
    } catch (err) {
      alert('Failed to update booking status.');
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(dineOutPublicUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-border-light gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-black text-content-primary-light">
              Dine-Out &amp; Restaurant Operations
            </h1>
            {(restaurant.is_pure_veg === 1 || isPureVegDetected) && (
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-black uppercase tracking-wider border border-emerald-200">
                🟢 100% Pure Veg Certified
              </span>
            )}
          </div>
          <p className="text-xs text-content-secondary-light mt-0.5">
            Allow in-house residents and guests from other resorts to book tables and dine at your property.
          </p>
        </div>

        {/* Shareable Link Box */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleCopy}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-900 font-bold text-xs transition shadow-sm"
          >
            <Copy className="w-3.5 h-3.5" />
            {copiedLink ? 'Copied Link!' : 'Copy Guest Dine Link'}
          </button>
          <a
            href={dineOutPublicUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition shadow-sm"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            Preview Dine Portal
          </a>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-border-light pb-2">
        <button
          onClick={() => setActiveTab('bookings')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
            activeTab === 'bookings'
              ? 'bg-amber-600 text-white shadow'
              : 'text-content-secondary-light hover:bg-surface-light'
          }`}
        >
          <UtensilsCrossed className="w-4 h-4" />
          Table Bookings ({bookings.length})
        </button>
        <button
          onClick={() => setActiveTab('menu')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
            activeTab === 'menu'
              ? 'bg-amber-600 text-white shadow'
              : 'text-content-secondary-light hover:bg-surface-light'
          }`}
        >
          <Sparkles className="w-4 h-4" />
          Menu Management ({menu.length} Dishes)
        </button>
        <button
          onClick={() => setActiveTab('settings')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
            activeTab === 'settings'
              ? 'bg-amber-600 text-white shadow'
              : 'text-content-secondary-light hover:bg-surface-light'
          }`}
        >
          <Clock className="w-4 h-4" />
          Restaurant Profile &amp; Timings
        </button>
      </div>

      {/* TAB 1: TABLE BOOKINGS */}
      {activeTab === 'bookings' && (
        <div className="space-y-4">
          {bookings.length === 0 ? (
            <div className="p-12 text-center bg-white rounded-3xl border border-border-light space-y-3">
              <UtensilsCrossed className="w-10 h-10 text-slate-300 mx-auto" />
              <h3 className="text-base font-bold text-slate-900">No Dine-Out Bookings Yet</h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                Share your Dine-Out booking link with nearby resorts, tour operators, or place your table QR code at the front desk.
              </p>
              <button
                onClick={handleCopy}
                className="px-4 py-2 rounded-xl bg-amber-600 text-white font-bold text-xs hover:bg-amber-700 transition"
              >
                Copy Guest Dine-Out Link
              </button>
            </div>
          ) : (
            <div className="bg-white rounded-3xl border border-border-light overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-border-light text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                    <tr>
                      <th className="py-3 px-4">Booking #</th>
                      <th className="py-3 px-4">Guest Details</th>
                      <th className="py-3 px-4">Origin / Stay Location</th>
                      <th className="py-3 px-4">Date &amp; Time</th>
                      <th className="py-3 px-4">Guests</th>
                      <th className="py-3 px-4">Payment</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border-light">
                    {bookings.map((b) => (
                      <tr key={b.id} className="hover:bg-slate-50 transition">
                        <td className="py-3 px-4 font-mono font-bold text-slate-900">
                          {b.booking_number}
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-bold text-slate-900">{b.guest_name}</div>
                          <div className="text-[11px] text-slate-500">{b.guest_phone}</div>
                        </td>
                        <td className="py-3 px-4">
                          {b.is_inhouse_guest ? (
                            <span className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-800 text-[10px] font-bold">
                              In-House Resident
                            </span>
                          ) : b.residing_hotel_name ? (
                            <span className="px-2 py-0.5 rounded-full bg-amber-50 text-amber-900 text-[10px] font-bold border border-amber-200">
                              Staying at: {b.residing_hotel_name}
                            </span>
                          ) : (
                            <span className="text-slate-500 text-[11px]">Outside Visitor</span>
                          )}
                        </td>
                        <td className="py-3 px-4 font-mono font-medium">
                          {b.booking_date} @ {b.booking_time}
                        </td>
                        <td className="py-3 px-4 font-bold text-slate-900">
                          {b.guests_count} Guests
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              b.payment_status === 'paid'
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-slate-100 text-slate-700'
                            }`}
                          >
                            {b.payment_method === 'pay_online' ? 'Paid Online' : 'Pay at Counter'}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                              b.booking_status === 'seated'
                                ? 'bg-purple-100 text-purple-800'
                                : b.booking_status === 'completed'
                                ? 'bg-emerald-100 text-emerald-800'
                                : b.booking_status === 'cancelled'
                                ? 'bg-red-100 text-red-800'
                                : 'bg-blue-100 text-blue-800'
                            }`}
                          >
                            {b.booking_status}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right space-x-1">
                          {b.booking_status === 'confirmed' && (
                            <button
                              onClick={() => handleUpdateBookingStatus(b.id, 'seated')}
                              className="px-2.5 py-1 rounded-lg bg-purple-600 text-white text-[10px] font-bold hover:bg-purple-700 transition"
                            >
                              Seat Guests
                            </button>
                          )}
                          {b.booking_status === 'seated' && (
                            <button
                              onClick={() => handleUpdateBookingStatus(b.id, 'completed')}
                              className="px-2.5 py-1 rounded-lg bg-emerald-600 text-white text-[10px] font-bold hover:bg-emerald-700 transition"
                            >
                              Complete / Billed
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: MENU DISHES */}
      {activeTab === 'menu' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-700">
              Dishes displayed on guest Dine-Out booking portal
            </span>
            <button
              onClick={() => setShowAddDish(true)}
              className="px-4 py-2 rounded-xl bg-amber-600 text-white font-bold text-xs hover:bg-amber-700 transition shadow flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              Add Menu Dish
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {menu.map((dish) => (
              <div
                key={dish.id}
                className="p-4 rounded-2xl bg-white border border-border-light shadow-sm flex items-start justify-between gap-3 group hover:border-slate-300 transition"
              >
                <div className="space-y-1 flex-1">
                  <div className="flex items-center gap-2">
                    <span
                      className={`w-3 h-3 rounded-full border flex items-center justify-center shrink-0 ${
                        dish.is_veg === 1 ? 'border-emerald-600' : 'border-red-600'
                      }`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          dish.is_veg === 1 ? 'bg-emerald-600' : 'bg-red-600'
                        }`}
                      />
                    </span>
                    <h4 className="text-xs font-bold text-slate-900">{dish.name}</h4>
                  </div>
                  <div className="text-[10px] text-amber-700 font-bold uppercase">{dish.category}</div>
                  {dish.description && (
                    <p className="text-[11px] text-slate-500 line-clamp-2">{dish.description}</p>
                  )}
                  <div className="text-xs font-black text-slate-900 mt-2">
                    ₹{(dish.price_paise / 100).toLocaleString('en-IN')}
                  </div>
                </div>

                <button
                  onClick={() => handleDeleteDish(dish.id)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: RESTAURANT PROFILE & TIMINGS */}
      {activeTab === 'settings' && (
        <form onSubmit={handleSaveSettings} className="bg-white rounded-3xl p-6 border border-border-light shadow-sm max-w-2xl space-y-5">
          <h2 className="text-base font-black text-slate-900 pb-2 border-b border-border-light flex items-center gap-2">
            <Clock className="w-4 h-4 text-amber-600" />
            Restaurant Details &amp; Operational Timings
          </h2>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Restaurant Name</label>
            <input
              type="text"
              value={restaurant.name}
              onChange={(e) => setRestaurant({ ...restaurant, name: e.target.value })}
              className="w-full text-xs font-medium p-3 rounded-xl border border-border-light focus:outline-none focus:ring-2 focus:ring-amber-500"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Cuisine Style</label>
            <input
              type="text"
              value={restaurant.cuisine_type}
              onChange={(e) => setRestaurant({ ...restaurant, cuisine_type: e.target.value })}
              placeholder="e.g. North Indian, Royal Mughlai, Awadhi, Continental"
              className="w-full text-xs font-medium p-3 rounded-xl border border-border-light focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Daily Opening Time</label>
              <input
                type="time"
                value={restaurant.open_time}
                onChange={(e) => setRestaurant({ ...restaurant, open_time: e.target.value })}
                className="w-full text-xs font-medium p-2.5 rounded-xl border border-border-light focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Daily Closing Time</label>
              <input
                type="time"
                value={restaurant.close_time}
                onChange={(e) => setRestaurant({ ...restaurant, close_time: e.target.value })}
                className="w-full text-xs font-medium p-2.5 rounded-xl border border-border-light focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Seating Capacity</label>
              <input
                type="number"
                value={restaurant.seating_capacity}
                onChange={(e) => setRestaurant({ ...restaurant, seating_capacity: Number(e.target.value) })}
                className="w-full text-xs font-medium p-2.5 rounded-xl border border-border-light focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>
            <div className="pt-6">
              <label className="flex items-center gap-2 text-xs font-bold text-slate-800 cursor-pointer">
                <input
                  type="checkbox"
                  checked={restaurant.is_pure_veg === 1}
                  onChange={(e) => setRestaurant({ ...restaurant, is_pure_veg: e.target.checked ? 1 : 0 })}
                  className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4"
                />
                <span>100% Pure Vegetarian Restaurant</span>
              </label>
            </div>
          </div>

          <div>
            <label className="flex items-center gap-2 text-xs font-bold text-slate-800 cursor-pointer">
              <input
                type="checkbox"
                checked={restaurant.allow_outside_guests === 1}
                onChange={(e) => setRestaurant({ ...restaurant, allow_outside_guests: e.target.checked ? 1 : 0 })}
                className="rounded text-amber-600 focus:ring-amber-500 w-4 h-4"
              />
              <span>Allow Outside Guests (Staying at other resorts) to book tables</span>
            </label>
          </div>

          <button
            type="submit"
            disabled={savingSettings}
            className="px-6 py-3 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs transition shadow flex items-center gap-2 disabled:opacity-50"
          >
            {savingSettings && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            Save Restaurant Configuration
          </button>
        </form>
      )}

      {/* Add Dish Modal */}
      {showAddDish && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <h3 className="text-base font-black text-slate-900 pb-2 border-b border-border-light">
              Add New Menu Item
            </h3>
            <form onSubmit={handleAddDish} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Dish Name</label>
                <input
                  type="text"
                  placeholder="e.g. Paneer Tikka Masala"
                  value={dishName}
                  onChange={(e) => setDishName(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-xl border border-border-light focus:outline-none focus:ring-2 focus:ring-amber-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Category</label>
                  <select
                    value={dishCategory}
                    onChange={(e) => setDishCategory(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-xl border border-border-light bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                  >
                    <option value="Starters">Starters</option>
                    <option value="Main Course">Main Course</option>
                    <option value="Breads & Rice">Breads &amp; Rice</option>
                    <option value="Desserts">Desserts</option>
                    <option value="Beverages">Beverages</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Price (₹ INR)</label>
                  <input
                    type="number"
                    value={dishPrice}
                    onChange={(e) => setDishPrice(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-xl border border-border-light focus:outline-none focus:ring-2 focus:ring-amber-500"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="flex items-center gap-2 text-xs font-bold text-slate-800 cursor-pointer pt-1">
                  <input
                    type="checkbox"
                    checked={dishIsVeg}
                    onChange={(e) => setDishIsVeg(e.target.checked)}
                    className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4"
                  />
                  <span>Vegetarian Dish</span>
                </label>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Short Description</label>
                <textarea
                  placeholder="Ingredients, preparation, flavor notes..."
                  value={dishDesc}
                  onChange={(e) => setDishDesc(e.target.value)}
                  rows={2}
                  className="w-full text-xs p-2.5 rounded-xl border border-border-light focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddDish(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingDish}
                  className="px-5 py-2 rounded-xl bg-amber-600 text-white font-bold text-xs hover:bg-amber-700 transition"
                >
                  {savingDish ? 'Saving...' : 'Add Dish'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
