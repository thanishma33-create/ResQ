import React, { useState, useEffect } from 'react';
import axiosClient from '../api/axiosClient';
import { useAuth } from '../context/AuthContext';
import { useWebSocket } from '../context/WebSocketContext';
import StatusBadge from '../components/common/StatusBadge';
import Modal from '../components/common/Modal';
import Loading from '../components/common/Loading';
import EmptyState from '../components/common/EmptyState';
import ErrorState from '../components/common/ErrorState';
import { formatDate, formatEmergencyType } from '../utils/formatters';
import {
  Plus,
  Package,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';
import { Link } from 'react-router-dom';

const ALLOCATION_STATUSES = ['ALLOCATED', 'IN_TRANSIT', 'DELIVERED', 'RETURNED'];

const ResourceAllocationPage = () => {
  const [allocations, setAllocations] = useState([]);
  const [emergencies, setEmergencies] = useState([]);
  const [resources, setResources] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Modal
  const [showAllocateModal, setShowAllocateModal] = useState(false);
  const [formData, setFormData] = useState({
    emergency_id: '',
    resource_id: '',
    allocated_quantity: 10,
    notes: 'Urgent relief supply dispatched.',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  const { hasRole } = useAuth();
  const { addToast } = useWebSocket();

  const fetchData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [allocRes, emRes, resRes] = await Promise.all([
        axiosClient.get('/api/resources/allocations/all'),
        axiosClient.get('/api/emergencies/'),
        axiosClient.get('/api/resources/'),
      ]);

      setAllocations(allocRes.data);
      setEmergencies(emRes.data);
      setResources(resRes.data);
    } catch (err) {
      console.error('Failed to load allocations:', err);
      setError('Failed to fetch resource allocations.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleOpenAllocate = () => {
    setFormData({
      emergency_id: emergencies[0]?.id || '',
      resource_id: resources[0]?.id || '',
      allocated_quantity: 10,
      notes: 'Urgent relief supply dispatched.',
    });
    setFormError('');
    setShowAllocateModal(true);
  };

  const handleAllocateSubmit = async (e) => {
    e.preventDefault();
    if (!formData.emergency_id || !formData.resource_id || formData.allocated_quantity <= 0) {
      setFormError('Please select both emergency and resource with a positive quantity.');
      return;
    }

    setIsSubmitting(true);
    setFormError('');

    try {
      const payload = {
        emergency_id: parseInt(formData.emergency_id, 10),
        resource_id: parseInt(formData.resource_id, 10),
        allocated_quantity: parseInt(formData.allocated_quantity, 10),
        notes: formData.notes,
      };

      await axiosClient.post('/api/resources/allocate', payload);
      addToast('Resource Allocated', 'Supply quota successfully allocated.', 'info');
      setShowAllocateModal(false);
      fetchData();
    } catch (err) {
      console.error('Allocation error:', err);
      setFormError(err.response?.data?.detail || 'Failed to allocate resource. Check available stock.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStatusChange = async (allocationId, newStatus) => {
    try {
      await axiosClient.patch(`/api/resources/allocation/${allocationId}/status?new_status=${newStatus}`);
      addToast('Allocation Updated', `Status changed to ${newStatus}`, 'info');
      fetchData();
    } catch (err) {
      console.error(err);
      addToast('Update Failed', 'Failed to update allocation status.', 'danger');
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              Relief Supply Allocation Matrix
            </h1>
            <span className="px-2 py-0.5 text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200 rounded-full">
              {allocations.length} Active Shipments
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time supply chain tracking from central depots to affected emergency zones.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={fetchData}
            className="p-2 rounded-lg bg-white border border-slate-300 text-slate-600 hover:bg-slate-50 shadow-xs"
            title="Refresh"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          {hasRole(['admin', 'operator']) && (
            <button
              onClick={handleOpenAllocate}
              className="px-4 py-2 rounded-lg text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white shadow-xs transition-colors flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Allocate Supplies
            </button>
          )}
        </div>
      </div>

      {/* Allocations Table */}
      {isLoading ? (
        <Loading text="Loading supply allocations..." />
      ) : error ? (
        <ErrorState message={error} onRetry={fetchData} />
      ) : allocations.length === 0 ? (
        <EmptyState
          title="No Active Resource Allocations"
          description="There are currently no relief supplies dispatched to emergency incidents."
          actionLabel="Dispatch Supplies"
          onAction={handleOpenAllocate}
        />
      ) : (
        <div className="card-base overflow-hidden">
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  <th className="py-3 px-4">Emergency Incident</th>
                  <th className="py-3 px-4">Supplies Allocated</th>
                  <th className="py-3 px-4">Dispatched Quantity</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Dispatch Notes</th>
                  <th className="py-3 px-4">Timestamp</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {allocations.map((a) => (
                  <tr key={a.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 font-medium">
                      <Link
                        to={`/emergencies/${a.emergency_id}`}
                        className="text-blue-600 hover:underline font-semibold"
                      >
                        Incident #{a.emergency_id}
                      </Link>
                    </td>

                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <Package className="w-4 h-4 text-amber-600" />
                        <div>
                          <p className="font-semibold text-slate-800">
                            {a.resource?.name || `Resource SKU #${a.resource_id}`}
                          </p>
                          <span className="text-[10px] text-slate-400">
                            {a.resource?.category || 'Supply'}
                          </span>
                        </div>
                      </div>
                    </td>

                    <td className="py-3 px-4 font-mono font-bold text-slate-900">
                      {a.allocated_quantity} {a.resource?.unit || 'units'}
                    </td>

                    <td className="py-3 px-4">
                      <StatusBadge status={a.status} size="sm" />
                    </td>

                    <td className="py-3 px-4 text-slate-600 max-w-xs truncate">
                      {a.notes || 'Direct emergency supply allocation'}
                    </td>

                    <td className="py-3 px-4 text-slate-400 text-[11px] whitespace-nowrap">
                      {formatDate(a.created_at)}
                    </td>

                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      {hasRole(['admin', 'operator', 'rescue_team']) && (
                        <select
                          value={a.status}
                          onChange={(e) => handleStatusChange(a.id, e.target.value)}
                          className="bg-white border border-slate-300 rounded-md px-2 py-1 text-[11px] text-slate-700 focus:outline-none focus:border-blue-500"
                        >
                          {ALLOCATION_STATUSES.map((st) => (
                            <option key={st} value={st}>
                              {st}
                            </option>
                          ))}
                        </select>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal: Allocate Supplies */}
      <Modal
        isOpen={showAllocateModal}
        onClose={() => setShowAllocateModal(false)}
        title="Allocate Relief Stock to Incident"
        maxWidth="max-w-xl"
      >
        <form onSubmit={handleAllocateSubmit} className="space-y-4">
          {formError && (
            <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-600" />
              <span>{formError}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Select Target Emergency Incident *
            </label>
            <select
              value={formData.emergency_id}
              onChange={(e) => setFormData({ ...formData, emergency_id: e.target.value })}
              className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-blue-500"
            >
              {emergencies.map((em) => (
                <option key={em.id} value={em.id}>
                  #{em.id} - {formatEmergencyType(em.emergency_type)} ({em.address} - {em.severity})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Select Available Supply *
              </label>
              <select
                value={formData.resource_id}
                onChange={(e) => setFormData({ ...formData, resource_id: e.target.value })}
                className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-blue-500"
              >
                {resources.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name} ({r.available_quantity} {r.unit} available)
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Dispatch Quantity *
              </label>
              <input
                type="number"
                min={1}
                required
                value={formData.allocated_quantity}
                onChange={(e) => setFormData({ ...formData, allocated_quantity: parseInt(e.target.value) || 1 })}
                className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Dispatch Directives & Courier Notes
            </label>
            <textarea
              rows={2}
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Fast-track shipment to primary relief shelter."
              className="w-full bg-white border border-slate-300 rounded-lg p-2.5 text-xs text-slate-800 focus:outline-none focus:border-blue-500"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
            <button
              type="button"
              onClick={() => setShowAllocateModal(false)}
              className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2.5 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-xs"
            >
              {isSubmitting ? 'Allocating...' : 'Confirm Allocation'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default ResourceAllocationPage;
