'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import { useRouter, useParams } from 'next/navigation';

interface InventoryItem {
  _id: string;
  name: string;
  sku: string;
  unit: string;
  cost_per_unit: number;
  current_quantity: number;
}

interface Dish {
  _id: string;
  name: string;
}

interface RecipeIngredient {
  item_id: string;
  quantity_per_dish: number;
  unit: string;
}

export default function RecipeFormPage() {
  const router = useRouter();
  const params = useParams();
  const dishId = params.dishId as string;
  const isEdit = dishId && dishId !== 'new';

  const [dishes, setDishes] = useState<Dish[]>([]);
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [selectedDish, setSelectedDish] = useState('');
  const [dishName, setDishName] = useState('');
  const [ingredients, setIngredients] = useState<RecipeIngredient[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [newIngredient, setNewIngredient] = useState({
    item_id: '',
    quantity_per_dish: 0,
  });

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (isEdit && dishId) {
      fetchRecipe();
    }
  }, [isEdit, dishId]);

  const fetchData = async () => {
    try {
      const [dishesRes, itemsRes] = await Promise.all([
        axios.get('/api/menu/dishes'),
        axios.get('/api/inventory/items'),
      ]);
      setDishes(dishesRes.data);
      setItems(itemsRes.data);
    } catch (err: any) {
      setError('Failed to load data');
    }
  };

  const fetchRecipe = async () => {
    try {
      const response = await axios.get(`/api/inventory/recipes/${dishId}`);
      const recipe = response.data;
      setSelectedDish(recipe.dish_id);
      setDishName(recipe.dish_name);
      setIngredients(recipe.ingredients);
    } catch (err: any) {
      setError('Failed to load recipe');
    }
  };

  const addIngredient = () => {
    if (!newIngredient.item_id || newIngredient.quantity_per_dish <= 0) {
      setError('Please select item and quantity');
      return;
    }

    const selectedItem = items.find((i) => i._id === newIngredient.item_id);
    if (!selectedItem) return;

    // Unit will be stored from the inventory item
    // The backend's deductStock will handle conversion if needed
    setIngredients([
      ...ingredients,
      {
        item_id: newIngredient.item_id,
        quantity_per_dish: newIngredient.quantity_per_dish,
        unit: selectedItem.unit, // Store the inventory item's unit
      },
    ]);

    setNewIngredient({ item_id: '', quantity_per_dish: 0 });
    setError(''); // Clear any previous errors
  };

  const removeIngredient = (index: number) => {
    setIngredients(ingredients.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedDish || ingredients.length === 0) {
      setError('Please select a dish and add at least one ingredient');
      return;
    }

    try {
      setLoading(true);
      const payload = {
        dish_id: selectedDish,
        dish_name: dishName || dishes.find((d) => d._id === selectedDish)?.name || '',
        ingredients,
      };

      if (isEdit) {
        await axios.patch(`/api/inventory/recipes/${selectedDish}`, payload);
      } else {
        await axios.post('/api/inventory/recipes', payload);
      }

      router.push('/dashboard/inventory/recipes');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to save recipe');
    } finally {
      setLoading(false);
    }
  };

  const selectedItem = items.find((i) => i._id === newIngredient.item_id);
  
  // Calculate total cost - MUST convert units if recipe unit differs from inventory unit
  const totalCost = ingredients.reduce((sum, ing) => {
    const item = items.find((i) => i._id === ing.item_id);
    if (!item) return sum;
    
    let quantityInItemUnit = ing.quantity_per_dish;
    
    // If recipe unit differs from inventory unit, we need backend unit conversion
    // For now, assume they match (backend handles actual conversion during deduction)
    // TODO: Add client-side unit conversion utility if needed for accurate cost display
    if (ing.unit && ing.unit !== item.unit) {
      // Units don't match - cost calculation may be approximate
      // Backend will handle actual unit conversion during order processing
      console.warn(`Unit mismatch: recipe uses ${ing.unit}, inventory uses ${item.unit}`);
    }
    
    return sum + (quantityInItemUnit * (item?.cost_per_unit || 0));
  }, 0);

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">{isEdit ? 'Edit Recipe' : 'Create Recipe'}</h1>

      {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">{error}</div>}

      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6 space-y-6">
        {/* Dish Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Select Dish *</label>
          <select
            value={selectedDish}
            onChange={(e) => {
              const dishId = e.target.value;
              setSelectedDish(dishId);
              const dish = dishes.find((d) => d._id === dishId);
              setDishName(dish?.name || '');
            }}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
            required
          >
            <option value="">-- Select a dish --</option>
            {dishes.map((dish) => (
              <option key={dish._id} value={dish._id}>
                {dish.name}
              </option>
            ))}
          </select>
        </div>

        {/* Ingredients Section */}
        <div className="border-t pt-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Add Ingredients</h2>

          <div className="space-y-4 mb-6">
            {/* Add New Ingredient */}
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Item *</label>
                  <select
                    value={newIngredient.item_id}
                    onChange={(e) => setNewIngredient({ ...newIngredient, item_id: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-orange-500"
                  >
                    <option value="">-- Select item --</option>
                    {items.map((item) => (
                      <option key={item._id} value={item._id}>
                        {item.name} ({item.sku})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Quantity *</label>
                  <input
                    type="number"
                    step="0.01"
                    value={newIngredient.quantity_per_dish}
                    onChange={(e) => setNewIngredient({ ...newIngredient, quantity_per_dish: parseFloat(e.target.value) })}
                    placeholder="e.g., 50"
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Unit</label>
                  <input
                    type="text"
                    value={selectedItem?.unit || ''}
                    readOnly
                    className="w-full px-3 py-2 border border-gray-300 rounded bg-gray-100 text-gray-600"
                  />
                </div>
              </div>

              <button
                type="button"
                onClick={addIngredient}
                className="w-full bg-orange-500 hover:bg-orange-600 text-white py-2 rounded transition"
              >
                Add Ingredient
              </button>
            </div>

            {/* Listed Ingredients */}
            {ingredients.length > 0 && (
              <div className="space-y-2">
                <h3 className="font-medium text-gray-900">Recipe Ingredients:</h3>
                {ingredients.map((ing, idx) => {
                  const item = items.find((i) => i._id === ing.item_id);
                  const cost = ing.quantity_per_dish * (item?.cost_per_unit || 0);
                  const unitMismatch = ing.unit !== item?.unit;
                  
                  return (
                    <div key={idx} className="flex justify-between items-center bg-white p-3 rounded border border-gray-200">
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">{item?.name}</p>
                        <p className="text-sm text-gray-600">
                          {ing.quantity_per_dish} {ing.unit} @ ₹{item?.cost_per_unit.toFixed(2)}/{item?.unit}
                          {unitMismatch && (
                            <span className="ml-2 text-orange-600 text-xs">
                              ⚠️ Unit stored: {item?.unit}
                            </span>
                          )}
                        </p>
                      </div>
                      <div className="flex items-center gap-4">
                        <p className="font-medium text-gray-900">≈₹{cost.toFixed(2)}</p>
                        <button
                          type="button"
                          onClick={() => removeIngredient(idx)}
                          className="text-red-500 hover:text-red-700 font-medium"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Total Cost */}
          {ingredients.length > 0 && (
            <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
              <div className="flex justify-between items-center">
                <p className="font-semibold text-gray-900">Total COGS Per Dish:</p>
                <p className="text-2xl font-bold text-orange-600">₹{totalCost.toFixed(2)}</p>
              </div>
            </div>
          )}
        </div>

        {/* Buttons */}
        <div className="flex gap-3 pt-6 border-t">
          <button
            type="button"
            onClick={() => router.back()}
            className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading || !selectedDish || ingredients.length === 0}
            className="flex-1 bg-orange-500 hover:bg-orange-600 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg transition"
          >
            {loading ? 'Saving...' : isEdit ? 'Update Recipe' : 'Create Recipe'}
          </button>
        </div>
      </form>
    </div>
  );
}
