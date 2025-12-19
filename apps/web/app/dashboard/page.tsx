"use client";

import { useState } from "react";
import AddDishForm from "../components/dashboard/AddDishForm";
import DishesList from "../components/dashboard/DishesList";

export default function DashboardPage() {
  const [refreshToken, setRefreshToken] = useState(0);

  return (
    <main className="min-h-screen flex flex-col gap-8 p-8 bg-slate-50">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Dashboard</h1>
        <p className="text-gray-600">Manage your dishes and uploads.</p>
      </div>

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
