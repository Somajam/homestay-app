import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { StatusBadge } from '../components/common/StatusBadge';
import { CheckInModal } from '../components/modals/CheckInModal';
import { CheckOutModal } from '../components/modals/CheckOutModal';
import { BookingModal } from '../components/modals/BookingModal';
import { MonthlyCalendarView } from '../components/calendar/MonthlyCalendarView';
import {
  CalendarCheck,
  Search,
  Plus,
  LogIn,
  LogOut,
  XCircle,
  Calendar,
  Filter,
  CheckCircle,
  List,
} from 'lucide-react';
import { calculateStayRate } from '../utils/pricing';

export const Bookings = () => {
  const { bookings, rooms, cancelBooking } = useApp();

  const [viewMode, setViewMode] = useState('list'); // 'list' | 'calendar'
  const [activeTab, setActiveTab] = useState('All'); // 'All' | 'Upcoming' | 'Checked In' | 'Checked Out' | 'Cancelled'
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRoomFilter, setSelectedRoomFilter] = useState('all');

  // Modals state
  const [activeCheckIn, setActiveCheckIn] = useState(null);
  const [activeCheckOut, setActiveCheckOut] = useState(null);
  const [showBookingModal, setShowBookingModal] = useState(false);

  // Local calendar date (YYYY-MM-DD)
  const getLocalDateStr = () => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };
  const todayStr = getLocalDateStr();

  // Filter Bookings logic
  const filteredBookings = bookings.filter((b) => {
    const matchesSearch =
      b.booking_ref.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.guest_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.room_number.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesRoom =
      selectedRoomFilter === 'all' || b.room_id === selectedRoomFilter;

    let matchesTab = true;
    if (activeTab === 'Upcoming') {
      matchesTab = b.status === 'Confirmed' && b.check_in_date >= todayStr;
    } else if (activeTab === 'Checked In') {
      matchesTab = b.status === 'Checked In';
    } else if (activeTab === 'Checked Out') {
      matchesTab = b.status === 'Checked Out';
    } else if (activeTab === 'Cancelled') {
      matchesTab = b.status === 'Cancelled';
    }

    return matchesSearch && matchesRoom && matchesTab;
  });

  return (
    <div className="space-y-6">
      {/* Page Title & Add Button */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl">
        <div>
          <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <CalendarCheck className="w-5 h-5 text-emerald-400" />
            Bookings & Check-In / Check-Out Operations
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Manage reservation lifecycles, monitor room occupancy schedules, and execute instant check-in/out transitions.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {/* View Switcher Toggle */}
          <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => setViewMode('list')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                viewMode === 'list'
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <List className="w-3.5 h-3.5" />
              <span>List / Table</span>
            </button>
            <button
              onClick={() => setViewMode('calendar')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                viewMode === 'calendar'
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>Monthly Calendar</span>
            </button>
          </div>

          <button
            onClick={() => setShowBookingModal(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white text-xs font-bold shadow-lg shadow-emerald-900/30 transition-all"
          >
            <Plus className="w-4 h-4" />
            Create New Booking
          </button>
        </div>
      </div>

      {viewMode === 'calendar' ? (
        <MonthlyCalendarView onNewBooking={() => setShowBookingModal(true)} />
      ) : (
        <>
          {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 border-b border-slate-800">
        {['All', 'Upcoming', 'Checked In', 'Checked Out', 'Cancelled'].map((tab) => {
          const count =
            tab === 'All'
              ? bookings.length
              : bookings.filter((b) => {
                  if (tab === 'Upcoming') return b.status === 'Confirmed';
                  return b.status === tab;
                }).length;

          const isActive = activeTab === tab;
          return (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-2 ${
                isActive
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 shadow-sm'
                  : 'bg-slate-900 text-slate-400 border border-slate-800 hover:bg-slate-800'
              }`}
            >
              <span>{tab}</span>
              <span
                className={`px-1.5 py-0.5 rounded text-[10px] ${
                  isActive ? 'bg-emerald-500/30 text-emerald-300' : 'bg-slate-800 text-slate-500'
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Search & Room Filter Controls */}
      <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Search Input */}
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search booking ref, guest name, room..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-xs bg-slate-950 border border-slate-800 rounded-xl text-slate-200 focus:outline-none focus:border-emerald-500"
          />
        </div>

        {/* Room Filter Dropdown */}
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="w-4 h-4 text-slate-400" />
          <span className="text-xs text-slate-400">Filter by Room:</span>
          <select
            value={selectedRoomFilter}
            onChange={(e) => setSelectedRoomFilter(e.target.value)}
            className="px-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-xl text-slate-200 focus:outline-none focus:border-emerald-500"
          >
            <option value="all">All Rooms</option>
            {rooms.map((r) => (
              <option key={r.id} value={r.id}>
                {r.room_number}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Bookings Table */}
      <div className="rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950 text-slate-400 uppercase font-mono text-[11px] border-b border-slate-800">
              <tr>
                <th className="p-4">Booking Ref</th>
                <th className="p-4">Guest Name</th>
                <th className="p-4">Assigned Room</th>
                <th className="p-4">Check-In / Out Dates</th>
                <th className="p-4">Guests</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Workflow Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredBookings.length === 0 ? (
                <tr>
                  <td colSpan="7" className="p-8 text-center text-slate-500">
                    No reservations found matching active filters.
                  </td>
                </tr>
              ) : (
                filteredBookings.map((b) => (
                  <tr key={b.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="p-4 font-mono font-bold text-emerald-400">
                      {b.booking_ref}
                    </td>
                    <td className="p-4 font-bold text-slate-100">{b.guest_name}</td>
                    <td className="p-4 text-slate-200">{b.room_number}</td>
                    <td className="p-4">
                      <div className="flex items-center gap-1.5 text-slate-200">
                        <Calendar className="w-3.5 h-3.5 text-slate-500" />
                        <span>{b.check_in_date}</span>
                        <span className="text-slate-500">→</span>
                        <span>{b.check_out_date}</span>
                      </div>
                      {(() => {
                        const totalAmt = b.total_amount || (() => {
                          const room = rooms.find((r) => r.id === b.room_id || r.room_number === b.room_number);
                          return room ? calculateStayRate(room, b.check_in_date, b.check_out_date).totalAmount : null;
                        })();
                        return totalAmt ? (
                          <div className="text-[10px] text-emerald-400 font-mono mt-0.5 font-semibold">
                            ₹{totalAmt.toLocaleString('en-IN')}
                          </div>
                        ) : null;
                      })()}
                    </td>
                    <td className="p-4 text-slate-300">{b.num_guests} Person(s)</td>
                    <td className="p-4">
                      <StatusBadge status={b.status} />
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {/* Action buttons depending on status */}
                        {b.status === 'Confirmed' && (
                          <button
                            onClick={() => setActiveCheckIn(b)}
                            className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1 shadow-md shadow-emerald-900/30 transition-all"
                          >
                            <LogIn className="w-3.5 h-3.5" /> Check In
                          </button>
                        )}

                        {b.status === 'Checked In' && (
                          <button
                            onClick={() => setActiveCheckOut(b)}
                            className="px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold flex items-center gap-1 shadow-md shadow-amber-900/30 transition-all"
                          >
                            <LogOut className="w-3.5 h-3.5" /> Check Out
                          </button>
                        )}

                        {b.status === 'Checked Out' && (
                          <span className="text-xs text-slate-500 flex items-center gap-1">
                            <CheckCircle className="w-3.5 h-3.5 text-emerald-400" /> Stay Completed
                          </span>
                        )}

                        {b.status !== 'Checked Out' && b.status !== 'Cancelled' && (
                          <button
                            onClick={() => {
                              if (window.confirm(`Cancel reservation for ${b.guest_name} (${b.booking_ref})?`)) {
                                cancelBooking(b.id);
                              }
                            }}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-colors"
                            title="Cancel Reservation"
                          >
                            <XCircle className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  )}

      {/* Check-In Modal */}
      <CheckInModal
        isOpen={!!activeCheckIn}
        onClose={() => setActiveCheckIn(null)}
        booking={activeCheckIn}
      />

      {/* Check-Out Modal */}
      <CheckOutModal
        isOpen={!!activeCheckOut}
        onClose={() => setActiveCheckOut(null)}
        booking={activeCheckOut}
      />

      {/* Booking Modal */}
      <BookingModal
        isOpen={showBookingModal}
        onClose={() => setShowBookingModal(false)}
      />
    </div>
  );
};
