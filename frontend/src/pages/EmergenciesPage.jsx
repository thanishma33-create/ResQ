import React, { useState, useEffect } from 'react';
import axiosClient from '../api/axiosClient';
import { useOffline } from '../context/OfflineContext';
import { useWebSocket } from '../context/WebSocketContext';
import { getCurrentPosition } from '../utils/geoUtils';
import EmergencyCard from '../components/emergency/EmergencyCard';
import EmergencyTable from '../components/emergency/EmergencyTable';
import VoiceReporter from '../components/emergency/VoiceReporter';
import DuplicateModal from '../components/emergency/DuplicateModal';
import Modal from '../components/common/Modal';
import Loading from '../components/common/Loading';
import EmptyState from '../components/common/EmptyState';
import ErrorState from '../components/common/ErrorState';
import {
  AlertTriangle,
  Plus,
  Mic,
  Search,
  LayoutGrid,
  List,
  RefreshCw,
} from 'lucide-react';

const RESOURCE_OPTIONS = [
  'boats',
  'life_jackets',
  'first_aid',
  'ambulances',
  'food',
  'water',
  'blankets',
  'rescue_equipment',
  'medicines',
];

const EmergenciesPage = () => {
  const [emergencies, setEmergencies] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters & View mode
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [severityFilter, setSeverityFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [viewMode, setViewMode] = useState('grid');

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showVoiceModal, setShowVoiceModal] = useState(false);
  const [showDuplicateModal, setShowDuplicateModal] = useState(false);
  const [duplicateMatches, setDuplicateMatches] = useState([]);

  // Form State
  const [formData, setFormData] = useState({
    emergency_type: 'flood_trapped',
    description: '',
    address: '',
    latitude: 8.5241,
    longitude: 76.9366,
    people_affected: 1,
    children: 0,
    elderly: 0,
    pregnant_persons: 0,
    disabled_persons: 0,
    injured_persons: 0,
    medical_required: false,
    trapped: false,
    required_resources: [],
    reporter_name: '',
    reporter_phone: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  const { isOnline, queueEmergency, getCachedEntities, cacheEntities } = useOffline();
  const { lastMessage, addToast } = useWebSocket();

  const fetchEmergencies = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const params = {};
      if (statusFilter) params.status = statusFilter;
      if (severityFilter) params.severity = severityFilter;
      if (typeFilter) params.type = typeFilter;

      const res = await axiosClient.get('/api/emergencies/', { params });
      setEmergencies(res.data);
      if (!statusFilter && !severityFilter && !typeFilter) {
        cacheEntities('map_emergencies', res.data);
      }
    } catch (err) {
      console.warn('Network fetch failed, attempting cached fallback:', err);
      const cached = await getCachedEntities('map_emergencies');
      if (cached?.data?.length > 0) {
        setEmergencies(cached.data);
      } else {
        setError('Failed to load emergency dispatches.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchEmergencies();
  }, [statusFilter, severityFilter, typeFilter]);

  // Real-time update
  useEffect(() => {
    if (lastMessage?.event === 'NEW_EMERGENCY' || lastMessage?.event === 'SOS_ALERT') {
      fetchEmergencies();
    }
  }, [lastMessage]);

  const handleOpenCreate = async () => {
    setFormError('');
    setShowCreateModal(true);
    try {
      const pos = await getCurrentPosition();
      setFormData((prev) => ({
        ...prev,
        latitude: pos.lat,
        longitude: pos.lon,
        address: prev.address || (pos.lat ? `GPS: ${pos.lat.toFixed(4)}, ${pos.lon.toFixed(4)}` : 'Reported GPS Incident Location'),
      }));
    } catch {
      // User can type address manually
    }
  };

  const handleToggleResource = (res) => {
    setFormData((prev) => {
      const exists = prev.required_resources.includes(res);
      return {
        ...prev,
        required_resources: exists
          ? prev.required_resources.filter((r) => r !== res)
          : [...prev.required_resources, res],
      };
    });
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (!formData.description || !formData.address) {
      setFormError('Please enter description and location address.');
      return;
    }

    setIsSubmitting(true);
    setFormError('');

    try {
      if (isOnline) {
        const res = await axiosClient.post('/api/emergencies/', formData);
        setShowCreateModal(false);
        addToast('Emergency Created', `Incident #${res.data.id} triaged with severity ${res.data.severity}`, 'info');

        // Check if duplicate detected
        if (res.data.is_duplicate) {
          try {
            const dupsRes = await axiosClient.get(`/api/duplicates/${res.data.id}`);
            if (dupsRes.data.length > 0) {
              setDuplicateMatches(dupsRes.data);
              setShowDuplicateModal(true);
            }
          } catch {}
        }
        fetchEmergencies();
      } else {
        queueEmergency(formData);
        setShowCreateModal(false);
        addToast('Stored Offline', 'Emergency report queued and will sync when network returns.', 'warning');
      }
    } catch (err) {
      console.error('Failed to submit emergency:', err);
      queueEmergency(formData);
      setShowCreateModal(false);
      addToast('Offline Fallback', 'Report queued locally due to network interruption.', 'warning');
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredEmergencies = emergencies.filter((em) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      em.id?.toString().includes(q) ||
      em.emergency_type?.toLowerCase().includes(q) ||
      em.description?.toLowerCase().includes(q) ||
      em.address?.toLowerCase().includes(q) ||
      em.reporter_name?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              Emergency Requests & Dispatch
            </h1>
            <span className="px-2 py-0.5 text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200 rounded-full">
              {filteredEmergencies.length} Active
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage incoming distress requests, review demographic vulnerabilities, and dispatch response teams.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={() => setShowVoiceModal(true)}
            className="px-3.5 py-2 rounded-lg text-xs font-semibold bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 shadow-xs transition-colors flex items-center gap-2"
          >
            <Mic className="w-4 h-4 text-blue-600" />
            Voice Intake
          </button>

          <button
            onClick={handleOpenCreate}
            className="px-4 py-2 rounded-lg text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white shadow-xs transition-colors flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            New Emergency
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="card-base p-4 flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Search Box */}
        <div className="relative w-full md:w-80">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by ID, keyword, address..."
            className="w-full bg-white border border-slate-300 rounded-lg pl-9 pr-3 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500"
          />
        </div>

        {/* Dropdowns */}
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-700 focus:outline-none focus:border-blue-500"
          >
            <option value="">All Statuses</option>
            <option value="PENDING">PENDING</option>
            <option value="VERIFIED">VERIFIED</option>
            <option value="ASSIGNED">ASSIGNED</option>
            <option value="EN_ROUTE">EN_ROUTE</option>
            <option value="ON_SCENE">ON_SCENE</option>
            <option value="RESOLVED">RESOLVED</option>
          </select>

          <select
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value)}
            className="bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-700 focus:outline-none focus:border-blue-500"
          >
            <option value="">All Severities</option>
            <option value="CRITICAL">CRITICAL</option>
            <option value="HIGH">HIGH</option>
            <option value="MEDIUM">MEDIUM</option>
            <option value="LOW">LOW</option>
          </select>

          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-700 focus:outline-none focus:border-blue-500"
          >
            <option value="">All Types</option>
            <option value="flood_trapped">Flood Trapped</option>
            <option value="medical_emergency">Medical Emergency</option>
            <option value="landslide_collapse">Landslide / Collapse</option>
            <option value="fire_emergency">Fire Emergency</option>
            <option value="food_water_shortage">Food/Water Shortage</option>
          </select>

          {/* View Toggle */}
          <div className="flex items-center bg-slate-100 border border-slate-200 rounded-lg p-0.5">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-md ${
                viewMode === 'grid' ? 'bg-white text-blue-600 shadow-xs' : 'text-slate-500 hover:text-slate-900'
              }`}
              title="Grid View"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-md ${
                viewMode === 'table' ? 'bg-white text-blue-600 shadow-xs' : 'text-slate-500 hover:text-slate-900'
              }`}
              title="Table View"
            >
              <List className="w-4 h-4" />
            </button>
          </div>

          <button
            onClick={fetchEmergencies}
            className="p-2 rounded-lg bg-white hover:bg-slate-50 text-slate-500 border border-slate-300 shadow-xs"
            title="Refresh List"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Content Feed */}
      {isLoading ? (
        <Loading text="Loading emergency dispatches..." />
      ) : error ? (
        <ErrorState message={error} onRetry={fetchEmergencies} />
      ) : filteredEmergencies.length === 0 ? (
        <EmptyState
          title="No emergency requests found"
          description="There are currently no active emergency requests matching your criteria."
          actionLabel="Log New Emergency"
          onAction={handleOpenCreate}
        />
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredEmergencies.map((em) => (
            <EmergencyCard key={em.id} emergency={em} />
          ))}
        </div>
      ) : (
        <div className="card-base overflow-hidden">
          <EmergencyTable emergencies={filteredEmergencies} />
        </div>
      )}

      {/* 1. Modal: Create Emergency Request */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Log Emergency Incident Request"
        maxWidth="max-w-2xl"
      >
        <form onSubmit={handleFormSubmit} className="space-y-4">
          {formError && (
            <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 flex-shrink-0 text-red-600" />
              <span>{formError}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Emergency Type *
              </label>
              <select
                value={formData.emergency_type}
                onChange={(e) => setFormData({ ...formData, emergency_type: e.target.value })}
                className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-blue-500"
              >
                <option value="flood_trapped">Flood Trapped</option>
                <option value="medical_emergency">Medical Emergency</option>
                <option value="landslide_collapse">Landslide / Building Collapse</option>
                <option value="fire_emergency">Fire Emergency</option>
                <option value="food_water_shortage">Food & Water Shortage</option>
                <option value="general_evacuation">General Evacuation</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Location / Address *
              </label>
              <input
                type="text"
                required
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                placeholder="Kazhakkoottam, Trivandrum"
                className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Description & Current Situation *
            </label>
            <textarea
              rows={3}
              required
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Describe what is happening, exact landmarks, urgent needs..."
              className="w-full bg-white border border-slate-300 rounded-lg p-3 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500"
            />
          </div>

          {/* Demographics Matrix */}
          <div>
            <span className="block text-xs font-semibold text-slate-700 mb-2">
              Victims & Vulnerable Demographic Counts:
            </span>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
              <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200 text-center">
                <span className="text-[10px] text-slate-500 font-medium block">Total</span>
                <input
                  type="number"
                  min={1}
                  value={formData.people_affected}
                  onChange={(e) => setFormData({ ...formData, people_affected: parseInt(e.target.value) || 1 })}
                  className="w-full bg-transparent text-center text-sm font-bold text-blue-600 focus:outline-none"
                />
              </div>

              <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200 text-center">
                <span className="text-[10px] text-slate-500 font-medium block">Children</span>
                <input
                  type="number"
                  min={0}
                  value={formData.children}
                  onChange={(e) => setFormData({ ...formData, children: parseInt(e.target.value) || 0 })}
                  className="w-full bg-transparent text-center text-sm font-bold text-slate-800 focus:outline-none"
                />
              </div>

              <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200 text-center">
                <span className="text-[10px] text-slate-500 font-medium block">Elderly</span>
                <input
                  type="number"
                  min={0}
                  value={formData.elderly}
                  onChange={(e) => setFormData({ ...formData, elderly: parseInt(e.target.value) || 0 })}
                  className="w-full bg-transparent text-center text-sm font-bold text-slate-800 focus:outline-none"
                />
              </div>

              <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200 text-center">
                <span className="text-[10px] text-slate-500 font-medium block">Pregnant</span>
                <input
                  type="number"
                  min={0}
                  value={formData.pregnant_persons}
                  onChange={(e) => setFormData({ ...formData, pregnant_persons: parseInt(e.target.value) || 0 })}
                  className="w-full bg-transparent text-center text-sm font-bold text-slate-800 focus:outline-none"
                />
              </div>

              <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200 text-center">
                <span className="text-[10px] text-slate-500 font-medium block">Disabled</span>
                <input
                  type="number"
                  min={0}
                  value={formData.disabled_persons}
                  onChange={(e) => setFormData({ ...formData, disabled_persons: parseInt(e.target.value) || 0 })}
                  className="w-full bg-transparent text-center text-sm font-bold text-slate-800 focus:outline-none"
                />
              </div>

              <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200 text-center">
                <span className="text-[10px] text-slate-500 font-medium block">Injured</span>
                <input
                  type="number"
                  min={0}
                  value={formData.injured_persons}
                  onChange={(e) => setFormData({ ...formData, injured_persons: parseInt(e.target.value) || 0 })}
                  className="w-full bg-transparent text-center text-sm font-bold text-red-600 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Urgent Flags */}
          <div className="grid grid-cols-2 gap-3 pt-1">
            <label className="flex items-center gap-2.5 p-3 rounded-lg bg-slate-50 border border-slate-200 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.trapped}
                onChange={(e) => setFormData({ ...formData, trapped: e.target.checked })}
                className="w-4 h-4 text-red-600 rounded border-slate-300"
              />
              <span className="text-xs font-semibold text-red-700">
                ⚠️ People Trapped / Stranded
              </span>
            </label>

            <label className="flex items-center gap-2.5 p-3 rounded-lg bg-slate-50 border border-slate-200 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.medical_required}
                onChange={(e) => setFormData({ ...formData, medical_required: e.target.checked })}
                className="w-4 h-4 text-red-600 rounded border-slate-300"
              />
              <span className="text-xs font-semibold text-red-700">
                🚑 Urgent Medical Assistance
              </span>
            </label>
          </div>

          {/* Required Resource Tags */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Required Supplies / Equipment:
            </label>
            <div className="flex flex-wrap gap-1.5">
              {RESOURCE_OPTIONS.map((r) => {
                const isSelected = formData.required_resources.includes(r);
                return (
                  <button
                    key={r}
                    type="button"
                    onClick={() => handleToggleResource(r)}
                    className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                      isSelected
                        ? 'bg-blue-50 text-blue-700 border border-blue-200 font-semibold'
                        : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    {isSelected ? '✓ ' : '+ '}
                    {r.replace(/_/g, ' ')}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Reporter Information */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Reporter Name</label>
              <input
                type="text"
                value={formData.reporter_name}
                onChange={(e) => setFormData({ ...formData, reporter_name: e.target.value })}
                placeholder="Caller Name"
                className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-800"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Reporter Phone</label>
              <input
                type="tel"
                value={formData.reporter_phone}
                onChange={(e) => setFormData({ ...formData, reporter_phone: e.target.value })}
                placeholder="+91 98765 43210"
                className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-800"
              />
            </div>
          </div>

          {/* Submit */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={() => setShowCreateModal(false)}
              className="px-4 py-2 rounded-lg text-xs font-medium text-slate-600 hover:bg-slate-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 rounded-lg text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white shadow-xs transition-colors flex items-center gap-2 disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Submitting Request...
                </>
              ) : (
                'Dispatch Emergency Request'
              )}
            </button>
          </div>
        </form>
      </Modal>

      {/* 2. Modal: Voice Reporter */}
      <Modal
        isOpen={showVoiceModal}
        onClose={() => setShowVoiceModal(false)}
        title="Voice Emergency Intake Console"
        maxWidth="max-w-xl"
      >
        <VoiceReporter
          onEmergencyCreated={() => {
            setShowVoiceModal(false);
            fetchEmergencies();
            addToast('Emergency Logged', 'Voice emergency report processed and triaged.', 'info');
          }}
          onCancel={() => setShowVoiceModal(false)}
        />
      </Modal>

      {/* 3. Modal: Duplicate Detection Alert */}
      <DuplicateModal
        isOpen={showDuplicateModal}
        onClose={() => setShowDuplicateModal(false)}
        duplicates={duplicateMatches}
        onResolve={async (dupId, resolution) => {
          try {
            await axiosClient.post(`/api/duplicates/${dupId}/resolve`, {
              status: resolution,
              notes: 'Resolved via emergency intake dashboard',
            });
            setShowDuplicateModal(false);
            fetchEmergencies();
          } catch (err) {
            console.error(err);
          }
        }}
      />
    </div>
  );
};

export default EmergenciesPage;
