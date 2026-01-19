'use client';

import { useEffect, useState } from 'react';

type Tenant = {
  _id: string;
  name: string;
  subdomain: string;
  subscription_status: string;
  ownerEmail?: string;
  userCount: number;
  createdAt: string;
  features?: Record<string, boolean>;
  trial_ends_at?: string;
};

export default function TenantsPage() {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTenant, setSelectedTenant] = useState<Tenant | null>(null);

  useEffect(() => {
    fetchTenants();
  }, []);

  const fetchTenants = () => {
    fetch('http://localhost:3001/api/admin/tenants', {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`,
      },
    })
      .then((res) => res.json())
      .then((data) => {
        const list = Array.isArray(data) ? data : Array.isArray(data?.tenants) ? data.tenants : [];
        setTenants(list);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  const updateStatus = async (id: string, status: string) => {
    await fetch(`http://localhost:3001/api/admin/tenants/${id}/status`, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ status }),
    });
    fetchTenants();
  };

  const deleteTenant = async (id: string) => {
    if (!confirm('Delete this tenant and all associated data? This cannot be undone.')) return;
    await fetch(`http://localhost:3001/api/admin/tenants/${id}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`,
      },
    });
    fetchTenants();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-semibold text-gray-900">Tenants</h2>
          <p className="text-gray-600 text-sm mt-1">{tenants.length} restaurants on the platform</p>
        </div>
        <a
          href="/superadmin/tenants/new"
          className="px-4 py-2 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors"
        >
          + Create Tenant
        </a>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Business
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Owner
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Users
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Created
                </th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {tenants.map((tenant) => (
                <tr key={tenant._id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <div>
                      <div className="font-medium text-gray-900">{tenant.name}</div>
                      <div className="text-sm text-gray-500">{tenant.subdomain}.qrave.app</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-700">{tenant.ownerEmail || '—'}</td>
                  <td className="px-6 py-4">
                    <StatusBadge status={tenant.subscription_status} />
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-700">{tenant.userCount}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {new Date(tenant.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => setSelectedTenant(tenant)}
                        className="text-sm text-blue-600 hover:text-blue-800 font-medium transition-colors"
                      >
                        View
                      </button>
                      <select
                        value={tenant.subscription_status}
                        onChange={(e) => updateStatus(tenant._id, e.target.value)}
                        className="text-sm border border-gray-300 rounded px-2 py-1 hover:border-gray-400 transition-colors"
                      >
                        <option value="TRIAL">Trial</option>
                        <option value="ACTIVE">Active</option>
                        <option value="SUSPENDED">Suspended</option>
                        <option value="CANCELLED">Cancelled</option>
                      </select>
                      <button
                        onClick={() => deleteTenant(tenant._id)}
                        className="text-sm text-red-600 hover:text-red-800 font-medium transition-colors"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {selectedTenant && (
        <TenantDetailModal tenant={selectedTenant} onClose={() => setSelectedTenant(null)} onUpdate={fetchTenants} />
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    TRIAL: 'bg-blue-100 text-blue-700',
    ACTIVE: 'bg-green-100 text-green-700',
    SUSPENDED: 'bg-red-100 text-red-700',
    CANCELLED: 'bg-gray-100 text-gray-700',
  };

  return (
    <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[status] || styles.TRIAL}`}>
      {status}
    </span>
  );
}

function TenantDetailModal({
  tenant,
  onClose,
  onUpdate,
}: {
  tenant: Tenant;
  onClose: () => void;
  onUpdate: () => void;
}) {
  const [features, setFeatures] = useState<Record<string, boolean>>(
    tenant.features || {
      menu_management: true,
      order_processing: true,
      staff_management: true,
      analytics: false,
      customer_database: false,
      payment_integration: false,
    }
  );

  const saveFeatures = async () => {
    await fetch(`http://localhost:3001/api/admin/tenants/${tenant._id}/features`, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ features }),
    });
    onUpdate();
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 animate-fadeIn" onClick={onClose}>
      <div
        className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full mx-4 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Tenant Details</h3>
            <p className="text-sm text-gray-500">Review business info and feature access</p>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-800 text-sm">Close</button>
        </div>

        <div className="px-6 py-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <h4 className="text-sm font-semibold text-gray-800">Business Information</h4>
              <div className="space-y-3">
                <Field label="Business Name" value={tenant.name} />
                <Field label="Subdomain" value={`${tenant.subdomain}.qrave.app`} />
                <Field label="Owner Email" value={tenant.ownerEmail || '—'} />
                <Field label="Created" value={new Date(tenant.createdAt).toLocaleDateString()} />
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="text-sm font-semibold text-gray-800">Subscription</h4>
              <Field label="Status" value={tenant.subscription_status} />
              {tenant.trial_ends_at && <Field label="Trial Ends" value={new Date(tenant.trial_ends_at).toLocaleDateString()} />}
              <Field label="Users" value={tenant.userCount?.toString() || '0'} />
            </div>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-gray-800 mb-3">Feature Permissions</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {Object.entries(features).map(([key, enabled]) => (
                <label
                  key={key}
                  className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-colors"
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
        </div>

        <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-3 bg-gray-50">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={saveFeatures}
            className="px-4 py-2 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors"
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="space-y-1">
      <p className="text-xs uppercase tracking-wide text-gray-500 font-semibold">{label}</p>
      <p className="text-sm text-gray-900 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2">{value}</p>
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
