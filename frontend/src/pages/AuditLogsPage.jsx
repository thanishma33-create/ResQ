import React, { useState, useEffect } from 'react';
import axiosClient from '../api/axiosClient';
import Loading from '../components/common/Loading';
import EmptyState from '../components/common/EmptyState';
import ErrorState from '../components/common/ErrorState';
import Modal from '../components/common/Modal';
import { formatDate } from '../utils/formatters';
import {
  ShieldAlert,
  Search,
  RefreshCw,
  User,
  Eye,
} from 'lucide-react';

const AuditLogsPage = () => {
  const [logs, setLogs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLog, setSelectedLog] = useState(null);

  const fetchAuditLogs = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await axiosClient.get('/api/audit/');
      setLogs(res.data);
    } catch (err) {
      console.error('Failed to load audit logs:', err);
      setError('Failed to fetch system audit logs.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAuditLogs();
  }, []);

  const filteredLogs = logs.filter((log) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      log.action?.toLowerCase().includes(q) ||
      log.entity_type?.toLowerCase().includes(q) ||
      log.username?.toLowerCase().includes(q) ||
      log.entity_id?.toString().includes(q)
    );
  });

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              System Audit Trail & Compliance Log
            </h1>
            <span className="px-2 py-0.5 text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200 rounded-full">
              Admin Only
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Immutable chronological logging of all state transitions, resource dispatches, and operator commands.
          </p>
        </div>

        <button
          onClick={fetchAuditLogs}
          className="p-2 rounded-lg bg-white border border-slate-300 text-slate-600 hover:bg-slate-50 shadow-xs transition-colors self-start"
          title="Refresh Logs"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Search Bar */}
      <div className="card-base p-4 flex items-center gap-3">
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by action, user, entity type or ID..."
            className="w-full bg-white border border-slate-300 rounded-lg pl-9 pr-3 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500"
          />
        </div>
      </div>

      {/* Logs Table */}
      {isLoading ? (
        <Loading text="Loading security audit records..." />
      ) : error ? (
        <ErrorState message={error} onRetry={fetchAuditLogs} />
      ) : filteredLogs.length === 0 ? (
        <EmptyState
          icon={ShieldAlert}
          title="No Audit Logs Found"
          description="There are currently no recorded audit trail entries matching your search."
        />
      ) : (
        <div className="card-base overflow-hidden">
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  <th className="py-3 px-4">Timestamp</th>
                  <th className="py-3 px-4">Actor</th>
                  <th className="py-3 px-4">Action</th>
                  <th className="py-3 px-4">Target Entity</th>
                  <th className="py-3 px-4">IP Address</th>
                  <th className="py-3 px-4 text-right">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-4 text-slate-500 text-[11px] font-mono whitespace-nowrap">
                      {formatDate(log.created_at)}
                    </td>

                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5 text-blue-600" />
                        <span className="font-semibold text-slate-800">
                          {log.username || `User #${log.user_id || 'System'}`}
                        </span>
                      </div>
                    </td>

                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-700 font-bold text-[10px] border border-blue-200">
                        {log.action}
                      </span>
                    </td>

                    <td className="py-3 px-4 text-slate-700">
                      <span className="text-slate-500">{log.entity_type}</span>{' '}
                      <strong className="text-slate-900 font-mono">#{log.entity_id}</strong>
                    </td>

                    <td className="py-3 px-4 text-slate-500 text-[11px] font-mono">
                      {log.ip_address || '127.0.0.1'}
                    </td>

                    <td className="py-3 px-4 text-right">
                      {(log.previous_state || log.new_state) && (
                        <button
                          onClick={() => setSelectedLog(log)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-slate-100 transition-colors"
                          title="Inspect State Diff"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal: State Diff Viewer */}
      <Modal
        isOpen={!!selectedLog}
        onClose={() => setSelectedLog(null)}
        title={`🔍 Audit Inspection: Log #${selectedLog?.id}`}
        maxWidth="max-w-2xl"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-2 text-xs bg-slate-50 p-3 rounded-lg border border-slate-200">
            <div>
              <span className="text-slate-500 block text-[10px]">Action:</span>
              <span className="font-bold text-blue-600">{selectedLog?.action}</span>
            </div>
            <div>
              <span className="text-slate-500 block text-[10px]">Entity:</span>
              <span className="font-bold text-slate-800">{selectedLog?.entity_type} #{selectedLog?.entity_id}</span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div>
              <span className="text-[10px] text-slate-500 uppercase font-bold block mb-1">
                Previous State:
              </span>
              <pre className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-[11px] text-slate-700 overflow-x-auto custom-scrollbar max-h-60 font-mono">
                {selectedLog?.previous_state || 'null'}
              </pre>
            </div>

            <div>
              <span className="text-[10px] text-blue-600 uppercase font-bold block mb-1">
                New State:
              </span>
              <pre className="bg-blue-50/50 p-3 rounded-lg border border-blue-200 text-[11px] text-blue-900 overflow-x-auto custom-scrollbar max-h-60 font-mono">
                {selectedLog?.new_state || 'null'}
              </pre>
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              onClick={() => setSelectedLog(null)}
              className="px-4 py-2 rounded-lg text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium"
            >
              Close
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default AuditLogsPage;
