import React, { useState, useEffect } from 'react';
import axiosClient from '../api/axiosClient';
import { useAuth } from '../context/AuthContext';
import { useWebSocket } from '../context/WebSocketContext';
import Modal from '../components/common/Modal';
import Loading from '../components/common/Loading';
import EmptyState from '../components/common/EmptyState';
import ErrorState from '../components/common/ErrorState';
import StatusBadge from '../components/common/StatusBadge';
import {
  Building2,
  Plus,
  Users,
  HeartPulse,
  Utensils,
  Droplet,
  Zap,
  Accessibility,
  Phone,
  MapPin,
  RefreshCw,
  Edit2,
  CheckCircle,
  AlertTriangle,
} from 'lucide-react';

import useCurrentLocation from '../hooks/useCurrentLocation';
import { getCurrentPosition } from '../services/locationService';

const SheltersPage = () => {
  const { location: userGpsLocation } = useCurrentLocation();
  const [shelters, setShelters] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showOccupancyModal, setShowOccupancyModal] = useState(false);
  const [selectedShelter, setSelectedShelter] = useState(null);
  const [occupancyDelta, setOccupancyDelta] = useState(5);

  const [formData, setFormData] = useState({
    name: '',
    address: '',
    latitude: '',
    longitude: '',
    capacity: 250,
    occupied: 0,
    has_medical_facility: true,
    has_food: true,
    has_water: true,
    has_electricity: true,
    is_accessible: true,
    contact_person: '',
    contact_phone: '',
    status: 'OPEN',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  const { hasRole } = useAuth();
  const { addToast } = useWebSocket();

  const fetchShelters = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await axiosClient.get('/api/shelters/');
      setShelters(res.data);
    } catch (err) {
      console.error('Failed to load shelters:', err);
      setError('Failed to fetch shelter records.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchShelters();
  }, []);

  const handleOpenCreate = async () => {
    setSelectedShelter(null);
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
      address: '',
      latitude: initialLat,
      longitude: initialLon,
      capacity: 250,
      occupied: 0,
      has_medical_facility: true,
      has_food: true,
      has_water: true,
      has_electricity: true,
      is_accessible: true,
      contact_person: '',
      contact_phone: '',
      status: 'OPEN',
    });
    setFormError('');
    setShowCreateModal(true);
  };

  const handleOpenEdit = (shelter) => {
    setSelectedShelter(shelter);
    setFormData({
      name: shelter.name,
      address: shelter.address,
      latitude: shelter.latitude,
      longitude: shelter.longitude,
      capacity: shelter.capacity,
      occupied: shelter.occupied,
      has_medical_facility: shelter.has_medical_facility,
      has_food: shelter.has_food,
      has_water: shelter.has_water,
      has_electricity: shelter.has_electricity,
      is_accessible: shelter.is_accessible,
      contact_person: shelter.contact_person || '',
      contact_phone: shelter.contact_phone || '',
      status: shelter.status,
    });
    setFormError('');
    setShowCreateModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.address) {
      setFormError('Please enter shelter name and address.');
      return;
    }

    setIsSubmitting(true);
    setFormError('');

    try {
      if (selectedShelter) {
        await axiosClient.put(`/api/shelters/${selectedShelter.id}`, formData);
        addToast('Shelter Updated', `Facility "${formData.name}" updated.`, 'info');
      } else {
        await axiosClient.post('/api/shelters/', formData);
        addToast('Shelter Created', `Relief camp "${formData.name}" registered.`, 'info');
      }
      setShowCreateModal(false);
      fetchShelters();
    } catch (err) {
      console.error('Shelter save error:', err);
      setFormError(err.response?.data?.detail || 'Failed to save shelter.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateOccupancy = async (delta) => {
    if (!selectedShelter) return;
    try {
      await axiosClient.patch(`/api/shelters/${selectedShelter.id}/occupancy`, {
        change_count: delta,
        notes: `Occupancy adjusted by ${delta > 0 ? '+' : ''}${delta}`,
      });
      addToast('Occupancy Updated', `Shelter occupancy adjusted.`, 'info');
      setShowOccupancyModal(false);
      fetchShelters();
    } catch (err) {
      console.error('Occupancy update failed:', err);
      addToast('Update Failed', err.response?.data?.detail || 'Capacity limit exceeded.', 'danger');
    }
  };

  // Aggregates
  const totalCapacity = shelters.reduce((acc, s) => acc + (s.capacity || 0), 0);
  const totalOccupied = shelters.reduce((acc, s) => acc + (s.occupied || 0), 0);
  const overallOccupancyPct = totalCapacity > 0 ? Math.round((totalOccupied / totalCapacity) * 100) : 0;

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-black text-slate-100 tracking-tight">
              Relief Shelter Operations
            </h1>
            <span className="px-2 py-0.5 text-xs font-mono font-bold bg-purple-950 text-purple-300 border border-purple-800 rounded-full">
              {shelters.length} Facilities Active
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Real-time occupancy management, amenities inspection, and bed capacity gauges.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={fetchShelters}
            className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 border border-slate-700"
            title="Refresh"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          {hasRole(['admin', 'operator']) && (
            <button
              onClick={handleOpenCreate}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-cyan-600 hover:bg-cyan-500 text-white shadow-glow transition-all flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Register Shelter
            </button>
          )}
        </div>
      </div>

      {/* Aggregate Overview Banner */}
      <div className="glass-card p-5 rounded-2xl border border-purple-900/60 bg-purple-950/20 grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
        <div>
          <span className="text-[10px] font-mono uppercase text-slate-400 font-bold block">
            Total Accommodated
          </span>
          <span className="text-2xl sm:text-3xl font-black text-purple-300 font-mono">
            {totalOccupied} <span className="text-xs font-normal text-slate-400">/ {totalCapacity} Beds</span>
          </span>
        </div>

        <div>
          <span className="text-[10px] font-mono uppercase text-slate-400 font-bold block">
            Total Available Beds
          </span>
          <span className="text-2xl sm:text-3xl font-black text-emerald-400 font-mono">
            {totalCapacity - totalOccupied} Beds
          </span>
        </div>

        <div>
          <span className="text-[10px] font-mono uppercase text-slate-400 font-bold block">
            Overall Occupancy Rate
          </span>
          <span
            className={`text-2xl sm:text-3xl font-black font-mono ${
              overallOccupancyPct >= 90
                ? 'text-rose-400'
                : overallOccupancyPct >= 70
                ? 'text-amber-400'
                : 'text-cyan-400'
            }`}
          >
            {overallOccupancyPct}%
          </span>
        </div>
      </div>

      {/* Shelters Grid */}
      {isLoading ? (
        <Loading text="Loading relief shelters..." />
      ) : error ? (
        <ErrorState message={error} onRetry={fetchShelters} />
      ) : shelters.length === 0 ? (
        <EmptyState
          title="No Relief Shelters Found"
          description="There are currently no active relief shelters registered in the command matrix."
          actionLabel="Register Shelter Facility"
          onAction={handleOpenCreate}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {shelters.map((s) => {
            const occupancyPct = Math.round(((s.occupied || 0) / (s.capacity || 1)) * 100);
            const isNearlyFull = occupancyPct >= 80 && occupancyPct < 100;
            const isFull = occupancyPct >= 100;

            return (
              <div
                key={s.id}
                className={`glass-card p-5 rounded-2xl border transition-all flex flex-col justify-between space-y-4 ${
                  isFull
                    ? 'border-rose-900/60 bg-rose-950/10'
                    : isNearlyFull
                    ? 'border-amber-900/60 bg-amber-950/10'
                    : 'border-slate-800'
                }`}
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h4 className="text-sm font-bold text-slate-100">{s.name}</h4>
                      <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                        <MapPin className="w-3.5 h-3.5 text-slate-500" />
                        {s.address}
                      </p>
                    </div>
                    <span
                      className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold uppercase ${
                        isFull
                          ? 'bg-rose-950 text-rose-300 border border-rose-800'
                          : isNearlyFull
                          ? 'bg-amber-950 text-amber-300 border border-amber-800'
                          : 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                      }`}
                    >
                      {isFull ? 'FULL' : isNearlyFull ? 'NEARLY FULL' : 'AVAILABLE'}
                    </span>
                  </div>

                  {/* Occupancy Progress Bar */}
                  <div className="mt-4 space-y-1.5">
                    <div className="flex items-center justify-between text-xs font-mono">
                      <span className="text-slate-400">Occupancy:</span>
                      <span className="font-bold text-slate-200">
                        {s.occupied} / {s.capacity} ({occupancyPct}%)
                      </span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                      <div
                        className={`h-full transition-all duration-500 ${
                          isFull ? 'bg-rose-500' : isNearlyFull ? 'bg-amber-500' : 'bg-emerald-500'
                        }`}
                        style={{ width: `${Math.min(100, occupancyPct)}%` }}
                      />
                    </div>
                    <span className="text-[10px] font-mono text-emerald-400 block text-right">
                      {Math.max(0, s.capacity - s.occupied)} beds free
                    </span>
                  </div>

                  {/* Amenities Badges */}
                  <div className="mt-3 pt-3 border-t border-slate-800">
                    <span className="text-[10px] font-mono uppercase text-slate-500 font-semibold block mb-1.5">
                      Facility Amenities:
                    </span>
                    <div className="flex flex-wrap gap-1.5 text-[11px]">
                      {s.has_medical_facility && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-slate-800 text-rose-300 border border-slate-700">
                          <HeartPulse className="w-3 h-3 text-rose-400" /> Medical
                        </span>
                      )}
                      {s.has_food && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-slate-800 text-amber-300 border border-slate-700">
                          <Utensils className="w-3 h-3 text-amber-400" /> Food
                        </span>
                      )}
                      {s.has_water && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-slate-800 text-cyan-300 border border-slate-700">
                          <Droplet className="w-3 h-3 text-cyan-400" /> Water
                        </span>
                      )}
                      {s.has_electricity && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-slate-800 text-amber-300 border border-slate-700">
                          <Zap className="w-3 h-3 text-amber-400" /> Power
                        </span>
                      )}
                      {s.is_accessible && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-slate-800 text-purple-300 border border-slate-700">
                          <Accessibility className="w-3 h-3 text-purple-400" /> Accessible
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Footer Controls: Check-in / Out */}
                <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-xs">
                  <span className="text-[11px] font-mono text-slate-400 truncate max-w-[130px]">
                    📞 {s.contact_phone || 'Control Station'}
                  </span>

                  {hasRole(['admin', 'operator', 'volunteer', 'rescue_team']) && (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          setSelectedShelter(s);
                          setShowOccupancyModal(true);
                        }}
                        className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-purple-950 hover:bg-purple-900/80 text-purple-300 border border-purple-800"
                      >
                        Check In/Out
                      </button>

                      {hasRole(['admin', 'operator']) && (
                        <button
                          onClick={() => handleOpenEdit(s)}
                          className="p-1 rounded-lg text-slate-400 hover:text-cyan-400"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal: Check In / Out Occupancy */}
      <Modal
        isOpen={showOccupancyModal}
        onClose={() => setShowOccupancyModal(false)}
        title={`👥 Update Occupancy: ${selectedShelter?.name}`}
        maxWidth="max-w-md"
      >
        <div className="space-y-4">
          <div className="bg-slate-900/80 p-3.5 rounded-xl border border-slate-800 text-xs space-y-1 font-mono">
            <p>Current Occupied: <strong className="text-cyan-400">{selectedShelter?.occupied}</strong></p>
            <p>Max Bed Capacity: <strong className="text-slate-200">{selectedShelter?.capacity}</strong></p>
          </div>

          <div className="space-y-2">
            <span className="text-xs font-mono font-bold text-slate-300 block">
              Quick Occupancy Adjustment:
            </span>
            <div className="grid grid-cols-4 gap-2">
              <button
                type="button"
                onClick={() => handleUpdateOccupancy(-10)}
                className="py-2 rounded-xl text-xs font-mono font-bold bg-slate-800 hover:bg-slate-700 text-rose-300 border border-slate-700"
              >
                -10
              </button>
              <button
                type="button"
                onClick={() => handleUpdateOccupancy(-1)}
                className="py-2 rounded-xl text-xs font-mono font-bold bg-slate-800 hover:bg-slate-700 text-rose-300 border border-slate-700"
              >
                -1
              </button>
              <button
                type="button"
                onClick={() => handleUpdateOccupancy(1)}
                className="py-2 rounded-xl text-xs font-mono font-bold bg-slate-800 hover:bg-slate-700 text-emerald-300 border border-slate-700"
              >
                +1
              </button>
              <button
                type="button"
                onClick={() => handleUpdateOccupancy(10)}
                className="py-2 rounded-xl text-xs font-mono font-bold bg-slate-800 hover:bg-slate-700 text-emerald-300 border border-slate-700"
              >
                +10
              </button>
            </div>
          </div>
        </div>
      </Modal>

      {/* Modal: Create/Edit Shelter */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title={selectedShelter ? '✏️ Update Relief Shelter' : '🏫 Register New Relief Shelter'}
        maxWidth="max-w-xl"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {formError && (
            <div className="p-3 rounded-xl bg-rose-950/70 border border-rose-800 text-rose-300 text-xs flex items-center gap-2">
              <span>{formError}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-mono font-medium text-slate-300 mb-1">Shelter Name *</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Central Community Hall Shelter"
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-cyan-500"
            />
          </div>

          <div>
            <label className="block text-xs font-mono font-medium text-slate-300 mb-1">Physical Address *</label>
            <input
              type="text"
              required
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              placeholder="e.g., Relief Camp, North Sector"
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-cyan-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-mono font-medium text-slate-300 mb-1">Total Capacity (Beds)</label>
              <input
                type="number"
                min={1}
                value={formData.capacity}
                onChange={(e) => setFormData({ ...formData, capacity: parseInt(e.target.value) || 1 })}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-cyan-500"
              />
            </div>
            <div>
              <label className="block text-xs font-mono font-medium text-slate-300 mb-1">Current Occupied</label>
              <input
                type="number"
                min={0}
                value={formData.occupied}
                onChange={(e) => setFormData({ ...formData, occupied: parseInt(e.target.value) || 0 })}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-cyan-500"
              />
            </div>
          </div>

          {/* Amenities toggles */}
          <div>
            <span className="block text-xs font-mono font-medium text-slate-300 mb-2">Facility Amenities:</span>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.has_medical_facility}
                  onChange={(e) => setFormData({ ...formData, has_medical_facility: e.target.checked })}
                  className="w-4 h-4 text-cyan-600 rounded bg-slate-800"
                />
                <span>Medical Camp</span>
              </label>

              <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.has_food}
                  onChange={(e) => setFormData({ ...formData, has_food: e.target.checked })}
                  className="w-4 h-4 text-cyan-600 rounded bg-slate-800"
                />
                <span>Food Kitchen</span>
              </label>

              <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.has_water}
                  onChange={(e) => setFormData({ ...formData, has_water: e.target.checked })}
                  className="w-4 h-4 text-cyan-600 rounded bg-slate-800"
                />
                <span>Clean Water</span>
              </label>

              <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.has_electricity}
                  onChange={(e) => setFormData({ ...formData, has_electricity: e.target.checked })}
                  className="w-4 h-4 text-cyan-600 rounded bg-slate-800"
                />
                <span>Power Supply</span>
              </label>

              <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.is_accessible}
                  onChange={(e) => setFormData({ ...formData, is_accessible: e.target.checked })}
                  className="w-4 h-4 text-cyan-600 rounded bg-slate-800"
                />
                <span>Wheelchair Access</span>
              </label>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setShowCreateModal(false)}
              className="px-4 py-2 text-xs text-slate-400 hover:text-slate-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2.5 text-xs font-bold bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl shadow-glow"
            >
              {isSubmitting ? 'Saving...' : 'Save Shelter'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default SheltersPage;
