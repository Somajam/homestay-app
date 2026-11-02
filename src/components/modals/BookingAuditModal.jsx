import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { useApp } from '../../context/AppContext';
import {
  History,
  Search,
  CheckCircle2,
  LogIn,
  LogOut,
  XCircle,
  User,
  Calendar,
  Clock,
  Shield,
  Filter,
} from 'lucide-react';

export const BookingAuditModal = ({ isOpen, onClose }) => {
  const { auditLogs = [] } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  const [actionFilter, setActionFilter] = useState('ALL');

  const filteredLogs = auditLogs.filter((log) => {
    const matchesSearch =
      (log.booking_ref && log.booking_ref.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (log.performed_by && log.performed_by.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (log.guest_name && log.guest_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (log.room_number && log.room_number.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesAction = actionFilter === 'ALL' || log.action === actionFilter;

    return matchesSearch && matchesAction;
  });

  const getActionBadge = (action) => {
    switch (action) {
      case 'CREATED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
            <CheckCircle2 className="w-3 h-3" /> New Booking
          </span>
        );
      case 'CHECKED_IN':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-bold bg-teal-500/15 text-teal-400 border border-teal-500/30">
            <LogIn className="w-3 h-3" /> Checked In
          </span>
        );
      case 'CHECKED_OUT':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30">
            <LogOut className="w-3 h-3" /> Checked Out
          </span>
        );
      case 'CANCELLED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-bold bg-rose-500/15 text-rose-400 border border-rose-500/30">
            <XCircle className="w-3 h-3" /> Cancelled
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-bold bg-slate-500/15 text-slate-400 border border-slate-500/30">
            {action}
          </span>
        );
    }
  };

  const formatTimestamp = (ts) => {
    if (!ts) return 'Just now';
    try {
      const d = new Date(ts);
      return d.toLocaleString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      });
    } catch (e) {
      return String(ts);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Booking Activity & Audit Log"
      maxWidth="max-w-4xl"
    >
      <div className="space-y-4">
        {/* Header Description */}
        <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800/80 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2.5 text-xs text-slate-300">
            <History className="w-4 h-4 text-indigo-400 shrink-0" />
            <span>
              Real-time audit history of every reservation addition, check-in, check-out, and cancellation.
            </span>
          </div>
          <span className="text-[11px] font-mono text-indigo-400 bg-indigo-500/10 px-2.5 py-1 rounded-lg border border-indigo-500/20 font-bold shrink-0">
            {auditLogs.length} Total Event(s)
          </span>
        </div>

        {/* Filter and Search Bar */}
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              placeholder="Search by Booking Ref, Guest, Cottage, or Staff name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-950/80 border border-slate-800 rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
            />
          </div>

          <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
            {['ALL', 'CREATED', 'CHECKED_IN', 'CHECKED_OUT', 'CANCELLED'].map((actionKey) => (
              <button
                key={actionKey}
                onClick={() => setActionFilter(actionKey)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                  actionFilter === actionKey
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-900/40'
                    : 'bg-slate-950/80 border border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                {actionKey === 'ALL' ? 'All Events' : actionKey.replace('_', ' ')}
              </button>
            ))}
          </div>
        </div>

        {/* Audit Logs Table / List */}
        <div className="rounded-xl border border-slate-800 overflow-hidden bg-slate-950/40 max-h-[55vh] overflow-y-auto">
          {filteredLogs.length === 0 ? (
            <div className="p-10 text-center space-y-2">
              <History className="w-8 h-8 text-slate-600 mx-auto" />
              <p className="text-sm font-semibold text-slate-400">No activity logs recorded yet.</p>
              <p className="text-xs text-slate-500">
                New booking reservations, check-ins, check-outs, and cancellations will automatically appear here.
              </p>
            </div>
          ) : (
            <table className="w-full text-left border-collapse text-xs">
              <thead className="bg-slate-950/90 text-slate-400 font-semibold border-b border-slate-800 sticky top-0 z-10">
                <tr>
                  <th className="p-3">Timestamp</th>
                  <th className="p-3">Action</th>
                  <th className="p-3">Booking Reference</th>
                  <th className="p-3">Guest & Room</th>
                  <th className="p-3">Performed By</th>
                  <th className="p-3">Details / Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                {filteredLogs.map((log, index) => (
                  <tr key={log.id || `audit-${index}`} className="hover:bg-slate-900/40 transition-colors">
                    <td className="p-3 font-mono text-[11px] text-slate-400 whitespace-nowrap">
                      {formatTimestamp(log.created_at)}
                    </td>
                    <td className="p-3 whitespace-nowrap">
                      {getActionBadge(log.action)}
                    </td>
                    <td className="p-3 font-mono font-bold text-emerald-400 whitespace-nowrap">
                      {log.booking_ref || log.booking_id}
                    </td>
                    <td className="p-3 whitespace-nowrap">
                      <div className="font-semibold text-slate-100">
                        {log.guest_name || log.details?.guest_name || '—'}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        {log.room_number || log.details?.room_number || 'Cottage'}
                      </div>
                    </td>
                    <td className="p-3 whitespace-nowrap">
                      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-slate-800/70 text-slate-200 text-[11px] font-medium border border-slate-700/60">
                        <User className="w-3 h-3 text-indigo-400" />
                        {log.performed_by || 'Staff'}
                      </span>
                    </td>
                    <td className="p-3 text-[11px] text-slate-400 max-w-xs truncate">
                      {log.details?.staff_notes
                        ? `Notes: ${log.details.staff_notes}`
                        : log.details?.check_in_date && log.details?.check_out_date
                        ? `Stay: ${log.details.check_in_date} → ${log.details.check_out_date}`
                        : log.details?.cancelled_by
                        ? `Cancelled by ${log.details.cancelled_by}`
                        : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-800">
          <div className="text-[11px] text-slate-500 flex items-center gap-1.5">
            <Shield className="w-3.5 h-3.5 text-slate-400" />
            <span>Audit entries are immutable and stored securely in Supabase table <code>booking_audit_logs</code>.</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-all"
          >
            Close
          </button>
        </div>
      </div>
    </Modal>
  );
};
