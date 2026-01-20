'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import axios from 'axios';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001/api';

type Dish = {
  _id: string;
  name: string;
  price: number;
  category: string;
  is_available?: boolean;
};

export default function MenuPage() {
  const [dishes, setDishes] = useState<Dish[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDishes = async () => {
    try {
      setLoading(true);
      setError(null);
      const { data } = await axios.get(`${API_BASE}/menu`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      setDishes(data || []);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to load dishes');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDishes();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-slate-500">Menu</p>
          <h1 className="text-2xl font-semibold text-slate-900">Manage dishes</h1>
        </div>
        <Link
          href="/dashboard"
          className="text-sm text-blue-600 hover:text-blue-700"
        >
          Back to overview
        </Link>
      </div>

      {loading && <p className="text-sm text-slate-600">Loading...</p>}
      {error && <p className="text-sm text-red-600">{error}</p>}

      {!loading && !error && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {dishes.map((dish) => (
            <div key={dish._id} className="border rounded-lg bg-white p-4 shadow-sm space-y-2">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm uppercase tracking-wide text-slate-400">{dish.category}</p>
                  <h2 className="text-lg font-semibold text-slate-900">{dish.name}</h2>
                </div>
                <div className="text-right">
                  <p className="text-base font-semibold text-slate-900">${dish.price?.toFixed(2)}</p>
                  {dish.is_available === false ? (
                    <span className="text-xs text-amber-700">Unavailable</span>
                  ) : (
                    <span className="text-xs text-emerald-700">Available</span>
                  )}
                </div>
              </div>
            </div>
          ))}
          {!dishes.length && <p className="text-sm text-slate-600">No dishes yet.</p>}
        </div>
      )}
    </div>
  );
}
