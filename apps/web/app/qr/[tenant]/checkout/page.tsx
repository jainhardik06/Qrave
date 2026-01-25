'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { CartItem, CartState, Dish } from '../types';
import { DishDetailModal } from '../components/DishDetailModal';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001/api';
const MAPTILER_KEY = process.env.NEXT_PUBLIC_MAPTILER_KEY || '';

type GeoPoint = { lat: number; lng: number };
const tenantLocation: GeoPoint = { lat: 26.8437, lng: 75.8149 }; // base location for distance calc

interface AddressForm {
  houseNo: string;
  area: string;
  landmark?: string;
}

interface SavedAddress {
  id: string;
  label: string;
  address: string;
  coords: GeoPoint;
}

type PaymentMethod = 'cash' | 'card' | 'upi';

interface OrderData {
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  deliveryType: 'dine-in' | 'takeaway' | 'delivery';
  deliveryAddress?: string;
  addressForm?: AddressForm;
  paymentMethod: PaymentMethod;
  specialInstructions?: string;
}

export default function CheckoutPage() {
  const params = useParams();
  const router = useRouter();
  const tenant = params?.tenant as string;

  const [cart, setCart] = useState<CartState>({ items: [], total: 0, itemCount: 0 });
  const [loading, setLoading] = useState(true);

  const [orderData, setOrderData] = useState<OrderData>({
    customerName: '',
    customerPhone: '',
    customerEmail: '',
    deliveryType: 'dine-in',
    paymentMethod: 'cash',
    addressForm: { houseNo: '', area: '', landmark: '' },
  });

  const [locationMode, setLocationMode] = useState<'search' | 'current' | 'saved'>('search');
  const [searchQuery, setSearchQuery] = useState('');
  const [addressSuggestions, setAddressSuggestions] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [savedAddresses] = useState<SavedAddress[]>([
    {
      id: '1',
      label: 'Home',
      address: 'Poornima College, Sitapura, Jaipur',
      coords: { lat: 26.8008, lng: 75.8761 },
    },
    {
      id: '2',
      label: 'Work',
      address: 'Poornima Institute, ISI-2, Jaipur',
      coords: { lat: 26.8082, lng: 75.8722 },
    },
  ]);
  const [mapCenter, setMapCenter] = useState<GeoPoint>(tenantLocation);
  const [deliveryDistance, setDeliveryDistance] = useState<number | null>(null);
  const [deliveryCharge, setDeliveryCharge] = useState(0);
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [editingItem, setEditingItem] = useState<number | null>(null);
  const [editingDish, setEditingDish] = useState<Dish | null>(null);
  const [isLoadingDish, setIsLoadingDish] = useState(false);

  const GST_RATE = 0.05;
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedCart = localStorage.getItem('qrave_cart');
      if (savedCart) {
        try {
          setCart(JSON.parse(savedCart));
        } catch (err) {
          console.error('Failed to load cart:', err);
        }
      }
    }
    setLoading(false);
  }, []);

  // Update cart quantity
  const updateItemQuantity = (index: number, delta: number) => {
    setCart((prev) => {
      const updatedItems = [...prev.items];
      const item = updatedItems[index];
      const newQty = item.quantity + delta;
      
      if (newQty <= 0) {
        updatedItems.splice(index, 1);
      } else {
        const unitPrice = item.unitPrice || item.price / item.quantity;
        updatedItems[index] = {
          ...item,
          quantity: newQty,
          price: unitPrice * newQty,
        };
      }

      const total = updatedItems.reduce((sum, i) => sum + i.price, 0);
      const itemCount = updatedItems.reduce((sum, i) => sum + i.quantity, 0);
      
      const newCart = { items: updatedItems, total, itemCount };
      if (typeof window !== 'undefined') {
        localStorage.setItem('qrave_cart', JSON.stringify(newCart));
      }
      return newCart;
    });
  };

  const calculateDeliveryCharge = (distance: number): number => {
    if (distance <= 2) return 0;
    if (distance <= 5) return 50;
    return 0;
  };

  const fetchDish = async (dishId: string) => {
    try {
      setIsLoadingDish(true);
      const res = await fetch(`${API_BASE}/dishes/${dishId}`, {
        headers: {
          'X-Tenant': tenant,
        },
      });
      if (!res.ok) throw new Error('Unable to load dish');
      const dish = (await res.json()) as Dish;
      setEditingDish(dish);
      return dish;
    } catch (err) {
      console.error('Dish fetch failed', err);
      setEditingDish(null);
      return null;
    } finally {
      setIsLoadingDish(false);
    }
  };

  const startEditItem = async (index: number) => {
    setEditingItem(index);
    await fetchDish(cart.items[index].dishId);
  };

  const closeEdit = () => {
    setEditingItem(null);
    setEditingDish(null);
  };

  const handleEditCartItem = (updatedItem: CartItem) => {
    if (editingItem === null) return;

    setCart((prev) => {
      const updatedItems = [...prev.items];
      updatedItems[editingItem] = updatedItem;
      const total = updatedItems.reduce((sum, i) => sum + i.price, 0);
      const itemCount = updatedItems.reduce((sum, i) => sum + i.quantity, 0);
      const newCart = { items: updatedItems, total, itemCount };
      if (typeof window !== 'undefined') {
        localStorage.setItem('qrave_cart', JSON.stringify(newCart));
      }
      return newCart;
    });
  };

  const calculateDistanceKm = (a: GeoPoint, b: GeoPoint) => {
    const toRad = (deg: number) => (deg * Math.PI) / 180;
    const R = 6371;
    const dLat = toRad(b.lat - a.lat);
    const dLng = toRad(b.lng - a.lng);
    const lat1 = toRad(a.lat);
    const lat2 = toRad(b.lat);
    const h =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
    return +(R * c).toFixed(2);
  };

  const buildStaticMapUrl = (center: GeoPoint) => {
    const { lat, lng } = center;
    if (MAPTILER_KEY) {
      return `https://api.maptiler.com/maps/streets/static/${lng},${lat},15/700x360.png?key=${MAPTILER_KEY}`;
    }
    return `https://staticmap.openstreetmap.de/staticmap.php?center=${lat},${lng}&zoom=15&size=700x360&markers=${lat},${lng},lightblue1`;
  };

  const handleGetCurrentLocation = () => {
    setIsGettingLocation(true);
    setTimeout(() => {
      const randomOffset = () => (Math.random() - 0.5) * 0.06; // ~6km window
      const currentPoint: GeoPoint = {
        lat: tenantLocation.lat + randomOffset(),
        lng: tenantLocation.lng + randomOffset(),
      };
      const dist = calculateDistanceKm(tenantLocation, currentPoint);
      const charge = calculateDeliveryCharge(dist);

      setDeliveryDistance(dist);
      setDeliveryCharge(charge);
      setMapCenter(currentPoint);

      if (dist > 5) {
        alert(`Location is ${dist.toFixed(1)}km away. We only deliver within 5km.`);
        setOrderData((prev) => ({ ...prev, deliveryAddress: undefined }));
      } else {
        setOrderData((prev) => ({
          ...prev,
          deliveryAddress: 'Current Location (via GPS)',
        }));
      }
      setIsGettingLocation(false);
    }, 1200);
  };

  const handleAddressSearch = (query: string) => {
    setSearchQuery(query);
    if (query.length > 2) {
      setShowSuggestions(true);
      setAddressSuggestions([
        {
          place_id: '1',
          main_text: 'Poornima College',
          secondary_text: 'Sitapura, Jaipur',
          coords: { lat: 26.8008, lng: 75.8761 },
        },
        {
          place_id: '2',
          main_text: 'Jawahar Circle',
          secondary_text: 'Malviya Nagar, Jaipur',
          coords: { lat: 26.8436, lng: 75.8119 },
        },
        {
          place_id: '3',
          main_text: 'Jaipur Railway Station',
          secondary_text: 'Station Road, Jaipur',
          coords: { lat: 26.9196, lng: 75.7878 },
        },
      ]);
    } else {
      setShowSuggestions(false);
    }
  };

  const handleSelectSuggestion = (suggestion: any) => {
    const coords: GeoPoint = suggestion.coords;
    const dist = calculateDistanceKm(tenantLocation, coords);
    const charge = calculateDeliveryCharge(dist);

    setDeliveryDistance(dist);
    setDeliveryCharge(charge);
    setMapCenter(coords);

    if (dist > 5) {
      alert(`This location is ${dist}km away. We only deliver within 5km.`);
      setOrderData((prev) => ({ ...prev, deliveryAddress: undefined }));
    } else {
      setOrderData((prev) => ({
        ...prev,
        deliveryAddress: `${suggestion.main_text}, ${suggestion.secondary_text}`,
      }));
    }
    setSearchQuery('');
    setShowSuggestions(false);
  };

  const handleSelectSavedAddress = (addr: SavedAddress) => {
    const dist = calculateDistanceKm(tenantLocation, addr.coords);
    const charge = calculateDeliveryCharge(dist);
    setDeliveryDistance(dist);
    setDeliveryCharge(charge);
    setMapCenter(addr.coords);
    setOrderData((prev) => ({
      ...prev,
      deliveryAddress: addr.address,
    }));
  };

  const handlePlaceOrder = async () => {
    if (!orderData.customerName || !orderData.customerPhone) {
      alert('Please enter your name and phone number');
      return;
    }

    if (
      orderData.deliveryType === 'delivery' &&
      (!orderData.deliveryAddress || !orderData.addressForm?.houseNo || !orderData.addressForm?.area)
    ) {
      alert('Please complete delivery address details');
      return;
    }

    if (deliveryDistance && deliveryDistance > 5) {
      alert('Delivery location is beyond 5km limit');
      return;
    }

    setIsPlacingOrder(true);
    try {
      // Helper to generate slug ID if missing
      const generateSlugId = (obj: any, fallbackField = 'name'): string => {
        if (typeof obj === 'string') return obj;
        if (obj._id) return obj._id;
        if (obj.id) return obj.id;
        const fallback = obj[fallbackField] || '';
        return fallback.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
      };

      const orderPayload = {
        items: cart.items.map((item) => {
          const variantId = item.selectedVariant ? generateSlugId(item.selectedVariant) : undefined;
          const toppingIds = item.selectedToppings && item.selectedToppings.length > 0
            ? item.selectedToppings.map((t: any) => generateSlugId(t))
            : [];
          
          console.log(`🛒 Cart item variant/topping mapping:`, {
            dishName: item.name,
            selectedVariant: item.selectedVariant,
            generatedVariantId: variantId,
            selectedToppings: item.selectedToppings?.map((t: any) => t.name),
            generatedToppingIds: toppingIds,
          });

          return {
            dish_id: item.dishId,
            quantity: item.quantity,
            price: item.unitPrice ?? item.price / item.quantity,
            ...(variantId ? { variant_id: variantId } : {}),
            ...(toppingIds.length > 0 ? {
              toppings: item.selectedToppings.map((t: any) => ({
                topping_id: generateSlugId(t),
                quantity: 1,
              })),
            } : {}),
            notes: [
              item.selectedVariant ? `Variant: ${item.selectedVariant.name}` : null,
              item.selectedToppings && item.selectedToppings.length > 0
                ? `Toppings: ${item.selectedToppings.map((t) => t.name).join(', ')}`
                : null,
            ]
              .filter(Boolean)
              .join(' | '),
          };
        }),
        total_amount: cart.total, // service will recompute if omitted
        customer_name: orderData.customerName,
        customer_phone: orderData.customerPhone,
        // Combine extra info into notes
        notes: [
          orderData.specialInstructions ? `Instructions: ${orderData.specialInstructions}` : null,
          orderData.customerEmail ? `Email: ${orderData.customerEmail}` : null,
          `Payment: ${orderData.paymentMethod}`,
          `Mode: ${orderData.deliveryType}`,
          orderData.deliveryAddress ? `Address: ${orderData.deliveryAddress}` : null,
          orderData.addressForm?.houseNo ? `House: ${orderData.addressForm?.houseNo}` : null,
          orderData.addressForm?.area ? `Area: ${orderData.addressForm?.area}` : null,
          orderData.addressForm?.landmark ? `Landmark: ${orderData.addressForm?.landmark}` : null,
          deliveryDistance ? `Distance: ${deliveryDistance}km` : null,
          deliveryCharge ? `DeliveryCharge: ₹${deliveryCharge}` : null,
        ]
          .filter(Boolean)
          .join(' | '),
      };

      console.log('📤 Order Payload:', JSON.stringify(orderPayload, null, 2));

      const res = await fetch(`${API_BASE}/public/orders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Tenant': tenant,
        },
        body: JSON.stringify(orderPayload),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        const errorMsg = errorData.message || errorData.error || JSON.stringify(errorData) || res.statusText;
        console.error('🔴 Server Error Response:', { status: res.status, errorData, errorMsg });
        throw new Error(errorMsg);
      }
      const createdOrder = await res.json();

      localStorage.removeItem('qrave_cart');
      router.push(`/qr/${tenant}/order-confirmation?orderId=${createdOrder._id}`);
    } catch (err) {
      console.error('❌ Error placing order:', err);
      alert(`Failed to place order: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setIsPlacingOrder(false);
    }
  };

  if (loading) {
    return (
      <div className="w-full min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-orange-600 mx-auto mb-4"></div>
          <p className="text-slate-600 font-medium">Loading...</p>
        </div>
      </div>
    );
  }

  if (cart.itemCount === 0) {
    return (
      <div className="w-full min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <div className="mb-6">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-orange-100 mb-4">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#ea580c" strokeWidth="1.5">
                <circle cx="9" cy="20" r="1.5" />
                <circle cx="17" cy="20" r="1.5" />
                <path d="M3 4h2l1.6 9.2a1 1 0 0 0 1 .8h8.8a1 1 0 0 0 1-.7l1-3.3H7.1" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-slate-900 mb-2">Your cart is empty</h2>
            <p className="text-slate-600">Add items from the menu to proceed</p>
          </div>
          <button
            onClick={() => router.push(`/qr/${tenant}/menu`)}
            className="bg-orange-600 text-white px-8 py-3.5 rounded-xl font-semibold hover:bg-orange-700 transition-all shadow-lg"
          >
            Back to Menu
          </button>
        </div>
      </div>
    );
  }

  const subtotal = cart.total;
  const gst = subtotal * GST_RATE;
  const grandTotal = subtotal + gst + deliveryCharge;

  return (
    <div className="w-full min-h-screen bg-slate-50">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-white border-b border-slate-200">
        <div className="px-4 py-4 flex items-center gap-4 max-w-4xl mx-auto">
          <button
            onClick={() => router.back()}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </button>
          <h1 className="text-lg font-bold text-slate-900">Secure Checkout</h1>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-5 pb-32 space-y-4">
        {/* Cart Items */}
        <div className="bg-white rounded-lg shadow-sm border border-slate-200">
          <div className="px-5 py-4 border-b border-slate-200">
            <h2 className="text-base font-bold text-slate-900">{cart.itemCount} {cart.itemCount === 1 ? 'Item' : 'Items'}</h2>
          </div>
          <div className="divide-y divide-slate-100">
            {cart.items.map((item, idx) => (
              <div key={idx} className="px-5 py-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    {/* Veg/Non-veg Indicator */}
                    <div className="flex items-start gap-3 mb-2">
                      <div className="w-4 h-4 border-2 border-green-600 rounded flex-shrink-0 mt-0.5">
                        <div className="w-2 h-2 rounded-full bg-green-600 m-auto mt-[1px]" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-sm font-semibold text-slate-900 mb-1">{item.dishName}</h3>
                        {item.selectedVariant && (
                          <p className="text-xs text-slate-600 mb-0.5">
                            Size: {item.selectedVariant.name}
                          </p>
                        )}
                        {item.selectedToppings && item.selectedToppings.length > 0 && (
                          <p className="text-xs text-slate-600">
                            Add-ons: {item.selectedToppings.map((t) => t.name).join(', ')}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Quantity Controls */}
                    <div className="flex items-center gap-3 mt-3">
                      <div className="flex items-center border-2 border-green-600 rounded">
                        <button
                          onClick={() => updateItemQuantity(idx, -1)}
                          className="w-7 h-7 flex items-center justify-center text-green-600 hover:bg-green-50 transition-colors"
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                            <path d="M5 12h14" />
                          </svg>
                        </button>
                        <span className="text-sm font-bold text-green-600 w-8 text-center">{item.quantity}</span>
                        <button
                          onClick={() => updateItemQuantity(idx, 1)}
                          className="w-7 h-7 flex items-center justify-center text-green-600 hover:bg-green-50 transition-colors"
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                            <path d="M12 5v14M5 12h14" />
                          </svg>
                        </button>
                      </div>
                      
                      <button
                        onClick={() => startEditItem(idx)}
                        className="text-xs font-medium text-orange-600 hover:text-orange-700 px-3 py-1.5 border border-orange-200 rounded hover:bg-orange-50 transition-colors"
                      >
                        Edit
                      </button>
                    </div>
                  </div>

                  {/* Price */}
                  <div className="text-right">
                    <p className="text-sm font-bold text-slate-900">₹{item.price.toFixed(2)}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Contact Details - positioned just above delivery options */}
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-5">
          <h2 className="text-base font-bold text-slate-900 mb-4">Contact Details</h2>
          <div className="space-y-3">
            <input
              type="text"
              placeholder="Your Name"
              value={orderData.customerName}
              onChange={(e) => setOrderData((prev) => ({ ...prev, customerName: e.target.value }))}
              className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm"
            />
            <input
              type="tel"
              placeholder="Phone Number"
              value={orderData.customerPhone}
              onChange={(e) => setOrderData((prev) => ({ ...prev, customerPhone: e.target.value }))}
              className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm"
            />
            <input
              type="email"
              placeholder="Email (optional)"
              value={orderData.customerEmail || ''}
              onChange={(e) => setOrderData((prev) => ({ ...prev, customerEmail: e.target.value }))}
              className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm"
            />
          </div>
        </div>

        {/* Delivery Options */}
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-5">
          <h2 className="text-base font-bold text-slate-900 mb-4">Delivery Option</h2>
          <div className="grid grid-cols-3 gap-3">
            {[
              {
                value: 'dine-in',
                label: 'Dine In',
                icon: (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2M7 2v20M21 15V2v0a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7" />
                  </svg>
                ),
              },
              {
                value: 'takeaway',
                label: 'Takeaway',
                icon: (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M3 9h18v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V9Z" />
                    <path d="m3 9 2.45-4.9A2 2 0 0 1 7.24 3h9.52a2 2 0 0 1 1.8 1.1L21 9" />
                    <path d="M12 3v6" />
                  </svg>
                ),
              },
              {
                value: 'delivery',
                label: 'Delivery',
                icon: (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2" />
                    <path d="M15 18H9" />
                    <path d="M19 18h2a1 1 0 0 0 1-1v-3.28a1 1 0 0 0-.684-.948l-1.923-.641a1 1 0 0 1-.578-.579l-1.5-4A1 1 0 0 0 16.382 7H15" />
                    <circle cx="17" cy="18" r="2" />
                    <circle cx="7" cy="18" r="2" />
                  </svg>
                ),
              },
            ].map((option) => (
              <button
                key={option.value}
                onClick={() => {
                  setOrderData((prev) => ({
                    ...prev,
                    deliveryType: option.value as any,
                  }));
                  if (option.value !== 'delivery') {
                    setDeliveryDistance(null);
                    setDeliveryCharge(0);
                  }
                }}
                className={`py-3 px-4 rounded-lg border-2 transition-all flex flex-col items-center gap-2 ${
                  orderData.deliveryType === option.value
                    ? 'border-orange-600 bg-orange-50'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className={orderData.deliveryType === option.value ? 'text-orange-600' : 'text-slate-600'}>
                  {option.icon}
                </div>
                <span
                  className={`text-xs font-semibold ${
                    orderData.deliveryType === option.value ? 'text-orange-600' : 'text-slate-700'
                  }`}
                >
                  {option.label}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Delivery Address */}
        {orderData.deliveryType === 'delivery' && (
          <div className="space-y-4">
            <div className="bg-white rounded-lg shadow-sm border border-slate-200">
              <div className="px-5 py-4 border-b border-slate-200">
                <h2 className="text-base font-bold text-slate-900">Delivery Location</h2>
              </div>

              <div className="p-5">
                <div className="grid grid-cols-3 gap-3 mb-4">
                  {[
                    { mode: 'search', label: 'Search' },
                    { mode: 'current', label: 'Current' },
                    { mode: 'saved', label: 'Saved' },
                  ].map((tab) => (
                    <button
                      key={tab.mode}
                      onClick={() => setLocationMode(tab.mode as any)}
                      className={`py-2.5 rounded-lg text-xs font-semibold transition-all border-2 ${
                        locationMode === tab.mode
                          ? 'bg-orange-50 text-orange-600 border-orange-600'
                          : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>

                {locationMode === 'search' && (
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Search for area, street..."
                      value={searchQuery}
                      onChange={(e) => handleAddressSearch(e.target.value)}
                      className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm"
                    />

                    {showSuggestions && addressSuggestions.length > 0 && (
                      <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-slate-200 rounded-lg shadow-xl z-20">
                        {addressSuggestions.map((suggestion) => (
                          <button
                            key={suggestion.place_id}
                            onClick={() => handleSelectSuggestion(suggestion)}
                            className="w-full text-left px-4 py-3 hover:bg-slate-50 border-b border-slate-100 last:border-b-0"
                          >
                            <p className="text-sm font-semibold text-slate-900">{suggestion.main_text}</p>
                            <p className="text-xs text-slate-600 mt-0.5">{suggestion.secondary_text}</p>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {locationMode === 'current' && (
                  <button
                    onClick={handleGetCurrentLocation}
                    disabled={isGettingLocation}
                    className="w-full py-3 bg-orange-600 hover:bg-orange-700 text-white rounded-lg font-semibold text-sm flex items-center justify-center gap-2 disabled:opacity-50 transition-colors"
                  >
                    {isGettingLocation ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-white"></div>
                        Getting location...
                      </>
                    ) : (
                      'Use Current Location'
                    )}
                  </button>
                )}

                {locationMode === 'saved' && (
                  <div className="space-y-2">
                    {savedAddresses.map((addr) => (
                      <button
                        key={addr.id}
                        onClick={() => handleSelectSavedAddress(addr)}
                        className="w-full text-left p-4 border border-slate-200 rounded-lg hover:border-orange-300 hover:bg-orange-50 transition-colors"
                      >
                        <p className="text-sm font-semibold text-slate-900 mb-1">{addr.label}</p>
                        <p className="text-xs text-slate-600">{addr.address}</p>
                      </button>
                    ))}
                  </div>
                )}

                {orderData.deliveryAddress && (
                  <div className="mt-4 space-y-3">
                    <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs font-semibold text-green-700 mb-1">Selected</p>
                          <p className="text-sm text-slate-900">{orderData.deliveryAddress}</p>
                          {deliveryDistance && (
                            <p className="text-xs text-green-600 mt-1">Distance: {deliveryDistance.toFixed(1)} km</p>
                          )}
                        </div>
                        <div className="text-right">
                          {deliveryCharge === 0 ? (
                            <span className="text-xs font-semibold text-green-600">Free delivery</span>
                          ) : (
                            <span className="text-xs font-semibold text-slate-700">₹{deliveryCharge.toFixed(0)} delivery</span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="rounded-xl overflow-hidden border border-slate-200 bg-slate-50">
                      <img
                        src={buildStaticMapUrl(mapCenter)}
                        alt="Delivery map"
                        className="w-full h-60 object-cover"
                      />
                      {!MAPTILER_KEY && (
                        <div className="px-4 py-2 text-xs text-slate-600 bg-white border-t border-slate-200">
                          Using free OpenStreetMap tiles. Add NEXT_PUBLIC_MAPTILER_KEY for branded tiles.
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Address Form */}
            {orderData.deliveryAddress && (
              <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-5">
                <h2 className="text-base font-bold text-slate-900 mb-4">Complete Address</h2>
                <div className="space-y-3">
                  <input
                    type="text"
                    placeholder="House / Flat / Block No."
                    value={orderData.addressForm?.houseNo || ''}
                    onChange={(e) =>
                      setOrderData((prev) => ({
                        ...prev,
                        addressForm: { ...prev.addressForm!, houseNo: e.target.value },
                      }))
                    }
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm"
                  />
                  <input
                    type="text"
                    placeholder="Area / Locality"
                    value={orderData.addressForm?.area || ''}
                    onChange={(e) =>
                      setOrderData((prev) => ({
                        ...prev,
                        addressForm: { ...prev.addressForm!, area: e.target.value },
                      }))
                    }
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm"
                  />
                  <input
                    type="text"
                    placeholder="Landmark (Optional)"
                    value={orderData.addressForm?.landmark || ''}
                    onChange={(e) =>
                      setOrderData((prev) => ({
                        ...prev,
                        addressForm: { ...prev.addressForm!, landmark: e.target.value },
                      }))
                    }
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm"
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {/* Customer Details moved above */}

        {/* Bill Summary */}
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-5">
          <h2 className="text-base font-bold text-slate-900 mb-4">Bill Summary</h2>
          <div className="space-y-2.5 text-sm">
            <div className="flex justify-between text-slate-700">
              <span>Subtotal</span>
              <span>₹{subtotal.toFixed(2)}</span>
            </div>
            {orderData.deliveryType === 'delivery' && deliveryCharge > 0 && (
              <div className="flex justify-between text-slate-700">
                <span>Delivery Charges</span>
                <span>₹{deliveryCharge.toFixed(2)}</span>
              </div>
            )}
            {orderData.deliveryType === 'delivery' && deliveryCharge === 0 && deliveryDistance && deliveryDistance <= 2 && (
              <div className="flex justify-between text-green-600">
                <span>Delivery Charges</span>
                <span>FREE</span>
              </div>
            )}
            <div className="flex justify-between text-slate-700">
              <span>GST (5%)</span>
              <span>₹{gst.toFixed(2)}</span>
            </div>
            <div className="pt-2 border-t border-slate-200 flex justify-between font-bold text-slate-900">
              <span>Total</span>
              <span>₹{grandTotal.toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Fixed Bottom - Payment & Place Order */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 shadow-lg z-40">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            {/* Payment Method Dropup (overlay) */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsPaymentOpen((v) => !v)}
                className="px-4 py-3.5 pr-9 border-2 border-slate-300 rounded-lg bg-white text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 hover:border-slate-400 transition-colors min-w-[220px] text-left flex items-center gap-2"
              >
                {/* Left icon */}
                {orderData.paymentMethod === 'cash' && (
                  <span className="text-green-600" aria-hidden>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="2" y="6" width="20" height="12" rx="2" />
                      <circle cx="12" cy="12" r="2.5" />
                    </svg>
                  </span>
                )}
                {orderData.paymentMethod === 'card' && (
                  <span className="text-slate-600" aria-hidden>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="2" y="5" width="20" height="14" rx="2" />
                      <path d="M2 10h20" />
                    </svg>
                  </span>
                )}
                {orderData.paymentMethod === 'upi' && (
                  <span className="text-slate-600" aria-hidden>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M3 12h18" />
                      <path d="M7 8l-4 4 4 4" />
                      <path d="M17 8l4 4-4 4" />
                    </svg>
                  </span>
                )}
                <span>
                  {orderData.paymentMethod === 'cash' && 'Cash'}
                  {orderData.paymentMethod === 'card' && 'Card (Soon)'}
                  {orderData.paymentMethod === 'upi' && 'UPI (Soon)'}
                </span>
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-600">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="m18 15-6-6-6 6" />
                  </svg>
                </span>
              </button>

              {isPaymentOpen && (
                <div className="absolute bottom-full mb-2 left-0 w-72 bg-white border border-slate-200 rounded-lg shadow-xl z-50 overflow-hidden">
                  <div className="py-1">
                    <button
                      onClick={() => {
                        setOrderData((p) => ({ ...p, paymentMethod: 'cash' }));
                        setIsPaymentOpen(false);
                      }}
                      className={`w-full text-left px-4 py-3 text-sm flex items-center gap-3 hover:bg-slate-50 ${
                        orderData.paymentMethod === 'cash' ? 'bg-orange-50 text-orange-700' : 'text-slate-800'
                      }`}
                    >
                      <span className="text-green-600" aria-hidden>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <rect x="2" y="6" width="20" height="12" rx="2" />
                          <circle cx="12" cy="12" r="2.5" />
                        </svg>
                      </span>
                      <span>Cash on Delivery</span>
                    </button>

                    <button
                      disabled
                      className="w-full text-left px-4 py-3 text-sm flex items-center gap-3 text-slate-400 cursor-not-allowed"
                    >
                      <span aria-hidden>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <rect x="2" y="5" width="20" height="14" rx="2" />
                          <path d="M2 10h20" />
                        </svg>
                      </span>
                      <span>Card (Soon)</span>
                    </button>

                    <button
                      disabled
                      className="w-full text-left px-4 py-3 text-sm flex items-center gap-3 text-slate-400 cursor-not-allowed"
                    >
                      <span aria-hidden>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M3 12h18" />
                          <path d="M7 8l-4 4 4 4" />
                          <path d="M17 8l4 4-4 4" />
                        </svg>
                      </span>
                      <span>UPI (Soon)</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Place Order Button */}
            <button
              onClick={handlePlaceOrder}
              disabled={isPlacingOrder}
              className="flex-1 bg-orange-600 hover:bg-orange-700 text-white py-3.5 rounded-lg font-bold text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg flex items-center justify-center gap-2"
            >
              {isPlacingOrder ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-white"></div>
                  Placing...
                </>
              ) : (
                `Place Order • ₹${grandTotal.toFixed(2)}`
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Edit Item Modal */}
      {editingItem !== null && editingDish && (
        <DishDetailModal
          dish={editingDish}
          isOpen={true}
          onClose={closeEdit}
          onAddToCart={handleEditCartItem}
        />
      )}

    </div>
  );
}
