'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { Plus, Edit2, Trash2, Search, Grid3x3, Clock, Star } from 'lucide-react';

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
  category_ids?: string[];
  category_id?: string;
  base_price?: number;
  price?: number;
  image_url?: string;
  is_bestseller?: boolean;
  is_new?: boolean;
  description?: string;
  variants?: any[];
  preparation_time_minutes?: number;
}

const ICON_MAP: Record<string, string> = {
  utensils: '🍽️',
  pizza: '🍕',
  coffee: '☕',
  'wine-2': '🍷',
  apple: '🍎',
  soup: '🍲',
  beef: '🥩',
  fish: '🐟',
};

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

const ICON_OPTIONS = Object.keys(ICON_MAP);

export default function MenuPage() {
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [allDishes, setAllDishes] = useState<Dish[]>([]);
  const [filteredDishes, setFilteredDishes] = useState<Dish[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [newCategory, setNewCategory] = useState({
    name: '',
    description: '',
    icon: 'utensils',
    color: '#ef4444',
  });

  const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001/api';
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : '';

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (!allDishes.length) return;
    filterDishes();
  }, [selectedCategory, searchQuery, allDishes]);

  const fetchData = async () => {
    try {
      setLoading(true);
      console.log('🔄 Fetching menu data from:', API_BASE);
      console.log('📌 Token available:', !!token);

      const [categoriesRes, dishesRes] = await Promise.all([
        axios.get(`${API_BASE}/categories`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        axios.get(`${API_BASE}/dishes`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      console.log('✅ Categories fetched:', categoriesRes.data);
      console.log('✅ Dishes fetched:', dishesRes.data);

      setCategories(categoriesRes.data || []);
      setAllDishes(dishesRes.data || []);
    } catch (err: any) {
      console.error('❌ Error fetching data:', err.response?.data || err.message);
      const errorMsg = err?.response?.data?.message || err?.message || 'Failed to load menu data';
      alert(`Error: ${errorMsg}`);
    } finally {
      setLoading(false);
    }
  };

  const filterDishes = () => {
    let filtered = allDishes;

    // Filter by category
    if (selectedCategory !== 'all') {
      filtered = filtered.filter((dish) => {
        if (dish.category_ids) {
          return dish.category_ids.includes(selectedCategory);
        }
        return dish.category_id === selectedCategory;
      });
    }

    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter((dish) =>
        dish.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    setFilteredDishes(filtered);
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
      }
      setNewCategory({
        name: '',
        description: '',
        icon: 'utensils',
        color: '#ef4444',
      });
      setShowCategoryModal(false);
      fetchData(); // Refresh data
    } catch (err: any) {
      console.error('Error saving category:', err);
      alert(err?.response?.data?.message || 'Failed to save category');
    }
  };

  const handleDeleteCategory = async (id: string) => {
    if (!window.confirm('Delete this category?')) return;
    try {
      await axios.delete(`${API_BASE}/categories/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setCategories(categories.filter((c) => c._id !== id));
      if (selectedCategory === id) {
        setSelectedCategory('all');
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

  const getDishPrice = (dish: Dish) => {
    return dish.base_price || dish.price || 0;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-red-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Loading your menu...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 mb-2">Menu Management</h1>
              <p className="text-gray-600">Organize your dishes and categories</p>
            </div>
            <div className="flex gap-3">
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
                className="flex items-center gap-2 bg-white border-2 border-red-500 text-red-500 px-5 py-3 rounded-xl hover:bg-red-50 transition-all font-medium shadow-sm hover:shadow-md"
              >
                <Plus size={20} />
                New Category
              </button>
              <button
                onClick={() => router.push('/dashboard/menu/dishes/new')}
                className="flex items-center gap-2 bg-red-500 text-white px-5 py-3 rounded-xl hover:bg-red-600 transition-all font-medium shadow-md hover:shadow-lg"
              >
                <Plus size={20} />
                Add Dish
              </button>
            </div>
          </div>

          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search dishes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
            />
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Categories Filter */}
        <div className="mb-8">
          <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wider mb-4">Filter by Category</h2>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`px-5 py-3 rounded-xl font-medium transition-all ${
                selectedCategory === 'all'
                  ? 'bg-gray-900 text-white shadow-lg'
                  : 'bg-white text-gray-700 border border-gray-300 hover:border-gray-400 shadow-sm'
              }`}
            >
              All Items ({allDishes.length})
            </button>
            {categories.map((cat) => (
              <div
                key={cat._id}
                className={`px-5 py-3 rounded-xl font-medium transition-all flex items-center gap-2 ${
                  selectedCategory === cat._id
                    ? 'text-white shadow-lg'
                    : 'bg-white text-gray-700 border border-gray-300 hover:border-gray-400 shadow-sm'
                }`}
                style={
                  selectedCategory === cat._id ? { backgroundColor: cat.color } : {}
                }
              >
                <div
                  onClick={() => setSelectedCategory(cat._id)}
                  className="flex items-center gap-2 flex-1 cursor-pointer"
                >
                  <span className="text-xl">{ICON_MAP[cat.icon] || '🍽️'}</span>
                  <span>{cat.name}</span>
                  <span className="text-xs opacity-75">
                    ({allDishes.filter((d) => d.category_ids?.includes(cat._id) || d.category_id === cat._id).length})
                  </span>
                </div>
                <div className="flex gap-1 ml-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleEditCategory(cat);
                    }}
                    className="p-1 hover:bg-white hover:bg-opacity-20 rounded"
                  >
                    <Edit2 size={14} />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteCategory(cat._id);
                    }}
                    className="p-1 hover:bg-white hover:bg-opacity-20 rounded"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Dishes Grid */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-gray-900">
              {selectedCategory === 'all'
                ? 'All Dishes'
                : categories.find((c) => c._id === selectedCategory)?.name || 'Dishes'}
            </h2>
            <p className="text-gray-600">{filteredDishes.length} items</p>
          </div>

          {filteredDishes.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-2xl shadow-sm">
              <div className="text-6xl mb-4">🍽️</div>
              <p className="text-gray-500 text-lg mb-4">No dishes found</p>
              <button
                onClick={() => router.push('/dashboard/menu/dishes/new')}
                className="text-red-500 hover:text-red-600 font-medium"
              >
                Add your first dish
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredDishes.map((dish) => (
                <div
                  key={dish._id}
                  onClick={() => router.push(`/dashboard/menu/dishes/${dish._id}`)}
                  className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 cursor-pointer transform hover:-translate-y-1 border border-gray-100"
                >
                  {/* Image */}
                  <div className="relative h-48 bg-gradient-to-br from-gray-100 to-gray-200 overflow-hidden">
                    {dish.image_url ? (
                      <img
                        src={dish.image_url}
                        alt={dish.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-6xl">
                        🍽️
                      </div>
                    )}
                    {/* Delete Button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (confirm('Are you sure you want to delete this dish?')) {
                          const token = localStorage.getItem('token');
                          axios.delete(`http://localhost:3001/api/dishes/${dish._id}`, {
                            headers: { Authorization: `Bearer ${token}` },
                          }).then(() => {
                            fetchData();
                          }).catch((error) => {
                            console.error('Error deleting dish:', error);
                            alert('Failed to delete dish');
                          });
                        }
                      }}
                      className="absolute top-3 left-3 p-2 bg-red-500 text-white rounded-full shadow-lg hover:bg-red-600 transition z-10"
                    >
                      <Trash2 size={16} />
                    </button>
                    
                    {/* Badges */}
                    <div className="absolute top-3 right-3 flex flex-col gap-2">
                      {dish.is_bestseller && (
                        <span className="bg-yellow-400 text-yellow-900 text-xs px-3 py-1 rounded-full font-bold flex items-center gap-1 shadow-lg">
                          <Star size={12} fill="currentColor" />
                          Bestseller
                        </span>
                      )}
                      {dish.is_new && (
                        <span className="bg-green-400 text-green-900 text-xs px-3 py-1 rounded-full font-bold shadow-lg">
                          NEW
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-5">
                    <h3 className="font-bold text-gray-900 text-lg mb-2 line-clamp-1">
                      {dish.name}
                    </h3>
                    {dish.description && (
                      <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                        {dish.description}
                      </p>
                    )}
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-baseline gap-1">
                        <span className="text-2xl font-bold text-red-500">
                          ₹{Math.round(getDishPrice(dish))}
                        </span>
                        {dish.variants && dish.variants.length > 0 && (
                          <span className="text-xs text-gray-500">onwards</span>
                        )}
                      </div>
                      
                      {dish.preparation_time_minutes && (
                        <div className="flex items-center gap-1 text-gray-500 text-xs">
                          <Clock size={14} />
                          <span>{dish.preparation_time_minutes}min</span>
                        </div>
                      )}
                    </div>

                    {dish.variants && dish.variants.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-gray-100">
                        <div className="flex items-center gap-1 text-xs text-gray-600">
                          <Grid3x3 size={14} />
                          <span>{dish.variants.length} variants available</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Category Modal */}
      {showCategoryModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-8 w-full max-w-md shadow-2xl">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              {editingCategory ? 'Edit Category' : 'New Category'}
            </h2>
            <form onSubmit={handleAddCategory} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Category Name *
                </label>
                <input
                  type="text"
                  required
                  value={newCategory.name}
                  onChange={(e) =>
                    setNewCategory({ ...newCategory, name: e.target.value })
                  }
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500"
                  placeholder="e.g., Pizzas, Desserts"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
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
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500"
                  placeholder="Optional description"
                  rows={2}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Icon
                </label>
                <div className="grid grid-cols-4 gap-3">
                  {ICON_OPTIONS.map((icon) => (
                    <button
                      key={icon}
                      type="button"
                      onClick={() =>
                        setNewCategory({ ...newCategory, icon })
                      }
                      className={`p-4 rounded-xl border-2 text-3xl transition-all ${
                        newCategory.icon === icon
                          ? 'border-red-500 bg-red-50 scale-110'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      {ICON_MAP[icon]}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Color
                </label>
                <div className="grid grid-cols-4 gap-3">
                  {COLOR_OPTIONS.map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() =>
                        setNewCategory({ ...newCategory, color })
                      }
                      className={`h-12 rounded-xl border-4 transition-all ${
                        newCategory.color === color
                          ? 'border-gray-900 scale-110'
                          : 'border-white hover:border-gray-300'
                      }`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowCategoryModal(false);
                    setEditingCategory(null);
                  }}
                  className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-3 bg-red-500 text-white rounded-xl hover:bg-red-600 transition font-medium shadow-lg"
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
