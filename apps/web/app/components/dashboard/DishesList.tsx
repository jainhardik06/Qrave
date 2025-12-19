"use client";

import { useEffect, useState } from "react";
import axios from "axios";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3001/api";

type Dish = {
  _id: string;
  name: string;
  price: number;
  category: string;
  image_url?: string;
  is_available?: boolean;
};

type Props = {
  refreshToken?: number; // change to force refetch from parent
};

export default function DishesList({ refreshToken }: Props) {
  const [dishes, setDishes] = useState<Dish[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchDishes = async () => {
    try {
      setLoading(true);
      setError(null);
      const { data } = await axios.get(`${API_BASE}/menu`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      setDishes(data || []);
    } catch (err: any) {
      setError(err?.response?.data?.message || "Failed to load dishes");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDishes();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshToken]);

  const onDelete = async (id: string) => {
    const ok = confirm("Delete this dish?");
    if (!ok) return;
    try {
      setDeletingId(id);
      await axios.delete(`${API_BASE}/menu/${id}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      setDishes((prev) => prev.filter((d) => d._id !== id));
    } catch (err: any) {
      alert(err?.response?.data?.message || "Failed to delete");
    } finally {
      setDeletingId(null);
    }
  };

  if (loading) {
    return <p className="text-sm text-gray-600">Loading dishes...</p>;
  }

  if (error) {
    return <p className="text-sm text-red-600">{error}</p>;
  }

  if (!dishes.length) {
    return <p className="text-sm text-gray-600">No dishes yet. Add one to get started.</p>;
  }

  return (
    <div className="space-y-3">
      {dishes.map((dish) => (
        <div
          key={dish._id}
          className="border rounded p-3 bg-white shadow-sm flex items-center justify-between"
        >
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-slate-800">{dish.name}</span>
              <span className="text-sm text-slate-500">{dish.category}</span>
            </div>
            <div className="text-sm text-slate-700">${dish.price?.toFixed(2)}</div>
            {dish.is_available === false && (
              <span className="text-xs text-amber-600">Unavailable</span>
            )}
          </div>
          <button
            onClick={() => onDelete(dish._id)}
            disabled={deletingId === dish._id}
            className="text-sm px-3 py-1 rounded border border-red-200 text-red-700 hover:bg-red-50 disabled:opacity-50"
          >
            {deletingId === dish._id ? "Deleting..." : "Delete"}
          </button>
        </div>
      ))}
    </div>
  );
}
