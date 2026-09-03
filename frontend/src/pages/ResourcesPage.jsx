import React, { useState, useEffect } from 'react';
import axiosClient from '../api/axiosClient';
import { useAuth } from '../context/AuthContext';
import { useWebSocket } from '../context/WebSocketContext';
import useCurrentLocation from '../hooks/useCurrentLocation';
import { getCurrentPosition } from '../services/locationService';
import Modal from '../components/common/Modal';
import Loading from '../components/common/Loading';
import EmptyState from '../components/common/EmptyState';
import ErrorState from '../components/common/ErrorState';
import {
  Plus,
  AlertTriangle,
  Layers,
  MapPin,
  Edit2,
  ArrowRight,
} from 'lucide-react';
import { Link } from 'react-router-dom';

const CATEGORIES = [
  'food',
  'water',
  'medicine',
  'blankets',
  'boats',
  'life_jackets',
  'ambulances',
  'first_aid',
  'rescue_equipment',
  'clothes',
  'other',
];

const ResourcesPage = () => {
  const { location: userGpsLocation } = useCurrentLocation();
  const [resources, setResources] = useState([]);
  const [shortages, setShortages] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [categoryFilter, setCategoryFilter] = useState('');

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingResource, setEditingResource] = useState(null);

  const [formData, setFormData] = useState({
    name: '',
    category: 'food',
    unit: 'packets',
    total_quantity: 100,
    available_quantity: 100,
    reserved_quantity: 0,
    allocated_quantity: 0,
    location_name: '',
    latitude: '',
    longitude: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  const { hasRole } = useAuth();
  const { addToast } = useWebSocket();

  const fetchResources = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const resRes = await axiosClient.get('/api/resources/');
      setResources(resRes.data);
      setShortages(resRes.data.filter((r) => r.available_quantity <= 10));
    } catch (err) {
      console.error('Failed to load resources:', err);
      setError('Failed to fetch supply inventory.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchResources();
  }, []);

  const handleOpenCreate = async () => {
    setEditingResource(null);
    let initialLat = userGpsLocation?.lat || '';
    let initialLon = userGpsLocation?.lon || '';
    if (!initialLat) {
      try {
        const pos = await getCurrentPosition();
        initialLat = pos.lat;
        initialLon = pos.lon;
      } catch {}
    }

    setFormData({
      name: '',
      category: 'food',
      unit: 'packets',
      total_quantity: 100,
      available_quantity: 100,
      reserved_quantity: 0,
      allocated_quantity: 0,
      location_name: '',
      latitude: initialLat,
      longitude: initialLon,
    });
    setFormError('');
    setShowCreateModal(true);
  };

  const handleOpenEdit = (res) => {
    setEditingResource(res);
    setFormData({
      name: res.name,
      category: res.category,
      unit: res.unit,
      total_quantity: res.total_quantity,
      available_quantity: res.available_quantity,
      reserved_quantity: res.reserved_quantity,
      allocated_quantity: res.allocated_quantity,
      location_name: res.location_name,
      latitude: res.latitude || '',
      longitude: res.longitude || '',
    });
    setFormError('');
    setShowCreateModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.location_name) {
      setFormError('Please enter resource name and depot location.');
      return;
    }

    setIsSubmitting(true);
    setFormError('');

    try {
      if (editingResource) {
        await axiosClient.put(`/api/resources/${editingResource.id}`, formData);
        addToast('Resource Updated', `Stock for "${formData.name}" updated.`, 'info');
      } else {
        await axiosClient.post('/api/resources/', formData);
        addToast('Resource Registered', `New stockpile "${formData.name}" added to matrix.`, 'info');
      }
      setShowCreateModal(false);
      fetchResources();
    } catch (err) {
      console.error('Resource save failed:', err);
      setFormError(err.response?.data?.detail || 'Failed to save resource.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredResources = resources.filter((r) => {
    if (!categoryFilter) return true;
    return r.category === categoryFilter;
  });

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              Relief Supply & Resource Inventory
            </h1>
            <span className="px-2 py-0.5 text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200 rounded-full">
              {resources.length} Stockpiles Monitored
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time stockpile quotas, shortage prevention, and deployment allocations.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Link
            to="/resource-allocation"
            className="px-3.5 py-2 rounded-lg text-xs font-semibold bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 shadow-xs transition-colors flex items-center gap-1.5"
          >
            <Layers className="w-4 h-4 text-slate-500" />
            Allocation Matrix
          </Link>

          {hasRole(['admin', 'operator']) && (
            <button
              onClick={handleOpenCreate}
              className="px-4 py-2 rounded-lg text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white shadow-xs transition-colors flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Add Stock
            </button>
          )}
        </div>
      </div>

      {/* Critical Shortage Warning Banner */}
      {shortages.length > 0 && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 flex items-start gap-3 text-xs text-red-800">
          <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div className="space-y-1">
            <span className="font-bold text-red-900 uppercase tracking-wide">
              Critical Inventory Shortages Detected ({shortages.length} Items)
            </span>
            <p className="text-red-700">
              Low stock on:{' '}
              {shortages.map((s) => `${s.name} (${s.available_quantity} ${s.unit} left)`).join(', ')}
            </p>
          </div>
        </div>
      )}

      {/* Category Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-3">
        <button
          onClick={() => setCategoryFilter('')}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
            categoryFilter === ''
              ? 'bg-blue-50 text-blue-700 border border-blue-200 font-semibold shadow-xs'
              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          All Supplies ({resources.length})
        </button>
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => setCategoryFilter(cat)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              categoryFilter === cat
                ? 'bg-blue-50 text-blue-700 border border-blue-200 font-semibold shadow-xs'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            {cat.replace(/_/g, ' ')} ({resources.filter((r) => r.category === cat).length})
          </button>
        ))}
      </div>

      {/* Resources Grid */}
      {isLoading ? (
        <Loading text="Loading supply inventory..." />
      ) : error ? (
        <ErrorState message={error} onRetry={fetchResources} />
      ) : filteredResources.length === 0 ? (
        <EmptyState
          title="No Resources Found"
          description="There are currently no supply items matching this category."
          actionLabel="Add Resource Stock"
          onAction={handleOpenCreate}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredResources.map((r) => {
            const isLow = r.available_quantity <= 10;
            const percentageAvailable = Math.round((r.available_quantity / (r.total_quantity || 1)) * 100);

            return (
              <div
                key={r.id}
                className={`card-base p-5 transition-all ${
                  isLow ? 'border-l-4 border-l-red-500' : ''
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700 uppercase border border-slate-200">
                      {r.category}
                    </span>
                    <h4 className="text-sm font-bold text-slate-900 mt-1.5">{r.name}</h4>
                    <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" />
                      {r.location_name}
                    </p>
                  </div>

                  <div className="text-right">
                    <span
                      className={`text-base font-bold block ${
                        isLow ? 'text-red-600' : 'text-emerald-600'
                      }`}
                    >
                      {r.available_quantity}{' '}
                      <span className="text-xs font-normal text-slate-500">{r.unit}</span>
                    </span>
                    <span className="text-[10px] text-slate-400">
                      of {r.total_quantity} total
                    </span>
                  </div>
                </div>

                {/* Stock Progress Bar */}
                <div className="mt-4 space-y-1.5">
                  <div className="flex items-center justify-between text-[11px] text-slate-500">
                    <span>Stock Availability</span>
                    <span className={isLow ? 'text-red-600 font-bold' : 'text-emerald-600 font-medium'}>
                      {percentageAvailable}%
                    </span>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-slate-100 overflow-hidden">
                    <div
                      className={`h-full transition-all duration-500 ${
                        isLow ? 'bg-red-500' : 'bg-emerald-500'
                      }`}
                      style={{ width: `${Math.min(100, Math.max(0, percentageAvailable))}%` }}
                    />
                  </div>
                </div>

                {/* Allocated & Reserved Breakdown */}
                <div className="mt-3 grid grid-cols-2 gap-2 text-center text-xs bg-slate-50 p-2 rounded-lg border border-slate-100">
                  <div>
                    <span className="text-[10px] text-slate-500 block">Allocated</span>
                    <span className="font-semibold text-slate-800">
                      {r.allocated_quantity || 0} {r.unit}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 block">Reserved</span>
                    <span className="font-semibold text-purple-600">
                      {r.reserved_quantity || 0} {r.unit}
                    </span>
                  </div>
                </div>

                {/* Footer Controls */}
                {hasRole(['admin', 'operator']) && (
                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                    <Link
                      to="/resource-allocation"
                      className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1"
                    >
                      Allocate <ArrowRight className="w-3.5 h-3.5" />
                    </Link>

                    <button
                      onClick={() => handleOpenEdit(r)}
                      className="p-1.5 rounded-md text-slate-400 hover:text-blue-600 hover:bg-slate-100 transition-colors"
                      title="Edit Stock"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Modal: Create / Edit Resource */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title={editingResource ? 'Update Supply Stockpile' : 'Register New Supply Stock'}
        maxWidth="max-w-xl"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {formError && (
            <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
              <span>{formError}</span>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Resource Name *</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Inflatable Rescue Boats"
                className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Category *</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-blue-500"
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c.replace(/_/g, ' ')}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Unit of Measure</label>
              <input
                type="text"
                value={formData.unit}
                onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                placeholder="units, boxes, liters"
                className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Total Quantity</label>
              <input
                type="number"
                min={0}
                value={formData.total_quantity}
                onChange={(e) => {
                  const val = parseInt(e.target.value) || 0;
                  setFormData({ ...formData, total_quantity: val, available_quantity: val });
                }}
                className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Available Quantity</label>
              <input
                type="number"
                min={0}
                value={formData.available_quantity}
                onChange={(e) => setFormData({ ...formData, available_quantity: parseInt(e.target.value) || 0 })}
                className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Stockpile Location Name</label>
            <input
              type="text"
              required
              value={formData.location_name}
              onChange={(e) => setFormData({ ...formData, location_name: e.target.value })}
              placeholder="e.g., Central Food Corporation Depot, Sector 4"
              className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-blue-500"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
            <button
              type="button"
              onClick={() => setShowCreateModal(false)}
              className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2.5 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-xs"
            >
              {isSubmitting ? 'Saving...' : editingResource ? 'Update Stock' : 'Register Stock'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default ResourcesPage;
