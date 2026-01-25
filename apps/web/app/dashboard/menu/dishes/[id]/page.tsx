'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams, useParams } from 'next/navigation';
import axios from 'axios';
import { X } from 'lucide-react';

// Helper function to generate slug ID from name
const generateSlugId = (name: string): string => {
  return name.toLowerCase().replace(/\s+/g, '-');
};

// Helper function to ensure variants/toppings have _id
const ensureIdsOnObjects = (objects: any[]): any[] => {
  return objects.map(obj => {
    if (!obj._id) {
      return {
        ...obj,
        _id: generateSlugId(obj.name)
      };
    }
    return obj;
  });
};

interface Category {
  _id: string;
  name: string;
  icon: string;
  color: string;
}

interface Variant {
  _id?: string;
  name: string;
  price: number;
}

interface Topping {
  _id?: string;
  name: string;
  price: number;
}

interface InventoryItem {
  _id: string;
  name: string;
  unit: string;
  current_quantity: number;
}

type IngredientScope = 'base' | 'variant' | 'topping';

interface Ingredient {
  item_id: string;
  item_name: string;
  quantity_per_dish: number;
  unit: string;
  scope?: IngredientScope;
  variant_id?: string;
  topping_id?: string;
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

const DIETARY_TAGS = ['Vegetarian', 'Non-Veg', 'Vegan'];

// Unit mappings for ingredient selection
const WEIGHT_UNITS = ['kg', 'g', 'mg', 'lb', 'oz'];
const VOLUME_UNITS = ['L', 'ml', 'gallon', 'pint', 'cup', 'tbsp', 'tsp'];
const QUANTITY_UNITS = ['piece', 'box', 'bag', 'dozen', 'bundle'];

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
  
  // Step 5: Ingredients state
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);

  const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001/api';
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : '';

  useEffect(() => {
    fetchCategories();
    fetchInventoryItems();
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
      
      console.log('=== FETCHED DISH ===');
      console.log('Raw dish data:', JSON.stringify(res.data, null, 2));
      console.log('Variants:', res.data.variants);
      console.log('Toppings:', res.data.toppings);
      
      // Ensure variants and toppings have _id fields
      const dishData = {
        ...res.data,
        variants: ensureIdsOnObjects(res.data.variants || []),
        toppings: ensureIdsOnObjects(res.data.toppings || [])
      };
      
      console.log('Processed variants:', dishData.variants);
      console.log('Processed toppings:', dishData.toppings);
      console.log('Variant _ids:', dishData.variants.map(v => ({ name: v.name, _id: v._id })));
      
      setDish(dishData);
      
      // Fetch recipe/ingredients if exists
      try {
        console.log('🔍 Attempting to fetch recipe for dish:', dishId);
        const recipeRes = await axios.get(`http://localhost:3001/api/inventory/recipes/${dishId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        console.log('📦 Recipe API response:', recipeRes.data);
        
        if (recipeRes.data) {
          if (recipeRes.data.ingredients && recipeRes.data.ingredients.length > 0) {
            console.log('📗 Recipe found with', recipeRes.data.ingredients.length, 'ingredients');
            console.log('📗 Raw ingredients:', recipeRes.data.ingredients);
            
            // Map backend ingredients to frontend format
            const mappedIngredients = recipeRes.data.ingredients.map((ing: any) => {
              console.log('Mapping ingredient:', ing);
              const variantId = ing.variant_id?._id?.toString() || ing.variant_id?.toString();
              const toppingId = ing.topping_id?._id?.toString() || ing.topping_id?.toString();
              const scope: IngredientScope = variantId ? 'variant' : toppingId ? 'topping' : 'base';
              return {
                item_id: ing.item_id?._id?.toString() || ing.item_id?.toString() || ing.item_id,
                item_name: ing.item_name || '',
                quantity_per_dish: ing.quantity_per_dish,
                unit: ing.unit,
                scope,
                variant_id: variantId,
                topping_id: toppingId,
              };
            });
            setIngredients(mappedIngredients);
            console.log('✅ Ingredients loaded:', mappedIngredients);
          } else {
            console.log('📕 Recipe exists but has no ingredients');
            setIngredients([]);
          }
        } else {
          console.log('📕 No recipe found (null response)');
          setIngredients([]);
        }
      } catch (recipeErr: any) {
        // Recipe doesn't exist yet, that's okay
        if (recipeErr.response?.status === 404) {
          console.log('📕 Recipe not found (404)');
        } else {
          console.log('📕 Recipe fetch error:', recipeErr.response?.status, recipeErr.message);
        }
        setIngredients([]);
      }
    } catch (err) {
      console.error('Error fetching dish:', err);
      alert('Failed to load dish');
    } finally {
      setLoading(false);
    }
  };
  
  const fetchInventoryItems = async () => {
    try {
      const res = await axios.get('http://localhost:3001/api/inventory/items?limit=1000', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setInventoryItems(res.data);
    } catch (err) {
      console.error('Error fetching inventory items:', err);
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
      
      // Debug: Log current dish state
      console.log('=== SAVING DISH ===');
      console.log('Dish state:', JSON.stringify(dish, null, 2));
      console.log('Variants count:', dish.variants?.length);
      console.log('Toppings count:', dish.toppings?.length);
      console.log('Ingredients count:', ingredients.length);
      
      let savedDishId = dishId;
      
      if (dishId && dishId !== 'new') {
        console.log('Updating dish with PATCH:', `${API_BASE}/dishes/${dishId}`);
        const updateResponse = await axios.patch(`${API_BASE}/dishes/${dishId}`, dish, {
          headers: { Authorization: `Bearer ${token}` },
        });
        console.log('Update response:', updateResponse.data);
      } else {
        console.log('Creating new dish with POST');
        const res = await axios.post(`${API_BASE}/dishes`, dish, {
          headers: { Authorization: `Bearer ${token}` },
        });
        savedDishId = res.data._id;
        console.log('Created dish ID:', savedDishId);
      }
      
      // Save recipe/ingredients if any ingredients are added
      console.log('💚 Checking ingredients to save...');
      console.log('Ingredients count:', ingredients.length);
      console.log('Ingredients data:', ingredients);
      
      if (ingredients.length > 0 && savedDishId && savedDishId !== 'new') {
        try {
          const recipePayload = {
            dish_id: savedDishId,
            dish_name: dish.name,
            ingredients: ingredients.map(ing => ({
              item_id: ing.item_id,
              quantity_per_dish: ing.quantity_per_dish,
              unit: ing.unit,
              ...(ing.scope === 'variant' && ing.variant_id ? { variant_id: ing.variant_id } : {}),
              ...(ing.scope === 'topping' && ing.topping_id ? { topping_id: ing.topping_id } : {}),
            })),
          };
          
          console.log('📦 Recipe payload to save:', JSON.stringify(recipePayload, null, 2));
          
          // Use PATCH which now has upsert enabled (creates if doesn't exist)
          console.log('🔄 Saving recipe (upsert)...');
          const response = await axios.patch(`http://localhost:3001/api/inventory/recipes/${savedDishId}`, recipePayload, {
            headers: { Authorization: `Bearer ${token}` },
          });
          console.log('✅ Recipe saved successfully:', response.data);
        } catch (recipeErr: any) {
          console.error('❌ Error saving recipe:', recipeErr);
          console.error('❌ Error response:', recipeErr?.response?.data);
          alert('Dish saved but failed to save ingredients. You can add them later.');
        }
      } else {
        console.log('⚠️ No ingredients to save (ingredients.length = 0 or no valid dishId)');
      }
      
      alert(dishId && dishId !== 'new' ? 'Dish updated successfully!' : 'Dish created successfully!');
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
    console.log('🔵 Add variant button clicked!');
    console.log('Current newVariant state:', newVariant);
    
    if (newVariant.name) {
      // Generate a stable ID based on the variant name (slug-like)
      const variantId = newVariant.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
      const variantWithId = { ...newVariant, _id: variantId };
      const updatedVariants = [...(dish.variants || []), variantWithId];
      console.log('✅ Adding variant:', variantWithId);
      console.log('✅ Updated variants:', updatedVariants);
      setDish({
        ...dish,
        variants: updatedVariants,
      });
      setNewVariant({ name: '', price: 0 });
    } else {
      console.log('❌ Variant name is empty, not adding');
    }
  };

  const removeVariant = (index: number) => {
    const updatedVariants = dish.variants?.filter((_, i) => i !== index) || [];
    console.log('Removing variant at index:', index);
    console.log('Updated variants:', updatedVariants);
    setDish({
      ...dish,
      variants: updatedVariants,
    });
  };
  
  // Ingredient management functions
  const addIngredient = () => {
    if (inventoryItems.length === 0) {
      alert('No inventory items available. Please add inventory items first.');
      return;
    }
    
    const firstItem = inventoryItems[0];
    setIngredients([
      ...ingredients,
      {
        item_id: firstItem._id,
        item_name: firstItem.name,
        quantity_per_dish: 0,
        unit: firstItem.unit,
        scope: 'base',
      },
    ]);
  };
  
  // Get compatible units based on inventory item's unit type
  const getCompatibleUnits = (baseUnit: string): string[] => {
    const normalized = baseUnit.toLowerCase();
    
    // Weight units - normalize for comparison
    const normalizedWeightUnits = WEIGHT_UNITS.map(u => u.toLowerCase());
    if (normalizedWeightUnits.includes(normalized)) {
      return WEIGHT_UNITS;
    }
    
    // Volume units - normalize for comparison
    const normalizedVolumeUnits = VOLUME_UNITS.map(u => u.toLowerCase());
    if (normalizedVolumeUnits.includes(normalized)) {
      return VOLUME_UNITS;
    }
    
    // Quantity units (pieces, boxes, etc.) - normalize for comparison
    const normalizedQuantityUnits = QUANTITY_UNITS.map(u => u.toLowerCase());
    if (normalizedQuantityUnits.includes(normalized)) {
      return QUANTITY_UNITS;
    }
    
    // Default: return the base unit only
    return [baseUnit];
  };
  
  const removeIngredient = (index: number) => {
    setIngredients(ingredients.filter((_, i) => i !== index));
  };
  
  const updateIngredient = (index: number, field: string, value: any) => {
    const updated = [...ingredients];
    if (field === 'item_id') {
      const selectedItem = inventoryItems.find(item => item._id === value);
      if (selectedItem) {
        updated[index] = {
          ...updated[index],
          item_id: value,
          item_name: selectedItem.name,
          unit: selectedItem.unit, // Reset to item's base unit when item changes
        };
      }
    } else if (field === 'scope') {
      const scopeValue = value as IngredientScope;
      updated[index] = {
        ...updated[index],
        scope: scopeValue,
        // Reset variant/topping linkage when scope changes
        variant_id: scopeValue === 'variant' ? updated[index].variant_id : undefined,
        topping_id: scopeValue === 'topping' ? updated[index].topping_id : undefined,
      };
    } else if (field === 'variant_id') {
      console.log('🔵 Variant selected:', { value, index, current: updated[index] });
      updated[index] = { ...updated[index], [field]: value };
      console.log('✅ Updated ingredient:', updated[index]);
    } else if (field === 'topping_id') {
      console.log('🔵 Topping selected:', { value, index, current: updated[index] });
      updated[index] = { ...updated[index], [field]: value };
      console.log('✅ Updated ingredient:', updated[index]);
    } else {
      updated[index] = { ...updated[index], [field]: value };
    }
    setIngredients(updated);
  };

  const addTopping = () => {
    console.log('🔵 Add topping button clicked!');
    console.log('Current newTopping state:', newTopping);
    
    if (newTopping.name) {
      // Generate a stable ID based on the topping name (slug-like)
      const toppingId = newTopping.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
      const toppingWithId = { ...newTopping, _id: toppingId };
      const updatedToppings = [...(dish.toppings || []), toppingWithId];
      console.log('✅ Adding topping:', toppingWithId);
      console.log('✅ Updated toppings:', updatedToppings);
      setDish({
        ...dish,
        toppings: updatedToppings,
      });
      setNewTopping({ name: '', price: 0 });
    } else {
      console.log('❌ Topping name is empty, not adding');
    }
  };

  const removeTopping = (index: number) => {
    const updatedToppings = dish.toppings?.filter((_, i) => i !== index) || [];
    console.log('Removing topping at index:', index);
    console.log('Updated toppings:', updatedToppings);
    setDish({
      ...dish,
      toppings: updatedToppings,
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
          {[1, 2, 3, 4, 5].map((s) => (
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
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                <p className="text-sm text-blue-800">
                  💡 <strong>Instructions:</strong> Type name & price, then click "Add Variant" button to add it to the list.
                </p>
              </div>

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
                  type="button"
                  onClick={addVariant}
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition font-medium whitespace-nowrap"
                >
                  ➕ Add Variant
                </button>
              </div>

              <p className="text-xs text-gray-500">Quick add: </p>
              <div className="flex gap-2">
                {STANDARD_VARIANTS.map((v) => (
                  <button
                    key={v.name}
                    onClick={() => {
                      const variantWithId = {
                        ...v,
                        _id: generateSlugId(v.name)
                      };
                      setDish({
                        ...dish,
                        variants: [...(dish.variants || []), variantWithId],
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
              <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4">
                <p className="text-sm text-green-800">
                  💡 <strong>Instructions:</strong> Type topping name & price, then click "Add Topping" button to add it to the list.
                </p>
              </div>

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
                  placeholder="Topping name (e.g., Extra Cheese)"
                  value={newTopping.name}
                  onChange={(e) => setNewTopping({ ...newTopping, name: e.target.value })}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                />
                <input
                  type="number"
                  placeholder="Price"
                  step="10"
                  min="0"
                  value={newTopping.price || ''}
                  onChange={(e: any) => setNewTopping({ ...newTopping, price: parseInt(e.target.value) || 50 })}
                  className="w-24 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                />
                <button
                  type="button"
                  onClick={addTopping}
                  className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition font-medium whitespace-nowrap"
                >
                  ➕ Add Topping
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
                onClick={() => setStep(5)}
                className="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition"
              >
                Next
              </button>
            </div>
          </div>
        )}

        {/* Step 5: Ingredients from Inventory */}
        {step === 5 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Recipe Ingredients</h2>
              <p className="text-sm text-gray-600 mb-2">
                Add ingredients from your inventory that are used to prepare this dish. 
                This will automatically deduct from inventory when orders are placed.
              </p>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-800">
                💡 <strong>Tip:</strong> You can select different units for each ingredient. 
                For example, if inventory is in kg, you can specify recipe in grams (g).
                The system will automatically convert units when deducting from inventory.
              </div>
            </div>

            <div className="space-y-4">
              {ingredients.map((ingredient, index) => {
                const selectedItem = inventoryItems.find(item => item._id === ingredient.item_id);
                const compatibleUnits = selectedItem ? getCompatibleUnits(selectedItem.unit) : [ingredient.unit];
                
                return (
                  <div key={index} className="flex flex-wrap gap-3 items-end bg-gray-50 p-4 rounded-lg">
                    <div className="w-40">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Scope
                      </label>
                      <select
                        value={ingredient.scope || 'base'}
                        onChange={(e) => updateIngredient(index, 'scope', e.target.value as IngredientScope)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                      >
                        <option value="base">Base</option>
                        <option value="variant">Variant</option>
                        <option value="topping">Topping</option>
                      </select>
                    </div>

                    <div className="flex-1 min-w-[200px]">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Ingredient *
                      </label>
                      <select
                        value={ingredient.item_id}
                        onChange={(e) => updateIngredient(index, 'item_id', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                      >
                        {inventoryItems.map((item) => (
                          <option key={item._id} value={item._id}>
                            {item.name} (Available: {item.current_quantity} {item.unit})
                          </option>
                        ))}
                      </select>
                    </div>

                    {ingredient.scope === 'variant' && (
                      <div className="w-48">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Variant</label>
                        <select
                          value={ingredient.variant_id || ''}
                          onChange={(e) => updateIngredient(index, 'variant_id', e.target.value || undefined)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                        >
                          <option value="">Select variant</option>
                          {(dish.variants || []).map((v) => (
                            <option key={v._id || v.name} value={v._id || v.name}>
                              {v.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}

                    {ingredient.scope === 'topping' && (
                      <div className="w-48">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Topping</label>
                        <select
                          value={ingredient.topping_id || ''}
                          onChange={(e) => updateIngredient(index, 'topping_id', e.target.value || undefined)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                        >
                          <option value="">Select topping</option>
                          {(dish.toppings || []).map((t) => (
                            <option key={t._id || t.name} value={t._id || t.name}>
                              {t.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}

                    <div className="w-32">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Quantity *
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={ingredient.quantity_per_dish || ''}
                        onChange={(e) => updateIngredient(index, 'quantity_per_dish', parseFloat(e.target.value) || 0)}
                        placeholder="0"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                      />
                    </div>

                    <div className="w-32">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Unit *
                      </label>
                      <select
                        value={ingredient.unit}
                        onChange={(e) => updateIngredient(index, 'unit', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 font-medium"
                      >
                        {compatibleUnits.map((unit) => (
                          <option key={unit} value={unit}>
                            {unit}
                          </option>
                        ))}
                      </select>
                    </div>

                    <button
                      type="button"
                      onClick={() => removeIngredient(index)}
                      className="px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                    >
                      🗑️
                    </button>
                  </div>
                );
              })}

              {ingredients.length === 0 && (
                <div className="text-center py-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                  <p className="text-gray-600 mb-2">No ingredients added yet</p>
                  <p className="text-sm text-gray-500">
                    Click "Add Ingredient" below to start adding ingredients
                  </p>
                </div>
              )}

              <button
                type="button"
                onClick={addIngredient}
                disabled={inventoryItems.length === 0}
                className="w-full px-4 py-3 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                + Add Ingredient
              </button>

              {inventoryItems.length === 0 && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <p className="text-sm text-yellow-800">
                    ⚠️ No inventory items available. Please add inventory items first from the Inventory section.
                  </p>
                </div>
              )}
            </div>

            <div className="flex gap-3 pt-4 border-t border-gray-200">
              <button
                onClick={() => setStep(4)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
              >
                Back
              </button>
              <button
                onClick={handleSave}
                disabled={loading}
                className="flex-1 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition disabled:opacity-50 font-medium"
              >
                {loading ? 'Saving...' : 'Save Dish & Recipe'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
