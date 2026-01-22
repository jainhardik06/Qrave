'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, AlertCircle } from 'lucide-react';

const UNITS = {
  'Weight': [
    { value: 'kg', label: 'Kilogram (kg)' },
    { value: 'g', label: 'Gram (g)' },
    { value: 'mg', label: 'Milligram (mg)' },
    { value: 'lb', label: 'Pound (lb)' },
    { value: 'oz', label: 'Ounce (oz)' },
  ],
  'Volume': [
    { value: 'L', label: 'Liter (L)' },
    { value: 'ml', label: 'Milliliter (ml)' },
    { value: 'gallon', label: 'Gallon (gal)' },
    { value: 'pint', label: 'Pint (pt)' },
    { value: 'cup', label: 'Cup' },
    { value: 'tbsp', label: 'Tablespoon (tbsp)' },
    { value: 'tsp', label: 'Teaspoon (tsp)' },
  ],
  'Quantity': [
    { value: 'piece', label: 'Piece (pc)' },
    { value: 'box', label: 'Box' },
    { value: 'bag', label: 'Bag' },
    { value: 'dozen', label: 'Dozen (dz)' },
    { value: 'bundle', label: 'Bundle' },
  ],
};

interface FormData {
  name: string;
  unit: string;
  cost_per_unit: number;
  current_quantity: number;
  category: string;
  restocking_quantity: number;
}

const CATEGORIES = ['Vegetables', 'Fruits', 'Dairy', 'Meat', 'Spices', 'Grains', 'Oils', 'Condiments', 'Other'];

export default function AddItemPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [apiError, setApiError] = useState('');
  const [selectedUnitType, setSelectedUnitType] = useState<string>('Weight');

  const [formData, setFormData] = useState<FormData>({
    name: '',
    unit: 'kg',
    cost_per_unit: 0,
    current_quantity: 0,
    category: '',
    restocking_quantity: 0,
  });

  useEffect(() => {
    setMounted(true);
  }, []);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) newErrors.name = 'Item name is required';
    if (formData.cost_per_unit <= 0) newErrors.cost_per_unit = 'Cost must be greater than 0';
    if (formData.current_quantity < 0) newErrors.current_quantity = 'Quantity cannot be negative';
    if (!formData.category) newErrors.category = 'Category is required';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field: keyof FormData, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const handleUnitTypeChange = (type: string) => {
    setSelectedUnitType(type);
    const units = UNITS[type as keyof typeof UNITS];
    if (units.length > 0) {
      handleInputChange('unit', units[0].value);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setLoading(true);
    setApiError('');

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setApiError('Authentication token not found');
        setLoading(false);
        return;
      }

      const response = await fetch('http://localhost:3001/api/inventory/items', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        setApiError(errorData.message || 'Failed to create item');
        setLoading(false);
        return;
      }

      router.push('/dashboard/inventory');
    } catch (error) {
      setApiError('An error occurred. Please try again.');
      console.error('Error:', error);
      setLoading(false);
    }
  };

  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4 md:p-8">
      {/* Header */}
      <div className="mb-8">
        <Link href="/dashboard/inventory" className="inline-flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900 mb-6">
          <ArrowLeft size={18} />
          Back to Inventory
        </Link>
        <h1 className="text-3xl md:text-4xl font-bold text-slate-900">Add New Item</h1>
        <p className="text-slate-600 mt-2">Create a new inventory item with unit conversion support</p>
      </div>

      {/* Error Alert */}
      {apiError && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex gap-3">
          <AlertCircle className="text-red-600 flex-shrink-0" size={20} />
          <p className="text-red-800">{apiError}</p>
        </div>
      )}

      {/* Form Container */}
      <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-xl overflow-hidden">
        <div className="bg-gradient-to-r from-emerald-600 to-emerald-700 px-8 py-6">
          <h2 className="text-xl font-semibold text-white">Item Details</h2>
        </div>

        <form onSubmit={handleSubmit} className="p-8">
          {/* Item Name */}
          <div className="mb-8">
            <label className="block text-sm font-medium text-slate-700 mb-2">Item Name *</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              placeholder="e.g., Tomato, Flour, Cheese"
              className={`w-full px-4 py-3 rounded-lg border transition focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
                errors.name ? 'border-red-300 bg-red-50' : 'border-slate-200 bg-white'
              }`}
            />
            {errors.name && <p className="text-red-600 text-sm mt-1">{errors.name}</p>}
          </div>

          {/* Category */}
          <div className="mb-8">
            <label className="block text-sm font-medium text-slate-700 mb-2">Category *</label>
            <select
              value={formData.category}
              onChange={(e) => handleInputChange('category', e.target.value)}
              className={`w-full px-4 py-3 rounded-lg border transition focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
                errors.category ? 'border-red-300 bg-red-50' : 'border-slate-200 bg-white'
              }`}
            >
              <option value="">Select Category</option>
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
            {errors.category && <p className="text-red-600 text-sm mt-1">{errors.category}</p>}
          </div>

          {/* Unit Type Selector */}
          <div className="mb-8">
            <label className="block text-sm font-medium text-slate-700 mb-3">Unit Type *</label>
            <div className="flex gap-2 flex-wrap">
              {Object.keys(UNITS).map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => handleUnitTypeChange(type)}
                  className={`px-4 py-2 rounded-lg font-medium transition ${
                    selectedUnitType === type
                      ? 'bg-emerald-600 text-white'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>

          {/* Unit of Measurement */}
          <div className="mb-8">
            <label className="block text-sm font-medium text-slate-700 mb-2">Unit of Measurement *</label>
            <select
              value={formData.unit}
              onChange={(e) => handleInputChange('unit', e.target.value)}
              className="w-full px-4 py-3 rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 transition"
            >
              {UNITS[selectedUnitType as keyof typeof UNITS].map((unit) => (
                <option key={unit.value} value={unit.value}>
                  {unit.label}
                </option>
              ))}
            </select>
          </div>

          {/* Current Quantity */}
          <div className="mb-8">
            <label className="block text-sm font-medium text-slate-700 mb-2">Current Quantity ({formData.unit}) *</label>
            <input
              type="number"
              step="1"
              value={formData.current_quantity}
              onChange={(e) => handleInputChange('current_quantity', parseFloat(e.target.value) || '')}
              placeholder="0"
              className={`w-full px-4 py-3 rounded-lg border transition focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
                errors.current_quantity ? 'border-red-300 bg-red-50' : 'border-slate-200 bg-white'
              }`}
            />
            {errors.current_quantity && <p className="text-red-600 text-sm mt-1">{errors.current_quantity}</p>}
          </div>

          {/* Cost Per Unit */}
          <div className="mb-10">
            <label className="block text-sm font-medium text-slate-700 mb-2">Cost Per Unit ($) *</label>
            <input
              type="number"
              step="5"
              min="0"
              value={formData.cost_per_unit}
              onChange={(e) => handleInputChange('cost_per_unit', parseFloat(e.target.value) || '')}
              placeholder="0.00"
              className={`w-full px-4 py-3 rounded-lg border transition focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
                errors.cost_per_unit ? 'border-red-300 bg-red-50' : 'border-slate-200 bg-white'
              }`}
            />
            {errors.cost_per_unit && <p className="text-red-600 text-sm mt-1">{errors.cost_per_unit}</p>}
          </div>

          {/* Restocking Quantity */}
          <div className="mb-10">
            <label className="block text-sm font-medium text-slate-700 mb-2">Default Restocking Quantity ({formData.unit})</label>
            <input
              type="number"
              step="1"
              value={formData.restocking_quantity}
              onChange={(e) => handleInputChange('restocking_quantity', parseFloat(e.target.value) || '')}
              placeholder="e.g., 10"
              className="w-full px-4 py-3 rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 transition"
            />
            <p className="text-slate-500 text-sm mt-1">Amount to restock by default</p>
          </div>

          {/* Submit Button */}
          <div className="flex gap-3">
            <Link
              href="/dashboard/inventory"
              className="px-6 py-3 rounded-lg border border-slate-300 text-slate-700 font-medium hover:bg-slate-50 transition"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={loading}
              className={`flex-1 px-6 py-3 rounded-lg font-medium transition ${
                loading
                  ? 'bg-slate-300 text-slate-600 cursor-not-allowed'
                  : 'bg-emerald-600 text-white hover:bg-emerald-700'
              }`}
            >
              {loading ? 'Creating...' : 'Create Item'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
