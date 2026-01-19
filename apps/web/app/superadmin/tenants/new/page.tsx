'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function CreateTenantPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    businessName: '',
    subdomain: '',
    ownerEmail: '',
    ownerPassword: '',
    subscription_status: 'TRIAL' as 'TRIAL' | 'ACTIVE',
  });

  const [features, setFeatures] = useState({
    menu_management: true,
    order_processing: true,
    staff_management: true,
    analytics: false,
    customer_database: false,
    payment_integration: false,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch('http://localhost:3001/api/admin/tenants', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ...formData, features }),
      });

      if (res.ok) {
        router.push('/superadmin/tenants');
      } else {
        alert('Failed to create tenant');
      }
    } catch (error) {
      alert('Error creating tenant');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl">
      <div className="mb-6">
        <h2 className="text-2xl font-semibold text-gray-900">Create New Tenant</h2>
        <p className="text-gray-600 text-sm mt-1">Add a new restaurant to the platform</p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-lg border border-gray-200 shadow-sm p-6 space-y-6">
        {/* Business Info */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Business Information</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Business Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.businessName}
                onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-shadow"
                placeholder="e.g., Joe's Pizza"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Subdomain <span className="text-red-500">*</span>
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  required
                  value={formData.subdomain}
                  onChange={(e) => setFormData({ ...formData, subdomain: e.target.value })}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-shadow"
                  placeholder="joes-pizza"
                />
                <span className="text-gray-500 text-sm">.qrave.app</span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Subscription Status</label>
              <select
                value={formData.subscription_status}
                onChange={(e) =>
                  setFormData({ ...formData, subscription_status: e.target.value as 'TRIAL' | 'ACTIVE' })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-shadow"
              >
                <option value="TRIAL">Trial (14 days)</option>
                <option value="ACTIVE">Active (Paid)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Owner Info */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Owner Account</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                required
                value={formData.ownerEmail}
                onChange={(e) => setFormData({ ...formData, ownerEmail: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-shadow"
                placeholder="owner@example.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Password <span className="text-red-500">*</span>
              </label>
              <input
                type="password"
                required
                minLength={8}
                value={formData.ownerPassword}
                onChange={(e) => setFormData({ ...formData, ownerPassword: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-shadow"
                placeholder="Min. 8 characters"
              />
            </div>
          </div>
        </div>

        {/* Features */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Feature Permissions</h3>
          <div className="space-y-2">
            {Object.entries(features).map(([key, enabled]) => (
              <label
                key={key}
                className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors border border-gray-200"
              >
                <input
                  type="checkbox"
                  checked={enabled}
                  onChange={(e) => setFeatures({ ...features, [key]: e.target.checked })}
                  className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                />
                <div className="flex-1">
                  <span className="text-sm font-medium text-gray-900 capitalize">{key.replace(/_/g, ' ')}</span>
                  <p className="text-xs text-gray-500 mt-0.5">{getFeatureDescription(key)}</p>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
          <button
            type="button"
            onClick={() => router.back()}
            className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors disabled:opacity-50"
          >
            {loading ? 'Creating...' : 'Create Tenant'}
          </button>
        </div>
      </form>
    </div>
  );
}

function getFeatureDescription(key: string): string {
  const descriptions: Record<string, string> = {
    menu_management: 'Create and manage menu items',
    order_processing: 'Handle customer orders',
    staff_management: 'Manage employees and permissions',
    analytics: 'View sales reports and insights',
    customer_database: 'Store customer information',
    payment_integration: 'Accept online payments',
  };
  return descriptions[key] || '';
}
