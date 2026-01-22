'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Plus, Edit2, Trash2, Play, AlertCircle, ChevronDown, ChevronLeft } from 'lucide-react';

interface RestockingItem {
  item_id: string;
  item_name: string;
  sku: string;
  quantity: number | string;
  unit: string;
}

interface RestockingArmy {
  _id: string;
  name: string;
  description?: string;
  items: RestockingItem[];
  is_active: boolean;
  createdAt: string;
}

interface FormState {
  name: string;
  description: string;
  items: RestockingItem[];
}

export default function RestockingArmiesPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [armies, setArmies] = useState<RestockingArmy[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [executing, setExecuting] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const [formData, setFormData] = useState<FormState>({
    name: '',
    description: '',
    items: [],
  });

  const [availableItems, setAvailableItems] = useState<Array<{ _id: string; name: string; sku: string; unit: string }>>([]);

  useEffect(() => {
    setMounted(true);
    fetchArmies();
    fetchAvailableItems();
  }, []);

  const fetchArmies = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      if (!token) {
        setError('Authentication token not found');
        return;
      }

      const response = await fetch('http://localhost:3001/api/inventory/restocking-armies', {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        setError('Failed to fetch restocking armies');
        return;
      }

      const data = await response.json();
      setArmies(data);
      setError('');
    } catch (err) {
      setError('An error occurred while fetching armies');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailableItems = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await fetch('http://localhost:3001/api/inventory/items?limit=1000', {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setAvailableItems(data);
      }
    } catch (err) {
      console.error('Failed to fetch items:', err);
    }
  };

  const handleAddItem = () => {
    if (availableItems.length === 0) {
      setError('No items available. Please create inventory items first.');
      return;
    }

    setFormData((prev) => ({
      ...prev,
      items: [
        ...prev.items,
        {
          item_id: availableItems[0]._id,
          item_name: availableItems[0].name,
          sku: availableItems[0].sku,
          quantity: '' as any,
          unit: availableItems[0].unit,
        },
      ],
    }));
  };

  const handleRemoveItem = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index),
    }));
  };

  const handleItemSelect = (index: number, itemId: string) => {
    const selectedItem = availableItems.find((i) => i._id === itemId);
    if (selectedItem) {
      setFormData((prev) => {
        const newItems = [...prev.items];
        newItems[index] = {
          item_id: selectedItem._id,
          item_name: selectedItem.name,
          sku: selectedItem.sku,
          quantity: newItems[index].quantity,
          unit: selectedItem.unit,
        };
        return { ...prev, items: newItems };
      });
    }
  };

  const handleQuantityChange = (index: number, value: string) => {
    setFormData((prev) => {
      const newItems = [...prev.items];
      newItems[index].quantity = value === '' ? ('' as any) : parseFloat(value) || 0;
      return { ...prev, items: newItems };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      setError('Army name is required');
      return;
    }

    if (formData.items.length === 0) {
      setError('Add at least one item to the army');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setError('Authentication token not found');
        return;
      }

      const payload = {
        name: formData.name,
        description: formData.description,
        items: formData.items.map((item) => ({
          item_id: item.item_id,
          quantity: typeof item.quantity === 'string' ? parseFloat(item.quantity) || 0 : item.quantity,
        })),
      };

      const url = editingId ? `http://localhost:3001/api/inventory/restocking-armies/${editingId}` : 'http://localhost:3001/api/inventory/restocking-armies';
      const method = editingId ? 'PATCH' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        setError(errorData.message || 'Failed to save army');
        return;
      }

      setFormData({ name: '', description: '', items: [] });
      setEditingId(null);
      setShowForm(false);
      await fetchArmies();
      setError('');
    } catch (err) {
      setError('An error occurred while saving');
      console.error(err);
    }
  };

  const handleEdit = (army: RestockingArmy) => {
    setFormData({
      name: army.name,
      description: army.description || '',
      items: army.items,
    });
    setEditingId(army._id);
    setShowForm(true);
  };

  const handleDelete = async (armyId: string) => {
    if (!confirm('Are you sure you want to delete this restocking army?')) return;

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setError('Authentication token not found');
        return;
      }

      const response = await fetch(`http://localhost:3001/api/inventory/restocking-armies/${armyId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        setError('Failed to delete army');
        return;
      }

      await fetchArmies();
    } catch (err) {
      setError('An error occurred while deleting');
      console.error(err);
    }
  };

  const handleExecute = async (armyId: string) => {
    if (!confirm('Execute this restocking army? This will add all items to inventory.')) return;

    try {
      setExecuting(armyId);
      const token = localStorage.getItem('token');
      if (!token) {
        setError('Authentication token not found');
        return;
      }

      const response = await fetch(`http://localhost:3001/api/inventory/restocking-armies/${armyId}/execute`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ notes: 'Executed from dashboard' }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        setError(errorData.message || 'Failed to execute army');
        setExecuting(null);
        return;
      }

      const result = await response.json();
      if (result.errors.length > 0) {
        setError(`Restocked ${result.items_restocked} items. Errors: ${result.errors.join('; ')}`);
      } else {
        setError('');
      }

      setExecuting(null);
      await fetchArmies();
    } catch (err) {
      setError('An error occurred while executing');
      console.error(err);
      setExecuting(null);
    }
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingId(null);
    setFormData({ name: '', description: '', items: [] });
  };

  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4 md:p-8">
      {/* Header */}
      <div className="mb-8">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-slate-600 hover:text-slate-900 mb-4 transition-colors"
        >
          <ChevronLeft size={20} />
          <span className="text-sm font-medium">Back to Inventory</span>
        </button>
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-slate-900">Restocking Armies</h1>
            <p className="text-slate-600 mt-2">Save and manage restocking templates for quick replenishment</p>
          </div>
          <button
            onClick={() => {
              setShowForm(!showForm);
              if (showForm) handleCancel();
            }}
            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-emerald-600 to-emerald-700 text-white font-medium rounded-lg hover:from-emerald-700 hover:to-emerald-800 transition"
          >
            <Plus size={20} />
            New Army
          </button>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex gap-3">
          <AlertCircle className="text-red-600 flex-shrink-0" size={20} />
          <p className="text-red-800">{error}</p>
        </div>
      )}

      {/* Form */}
      {showForm && (
        <div className="mb-8 bg-white rounded-2xl shadow-xl overflow-hidden">
          <div className="bg-gradient-to-r from-emerald-600 to-emerald-700 px-8 py-6">
            <h2 className="text-xl font-semibold text-white">{editingId ? 'Edit Army' : 'Create New Restocking Army'}</h2>
          </div>

          <form onSubmit={handleSubmit} className="p-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Army Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g., Daily Prep, Standard Restock"
                  className="w-full px-4 py-3 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Description</label>
                <input
                  type="text"
                  value={formData.description}
                  onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                  placeholder="Optional description"
                  className="w-full px-4 py-3 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            {/* Items List */}
            <div className="mb-8">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-slate-900">Items</h3>
                <button
                  type="button"
                  onClick={handleAddItem}
                  className="text-sm px-3 py-1 bg-emerald-50 text-emerald-700 rounded hover:bg-emerald-100 transition"
                >
                  + Add Item
                </button>
              </div>

              <div className="space-y-3">
                {formData.items.map((item, index) => (
                  <div key={index} className="flex gap-3 items-end bg-slate-50 p-4 rounded-lg">
                    <div className="flex-1">
                      <label className="block text-sm font-medium text-slate-700 mb-1">Item</label>
                      <select
                        value={item.item_id}
                        onChange={(e) => handleItemSelect(index, e.target.value)}
                        className="w-full px-3 py-2 border border-slate-200 rounded focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      >
                        {availableItems.map((availItem) => (
                          <option key={availItem._id} value={availItem._id}>
                            {availItem.name} ({availItem.sku})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="w-24">
                      <label className="block text-sm font-medium text-slate-700 mb-1">Qty</label>
                      <input
                        type="number"
                        step="1"
                        value={item.quantity === '' ? '' : item.quantity}
                        onChange={(e) => handleQuantityChange(index, e.target.value)}
                        placeholder=""
                        className="w-full px-3 py-2 border border-slate-200 rounded focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>

                    <div className="w-16 text-sm text-slate-600 font-medium text-center">{item.unit}</div>

                    <button
                      type="button"
                      onClick={() => handleRemoveItem(index)}
                      className="px-3 py-2 text-red-600 hover:bg-red-50 rounded transition"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Buttons */}
            <div className="flex gap-3 pt-6 border-t border-slate-200">
              <button
                type="button"
                onClick={handleCancel}
                className="px-6 py-3 rounded-lg border border-slate-300 text-slate-700 font-medium hover:bg-slate-50 transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 px-6 py-3 bg-gradient-to-r from-emerald-600 to-emerald-700 text-white font-medium rounded-lg hover:from-emerald-700 hover:to-emerald-800 transition"
              >
                {editingId ? 'Update Army' : 'Create Army'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Armies List */}
      {loading ? (
        <div className="text-center py-12 text-slate-600">Loading restocking armies...</div>
      ) : armies.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-2xl">
          <p className="text-slate-600 mb-4">No restocking armies yet. Create one to get started!</p>
          <button
            onClick={() => setShowForm(true)}
            className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition"
          >
            <Plus size={20} />
            Create Your First Army
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {armies.map((army) => (
            <div key={army._id} className="bg-white rounded-2xl shadow hover:shadow-lg transition overflow-hidden">
              <div className="w-full p-6 flex justify-between items-center hover:bg-slate-50 transition">
                <div 
                  className="flex-1 text-left cursor-pointer"
                  onClick={() => setExpandedId(expandedId === army._id ? null : army._id)}
                >
                  <h3 className="text-lg font-semibold text-slate-900">{army.name}</h3>
                  {army.description && <p className="text-sm text-slate-600 mt-1">{army.description}</p>}
                  <p className="text-sm text-slate-500 mt-2">{army.items.length} items</p>
                </div>

                <div className="flex items-center gap-4">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleExecute(army._id);
                    }}
                    disabled={executing === army._id}
                    className="px-4 py-2 bg-emerald-50 text-emerald-700 rounded-lg hover:bg-emerald-100 transition flex items-center gap-2 font-medium disabled:opacity-50"
                  >
                    <Play size={16} />
                    {executing === army._id ? 'Executing...' : 'Execute'}
                  </button>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleEdit(army);
                    }}
                    className="p-2 text-slate-600 hover:bg-slate-100 rounded transition"
                  >
                    <Edit2 size={18} />
                  </button>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(army._id);
                    }}
                    className="p-2 text-red-600 hover:bg-red-50 rounded transition"
                  >
                    <Trash2 size={18} />
                  </button>

                  <button
                    onClick={() => setExpandedId(expandedId === army._id ? null : army._id)}
                    className="p-2 hover:bg-slate-100 rounded transition"
                    aria-label="Toggle details"
                  >
                    <ChevronDown
                      size={20}
                      className={`text-slate-400 transition ${expandedId === army._id ? 'rotate-180' : ''}`}
                    />
                  </button>
                </div>
              </div>

              {/* Expanded Items */}
              {expandedId === army._id && (
                <div className="px-6 pb-6 border-t border-slate-200">
                  <div className="space-y-2 mt-4">
                    {army.items.map((item, index) => (
                      <div key={index} className="flex justify-between items-center p-3 bg-slate-50 rounded">
                        <div>
                          <p className="font-medium text-slate-900">{item.item_name}</p>
                          <p className="text-sm text-slate-600">{item.sku}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-slate-900">
                            {item.quantity} {item.unit}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
