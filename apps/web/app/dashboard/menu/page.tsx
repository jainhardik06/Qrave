'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { Plus, Edit2, Trash2 } from 'lucide-react';

interface Category {
  _id: string;
  name: string;
  description?: string;
  icon: string;
  color: string;
  order: number;
  is_active: boolean;
}

interface Dish {
  _id: string;
  name: string;
  category_id: string;
  base_price: number;
  image_url?: string;
  is_bestseller: boolean;
  is_new: boolean;
}

const ICON_OPTIONS = [
  'utensils',
  'pizza',
  'coffee',
  'wine-2',
  'apple',
  'soup',
  'beef',
  'fish',
];

const COLOR_OPTIONS = [
  '#ef4444', // red
  '#f97316', // orange
  '#eab308', // yellow
  '#22c55e', // green
  '#3b82f6', // blue
  '#8b5cf6', // purple
  '#ec4899', // pink
  '#6b7280', // gray
];

export default function MenuPage() {
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [dishes, setDishes] = useState<Dish[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [newCategory, setNewCategory] = useState({
    name: '',
    description: '',
    icon: 'utensils',
    color: '#ef4444',
  });

  const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001/api';
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : '';

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    if (selectedCategory) {
      fetchDishesByCategory(selectedCategory);
    }
  }, [selectedCategory]);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API_BASE}/categories`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setCategories(res.data);
      if (res.data.length > 0) {
        setSelectedCategory(res.data[0]._id);
      }
    } catch (err) {
      console.error('Error fetching categories:', err);
      alert('Failed to load categories');
    } finally {
      setLoading(false);
    }
  };

  const fetchDishesByCategory = async (categoryId: string) => {
    try {
      const res = await axios.get(
        `${API_BASE}/dishes/category/${categoryId}`,
        { headers: { Authorization: `Bearer ${token}` } },
      );
      setDishes(res.data);
    } catch (err) {
      console.error('Error fetching dishes:', err);
    }
  };

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingCategory) {
        const res = await axios.patch(
          `${API_BASE}/categories/${editingCategory._id}`,
          newCategory,
          { headers: { Authorization: `Bearer ${token}` } },
        );
        setCategories(
          categories.map((c) => (c._id === editingCategory._id ? res.data : c)),
        );
        setEditingCategory(null);
      } else {
        const res = await axios.post(`${API_BASE}/categories`, newCategory, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setCategories([...categories, res.data]);
        setSelectedCategory(res.data._id);
      }
      setNewCategory({
        name: '',
        description: '',
        icon: 'utensils',
        color: '#ef4444',
      });
      setShowCategoryModal(false);
    } catch (err) {
      console.error('Error saving category:', err);
      alert('Failed to save category');
    }
  };

  const handleDeleteCategory = async (id: string) => {
    if (!window.confirm('Delete this category?')) return;
    try {
      await axios.delete(`${API_BASE}/categories/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const newCategories = categories.filter((c) => c._id !== id);
      setCategories(newCategories);
      if (selectedCategory === id) {
        setSelectedCategory(newCategories[0]?._id || null);
      }
    } catch (err) {
      console.error('Error deleting category:', err);
      alert('Failed to delete category');
    }
  };

  const handleEditCategory = (category: Category) => {
    setEditingCategory(category);
    setNewCategory({
      name: category.name,
      description: category.description || '',
      icon: category.icon,
      color: category.color,
    });
    setShowCategoryModal(true);
  };

  const handleAddDish = () => {
    router.push(`/dashboard/menu/dishes/new`);
  };

  const handleEditDish = (dishId: string) => {
    router.push(`/dashboard/menu/dishes/${dishId}`);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-600">Loading menu...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="border-b border-gray-200 px-8 py-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-gray-900">Menu Management</h1>
          <button
            onClick={() => {
              setEditingCategory(null);
              setNewCategory({
                name: '',
                description: '',
                icon: 'utensils',
                color: '#ef4444',
              });
              setShowCategoryModal(true);
            }}
            className="flex items-center gap-2 bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition"
          >
            <Plus size={20} />
            New Category
          </button>
        </div>
      </div>

      {/* Categories */}
      <div className="border-b border-gray-200 bg-gray-50 px-8 py-4 overflow-x-auto">
        <div className="flex gap-3">
          {categories.map((cat) => (
            <div
              key={cat._id}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg cursor-pointer transition ${
                selectedCategory === cat._id
                  ? `text-white`
                  : 'bg-white text-gray-700 border border-gray-200 hover:border-gray-300'
              }`}
              style={
                selectedCategory === cat._id ? { backgroundColor: cat.color } : {}
              }
              onClick={() => setSelectedCategory(cat._id)}
            >
              <span>{cat.icon}</span>
              <span className="font-medium">{cat.name}</span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleEditCategory(cat);
                }}
                className={`ml-2 p-1 rounded hover:bg-opacity-20 ${
                  selectedCategory === cat._id
                    ? 'hover:bg-white'
                    : 'hover:bg-gray-300'
                }`}
              >
                <Edit2 size={16} />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleDeleteCategory(cat._id);
                }}
                className={`p-1 rounded hover:bg-opacity-20 ${
                  selectedCategory === cat._id
                    ? 'hover:bg-white'
                    : 'hover:bg-red-300'
                }`}
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Dishes Section */}
      <div className="px-8 py-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">
            {categories.find((c) => c._id === selectedCategory)?.name || 'Dishes'}
          </h2>
          <button
            onClick={handleAddDish}
            className="flex items-center gap-2 bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition"
          >
            <Plus size={20} />
            Add Dish
          </button>
        </div>

        {dishes.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">
              No dishes in this category yet
            </p>
            <button
              onClick={handleAddDish}
              className="mt-4 text-blue-500 hover:text-blue-600 font-medium"
            >
              Add the first dish
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {dishes.map((dish) => (
              <div
                key={dish._id}
                className="bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition cursor-pointer"
                onClick={() => handleEditDish(dish._id)}
              >
                {dish.image_url && (
                  <img
                    src={dish.image_url}
                    alt={dish.name}
                    className="w-full h-40 object-cover"
                  />
                )}
                <div className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-bold text-gray-900">{dish.name}</h3>
                    <div className="flex gap-1">
                      {dish.is_bestseller && (
                        <span className="bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded-full">
                          Bestseller
                        </span>
                      )}
                      {dish.is_new && (
                        <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
                          New
                        </span>
                      )}
                    </div>
                  </div>
                  <p className="text-lg font-bold text-red-500">
                    ₹{dish.base_price.toFixed(2)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Category Modal */}
      {showCategoryModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              {editingCategory ? 'Edit Category' : 'New Category'}
            </h2>
            <form onSubmit={handleAddCategory}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Category Name
                  </label>
                  <input
                    type="text"
                    required
                    value={newCategory.name}
                    onChange={(e) =>
                      setNewCategory({ ...newCategory, name: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                    placeholder="e.g., Pizzas, Desserts"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    value={newCategory.description}
                    onChange={(e) =>
                      setNewCategory({
                        ...newCategory,
                        description: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                    placeholder="Optional description"
                    rows={2}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Icon
                  </label>
                  <div className="grid grid-cols-4 gap-2">
                    {ICON_OPTIONS.map((icon) => (
                      <button
                        key={icon}
                        type="button"
                        onClick={() =>
                          setNewCategory({ ...newCategory, icon })
                        }
                        className={`p-3 rounded-lg border-2 text-xl transition ${
                          newCategory.icon === icon
                            ? 'border-red-500 bg-red-50'
                            : 'border-gray-200'
                        }`}
                      >
                        {icon === 'utensils' && '🍽️'}
                        {icon === 'pizza' && '🍕'}
                        {icon === 'coffee' && '☕'}
                        {icon === 'wine-2' && '🍷'}
                        {icon === 'apple' && '🍎'}
                        {icon === 'soup' && '🍲'}
                        {icon === 'beef' && '🥩'}
                        {icon === 'fish' && '🐟'}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Color
                  </label>
                  <div className="grid grid-cols-4 gap-2">
                    {COLOR_OPTIONS.map((color) => (
                      <button
                        key={color}
                        type="button"
                        onClick={() =>
                          setNewCategory({ ...newCategory, color })
                        }
                        className={`w-10 h-10 rounded-lg border-2 transition ${
                          newCategory.color === color
                            ? 'border-gray-900'
                            : 'border-gray-300'
                        }`}
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowCategoryModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition"
                >
                  {editingCategory ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
