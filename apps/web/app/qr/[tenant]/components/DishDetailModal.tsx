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
 * DishDetailModal Component
 * Allows users to:
 * - View full dish details
 * - Select variants (sizes)
 * - Select toppings
 * - Adjust quantity
 * - Add to cart
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
      }, 500);
    } finally {
      setIsAdding(false);
    }
  };

  const toggleTopping = (topping: Topping) => {
    setSelectedToppings((prev) => {
      const isSelected = prev.some((t) => t._id === topping._id || t.name === topping.name);
      if (isSelected) {
        return prev.filter((t) => t._id !== topping._id && t.name !== topping.name);
      } else {
        return [...prev, topping];
      }
    });
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 z-40"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 overflow-y-auto flex items-end">
        <div
          className="w-full bg-white rounded-t-2xl shadow-xl max-h-96 overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="sticky top-0 bg-white border-b border-slate-200 p-4 flex items-start justify-between">
            <div className="flex-1">
              <h2 className="text-xl font-bold text-slate-900">{dish.name}</h2>
              <p className="text-sm text-slate-600 mt-1">{dish.description}</p>
            </div>
            <button
              onClick={onClose}
              className="text-2xl font-light text-slate-500 hover:text-slate-700"
            >
              ✕
            </button>
          </div>

          <div className="p-4">
            {/* Image */}
            {dish.image_url && (
              <div className="relative h-48 bg-slate-100 rounded-lg overflow-hidden mb-4">
                <Image
                  src={dish.image_url}
                  alt={dish.name}
                  fill
                  className="object-cover"
                />
              </div>
            )}

            {/* Dish Info */}
            <div className="mb-4 p-3 bg-slate-50 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-slate-700">Base Price</span>
                <span className="text-lg font-bold text-orange-600">₹{dish.base_price}</span>
              </div>

              {dish.preparation_time_minutes && (
                <div className="flex items-center justify-between text-sm text-slate-600">
                  <span>Prep Time</span>
                  <span>{dish.preparation_time_minutes} min</span>
                </div>
              )}

              {dish.allergens && dish.allergens.length > 0 && (
                <div className="mt-2 pt-2 border-t border-slate-200">
                  <p className="text-xs font-medium text-slate-700 mb-1">Contains:</p>
                  <div className="flex flex-wrap gap-1">
                    {dish.allergens.map((allergen) => (
                      <span
                        key={allergen}
                        className="text-xs bg-red-50 text-red-700 px-2 py-0.5 rounded"
                      >
                        Allergen: {allergen}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Variants/Sizes */}
            {dish.variants && dish.variants.length > 0 && (
              <div className="mb-4">
                <h3 className="font-bold text-slate-900 mb-2">Select Size</h3>
                <div className="space-y-2">
                  {dish.variants.map((variant, idx) => (
                    <button
                      key={idx}
                      onClick={() => setSelectedVariant(variant)}
                      className={`w-full px-4 py-3 rounded-lg border-2 font-medium transition-all ${
                        selectedVariant?.name === variant.name
                          ? 'border-orange-600 bg-orange-50 text-orange-900'
                          : 'border-slate-200 bg-white text-slate-900 hover:border-orange-300'
                      }`}
                    >
                      <span className="flex items-center justify-between">
                        <span>{variant.name}</span>
                        <span className="font-bold">₹{variant.price}</span>
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Toppings */}
            {dish.toppings && dish.toppings.length > 0 && (
              <div className="mb-4">
                <h3 className="font-bold text-slate-900 mb-2">Add Toppings</h3>
                <p className="text-xs text-slate-600 mb-2">Additional charges apply</p>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {dish.toppings.map((topping) => {
                    const isSelected = selectedToppings.some(
                      (t) => t._id === topping._id || t.name === topping.name
                    );
                    return (
                      <button
                        key={topping._id || topping.name}
                        onClick={() => toggleTopping(topping)}
                        className={`w-full px-4 py-2 rounded-lg border-2 text-left font-medium transition-all ${
                          isSelected
                            ? 'border-orange-600 bg-orange-50'
                            : 'border-slate-200 bg-white hover:border-slate-300'
                        }`}
                      >
                        <span className="flex items-center justify-between">
                          <span className="flex items-center gap-2">
                            <span
                              className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                                isSelected
                                  ? 'border-orange-600 bg-orange-600'
                                  : 'border-slate-300'
                              }`}
                            >
                              {isSelected && <span className="text-white text-sm">✓</span>}
                            </span>
                            {topping.name}
                          </span>
                          <span className="text-sm font-bold text-orange-600">
                            +₹{topping.price}
                          </span>
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Quantity Selector */}
            <div className="mb-4 flex items-center gap-4 p-3 bg-slate-50 rounded-lg">
              <span className="font-medium text-slate-900">Quantity</span>
              <div className="flex items-center border border-slate-300 rounded-lg">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="px-3 py-1 text-lg font-bold text-slate-600 hover:bg-slate-100"
                >
                  −
                </button>
                <span className="px-4 py-1 font-bold text-slate-900 min-w-12 text-center">
                  {quantity}
                </span>
                <button
                  onClick={() => setQuantity(quantity + 1)}
                  className="px-3 py-1 text-lg font-bold text-slate-600 hover:bg-slate-100"
                >
                  +
                </button>
              </div>
            </div>

            {/* Price Breakdown */}
            <div className="mb-4 space-y-1 text-sm">
              <div className="flex items-center justify-between text-slate-600">
                <span>Item Price:</span>
                <span>₹{(basePrice * quantity).toFixed(2)}</span>
              </div>
              {selectedToppings.length > 0 && (
                <div className="flex items-center justify-between text-slate-600">
                  <span>Toppings:</span>
                  <span>₹{(toppingPrice * quantity).toFixed(2)}</span>
                </div>
              )}
              <div className="border-t border-slate-200 pt-1 flex items-center justify-between font-bold text-lg text-orange-600">
                <span>Total:</span>
                <span>₹{finalPrice.toFixed(2)}</span>
              </div>
            </div>

            {/* Add to Cart Button */}
            <button
              onClick={handleAddToCart}
              disabled={isAdding}
              className="w-full py-3 bg-orange-600 text-white rounded-lg font-bold text-lg hover:bg-orange-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isAdding ? 'Adding...' : `Add to Cart - ₹${finalPrice.toFixed(2)}`}
            </button>

            {/* Continue Shopping */}
            <button
              onClick={onClose}
              className="w-full mt-2 py-2 border border-slate-300 text-slate-900 rounded-lg font-medium hover:bg-slate-50 transition-all"
            >
              Continue Shopping
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
