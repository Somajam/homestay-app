import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { Modal } from '../components/common/Modal';
import { DocumentViewerModal } from '../components/modals/DocumentViewerModal';
import { exportMonthlyVisitorArchive, downloadBlob } from '../utils/archiveExporter';
import { getBookingTimestamps } from '../utils/dateUtils';
import { sanitizePhoneNumber, isValidPhoneNumber } from '../utils/phoneValidation';
import {
  BarChart3,
  Download,
  ShieldCheck,
  UserCheck,
  UserPlus,
  Calendar,
  FileSpreadsheet,
  Building2,
  Users,
  CheckCircle,
  XCircle,
  Lock,
  Search,
  Filter,
  FileArchive,
  HardDrive,
  Trash2,
  Eye,
  FileText,
  Printer,
  Sparkles,
  Phone,
  AlertTriangle,
  RefreshCw,
  Clock,
  ArrowRight,
} from 'lucide-react';

export const ReportsSettings = () => {
  const {
    bookings = [],
    rooms = [],
    guests = [],
    documents = [],
    staffList = [],
    auditLogs = [],
    addStaff,
    currentRole,
    currentUser,
    purgeMonthStorage,
    showToast,
  } = useApp();

  const [activeTab, setActiveTab] = useState('guest_register'); // 'guest_register' | 'monthly_archive' | 'reports' | 'history' | 'staff'

  // Staff Modal state
  const [showStaffModal, setShowStaffModal] = useState(false);
  const [newStaffName, setNewStaffName] = useState('');
  const [newStaffEmail, setNewStaffEmail] = useState('');
  const [newStaffPhone, setNewStaffPhone] = useState('');
  const [newStaffRole, setNewStaffRole] = useState('staff');
  const [newStaffTitle, setNewStaffTitle] = useState('Front Desk Associate');

  // Document Viewer state
  const [viewingDoc, setViewingDoc] = useState(null);

  // --- TAB 1: DATE-WISE GUEST REGISTER STATE ---
  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];

  // Default date range: start of current month to end of current month
  const startOfMonthStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-01`;
  const [filterStartDate, setFilterStartDate] = useState(startOfMonthStr);
  const [filterEndDate, setFilterEndDate] = useState(todayStr);
  const [guestSearchTerm, setGuestSearchTerm] = useState('');
  const [registerRoomFilter, setRegisterRoomFilter] = useState('all');
  const [registerStatusFilter, setRegisterStatusFilter] = useState('all');

  // Presets for quick date range selection
  const setDatePreset = (preset) => {
    const now = new Date();
    const nowStr = now.toISOString().split('T')[0];

    if (preset === 'today') {
      setFilterStartDate(nowStr);
      setFilterEndDate(nowStr);
    } else if (preset === 'week') {
      const pastWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      setFilterStartDate(pastWeek);
      setFilterEndDate(nowStr);
    } else if (preset === 'month') {
      const startM = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
      setFilterStartDate(startM);
      setFilterEndDate(nowStr);
    } else if (preset === 'all') {
      setFilterStartDate('');
      setFilterEndDate('');
    }
  };

  // Filtered Date-wise Guest Register records
  const filteredRegisterRecords = useMemo(() => {
    return bookings
      .filter((b) => {
        // Match Date Range (check_in_date within range or overlapping)
        if (filterStartDate && b.check_in_date < filterStartDate) return false;
        if (filterEndDate && b.check_in_date > filterEndDate) return false;

        // Room filter
        if (registerRoomFilter !== 'all' && b.room_id !== registerRoomFilter) return false;

        // Status filter
        if (registerStatusFilter !== 'all' && b.status !== registerStatusFilter) return false;

        // Search query
        if (guestSearchTerm.trim()) {
          const q = guestSearchTerm.toLowerCase();
          const guest = guests.find((g) => g.id === b.guest_id);
          const nameMatch = (b.guest_name || '').toLowerCase().includes(q);
          const refMatch = (b.booking_ref || '').toLowerCase().includes(q);
          const roomMatch = (b.room_number || '').toLowerCase().includes(q);
          const phoneMatch = guest?.phone?.toLowerCase().includes(q);
          const idMatch = guest?.id_document_number?.toLowerCase().includes(q);
          return nameMatch || refMatch || roomMatch || phoneMatch || idMatch;
        }

        return true;
      })
      .sort((a, b) => (b.check_in_date || '').localeCompare(a.check_in_date || ''));
  }, [
    bookings,
    guests,
    filterStartDate,
    filterEndDate,
    registerRoomFilter,
    registerStatusFilter,
    guestSearchTerm,
  ]);

  // Export Date-wise Guest Register to CSV
  const exportDateWiseRegisterCSV = () => {
    if (filteredRegisterRecords.length === 0) {
      showToast('No records found in selected date range to export', 'warning');
      return;
    }

    const headers = [
      'Sl No',
      'Check-In Date',
      'Check-In Timestamp',
      'Check-Out Date',
      'Check-Out Timestamp',
      'Nights',
      'Booking Ref',
      'Cottage / Room',
      'Guest Full Name',
      'Contact Phone',
      'Email',
      'Permanent Address',
      'Nationality',
      'ID Proof Type',
      'ID / Aadhaar Number',
      'Guests Count',
      'Status',
      'Special Notes',
    ];

    const rows = filteredRegisterRecords.map((b, idx) => {
      const guest = guests.find((g) => g.id === b.guest_id);
      const timestamps = getBookingTimestamps(b, auditLogs);
      const inDate = new Date(b.check_in_date);
      const outDate = new Date(b.check_out_date);
      const nights = !isNaN(inDate) && !isNaN(outDate)
        ? Math.max(1, Math.round((outDate - inDate) / (1000 * 60 * 60 * 24)))
        : 1;

      return [
        idx + 1,
        b.check_in_date,
        `"${timestamps.checkInTime}"`,
        b.check_out_date,
        `"${timestamps.checkOutTime}"`,
        nights,
        `"${b.booking_ref}"`,
        `"Cottage ${b.room_number}"`,
        `"${b.guest_name}"`,
        `"${guest?.phone || 'N/A'}"`,
        `"${guest?.email || ''}"`,
        `"${(guest?.address || '').replace(/"/g, '""')}"`,
        `"${guest?.nationality || 'Indian'}"`,
        `"${guest?.id_document_type || 'Aadhaar'}"`,
        `"${guest?.id_document_number || 'N/A'}"`,
        b.num_guests || 2,
        `"${b.status}"`,
        `"${(b.notes || '').replace(/"/g, '""')}"`,
      ];
    });

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const filename = `Somajam_Guest_Register_${filterStartDate || 'All'}_to_${filterEndDate || 'All'}.csv`;
    downloadBlob(blob, filename);
    showToast(`Exported ${filteredRegisterRecords.length} guest records to CSV!`, 'success');
  };

  // Print Date-wise Guest Register
  const printGuestRegister = () => {
    window.print();
  };

  // --- TAB 2: MONTHLY ARCHIVE & FREE-TIER CLOUD STORAGE STATE ---
  const [archiveYear, setArchiveYear] = useState(today.getFullYear());
  const [archiveMonth, setArchiveMonth] = useState(today.getMonth() + 1);
  const [isArchiving, setIsArchiving] = useState(false);
  const [downloadedMonths, setDownloadedMonths] = useState(new Set());
  const [showPurgeModal, setShowPurgeModal] = useState(false);
  const [isPurging, setIsPurging] = useState(false);

  const monthKey = `${archiveYear}-${String(archiveMonth).padStart(2, '0')}`;
  const monthLabel = new Date(archiveYear, archiveMonth - 1, 1).toLocaleString('default', { month: 'long' });

  // Calculate monthly stats for the selected archive month
  const monthlyArchiveStats = useMemo(() => {
    const prefix = monthKey;
    const monthBookings = bookings.filter((b) => b.check_in_date && b.check_in_date.startsWith(prefix));
    const guestIds = new Set(monthBookings.map((b) => b.guest_id));

    // Also include guests created in that month
    guests.forEach((g) => {
      if (g.created_at && g.created_at.startsWith(prefix)) guestIds.add(g.id);
    });

    const monthDocs = documents.filter((d) => {
      return guestIds.has(d.guest_id) || (d.uploaded_at && d.uploaded_at.startsWith(prefix));
    });

    // Estimate storage bytes (assume ~1.5 MB per document if not specified)
    let totalBytes = 0;
    monthDocs.forEach((d) => {
      if (d.rawFile?.size) {
        totalBytes += d.rawFile.size;
      } else if (d.file_size) {
        const num = parseFloat(d.file_size);
        if (d.file_size.includes('KB')) totalBytes += num * 1024;
        else totalBytes += num * 1024 * 1024;
      } else {
        totalBytes += 1.5 * 1024 * 1024;
      }
    });

    return {
      visitorsCount: guestIds.size,
      bookingsCount: monthBookings.length,
      docsCount: monthDocs.length,
      sizeMB: (totalBytes / (1024 * 1024)).toFixed(1),
    };
  }, [archiveYear, archiveMonth, bookings, guests, documents]);

  // Overall Supabase Free Tier Storage calculation (1 GB = 1000 MB limit)
  const totalStorageStats = useMemo(() => {
    let totalBytes = 0;
    documents.forEach((d) => {
      if (d.rawFile?.size) {
        totalBytes += d.rawFile.size;
      } else if (d.file_size) {
        const num = parseFloat(d.file_size);
        if (d.file_size.includes('KB')) totalBytes += num * 1024;
        else totalBytes += num * 1024 * 1024;
      } else {
        totalBytes += 1.5 * 1024 * 1024;
      }
    });

    const usedMB = (totalBytes / (1024 * 1024)).toFixed(1);
    const limitMB = 1000;
    const percentage = Math.min(100, ((totalBytes / (limitMB * 1024 * 1024)) * 100).toFixed(1));

    return {
      usedMB,
      limitMB,
      percentage,
      totalDocs: documents.length,
    };
  }, [documents]);

  // Handle Download Monthly Archive (.ZIP)
  const handleDownloadArchive = async () => {
    setIsArchiving(true);
    try {
      showToast(`Generating monthly backup package for ${monthLabel} ${archiveYear}...`, 'info');
      const { blob, filename, stats } = await exportMonthlyVisitorArchive({
        year: archiveYear,
        month: archiveMonth,
        guests,
        bookings,
        documents,
      });

      downloadBlob(blob, filename);
      setDownloadedMonths((prev) => new Set([...prev, monthKey]));
      showToast(
        `Downloaded ${filename} (${stats.sizeMB} MB with ${stats.docsCount} ID proofs)! Saved locally.`,
        'success'
      );
    } catch (err) {
      console.error(err);
      showToast(`Error creating archive: ${err.message}`, 'error');
    } finally {
      setIsArchiving(false);
    }
  };

  // Handle Purge Monthly Cloud Storage
  const handleConfirmPurge = async () => {
    setIsPurging(true);
    try {
      const res = await purgeMonthStorage(archiveYear, archiveMonth);
      if (res.success) {
        setShowPurgeModal(false);
      }
    } finally {
      setIsPurging(false);
    }
  };

  // --- STATS TAB (Occupancy & History) ---
  const completedStays = bookings.filter((b) => b.status === 'Checked Out');
  const cancelledStays = bookings.filter((b) => b.status === 'Cancelled');
  const occupiedRooms = rooms.filter((r) => {
    if (!r) return false;
    return bookings.some(
      (b) => b && b.status === 'Checked In' && (b.room_id === r.id || b.room_number === r.room_number)
    );
  });
  const occupancyRate = ((occupiedRooms.length / (rooms.length || 1)) * 100).toFixed(1);

  const handleAddStaffSubmit = (e) => {
    e.preventDefault();
    if (!newStaffName || !newStaffEmail) {
      showToast('Please enter staff name and email', 'warning');
      return;
    }
    if (newStaffPhone && !isValidPhoneNumber(newStaffPhone)) {
      showToast('Mobile number must contain at least 10 digits and cannot contain letters!', 'warning');
      return;
    }
    addStaff({
      full_name: newStaffName,
      email: newStaffEmail,
      phone: newStaffPhone,
      role: newStaffRole,
      title: newStaffTitle,
    });
    setNewStaffName('');
    setNewStaffEmail('');
    setNewStaffPhone('');
    setShowStaffModal(false);
  };

  return (
    <div className="space-y-6">
      {/* Top Title Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl">
        <div>
          <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-emerald-400" />
            Analytics Reports, Guest Register & Archives
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Date-wise guest ledger, monthly offline backup archiver, free-tier storage manager, and occupancy metrics.
          </p>
        </div>

        {/* Storage Quick Pill & Role Badge */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300">
            <HardDrive className="w-3.5 h-3.5 text-teal-400" />
            <span>Cloud Storage:</span>
            <span className="font-mono font-bold text-emerald-400">
              {totalStorageStats.usedMB} MB / {totalStorageStats.limitMB} MB
            </span>
          </div>

          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs font-semibold text-slate-200">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span className="text-emerald-400 font-bold uppercase">{currentRole} Mode</span>
          </div>
        </div>
      </div>

      {/* Tabs Switcher */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-1 overflow-x-auto">
        <button
          onClick={() => setActiveTab('guest_register')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-2 ${
            activeTab === 'guest_register'
              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 shadow-sm'
              : 'bg-slate-900 text-slate-400 border border-slate-800 hover:bg-slate-800'
          }`}
        >
          <Calendar className="w-3.5 h-3.5" />
          <span>Date-Wise Guest Register</span>
          <span className="px-1.5 py-0.2 rounded text-[10px] bg-emerald-500/20 text-emerald-300">
            {filteredRegisterRecords.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('monthly_archive')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-2 ${
            activeTab === 'monthly_archive'
              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 shadow-sm'
              : 'bg-slate-900 text-slate-400 border border-slate-800 hover:bg-slate-800'
          }`}
        >
          <FileArchive className="w-3.5 h-3.5" />
          <span>Monthly Archive & Free-Tier Storage</span>
        </button>

        <button
          onClick={() => setActiveTab('reports')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
            activeTab === 'reports'
              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 shadow-sm'
              : 'bg-slate-900 text-slate-400 border border-slate-800 hover:bg-slate-800'
          }`}
        >
          Occupancy Analytics
        </button>

        <button
          onClick={() => setActiveTab('history')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
            activeTab === 'history'
              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 shadow-sm'
              : 'bg-slate-900 text-slate-400 border border-slate-800 hover:bg-slate-800'
          }`}
        >
          Stays & Cancellation Logs ({completedStays.length + cancelledStays.length})
        </button>

        <button
          onClick={() => setActiveTab('staff')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 ${
            activeTab === 'staff'
              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 shadow-sm'
              : 'bg-slate-900 text-slate-400 border border-slate-800 hover:bg-slate-800'
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          Staff Directory ({staffList.length})
        </button>
      </div>

      {/* ======================================================== */}
      {/* TAB 1: DATE-WISE GUEST REGISTER & POLICE INSPECTION LEDGER */}
      {/* ======================================================== */}
      {activeTab === 'guest_register' && (
        <div className="space-y-4">
          {/* Filter Bar & Date Range Selectors */}
          <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-3 shadow-lg">
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-3">
              {/* Date Range Inputs */}
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-semibold text-slate-400 flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-emerald-400" /> Date Range:
                </span>
                <input
                  type="date"
                  value={filterStartDate}
                  onChange={(e) => setFilterStartDate(e.target.value)}
                  className="px-3 py-1.5 text-xs bg-slate-950 border border-slate-800 rounded-xl text-slate-200 focus:outline-none focus:border-emerald-500"
                  title="Check-In Start Date"
                />
                <span className="text-xs text-slate-500 font-bold">→</span>
                <input
                  type="date"
                  value={filterEndDate}
                  onChange={(e) => setFilterEndDate(e.target.value)}
                  className="px-3 py-1.5 text-xs bg-slate-950 border border-slate-800 rounded-xl text-slate-200 focus:outline-none focus:border-emerald-500"
                  title="Check-In End Date"
                />

                {/* Quick Presets */}
                <div className="flex items-center gap-1 bg-slate-950 p-0.5 rounded-lg border border-slate-800 text-[11px]">
                  <button
                    onClick={() => setDatePreset('today')}
                    className="px-2 py-1 rounded text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors"
                  >
                    Today
                  </button>
                  <button
                    onClick={() => setDatePreset('week')}
                    className="px-2 py-1 rounded text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors"
                  >
                    Last 7 Days
                  </button>
                  <button
                    onClick={() => setDatePreset('month')}
                    className="px-2 py-1 rounded text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors"
                  >
                    This Month
                  </button>
                  <button
                    onClick={() => setDatePreset('all')}
                    className="px-2 py-1 rounded text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors"
                  >
                    All Stays
                  </button>
                </div>
              </div>

              {/* Action Buttons: Export & Print */}
              <div className="flex items-center gap-2 w-full lg:w-auto justify-end">
                <button
                  onClick={printGuestRegister}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-colors"
                  title="Print Police Ledger Form"
                >
                  <Printer className="w-3.5 h-3.5 text-slate-300" />
                  <span>Print Ledger</span>
                </button>

                <button
                  onClick={exportDateWiseRegisterCSV}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md shadow-emerald-900/30 transition-all"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5" />
                  <span>Export Date-Wise CSV</span>
                </button>
              </div>
            </div>

            {/* Second row: Search & Dropdown Filters */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 border-t border-slate-800/60">
              <div className="relative w-full sm:w-80">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search guest name, phone, Aadhaar/ID, ref..."
                  value={guestSearchTerm}
                  onChange={(e) => setGuestSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-950 border border-slate-800 rounded-xl text-slate-200 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <select
                  value={registerRoomFilter}
                  onChange={(e) => setRegisterRoomFilter(e.target.value)}
                  className="px-3 py-1.5 text-xs bg-slate-950 border border-slate-800 rounded-xl text-slate-200 focus:outline-none focus:border-emerald-500"
                >
                  <option value="all">All Cottages</option>
                  {rooms.map((r) => (
                    <option key={r.id} value={r.id}>
                      Room {r.room_number}
                    </option>
                  ))}
                </select>

                <select
                  value={registerStatusFilter}
                  onChange={(e) => setRegisterStatusFilter(e.target.value)}
                  className="px-3 py-1.5 text-xs bg-slate-950 border border-slate-800 rounded-xl text-slate-200 focus:outline-none focus:border-emerald-500"
                >
                  <option value="all">All Statuses</option>
                  <option value="Checked In">Checked In</option>
                  <option value="Confirmed">Confirmed (Upcoming)</option>
                  <option value="Checked Out">Checked Out</option>
                  <option value="Cancelled">Cancelled</option>
                </select>
              </div>
            </div>
          </div>

          {/* Date-wise Register Table */}
          <div className="rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-950 text-slate-400 uppercase font-mono text-[11px] border-b border-slate-800">
                  <tr>
                    <th className="p-3.5">Stay Dates</th>
                    <th className="p-3.5">Guest & Contact</th>
                    <th className="p-3.5">Permanent Address</th>
                    <th className="p-3.5">Govt ID / Aadhaar Details</th>
                    <th className="p-3.5">Cottage</th>
                    <th className="p-3.5">Status</th>
                    <th className="p-3.5 text-right">Attached Proof</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {filteredRegisterRecords.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="p-8 text-center text-slate-500">
                        No guest stays recorded in the selected date range.
                      </td>
                    </tr>
                  ) : (
                    filteredRegisterRecords.map((b) => {
                      const guest = guests.find((g) => g.id === b.guest_id);
                      const guestDocs = documents.filter((d) => d.guest_id === b.guest_id);
                      const inDate = new Date(b.check_in_date);
                      const outDate = new Date(b.check_out_date);
                      const nights = !isNaN(inDate) && !isNaN(outDate)
                        ? Math.max(1, Math.round((outDate - inDate) / (1000 * 60 * 60 * 24)))
                        : 1;

                      return (
                        <tr key={b.id} className="hover:bg-slate-800/40 transition-colors">
                          {/* Stay Dates */}
                          <td className="p-3.5 whitespace-nowrap">
                            <div className="font-bold text-slate-100 flex items-center gap-1.5">
                              <span>{b.check_in_date}</span>
                              <span className="text-slate-500">→</span>
                              <span>{b.check_out_date}</span>
                            </div>
                            <span className="inline-block mt-0.5 px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-950 text-slate-400 border border-slate-800">
                              {nights} {nights === 1 ? 'Night' : 'Nights'} • {b.num_guests || 2} Guests
                            </span>
                            {/* Check-In / Out Timestamps */}
                            {(() => {
                              const { checkInTime, checkOutTime, rawCheckInTime, rawCheckOutTime } = getBookingTimestamps(b, auditLogs);
                              if (!rawCheckInTime && !rawCheckOutTime && b.status !== 'Checked In' && b.status !== 'Checked Out') return null;
                              return (
                                <div className="mt-1 space-y-0.5 text-[10px] font-mono">
                                  {(rawCheckInTime || b.status === 'Checked In' || b.status === 'Checked Out') && (
                                    <div className="text-emerald-400/90 flex items-center gap-1">
                                      <span className="text-slate-500 uppercase font-sans text-[9px]">Check-In:</span>
                                      <span>{checkInTime}</span>
                                    </div>
                                  )}
                                  {(rawCheckOutTime || b.status === 'Checked Out') && (
                                    <div className="text-amber-400/90 flex items-center gap-1">
                                      <span className="text-slate-500 uppercase font-sans text-[9px]">Check-Out:</span>
                                      <span>{checkOutTime}</span>
                                    </div>
                                  )}
                                </div>
                              );
                            })()}
                          </td>

                          {/* Guest Name & Contact */}
                          <td className="p-3.5">
                            <div className="font-bold text-slate-100">{b.guest_name}</div>
                            <div className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                              <Phone className="w-3 h-3 text-emerald-400" />
                              <span>{guest?.phone || 'No phone'}</span>
                            </div>
                            <div className="text-[10px] font-mono text-emerald-400 mt-0.5">
                              {b.booking_ref}
                            </div>
                          </td>

                          {/* Residential Address */}
                          <td className="p-3.5 max-w-[200px] text-[11px] text-slate-300 truncate">
                            <div>{guest?.address || 'Not Provided'}</div>
                            <div className="text-[10px] text-slate-400 mt-0.5">
                              Nationality: <strong className="text-slate-200">{guest?.nationality || 'Indian'}</strong>
                            </div>
                          </td>

                          {/* ID Proof / Aadhaar Details */}
                          <td className="p-3.5">
                            <div className="flex items-center gap-1.5 font-semibold text-slate-200">
                              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                              <span>{guest?.id_document_type || 'Aadhaar'}</span>
                            </div>
                            <div className="text-[11px] font-mono text-slate-400 mt-0.5">
                              {guest?.id_document_number || 'Pending verification'}
                            </div>
                          </td>

                          {/* Room / Cottage */}
                          <td className="p-3.5 whitespace-nowrap">
                            <span className="font-bold text-slate-200">Room {b.room_number}</span>
                          </td>

                          {/* Status Badge */}
                          <td className="p-3.5 whitespace-nowrap">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                                b.status === 'Checked In'
                                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                                  : b.status === 'Confirmed'
                                  ? 'bg-sky-500/10 text-sky-400 border-sky-500/30'
                                  : b.status === 'Checked Out'
                                  ? 'bg-slate-700/30 text-slate-300 border-slate-700'
                                  : 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                              }`}
                            >
                              {b.status}
                            </span>
                          </td>

                          {/* Attached Document Proof */}
                          <td className="p-3.5 text-right whitespace-nowrap">
                            {guestDocs.length > 0 ? (
                              <button
                                onClick={() => setViewingDoc(guestDocs[0])}
                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[11px] font-semibold transition-all"
                                title="View Government ID scan"
                              >
                                <Eye className="w-3 h-3" />
                                <span>View ID ({guestDocs.length})</span>
                              </button>
                            ) : (
                              <span className="text-[11px] text-slate-500 italic">No file</span>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 2: MONTHLY ARCHIVE & FREE-TIER STORAGE RECLAMATION    */}
      {/* ======================================================== */}
      {activeTab === 'monthly_archive' && (
        <div className="space-y-6">
          {/* Cloud Storage Capacity Overview Card */}
          <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
              <div>
                <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                  <HardDrive className="w-5 h-5 text-teal-400" />
                  Supabase Cloud Free-Tier Storage Monitor
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Download monthly visitor data & attached Aadhaar files to your PC, then safely purge cloud files to stay 100% within the free tier.
                </p>
              </div>

              <div className="text-right">
                <span className="text-xs text-slate-400">Total Cloud ID Proofs Stored:</span>
                <p className="text-lg font-black text-slate-100">{totalStorageStats.totalDocs} Files</p>
              </div>
            </div>

            {/* Storage Meter Bar */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-300">
                  Cloud Bucket Used: <strong className="text-emerald-400">{totalStorageStats.usedMB} MB</strong> of 1,000 MB Free Tier
                </span>
                <span className="font-bold text-slate-400">{totalStorageStats.percentage}% Utilized</span>
              </div>
              <div className="w-full bg-slate-950 rounded-full h-3 overflow-hidden border border-slate-800 p-0.5">
                <div
                  className="bg-gradient-to-r from-emerald-500 via-teal-400 to-sky-400 h-full rounded-full transition-all"
                  style={{ width: `${Math.max(3, totalStorageStats.percentage)}%` }}
                />
              </div>
              <p className="text-[11px] text-slate-500 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                All new photo uploads are automatically compressed client-side to preserve your free tier quota for months.
              </p>
            </div>
          </div>

          {/* Monthly Package Exporter Card */}
          <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-6">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div>
                <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                  <FileArchive className="w-5 h-5 text-emerald-400" />
                  Monthly Visitor Data & ID Proof Package Generator
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Select month and year to download a complete standalone archive (.ZIP) containing guest CSV ledgers and original Aadhaar images.
                </p>
              </div>

              {/* Month & Year Selectors */}
              <div className="flex items-center gap-2">
                <select
                  value={archiveMonth}
                  onChange={(e) => setArchiveMonth(Number(e.target.value))}
                  className="px-3 py-2 text-xs font-semibold bg-slate-950 border border-slate-800 rounded-xl text-slate-200 focus:outline-none focus:border-emerald-500"
                >
                  {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                    <option key={m} value={m}>
                      {new Date(2000, m - 1, 1).toLocaleString('default', { month: 'long' })}
                    </option>
                  ))}
                </select>

                <select
                  value={archiveYear}
                  onChange={(e) => setArchiveYear(Number(e.target.value))}
                  className="px-3 py-2 text-xs font-semibold bg-slate-950 border border-slate-800 rounded-xl text-slate-200 focus:outline-none focus:border-emerald-500"
                >
                  <option value={2026}>2026</option>
                  <option value={2025}>2025</option>
                  <option value={2027}>2027</option>
                </select>
              </div>
            </div>

            {/* Selected Month Summary Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                <span className="text-[11px] text-slate-400">Target Month</span>
                <p className="text-base font-bold text-slate-100">{monthLabel} {archiveYear}</p>
              </div>

              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                <span className="text-[11px] text-slate-400">Total Visitors Hosted</span>
                <p className="text-xl font-bold text-emerald-400">{monthlyArchiveStats.visitorsCount} Guests</p>
              </div>

              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                <span className="text-[11px] text-slate-400">Active Cottage Stays</span>
                <p className="text-xl font-bold text-sky-400">{monthlyArchiveStats.bookingsCount} Bookings</p>
              </div>

              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                <span className="text-[11px] text-slate-400">Attached ID Proofs</span>
                <p className="text-xl font-bold text-teal-400">
                  {monthlyArchiveStats.docsCount} Files ({monthlyArchiveStats.sizeMB} MB)
                </p>
              </div>
            </div>

            {/* Archive Contents Description */}
            <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 text-xs text-slate-300 space-y-2">
              <span className="font-bold text-slate-200 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-emerald-400" /> What is included inside the downloaded .ZIP package:
              </span>
              <ul className="list-disc list-inside space-y-1 text-slate-400 text-[11px] pl-1">
                <li>
                  <strong className="text-slate-300">visitors_register_{archiveYear}_{String(archiveMonth).padStart(2, '0')}.csv</strong> — Complete master register with guest names, phone numbers, addresses, stay dates, and Aadhaar numbers.
                </li>
                <li>
                  <strong className="text-slate-300">police_guest_register_{archiveYear}_{String(archiveMonth).padStart(2, '0')}.csv</strong> — Pre-formatted official Form C ledger ready for police station inspection and tourism audit compliance.
                </li>
                <li>
                  <strong className="text-slate-300">/id_documents/</strong> — Folder containing all original uploaded Aadhaar cards, passport scans, and identity photos cleanly categorized per guest.
                </li>
              </ul>
            </div>

            {/* Action Buttons: 1. Download Archive (.ZIP) and 2. Reclaim Storage Purge */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 pt-4 border-t border-slate-800">
              <div className="flex items-center gap-2 text-xs">
                {downloadedMonths.has(monthKey) ? (
                  <span className="flex items-center gap-1.5 text-emerald-400 font-semibold bg-emerald-500/10 px-3 py-1.5 rounded-xl border border-emerald-500/30">
                    <CheckCircle className="w-4 h-4" /> Downloaded & Saved to PC for {monthLabel} {archiveYear}
                  </span>
                ) : (
                  <span className="text-slate-400 text-[11px]">
                    Step 1: Download the backup ZIP to your PC before purging cloud storage.
                  </span>
                )}
              </div>

              <div className="flex items-center gap-3">
                {/* Download Button */}
                <button
                  onClick={handleDownloadArchive}
                  disabled={isArchiving}
                  className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white text-xs font-bold shadow-lg shadow-emerald-900/30 transition-all disabled:opacity-50"
                >
                  <Download className="w-4 h-4" />
                  <span>{isArchiving ? 'Generating Package...' : `Download ${monthLabel} Archive (.ZIP)`}</span>
                </button>

                {/* Purge Cloud Storage Button (Admin Only) */}
                {currentRole === 'admin' && (
                  <button
                    onClick={() => setShowPurgeModal(true)}
                    className="flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-slate-950 hover:bg-rose-950/40 text-rose-400 border border-rose-500/30 text-xs font-bold transition-all"
                    title="Purge uploaded files from Supabase bucket after saving locally"
                  >
                    <Trash2 className="w-4 h-4 text-rose-400" />
                    <span>Free Up Cloud Storage</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 3: OCCUPANCY REPORTS                                 */}
      {/* ======================================================== */}
      {activeTab === 'reports' && (
        <div className="space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
              <span className="text-xs text-slate-400">Live Occupancy Rate</span>
              <div className="text-3xl font-black text-emerald-400">{occupancyRate}%</div>
              <div className="w-full bg-slate-950 rounded-full h-2 overflow-hidden border border-slate-800">
                <div
                  className="bg-gradient-to-r from-emerald-500 to-teal-400 h-full rounded-full transition-all"
                  style={{ width: `${occupancyRate}%` }}
                />
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
              <span className="text-xs text-slate-400">Completed Stays Hosted</span>
              <div className="text-3xl font-black text-slate-100">{completedStays.length}</div>
              <p className="text-xs text-slate-500">Archived in history database</p>
            </div>

            <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
              <span className="text-xs text-slate-400">Total Registered Guests</span>
              <div className="text-3xl font-black text-sky-400">{guests.length}</div>
              <p className="text-xs text-slate-500">Master guest directory records</p>
            </div>
          </div>

          {/* Room Breakdown Stats */}
          <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-bold text-sm text-slate-100 flex items-center gap-2">
                <Building2 className="w-4 h-4 text-emerald-400" />
                Room Utilization Breakdown by Category
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
              {rooms.map((r) => {
                const isOccupied = bookings.some(
                  (b) => b && b.status === 'Checked In' && (b.room_id === r.id || b.room_number === r.room_number)
                );
                const effectiveStatus = r.status === 'Maintenance' ? 'Maintenance' : (isOccupied ? 'Occupied' : 'Available');
                return (
                  <div key={r.id} className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                    <span className="text-xs font-bold text-slate-300">Room {r.room_number}</span>
                    <div className="text-sm font-bold text-slate-100">{r.room_type}</div>
                    <span
                      className={`text-[11px] font-semibold block px-2 py-0.5 rounded text-center ${
                        isOccupied
                          ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                          : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      }`}
                    >
                      {effectiveStatus}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 4: STAY LOGS                                         */}
      {/* ======================================================== */}
      {activeTab === 'history' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-sm text-slate-100 flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-400" />
              Completed Stays Log ({completedStays.length})
            </h3>
          </div>

          <div className="rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-950 text-slate-400 uppercase font-mono text-[11px] border-b border-slate-800">
                  <tr>
                    <th className="p-4">Ref Code</th>
                    <th className="p-4">Guest</th>
                    <th className="p-4">Room</th>
                    <th className="p-4">Duration</th>
                    <th className="p-4">Staff Notes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {completedStays.map((b) => {
                    const { checkInTime, checkOutTime } = getBookingTimestamps(b, auditLogs);
                    return (
                      <tr key={b.id} className="hover:bg-slate-800/40">
                        <td className="p-4 font-mono font-bold text-emerald-400">{b.booking_ref}</td>
                        <td className="p-4 font-bold text-slate-100">{b.guest_name}</td>
                        <td className="p-4">{b.room_number}</td>
                        <td className="p-4">
                          <div className="font-semibold text-slate-200">{b.check_in_date} → {b.check_out_date}</div>
                          <div className="mt-1 space-y-0.5 text-[11px] font-mono text-slate-400">
                            <div className="flex items-center gap-1 text-emerald-400/90">
                              <span className="text-[10px] uppercase text-slate-500 font-sans">In:</span>
                              <span>{checkInTime}</span>
                            </div>
                            <div className="flex items-center gap-1 text-amber-400/90">
                              <span className="text-[10px] uppercase text-slate-500 font-sans">Out:</span>
                              <span>{checkOutTime}</span>
                            </div>
                          </div>
                        </td>
                        <td className="p-4 text-slate-400 italic">{b.notes || 'Normal checkout'}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          <div className="pt-4">
            <h3 className="font-bold text-sm text-slate-100 flex items-center gap-2 mb-3">
              <XCircle className="w-4 h-4 text-rose-400" />
              Cancelled Reservations Log ({cancelledStays.length})
            </h3>
            <div className="rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-950 text-slate-400 uppercase font-mono text-[11px] border-b border-slate-800">
                  <tr>
                    <th className="p-4">Ref Code</th>
                    <th className="p-4">Guest</th>
                    <th className="p-4">Room</th>
                    <th className="p-4">Cancelled Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {cancelledStays.map((b) => (
                    <tr key={b.id} className="hover:bg-slate-800/40">
                      <td className="p-4 font-mono text-rose-400">{b.booking_ref}</td>
                      <td className="p-4 font-semibold text-slate-200">{b.guest_name}</td>
                      <td className="p-4">{b.room_number}</td>
                      <td className="p-4 text-slate-400">{b.check_in_date}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 5: STAFF DIRECTORY                                   */}
      {/* ======================================================== */}
      {activeTab === 'staff' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-sm text-slate-100 flex items-center gap-2">
              <Users className="w-4 h-4 text-emerald-400" />
              Staff Accounts & Access Controls
            </h3>
            <button
              onClick={() => setShowStaffModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 text-white text-xs font-bold shadow-md shadow-emerald-900/30"
            >
              <UserPlus className="w-3.5 h-3.5" />
              Add Staff Member
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {staffList.map((s) => (
              <div key={s.id} className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex items-start justify-between">
                <div>
                  <h4 className="font-bold text-sm text-slate-100">{s.full_name}</h4>
                  <p className="text-xs text-slate-400 mt-0.5">{s.title || 'Staff'}</p>
                  <p className="text-xs text-slate-400 mt-1">{s.email}</p>
                  <p className="text-xs text-slate-400">{s.phone}</p>
                </div>
                <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 uppercase">
                  {s.role}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Purge Cloud Storage Confirmation Modal */}
      {showPurgeModal && (
        <Modal
          isOpen={showPurgeModal}
          onClose={() => setShowPurgeModal(false)}
          title={`Reclaim Cloud Storage for ${monthLabel} ${archiveYear}`}
        >
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-rose-950/20 border border-rose-500/30 flex items-start gap-3 text-xs text-slate-300">
              <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-rose-300">Free Tier Database & Storage Cleanup</p>
                <p className="mt-1 text-slate-400">
                  This will remove the large image/PDF document files for <strong className="text-slate-200">{monthLabel} {archiveYear}</strong> from Supabase Storage bucket to free up space.
                </p>
                <p className="mt-1 text-slate-400">
                  Your guest contact records, stay history, and phone numbers in the database will remain completely intact.
                </p>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-400 space-y-1">
              <p>Target Month: <strong className="text-slate-200">{monthLabel} {archiveYear}</strong></p>
              <p>Files to purge: <strong className="text-rose-400">{monthlyArchiveStats.docsCount} documents ({monthlyArchiveStats.sizeMB} MB)</strong></p>
              <p>Archive downloaded: <strong className={downloadedMonths.has(monthKey) ? 'text-emerald-400' : 'text-amber-400'}>{downloadedMonths.has(monthKey) ? 'Yes (Safely saved on your computer)' : 'Not yet downloaded! Please download archive first.'}</strong></p>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setShowPurgeModal(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-slate-200"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmPurge}
                disabled={isPurging}
                className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow-lg shadow-rose-900/30 transition-all disabled:opacity-50"
              >
                <Trash2 className="w-4 h-4" />
                <span>{isPurging ? 'Purging Storage...' : 'Confirm & Free Up Storage'}</span>
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Document Viewer Modal */}
      {viewingDoc && (
        <DocumentViewerModal
          isOpen={Boolean(viewingDoc)}
          onClose={() => setViewingDoc(null)}
          document={viewingDoc}
        />
      )}

      {/* Staff Account Modal */}
      <Modal
        isOpen={showStaffModal}
        onClose={() => setShowStaffModal(false)}
        title="Create New Staff Member Account"
      >
        <form onSubmit={handleAddStaffSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Full Name *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Rahul Varma"
              value={newStaffName}
              onChange={(e) => setNewStaffName(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-xl text-slate-200 focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Email Address *
              </label>
              <input
                type="email"
                required
                placeholder="rahul@rejchachan.com"
                value={newStaffEmail}
                onChange={(e) => setNewStaffEmail(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-xl text-slate-200 focus:outline-none focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Phone Number
              </label>
              <input
                type="tel"
                placeholder="+91 98460 00000"
                value={newStaffPhone}
                onChange={(e) => setNewStaffPhone(sanitizePhoneNumber(e.target.value))}
                className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-xl text-slate-200 focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Job Title / Designation
              </label>
              <input
                type="text"
                placeholder="Front Desk Executive"
                value={newStaffTitle}
                onChange={(e) => setNewStaffTitle(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-xl text-slate-200 focus:outline-none focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Role Permission *
              </label>
              <select
                value={newStaffRole}
                onChange={(e) => setNewStaffRole(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-xl text-slate-200 focus:outline-none focus:border-emerald-500"
              >
                <option value="staff">Staff (Operational Access)</option>
                <option value="admin">Admin / Owner (Full Access)</option>
              </select>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setShowStaffModal(false)}
              className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-slate-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 text-white text-xs font-bold shadow-lg shadow-emerald-900/30"
            >
              Create Account
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
