'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001/api';

interface Order {
  _id: string;
  customer: {
    name: string;
    phone: string;
  };
  status: string;
  delivery_type: string;
  billing: {
    subtotal: number;
    gst: number;
    platform_fee: number;
    delivery_charge: number;
    total: number;
  };
  created_at: string;
  items: any[];
}

export default function OrderConfirmationPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const tenant = params?.tenant as string;
  const orderId = searchParams.get('orderId');

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!orderId) {
      setError('Order ID not found');
      setLoading(false);
      return;
    }

    const fetchOrder = async () => {
      try {
        const headers: HeadersInit = {
          'X-Tenant': tenant || '',
        };

        const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
        }

        const response = await fetch(`${API_BASE}/orders/${orderId}`, {
          headers,
        });

        if (!response.ok) {
          throw new Error('Failed to fetch order');
        }

        const data = await response.json();
        setOrder(data);
      } catch (err) {
        console.error('Error fetching order:', err);
        setError('Failed to load order details');
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [orderId, tenant]);

  if (loading) {
    return (
      <div className="w-full min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Processing your order...</p>
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="w-full min-h-screen bg-white flex items-center justify-center p-4">
        <div className="text-center">
          <h2 className="text-xl font-bold text-red-600 mb-2">Error</h2>
          <p className="text-slate-600 mb-6">{error || 'Order not found'}</p>
          <button
            onClick={() => router.push(`/qr/${tenant}/menu`)}
            className="bg-orange-600 text-white px-6 py-3 rounded-2xl font-semibold hover:bg-orange-700 transition-all"
          >
            Back to Menu
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen bg-gradient-to-b from-green-50 to-white">
      {/* Success Header */}
      <div className="px-4 py-8 text-center space-y-4">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
            <path d="M22 4L12 14.01l-3-3" />
          </svg>
        </div>

        <div>
          <h1 className="text-2xl font-bold text-slate-900 mb-2">Order Confirmed!</h1>
          <p className="text-slate-600">Your order has been placed successfully</p>
        </div>

        <div className="bg-green-50 p-4 rounded-xl border border-green-200">
          <p className="text-sm text-slate-700 font-medium">Order ID</p>
          <p className="text-lg font-bold text-green-700 font-mono">{order._id}</p>
        </div>
      </div>

      {/* Order Details */}
      <div className="px-4 py-6 max-w-2xl mx-auto space-y-6">
        {/* Customer Info */}
        <div className="bg-white rounded-xl p-4 border border-slate-200">
          <h2 className="text-sm font-semibold text-slate-900 mb-3">Customer Details</h2>
          <div className="space-y-2 text-sm">
            <p className="text-slate-700">
              <span className="font-medium">Name:</span> {order.customer.name}
            </p>
            <p className="text-slate-700">
              <span className="font-medium">Phone:</span> {order.customer.phone}
            </p>
          </div>
        </div>

        {/* Order Items */}
        <div className="bg-white rounded-xl p-4 border border-slate-200">
          <h2 className="text-sm font-semibold text-slate-900 mb-3">Order Items</h2>
          <div className="space-y-2">
            {order.items.map((item, idx) => (
              <div key={idx} className="flex justify-between text-sm">
                <div>
                  <p className="text-slate-900 font-medium">{item.dishName}</p>
                  <p className="text-xs text-slate-600">Qty: {item.quantity}</p>
                </div>
                <p className="font-semibold text-slate-900">₹{item.price.toFixed(2)}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Billing Summary */}
        <div className="bg-white rounded-xl p-4 border border-slate-200">
          <h2 className="text-sm font-semibold text-slate-900 mb-3">Billing Summary</h2>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between text-slate-700">
              <span>Subtotal</span>
              <span>₹{order.billing.subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-slate-700">
              <span>GST (5%)</span>
              <span>₹{order.billing.gst.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-slate-700">
              <span>Platform Fee</span>
              <span>₹{order.billing.platform_fee.toFixed(2)}</span>
            </div>
            {order.billing.delivery_charge > 0 && (
              <div className="flex justify-between text-slate-700">
                <span>Delivery Charge</span>
                <span>₹{order.billing.delivery_charge.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between font-bold text-lg text-slate-900 pt-2 border-t border-slate-200">
              <span>Total</span>
              <span className="text-green-600">₹{order.billing.total.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Delivery Type */}
        <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
          <p className="text-sm text-slate-700">
            <span className="font-medium">Delivery Type:</span>{' '}
            <span className="capitalize font-semibold text-blue-700">
              {order.delivery_type.replace('-', ' ')}
            </span>
          </p>
        </div>

        {/* Next Steps */}
        <div className="bg-amber-50 rounded-xl p-4 border border-amber-200">
          <h3 className="text-sm font-semibold text-slate-900 mb-2">What's Next?</h3>
          <ul className="text-sm text-slate-700 space-y-1">
            <li>✓ Your order is confirmed and being prepared</li>
            <li>✓ You will receive updates via SMS to {order.customer.phone}</li>
            <li>✓ Payment to be made on {order.delivery_type === 'delivery' ? 'delivery' : 'pickup'}</li>
          </ul>
        </div>
      </div>

      {/* Footer Buttons */}
      <div className="px-4 pb-8 max-w-2xl mx-auto space-y-2">
        <button
          onClick={() => {
            localStorage.removeItem('qrave_cart');
            router.push(`/qr/${tenant}/menu`);
          }}
          className="w-full py-3 bg-orange-600 text-white rounded-2xl font-semibold hover:bg-orange-700 transition-all"
        >
          Order Another Item
        </button>
        <button
          onClick={() => router.push(`/qr/${tenant}/menu`)}
          className="w-full py-3 bg-slate-200 text-slate-900 rounded-2xl font-semibold hover:bg-slate-300 transition-all"
        >
          Back to Menu
        </button>
      </div>
    </div>
  );
}
