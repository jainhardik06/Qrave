"use client";

import { CartItem, CartState } from '../types';

interface CartDrawerProps {
  isOpen: boolean;
  cart: CartState;
  onClose: () => void;
  onUpdateQuantity: (item: CartItem, delta: number) => void;
  onRemove: (item: CartItem) => void;
}

export function CartDrawer({ isOpen, cart, onClose, onUpdateQuantity, onRemove }: CartDrawerProps) {
  if (!isOpen) return null;

  const hasItems = cart.items.length > 0;

  return (
    <div className="fixed inset-0 z-50">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-[2px]"
        onClick={onClose}
      />

      <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-3xl shadow-xl max-h-[80vh] overflow-y-auto animate-[slideUp_0.18s_ease-out]">
        <div className="px-5 pt-5 pb-3 border-b border-slate-200 flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-wide text-slate-500">Your Cart</p>
            <h3 className="text-lg font-semibold text-slate-900">{cart.itemCount} item{cart.itemCount !== 1 ? 's' : ''}</h3>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-full border border-slate-200 flex items-center justify-center text-slate-500 hover:text-slate-800 transition-colors"
            aria-label="Close cart"
          >
            ×
          </button>
        </div>

        {!hasItems && (
          <div className="p-6 text-center text-slate-500">
            <p className="font-medium">Your cart is empty</p>
            <p className="text-sm mt-1">Add some dishes to get started.</p>
          </div>
        )}

        {hasItems && (
          <div className="divide-y divide-slate-100">
            {cart.items.map((item) => {
              const key = `${item.dishId}-${item.selectedVariant?.name || 'base'}`;
              const perUnit = item.unitPrice ?? item.price / Math.max(item.quantity, 1);
              return (
                <div key={key} className="p-4 flex items-start gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h4 className="font-semibold text-slate-900 truncate">{item.dishName}</h4>
                      <button
                        onClick={() => onRemove(item)}
                        className="text-xs text-red-500 hover:text-red-600"
                      >
                        Remove
                      </button>
                    </div>
                    {item.selectedVariant && (
                      <p className="text-xs text-slate-500 mt-0.5">{item.selectedVariant.name}</p>
                    )}
                    {item.selectedToppings && item.selectedToppings.length > 0 && (
                      <p className="text-xs text-slate-500 mt-1 truncate">
                        + {item.selectedToppings.map((t) => t.name).join(', ')}
                      </p>
                    )}

                    <div className="mt-3 flex items-center justify-between">
                      <div className="flex items-center gap-2 text-slate-800">
                        <span className="text-sm font-semibold">₹{item.price.toFixed(0)}</span>
                        <span className="text-xs text-slate-500">(₹{perUnit.toFixed(0)} ea)</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => onUpdateQuantity(item, -1)}
                          className="w-8 h-8 rounded-full border border-slate-200 text-slate-700 flex items-center justify-center hover:border-slate-300"
                          aria-label="Decrease quantity"
                        >
                          −
                        </button>
                        <span className="text-sm font-semibold text-slate-900 min-w-[20px] text-center">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => onUpdateQuantity(item, 1)}
                          className="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center hover:bg-emerald-700"
                          aria-label="Increase quantity"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {hasItems && (
          <div className="p-5 border-t border-slate-200 space-y-3">
            <div className="flex items-center justify-between text-sm text-slate-700">
              <span>Subtotal</span>
              <span className="font-semibold text-slate-900">₹{cart.total.toFixed(0)}</span>
            </div>
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span>Taxes & fees are calculated at checkout</span>
            </div>
            <button
              className="w-full mt-1 bg-orange-600 text-white py-3 rounded-xl font-semibold shadow-md hover:bg-orange-700 transition-colors"
            >
              Proceed to Checkout
            </button>
            <button
              onClick={onClose}
              className="w-full py-2 text-sm font-medium text-slate-700 hover:text-slate-900"
            >
              Continue browsing
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// Simple slide-up keyframes
const styles = `@keyframes slideUp { from { transform: translateY(12px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }`;
if (typeof document !== 'undefined' && !document.getElementById('cart-drawer-anim')) {
  const style = document.createElement('style');
  style.id = 'cart-drawer-anim';
  style.innerHTML = styles;
  document.head.appendChild(style);
}
