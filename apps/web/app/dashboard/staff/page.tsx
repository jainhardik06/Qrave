'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import axios from 'axios';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001/api';

type Staff = {
  _id: string;
  email: string;
  role: string;
  createdAt?: string;
};

export default function StaffPage() {
  const [staff, setStaff] = useState<Staff[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showInviteForm, setShowInviteForm] = useState(false);
  const [formData, setFormData] = useState({ email: '', password: '', role: 'STAFF' });
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);

  const fetchStaff = async () => {
    try {
      setLoading(true);
      setError(null);
      const { data } = await axios.get(`${API_BASE}/staff`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      setStaff(data || []);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to load staff');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStaff();
  }, []);

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      setError(null);
      await axios.post(`${API_BASE}/staff`, formData, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      setSuccess('Staff member invited successfully');
      setFormData({ email: '', password: '', role: 'STAFF' });
      setShowInviteForm(false);
      setTimeout(() => setSuccess(null), 3000);
      fetchStaff();
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to invite staff');
    } finally {
      setSubmitting(false);
    }
  };

  const updateRole = async (id: string, newRole: string) => {
    try {
      await axios.patch(`${API_BASE}/staff/${id}`, { role: newRole }, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      setStaff((prev) => prev.map((s) => (s._id === id ? { ...s, role: newRole } : s)));
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Failed to update role');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-slate-500">Staff</p>
          <h1 className="text-2xl font-semibold text-slate-900">Manage your team</h1>
        </div>
        <div className="flex gap-3">
          <Link href="/dashboard" className="text-sm text-blue-600 hover:text-blue-700">
            Back to overview
          </Link>
          <button
            onClick={() => setShowInviteForm(!showInviteForm)}
            className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
          >
            {showInviteForm ? 'Cancel' : 'Invite Staff'}
          </button>
        </div>
      </div>

      {showInviteForm && (
        <form onSubmit={handleInvite} className="max-w-md rounded-lg bg-white border border-slate-200 shadow-sm p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
            <input
              type="email"
              required
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900"
              placeholder="staff@example.com"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
            <input
              type="password"
              required
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900"
              placeholder="••••••••"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Role</label>
            <select
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900"
            >
              <option value="STAFF">Staff</option>
              <option value="OWNER">Owner</option>
            </select>
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50"
          >
            {submitting ? 'Inviting...' : 'Invite'}
          </button>
        </form>
      )}

      {success && <div className="rounded-lg bg-green-50 border border-green-200 p-4 text-sm text-green-700">{success}</div>}

      {loading && <p className="text-sm text-slate-600">Loading staff...</p>}
      {error && !showInviteForm && <p className="text-sm text-red-600">{error}</p>}

      {!loading && !error && (
        <div className="space-y-2">
          {staff.map((member) => (
            <div key={member._id} className="border rounded-lg bg-white p-4 flex items-center justify-between">
              <div>
                <p className="font-medium text-slate-900">{member.email}</p>
                <p className="text-sm text-slate-500">
                  {member.createdAt ? new Date(member.createdAt).toLocaleDateString() : 'N/A'}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <select
                  value={member.role}
                  onChange={(e) => updateRole(member._id, e.target.value)}
                  className="text-sm border border-slate-300 rounded px-2 py-1"
                >
                  <option value="STAFF">Staff</option>
                  <option value="OWNER">Owner</option>
                </select>
              </div>
            </div>
          ))}
          {!staff.length && <p className="text-sm text-slate-600">No staff members yet. Invite one to get started.</p>}
        </div>
      )}
    </div>
  );
}
