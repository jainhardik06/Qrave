'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import Link from 'next/link';

interface InventoryItem {
  _id: string;
  name: string;
  sku: string;
  unit: string;
  cost_per_unit: number;
  current_quantity: number;
}

interface RecipeIngredient {
  item_id: string;
  quantity_per_dish: number;
  unit: string;
  item_name?: string;
  cost_per_unit?: number;
  ingredient_cost?: number;
}

interface Recipe {
  _id: string;
  dish_id: string;
  dish_name: string;
  ingredients: RecipeIngredient[];
  total_cost_per_dish: number;
}

export default function RecipesPage() {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expandedRecipe, setExpandedRecipe] = useState<string | null>(null);

  useEffect(() => {
    fetchRecipes();
  }, []);

  const fetchRecipes = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:3001/api/inventory/recipes', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setRecipes(response.data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch recipes');
    } finally {
      setLoading(false);
    }
  };

  const deleteRecipe = async (dishId: string) => {
    if (!confirm('Are you sure you want to delete this recipe?')) return;

    try {
      await axios.delete(`/api/inventory/recipes/${dishId}`);
      setRecipes(recipes.filter((r) => r.dish_id !== dishId));
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to delete recipe');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-gray-600">Loading recipes...</div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Recipe Management</h1>
        <Link
          href="/dashboard/inventory/recipes/new"
          className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg transition"
        >
          + Add Recipe
        </Link>
      </div>

      {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">{error}</div>}

      {recipes.length === 0 ? (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
          <p className="text-gray-600 mb-4">No recipes created yet</p>
          <Link
            href="/dashboard/inventory/recipes/new"
            className="text-orange-500 hover:text-orange-600 font-medium"
          >
            Create your first recipe
          </Link>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          {recipes.map((recipe) => (
            <div key={recipe._id} className="border-b last:border-b-0">
              <div
                className="p-4 flex justify-between items-center cursor-pointer hover:bg-gray-50"
                onClick={() => setExpandedRecipe(expandedRecipe === recipe._id ? null : recipe._id)}
              >
                <div>
                  <h3 className="font-semibold text-gray-900">{recipe.dish_name}</h3>
                  <p className="text-sm text-gray-600">COGS: ₹{recipe.total_cost_per_dish.toFixed(2)}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-gray-600 text-sm">{recipe.ingredients.length} ingredients</span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setExpandedRecipe(expandedRecipe === recipe._id ? null : recipe._id);
                    }}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    {expandedRecipe === recipe._id ? '▼' : '▶'}
                  </button>
                </div>
              </div>

              {expandedRecipe === recipe._id && (
                <div className="bg-gray-50 p-4 border-t">
                  <div className="mb-4">
                    <h4 className="font-medium text-gray-900 mb-3">Ingredients:</h4>
                    <div className="space-y-2">
                      {recipe.ingredients.map((ing, idx) => (
                        <div key={idx} className="bg-white p-3 rounded border border-gray-200">
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="font-medium text-gray-900">{ing.item_name || 'Unknown Item'}</p>
                              <p className="text-sm text-gray-600">
                                {ing.quantity_per_dish} {ing.unit}
                              </p>
                            </div>
                            <p className="font-medium text-gray-900">₹{ing.ingredient_cost?.toFixed(2) || '0.00'}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Link
                      href={`/dashboard/inventory/recipes/${recipe.dish_id}/edit`}
                      className="flex-1 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded text-center transition"
                    >
                      Edit
                    </Link>
                    <button
                      onClick={() => deleteRecipe(recipe.dish_id)}
                      className="flex-1 bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded transition"
                    >
                      Delete
                    </button>
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
