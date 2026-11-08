import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Modal } from '../common/Modal';
import {
  ChevronLeft,
  ChevronRight,
  Calendar,
  LogIn,
  LogOut,
  XCircle,
  Plus,
  Building2,
} from 'lucide-react';

export const MonthlyCalendarView = ({ onNewBooking }) => {
  const { bookings, rooms, processCheckIn, processCheckOut, cancelBooking } = useApp();

  const today = new Date();
  const [currentDate, setCurrentDate] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
  const [selectedRoomFilter, setSelectedRoomFilter] = useState('all');
  const [activeBookingDetail, setActiveBookingDetail] = useState(null);

  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth(); // 0-indexed

  // Month navigation
  const prevMonth = () => {
    setCurrentDate(new Date(currentYear, currentMonth - 1, 1));
  };
  const nextMonth = () => {
    setCurrentDate(new Date(currentYear, currentMonth + 1, 1));
  };
  const goToToday = () => {
    setCurrentDate(new Date(today.getFullYear(), today.getMonth(), 1));
  };

  const monthName = currentDate.toLocaleString('default', { month: 'long' });

  // Compute days in month and starting day of week
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDayIndex = new Date(currentYear, currentMonth, 1).getDay(); // 0 is Sunday

  // Helper to format date string YYYY-MM-DD
  const formatDayStr = (dayNum) => {
    const m = String(currentMonth + 1).padStart(2, '0');
    const d = String(dayNum).padStart(2, '0');
    return `${currentYear}-${m}-${d}`;
  };

  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

  // Find bookings active on a specific day (inclusive of check_in_date up to check_out_date)
  const getBookingsForDay = (dayStr) => {
    return bookings.filter((b) => {
      if (b.status === 'Cancelled') return false;
      if (selectedRoomFilter !== 'all' && b.room_id !== selectedRoomFilter) return false;
      if (!b.check_in_date || !b.check_out_date) return false;

      // Active during stay
      return dayStr >= b.check_in_date && dayStr < b.check_out_date;
    });
  };

  // Get status pill styling
  const getStatusColor = (status) => {
    switch (status) {
      case 'Checked In':
        return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 hover:bg-emerald-500/30';
      case 'Confirmed':
        return 'bg-sky-500/20 text-sky-300 border-sky-500/40 hover:bg-sky-500/30';
      case 'Checked Out':
        return 'bg-slate-700/40 text-slate-300 border-slate-600/40 hover:bg-slate-700/60';
      default:
        return 'bg-slate-800 text-slate-300 border-slate-700';
    }
  };

  const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className="space-y-4">
      {/* Calendar Controls & Filter Header */}
      <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-lg">
        {/* Navigation & Month Title */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
            <button
              onClick={prevMonth}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors"
              title="Previous Month"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={nextMonth}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors"
              title="Next Month"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-emerald-400" />
            <span>{monthName} {currentYear}</span>
          </h3>

          <button
            onClick={goToToday}
            className="px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold border border-slate-700 transition-colors"
          >
            Today
          </button>
        </div>

        {/* Room Filter & Legend */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400 font-semibold">Cottage:</span>
            <select
              value={selectedRoomFilter}
              onChange={(e) => setSelectedRoomFilter(e.target.value)}
              className="px-3 py-1.5 text-xs bg-slate-950 border border-slate-800 rounded-xl text-slate-200 focus:outline-none focus:border-emerald-500"
            >
              <option value="all">All Cottages (5)</option>
              {rooms.map((r) => (
                <option key={r.id} value={r.id}>
                  Room {r.room_number} ({r.room_type})
                </option>
              ))}
            </select>
          </div>

          {/* Quick Legend */}
          <div className="hidden sm:flex items-center gap-2 text-[11px] font-medium text-slate-400 bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-400" /> Checked In
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-sky-400" /> Confirmed
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-slate-500" /> Checked Out
            </span>
          </div>
        </div>
      </div>

      {/* 7-Day Monthly Calendar Grid */}
      <div className="rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden shadow-xl">
        {/* Days of Week Header */}
        <div className="grid grid-cols-7 bg-slate-950/80 border-b border-slate-800 text-center text-xs font-bold text-slate-400 py-3">
          {daysOfWeek.map((day, idx) => (
            <div
              key={day}
              className={`${idx === 0 || idx === 6 ? 'text-emerald-400/80' : 'text-slate-400'}`}
            >
              {day}
            </div>
          ))}
        </div>

        {/* Days Grid Cells */}
        <div className="grid grid-cols-7 auto-rows-fr divide-x divide-y divide-slate-800/60 bg-slate-950/40">
          {/* Empty cells before first day of month */}
          {Array.from({ length: firstDayIndex }).map((_, index) => (
            <div key={`empty-${index}`} className="min-h-[148px] sm:min-h-[155px] p-2 bg-slate-950/20 opacity-30" />
          ))}

          {/* Actual Month Days */}
          {Array.from({ length: daysInMonth }).map((_, index) => {
            const dayNum = index + 1;
            const dayStr = formatDayStr(dayNum);
            const isToday = dayStr === todayStr;
            const dayBookings = getBookingsForDay(dayStr);

            return (
              <div
                key={dayStr}
                className={`min-h-[148px] sm:min-h-[155px] p-1.5 transition-colors group relative flex flex-col justify-start ${
                  isToday
                    ? 'bg-emerald-950/20 border-emerald-500/30'
                    : 'hover:bg-slate-800/30'
                }`}
              >
                {/* Date header & Quick Add */}
                <div className="flex items-center justify-between mb-1">
                  <span
                    className={`text-xs font-bold w-5 h-5 sm:w-6 sm:h-6 flex items-center justify-center rounded-full ${
                      isToday
                        ? 'bg-emerald-500 text-slate-950 shadow-md font-black'
                        : 'text-slate-300 group-hover:text-emerald-400'
                    }`}
                  >
                    {dayNum}
                  </span>

                  {onNewBooking && (
                    <button
                      onClick={() => onNewBooking(dayStr)}
                      title={`Book for ${dayStr}`}
                      className="opacity-0 group-hover:opacity-100 p-1 rounded-md bg-slate-800 hover:bg-emerald-600 hover:text-white text-slate-400 transition-all text-[10px]"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  )}
                </div>

                {/* Day's Bookings List - Fits all 5 cottages together without scrolling */}
                <div className="space-y-1 flex-1 flex flex-col justify-start">
                  {dayBookings.map((b) => {
                    const isCheckInDay = b.check_in_date === dayStr;
                    const cleanRoom = String(b.room_number || '').replace(/^(Room|Cottage|No\.)\s*/i, '');
                    return (
                      <button
                        key={`${b.id}-${dayStr}`}
                        onClick={() => setActiveBookingDetail(b)}
                        className={`w-full text-left px-1.5 py-0.5 rounded-md border text-[10.5px] font-medium leading-tight transition-all flex items-center justify-between gap-1 truncate shadow-xs hover:scale-[1.01] ${getStatusColor(
                          b.status
                        )}`}
                        title={`Room ${b.room_number}: ${b.guest_name} (${b.status})`}
                      >
                        <span className="truncate flex items-center gap-1 min-w-0">
                          <span className="font-mono text-[9px] px-1 py-0.2 rounded bg-slate-900/70 font-bold shrink-0 opacity-90">
                            {cleanRoom ? `R${cleanRoom}` : 'R'}
                          </span>
                          <span className="truncate font-semibold">{b.guest_name}</span>
                        </span>
                        {isCheckInDay && (
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" title="Check-In Day" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Booking Quick View / Actions Modal */}
      {activeBookingDetail && (
        <Modal
          isOpen={Boolean(activeBookingDetail)}
          onClose={() => setActiveBookingDetail(null)}
          title={`Booking ${activeBookingDetail.booking_ref} Details`}
        >
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-base font-bold text-slate-100">
                    {activeBookingDetail.guest_name}
                  </h4>
                  <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                    <Building2 className="w-3.5 h-3.5 text-emerald-400" />
                    Cottage Room: <strong className="text-slate-200">{activeBookingDetail.room_number}</strong>
                  </p>
                </div>
                <span
                  className={`px-3 py-1 rounded-full text-xs font-bold border ${getStatusColor(
                    activeBookingDetail.status
                  )}`}
                >
                  {activeBookingDetail.status}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-800/80 text-xs">
                <div>
                  <span className="text-slate-400 text-[11px]">Check-In Date</span>
                  <p className="font-bold text-slate-200 mt-0.5">{activeBookingDetail.check_in_date}</p>
                </div>
                <div>
                  <span className="text-slate-400 text-[11px]">Check-Out Date</span>
                  <p className="font-bold text-slate-200 mt-0.5">{activeBookingDetail.check_out_date}</p>
                </div>
                <div>
                  <span className="text-slate-400 text-[11px]">Guests</span>
                  <p className="font-bold text-slate-200 mt-0.5">{activeBookingDetail.num_guests || 2} Persons</p>
                </div>
                <div>
                  <span className="text-slate-400 text-[11px]">Booking ID</span>
                  <p className="font-mono text-emerald-400 text-[11px] mt-0.5 truncate">{activeBookingDetail.booking_ref}</p>
                </div>
              </div>

              {activeBookingDetail.notes && (
                <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-300">
                  <span className="text-[11px] font-semibold text-slate-400 block mb-0.5">Notes / Requests:</span>
                  {activeBookingDetail.notes}
                </div>
              )}
            </div>

            {/* Quick Action Buttons */}
            <div className="flex flex-wrap items-center justify-end gap-2 pt-2 border-t border-slate-800">
              {activeBookingDetail.status === 'Confirmed' && (
                <button
                  onClick={() => {
                    processCheckIn(activeBookingDetail.id);
                    setActiveBookingDetail(null);
                  }}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-emerald-900/30"
                >
                  <LogIn className="w-4 h-4" />
                  Perform Check-In
                </button>
              )}

              {activeBookingDetail.status === 'Checked In' && (
                <button
                  onClick={() => {
                    processCheckOut(activeBookingDetail.id);
                    setActiveBookingDetail(null);
                  }}
                  className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-sky-900/30"
                >
                  <LogOut className="w-4 h-4" />
                  Process Check-Out
                </button>
              )}

              {activeBookingDetail.status !== 'Cancelled' && activeBookingDetail.status !== 'Checked Out' && (
                <button
                  onClick={() => {
                    if (window.confirm('Are you sure you want to cancel this booking?')) {
                      cancelBooking(activeBookingDetail.id);
                      setActiveBookingDetail(null);
                    }
                  }}
                  className="px-3 py-2 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/30 text-xs font-semibold flex items-center gap-1.5"
                >
                  <XCircle className="w-4 h-4" />
                  Cancel
                </button>
              )}

              <button
                onClick={() => setActiveBookingDetail(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
              >
                Close
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
