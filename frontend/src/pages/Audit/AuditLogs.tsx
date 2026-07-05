import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { safeDate } from '../../utils/date';
import {
  ShieldAlert,
  Search,
  RefreshCw,
  Clock,
  User,
  Activity
} from 'lucide-react';

interface AuditLogItem {
  id: string;
  user_id: string;
  user_email: string;
  action: string;
  details: string;
  created_at: string;
}

const AuditLogs: React.FC = () => {
  const [logs, setLogs] = useState<AuditLogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Search/Filters
  const [userSearch, setUserSearch] = useState('');
  const [actionSearch, setActionSearch] = useState('');
  
  // Pagination
  const limit = 100;
  const [offset, setOffset] = useState(0);

  const fetchAuditLogs = async () => {
    setLoading(true);
    setError(null);
    try {
      const userParam = userSearch ? `&user_filter=${encodeURIComponent(userSearch)}` : '';
      const actionParam = actionSearch ? `&action_filter=${encodeURIComponent(actionSearch)}` : '';
      
      const res = await api.get(`/audit/?limit=${limit}&offset=${offset}${userParam}${actionParam}`);
      setLogs(res.data);
    } catch (err) {
      console.error(err);
      setError('Failed to fetch system audit logs.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAuditLogs();
  }, [offset, limit]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setOffset(0);
    fetchAuditLogs();
  };

  const handleRefresh = () => {
    setUserSearch('');
    setActionSearch('');
    setOffset(0);
    fetchAuditLogs();
  };

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between bg-white p-6 rounded-xl border border-slate-100 shadow-sm">
        <div>
          <h2 className="text-xl font-bold text-slate-800 flex items-center">
            <ShieldAlert className="w-5 h-5 mr-2 text-blue-600" />
            Security Audit Trail
          </h2>
          <p className="text-xs text-slate-400 mt-1 font-medium">
            System logs recording user authentication, data modifications, and document access history.
          </p>
        </div>
        <button
          onClick={handleRefresh}
          className="mt-4 md:mt-0 enterprise-btn-secondary flex items-center cursor-pointer"
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          Reset Filters
        </button>
      </div>

      {/* Filter and Search Panel */}
      <form onSubmit={handleSearchSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
        <div className="relative">
          <User className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Search by User Email..."
            value={userSearch}
            onChange={(e) => setUserSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-lg outline-none focus:border-blue-600 transition-all bg-slate-50/50"
          />
        </div>
        <div className="relative">
          <Activity className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Search by Action (e.g. Login)..."
            value={actionSearch}
            onChange={(e) => setActionSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-lg outline-none focus:border-blue-600 transition-all bg-slate-50/50"
          />
        </div>
        <button
          type="submit"
          className="enterprise-btn-primary flex items-center justify-center cursor-pointer"
        >
          <Search className="w-4 h-4 mr-2" />
          Apply Filter
        </button>
      </form>

      {/* Audit Logs Table */}
      {loading ? (
        <div className="flex py-20 justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : error ? (
        <div className="p-4 bg-rose-50 border border-rose-100 rounded-xl text-rose-600 text-xs">
          {error}
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Timestamp</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider">User Account</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Action Type</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Description</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {logs.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-10 text-center text-xs text-slate-400">
                      No security audit events matched the filters.
                    </td>
                  </tr>
                ) : (
                  logs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4 text-slate-500 whitespace-nowrap">
                        <div className="flex items-center space-x-1.5">
                          <Clock className="w-3.5 h-3.5 text-slate-400" />
                          <span>
                            {safeDate(log.created_at).toLocaleString([], {
                              dateStyle: 'medium',
                              timeStyle: 'medium'
                            })}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 font-bold text-slate-800">{log.user_email}</td>
                      <td className="px-6 py-4 font-bold">
                        <span className={`inline-flex px-2 py-0.5 rounded text-[10px] uppercase font-bold ${
                          log.action.includes('Delete') 
                            ? 'bg-rose-50 text-rose-600 border border-rose-100' 
                            : log.action.includes('Create') || log.action.includes('Submit')
                            ? 'bg-emerald-50 text-emerald-600 border border-emerald-100'
                            : 'bg-slate-100 text-slate-600 border border-slate-200'
                        }`}>
                          {log.action}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-slate-600 font-medium">{log.details}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Simple Pagination Footer */}
          <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/30 flex items-center justify-between">
            <button
              onClick={() => setOffset(Math.max(0, offset - limit))}
              disabled={offset === 0}
              className="enterprise-btn-secondary px-3 py-1 text-xs disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <span className="text-[10px] text-slate-400 font-semibold uppercase">
              Page offset: {offset} to {offset + logs.length}
            </span>
            <button
              onClick={() => setOffset(offset + limit)}
              disabled={logs.length < limit}
              className="enterprise-btn-secondary px-3 py-1 text-xs disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AuditLogs;
