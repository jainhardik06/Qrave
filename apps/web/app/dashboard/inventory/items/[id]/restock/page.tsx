'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ChevronLeft, Save, AlertCircle } from 'lucide-react';

interface InventoryItem {
  _id: string;
  name: string;
  sku: string;
  current_quantity: number;
  reorder_level: number;
  unit: string;
  cost_per_unit: number;
}

export default function RestockItemPage() {
  const router = useRouter();
  const params = useParams();
  const itemId = params.id as string;

  const [mounted, setMounted] = useState(false);
  const [item, setItem] = useState<InventoryItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [quantity, setQuantity] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (itemId) {
      fetchItem();
    }
  }, [itemId]);

  const fetchItem = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      if (!token) {
        setError('Authentication token not found');
        return;
      }

      const response = await fetch(
        `http://localhost:3001/api/inventory/items/${itemId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (!response.ok) {
        setError('Failed to fetch item');
        return;
      }

      const data = await response.json();
      setItem(data);
      setError('');
    } catch (err) {
      setError('An error occurred while fetching item');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!quantity || parseFloat(quantity) <= 0) {
      setError('Please enter a valid quantity');
      return;
    }

    if (!item) return;

    try {
      setSaving(true);
      const token = localStorage.getItem('token');
      if (!token) {
        setError('Authentication token not found');
        return;
      }

      const response = await fetch(
        `http://localhost:3001/api/inventory/items/${itemId}/restock`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            quantity: parseFloat(quantity),
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        setError(errorData.message || 'Failed to restock item');
        return;
      }

      // Refresh item data
      await fetchItem();
      setQuantity('');
      setError('');
      
      // Show success and navigate back
      setTimeout(() => {
        router.back();
      }, 1000);
    } catch (err) {
      setError('An error occurred while restocking');
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  if (!mounted) return null;

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4 md:p-8">
        <div className="max-w-2xl mx-auto text-center py-12">
          <p className="text-slate-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!item) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4 md:p-8">
        <div className="max-w-2xl mx-auto">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-slate-600 hover:text-slate-900 mb-4 transition-colors"
          >
            <ChevronLeft size={20} />
            <span className="text-sm font-medium">Back</span>
          </button>
          <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
            <p className="text-slate-600">Item not found</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4 md:p-8">
      <div className="max-w-2xl mx-auto">
        {/* Back Button */}
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-slate-600 hover:text-slate-900 mb-6 transition-colors"
        >
          <ChevronLeft size={20} />
          <span className="text-sm font-medium">Back to Items</span>
        </button>

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-slate-900">Restock Item</h1>
          <p className="text-slate-600 mt-2">Add stock to {item.name}</p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex gap-3">
            <AlertCircle className="text-red-600 flex-shrink-0" size={20} />
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {/* Item Details Card */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-6">
          <div className="grid grid-cols-2 gap-6 mb-8">
            <div>
              <p className="text-slate-600 text-sm font-medium mb-1">Item Name</p>
              <p className="text-slate-900 font-semibold">{item.name}</p>
            </div>
            <div>
              <p className="text-slate-600 text-sm font-medium mb-1">SKU</p>
              <p className="text-slate-900 font-semibold">{item.sku}</p>
            </div>
            <div>
              <p className="text-slate-600 text-sm font-medium mb-1">Current Stock</p>
              <p className="text-slate-900 font-semibold">
                {parseFloat(item.current_quantity.toString()).toFixed(2)} {item.unit}
              </p>
            </div>
            <div>
              <p className="text-slate-600 text-sm font-medium mb-1">Reorder Level</p>
              <p className="text-slate-900 font-semibold">
                {parseFloat(item.reorder_level.toString()).toFixed(2)} {item.unit}
              </p>
            </div>
            <div>
              <p className="text-slate-600 text-sm font-medium mb-1">Cost per Unit</p>
              <p className="text-slate-900 font-semibold">₹{parseFloat(item.cost_per_unit.toString()).toFixed(2)}</p>
            </div>
            <div>
              <p className="text-slate-600 text-sm font-medium mb-1">Stock Status</p>
              <span
                className={`inline-block px-3 py-1 rounded-full text-xs font-bold ${
                  item.current_quantity >= item.reorder_level
                    ? 'bg-green-50 text-green-700'
                    : 'bg-red-50 text-red-700'
                }`}
              >
                {item.current_quantity >= item.reorder_level
                  ? `● Healthy (${Math.round(
                      (item.current_quantity / item.reorder_level) * 100
                    )}% of reorder level)`
                  : `● Low Stock (${Math.round(
                      (item.current_quantity / item.reorder_level) * 100
                    )}% of reorder level)`}
              </span>
            </div>
          </div>
        </div>

        {/* Restock Form */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <h2 className="text-xl font-bold text-slate-900 mb-6">Add Stock</h2>

          <div className="mb-6">
            <label className="block text-sm font-medium text-slate-900 mb-2">
              Quantity to Add ({item.unit})
            </label>
            <input
              type="number"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              placeholder="Enter quantity"
              step="0.01"
              min="0"
              className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition"
            />
            {quantity && (
              <p className="text-sm text-slate-600 mt-2">
                New stock will be: {parseFloat(item.current_quantity.toString()).toFixed(2)} + {parseFloat(quantity).toFixed(2)} = {(item.current_quantity + parseFloat(quantity)).toFixed(2)} {item.unit}
              </p>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 justify-end">
            <button
              onClick={() => router.back()}
              className="px-6 py-3 border border-slate-300 text-slate-900 font-medium rounded-lg hover:bg-slate-50 transition"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving || !quantity}
              className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-emerald-600 to-emerald-700 text-white font-medium rounded-lg hover:from-emerald-700 hover:to-emerald-800 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Save size={18} />
              {saving ? 'Saving...' : 'Save Restock'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
