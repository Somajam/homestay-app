import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import {
  initialRooms,
  initialGuests,
  initialBookings,
  initialDocuments,
  initialStaff,
  initialExpensePayers,
  initialExpenses,
} from '../data/initialData';
import { calculateStayRate } from '../utils/pricing';

export const normalizeRoom = (r) => {
  if (!r) return r;
  const weekday = Number(r.weekday_rate ?? r.price_per_night ?? 3500);
  const weekend = Number(r.weekend_rate ?? (r.weekday_rate ? Math.round(r.weekday_rate * 1.25) : 4500));
  return {
    ...r,
    weekday_rate: weekday,
    weekend_rate: weekend,
    price_per_night: weekday,
    facilities: Array.isArray(r.facilities) ? r.facilities : [],
  };
};

const AppContext = createContext();

export const AppProvider = ({ children }) => {
  // Persistent Auth State (Safely wrapped in try/catch)
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    try {
      return localStorage.getItem('somajam_auth') === 'true';
    } catch (e) {
      return false;
    }
  });

  // Dynamic Role & User State
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const savedUser = localStorage.getItem('somajam_user');
      if (savedUser) {
        const parsed = JSON.parse(savedUser);
        if (parsed && typeof parsed === 'object' && parsed.name) {
          return parsed;
        }
      }
    } catch (e) {
      // Catch any invalid JSON in localStorage
    }
    return { id: 'stf-admin', name: 'Somajam Admin', username: 'admin', role: 'admin' };
  });

  const [currentRole, setCurrentRole] = useState(() => {
    try {
      const savedUser = localStorage.getItem('somajam_user');
      if (savedUser) {
        const parsed = JSON.parse(savedUser);
        if (parsed?.role) return parsed.role;
      }
    } catch (e) {}
    return 'admin';
  });

  // Audit Logs State
  const [auditLogs, setAuditLogs] = useState(() => {
    try {
      const saved = localStorage.getItem('somajam_audit_logs');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return [];
  });

  // Log Booking Action to Local Cache & Supabase
  const logBookingAction = async (bookingId, bookingRef, action, details = {}) => {
    const actorName =
      currentUser?.name || (currentRole === 'caretaker' ? 'Property Caretaker' : 'Somajam Admin');

    const logEntry = {
      id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      booking_id: bookingId,
      booking_ref: bookingRef,
      action: action,
      performed_by: actorName,
      guest_name: details.guest_name || '',
      room_number: details.room_number || '',
      details: details,
      created_at: new Date().toISOString(),
    };

    setAuditLogs((prev) => {
      const updated = [logEntry, ...prev].slice(0, 300);
      try {
        localStorage.setItem('somajam_audit_logs', JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });

    try {
      await supabase.from('booking_audit_logs').insert([logEntry]);
    } catch (err) {
      console.warn('booking_audit_logs sync fallback:', err);
    }
  };

  // Login Handler
  const login = async (username, password) => {
    const lowerUser = username.toLowerCase().trim();

    // Check default credentials
    let isValid = false;
    let displayName = 'Somajam Admin';
    let role = 'admin';

    if (
      (lowerUser === 'admin' || lowerUser === 'somajam') &&
      (password === 'somajam2026' || password === 'admin123' || password === 'password123' || password === 'admin')
    ) {
      isValid = true;
      displayName = lowerUser === 'somajam' ? 'Somajam Manager' : 'Somajam Admin';
      role = 'admin';
    } else if (
      lowerUser === 'caretaker' &&
      (password === 'caretaker2026' || password === 'somajam2026')
    ) {
      isValid = true;
      displayName = 'Property Caretaker';
      role = 'caretaker';
    }

    // Check optional Supabase admin_users table (supports dynamic users and roles)
    if (!isValid) {
      try {
        const { data, error } = await supabase
          .from('admin_users')
          .select('*')
          .eq('username', lowerUser)
          .eq('password', password)
          .single();

        if (!error && data) {
          isValid = true;
          displayName = data.full_name || data.username || 'Somajam Staff';
          role = data.role || (lowerUser.includes('caretaker') ? 'caretaker' : 'admin');
        }
      } catch (err) {
        // Fallback catch
      }
    }

    if (isValid) {
      const userObj = { id: `usr-${lowerUser}`, name: displayName, username: lowerUser, role: role };
      setIsAuthenticated(true);
      setCurrentUser(userObj);
      setCurrentRole(role);
      localStorage.setItem('somajam_auth', 'true');
      localStorage.setItem('somajam_user', JSON.stringify(userObj));
      showToast(`Welcome back, ${displayName}! (${role.toUpperCase()} MODE)`, 'success');
      return { success: true };
    } else {
      return { success: false, message: 'Invalid Username or Password' };
    }
  };

  // Logout Handler
  const logout = () => {
    setIsAuthenticated(false);
    setCurrentRole('admin');
    setCurrentUser({ id: 'stf-admin', name: 'Somajam Admin', username: 'admin', role: 'admin' });
    localStorage.removeItem('somajam_auth');
    localStorage.removeItem('somajam_user');
    showToast('Logged out successfully', 'info');
  };

  // One-time clean slate migration: purge dummy test transaction data from localStorage
  const DATA_CLEAN_VERSION = 'v1_production_clean_slate';
  try {
    if (localStorage.getItem('somajam_clean_version') !== DATA_CLEAN_VERSION) {
      localStorage.removeItem('somajam_bookings');
      localStorage.removeItem('somajam_guests');
      localStorage.removeItem('somajam_documents');
      localStorage.removeItem('somajam_expenses');

      // Reset all room statuses to Available in local cache
      const cachedRooms = localStorage.getItem('somajam_rooms');
      if (cachedRooms) {
        const parsed = JSON.parse(cachedRooms);
        if (Array.isArray(parsed)) {
          const resetRooms = parsed.map((r) => ({
            ...normalizeRoom(r),
            status: 'Available',
          }));
          localStorage.setItem('somajam_rooms', JSON.stringify(resetRooms));
        }
      }
      localStorage.setItem('somajam_clean_version', DATA_CLEAN_VERSION);
    }
  } catch (e) {}

  // Master States with LocalStorage Cache
  const [rooms, setRooms] = useState(() => {
    try {
      const saved = localStorage.getItem('somajam_rooms');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed.map(normalizeRoom);
      }
    } catch (e) {}
    return initialRooms.map(normalizeRoom);
  });

  const [guests, setGuests] = useState(() => {
    try {
      const saved = localStorage.getItem('somajam_guests');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {}
    return initialGuests;
  });

  const [bookings, setBookings] = useState(() => {
    try {
      const saved = localStorage.getItem('somajam_bookings');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {}
    return initialBookings;
  });

  const [documents, setDocuments] = useState(() => {
    try {
      const saved = localStorage.getItem('somajam_documents');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {}
    return initialDocuments;
  });

  const [staffList, setStaffList] = useState(initialStaff);

  // Expense Payers & Expenses Persistent State
  const [expensePayers, setExpensePayers] = useState(() => {
    try {
      const saved = localStorage.getItem('somajam_expense_payers');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {}
    return initialExpensePayers;
  });

  const [expenses, setExpenses] = useState(() => {
    try {
      const saved = localStorage.getItem('somajam_expenses');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {}
    return initialExpenses;
  });

  // Toast Notification State
  const [toast, setToast] = useState(null);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 4000);
  };

  // --- INITIAL SUPABASE DATA FETCH ---
  useEffect(() => {
    const fetchSupabaseData = async () => {
      try {
        // Fetch Rooms
        const { data: roomsData, error: roomsErr } = await supabase.from('rooms').select('*');
        if (!roomsErr && roomsData && roomsData.length > 0) {
          setRooms(roomsData.map(normalizeRoom));
        }

        // Fetch Guests
        const { data: guestsData, error: guestsErr } = await supabase.from('guests').select('*');
        if (!guestsErr && guestsData && guestsData.length > 0) {
          setGuests(guestsData);
        }

        // Fetch Bookings
        const { data: bookingsData, error: bookingsErr } = await supabase.from('bookings').select('*');
        if (!bookingsErr && bookingsData && bookingsData.length > 0) {
          setBookings(bookingsData);
        }

        // Fetch Documents
        const { data: docsData, error: docsErr } = await supabase.from('documents').select('*');
        if (!docsErr && docsData && docsData.length > 0) {
          setDocuments(docsData);
        }

        // Fetch Staff
        const { data: staffData, error: staffErr } = await supabase.from('staff_list').select('*');
        if (!staffErr && staffData && staffData.length > 0) {
          setStaffList(staffData);
        }

        // Fetch Expense Payers (Sync with Supabase if table exists and local cache is unpopulated)
        const hasLocalPayers = localStorage.getItem('somajam_expense_payers');
        if (!hasLocalPayers) {
          const { data: payersData, error: payersErr } = await supabase.from('expense_payers').select('*');
          if (!payersErr && payersData && payersData.length > 0) {
            setExpensePayers(payersData);
            try { localStorage.setItem('somajam_expense_payers', JSON.stringify(payersData)); } catch(e){}
          }
        }

        // Fetch Expenses
        const hasLocalExpenses = localStorage.getItem('somajam_expenses');
        if (!hasLocalExpenses) {
          const { data: expensesData, error: expensesErr } = await supabase.from('expenses').select('*');
          if (!expensesErr && expensesData && expensesData.length > 0) {
            setExpenses(expensesData);
            try { localStorage.setItem('somajam_expenses', JSON.stringify(expensesData)); } catch(e){}
          }
        }

        // Fetch Booking Audit Logs
        const { data: auditData, error: auditErr } = await supabase
          .from('booking_audit_logs')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(200);
        if (!auditErr && auditData && auditData.length > 0) {
          setAuditLogs(auditData);
          try { localStorage.setItem('somajam_audit_logs', JSON.stringify(auditData)); } catch(e){}
        }
      } catch (err) {
        console.warn('Supabase fetch notice: using in-memory state fallback until schema is executed.');
      }
    };

    fetchSupabaseData();
  }, []);

  // Role Switcher Handler
  const toggleRole = () => {
    const newRole = currentRole === 'admin' ? 'staff' : 'admin';
    setCurrentRole(newRole);
    setCurrentUser(
      newRole === 'admin'
        ? { id: 'stf-001', name: 'Somajam Manager (Owner)', role: 'admin' }
        : { id: 'stf-002', name: 'Front Desk Staff', role: 'staff' }
    );
    showToast(`Switched view to ${newRole.toUpperCase()} mode`, 'info');
  };

  // --- ROOM HANDLERS ---
  const addRoom = async (roomData) => {
    const weekday = Number(roomData.weekday_rate ?? roomData.price_per_night ?? 3500);
    const weekend = Number(roomData.weekend_rate ?? Math.round(weekday * 1.25));
    const newRoom = {
      id: `room-${Date.now()}`,
      status: 'Available',
      ...roomData,
      weekday_rate: weekday,
      weekend_rate: weekend,
      price_per_night: weekday,
      facilities: Array.isArray(roomData.facilities) ? roomData.facilities : [],
    };
    setRooms((prev) => {
      const updated = [newRoom, ...prev];
      try { localStorage.setItem('somajam_rooms', JSON.stringify(updated)); } catch(e){}
      return updated;
    });

    try {
      await supabase.from('rooms').insert([newRoom]);
    } catch (e) {
      console.error(e);
    }
    showToast(`Room ${newRoom.room_number} created successfully`);
    return newRoom;
  };

  const updateRoom = async (roomId, updatedData) => {
    let updatedName = '';
    setRooms((prev) => {
      const updated = prev.map((r) => {
        if (r.id === roomId) {
          const weekday = Number(updatedData.weekday_rate ?? r.weekday_rate ?? r.price_per_night ?? 3500);
          const weekend = Number(updatedData.weekend_rate ?? r.weekend_rate ?? 4500);
          updatedName = updatedData.room_number || r.room_number;
          return {
            ...r,
            ...updatedData,
            weekday_rate: weekday,
            weekend_rate: weekend,
            price_per_night: weekday,
            facilities: Array.isArray(updatedData.facilities) ? updatedData.facilities : (r.facilities || []),
          };
        }
        return r;
      });
      try { localStorage.setItem('somajam_rooms', JSON.stringify(updated)); } catch(e){}
      return updated;
    });

    try {
      await supabase.from('rooms').update({
        room_number: updatedData.room_number,
        room_type: updatedData.room_type,
        capacity: Number(updatedData.capacity),
        facilities: updatedData.facilities,
        weekday_rate: Number(updatedData.weekday_rate),
        weekend_rate: Number(updatedData.weekend_rate),
        price_per_night: Number(updatedData.weekday_rate || updatedData.price_per_night),
      }).eq('id', roomId);
    } catch (e) {
      console.warn('Supabase update room notice:', e);
    }

    showToast(`Room ${updatedName} updated successfully!`);
    return true;
  };

  const updateRoomStatus = async (roomId, newStatus) => {
    setRooms((prev) =>
      prev.map((r) => (r.id === roomId ? { ...r, status: newStatus } : r))
    );

    try {
      await supabase.from('rooms').update({ status: newStatus }).eq('id', roomId);
    } catch (e) {
      console.error(e);
    }
    showToast(`Room status updated to ${newStatus}`);
  };

  // --- GUEST HANDLERS ---
  const addGuest = async (guestData) => {
    const {
      room_id,
      room_ids,
      check_in_date,
      check_out_date,
      num_guests,
      booking_status,
      ...coreGuestData
    } = guestData;

    // Check if guest with matching phone already exists (phone is the unique identifier)
    const cleanPhone = coreGuestData.phone ? coreGuestData.phone.replace(/\D/g, '') : '';
    const cleanName = coreGuestData.full_name ? coreGuestData.full_name.trim().toLowerCase() : '';

    const existing = guests.find((g) => {
      const gPhone = g.phone ? g.phone.replace(/\D/g, '') : '';
      const gName = g.full_name ? g.full_name.trim().toLowerCase() : '';

      // If both records provide valid phone numbers, phone is the definitive unique identifier
      if (cleanPhone && gPhone && cleanPhone.length >= 7 && gPhone.length >= 7) {
        return cleanPhone === gPhone;
      }

      // If phone is missing on either record, fall back to matching by exact full name
      if ((!cleanPhone || cleanPhone.length < 7) || (!gPhone || gPhone.length < 7)) {
        return Boolean(cleanName && gName && cleanName === gName);
      }

      return false;
    });

    if (existing) {
      // Merge any newly provided info with existing record
      const mergedGuest = {
        ...existing,
        ...Object.fromEntries(
          Object.entries(coreGuestData).filter(
            ([_, v]) => v !== undefined && v !== '' && v !== 'Pending' && v !== 'Pending Check-In'
          )
        ),
      };

      setGuests((prev) => {
        const updated = prev.map((g) => (g.id === existing.id ? mergedGuest : g));
        try { localStorage.setItem('somajam_guests', JSON.stringify(updated)); } catch(e){}
        return updated;
      });

      // Background Supabase sync
      supabase.from('guests').update(mergedGuest).eq('id', existing.id).then().catch(() => {});

      return mergedGuest;
    }

    const newGuest = {
      id: `gst-${Date.now()}`,
      created_at: new Date().toISOString(),
      ...coreGuestData,
    };

    setGuests((prev) => {
      const updated = [newGuest, ...prev];
      try { localStorage.setItem('somajam_guests', JSON.stringify(updated)); } catch(e){}
      return updated;
    });

    // Background Supabase sync
    supabase.from('guests').insert([newGuest]).then().catch((e) => {
      console.warn('Supabase guest insert notice:', e);
    });

    return newGuest;
  };

  const updateGuest = async (guestId, updatedData) => {
    setGuests((prev) => {
      const updated = prev.map((g) => (g.id === guestId ? { ...g, ...updatedData } : g));
      try { localStorage.setItem('somajam_guests', JSON.stringify(updated)); } catch(e){}
      return updated;
    });

    try {
      await supabase.from('guests').update(updatedData).eq('id', guestId);
    } catch (e) {
      console.error(e);
    }
    showToast('Guest details updated successfully');
  };

  const deleteGuest = async (guestId) => {
    if (currentRole !== 'admin') {
      showToast('Permission Denied: Only Admin can delete guest records', 'error');
      return;
    }
    setGuests((prev) => {
      const updated = prev.filter((g) => g.id !== guestId);
      try { localStorage.setItem('somajam_guests', JSON.stringify(updated)); } catch(e){}
      return updated;
    });
    setBookings((prev) => {
      const updated = prev.filter((b) => b.guest_id !== guestId);
      try { localStorage.setItem('somajam_bookings', JSON.stringify(updated)); } catch(e){}
      return updated;
    });

    try {
      await supabase.from('guests').delete().eq('id', guestId);
    } catch (e) {
      console.error(e);
    }
    showToast('Guest record removed from database', 'info');
  };

  // --- BOOKING HANDLERS & CHECK-IN / CHECK-OUT (SUPPORTS MULTI-ROOM & SAME-NAME BOOKINGS) ---
  const addBooking = async (bookingData) => {
    // Supports single room (room_id) or multiple rooms (room_ids)
    const roomIds = Array.isArray(bookingData.room_ids) && bookingData.room_ids.length > 0
      ? bookingData.room_ids
      : bookingData.room_id
      ? [bookingData.room_id]
      : [];

    if (roomIds.length === 0) {
      showToast('Please select at least one cottage room!', 'warning');
      return false;
    }

    const { check_in_date, check_out_date, guest_id, guest_name, booking_status } = bookingData;

    // Validate dates
    if (new Date(check_out_date) <= new Date(check_in_date)) {
      showToast('Check-out date must be strictly after Check-in date!', 'error');
      return false;
    }

    // Check overlaps for each requested room
    const conflictingRooms = [];
    for (const rId of roomIds) {
      const room = rooms.find((r) => r.id === rId);
      const roomLabel = room ? `Room ${room.room_number}` : 'Selected Cottage';
      const isOverlapping = bookings.some((b) => {
        if (b.room_id !== rId || b.status === 'Cancelled' || b.status === 'Checked Out') {
          return false;
        }
        return (
          new Date(check_in_date) < new Date(b.check_out_date) &&
          new Date(check_out_date) > new Date(b.check_in_date)
        );
      });
      if (isOverlapping) {
        conflictingRooms.push(roomLabel);
      }
    }

    if (conflictingRooms.length > 0) {
      showToast(
        `Double Booking Blocked: ${conflictingRooms.join(', ')} already reserved for selected dates!`,
        'error'
      );
      return false;
    }

    const guest = guests.find((g) => g.id === guest_id);
    const resolvedGuestName = guest_name || (guest ? guest.full_name : 'Guest');
    const finalStatus = booking_status || 'Confirmed';

    const createdBookings = [];
    const updatedRooms = [...rooms];

    roomIds.forEach((rId, idx) => {
      const room = rooms.find((r) => r.id === rId);
      const suffix = roomIds.length > 1 ? `-${String.fromCharCode(65 + idx)}` : '';
      const refNum = `SJM-2026-${String(bookings.length + 1 + idx).padStart(3, '0')}${suffix}`;
      const stayPricing = calculateStayRate(room, check_in_date, check_out_date);

      const newBooking = {
        id: `bkg-${Date.now()}-${idx}`,
        booking_ref: refNum,
        guest_id: guest_id,
        guest_name: resolvedGuestName,
        room_id: rId,
        room_number: room ? room.room_number : 'Room',
        check_in_date: check_in_date,
        check_out_date: check_out_date,
        num_guests: Number(bookingData.num_guests) || (room ? room.capacity : 2),
        status: finalStatus,
        notes: bookingData.notes || '',
        weekday_nights: stayPricing.weekdayNights,
        weekend_nights: stayPricing.weekendNights,
        total_nights: stayPricing.totalNights,
        weekday_rate: stayPricing.weekdayRate,
        weekend_rate: stayPricing.weekendRate,
        total_amount: Number(bookingData.total_amount) || stayPricing.totalAmount,
        created_at: new Date().toISOString(),
      };

      createdBookings.push(newBooking);

      if (finalStatus === 'Checked In') {
        const roomIdx = updatedRooms.findIndex((r) => r.id === rId);
        if (roomIdx !== -1) {
          updatedRooms[roomIdx] = { ...updatedRooms[roomIdx], status: 'Occupied' };
        }
      }
    });

    // Update state immediately
    setBookings((prev) => {
      const updated = [...createdBookings, ...prev];
      try { localStorage.setItem('somajam_bookings', JSON.stringify(updated)); } catch(e){}
      return updated;
    });

    if (finalStatus === 'Checked In') {
      setRooms(updatedRooms);
      try { localStorage.setItem('somajam_rooms', JSON.stringify(updatedRooms)); } catch(e){}
    }

    // Background sync with Supabase and log activity
    createdBookings.forEach((bkg) => {
      supabase.from('bookings').insert([bkg]).then().catch((err) => {
        console.warn('Background Supabase booking sync failed (using local store):', err);
      });

      // Log booking creation audit trail
      logBookingAction(bkg.id, bkg.booking_ref, 'CREATED', {
        guest_name: bkg.guest_name,
        room_number: bkg.room_number,
        check_in_date: bkg.check_in_date,
        check_out_date: bkg.check_out_date,
        num_guests: bkg.num_guests,
        total_amount: bkg.total_amount,
        status: bkg.status,
      });
    });

    if (finalStatus === 'Checked In') {
      roomIds.forEach((rId) => {
        supabase.from('rooms').update({ status: 'Occupied' }).eq('id', rId).then().catch(() => {});
      });
      showToast(
        `Checked in ${resolvedGuestName}! ${roomIds.length > 1 ? `${roomIds.length} Cottages` : 'Cottage'} marked OCCUPIED.`,
        'success'
      );
    } else {
      showToast(
        `Booking confirmed for ${resolvedGuestName} (${roomIds.length > 1 ? `${roomIds.length} Cottages` : '1 Cottage'})!`,
        'success'
      );
    }

    return true;
  };

  const processCheckIn = async (bookingId, staffNotes = '') => {
    const booking = bookings.find((b) => b.id === bookingId);
    if (!booking) return;

    const guestDocs = documents.filter((d) => d.guest_id === booking.guest_id);
    if (guestDocs.length === 0) {
      showToast(
        'Warning: Guest has no uploaded ID documents attached!',
        'warning'
      );
    }

    const updatedNotes = staffNotes
      ? `${booking.notes || ''} | Check-in Notes: ${staffNotes}`
      : booking.notes;

    setBookings((prev) => {
      const updated = prev.map((b) =>
        b.id === bookingId ? { ...b, status: 'Checked In', notes: updatedNotes } : b
      );
      try { localStorage.setItem('somajam_bookings', JSON.stringify(updated)); } catch(e){}
      return updated;
    });

    setRooms((prev) => {
      const updated = prev.map((r) =>
        r.id === booking.room_id ? { ...r, status: 'Occupied' } : r
      );
      try { localStorage.setItem('somajam_rooms', JSON.stringify(updated)); } catch(e){}
      return updated;
    });

    // Record check-in audit event
    logBookingAction(bookingId, booking.booking_ref, 'CHECKED_IN', {
      guest_name: booking.guest_name,
      room_number: booking.room_number,
      staff_notes: staffNotes,
    });

    try {
      supabase.from('bookings').update({ status: 'Checked In', notes: updatedNotes }).eq('id', bookingId).then();
      supabase.from('rooms').update({ status: 'Occupied' }).eq('id', booking.room_id).then();
    } catch (e) {
      console.error(e);
    }

    showToast(`Checked In successfully! Room marked OCCUPIED.`);
  };

  const processCheckOut = async (bookingId, staffNotes = '') => {
    const booking = bookings.find((b) => b.id === bookingId);
    if (!booking) return;

    const updatedNotes = staffNotes
      ? `${booking.notes || ''} | Check-out Notes: ${staffNotes}`
      : booking.notes;

    setBookings((prev) => {
      const updated = prev.map((b) =>
        b.id === bookingId ? { ...b, status: 'Checked Out', notes: updatedNotes } : b
      );
      try { localStorage.setItem('somajam_bookings', JSON.stringify(updated)); } catch(e){}
      return updated;
    });

    setRooms((prev) => {
      const updated = prev.map((r) =>
        r.id === booking.room_id ? { ...r, status: 'Available' } : r
      );
      try { localStorage.setItem('somajam_rooms', JSON.stringify(updated)); } catch(e){}
      return updated;
    });

    // Record check-out audit event
    logBookingAction(bookingId, booking.booking_ref, 'CHECKED_OUT', {
      guest_name: booking.guest_name,
      room_number: booking.room_number,
      staff_notes: staffNotes,
    });

    try {
      supabase.from('bookings').update({ status: 'Checked Out', notes: updatedNotes }).eq('id', bookingId).then();
      supabase.from('rooms').update({ status: 'Available' }).eq('id', booking.room_id).then();
    } catch (e) {
      console.error(e);
    }

    showToast(`Checked Out successfully! Room marked AVAILABLE.`);
  };

  const cancelBooking = async (bookingId) => {
    const target = bookings.find((b) => b.id === bookingId);
    setBookings((prev) => {
      const updated = prev.map((b) => (b.id === bookingId ? { ...b, status: 'Cancelled' } : b));
      try { localStorage.setItem('somajam_bookings', JSON.stringify(updated)); } catch(e){}
      return updated;
    });

    if (target && target.status === 'Checked In') {
      setRooms((prev) => {
        const updated = prev.map((r) => (r.id === target.room_id ? { ...r, status: 'Available' } : r));
        try { localStorage.setItem('somajam_rooms', JSON.stringify(updated)); } catch(e){}
        return updated;
      });
      supabase.from('rooms').update({ status: 'Available' }).eq('id', target.room_id).then().catch(() => {});
    }

    // Record cancellation audit event
    logBookingAction(bookingId, target ? target.booking_ref : bookingId, 'CANCELLED', {
      guest_name: target ? target.guest_name : '',
      room_number: target ? target.room_number : '',
      cancelled_by: currentUser?.name || 'Staff',
    });

    try {
      supabase.from('bookings').update({ status: 'Cancelled' }).eq('id', bookingId).then();
    } catch (e) {
      console.error(e);
    }
    showToast('Booking cancelled', 'info');
  };

  // --- DOCUMENT HANDLERS ---
  const addDocument = async (docData) => {
    const newDoc = {
      id: `doc-${Date.now()}-${Math.random()}`,
      uploaded_at: new Date().toISOString(),
      uploaded_by: currentUser.name,
      ...docData,
    };

    setDocuments((prev) => [newDoc, ...prev]);

    try {
      await supabase.from('documents').insert([newDoc]);
    } catch (e) {
      console.error(e);
    }
    showToast(`Document ${newDoc.file_name} attached successfully`);
  };

  const deleteDocument = async (docId) => {
    setDocuments((prev) => prev.filter((d) => d.id !== docId));

    try {
      await supabase.from('documents').delete().eq('id', docId);
    } catch (e) {
      console.error(e);
    }
    showToast('Document deleted', 'info');
  };

  const purgeMonthStorage = async (year, month) => {
    if (currentRole !== 'admin') {
      showToast('Permission Denied: Only Admin can purge cloud storage', 'error');
      return { success: false, message: 'Unauthorized' };
    }

    const monthStr = String(month).padStart(2, '0');
    const monthPrefix = `${year}-${monthStr}`;

    // Target bookings and guests for this month
    const monthlyBookings = bookings.filter((b) => b.check_in_date && b.check_in_date.startsWith(monthPrefix));
    const monthlyGuestIds = new Set(monthlyBookings.map((b) => b.guest_id));

    // Find documents uploaded in that month OR belonging to those guests
    const targetDocs = documents.filter((d) => {
      const matchGuest = monthlyGuestIds.has(d.guest_id);
      const matchUploadDate = d.uploaded_at && d.uploaded_at.startsWith(monthPrefix);
      return matchGuest || matchUploadDate;
    });

    if (targetDocs.length === 0) {
      showToast('No documents found for this month to purge.', 'info');
      return { success: true, count: 0 };
    }

    for (const doc of targetDocs) {
      if (doc.file_path && !doc.file_path.startsWith('http')) {
        try {
          await supabase.storage.from('guest-documents').remove([doc.file_path]);
        } catch (e) {
          console.warn('Storage purge error:', e);
        }
      }
    }

    const targetDocIds = new Set(targetDocs.map((d) => d.id));
    setDocuments((prev) => prev.filter((d) => !targetDocIds.has(d.id)));

    try {
      await supabase.from('documents').delete().in('id', Array.from(targetDocIds));
    } catch (e) {
      console.warn('DB delete error:', e);
    }

    showToast(`Storage Reclaimed: ${targetDocs.length} heavy document files purged. Local archive intact!`, 'success');
    return { success: true, count: targetDocs.length };
  };

  // --- STAFF HANDLERS ---
  const addStaff = async (staffData) => {
    const newStaff = {
      id: `stf-${Date.now()}`,
      status: 'Active',
      created_at: new Date().toISOString(),
      ...staffData,
    };
    setStaffList((prev) => [newStaff, ...prev]);

    try {
      await supabase.from('staff_list').insert([newStaff]);
    } catch (e) {
      console.error(e);
    }
    showToast(`Staff account for ${newStaff.full_name} created`);
  };

  const [activeExpenseUser, setActiveExpenseUser] = useState(() => {
    return initialExpensePayers[1] || initialExpensePayers[0] || null;
  });

  // --- EXPENSE PAYER HANDLERS ---
  const addExpensePayer = async (payerData) => {
    const newPayer = {
      id: `pyr-${Date.now()}`,
      created_at: new Date().toISOString(),
      ...payerData,
    };

    setExpensePayers((prev) => {
      const updated = [...prev, newPayer];
      try { localStorage.setItem('somajam_expense_payers', JSON.stringify(updated)); } catch(e){}
      return updated;
    });

    try {
      await supabase.from('expense_payers').insert([newPayer]);
    } catch (e) {
      console.error(e);
    }
    showToast(`Expense account for ${newPayer.name} added`);
    return newPayer;
  };

  const deleteExpensePayer = async (payerId) => {
    const linkedExpenses = expenses.filter((e) => e && e.payer_id === payerId);
    if (linkedExpenses.length > 0) {
      const payerObj = expensePayers.find((p) => p.id === payerId);
      showToast(
        `Cannot Delete User: ${linkedExpenses.length} transaction(s) are recorded under "${payerObj ? payerObj.name : 'this user'}". Delete those transactions first!`,
        'error'
      );
      return false;
    }

    setExpensePayers((prev) => {
      const updated = prev.filter((p) => p.id !== payerId);
      try { localStorage.setItem('somajam_expense_payers', JSON.stringify(updated)); } catch(e){}
      return updated;
    });

    try {
      await supabase.from('expense_payers').delete().eq('id', payerId);
    } catch (e) {
      console.error(e);
    }
    showToast('Expense account removed', 'info');
    return true;
  };

  // --- EXPENSE HANDLERS ---
  const addExpense = async (expenseData) => {
    const newExpense = {
      id: `exp-${Date.now()}`,
      created_at: new Date().toISOString(),
      ...expenseData,
    };

    setExpenses((prev) => {
      const updated = [newExpense, ...prev];
      try { localStorage.setItem('somajam_expenses', JSON.stringify(updated)); } catch(e){}
      return updated;
    });

    try {
      await supabase.from('expenses').insert([newExpense]);
    } catch (e) {
      console.error(e);
    }
    showToast(`Expense ₹${newExpense.amount} logged for ${newExpense.payer_name}`);
    return newExpense;
  };

  const updateExpense = async (expenseId, updatedData) => {
    setExpenses((prev) => {
      const updated = prev.map((e) => (e.id === expenseId ? { ...e, ...updatedData } : e));
      try { localStorage.setItem('somajam_expenses', JSON.stringify(updated)); } catch(e){}
      return updated;
    });

    try {
      await supabase.from('expenses').update(updatedData).eq('id', expenseId);
    } catch (e) {
      console.error(e);
    }
    showToast('Expense entry updated');
  };

  const deleteExpense = async (expenseId, actingUser = null) => {
    const targetExpense = expenses.find((e) => e.id === expenseId);
    if (!targetExpense) return false;

    // Verify user authorization: only the user recorded on the expense can delete it
    const userToVerify = actingUser || activeExpenseUser;
    if (
      userToVerify &&
      userToVerify.id !== targetExpense.payer_id &&
      userToVerify.name !== targetExpense.payer_name
    ) {
      showToast(
        `Permission Blocked: Only ${targetExpense.payer_name} can delete transactions recorded against their name.`,
        'error'
      );
      return false;
    }

    setExpenses((prev) => {
      const updated = prev.filter((e) => e.id !== expenseId);
      try { localStorage.setItem('somajam_expenses', JSON.stringify(updated)); } catch(e){}
      return updated;
    });

    try {
      await supabase.from('expenses').delete().eq('id', expenseId);
    } catch (e) {
      console.error(e);
    }
    showToast('Expense entry removed', 'info');
    return true;
  };

  const toggleReimbursementStatus = async (expenseId) => {
    let nextStatus = 'Settled';
    setExpenses((prev) => {
      const updated = prev.map((e) => {
        if (e.id === expenseId) {
          nextStatus = e.reimbursement_status === 'Pending Reimbursement' ? 'Settled' : 'Pending Reimbursement';
          return { ...e, reimbursement_status: nextStatus };
        }
        return e;
      });
      try { localStorage.setItem('somajam_expenses', JSON.stringify(updated)); } catch(e){}
      return updated;
    });

    try {
      await supabase.from('expenses').update({ reimbursement_status: nextStatus }).eq('id', expenseId);
    } catch (e) {
      console.error(e);
    }
    showToast(`Expense marked as ${nextStatus}`);
  };

  return (
    <AppContext.Provider
      value={{
        isAuthenticated,
        login,
        logout,
        currentRole,
        currentUser,
        toggleRole: () => {},
        rooms,
        addRoom,
        updateRoom,
        updateRoomStatus,
        guests,
        addGuest,
        updateGuest,
        deleteGuest,
        bookings,
        addBooking,
        processCheckIn,
        processCheckOut,
        cancelBooking,
        documents,
        addDocument,
        deleteDocument,
        purgeMonthStorage,
        staffList,
        addStaff,
        expensePayers,
        addExpensePayer,
        deleteExpensePayer,
        expenses,
        addExpense,
        updateExpense,
        deleteExpense,
        toggleReimbursementStatus,
        activeExpenseUser,
        setActiveExpenseUser,
        toast,
        showToast,
        auditLogs,
        logBookingAction,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => useContext(AppContext);

