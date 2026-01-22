'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import {
  Plus,
  Package,
  TrendingDown,
  DollarSign,
  AlertCircle,
  Search,
  Edit2,
  Trash2,
  Eye,
  BarChart3,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react';

interface InventoryItem {
  _id: string;
  name: string;
  sku: string;
  unit: string;
  current_quantity: number;
  reorder_level: number;
  cost_per_unit: number;
  supplier_name?: string;
  is_active: boolean;
  createdAt: string;
}

interface InventoryTransaction {
  _id: string;
  item_id: string;
  item_name?: string;
  quantity_change: number;
  transaction_type: string;
  reference_order_id?: string;
  notes?: string;
  timestamp?: string;
  createdAt?: string;
}

interface DashboardSummary {
  total_inventory_value: number;
  items_count: number;
  low_stock_count: number;
}

export default function InventoryPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'overview' | 'items' | 'transactions'>('overview');
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [transactions, setTransactions] = useState<InventoryTransaction[]>([]);
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredItems, setFilteredItems] = useState<InventoryItem[]>([]);
  const [mounted, setMounted] = useState(false);
  const [restockingItemId, setRestockingItemId] = useState<string | null>(null);
  const [restockQuantities, setRestockQuantities] = useState<{ [key: string]: number }>({});

  const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001/api';

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    fetchAllData();
  }, [mounted]);

  useEffect(() => {
    filterItems();
  }, [searchQuery, items]);

  const fetchAllData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      if (!token) {
        router.replace('/login');
        return;
      }

      const headers = { Authorization: `Bearer ${token}` };
      const [itemsRes, transactionsRes, summaryRes] = await Promise.all([
        axios.get(`${API_BASE}/inventory/items`, { headers }).catch((err) => {
          console.error('Items endpoint error:', err.message);
          return { data: [] };
        }),
        axios.get(`${API_BASE}/inventory/transactions`, { headers }).catch((err) => {
          console.error('Transactions endpoint error:', err.message);
          return { data: [] };
        }),
        axios.get(`${API_BASE}/inventory/dashboard/summary`, { headers }).catch((err) => {
          console.error('Summary endpoint error:', err.message);
          return { data: null };
        }),
      ]);

      setItems(itemsRes.data || []);
      setTransactions(transactionsRes.data || []);
      setSummary(summaryRes.data || null);
    } catch (err: any) {
      console.error('Error fetching inventory data:', err.message);
    } finally {
      setLoading(false);
    }
  };

  const filterItems = () => {
    if (!searchQuery) {
      setFilteredItems(items);
      return;
    }

    setFilteredItems(
      items.filter((item) =>
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.sku.toLowerCase().includes(searchQuery.toLowerCase())
      )
    );
  };

  const handleDeleteItem = async (id: string) => {
    if (!window.confirm('Delete this inventory item?')) return;
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${API_BASE}/inventory/items/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setItems(items.filter((i) => i._id !== id));
    } catch (err) {
      console.error('Error deleting item:', err);
      alert('Failed to delete item');
    }
  };

  const handleRestockClick = (item: InventoryItem) => {
    setRestockingItemId(item._id);
    // Set default restock quantity to reorder_level
    setRestockQuantities({ ...restockQuantities, [item._id]: item.reorder_level });
  };

  const handleRestockSave = async (itemId: string) => {
    const quantity = restockQuantities[itemId];
    if (!quantity || quantity <= 0) {
      alert('Please enter a valid quantity');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      await axios.post(
        `${API_BASE}/inventory/items/${itemId}/restock`,
        { quantity },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      // Refresh data
      await fetchAllData();
      setRestockingItemId(null);
    } catch (err) {
      console.error('Error restocking item:', err);
      alert('Failed to restock item');
    }
  };

  const handleRestockCancel = () => {
    setRestockingItemId(null);
  };

  const getTransactionColor = (type: string) => {
    const typeLC = type.toLowerCase();
    if (typeLC.includes('purchase') || typeLC.includes('add')) return 'bg-emerald-50 text-emerald-700';
    if (typeLC.includes('usage') || typeLC.includes('deduct')) return 'bg-red-50 text-red-700';
    if (typeLC.includes('refund')) return 'bg-purple-50 text-purple-700';
    if (typeLC.includes('adjust') || typeLC.includes('adjustment')) return 'bg-blue-50 text-blue-700';
    return 'bg-slate-50 text-slate-700';
  };

  const formatDate = (date: string) => {
    if (!date) return '—';
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-white">
        <div className="text-center">
          <div className="relative w-20 h-20 mx-auto mb-6">
            <div className="absolute inset-0 border-4 border-slate-200 rounded-full"></div>
            <div className="absolute inset-0 border-4 border-transparent border-t-slate-900 rounded-full animate-spin"></div>
          </div>
          <p className="text-slate-600 font-semibold text-lg">Loading inventory...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Premium Header */}
      <div className="border-b border-slate-200 bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-8 py-8">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-slate-900 rounded-lg">
                  <Package className="text-white" size={24} />
                </div>
                <h1 className="text-3xl font-bold text-slate-900">Inventory</h1>
              </div>
              <p className="text-slate-600">Manage stock, items and transactions</p>
            </div>
            <button
              onClick={() => router.push('/dashboard/inventory/items/new')}
              className="flex items-center gap-2 bg-slate-900 text-white px-6 py-3 rounded-lg hover:bg-slate-800 transition-all font-semibold shadow-lg hover:shadow-xl"
            >
              <Plus size={20} />
              New Item
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-8 py-8">
        {/* KPI Grid */}
        {summary && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
            {/* Total Value Card */}
            <div className="bg-white rounded-xl p-6 border border-slate-200 hover:border-slate-300 hover:shadow-md transition-all">
              <div className="flex items-start justify-between mb-4">
                <div className="p-3 bg-blue-50 rounded-lg">
                  <DollarSign className="text-blue-600" size={24} />
                </div>
                <span className="text-xs font-semibold text-green-600 bg-green-50 px-2 py-1 rounded">
                  <ArrowUpRight size={12} className="inline mr-1" />
                  +12%
                </span>
              </div>
              <p className="text-slate-600 text-sm font-medium mb-2">Total Inventory Value</p>
              <p className="text-3xl font-bold text-slate-900">
                ₹{Math.round(summary.total_inventory_value).toLocaleString()}
              </p>
            </div>

            {/* Active Items Card */}
            <div className="bg-white rounded-xl p-6 border border-slate-200 hover:border-slate-300 hover:shadow-md transition-all">
              <div className="flex items-start justify-between mb-4">
                <div className="p-3 bg-emerald-50 rounded-lg">
                  <Package className="text-emerald-600" size={24} />
                </div>
                <span className="text-xs font-semibold text-slate-600 bg-slate-100 px-2 py-1 rounded">
                  Active
                </span>
              </div>
              <p className="text-slate-600 text-sm font-medium mb-2">Active Items</p>
              <p className="text-3xl font-bold text-slate-900">{summary.items_count}</p>
            </div>

            {/* Low Stock Alert Card */}
            <div className="bg-white rounded-xl p-6 border border-slate-200 hover:border-slate-300 hover:shadow-md transition-all">
              <div className="flex items-start justify-between mb-4">
                <div className="p-3 bg-orange-50 rounded-lg">
                  <AlertCircle className="text-orange-600" size={24} />
                </div>
                <span
                  className={`text-xs font-semibold px-2 py-1 rounded ${
                    summary.low_stock_count > 0
                      ? 'text-red-600 bg-red-50'
                      : 'text-green-600 bg-green-50'
                  }`}
                >
                  {summary.low_stock_count > 0 ? 'Alert' : 'Healthy'}
                </span>
              </div>
              <p className="text-slate-600 text-sm font-medium mb-2">Low Stock Items</p>
              <p className="text-3xl font-bold text-slate-900">{summary.low_stock_count}</p>
            </div>
          </div>
        )}

        {/* Tab Navigation */}
        <div className="flex gap-1 mb-8 bg-white p-1 rounded-lg border border-slate-200 w-fit items-center">
          {(['overview', 'items', 'transactions'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex items-center gap-2 px-4 py-2 rounded-md font-semibold text-sm transition-all ${
                activeTab === tab
                  ? 'bg-slate-900 text-white'
                  : 'text-slate-700 hover:text-slate-900'
              }`}
            >
              {tab === 'overview' && <BarChart3 size={16} />}
              {tab === 'items' && <Package size={16} />}
              {tab === 'transactions' && <TrendingDown size={16} />}
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
          
          <div className="ml-auto">
            <button
              onClick={() => router.push('/dashboard/inventory/restocking-armies')}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-700 rounded-md font-semibold text-sm hover:bg-emerald-100 transition-all"
            >
              <Plus size={16} />
              Restocking Armies
            </button>
          </div>
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Low Stock Alert Section */}
            <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="p-6 border-b border-slate-200">
                <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <AlertCircle size={20} className="text-orange-500" />
                  Running Low on Stock
                </h3>
              </div>
              <div className="divide-y divide-slate-100">
                {items
                  .filter((i) => i.current_quantity <= i.reorder_level && i.is_active)
                  .slice(0, 5)
                  .map((item) => {
                    const stockPercent = (item.current_quantity / item.reorder_level) * 100;
                    return (
                      <div
                        key={item._id}
                        className="p-5 hover:bg-slate-50 transition-colors flex items-center justify-between"
                      >
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-2">
                            <p className="font-semibold text-slate-900">{item.name}</p>
                            <span className="text-xs font-bold text-red-600 bg-red-50 px-2 py-1 rounded">
                              CRITICAL
                            </span>
                          </div>
                          <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                            <div
                              className="bg-red-500 h-full transition-all"
                              style={{ width: `${Math.min(stockPercent, 100)}%` }}
                            ></div>
                          </div>
                          <p className="text-xs text-slate-600 mt-2">
                            {item.current_quantity} / {item.reorder_level} {item.unit}
                          </p>
                        </div>
                        <button
                          onClick={() => router.push(`/dashboard/inventory/items/${item._id}`)}
                          className="ml-4 p-2 hover:bg-slate-200 rounded-lg transition-colors"
                        >
                          <Eye size={16} className="text-slate-600" />
                        </button>
                      </div>
                    );
                  })}
                {items.filter((i) => i.current_quantity <= i.reorder_level && i.is_active).length === 0 && (
                  <div className="p-12 text-center">
                    <Package size={40} className="mx-auto text-slate-300 mb-3" />
                    <p className="text-slate-600 font-medium">All items well-stocked</p>
                  </div>
                )}
              </div>
            </div>

            {/* Recent Transactions Section */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="p-6 border-b border-slate-200">
                <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <TrendingDown size={20} className="text-blue-500" />
                  Recent Activity
                </h3>
              </div>
              <div className="divide-y divide-slate-100 max-h-96 overflow-y-auto">
                {transactions.slice(0, 8).map((txn) => {
                  const isIncrease = txn.quantity_change > 0;
                  return (
                    <div key={txn._id} className="p-4 hover:bg-slate-50 transition-colors">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          {isIncrease ? (
                            <ArrowUpRight size={16} className="text-green-600" />
                          ) : (
                            <ArrowDownRight size={16} className="text-red-600" />
                          )}
                          <span className="text-xs font-bold uppercase text-slate-700">
                            {txn.transaction_type}
                          </span>
                        </div>
                        <span
                          className={`font-bold ${
                            isIncrease ? 'text-green-600' : 'text-red-600'
                          }`}
                        >
                          {isIncrease ? '+' : ''}{txn.quantity_change}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500">
                        {formatDate(txn.timestamp || txn.createdAt || '')}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Items Tab */}
        {activeTab === 'items' && (
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-200">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={18} />
                <input
                  type="text"
                  placeholder="Search by name or SKU..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent"
                />
              </div>
            </div>

            {filteredItems.length === 0 ? (
              <div className="p-12 text-center">
                <Package size={48} className="mx-auto text-slate-300 mb-3" />
                <p className="text-slate-600 text-lg font-medium">No items found</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50">
                      <th className="px-6 py-3 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">Name</th>
                      <th className="px-6 py-3 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">SKU</th>
                      <th className="px-6 py-3 text-center text-xs font-bold text-slate-700 uppercase tracking-wider">Stock</th>
                      <th className="px-6 py-3 text-center text-xs font-bold text-slate-700 uppercase tracking-wider">Reorder</th>
                      <th className="px-6 py-3 text-right text-xs font-bold text-slate-700 uppercase tracking-wider">Unit Cost</th>
                      <th className="px-6 py-3 text-right text-xs font-bold text-slate-700 uppercase tracking-wider">Value</th>
                      <th className="px-6 py-3 text-center text-xs font-bold text-slate-700 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-right text-xs font-bold text-slate-700 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredItems.map((item) => {
                      const isLowStock = item.current_quantity <= item.reorder_level;
                      const isRestocking = restockingItemId === item._id;
                      return (
                        <React.Fragment key={item._id}>
                          <tr className="hover:bg-slate-50 transition-colors">
                            <td className="px-6 py-4 font-semibold text-slate-900">{item.name}</td>
                            <td className="px-6 py-4 text-slate-600 text-sm font-mono">{item.sku}</td>
                            <td className="px-6 py-4 text-center">
                              <span
                                className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-bold ${
                                  isLowStock
                                    ? 'bg-red-50 text-red-700'
                                    : 'bg-emerald-50 text-emerald-700'
                                }`}
                              >
                                {parseFloat(item.current_quantity.toString()).toFixed(2)} {item.unit}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-center text-slate-600 font-medium">
                              {item.reorder_level}
                            </td>
                            <td className="px-6 py-4 text-right text-slate-900 font-medium">
                              ₹{item.cost_per_unit.toFixed(2)}
                            </td>
                            <td className="px-6 py-4 text-right text-slate-900 font-bold">
                              ₹{(item.current_quantity * item.cost_per_unit).toFixed(0)}
                            </td>
                            <td className="px-6 py-4 text-center">
                              <span
                                className={`inline-block px-3 py-1 rounded-full text-xs font-bold ${
                                  item.is_active
                                    ? 'bg-green-50 text-green-700'
                                    : 'bg-slate-100 text-slate-700'
                                }`}
                              >
                                {item.is_active ? '● Active' : '● Inactive'}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-right">
                              <div className="flex justify-end gap-2">
                                <button
                                  onClick={() => handleRestockClick(item)}
                                  className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                                  title="Restock item"
                                >
                                  <Plus size={16} />
                                </button>
                                <button
                                  onClick={() => router.push(`/dashboard/inventory/items/${item._id}`)}
                                  className="p-2 text-slate-600 hover:bg-blue-50 hover:text-blue-600 rounded-lg transition-colors"
                                >
                                  <Edit2 size={16} />
                                </button>
                                <button
                                  onClick={() => handleDeleteItem(item._id)}
                                  className="p-2 text-slate-600 hover:bg-red-50 hover:text-red-600 rounded-lg transition-colors"
                                >
                                  <Trash2 size={16} />
                                </button>
                              </div>
                            </td>
                          </tr>
                          {isRestocking && (
                            <tr className="bg-emerald-50">
                              <td colSpan={8} className="px-6 py-4">
                                <div className="flex items-center gap-4">
                                  <span className="text-sm font-medium text-slate-900">Restock Quantity ({item.unit}):</span>
                                  <input
                                    type="number"
                                    value={restockQuantities[item._id] || ''}
                                    onChange={(e) => setRestockQuantities({ ...restockQuantities, [item._id]: parseFloat(e.target.value) || 0 })}
                                    className="px-3 py-2 border border-emerald-300 rounded-lg w-32 focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
                                    step="0.01"
                                    min="0"
                                  />
                                  <span className="text-sm text-slate-600">
                                    New stock: {parseFloat(item.current_quantity.toString()).toFixed(2)} + {(restockQuantities[item._id] || 0).toFixed(2)} = {(item.current_quantity + (restockQuantities[item._id] || 0)).toFixed(2)} {item.unit}
                                  </span>
                                  <div className="flex gap-2 ml-auto">
                                    <button
                                      onClick={handleRestockCancel}
                                      className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors"
                                    >
                                      Cancel
                                    </button>
                                    <button
                                      onClick={() => handleRestockSave(item._id)}
                                      className="px-4 py-2 bg-emerald-600 text-white text-sm font-medium rounded-lg hover:bg-emerald-700 transition-colors"
                                    >
                                      Save Restock
                                    </button>
                                  </div>
                                </div>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Transactions Tab */}
        {activeTab === 'transactions' && (
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            {transactions.length === 0 ? (
              <div className="p-12 text-center">
                <TrendingDown size={48} className="mx-auto text-slate-300 mb-3" />
                <p className="text-slate-600 text-lg font-medium">No transactions yet</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50">
                      <th className="px-6 py-3 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">Item</th>
                      <th className="px-6 py-3 text-center text-xs font-bold text-slate-700 uppercase tracking-wider">Type</th>
                      <th className="px-6 py-3 text-center text-xs font-bold text-slate-700 uppercase tracking-wider">Qty</th>
                      <th className="px-6 py-3 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">Reference</th>
                      <th className="px-6 py-3 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">Date & Time</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {transactions.map((txn) => {
                      const item = items.find((i) => i._id === txn.item_id);
                      const isIncrease = txn.quantity_change > 0;
                      return (
                        <tr key={txn._id} className="hover:bg-slate-50 transition-colors">
                          <td className="px-6 py-4 font-semibold text-slate-900">{item?.name || 'Unknown'}</td>
                          <td className="px-6 py-4 text-center">
                            <div className="flex items-center justify-center gap-2">
                              {isIncrease ? (
                                <ArrowUpRight size={16} className="text-green-600" />
                              ) : (
                                <ArrowDownRight size={16} className="text-red-600" />
                              )}
                              <span className={`text-xs font-bold uppercase ${
                                isIncrease ? 'text-green-700' : 'text-red-700'
                              }`}>
                                {txn.transaction_type}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <span
                              className={`font-bold ${
                                isIncrease ? 'text-green-600' : 'text-red-600'
                              }`}
                            >
                              {isIncrease ? '+' : ''}{txn.quantity_change}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-slate-600 text-sm">
                            {txn.reference_order_id ? `Order: ${txn.reference_order_id.slice(0, 8)}` : '—'}
                          </td>
                          <td className="px-6 py-4 text-slate-600 text-sm">
                            {formatDate(txn.timestamp || txn.createdAt || '')}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
