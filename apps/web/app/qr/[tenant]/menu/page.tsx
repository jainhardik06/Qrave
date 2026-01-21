'use client';

import { useEffect, useState, useMemo, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import { Category, Dish, DishWithCategories, FilterState, CartState, CartItem } from '../types';
import { DishDetailModal } from '../components/DishDetailModal';
import { CartDrawer } from '../components/CartDrawer';

// API base URL from environment
const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001/api';

/**
 * QR Menu Page - Mobile-first Swiggy/Zomato style interface
 * Route: /qr/[tenant]/menu
 * 
 * Features:
 * - SSR fetch of categories and dishes
 * - Mobile-optimized layout
 * - Search, filter, and sort
 * - Multi-category dish duplication
 * - Floating category navigator
 * - Dish cards with variants and badges
 * - Sticky top bar with controls
 * - Cart mini-bar at bottom
 */

export default function QRMenuPage() {
  const params = useParams();
  const router = useRouter();
  const tenant = params?.tenant as string;

  // Data states
  const [categories, setCategories] = useState<Category[]>([]);
  const [dishes, setDishes] = useState<Dish[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter & sort state
  const [filters, setFilters] = useState<FilterState>({
    searchQuery: '',
    vegetarianOnly: false,
    nonVegOnly: false,
    allergenExclusions: [],
    availableOnly: true,
    sortBy: null,
    bestsellerOnly: false,
  });

  const sortLabel =
    filters.sortBy === 'price-low'
      ? 'Price low to high'
      : filters.sortBy === 'price-high'
      ? 'Price high to low'
      : null;

  // Cart state
  const [cart, setCart] = useState<CartState>({
    items: [],
    total: 0,
    itemCount: 0,
  });

  // UI state
  const [showCategorySheet, setShowCategorySheet] = useState(false);
  const [activeCategoryId, setActiveCategoryId] = useState<string | null>(null);
  const [selectedDish, setSelectedDish] = useState<Dish | null>(null);
  const [showDishModal, setShowDishModal] = useState(false);
  const [showCartDrawer, setShowCartDrawer] = useState(false);
  const [showSortMenu, setShowSortMenu] = useState(false);
  const sortButtonRef = useRef<HTMLButtonElement>(null);
  const categoryRefsMap = useRef<{ [key: string]: HTMLDivElement | null }>({});

  // Fetch data on mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Build headers
        const headers: HeadersInit = {
          'X-Tenant': tenant || '',
        };
        
        const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
        }

        // Fetch categories
        const catRes = await fetch(`${API_BASE}/categories`, {
          headers,
        });

        if (!catRes.ok) {
          throw new Error(`Failed to fetch categories: ${catRes.statusText}`);
        }
        const categoriesData: Category[] = await catRes.json();
        setCategories(categoriesData);

        // Fetch dishes
        const dishRes = await fetch(`${API_BASE}/dishes`, {
          headers,
        });

        if (!dishRes.ok) {
          throw new Error(`Failed to fetch dishes: ${dishRes.statusText}`);
        }
        const dishesData: Dish[] = await dishRes.json();
        setDishes(dishesData);

        // Set first category as active if available
        if (categoriesData.length > 0) {
          setActiveCategoryId(categoriesData[0]._id);
        }
      } catch (err) {
        console.error('Error fetching QR menu data:', err);
        setError(err instanceof Error ? err.message : 'Failed to load menu');
      } finally {
        setLoading(false);
      }
    };

    if (tenant) {
      fetchData();
    }
  }, [tenant]);

  // Memoized filtered and sorted dishes
  const filteredAndSortedDishes = useMemo(() => {
    let filtered = [...dishes];

    // Search filter
    if (filters.searchQuery) {
      const query = filters.searchQuery.toLowerCase();
      filtered = filtered.filter(
        (d) =>
          d.name.toLowerCase().includes(query) ||
          d.description?.toLowerCase().includes(query)
      );
    }

    // Vegetarian filter - use dietary_tags
    if (filters.vegetarianOnly) {
      filtered = filtered.filter((d) => d.dietary_tags?.includes('vegetarian'));
    }

    // Non-veg filter - use dietary_tags (NOT vegetarian)
    if (filters.nonVegOnly) {
      filtered = filtered.filter((d) => !d.dietary_tags?.includes('vegetarian'));
    }

    // Bestseller filter
    if (filters.bestsellerOnly) {
      filtered = filtered.filter((d) => d.is_bestseller);
    }

    // Allergen exclusion
    if (filters.allergenExclusions.length > 0) {
      filtered = filtered.filter((d) => {
        const dishAllergens = d.allergens || [];
        return !filters.allergenExclusions.some((allergen) =>
          dishAllergens.includes(allergen)
        );
      });
    }

    // Availability filter
    if (filters.availableOnly) {
      filtered = filtered.filter((d) => d.is_available !== false);
    }

    // Sort
    if (filters.sortBy) {
      switch (filters.sortBy) {
        case 'price-low':
          filtered.sort((a, b) => a.base_price - b.base_price);
          break;
        case 'price-high':
          filtered.sort((a, b) => b.base_price - a.base_price);
          break;
      }
    }

    return filtered;
  }, [dishes, filters]);

  // Build category-wise organized dishes (with duplication for multi-category)
  const organizeDishesByCategory = useMemo(() => {
    const organized: { [categoryId: string]: DishWithCategories[] } = {};

    // Add "Bestsellers" synthetic category
    const bestsellers = filteredAndSortedDishes.filter((d) => d.is_bestseller);
    if (bestsellers.length > 0) {
      organized['bestsellers'] = bestsellers.map((d) => ({
        ...d,
        displayCategoryId: 'bestsellers',
      }));
    }

    // Add dishes to their actual categories (duplication if multi-category)
    categories.forEach((cat) => {
      organized[cat._id] = filteredAndSortedDishes
        .filter((d) => d.category_ids.includes(cat._id))
        .map((d) => ({
          ...d,
          displayCategoryId: cat._id,
        }));
    });

    return organized;
  }, [filteredAndSortedDishes, categories]);

  // Scroll to category section
  const scrollToCategory = (categoryId: string) => {
    const ref = categoryRefsMap.current[categoryId];
    if (ref) {
      const headerOffset = 80;
      const elementPosition = ref.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
      
      setActiveCategoryId(categoryId);
      setShowCategorySheet(false);
    }
  };

  const computeCartTotals = (items: CartItem[]): CartState => {
    const total = items.reduce((sum, i) => sum + i.price, 0);
    const itemCount = items.reduce((sum, i) => sum + i.quantity, 0);
    return { items, total, itemCount };
  };

  // Persist cart to localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('qrave_cart', JSON.stringify(cart));
    }
  }, [cart]);

  // Add to cart handler
  const handleAddToCart = (item: CartItem) => {
    setCart((prev) => {
      const unitPrice = item.unitPrice ?? item.price / item.quantity;
      // Check if item already exists (same dish, variant, toppings)
      const existingIndex = prev.items.findIndex(
        (existingItem) =>
          existingItem.dishId === item.dishId &&
          existingItem.selectedVariant?.name === item.selectedVariant?.name
      );

      let updatedItems: CartItem[];
      if (existingIndex > -1) {
        // Update quantity
        updatedItems = [...prev.items];
        const existing = updatedItems[existingIndex];
        const finalUnit = unitPrice || existing.unitPrice || existing.price / existing.quantity;
        const newQty = existing.quantity + item.quantity;
        updatedItems[existingIndex] = {
          ...existing,
          quantity: newQty,
          unitPrice: finalUnit,
          price: finalUnit * newQty,
        };
      } else {
        // Add new item
        updatedItems = [
          ...prev.items,
          {
            ...item,
            unitPrice,
            price: unitPrice * item.quantity,
          },
        ];
      }

      return computeCartTotals(updatedItems);
    });

    // Show success feedback (optional toast here)
    console.log('Item added to cart:', item);
  };

  const updateCartQuantity = (dishId: string, variantName: string | undefined, delta: number) => {
    setCart((prev) => {
      const updated = prev.items
        .map((item) => {
          if (
            item.dishId === dishId &&
            item.selectedVariant?.name === variantName
          ) {
            const unit = item.unitPrice ?? item.price / Math.max(item.quantity, 1);
            const newQty = item.quantity + delta;
            if (newQty <= 0) return null;
            return {
              ...item,
              quantity: newQty,
              unitPrice: unit,
              price: unit * newQty,
            };
          }
          return item;
        })
        .filter((i): i is CartItem => Boolean(i));

      return computeCartTotals(updated);
    });
  };

  const removeCartItem = (dishId: string, variantName: string | undefined) => {
    setCart((prev) => {
      const updated = prev.items.filter(
        (item) =>
          !(item.dishId === dishId && item.selectedVariant?.name === variantName)
      );
      return computeCartTotals(updated);
    });
  };

  // Open dish detail modal
  const openDishModal = (dish: Dish) => {
    setSelectedDish(dish);
    setShowDishModal(true);
  };

  // Loading skeleton
  if (loading) {
    return (
      <div className="w-full min-h-screen bg-white">
        <div className="animate-pulse">
          {/* Header skeleton */}
          <div className="h-40 bg-slate-200"></div>

          {/* Filter bar skeleton */}
          <div className="h-12 bg-slate-100"></div>

          {/* Card skeletons */}
          <div className="p-4 space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-64 bg-slate-200 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="w-full min-h-screen bg-white flex items-center justify-center p-4">
        <div className="text-center">
          <h2 className="text-xl font-bold text-red-600 mb-2">Error</h2>
          <p className="text-slate-600 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen bg-white flex flex-col pb-20">
      {/* HEADER SECTION */}
      <div className="sticky top-0 z-40 bg-white border-b border-slate-200 shadow-sm">
        {/* Top search row */}
        <div className="px-3 sm:px-4 pt-3 pb-2 bg-gradient-to-r from-orange-50 to-amber-50">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="flex-1 h-10 sm:h-11 bg-white rounded-2xl shadow-sm px-2.5 sm:px-3 flex items-center gap-2.5 sm:gap-3 border border-slate-100 ring-1 ring-transparent focus-within:ring-orange-200 transition-all">
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.75"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-slate-500 flex-shrink-0"
              >
                <path d="M11 4a7 7 0 1 0 0 14 7 7 0 0 0 0-14Z" />
                <path d="m20 20-3.5-3.5" />
              </svg>
              <input
                type="text"
                placeholder="Search dishes..."
                value={filters.searchQuery}
                onChange={(e) =>
                  setFilters((prev) => ({
                    ...prev,
                    searchQuery: e.target.value,
                  }))
                }
                className="flex-1 text-xs sm:text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none"
              />
            </div>

            <button
              onClick={() => router.push(`/qr/${tenant}/checkout`)}
              className="relative w-12 h-12 rounded-xl bg-white shadow-sm flex items-center justify-center text-slate-700 border border-slate-100 hover:border-orange-200 hover:text-orange-600 transition-colors flex-shrink-0"
              aria-label="View cart"
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.9"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="9" cy="20" r="1.2" />
                <circle cx="17" cy="20" r="1.2" />
                <path d="M3 4h2l1.6 9.2a1 1 0 0 0 1 .8h8.8a1 1 0 0 0 1-.7l1-3.3H7.1" />
              </svg>
              {cart.itemCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] px-1 rounded-full bg-orange-600 text-white text-[10px] font-semibold leading-[18px] text-center shadow">{cart.itemCount}</span>
              )}
            </button>
          </div>
        </div>

        {/* Quick Filter Chips */}
        <div className="px-3 py-2 flex overflow-x-auto gap-2 scrollbar-hide">
          {/* Sort pill with dropdown */}
          <div className="relative">
            <button
              ref={sortButtonRef}
              onClick={() => setShowSortMenu((s) => !s)}
              className={`flex items-center gap-2 px-3 py-2 rounded-2xl text-[12px] font-semibold whitespace-nowrap border shadow-sm transition-colors ${
                showSortMenu || sortLabel ? 'border-orange-500 text-orange-700 bg-orange-50' : 'border-slate-200 text-slate-800 bg-white'
              }`}
              aria-haspopup="menu"
              aria-expanded={showSortMenu}
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-current"
              >
                <path d="M6 4h12" />
                <path d="M6 10h9" />
                <path d="M6 16h6" />
              </svg>
              {sortLabel && <span>{sortLabel}</span>}
            </button>
          </div>
          
          {showSortMenu && (
            <>
              <div 
                className="fixed inset-0 z-[60]" 
                onClick={() => setShowSortMenu(false)}
              />
              <div 
                className="fixed w-48 rounded-xl bg-white shadow-2xl border border-slate-200 z-[70] p-1"
                style={{
                  left: sortButtonRef.current ? `${sortButtonRef.current.getBoundingClientRect().left}px` : '0',
                  top: sortButtonRef.current ? `${sortButtonRef.current.getBoundingClientRect().bottom + 8}px` : '0'
                }}
              >
                <button
                  onClick={() => {
                    setFilters((prev) => ({ ...prev, sortBy: 'price-low' }));
                    setShowSortMenu(false);
                  }}
                  className={`w-full text-left px-3 py-2 rounded-lg text-[12px] font-semibold transition-colors ${
                    filters.sortBy === 'price-low'
                      ? 'bg-orange-50 text-orange-700'
                      : 'text-slate-800 hover:bg-slate-50'
                  }`}
                >
                  Price low to high
                </button>
                <button
                  onClick={() => {
                    setFilters((prev) => ({ ...prev, sortBy: 'price-high' }));
                    setShowSortMenu(false);
                  }}
                  className={`w-full text-left px-3 py-2 rounded-lg text-[12px] font-semibold transition-colors ${
                    filters.sortBy === 'price-high'
                      ? 'bg-orange-50 text-orange-700'
                      : 'text-slate-800 hover:bg-slate-50'
                  }`}
                >
                  Price high to low
                </button>
                <button
                  onClick={() => {
                    setFilters((prev) => ({ ...prev, sortBy: null }));
                    setShowSortMenu(false);
                  }}
                  className="w-full text-left px-3 py-2 rounded-lg text-[12px] font-semibold text-slate-500 hover:bg-slate-50"
                >
                  Clear sort
                </button>
              </div>
            </>
          )}

          {/* Veg switch */}
          <button
            onClick={() =>
              setFilters((prev) => ({
                ...prev,
                vegetarianOnly: !prev.vegetarianOnly,
                nonVegOnly: false,
              }))
            }
            className={`px-3 py-2 rounded-2xl text-[12px] font-semibold whitespace-nowrap border transition-all flex items-center gap-2.5 shadow-sm ${
              filters.vegetarianOnly
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                : 'bg-white text-slate-800 border-slate-200'
            }`}
          >
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-sm border border-emerald-500" />
              <span>Veg</span>
            </span>
            <span
              className={`w-9 h-5 rounded-full transition-colors ${
                filters.vegetarianOnly ? 'bg-emerald-500' : 'bg-slate-200'
              } flex items-center px-0.5`}
            >
              <span
                className={`h-4 w-4 bg-white rounded-full shadow transition-transform ${
                  filters.vegetarianOnly ? 'translate-x-4' : 'translate-x-0'
                }`}
              />
            </span>
          </button>

          {/* Non-veg switch */}
          <button
            onClick={() =>
              setFilters((prev) => ({
                ...prev,
                nonVegOnly: !prev.nonVegOnly,
                vegetarianOnly: false,
              }))
            }
            className={`px-3 py-2 rounded-2xl text-[12px] font-semibold whitespace-nowrap border transition-all flex items-center gap-2.5 shadow-sm ${
              filters.nonVegOnly
                ? 'bg-rose-50 text-rose-700 border-rose-200'
                : 'bg-white text-slate-800 border-slate-200'
            }`}
          >
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-sm border border-rose-500" />
              <span>Non-Veg</span>
            </span>
            <span
              className={`w-9 h-5 rounded-full transition-colors ${
                filters.nonVegOnly ? 'bg-rose-500' : 'bg-slate-200'
              } flex items-center px-0.5`}
            >
              <span
                className={`h-4 w-4 bg-white rounded-full shadow transition-transform ${
                  filters.nonVegOnly ? 'translate-x-4' : 'translate-x-0'
                }`}
              />
            </span>
          </button>

          {/* Bestseller toggle */}
          <button
            onClick={() =>
              setFilters((prev) => ({
                ...prev,
                bestsellerOnly: !prev.bestsellerOnly,
              }))
            }
            className={`px-3 py-2 rounded-2xl text-[12px] font-semibold whitespace-nowrap border transition-all flex items-center gap-2 shadow-sm ${
              filters.bestsellerOnly
                ? 'bg-orange-50 text-orange-700 border-orange-200'
                : 'bg-white text-slate-800 border-slate-200'
            }`}
          >
            <svg
              width="13"
              height="13"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-orange-600"
            >
              <path d="M12 3 9.5 9h-6L8 13l-1.5 6L12 15l5.5 4L16 13l4.5-4h-6Z" />
            </svg>
            <span>Bestseller</span>
          </button>
        </div>
      </div>

      {/* MAIN CONTENT */}
      <div className="flex-1 overflow-y-auto">
        {Object.keys(organizeDishesByCategory).length === 0 ? (
          <div className="p-4 text-center text-slate-600">
            <p>No dishes found. Try adjusting your filters.</p>
          </div>
        ) : (
          Object.entries(organizeDishesByCategory).map(([categoryId, dishList]) => {
            if (dishList.length === 0) return null;

            const categoryName =
              categoryId === 'bestsellers'
                ? 'Bestsellers'
                : categories.find((c) => c._id === categoryId)?.name || categoryId;

            return (
              <div
                key={categoryId}
                ref={(ref) => {
                  if (ref) categoryRefsMap.current[categoryId] = ref;
                }}
                className="py-2"
              >
                {/* Category header */}
                <div className="sticky bg-white/95 backdrop-blur px-4 py-3 z-30 border-b border-slate-100 flex items-center justify-between gap-3">
                  <div className="space-y-0.5">
                    <h2 className="text-[15px] font-semibold text-slate-900 tracking-tight">{categoryName}</h2>
                    <p className="text-[11px] text-slate-500 font-medium">
                      {dishList.length} item{dishList.length === 1 ? '' : 's'}
                    </p>
                  </div>
                  <span className="w-9 h-9 rounded-full border border-slate-200 bg-white text-slate-500 shadow-sm flex items-center justify-center" aria-hidden>
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="m9 6 6 6-6 6" />
                    </svg>
                  </span>
                </div>

                {/* Dish grid - 1 column on mobile, 2 on tablet */}
                <div className="p-3 grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {dishList.map((dish) => (
                    <DishCard
                      key={`${dish._id}-${categoryId}`}
                      dish={dish}
                      onAddToCart={() => openDishModal(dish)}
                    />
                  ))}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* DISH DETAIL MODAL */}
      {selectedDish && (
        <DishDetailModal
          dish={selectedDish}
          isOpen={showDishModal}
          onClose={() => {
            setShowDishModal(false);
            setSelectedDish(null);
          }}
          onAddToCart={handleAddToCart}
        />
      )}

      {/* FLOATING CATEGORY FAB */}
      {categories.length > 0 && (
        <>
          {!showCategorySheet && (
            <button
              onClick={() => setShowCategorySheet(true)}
              className="fixed bottom-6 right-4 w-16 h-16 rounded-full bg-[#0f0f11] text-white shadow-[0_18px_40px_-16px_rgba(0,0,0,0.65)] border border-white/10 flex flex-col items-center justify-center gap-1 hover:scale-105 active:scale-100 transition-transform duration-150 z-50"
              title="Browse categories"
            >
            <svg
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-white"
            >
              <path d="M6.5 6.75h8.75a2 2 0 0 1 2 2v7.5a.75.75 0 0 1-.75.75H7.25a2 2 0 0 1-2-2v-7.5a.75.75 0 0 1 .75-.75Z" />
              <path d="M17.25 9.25h.75a1.75 1.75 0 0 1 1.75 1.75v6.25a.75.75 0 0 1-.75.75H10" />
            </svg>
            <span className="text-[11px] font-semibold tracking-wide">MENU</span>
            </button>
          )}

          {/* Category bottom sheet */}
          {showCategorySheet && (
            <div
              className="fixed inset-0 bg-black/55 z-50 animate-in fade-in duration-200"
              onClick={() => setShowCategorySheet(false)}
            >
              <div
                className="absolute bottom-6 right-4 w-[280px] bg-[#0f1013] text-white rounded-2xl p-4 shadow-[0_14px_40px_-18px_rgba(0,0,0,0.75)] space-y-3 animate-in zoom-in-95 slide-in-from-bottom-2 duration-200 origin-bottom-right"
                onClick={(e) => e.stopPropagation()}
              >
                

                <div className="divide-y divide-white/10">{Object.keys(organizeDishesByCategory).includes('bestsellers') && (
                    <button
                      onClick={() => scrollToCategory('bestsellers')}
                      className="w-full flex items-center justify-between py-3 text-left text-[15px] font-medium text-white/90 hover:text-white"
                    >
                      <span className="flex items-center gap-2">
                        <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-[#3b2b1b] text-[#f2c38f] text-[11px] font-bold">★</span>
                        Bestsellers
                      </span>
                      <span className="text-sm font-semibold text-white/80">{organizeDishesByCategory['bestsellers']?.length || 0}</span>
                    </button>
                  )}

                  {categories.map((cat) => (
                    <button
                      key={cat._id}
                      onClick={() => scrollToCategory(cat._id)}
                      className="w-full flex items-center justify-between py-3 text-left text-[15px] font-medium text-white/90 hover:text-white"
                    >
                      <span className="flex items-center gap-2">
                        {cat.name}
                      </span>
                      <span className="text-sm font-semibold text-white/80">{organizeDishesByCategory[cat._id]?.length || 0}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* CART MINI BAR - REMOVED: Cart icon in header reflects items */}
    </div>
  );
}

/**
 * Dish Card Component
 * Clean Bakingo-style card with square image
 */
function DishCard({
  dish,
  onAddToCart,
}: {
  dish: DishWithCategories;
  onAddToCart: () => void;
}) {
  return (
    <div
      className={`rounded-2xl overflow-hidden bg-white shadow-sm transition-all duration-200 ${
        !dish.is_available ? 'opacity-60' : ''
      }`}
    >
      {/* Square Image Container */}
      <div className="relative w-full aspect-square bg-slate-100 rounded-2xl overflow-hidden">
        {dish.image_url ? (
          <Image
            src={dish.image_url}
            alt={dish.name}
            fill
            className="object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span className="text-sm text-slate-400">No Image</span>
          </div>
        )}

        {!dish.is_available && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <span className="text-white font-semibold text-sm">Out of Stock</span>
          </div>
        )}
      </div>

      {/* Card Content */}
      <div className="p-3 space-y-2.5">
        {/* Badges Row - Veg/Non-veg + Bestseller */}
        <div className="flex items-center gap-2">
          {/* Veg/Non-veg indicator based on dietary_tags */}
          <div className={`w-4 h-4 rounded-sm border flex items-center justify-center ${
            dish.dietary_tags?.includes('vegetarian') ? 'border-green-600' : 'border-red-600'
          }`}>
            <div className={`w-2 h-2 rounded-full ${
              dish.dietary_tags?.includes('vegetarian') ? 'bg-green-600' : 'bg-red-600'
            }`} />
          </div>
          
          {/* Bestseller badge */}
          {dish.is_bestseller && (
            <span className="flex items-center gap-1 text-orange-600 text-xs font-medium">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 3 9.5 9h-6L8 13l-1.5 6L12 15l5.5 4L16 13l4.5-4h-6Z" />
              </svg>
              Bestseller
            </span>
          )}
        </div>

        {/* Dish Name */}
        <h3 className="font-semibold text-sm text-slate-900 leading-tight line-clamp-1">
          {dish.name}
        </h3>

        {/* Price and Add Button Row */}
        <div className="flex items-center justify-between pt-1">
          <span className="text-sm font-bold text-slate-900">
            ₹{dish.base_price}
          </span>
          
          <button
            onClick={onAddToCart}
            disabled={!dish.is_available}
            className={`px-3 py-1 rounded-xl text-sm font-semibold transition-all ${
              dish.is_available
                ? 'bg-white text-emerald-600 border-2 border-emerald-600 hover:bg-emerald-50'
                : 'bg-slate-100 text-slate-400 border-2 border-slate-200 cursor-not-allowed'
            }`}
          >
            ADD
          </button>
        </div>
      </div>
    </div>
  );
}
