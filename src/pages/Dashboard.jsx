import React, { useState } from 'react';
import { useApp, isRoomMatch } from '../context/AppContext';
import { StatusBadge } from '../components/common/StatusBadge';
import { CheckInModal } from '../components/modals/CheckInModal';
import { CheckOutModal } from '../components/modals/CheckOutModal';
import { BookingModal } from '../components/modals/BookingModal';
import { GuestModal } from '../components/modals/GuestModal';
import { DocumentUploadModal } from '../components/modals/DocumentUploadModal';
import {
  LogIn,
  LogOut,
  BedDouble,
  UserCheck,
  CalendarCheck,
  Plus,
  Upload,
  UserPlus,
  ArrowRight,
  Clock,
  ShieldAlert,
  XCircle,
} from 'lucide-react';

export const Dashboard = () => {
  const { bookings = [], rooms = [], guests = [], documents = [], cancelBooking } = useApp();

  const [activeCheckInBooking, setActiveCheckInBooking] = useState(null);
  const [activeCheckOutBooking, setActiveCheckOutBooking] = useState(null);

  // Modals state
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [showGuestModal, setShowGuestModal] = useState(false);
  const [showDocModal, setShowDocModal] = useState(false);

  // Safe Array Fallbacks
  const safeBookings = Array.isArray(bookings) ? bookings : [];
  const safeRooms = Array.isArray(rooms) ? rooms : [];
  const safeGuests = Array.isArray(guests) ? guests : [];
  const safeDocuments = Array.isArray(documents) ? documents : [];

  // Local calendar date (YYYY-MM-DD)
  const getLocalDateStr = () => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const todayStr = getLocalDateStr();

  // Metrics
  // Today's Check-ins: Strictly confirmed bookings scheduled for today (not past, not future)
  const todayCheckIns = safeBookings.filter(
    (b) => b && b.check_in_date === todayStr && b.status === 'Confirmed'
  );

  // Today's Check-outs: Strictly checked-in bookings departing today
  const todayCheckOuts = safeBookings.filter(
    (b) => b && b.check_out_date === todayStr && b.status === 'Checked In'
  );

  // Occupied Rooms: Strictly cottages that currently have an active 'Checked In' guest
  const occupiedRooms = safeRooms.filter((r) => {
    if (!r) return false;
    const hasCheckedIn = safeBookings.some(
      (b) => b && b.status === 'Checked In' && isRoomMatch(r, b)
    );
    return hasCheckedIn || r.status === 'Occupied';
  });

  // Available Rooms: Cottages ready for check-in (not maintenance, not currently occupied)
  const availableRooms = safeRooms.filter((r) => {
    if (!r) return false;
    if (r.status === 'Maintenance') return false;
    const isOccupied = safeBookings.some(
      (b) => b && b.status === 'Checked In' && isRoomMatch(r, b)
    );
    return !isOccupied && r.status !== 'Occupied';
  });

  // Upcoming Bookings: Strictly future or today's confirmed bookings (exclude any past dates that were not checked in)
  const upcomingBookings = safeBookings
    .filter((b) => b && b.status === 'Confirmed' && b.check_in_date >= todayStr)
    .sort((a, b) => new Date(a.check_in_date) - new Date(b.check_in_date));

  const handleCancelReservation = async (b) => {
    if (!b) return;
    const confirmMsg = `Cancel reservation for ${b.guest_name || 'Guest'} (Room ${b.room_number || ''}, Ref: ${b.booking_ref || ''})?`;
    if (window.confirm(confirmMsg)) {
      await cancelBooking(b.id);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner / Welcome Bar */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-900 to-emerald-950/40 border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-xl">
        <div className="flex items-center gap-4">
          <div className="p-2 rounded-2xl bg-slate-950/80 border border-slate-800 shrink-0 hidden sm:block">
            <img
              src="/somajam_logo.png"
              alt="Somajam Holidays Logo"
              className="h-12 w-auto object-contain"
            />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-slate-100 flex items-center gap-2">
              Somajam Holidays • Parunthumpara Operations
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Real-time front desk queue, 5 1BHK cottage occupancy status, and 1-step guest registration & room assignment.
            </p>
          </div>
        </div>

        {/* Quick Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setShowBookingModal(true)}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white text-xs font-bold shadow-lg shadow-emerald-900/30 transition-all"
          >
            <Plus className="w-4 h-4" />
            Add Booking
          </button>
          <button
            onClick={() => setShowGuestModal(true)}
            className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-medium transition-all"
          >
            <UserPlus className="w-4 h-4 text-emerald-400" />
            Add Guest
          </button>
          <button
            onClick={() => setShowDocModal(true)}
            className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-medium transition-all"
          >
            <Upload className="w-4 h-4 text-sky-400" />
            Upload ID Doc
          </button>
        </div>
      </div>

      {/* Summary Metrics Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1 */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-between shadow-md">
          <div>
            <p className="text-xs text-slate-400 font-medium">Today's Check-Ins</p>
            <p className="text-2xl font-black text-slate-100 mt-1">
              {todayCheckIns.length}
            </p>
            <p className="text-[11px] text-emerald-400 mt-1 flex items-center gap-1">
              <Clock className="w-3 h-3" /> Arriving today
            </p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <LogIn className="w-6 h-6" />
          </div>
        </div>

        {/* Metric 2 */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-between shadow-md">
          <div>
            <p className="text-xs text-slate-400 font-medium">Today's Check-Outs</p>
            <p className="text-2xl font-black text-slate-100 mt-1">
              {todayCheckOuts.length}
            </p>
            <p className="text-[11px] text-amber-400 mt-1 flex items-center gap-1">
              <Clock className="w-3 h-3" /> Departing today
            </p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
            <LogOut className="w-6 h-6" />
          </div>
        </div>

        {/* Metric 3 */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-between shadow-md">
          <div>
            <p className="text-xs text-slate-400 font-medium">Occupied Rooms</p>
            <p className="text-2xl font-black text-slate-100 mt-1">
              {occupiedRooms.length} <span className="text-xs font-normal text-slate-500">/ {safeRooms.length}</span>
            </p>
            <p className="text-[11px] text-rose-400 mt-1">
              {((occupiedRooms.length / (safeRooms.length || 1)) * 100).toFixed(0)}% Occupancy
            </p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400">
            <UserCheck className="w-6 h-6" />
          </div>
        </div>

        {/* Metric 4 */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-between shadow-md">
          <div>
            <p className="text-xs text-slate-400 font-medium">Available Rooms</p>
            <p className="text-2xl font-black text-slate-100 mt-1">
              {availableRooms.length}
            </p>
            <p className="text-[11px] text-teal-400 mt-1">Ready for check-in</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-400">
            <BedDouble className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Operational Queues Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Today's Check-ins Queue */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4 shadow-xl">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <LogIn className="w-5 h-5 text-emerald-400" />
              <h3 className="font-bold text-sm text-slate-100">
                Today's Expected Check-ins ({todayCheckIns.length})
              </h3>
            </div>
            <span className="text-[11px] font-mono bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded border border-emerald-500/20">
              Arrivals Queue
            </span>
          </div>

          {todayCheckIns.length === 0 ? (
            <div className="py-8 text-center text-slate-500 text-xs">
              No pending check-in arrivals for today.
            </div>
          ) : (
            <div className="space-y-3">
              {todayCheckIns.map((b) => {
                if (!b) return null;
                const guestDocs = safeDocuments.filter((d) => d && d.guest_id === b.guest_id);
                return (
                  <div
                    key={b.id || Math.random()}
                    className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between gap-3 hover:border-slate-700 transition-all"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-xs text-slate-100">
                          {b.guest_name || 'Guest'}
                        </h4>
                        <span className="text-[10px] font-mono text-slate-500">
                          {b.booking_ref}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 mt-1">
                        Room: <strong className="text-slate-200">{b.room_number}</strong> ({b.num_guests || 1} Guests)
                      </p>
                      {guestDocs.length === 0 && (
                        <p className="text-[10px] text-amber-400 mt-1 flex items-center gap-1">
                          <ShieldAlert className="w-3 h-3" /> ID proof pending upload
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => handleCancelReservation(b)}
                        className="px-2.5 py-1.5 rounded-lg border border-rose-500/30 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 text-xs font-semibold transition-all flex items-center gap-1"
                        title="Cancel this reservation"
                      >
                        <XCircle className="w-3.5 h-3.5" />
                        Cancel
                      </button>
                      <button
                        onClick={() => setActiveCheckInBooking(b)}
                        className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shadow-md shadow-emerald-900/30 shrink-0 flex items-center gap-1.5"
                      >
                        <LogIn className="w-3.5 h-3.5" />
                        Check In
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Today's Check-outs Queue */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4 shadow-xl">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <LogOut className="w-5 h-5 text-amber-400" />
              <h3 className="font-bold text-sm text-slate-100">
                Today's Scheduled Check-outs ({todayCheckOuts.length})
              </h3>
            </div>
            <span className="text-[11px] font-mono bg-amber-500/10 text-amber-400 px-2 py-0.5 rounded border border-amber-500/20">
              Departures Queue
            </span>
          </div>

          {todayCheckOuts.length === 0 ? (
            <div className="py-8 text-center text-slate-500 text-xs">
              No guests scheduled to check out today.
            </div>
          ) : (
            <div className="space-y-3">
              {todayCheckOuts.map((b) => {
                if (!b) return null;
                return (
                  <div
                    key={b.id || Math.random()}
                    className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between gap-3 hover:border-slate-700 transition-all"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-xs text-slate-100">
                          {b.guest_name || 'Guest'}
                        </h4>
                        <span className="text-[10px] font-mono text-slate-500">
                          {b.booking_ref}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 mt-1">
                        Room: <strong className="text-slate-200">{b.room_number}</strong>
                      </p>
                    </div>
                    <button
                      onClick={() => setActiveCheckOutBooking(b)}
                      className="px-3.5 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold transition-all shadow-md shadow-amber-900/30 shrink-0 flex items-center gap-1.5"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      Check Out
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Upcoming Bookings Preview */}
      <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4 shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <CalendarCheck className="w-5 h-5 text-sky-400" />
            <h3 className="font-bold text-sm text-slate-100">
              Upcoming Reservations Preview ({upcomingBookings.length})
            </h3>
          </div>
          <button
            onClick={() => setShowBookingModal(true)}
            className="text-xs text-sky-400 hover:text-sky-300 font-semibold flex items-center gap-1"
          >
            Create Reservation <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {upcomingBookings.length === 0 ? (
          <div className="py-8 text-center text-slate-500 text-xs">
            No upcoming reservations scheduled.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {upcomingBookings.slice(0, 6).map((b) => {
              if (!b) return null;
              const isToday = b.check_in_date === todayStr;
              return (
                <div
                  key={b.id || Math.random()}
                  className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3 hover:border-slate-700 transition-all flex flex-col justify-between"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono text-emerald-400 font-bold">
                        {b.booking_ref}
                      </span>
                      <div className="flex items-center gap-1.5">
                        {isToday && (
                          <span className="text-[10px] bg-emerald-500/20 text-emerald-400 font-semibold px-1.5 py-0.5 rounded border border-emerald-500/30">
                            Today
                          </span>
                        )}
                        <StatusBadge status={b.status} />
                      </div>
                    </div>
                    <p className="font-bold text-sm text-slate-100">{b.guest_name || 'Guest'}</p>
                    <div className="text-xs text-slate-400 space-y-0.5">
                      <p>Room: <strong className="text-slate-300">{b.room_number}</strong></p>
                      <p>Check-in: <strong className="text-slate-300">{b.check_in_date}</strong></p>
                      <p>Check-out: <strong className="text-slate-300">{b.check_out_date}</strong></p>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between gap-2">
                    <button
                      onClick={() => handleCancelReservation(b)}
                      className="px-2 py-1 rounded-lg text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 text-xs font-medium flex items-center gap-1 transition-colors"
                      title="Cancel Reservation"
                    >
                      <XCircle className="w-3.5 h-3.5" />
                      Cancel
                    </button>
                    <button
                      onClick={() => setActiveCheckInBooking(b)}
                      className="px-2.5 py-1 rounded-lg bg-emerald-600/80 hover:bg-emerald-600 text-white text-xs font-semibold flex items-center gap-1 transition-colors shadow-sm"
                    >
                      <LogIn className="w-3 h-3" />
                      Check In
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Check-In Modal */}
      <CheckInModal
        isOpen={!!activeCheckInBooking}
        onClose={() => setActiveCheckInBooking(null)}
        booking={activeCheckInBooking}
      />

      {/* Check-Out Modal */}
      <CheckOutModal
        isOpen={!!activeCheckOutBooking}
        onClose={() => setActiveCheckOutBooking(null)}
        booking={activeCheckOutBooking}
      />

      {/* Add Booking Modal */}
      <BookingModal
        isOpen={showBookingModal}
        onClose={() => setShowBookingModal(false)}
      />

      {/* Add Guest Modal */}
      <GuestModal
        isOpen={showGuestModal}
        onClose={() => setShowGuestModal(false)}
      />

      {/* Upload Document Modal */}
      <DocumentUploadModal
        isOpen={showDocModal}
        onClose={() => setShowDocModal(false)}
      />
    </div>
  );
};
