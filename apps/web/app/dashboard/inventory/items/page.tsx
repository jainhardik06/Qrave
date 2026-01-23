'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';

interface InventoryItem {
  _id: string;
  name: string;
  sku: string;
  unit: string;
  cost_per_unit: number;
  current_quantity: number;
  reorder_level: number;
  category?: string;
  is_active: boolean;
}

export default function InventoryItemsPage() {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [filteredItems, setFilteredItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedItem, setExpandedItem] = useState<string | null>(null);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [form, setForm] = useState<Partial<InventoryItem>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchItems();
  }, []);

  useEffect(() => {
    if (searchQuery) {
      setFilteredItems(
        items.filter(
          (item) =>
            item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            item.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (item.category?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false),
        ),
      );
    } else {
      setFilteredItems(items);
    }
  }, [searchQuery, items]);

  const fetchItems = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/inventory/items');
      setItems(response.data);
      setFilteredItems(response.data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch inventory items');
    } finally {
      setLoading(false);
    }
  };

  const deleteItem = async (id: string) => {
    if (!confirm('Are you sure you want to deactivate this item?')) return;

    try {
      await axios.delete(`/api/inventory/items/${id}`);
      setItems(items.filter((item) => item._id !== id));
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to delete item');
    }
  };

  const startEdit = (item: InventoryItem) => {
    setEditingItem(item);
    setForm({ ...item });
  };

  const resetEdit = () => {
    if (editingItem) setForm({ ...editingItem });
  };

  const handleFormChange = (key: keyof InventoryItem, value: string | number | boolean) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const saveItem = async () => {
    if (!editingItem) return;
    setSaving(true);
    try {
      const payload = {
        name: form.name,
        sku: form.sku,
        unit: form.unit,
        cost_per_unit: Number(form.cost_per_unit) || 0,
        current_quantity: Number(form.current_quantity) || 0,
        reorder_level: Number(form.reorder_level) || 0,
        category: form.category,
        is_active: form.is_active,
      };

      const { data } = await axios.patch(`/api/inventory/items/${editingItem._id}`, payload);

      setItems((prev) => prev.map((it) => (it._id === editingItem._id ? data : it)));
      setFilteredItems((prev) => prev.map((it) => (it._id === editingItem._id ? data : it)));
      setEditingItem(null);
      setForm({});
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update item');
    } finally {
      setSaving(false);
    }
  };

  const isLowStock = (item: InventoryItem) => item.current_quantity <= item.reorder_level;
  const totalValue = filteredItems.reduce((sum, item) => sum + item.current_quantity * item.cost_per_unit, 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-gray-600">Loading inventory items...</div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Inventory Items</h1>
          <p className="text-gray-600 mt-1">
            Total Items: {filteredItems.length} | Total Value: ₹{totalValue.toFixed(2)}
          </p>
        </div>
        <a
          href="/dashboard/inventory/items/new"
          className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg transition"
        >
          + Add Item
        </a>
      </div>

      {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">{error}</div>}

      {/* Search Bar */}
      <div className="mb-6">
        <input
          type="text"
          placeholder="Search by name, SKU, or category..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
        />
      </div>

      {filteredItems.length === 0 ? (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
          <p className="text-gray-600 mb-4">{searchQuery ? 'No items match your search' : 'No inventory items yet'}</p>
          <a href="/dashboard/inventory/items/new" className="text-orange-500 hover:text-orange-600 font-medium">
            Create your first item
          </a>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Item</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">SKU</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Unit</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Current Stock</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Cost/Unit</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Status</th>
                  <th className="px-6 py-3 text-right text-sm font-semibold text-gray-900">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredItems.map((item) => (
                  <tr key={item._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-medium text-gray-900">{item.name}</p>
                        <p className="text-sm text-gray-600">{item.category}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">{item.sku}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{item.unit}</td>
                    <td className="px-6 py-4">
                      <div className="text-sm">
                        <p className="font-medium text-gray-900">{item.current_quantity}</p>
                        <p className="text-gray-600">Reorder: {item.reorder_level}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">₹{item.cost_per_unit.toFixed(2)}</td>
                    <td className="px-6 py-4 text-sm">
                      {isLowStock(item) ? (
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                          Low Stock
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          In Stock
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            startEdit(item);
                          }}
                          className="text-blue-500 hover:text-blue-700 text-sm font-medium"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => deleteItem(item._id)}
                          className="text-red-500 hover:text-red-700 text-sm font-medium"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {editingItem && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl p-6 border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900">Edit Item</h2>
              <button
                onClick={() => {
                  setEditingItem(null);
                  setForm({});
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>

            {error && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                {error}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Name</label>
                <input
                  value={form.name || ''}
                  onChange={(e) => handleFormChange('name', e.target.value)}
                  className="mt-1 w-full rounded border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">SKU</label>
                <input
                  value={form.sku || ''}
                  onChange={(e) => handleFormChange('sku', e.target.value)}
                  className="mt-1 w-full rounded border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Unit</label>
                <input
                  value={form.unit || ''}
                  onChange={(e) => handleFormChange('unit', e.target.value)}
                  className="mt-1 w-full rounded border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Cost per Unit</label>
                <input
                  type="number"
                  step="0.01"
                  value={form.cost_per_unit ?? ''}
                  onChange={(e) => handleFormChange('cost_per_unit', parseFloat(e.target.value))}
                  className="mt-1 w-full rounded border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Current Quantity</label>
                <input
                  type="number"
                  step="0.01"
                  value={form.current_quantity ?? ''}
                  onChange={(e) => handleFormChange('current_quantity', parseFloat(e.target.value))}
                  className="mt-1 w-full rounded border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Reorder Level</label>
                <input
                  type="number"
                  step="0.01"
                  value={form.reorder_level ?? ''}
                  onChange={(e) => handleFormChange('reorder_level', parseFloat(e.target.value))}
                  className="mt-1 w-full rounded border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Category</label>
                <input
                  value={form.category || ''}
                  onChange={(e) => handleFormChange('category', e.target.value)}
                  className="mt-1 w-full rounded border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>
              <div className="flex items-center gap-2 mt-6">
                <input
                  type="checkbox"
                  checked={form.is_active ?? true}
                  onChange={(e) => handleFormChange('is_active', e.target.checked)}
                  className="h-4 w-4 text-orange-600 border-gray-300 rounded"
                />
                <span className="text-sm text-gray-700">Active</span>
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={resetEdit}
                className="px-4 py-2 rounded border border-gray-300 text-gray-700 hover:bg-gray-50"
                type="button"
              >
                Reset
              </button>
              <button
                onClick={() => {
                  setEditingItem(null);
                  setForm({});
                }}
                className="px-4 py-2 rounded border border-gray-300 text-gray-700 hover:bg-gray-50"
                type="button"
              >
                Cancel
              </button>
              <button
                onClick={saveItem}
                disabled={saving}
                className="px-4 py-2 rounded bg-orange-500 text-white hover:bg-orange-600 disabled:opacity-60"
                type="button"
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
