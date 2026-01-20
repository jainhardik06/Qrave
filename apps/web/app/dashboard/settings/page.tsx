'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import axios from 'axios';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001/api';

type TenantInfo = {
  _id: string;
  name: string;
  subdomain: string;
  subscription_status: string;
  features: Record<string, boolean>;
};

export default function SettingsPage() {
  const [tenant, setTenant] = useState<TenantInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    // In a real app, fetch tenant info; for now, we'll show placeholders
    setLoading(false);
  }, []);

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      alert('Passwords do not match');
      return;
    }
    try {
      setSubmitting(true);
      // In a real app, call an endpoint like POST /api/auth/change-password
      // For now, just show a success message
      setSuccess('Password changed successfully');
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      alert(err?.message || 'Failed to change password');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-slate-500">Settings</p>
          <h1 className="text-2xl font-semibold text-slate-900">Account & preferences</h1>
        </div>
        <Link href="/dashboard" className="text-sm text-blue-600 hover:text-blue-700">
          Back to overview
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Business Info */}
        <div className="bg-white border rounded-lg shadow-sm p-6 space-y-4">
          <h2 className="text-lg font-semibold text-slate-900">Business Information</h2>
          <div className="space-y-3">
            <div>
              <label className="text-sm font-medium text-slate-700">Business Name</label>
              <input
                type="text"
                disabled
                defaultValue="Your Business"
                className="w-full mt-1 px-3 py-2 border border-slate-300 rounded-lg bg-slate-50 text-slate-600"
              />
              <p className="text-xs text-slate-500 mt-1">Managed by superadmin</p>
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700">Subdomain</label>
              <input
                type="text"
                disabled
                defaultValue="your-business"
                className="w-full mt-1 px-3 py-2 border border-slate-300 rounded-lg bg-slate-50 text-slate-600"
              />
              <p className="text-xs text-slate-500 mt-1">Managed by superadmin</p>
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700">Plan Status</label>
              <div className="mt-1 inline-block px-3 py-1 bg-emerald-50 border border-emerald-200 rounded-full text-sm text-emerald-700">
                ACTIVE
              </div>
            </div>
          </div>
        </div>

        {/* Change Password */}
        <form onSubmit={handlePasswordChange} className="bg-white border rounded-lg shadow-sm p-6 space-y-4">
          <h2 className="text-lg font-semibold text-slate-900">Change Password</h2>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Current Password</label>
            <input
              type="password"
              value={passwordForm.currentPassword}
              onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">New Password</label>
            <input
              type="password"
              value={passwordForm.newPassword}
              onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Confirm Password</label>
            <input
              type="password"
              value={passwordForm.confirmPassword}
              onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900"
              required
            />
          </div>
          {success && <p className="text-sm text-green-600">{success}</p>}
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50"
          >
            {submitting ? 'Updating...' : 'Update Password'}
          </button>
        </form>

        {/* Features */}
        <div className="bg-white border rounded-lg shadow-sm p-6 space-y-4 lg:col-span-2">
          <h2 className="text-lg font-semibold text-slate-900">Enabled Features</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {[
              { key: 'menu_management', label: 'Menu Management' },
              { key: 'order_processing', label: 'Order Processing' },
              { key: 'staff_management', label: 'Staff Management' },
              { key: 'analytics', label: 'Analytics' },
              { key: 'customer_database', label: 'Customer Database' },
              { key: 'payment_integration', label: 'Payment Integration' },
            ].map((feature) => (
              <div key={feature.key} className="flex items-center gap-2">
                <input type="checkbox" id={feature.key} defaultChecked disabled className="w-4 h-4" />
                <label htmlFor={feature.key} className="text-sm text-slate-700">
                  {feature.label}
                </label>
              </div>
            ))}
          </div>
          <p className="text-xs text-slate-500 mt-4">Features are managed by superadmin</p>
        </div>
      </div>
    </div>
  );
}
