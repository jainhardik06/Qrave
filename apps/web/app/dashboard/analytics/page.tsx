'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import axios from 'axios';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001/api';

type TopItem = {
  dish_id: string;
  quantity: number;
  revenue: number;
};

export default function AnalyticsPage() {
  const [summary, setSummary] = useState<any>(null);
  const [topItems, setTopItems] = useState<TopItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [days, setDays] = useState(7);

  const fetchAnalytics = async (selectedDays: number) => {
    try {
      setLoading(true);
      setError(null);
      const [summaryRes, itemsRes] = await Promise.all([
        axios.get(`${API_BASE}/analytics/summary?days=${selectedDays}`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        }),
        axios.get(`${API_BASE}/analytics/top-items?days=${selectedDays}&limit=5`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        }),
      ]);
      setSummary(summaryRes.data);
      setTopItems(itemsRes.data || []);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to load analytics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics(days);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [days]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-slate-500">Analytics</p>
          <h1 className="text-2xl font-semibold text-slate-900">Performance metrics</h1>
        </div>
        <Link href="/dashboard" className="text-sm text-blue-600 hover:text-blue-700">
          Back to overview
        </Link>
      </div>

      <div className="flex items-center gap-2">
        <span className="text-sm text-slate-600">Time period:</span>
        <select
          value={days}
          onChange={(e) => setDays(Number(e.target.value))}
          className="border border-slate-300 rounded px-3 py-1.5 text-sm"
        >
          <option value={7}>Last 7 days</option>
          <option value={30}>Last 30 days</option>
        </select>
      </div>

      {loading && <p className="text-sm text-slate-600">Loading analytics...</p>}
      {error && <p className="text-sm text-red-600">{error}</p>}

      {!loading && !error && summary && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <div className="bg-white border rounded-lg shadow-sm p-4">
            <p className="text-sm text-slate-500">Total Orders</p>
            <p className="text-2xl font-semibold text-slate-900 mt-1">{summary.ordersToday ?? 0}</p>
          </div>
          <div className="bg-white border rounded-lg shadow-sm p-4">
            <p className="text-sm text-slate-500">Total Revenue</p>
            <p className="text-2xl font-semibold text-slate-900 mt-1">${(summary.revenueToday ?? 0).toFixed(2)}</p>
          </div>
          <div className="bg-white border rounded-lg shadow-sm p-4">
            <p className="text-sm text-slate-500">Avg per Order</p>
            <p className="text-2xl font-semibold text-slate-900 mt-1">
              ${summary.ordersToday ? (summary.revenueToday / summary.ordersToday).toFixed(2) : '0.00'}
            </p>
          </div>
        </div>
      )}

      {!loading && !error && topItems.length > 0 && (
        <div className="bg-white border rounded-lg shadow-sm p-6 space-y-4">
          <h2 className="text-lg font-semibold text-slate-900">Top selling items</h2>
          <div className="space-y-3">
            {topItems.map((item, idx) => (
              <div key={item.dish_id} className="flex items-center justify-between pb-3 border-b last:border-0">
                <div className="flex items-center gap-3">
                  <span className="text-sm font-semibold text-slate-500 w-6">{idx + 1}</span>
                  <div>
                    <p className="text-sm font-medium text-slate-900">Dish {idx + 1}</p>
                    <p className="text-xs text-slate-500">{item.quantity} units sold</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-slate-900">${item.revenue?.toFixed(2) ?? '0.00'}</p>
                  <p className="text-xs text-slate-500">revenue</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
