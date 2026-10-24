'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { apiClient } from '@/lib/api';
import {
  UtensilsCrossed,
  AlertTriangle,
  Package,
  TrendingUp,
  Plus,
  RefreshCw,
  Loader2,
  Calendar,
  DollarSign,
  CheckCircle2,
  ShoppingCart,
  FileText,
  Search,
  X,
} from 'lucide-react';

interface FoodItem {
  id: string;
  name: string;
  category: string;
  current_stock: number;
  unit: string;
  min_par_level: number;
  estimated_unit_cost_paise: number;
  updated_at: number;
}

interface RecipeRule {
  id: string;
  item_name: string;
  meal_type: string;
  grams_per_guest: number;
  unit: string;
}

interface ShortageAlert {
  itemId: string;
  itemName: string;
  currentStock: number;
  requiredAmount: number;
  shortage: number;
  unit: string;
  urgency: 'critical' | 'warning';
}

interface ForecastData {
  days: number;
  totalGuestDays: number;
  forecastDays: Array<{ date: string; confirmedGuests: number; estimatedMeals: { breakfast: number; lunch: number; dinner: number } }>;
  shortageAlerts: ShortageAlert[];
  aggregatedRequirements: Array<{ itemId: string; itemName: string; unit: string; totalGramsRequired: number; currentStock: number; shortageGrams: number }>;
}

export default function FoodProcurementPage() {
  const { currentTenant } = useAuth();
  const [loading, setLoading] = useState(true);
  const [propertyId, setPropertyId] = useState('');
  const [activeTab, setActiveTab] = useState<'forecast' | 'inventory' | 'recipes' | 'orders'>('forecast');

  // Data states
  const [items, setItems] = useState<FoodItem[]>([]);
  const [recipes, setRecipes] = useState<RecipeRule[]>([]);
  const [forecast, setForecast] = useState<ForecastData | null>(null);
  const [orders, setOrders] = useState<any[]>([]);

  // Search filter
  const [searchQuery, setSearchQuery] = useState('');

  // Modals
  const [showItemModal, setShowItemModal] = useState(false);
  const [showRecipeModal, setShowRecipeModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // New item form
  const [itemName, setItemName] = useState('');
  const [itemCategory, setItemCategory] = useState('vegetables');
  const [itemStock, setItemStock] = useState('10');
  const [itemUnit, setItemUnit] = useState('kg');
  const [itemPar, setItemPar] = useState('5');
  const [itemCost, setItemCost] = useState('40');

  // New recipe form
  const [recipeMeal, setRecipeMeal] = useState('dinner');
  const [recipeItemId, setRecipeItemId] = useState('');
  const [recipeGrams, setRecipeGrams] = useState('250');

  const loadData = useCallback(async () => {
    if (!currentTenant) return;
    setLoading(true);
    try {
      const propData = await apiClient('/properties');
      const activeProp = propData.properties?.[0];
      if (!activeProp) {
        setLoading(false);
        return;
      }
      setPropertyId(activeProp.id);

      const [itemsRes, recipesRes, forecastRes, ordersRes] = await Promise.all([
        apiClient(`/food/items?propertyId=${activeProp.id}`).catch(() => ({ items: [] })),
        apiClient(`/food/recipes?propertyId=${activeProp.id}`).catch(() => ({ recipes: [] })),
        apiClient(`/food/forecast?propertyId=${activeProp.id}&days=7`).catch(() => null),
        apiClient(`/food/orders?propertyId=${activeProp.id}`).catch(() => ({ orders: [] })),
      ]);

      setItems(itemsRes.items || []);
      setRecipes(recipesRes.recipes || []);
      if (forecastRes) setForecast(forecastRes);
      setOrders(ordersRes.orders || []);
    } catch (e) {
      console.error('Failed to load food procurement data:', e);
    } finally {
      setLoading(false);
    }
  }, [currentTenant]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (showItemModal) setShowItemModal(false);
        if (showRecipeModal) setShowRecipeModal(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showItemModal, showRecipeModal]);

  const handleCreateItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!propertyId || !itemName.trim()) return;
    setSubmitting(true);
    try {
      await apiClient('/food/items', {
        method: 'POST',
        body: JSON.stringify({
          propertyId,
          name: itemName.trim(),
          category: itemCategory,
          currentStock: parseFloat(itemStock) || 0,
          unit: itemUnit,
          minParLevel: parseFloat(itemPar) || 0,
          estimatedUnitCostPaise: Math.round((parseFloat(itemCost) || 0) * 100),
        }),
      });
      setShowItemModal(false);
      setItemName('');
      loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to create food item');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCreateRecipe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!propertyId || !recipeItemId) return;
    setSubmitting(true);
    try {
      await apiClient('/food/recipes', {
        method: 'POST',
        body: JSON.stringify({
          propertyId,
          mealType: recipeMeal,
          itemId: recipeItemId,
          gramsPerGuest: parseFloat(recipeGrams) || 100,
          unit: 'g',
        }),
      });
      setShowRecipeModal(false);
      loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to save recipe rule');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateStock = async (itemId: string, newStock: number) => {
    try {
      await apiClient(`/food/items/${itemId}/stock`, {
        method: 'PATCH',
        body: JSON.stringify({ currentStock: newStock }),
      });
      setItems((prev) =>
        prev.map((it) => (it.id === itemId ? { ...it, current_stock: newStock } : it))
      );
    } catch (err: any) {
      alert(err.message || 'Failed to update stock');
    }
  };

  const filteredItems = items.filter((it) =>
    it.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    it.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center border border-amber-200">
              <UtensilsCrossed className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                Food Procurement &amp; Rasan
              </h1>
              <p className="text-xs text-slate-500 font-medium">
                Pantry inventory, standard recipe cover forecasting, and purchase orders (Parcha).
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => loadData()}
            className="p-2 text-slate-600 hover:text-slate-900 border border-slate-200 rounded-lg hover:bg-slate-50 transition"
            title="Refresh Data"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={() => setShowRecipeModal(true)}
            className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-xl transition flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" /> Set Consumption Norm
          </button>
          <button
            onClick={() => setShowItemModal(true)}
            className="px-4 py-2 bg-brand-blue hover:bg-brand-blue-hover text-white text-xs font-bold rounded-xl transition shadow flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" /> Add Pantry Item
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
            <span>Pantry Items</span>
            <Package className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-2xl font-black text-slate-900">{items.length}</div>
          <p className="text-[11px] text-slate-500">Tracked raw ingredients</p>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
            <span>Shortage Alerts</span>
            <AlertTriangle className={`w-4 h-4 ${forecast?.shortageAlerts?.length ? 'text-rose-500' : 'text-emerald-500'}`} />
          </div>
          <div className={`text-2xl font-black ${forecast?.shortageAlerts?.length ? 'text-rose-600' : 'text-emerald-600'}`}>
            {forecast?.shortageAlerts?.length || 0}
          </div>
          <p className="text-[11px] text-slate-500">
            {forecast?.shortageAlerts?.length ? 'Ingredients below 7-day cover' : 'All stock safely covered'}
          </p>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
            <span>7-Day Guest Covers</span>
            <Calendar className="w-4 h-4 text-brand-blue" />
          </div>
          <div className="text-2xl font-black text-brand-blue">
            {forecast?.totalGuestDays || 0}
          </div>
          <p className="text-[11px] text-slate-500">Expected guest-days next week</p>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
            <span>Purchase Orders</span>
            <ShoppingCart className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="text-2xl font-black text-slate-900">{orders.length}</div>
          <p className="text-[11px] text-slate-500">Vendor parchay &amp; receipts</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 gap-6 text-xs font-bold">
        {[
          { id: 'forecast', label: '7-Day Demand & Shortages' },
          { id: 'inventory', label: `Pantry Stock (${items.length})` },
          { id: 'recipes', label: `Recipe Norms (${recipes.length})` },
          { id: 'orders', label: `Purchase Orders (${orders.length})` },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`pb-3 border-b-2 transition ${
              activeTab === tab.id
                ? 'border-brand-blue text-brand-blue'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* TAB 1: 7-DAY FORECAST & SHORTAGES */}
      {activeTab === 'forecast' && (
        <div className="space-y-4">
          {forecast?.shortageAlerts && forecast.shortageAlerts.length > 0 && (
            <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl space-y-3">
              <div className="flex items-center gap-2 text-rose-900 font-bold text-sm">
                <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
                <span>Shortage Warning: Kitchen will run out of stock for {forecast.shortageAlerts.length} ingredients!</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {forecast.shortageAlerts.map((sh, idx) => (
                  <div key={idx} className="p-3 bg-white rounded-xl border border-rose-200 shadow-xs space-y-1">
                    <div className="font-bold text-xs text-slate-900 flex justify-between">
                      <span>{sh.itemName}</span>
                      <span className="text-rose-600 font-extrabold">Need +{sh.shortage} {sh.unit}</span>
                    </div>
                    <div className="text-[11px] text-slate-500 flex justify-between">
                      <span>Current: {sh.currentStock} {sh.unit}</span>
                      <span>Demand: {sh.requiredAmount} {sh.unit}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Forward Covers Daily Breakdown */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
            <h3 className="font-bold text-sm text-slate-900">Forward Covers Schedule (Based on Active Bookings)</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
              {forecast?.forecastDays?.map((fDay, idx) => (
                <div key={idx} className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-center space-y-1">
                  <span className="text-[11px] font-bold text-slate-500">
                    {new Date(fDay.date).toLocaleDateString('en-IN', { weekday: 'short', month: 'short', day: 'numeric' })}
                  </span>
                  <div className="text-lg font-black text-slate-900">{fDay.confirmedGuests}</div>
                  <span className="text-[10px] text-slate-500 block">Guests</span>
                  <div className="pt-1 text-[9px] text-slate-400 border-t border-slate-200">
                    B: {fDay.estimatedMeals.breakfast} | L: {fDay.estimatedMeals.lunch} | D: {fDay.estimatedMeals.dinner}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: PANTRY INVENTORY ITEMS */}
      {activeTab === 'inventory' && (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm space-y-3 p-4">
          <div className="flex items-center gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search raw ingredients (e.g. Atta, Potato, Paneer, Milk)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-1 focus:ring-brand-blue"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-bold border-y border-slate-200">
                <tr>
                  <th className="py-2.5 px-3">Item Name</th>
                  <th className="py-2.5 px-3">Category</th>
                  <th className="py-2.5 px-3">Current Stock</th>
                  <th className="py-2.5 px-3">Min Par</th>
                  <th className="py-2.5 px-3">Est. Rate</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3 text-right">Quick Update</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredItems.map((item) => {
                  const isLow = item.current_stock <= item.min_par_level;
                  return (
                    <tr key={item.id} className="hover:bg-slate-50/50">
                      <td className="py-3 px-3 font-bold text-slate-900">{item.name}</td>
                      <td className="py-3 px-3 text-slate-500 capitalize">{item.category}</td>
                      <td className="py-3 px-3 font-bold text-slate-900">
                        {item.current_stock} {item.unit}
                      </td>
                      <td className="py-3 px-3 text-slate-500">
                        {item.min_par_level} {item.unit}
                      </td>
                      <td className="py-3 px-3 text-slate-600">
                        ₹{(item.estimated_unit_cost_paise / 100).toFixed(0)}/{item.unit}
                      </td>
                      <td className="py-3 px-3">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          isLow ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-700'
                        }`}>
                          {isLow ? 'Low Stock' : 'Covered'}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right">
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            onClick={() => handleUpdateStock(item.id, Math.max(0, item.current_stock - 5))}
                            className="px-2 py-0.5 bg-slate-100 hover:bg-slate-200 rounded text-slate-700 font-bold"
                          >
                            -5
                          </button>
                          <button
                            onClick={() => handleUpdateStock(item.id, item.current_stock + 10)}
                            className="px-2 py-0.5 bg-slate-100 hover:bg-slate-200 rounded text-slate-700 font-bold"
                          >
                            +10
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: RECIPES */}
      {activeTab === 'recipes' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-sm text-slate-900">Consumption Standard Rules (Per Guest / Meal)</h3>
            <button
              onClick={() => setShowRecipeModal(true)}
              className="px-3 py-1.5 bg-brand-blue text-white font-bold text-xs rounded-xl"
            >
              + Add Rule
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {recipes.map((rc) => (
              <div key={rc.id} className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider block">
                  {rc.meal_type}
                </span>
                <div className="font-bold text-xs text-slate-900">{rc.item_name}</div>
                <div className="text-[11px] text-brand-blue font-semibold">
                  {rc.grams_per_guest} {rc.unit} / guest
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: ORDERS */}
      {activeTab === 'orders' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
          <h3 className="font-bold text-sm text-slate-900">Procurement Orders (Kaccha/Pakka Parcha)</h3>
          {orders.length === 0 ? (
            <p className="text-xs text-slate-500 py-6 text-center">
              No purchase orders created yet. Once created, orders will be tracked here.
            </p>
          ) : (
            <div className="divide-y divide-slate-100">
              {orders.map((ord) => (
                <div key={ord.id} className="py-3 flex items-center justify-between">
                  <div>
                    <span className="font-bold text-xs text-slate-900">{ord.po_number}</span>
                    <p className="text-[11px] text-slate-500">{ord.supplier_name || 'Local Mandi Vendor'}</p>
                  </div>
                  <div className="text-right">
                    <span className="font-bold text-xs text-slate-900">₹{(ord.total_cost_paise / 100).toLocaleString('en-IN')}</span>
                    <span className="block text-[10px] text-emerald-600 font-semibold capitalize">{ord.status}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ADD ITEM MODAL */}
      {showItemModal && (
        <div
          onClick={() => setShowItemModal(false)}
          className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4 backdrop-blur-xs"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="add-item-modal-title"
            className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl"
          >
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 id="add-item-modal-title" className="font-bold text-base text-slate-900">Add Pantry Ingredient</h3>
              <button
                type="button"
                onClick={() => setShowItemModal(false)}
                aria-label="Close dialog"
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCreateItem} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Item Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Basmati Rice, Potatoes, Milk, Chicken"
                  value={itemName}
                  onChange={(e) => setItemName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-1 focus:ring-brand-blue"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Category</label>
                  <select
                    value={itemCategory}
                    onChange={(e) => setItemCategory(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200"
                  >
                    <option value="grains">Grains &amp; Atta</option>
                    <option value="vegetables">Vegetables</option>
                    <option value="dairy">Dairy &amp; Paneer</option>
                    <option value="spices">Spices &amp; Oil</option>
                    <option value="poultry">Poultry &amp; Meat</option>
                    <option value="beverages">Tea &amp; Beverages</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Unit</label>
                  <select
                    value={itemUnit}
                    onChange={(e) => setItemUnit(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200"
                  >
                    <option value="kg">kg</option>
                    <option value="liter">liter</option>
                    <option value="packet">packet</option>
                    <option value="pcs">pcs</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Current Stock</label>
                  <input
                    type="number"
                    value={itemStock}
                    onChange={(e) => setItemStock(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Min Par</label>
                  <input
                    type="number"
                    value={itemPar}
                    onChange={(e) => setItemPar(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Cost/Unit (₹)</label>
                  <input
                    type="number"
                    value={itemCost}
                    onChange={(e) => setItemCost(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowItemModal(false)}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-slate-700 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-brand-blue text-white rounded-xl font-bold"
                >
                  {submitting ? 'Saving...' : 'Add Ingredient'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ADD RECIPE RULE MODAL */}
      {showRecipeModal && (
        <div
          onClick={() => setShowRecipeModal(false)}
          className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4 backdrop-blur-xs"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="recipe-rule-modal-title"
            className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl"
          >
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 id="recipe-rule-modal-title" className="font-bold text-base text-slate-900">Set Consumption Standard</h3>
              <button
                type="button"
                onClick={() => setShowRecipeModal(false)}
                aria-label="Close dialog"
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCreateRecipe} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Select Meal</label>
                <select
                  value={recipeMeal}
                  onChange={(e) => setRecipeMeal(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200"
                >
                  <option value="breakfast">Breakfast</option>
                  <option value="lunch">Lunch</option>
                  <option value="dinner">Dinner</option>
                  <option value="high_tea">High Tea / Snacks</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Pantry Ingredient</label>
                <select
                  value={recipeItemId}
                  onChange={(e) => setRecipeItemId(e.target.value)}
                  required
                  className="w-full px-3 py-2 rounded-xl border border-slate-200"
                >
                  <option value="">-- Choose Ingredient --</option>
                  {items.map((it) => (
                    <option key={it.id} value={it.id}>
                      {it.name} ({it.category})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Standard Grams / Guest</label>
                <input
                  type="number"
                  required
                  value={recipeGrams}
                  onChange={(e) => setRecipeGrams(e.target.value)}
                  placeholder="e.g. 250 for 250g potatoes"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowRecipeModal(false)}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-slate-700 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-brand-blue text-white rounded-xl font-bold"
                >
                  {submitting ? 'Saving...' : 'Save Standard'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
