'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import axios from 'axios';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001/api';
const STATUSES = ['QUEUED', 'PREPARING', 'READY', 'COMPLETED', 'CANCELLED'] as const;

type Order = {
  _id: string;
  status: string;
  total_amount: number;
  items: { dish_id: string; quantity: number; price: number }[];
  customer_name?: string;
  customer_phone?: string;
  createdAt?: string;
};

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [filter, setFilter] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const fetchOrders = async (status?: string) => {
    try {
      setLoading(true);
      setError(null);
      const { data } = await axios.get(`${API_BASE}/orders`, {
        params: status ? { status } : {},
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      setOrders(data || []);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders(filter || undefined);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter]);

  const grouped = useMemo(() => {
    return orders.reduce<Record<string, Order[]>>((acc, order) => {
      const key = order.status || 'UNKNOWN';
      acc[key] = acc[key] || [];
      acc[key].push(order);
      return acc;
    }, {});
  }, [orders]);

  const updateStatus = async (id: string, status: string) => {
    try {
      setUpdatingId(id);
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-slate-500">Orders</p>
          <h1 className="text-2xl font-semibold text-slate-900">Track and update orders</h1>
        </div>
        <Link href="/dashboard" className="text-sm text-blue-600 hover:text-blue-700">
          Back to overview
        </Link>
      </div>

      <div className="flex items-center gap-3 text-sm">
        <span className="text-slate-600">Filter:</span>
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="border rounded px-3 py-1.5"
        >
          <option value="">All</option>
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>

      {loading && <p className="text-sm text-slate-600">Loading...</p>}
      {error && <p className="text-sm text-red-600">{error}</p>}

      {!loading && !error && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {STATUSES.map((status) => (
            <div key={status} className="bg-white border rounded-lg shadow-sm p-4 space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold text-slate-800">{status}</h2>
                <span className="text-xs text-slate-500">
                  {grouped[status]?.length ?? 0} orders
                </span>
              </div>
              <div className="space-y-2 max-h-80 overflow-y-auto">
                {grouped[status]?.map((order) => (
                  <div key={order._id} className="border rounded p-3 bg-slate-50 space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-semibold text-slate-900">${order.total_amount?.toFixed(2)}</span>
                      <span className="text-xs text-slate-500">
                        {order.createdAt ? new Date(order.createdAt).toLocaleTimeString() : ''}
                      </span>
                    </div>
                    <div className="text-xs text-slate-600">
                      {order.items?.length || 0} items
                    </div>
                    <div className="text-xs text-slate-600">
                      {order.customer_name || 'Walk-in'}
                    </div>
                    <div className="flex flex-wrap gap-2 text-xs">
                      {STATUSES.filter((s) => s !== order.status).map((s) => (
                        <button
                          key={s}
                          onClick={() => updateStatus(order._id, s)}
                          disabled={updatingId === order._id}
                          className="rounded border border-slate-200 px-2 py-1 hover:bg-white disabled:opacity-50"
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
                {!grouped[status]?.length && (
                  <p className="text-xs text-slate-500">No orders in this stage.</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
