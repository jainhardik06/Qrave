'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import axios from 'axios';
import { ChevronLeft, CheckCircle, XCircle } from 'lucide-react';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001/api';

type OrderItem = {
  dish_id: string;
  dish_name?: string;
  quantity: number;
  price: number;
  variants?: any[];
  toppings?: any[];
  notes?: string;
};

type Order = {
  _id: string;
  status: string;
  total_amount: number;
  items: OrderItem[];
  customer_name?: string;
  customer_phone?: string;
  createdAt?: string;
};

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [dishNames, setDishNames] = useState<{ [key: string]: string }>({});

  const fetchOrders = async () => {
    try {
      setLoading(true);
      setError(null);
      const { data } = await axios.get(`${API_BASE}/orders`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      setOrders(data || []);
      
      // Fetch dish names
      const dishIds = new Set<string>();
      data?.forEach((order: Order) => {
        order.items?.forEach((item) => {
          if (item.dish_id) dishIds.add(item.dish_id);
        });
      });
      
      if (dishIds.size > 0) {
        const names: { [key: string]: string } = {};
        
        for (const dishId of Array.from(dishIds)) {
          try {
            const res = await axios.get(`${API_BASE}/dishes/${dishId}`, {
              headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
            });
            names[dishId] = res.data?.name || res.data?.dish_name || 'Item';
          } catch (err) {
            names[dishId] = 'Item';
          }
        }
        
        setDishNames(names);
      }
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
    // Only refresh every 30 seconds to reduce flickering, and use smarter updates
    const interval = setInterval(() => {
      setOrders((prevOrders) => prevOrders); // Keep existing orders
      fetchOrders();
    }, 30000); // Changed from 5000 to 30000ms
    return () => clearInterval(interval);
  }, []);

  const updateStatus = async (id: string, status: string) => {
    try {
      setUpdatingId(id);
      
      // Backend orders.service.ts now handles inventory refunds automatically
      // when order status changes to CANCELLED. No need to call /inventory/revert separately.
      await axios.patch(
        `${API_BASE}/orders/${id}`,
        { status },
        { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } },
      );
      setOrders((prev) => prev.map((o) => (o._id === id ? { ...o, status } : o)));
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Failed to update');
    } finally {
      setUpdatingId(null);
    }
  };

  const queuedOrders = orders
    .filter((o) => {
      // Only show today's orders
      const orderDate = new Date(o.createdAt || 0).toDateString();
      const today = new Date().toDateString();
      return o.status === 'QUEUED' && orderDate === today;
    })
    .sort((a, b) => {
      const timeA = new Date(a.createdAt || 0).getTime();
      const timeB = new Date(b.createdAt || 0).getTime();
      return timeA - timeB;
    });

  const completedOrders = orders.filter((o) => {
    const orderDate = new Date(o.createdAt || 0).toDateString();
    const today = new Date().toDateString();
    return o.status === 'COMPLETED' && orderDate === today;
  });

  const cancelledOrders = orders.filter((o) => {
    const orderDate = new Date(o.createdAt || 0).toDateString();
    const today = new Date().toDateString();
    return o.status === 'CANCELLED' && orderDate === today;
  });

  // Get order time in human readable format
  const getTimeAgo = (dateString?: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (seconds < 60) return `${seconds}s ago`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4 md:p-8">
      {/* Header */}
      <div className="mb-8">
        <Link href="/dashboard" className="inline-flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900 mb-4">
          <ChevronLeft size={18} />
          <span>Back to Dashboard</span>
        </Link>
        <h1 className="text-4xl font-bold text-slate-900">Kitchen Orders</h1>
        <p className="text-slate-600 mt-2">Prepare orders in priority (first come, first serve)</p>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {error}
        </div>
      )}

      {/* QUEUED ORDERS - Compact Rectangle Cards */}
      <div className="mb-12">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-base font-bold text-slate-900">Orders to Prepare ({queuedOrders.length})</h2>
            <p className="text-slate-500 text-xs">First come, first serve</p>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-8 text-slate-600 text-sm">Loading orders...</div>
        ) : queuedOrders.length === 0 ? (
          <div className="bg-white rounded-lg p-8 text-center border border-slate-200">
            <div className="text-4xl mb-2">✨</div>
            <p className="font-semibold text-slate-900">All caught up!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-3">
            {queuedOrders.map((order, index) => (
              <div
                key={order._id}
                className="bg-white rounded-lg border border-slate-200 hover:border-slate-300 hover:shadow-md transition-all duration-200 overflow-hidden flex flex-col p-4"
              >
                {/* Header with Priority and Actions */}
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center justify-center w-6 h-6 bg-red-500 text-white font-bold text-xs rounded-full">
                      {index + 1}
                    </span>
                    <div>
                      <h3 className="font-semibold text-slate-900 text-sm">#{order._id.slice(-6).toUpperCase()}</h3>
                      <p className="text-xs text-slate-600">{order.customer_name || 'Guest'}</p>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <button
                      onClick={() => updateStatus(order._id, 'COMPLETED')}
                      disabled={updatingId === order._id}
                      className="bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-semibold py-1.5 px-2.5 rounded-md transition-colors text-xs flex items-center gap-1"
                      title="Complete"
                    >
                      <CheckCircle size={14} />
                    </button>
                    <button
                      onClick={() => updateStatus(order._id, 'CANCELLED')}
                      disabled={updatingId === order._id}
                      className="bg-slate-200 hover:bg-slate-300 disabled:bg-gray-200 text-slate-700 font-semibold py-1.5 px-2.5 rounded-md transition-colors text-xs flex items-center gap-1"
                      title="Cancel"
                    >
                      <XCircle size={14} />
                    </button>
                  </div>
                </div>

                {/* Items */}
                <div className="space-y-2 text-xs">
                  {order.items && order.items.length > 0 ? (
                    order.items.map((item, idx) => {
                      // Parse notes to extract variant and toppings
                      const noteText = item.notes || '';
                      const variantMatch = noteText.match(/Variant:\s*([^|]+)/);
                      const toppingMatch = noteText.match(/Toppings:\s*([^|]+)/);
                      const variant = variantMatch ? variantMatch[1].trim() : null;
                      const toppings = toppingMatch ? toppingMatch[1].trim() : null;
                      const dishName = dishNames[item.dish_id] || 'Item';

                      return (
                        <div key={idx} className="border-t border-slate-100 pt-2 first:border-t-0 first:pt-0">
                          <div className="flex items-center justify-between gap-2 mb-1">
                            <span className="font-semibold text-slate-900">{dishName}</span>
                            <span className="font-bold text-red-600">×{item.quantity}</span>
                          </div>
                          {variant && (
                            <p className="text-slate-600">
                              <span className="font-medium">Variant:</span> {variant}
                            </p>
                          )}
                          {toppings && (
                            <p className="text-slate-600">
                              <span className="font-medium">Toppings:</span> {toppings}
                            </p>
                          )}
                        </div>
                      );
                    })
                  ) : (
                    <p className="text-slate-400">No items</p>
                  )}
                </div>

                {/* Footer */}
                <p className="text-xs text-slate-500 mt-3 pt-3 border-t border-slate-100">{getTimeAgo(order.createdAt)}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ORDER HISTORY - Clean & Minimal Light Theme */}
      {(completedOrders.length > 0 || cancelledOrders.length > 0) && (
        <div className="space-y-6">
          <div className="border-t border-slate-300 pt-8">
            <h2 className="text-lg font-bold text-slate-900 mb-4">Order History</h2>

            {/* Completed Orders */}
            {completedOrders.length > 0 && (
              <div className="bg-white rounded-lg border border-slate-200 overflow-hidden mb-6">
                <div className="bg-green-50 px-6 py-4 border-b border-slate-200">
                  <h3 className="font-semibold text-slate-900 text-base flex items-center gap-2">
                    <CheckCircle size={18} className="text-green-600" />
                    Completed Orders ({completedOrders.length})
                  </h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b bg-slate-50">
                        <th className="px-6 py-3 text-left font-semibold text-slate-700">Order ID</th>
                        <th className="px-6 py-3 text-left font-semibold text-slate-700">Customer</th>
                        <th className="px-6 py-3 text-center font-semibold text-slate-700">Items</th>
                        <th className="px-6 py-3 text-right font-semibold text-slate-700">Time</th>
                      </tr>
                    </thead>
                    <tbody>
                      {completedOrders.slice(0, 10).map((order) => (
                        <tr key={order._id} className="border-b hover:bg-slate-50 transition-colors">
                          <td className="px-6 py-3 font-semibold text-slate-900">#{order._id.slice(-6).toUpperCase()}</td>
                          <td className="px-6 py-3 text-slate-700">{order.customer_name || 'Guest'}</td>
                          <td className="px-6 py-3 text-center text-slate-700">{order.items?.length || 0}</td>
                          <td className="px-6 py-3 text-right text-slate-600 text-xs">{getTimeAgo(order.createdAt)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Cancelled Orders */}
            {cancelledOrders.length > 0 && (
              <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
                <div className="bg-red-50 px-6 py-4 border-b border-slate-200">
                  <h3 className="font-semibold text-slate-900 text-base flex items-center gap-2">
                    <XCircle size={18} className="text-red-600" />
                    Cancelled Orders ({cancelledOrders.length})
                  </h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b bg-slate-50">
                        <th className="px-6 py-3 text-left font-semibold text-slate-700">Order ID</th>
                        <th className="px-6 py-3 text-left font-semibold text-slate-700">Customer</th>
                        <th className="px-6 py-3 text-center font-semibold text-slate-700">Items</th>
                        <th className="px-6 py-3 text-right font-semibold text-slate-700">Time</th>
                      </tr>
                    </thead>
                    <tbody>
                      {cancelledOrders.slice(0, 10).map((order) => (
                        <tr key={order._id} className="border-b hover:bg-slate-50 transition-colors">
                          <td className="px-6 py-3 font-semibold text-slate-900">#{order._id.slice(-6).toUpperCase()}</td>
                          <td className="px-6 py-3 text-slate-700">{order.customer_name || 'Guest'}</td>
                          <td className="px-6 py-3 text-center text-slate-700">{order.items?.length || 0}</td>
                          <td className="px-6 py-3 text-right text-slate-600 text-xs">{getTimeAgo(order.createdAt)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
