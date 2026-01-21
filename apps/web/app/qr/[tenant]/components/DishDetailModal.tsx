'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Dish, DishVariant, Topping, CartItem } from '../types';

interface DishDetailModalProps {
  dish: Dish;
  isOpen: boolean;
  onClose: () => void;
  onAddToCart: (item: CartItem) => void;
}

/**
 * DishDetailModal Component - Swiggy/Zomato style
 * Clean, minimal modal with radio buttons for variants and checkboxes for toppings
 */
export function DishDetailModal({
  dish,
  isOpen,
  onClose,
  onAddToCart,
}: DishDetailModalProps) {
  const [selectedVariant, setSelectedVariant] = useState<DishVariant | null>(
    dish.variants?.[0] || null
  );
  const [selectedToppings, setSelectedToppings] = useState<Topping[]>([]);
  const [quantity, setQuantity] = useState(1);
  const [isAdding, setIsAdding] = useState(false);

  if (!isOpen) return null;

  // Calculate final price
  const basePrice = selectedVariant?.price || dish.base_price;
  const toppingPrice = selectedToppings.reduce((sum, t) => sum + t.price, 0);
  const finalPrice = (basePrice + toppingPrice) * quantity;

  const handleAddToCart = async () => {
    setIsAdding(true);

    try {
      const unitPrice = finalPrice / quantity;
      const cartItem: CartItem = {
        dishId: dish._id,
        dishName: dish.name,
        quantity,
        unitPrice,
        selectedVariant: selectedVariant || undefined,
        selectedToppings: selectedToppings.length > 0 ? selectedToppings : undefined,
        price: finalPrice,
      };

      onAddToCart(cartItem);

      // Reset form
      setQuantity(1);
      setSelectedVariant(dish.variants?.[0] || null);
      setSelectedToppings([]);

      // Close modal after short delay
      setTimeout(() => {
        onClose();
      }, 300);
    } finally {
      setIsAdding(false);
    }
  };

  const toggleTopping = (topping: Topping) => {
    setSelectedToppings((prev) => {
      const toppingId = topping._id || topping.name;
      const isSelected = prev.some((t) => (t._id || t.name) === toppingId);
      if (isSelected) {
        return prev.filter((t) => (t._id || t.name) !== toppingId);
      } else {
        return [...prev, topping];
      }
    });
  };

  const selectAllToppings = () => {
    if (dish.toppings) {
      if (selectedToppings.length === dish.toppings.length) {
        setSelectedToppings([]);
      } else {
        setSelectedToppings([...dish.toppings]);
      }
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 z-[60] animate-in fade-in duration-200"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-[70] flex items-end">
        <div
          className="w-full bg-white rounded-t-[28px] shadow-2xl max-h-[90vh] overflow-hidden flex flex-col animate-in slide-in-from-bottom duration-300"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Fixed Header with Image and Close Button */}
          <div className="relative flex-shrink-0 border-b border-slate-100">
            {/* Dish Image & Name */}
            <div className="p-5 pb-4">
              <div className="flex items-start gap-3">
                {dish.image_url && (
                  <div className="relative w-16 h-16 rounded-xl overflow-hidden bg-slate-100 flex-shrink-0 shadow-sm">
                    <Image
                      src={dish.image_url}
                      alt={dish.name}
                      fill
                      className="object-cover"
                    />
                  </div>
                )}
                <div className="flex-1 min-w-0 pr-10">
                  <h2 className="text-lg font-semibold text-slate-900 leading-tight mb-1">
                    {dish.name}
                  </h2>
                  {dish.description && (
                    <p className="text-sm text-slate-600 leading-relaxed line-clamp-2">
                      {dish.description}
                    </p>
                  )}
                </div>
              </div>

              {/* Additional Info Pills */}
              <div className="flex flex-wrap gap-2 mt-3">
                {dish.preparation_time_minutes && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-100 text-slate-700 rounded-full text-xs font-medium">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10"/>
                      <path d="M12 6v6l4 2"/>
                    </svg>
                    {dish.preparation_time_minutes} min
                  </span>
                )}
                {dish.calories && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-orange-50 text-orange-700 rounded-full text-xs font-medium">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
                    </svg>
                    {dish.calories} cal
                  </span>
                )}
                {dish.allergens && dish.allergens.length > 0 && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-red-50 text-red-700 rounded-full text-xs font-medium">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z"/>
                      <path d="M12 9v4m0 4h.01"/>
                    </svg>
                    Contains allergens
                  </span>
                )}
              </div>
            </div>

            {/* Close Button */}
            <button
              onClick={onClose}
              className="absolute top-5 right-5 w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-700 transition-all"
              aria-label="Close"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 6 6 18M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto px-5 py-4">
            {/* Variants Section */}
            {dish.variants && dish.variants.length > 0 && (
              <div className="mb-5">
                <h3 className="text-base font-semibold text-slate-900 mb-3">
                  {dish.name}
                </h3>
                <p className="text-sm text-slate-600 mb-3">Select any 1</p>
                
                <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
                  {dish.variants.map((variant, idx) => (
                    <button
                      key={idx}
                      onClick={() => setSelectedVariant(variant)}
                      className={`w-full px-4 py-3.5 flex items-center justify-between text-left transition-colors ${
                        idx !== dish.variants!.length - 1 ? 'border-b border-slate-100' : ''
                      } ${
                        selectedVariant?.name === variant.name ? 'bg-orange-50' : 'bg-white hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                          selectedVariant?.name === variant.name
                            ? 'border-orange-600'
                            : 'border-slate-300'
                        }`}>
                          {selectedVariant?.name === variant.name && (
                            <div className="w-2 h-2 rounded-full bg-orange-600" />
                          )}
                        </div>
                        <span className={`text-[15px] font-medium truncate ${
                          selectedVariant?.name === variant.name ? 'text-slate-900' : 'text-slate-700'
                        }`}>
                          {variant.name}
                        </span>
                      </div>
                      <span className="text-sm font-semibold text-slate-900 ml-2">
                        ₹{variant.price}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Toppings Section */}
            {dish.toppings && dish.toppings.length > 0 && (
              <div className="mb-5">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h3 className="text-base font-semibold text-slate-900">
                      Reg Extra Topping
                    </h3>
                    <p className="text-sm text-slate-600">Select upto {dish.toppings.length}</p>
                  </div>
                  <button
                    onClick={selectAllToppings}
                    className="text-sm font-semibold text-orange-600 hover:text-orange-700"
                  >
                    {selectedToppings.length === dish.toppings.length ? 'Deselect All' : 'Select All'}
                  </button>
                </div>

                <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
                  {dish.toppings.map((topping, idx) => {
                    const toppingId = topping._id || topping.name;
                    const isSelected = selectedToppings.some(
                      (t) => (t._id || t.name) === toppingId
                    );
                    return (
                      <button
                        key={toppingId}
                        onClick={() => toggleTopping(topping)}
                        className={`w-full px-4 py-3.5 flex items-center justify-between text-left transition-colors ${
                          idx !== dish.toppings!.length - 1 ? 'border-b border-slate-100' : ''
                        } ${
                          isSelected ? 'bg-green-50' : 'bg-white hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <div className={`w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0 ${
                            isSelected
                              ? 'border-green-600 bg-green-600'
                              : 'border-slate-300'
                          }`}>
                            {isSelected && (
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M20 6 9 17l-5-5" />
                              </svg>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <span className={`text-[15px] font-medium ${
                              isSelected ? 'text-slate-900' : 'text-slate-700'
                            }`}>
                              {topping.name}
                            </span>
                          </div>
                        </div>
                        <span className="text-sm font-semibold text-slate-900 ml-2">
                          + ₹{topping.price}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Fixed Bottom: Quantity & Add Button Side by Side */}
          <div className="flex-shrink-0 border-t border-slate-200 p-4 bg-white">
            <div className="flex items-center gap-3">
              {/* Quantity Controls */}
              <div className="flex items-center bg-white border-2 border-slate-200 rounded-full px-1 py-1">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="w-10 h-10 rounded-full flex items-center justify-center text-emerald-600 font-bold text-xl hover:bg-slate-50 transition-colors"
                  aria-label="Decrease quantity"
                >
                  −
                </button>
                <span className="text-lg font-semibold text-slate-900 min-w-[2.5rem] text-center">
                  {quantity}
                </span>
                <button
                  onClick={() => setQuantity(quantity + 1)}
                  className="w-10 h-10 rounded-full flex items-center justify-center text-emerald-600 font-bold text-xl hover:bg-slate-50 transition-colors"
                  aria-label="Increase quantity"
                >
                  +
                </button>
              </div>

              {/* Add Button */}
              <button
                onClick={handleAddToCart}
                disabled={isAdding}
                className="flex-1 py-3.5 bg-emerald-600 text-white rounded-2xl font-semibold text-base hover:bg-emerald-700 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-emerald-600/20"
              >
                {isAdding ? 'Adding...' : `Add Item | ₹${finalPrice}`}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
