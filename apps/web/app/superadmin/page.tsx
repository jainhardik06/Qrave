'use client';

import { useEffect, useState } from 'react';

type Stats = {
  totalTenants: number;
  activeTenants: number;
  trialTenants: number;
  suspendedTenants: number;
  totalUsers: number;
  totalMRR: number;
  newTenantsThisMonth: number;
};

export default function SuperadminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('http://localhost:3001/api/admin/stats', {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`,
      },
    })
      .then((res) => res.json())
      .then((data) => {
        setStats(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (!stats) {
    return <div className="text-center text-gray-600">Failed to load stats</div>;
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-semibold text-gray-900 mb-2">Platform Overview</h2>
        <p className="text-gray-600 text-sm">Monitor your SaaS metrics and performance</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Tenants"
          value={stats.totalTenants ?? 0}
          subtitle={`${stats.newTenantsThisMonth ?? 0} new this month`}
          color="blue"
        />
        <StatCard
          title="Active Subscriptions"
          value={stats.activeTenants ?? 0}
          subtitle={`${stats.trialTenants ?? 0} in trial`}
          color="green"
        />
        <StatCard
          title="Monthly Revenue"
          value={`$${(stats.totalMRR || 0).toLocaleString()}`}
          subtitle="MRR"
          color="purple"
        />
        <StatCard
          title="Total Users"
          value={stats.totalUsers ?? 0}
          subtitle="Across all tenants"
          color="orange"
        />
      </div>

      {/* Status Breakdown */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Subscription Status</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatusItem label="Active" count={stats.activeTenants} color="green" />
          <StatusItem label="Trial" count={stats.trialTenants} color="blue" />
          <StatusItem label="Suspended" count={stats.suspendedTenants} color="red" />
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
        <div className="flex flex-wrap gap-3">
          <a
            href="/superadmin/tenants/new"
            className="px-4 py-2 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors"
          >
            + Create Tenant
          </a>
          <a
            href="/superadmin/tenants"
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
          >
            View All Tenants
          </a>
          <a
            href="/superadmin/users"
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
          >
            Manage Users
          </a>
        </div>
      </div>
    </div>
  );
}

function StatCard({
  title,
  value,
  subtitle,
  color,
}: {
  title: string;
  value: number | string;
  subtitle: string;
  color: 'blue' | 'green' | 'purple' | 'orange';
}) {
  const colorClasses = {
    blue: 'from-blue-50 to-blue-100 border-blue-200',
    green: 'from-green-50 to-green-100 border-green-200',
    purple: 'from-purple-50 to-purple-100 border-purple-200',
    orange: 'from-orange-50 to-orange-100 border-orange-200',
  };

  return (
    <div
      className={`bg-gradient-to-br ${colorClasses[color]} border rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow`}
    >
      <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
      <p className="text-3xl font-bold text-gray-900 mb-1">{value}</p>
      <p className="text-xs text-gray-500">{subtitle}</p>
    </div>
  );
}

function StatusItem({ label, count, color }: { label: string; count: number; color: 'green' | 'blue' | 'red' }) {
  const dotColors = {
    green: 'bg-green-500',
    blue: 'bg-blue-500',
    red: 'bg-red-500',
  };

  return (
    <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-50">
      <div className={`w-3 h-3 rounded-full ${dotColors[color]}`}></div>
      <div>
        <p className="text-sm text-gray-600">{label}</p>
        <p className="text-xl font-semibold text-gray-900">{count}</p>
      </div>
    </div>
  );
}
