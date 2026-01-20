'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams, useParams } from 'next/navigation';
import axios from 'axios';
import { X } from 'lucide-react';

interface Category {
  _id: string;
  name: string;
  icon: string;
  color: string;
}

interface Variant {
  name: string;
  price: number;
}

interface Topping {
  name: string;
  price: number;
}

interface Dish {
  _id: string;
  category_ids: string[];
  name: string;
  description?: string;
  image_url?: string;
  base_price: number;
  variants: Variant[];
  toppings: Topping[];
  allergens: string[];
  dietary_tags: string[];
  preparation_time_minutes: number;
  is_bestseller: boolean;
  is_new: boolean;
  is_available: boolean;
  calories: number;
  is_vegetarian: boolean;
  is_vegan: boolean;
}

const ALLERGENS = [
  'peanuts',
  'tree_nuts',
  'milk',
  'eggs',
  'fish',
  'shellfish',
  'soy',
  'wheat',
  'sesame',
];

const DIETARY_TAGS = ['vegetarian', 'vegan', 'gluten-free', 'dairy-free', 'halal', 'kosher'];

const STANDARD_VARIANTS = [
  { name: 'Small', price: 150 },
  { name: 'Medium', price: 250 },
  { name: 'Large', price: 350 },
];

export default function DishEditorPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const params = useParams();
  const dishId = params?.id as string;

  const [categories, setCategories] = useState<Category[]>([]);
  const [dish, setDish] = useState<Partial<Dish>>({
    category_ids: [],
    name: '',
    description: '',
    image_url: '',
    base_price: 0,
    variants: [],
    toppings: [],
    allergens: [],
    dietary_tags: [],
    preparation_time_minutes: 15,
    is_bestseller: false,
    is_new: false,
    is_available: true,
    calories: 0,
    is_vegetarian: false,
    is_vegan: false,
  });

  const [newVariant, setNewVariant] = useState({ name: '', price: 0 });
  const [newTopping, setNewTopping] = useState({ name: '', price: 0 });
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);

  const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001/api';
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : '';

  useEffect(() => {
    fetchCategories();
    if (dishId && dishId !== 'new') {
      fetchDish();
    }
  }, [dishId]);

  const fetchCategories = async () => {
    try {
      const res = await axios.get(`${API_BASE}/categories`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setCategories(res.data);
    } catch (err) {
      console.error('Error fetching categories:', err);
    }
  };

  const fetchDish = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API_BASE}/dishes/${dishId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setDish(res.data);
    } catch (err) {
      console.error('Error fetching dish:', err);
      alert('Failed to load dish');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      // Ensure category_ids are set
      if (!dish.category_ids || dish.category_ids.length === 0) {
        alert('Please select at least one category');
        setLoading(false);
        return;
      }
      console.log('Saving dish:', dish);
      if (dishId && dishId !== 'new') {
        await axios.patch(`${API_BASE}/dishes/${dishId}`, dish, {
          headers: { Authorization: `Bearer ${token}` },
        });
        alert('Dish updated successfully!');
      } else {
        await axios.post(`${API_BASE}/dishes`, dish, {
          headers: { Authorization: `Bearer ${token}` },
        });
        alert('Dish created successfully!');
      }
      router.push(`/dashboard/menu`);
    } catch (err: any) {
      console.error('Error saving dish:', err);
      console.error('Error response:', err?.response?.data);
      alert(err?.response?.data?.message || 'Failed to save dish');
    } finally {
      setLoading(false);
    }
  };

  const addVariant = () => {
    if (newVariant.name) {
      setDish({
        ...dish,
        variants: [...(dish.variants || []), newVariant],
      });
      setNewVariant({ name: '', price: 0 });
    }
  };

  const removeVariant = (index: number) => {
    setDish({
      ...dish,
      variants: dish.variants?.filter((_, i) => i !== index) || [],
    });
  };

  const addTopping = () => {
    if (newTopping.name) {
      setDish({
        ...dish,
        toppings: [...(dish.toppings || []), newTopping],
      });
      setNewTopping({ name: '', price: 0 });
    }
  };

  const removeTopping = (index: number) => {
    setDish({
      ...dish,
      toppings: dish.toppings?.filter((_, i) => i !== index) || [],
    });
  };

  const toggleAllergen = (allergen: string) => {
    const allergens = dish.allergens || [];
    if (allergens.includes(allergen)) {
      setDish({
        ...dish,
        allergens: allergens.filter((a) => a !== allergen),
      });
    } else {
      setDish({
        ...dish,
        allergens: [...allergens, allergen],
      });
    }
  };

  const toggleDietaryTag = (tag: string) => {
    const tags = dish.dietary_tags || [];
    if (tags.includes(tag)) {
      setDish({
        ...dish,
        dietary_tags: tags.filter((t) => t !== tag),
      });
    } else {
      setDish({
        ...dish,
        dietary_tags: [...tags, tag],
      });
    }
  };

  if (loading && dishId !== 'new') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-600">Loading dish...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="border-b border-gray-200 px-8 py-6">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.back()}
            className="p-2 hover:bg-gray-100 rounded-lg transition text-2xl"
          >
            ←
          </button>
          <h1 className="text-3xl font-bold text-gray-900">
            {dishId && dishId !== 'new' ? 'Edit Dish' : 'New Dish'}
          </h1>
        </div>
      </div>

      {/* Multi-step form */}
      <div className="max-w-4xl mx-auto px-8 py-8">
        {/* Step indicator */}
        <div className="flex gap-2 mb-8">
          {[1, 2, 3, 4].map((s) => (
            <div
              key={s}
              className={`flex-1 h-2 rounded-full ${
                s <= step ? 'bg-red-500' : 'bg-gray-200'
              }`}
            />
          ))}
        </div>

        {/* Step 1: Basic Info */}
        {step === 1 && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900">Basic Information</h2>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Categories * (Select at least one)
              </label>
              <div className="space-y-2">
                {categories.map((cat) => (
                  <label
                    key={cat._id}
                    className="flex items-center gap-3 p-3 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 transition"
                  >
                    <input
                      type="checkbox"
                      checked={(dish.category_ids || []).includes(cat._id)}
                      onChange={(e) => {
                        const categoryIds = dish.category_ids || [];
                        if (e.target.checked) {
                          setDish({ ...dish, category_ids: [...categoryIds, cat._id] });
                        } else {
                          setDish({
                            ...dish,
                            category_ids: categoryIds.filter((id) => id !== cat._id),
                          });
                        }
                      }}
                      className="w-4 h-4 rounded border-gray-300 text-red-500 focus:ring-red-500 cursor-pointer"
                    />
                    <div className="flex items-center gap-2 flex-1">
                      <span className="text-xl">{cat.icon}</span>
                      <span className="font-medium text-gray-900">{cat.name}</span>
                    </div>
                  </label>
                ))}
              </div>
              {(dish.category_ids || []).length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {(dish.category_ids || []).map((catId) => {
                    const cat = categories.find((c) => c._id === catId);
                    return cat ? (
                      <div
                        key={catId}
                        className="flex items-center gap-2 px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm"
                      >
                        <span>{cat.icon}</span>
                        <span>{cat.name}</span>
                        <button
                          type="button"
                          onClick={() =>
                            setDish({
                              ...dish,
                              category_ids: (dish.category_ids || []).filter(
                                (id) => id !== catId,
                              ),
                            })
                          }
                          className="ml-1 hover:opacity-70"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ) : null;
                  })}
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Dish Name *
              </label>
              <input
                type="text"
                required
                value={dish.name}
                onChange={(e) => setDish({ ...dish, name: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                value={dish.description}
                onChange={(e) => setDish({ ...dish, description: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                rows={4}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Base Price (₹) *
              </label>
              <input
                type="number"
                required
                step="10"
                min="0"
                value={dish.base_price || ''}
                onChange={(e) => {
                  const val = e.target.value;
                  setDish({ ...dish, base_price: val === '' ? 0 : parseInt(val) || 0 });
                }}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Image URL
              </label>
              <input
                type="url"
                value={dish.image_url}
                onChange={(e) => setDish({ ...dish, image_url: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
              />
              {dish.image_url && (
                <img
                  src={dish.image_url}
                  alt="Preview"
                  className="mt-4 h-40 object-cover rounded-lg"
                />
              )}
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setStep(2)}
                className="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition"
              >
                Next
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Variants & Toppings */}
        {step === 2 && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900">Sizes & Toppings</h2>

            <div>
              <h3 className="text-lg font-bold text-gray-900 mb-3">Variants (Sizes)</h3>
              <p className="text-sm text-gray-600 mb-4">
                Add size options with their prices (e.g., Small ₹150, Medium ₹250, Large ₹350)
              </p>

              <div className="space-y-2 mb-4">
                {dish.variants?.map((variant, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between bg-gray-50 p-3 rounded-lg"
                  >
                    <div>
                      <p className="font-medium text-gray-900">{variant.name}</p>
                      <p className="text-sm text-gray-600">
                        ₹{Math.round(variant.price)}
                      </p>
                    </div>
                    <button
                      onClick={() => removeVariant(idx)}
                      className="text-red-500 text-lg hover:opacity-70"
                    >
                      ❌
                    </button>
                  </div>
                ))}
              </div>

              <div className="flex gap-2 mb-3">
                <input
                  type="text"
                  value={newVariant.name}
                  onChange={(e) => setNewVariant({ ...newVariant, name: e.target.value })}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                />
                <input
                  type="number"
                  step="10"
                  min="0"
                  value={newVariant.price || ''}
                  onChange={(e: any) => {
                    const val = e.target.value;
                    setNewVariant({ ...newVariant, price: val === '' ? 0 : parseInt(val) || 0 });
                  }}
                  className="w-28 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                />
                <button
                  onClick={addVariant}
                  className="px-3 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition"
                >
                  ➕
                </button>
              </div>

              <p className="text-xs text-gray-500">Quick add: </p>
              <div className="flex gap-2">
                {STANDARD_VARIANTS.map((v) => (
                  <button
                    key={v.name}
                    onClick={() => {
                      setDish({
                        ...dish,
                        variants: [...(dish.variants || []), v],
                      });
                    }}
                    className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg transition"
                  >
                    {v.name} (₹{v.price})
                  </button>
                ))}
              </div>
            </div>

            <div className="pt-6 border-t border-gray-200">
              <h3 className="text-lg font-bold text-gray-900 mb-3">Optional Toppings</h3>

              <div className="space-y-2 mb-4">
                {dish.toppings?.map((topping, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between bg-gray-50 p-3 rounded-lg"
                  >
                    <div>
                      <p className="font-medium text-gray-900">{topping.name}</p>
                      <p className="text-sm text-gray-600">+₹{Math.round(topping.price)}</p>
                    </div>
                    <button
                      onClick={() => removeTopping(idx)}
                      className="text-red-500 text-lg hover:opacity-70"
                    >
                      ❌
                    </button>
                  </div>
                ))}
              </div>

              <div className="flex gap-2">
                <input
                  type="text"
                  value={newTopping.name}
                  onChange={(e) => setNewTopping({ ...newTopping, name: e.target.value })}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                />
                <input
                  type="number"
                  step="10"
                  min="0"
                  value={newTopping.price || ''}
                  onChange={(e: any) => setNewTopping({ ...newTopping, price: parseInt(e.target.value) || 50 })}
                  className="w-24 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                />
                <button
                  onClick={addTopping}
                  className="px-3 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition"
                >
                  ➕
                </button>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setStep(1)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
              >
                Back
              </button>
              <button
                onClick={() => setStep(3)}
                className="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition"
              >
                Next
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Allergens & Dietary */}
        {step <= 2 ? null : (
          step === 3 ? (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-gray-900">Allergens & Dietary Info</h2>

              <div>
                <h3 className="font-bold text-gray-900 mb-3">Allergens</h3>
                <div className="grid grid-cols-2 gap-3">
                  {ALLERGENS.map((allergen) => (
                    <button
                      key={allergen}
                      onClick={() => toggleAllergen(allergen)}
                      className={`p-3 rounded-lg border-2 transition text-left ${
                        dish.allergens?.includes(allergen)
                          ? 'border-red-500 bg-red-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <p className="capitalize font-medium text-gray-900">
                        {allergen.replace('_', ' ')}
                      </p>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="font-bold text-gray-900 mb-3">Dietary Tags</h3>
                <div className="grid grid-cols-2 gap-3">
                  {DIETARY_TAGS.map((tag) => (
                    <button
                      key={tag}
                      onClick={() => toggleDietaryTag(tag)}
                      className={`p-3 rounded-lg border-2 transition text-left ${
                        dish.dietary_tags?.includes(tag)
                          ? 'border-green-500 bg-green-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <p className="capitalize font-medium text-gray-900">{tag.replace('_', ' ')}</p>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Preparation Time (minutes)
                </label>
                <input
                  type="number"
                  min="1"
                  step="5"
                  value={dish.preparation_time_minutes || 15}
                  onChange={(e: any) =>
                    setDish({ ...dish, preparation_time_minutes: parseInt(e.target.value) || 15 })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setStep(2)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
                >
                  Back
                </button>
                <button
                  onClick={() => setStep(4)}
                  className="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition"
                >
                  Next
                </button>
              </div>
            </div>
          ) : null
        )}

        {/* Step 4: Metadata */}
        {step === 4 && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900">Additional Info</h2>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Calories
              </label>
              <input
                type="number"
                min="0"
                step="10"
                value={dish.calories || ""}
                onChange={(e: any) => setDish({ ...dish, calories: parseInt(e.target.value) || 0 })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
              />
            </div>

            <div className="space-y-3">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={dish.is_bestseller}
                  onChange={(e: any) => setDish({ ...dish, is_bestseller: e.target.checked })}
                  className="w-5 h-5 rounded border-gray-300"
                />
                <span className="text-gray-900 font-medium">Mark as Bestseller</span>
              </label>

              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={dish.is_new}
                  onChange={(e: any) => setDish({ ...dish, is_new: e.target.checked })}
                  className="w-5 h-5 rounded border-gray-300"
                />
                <span className="text-gray-900 font-medium">Mark as New</span>
              </label>

              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={dish.is_vegetarian}
                  onChange={(e: any) => setDish({ ...dish, is_vegetarian: e.target.checked })}
                  className="w-5 h-5 rounded border-gray-300"
                />
                <span className="text-gray-900 font-medium">Vegetarian</span>
              </label>

              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={dish.is_vegan}
                  onChange={(e: any) => setDish({ ...dish, is_vegan: e.target.checked })}
                  className="w-5 h-5 rounded border-gray-300"
                />
                <span className="text-gray-900 font-medium">Vegan</span>
              </label>

              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={dish.is_available}
                  onChange={(e: any) => setDish({ ...dish, is_available: e.target.checked })}
                  className="w-5 h-5 rounded border-gray-300"
                />
                <span className="text-gray-900 font-medium">Available</span>
              </label>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setStep(3)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
              >
                Back
              </button>
              <button
                onClick={handleSave}
                disabled={loading}
                className="flex-1 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition disabled:opacity-50"
              >
                {loading ? 'Saving...' : 'Save Dish'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
