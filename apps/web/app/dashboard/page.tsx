"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import AddDishForm from "../components/dashboard/AddDishForm";
import DishesList from "../components/dashboard/DishesList";
import axios from "axios";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3001/api";

export default function DashboardPage() {
  const [refreshToken, setRefreshToken] = useState(0);
  const [stats, setStats] = useState<{ ordersToday: number; revenueToday: number; pending: number; topItem?: string } | null>(null);
  const [loadingStats, setLoadingStats] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoadingStats(true);
        setError(null);
        const { data } = await axios.get(`${API_BASE}/analytics/summary`, {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        });
        setStats({
          ordersToday: data?.ordersToday ?? 0,
          revenueToday: data?.revenueToday ?? 0,
          pending: data?.pending ?? 0,
          topItem: data?.topItem ?? undefined,
        });
      } catch (err: any) {
        setError(err?.response?.data?.message || "Failed to load stats");
      } finally {
        setLoadingStats(false);
      }
    };
    fetchStats();
  }, []);

  const cards = useMemo(
    () => [
      { label: "Orders today", value: stats?.ordersToday ?? 0 },
      { label: "Revenue today", value: `$${(stats?.revenueToday ?? 0).toFixed(2)}` },
      { label: "Pending orders", value: stats?.pending ?? 0 },
      { label: "Top item", value: stats?.topItem ?? "—" },
    ],
    [stats],
  );

  return (
    <main className="min-h-screen flex flex-col gap-8 p-8 bg-slate-50">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Dashboard</h1>
          <p className="text-gray-600">Overview of your restaurant performance.</p>
        </div>
        <div className="flex gap-3 text-sm text-blue-600">
          <Link href="/dashboard/orders" className="hover:underline">Orders</Link>
          <Link href="/dashboard/menu" className="hover:underline">Menu</Link>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {cards.map((card) => (
          <div key={card.label} className="bg-white border rounded-lg shadow-sm p-4">
            <p className="text-sm text-slate-500">{card.label}</p>
            <p className="text-2xl font-semibold text-slate-900 mt-1">{card.value}</p>
          </div>
        ))}
      </div>
      {loadingStats && <p className="text-sm text-slate-600">Loading stats...</p>}
      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        <div className="max-w-xl">
          <AddDishForm onCreated={() => setRefreshToken((v) => v + 1)} />
        </div>
        <div className="max-w-2xl">
          <h2 className="text-lg font-semibold text-slate-800 mb-2">Dishes</h2>
          <DishesList refreshToken={refreshToken} />
        </div>
      </div>
    </main>
  );
}
