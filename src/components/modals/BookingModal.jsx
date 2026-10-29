import React, { useState, useEffect, useMemo } from 'react';
import { Modal } from '../common/Modal';
import { useApp } from '../../context/AppContext';
import { DocumentViewerModal } from './DocumentViewerModal';
import {
  Calendar,
  User,
  BedDouble,
  FileText,
  Upload,
  Eye,
  Trash2,
  Paperclip,
  Zap,
  Phone,
  UserPlus,
  CreditCard,
  Globe,
  MapPin,
  Mail,
  CheckCircle2,
  LogIn,
  AlertCircle,
  Users,
  Check,
  Sun,
  Moon,
  Sparkles,
} from 'lucide-react';
import { calculateMultiRoomStayRate } from '../../utils/pricing';

export const BookingModal = ({ isOpen, onClose }) => {
  const { guests, rooms, bookings, documents, addGuest, addBooking, addDocument, showToast } = useApp();

  const todayStr = new Date().toISOString().split('T')[0];
  const tomorrowStr = new Date(Date.now() + 86400000).toISOString().split('T')[0];

  // Tab Mode: 'quick' (Name & Mobile only) | 'detailed' (Detailed Booking & Instant Check-In)
  const [bookingTab, setBookingTab] = useState('quick');

  // Detailed Tab Guest Source: 'new' (Walk-in guest) | 'existing' (Registered guest)
  const [guestSource, setGuestSource] = useState('new');

  // Quick Booking State
  const [quickName, setQuickName] = useState('');
  const [quickPhone, setQuickPhone] = useState('');

  // Detailed Booking Guest State
  const [detailedGuest, setDetailedGuest] = useState({
    full_name: '',
    phone: '',
    email: '',
    address: '',
    nationality: 'Indian',
    id_document_type: 'Aadhaar',
    id_document_number: '',
  });

  // Existing Guest Selection
  const [selectedGuestId, setSelectedGuestId] = useState(guests[0]?.id || '');

  // Dates & Reservation State
  const [checkInDate, setCheckInDate] = useState(todayStr);
  const [checkOutDate, setCheckOutDate] = useState(tomorrowStr);
  const [numGuests, setNumGuests] = useState(2);
  const [initialStatus, setInitialStatus] = useState('Checked In'); // Default to Instant Check-In for Detailed mode
  const [notes, setNotes] = useState('');

  // Multi-room Selection State (array of room IDs)
  const [selectedRoomIds, setSelectedRoomIds] = useState([]);

  // Staged documents attached inside Booking modal
  const [stagedFiles, setStagedFiles] = useState([]);
  const [previewDoc, setPreviewDoc] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');

  // Auto-initialize default room when modal opens
  useEffect(() => {
    if (isOpen) {
      setErrorMsg('');
      if (rooms.length > 0 && selectedRoomIds.length === 0) {
        // Default to first available room if any, otherwise first room
        const firstAvail = rooms.find((r) => r.status === 'Available') || rooms[0];
        setSelectedRoomIds([firstAvail.id]);
      }
      if (!selectedGuestId && guests.length > 0) {
        setSelectedGuestId(guests[0].id);
      }
    }
  }, [isOpen, rooms, guests]);

  // Compute room availability for the currently selected dates
  const roomAvailability = useMemo(() => {
    const map = {};
    rooms.forEach((r) => {
      const conflictingBooking = bookings.find((b) => {
        if (b.room_id !== r.id || b.status === 'Cancelled' || b.status === 'Checked Out') {
          return false;
        }
        return (
          new Date(checkInDate) < new Date(b.check_out_date) &&
          new Date(checkOutDate) > new Date(b.check_in_date)
        );
      });
      map[r.id] = {
        isAvailable: !conflictingBooking,
        conflictingBooking: conflictingBooking || null,
      };
    });
    return map;
  }, [rooms, bookings, checkInDate, checkOutDate]);

  // Selected rooms objects
  const selectedRoomsList = useMemo(() => {
    return rooms.filter((r) => selectedRoomIds.includes(r.id));
  }, [rooms, selectedRoomIds]);

  // Multi-room stay rate calculation based on weekday vs weekend nights
  const stayCalculation = useMemo(() => {
    return calculateMultiRoomStayRate(selectedRoomsList, checkInDate, checkOutDate);
  }, [selectedRoomsList, checkInDate, checkOutDate]);

  // Check if phone or name matches an existing guest in database (in Quick or Detailed mode)
  const matchingExistingGuest = useMemo(() => {
    const targetPhone = bookingTab === 'quick' ? quickPhone : (guestSource === 'new' ? detailedGuest.phone : '');
    const targetName = bookingTab === 'quick' ? quickName : (guestSource === 'new' ? detailedGuest.full_name : '');
    const cleanP = (targetPhone || '').replace(/\D/g, '');
    const cleanN = (targetName || '').trim().toLowerCase();
    if (cleanP.length >= 7) {
      return guests.find((g) => g.phone && g.phone.replace(/\D/g, '').includes(cleanP));
    }
    if (cleanN.length >= 3 && cleanP.length === 0) {
      return guests.find((g) => g.full_name && g.full_name.trim().toLowerCase() === cleanN);
    }
    return null;
  }, [bookingTab, guestSource, quickPhone, quickName, detailedGuest.phone, detailedGuest.full_name, guests]);

  // Number of existing bookings for the matched repeat guest
  const existingBookingsCount = useMemo(() => {
    if (!matchingExistingGuest) return 0;
    return bookings.filter((b) => b && b.guest_id === matchingExistingGuest.id).length;
  }, [matchingExistingGuest, bookings]);

  // Auto-populate guest name if empty when phone matches an existing guest
  useEffect(() => {
    if (matchingExistingGuest && !quickName && matchingExistingGuest.full_name) {
      setQuickName(matchingExistingGuest.full_name);
    }
  }, [matchingExistingGuest, quickName]);

  // Toggle room selection for multi-room booking
  const toggleRoomSelection = (roomId) => {
    setSelectedRoomIds((prev) => {
      if (prev.includes(roomId)) {
        if (prev.length === 1) {
          showToast('At least one room must remain selected', 'warning');
          return prev;
        }
        return prev.filter((id) => id !== roomId);
      } else {
        return [...prev, roomId];
      }
    });
  };

  // Existing documents for selected guest
  const existingGuestDocs = guestSource === 'existing' ? documents.filter((d) => d.guest_id === selectedGuestId) : [];

  const handleMultipleFileChange = (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;

    const validFiles = [];
    files.forEach((file) => {
      if (file.size > 5 * 1024 * 1024) {
        showToast(`File "${file.name}" exceeds 5 MB limit!`, 'error');
      } else {
        const previewUrl = URL.createObjectURL(file);
        validFiles.push({
          id: `staged-bkg-${Date.now()}-${Math.random()}`,
          file_name: file.name,
          file_size: `${(file.size / (1024 * 1024)).toFixed(1)} MB`,
          file_type: file.type || 'image/jpeg',
          preview_url: previewUrl,
          rawFile: file,
        });
      }
    });

    if (validFiles.length > 0) {
      setStagedFiles((prev) => [...prev, ...validFiles]);
      showToast(`Attached ${validFiles.length} photo/file(s) to booking`, 'info');
    }
  };

  const removeStagedFile = (fileId) => {
    setStagedFiles((prev) => prev.filter((f) => f.id !== fileId));
    showToast('Attached file removed', 'info');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (selectedRoomIds.length === 0) {
      const msg = 'Please select at least one cottage room!';
      setErrorMsg(msg);
      showToast(msg, 'warning');
      return;
    }

    if (new Date(checkOutDate) <= new Date(checkInDate)) {
      const msg = 'Check-out date must be strictly after Check-in date!';
      setErrorMsg(msg);
      showToast(msg, 'error');
      return;
    }

    let targetGuestId = '';
    let targetGuestName = '';

    if (bookingTab === 'quick') {
      // --- TAB 1: QUICK BOOKING ---
      if (!quickName.trim() || !quickPhone.trim()) {
        const msg = 'Please enter both Guest Name and Mobile Number!';
        setErrorMsg(msg);
        showToast(msg, 'warning');
        return;
      }

      // Automatically links to existing guest if phone matches, or creates new
      const targetGuest = await addGuest({
        full_name: quickName.trim(),
        phone: quickPhone.trim(),
        nationality: 'Indian',
        id_document_type: 'Pending',
        id_document_number: 'Pending Check-In',
        notes: 'Quick reservation. ID verification pending.',
      });

      if (targetGuest) {
        targetGuestId = targetGuest.id;
        targetGuestName = targetGuest.full_name;
      }
    } else {
      // --- TAB 2: DETAILED BOOKING & INSTANT CHECK-IN ---
      if (guestSource === 'new') {
        if (!detailedGuest.full_name.trim() || !detailedGuest.phone.trim()) {
          const msg = 'Please enter Guest Full Name and Phone Number!';
          setErrorMsg(msg);
          showToast(msg, 'warning');
          return;
        }

        const targetGuest = await addGuest({
          full_name: detailedGuest.full_name.trim(),
          phone: detailedGuest.phone.trim(),
          email: detailedGuest.email,
          address: detailedGuest.address,
          nationality: detailedGuest.nationality || 'Indian',
          id_document_type: detailedGuest.id_document_type || 'Aadhaar',
          id_document_number: detailedGuest.id_document_number || 'Provided',
          notes: notes,
        });

        if (targetGuest) {
          targetGuestId = targetGuest.id;
          targetGuestName = targetGuest.full_name;
        }
      } else {
        if (!selectedGuestId) {
          const msg = 'Please select an existing guest record!';
          setErrorMsg(msg);
          showToast(msg, 'warning');
          return;
        }
        targetGuestId = selectedGuestId;
        const existing = guests.find((g) => g.id === selectedGuestId);
        targetGuestName = existing ? existing.full_name : 'Guest';
      }
    }

    const bookingStatusToUse = bookingTab === 'quick' ? 'Confirmed' : initialStatus;

    // Multi-room booking creation
    const success = await addBooking({
      guest_id: targetGuestId,
      guest_name: targetGuestName,
      room_ids: selectedRoomIds,
      check_in_date: checkInDate,
      check_out_date: checkOutDate,
      num_guests: parseInt(numGuests, 10),
      booking_status: bookingStatusToUse,
      notes: notes,
      total_amount: stayCalculation.totalAmount,
    });

    if (!success) {
      setErrorMsg('Double Booking Blocked: One or more selected Cottages are already reserved for these dates!');
      return;
    }

    // Attach any staged ID proof photos to this guest record
    if (targetGuestId && stagedFiles.length > 0) {
      stagedFiles.forEach((stg) => {
        addDocument({
          guest_id: targetGuestId,
          guest_name: targetGuestName,
          file_name: stg.file_name,
          file_path: `guest-documents/${targetGuestId}/${Date.now()}_${stg.file_name}`,
          file_type: stg.file_type,
          file_size: stg.file_size,
          preview_url: stg.preview_url,
          rawFile: stg.rawFile,
        });
      });
    }

    // Reset form states
    setQuickName('');
    setQuickPhone('');
    setDetailedGuest({
      full_name: '',
      phone: '',
      email: '',
      address: '',
      nationality: 'Indian',
      id_document_type: 'Aadhaar',
      id_document_number: '',
    });
    setStagedFiles([]);
    setNotes('');
    onClose();
  };

  return (
    <>
      <Modal isOpen={isOpen} onClose={onClose} title="New Cottage Reservation & Check-In">
        <form onSubmit={handleSubmit} className="space-y-4 max-h-[82vh] overflow-y-auto pr-1 text-slate-200">
          {/* Main Booking Mode Tabs */}
          <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
            <button
              type="button"
              onClick={() => {
                setBookingTab('quick');
                setErrorMsg('');
              }}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                bookingTab === 'quick'
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                  : 'bg-slate-900 text-slate-400 border border-slate-800 hover:bg-slate-800'
              }`}
            >
              <Zap className="w-3.5 h-3.5" />
              Quick Advance Booking (Name & Mobile)
            </button>
            <button
              type="button"
              onClick={() => {
                setBookingTab('detailed');
                setErrorMsg('');
              }}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                bookingTab === 'detailed'
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                  : 'bg-slate-900 text-slate-400 border border-slate-800 hover:bg-slate-800'
              }`}
            >
              <LogIn className="w-3.5 h-3.5" />
              Detailed Walk-In & Instant Check-In
            </button>
          </div>

          {/* TAB 1: QUICK ADVANCE BOOKING */}
          {bookingTab === 'quick' && (
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                  <User className="w-4 h-4 text-emerald-400" />
                  Primary Guest Contact
                </span>
                <span className="text-[10px] text-slate-400">
                  Multiple bookings & rooms under same name supported
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Guest Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Rajesh Kumar"
                    value={quickName}
                    onChange={(e) => setQuickName(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-900 border border-slate-800 rounded-xl text-slate-100 focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1">
                    <Phone className="w-3 h-3 text-slate-400" />
                    Mobile Number *
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="e.g. +91 98470 12345"
                    value={quickPhone}
                    onChange={(e) => setQuickPhone(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-900 border border-slate-800 rounded-xl text-slate-100 focus:outline-none focus:border-emerald-500 font-mono"
                  />
                </div>
              </div>

              {/* Match Indicator if same guest exists */}
              {matchingExistingGuest && (
                <div className="p-3 rounded-xl bg-teal-950/40 border border-teal-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs text-teal-300 animate-in fade-in">
                  <span className="flex items-center gap-1.5 font-medium">
                    <CheckCircle2 className="w-4 h-4 text-teal-400 shrink-0" />
                    <span>
                      Repeat Guest: <strong>{matchingExistingGuest.full_name}</strong> ({existingBookingsCount} existing booking{existingBookingsCount !== 1 ? 's' : ''})
                    </span>
                  </span>
                  <span className="text-[11px] text-emerald-400 font-mono bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/20 whitespace-nowrap">
                    Adding new booking to profile ✓
                  </span>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: DETAILED BOOKING & INSTANT CHECK-IN */}
          {bookingTab === 'detailed' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
                {/* Guest Source Switcher */}
                <div className="flex items-center gap-4 text-xs font-semibold border-b border-slate-800 pb-2">
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="radio"
                      name="guestSource"
                      value="new"
                      checked={guestSource === 'new'}
                      onChange={() => setGuestSource('new')}
                      className="accent-emerald-500"
                    />
                    <span>New Walk-in Guest</span>
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="radio"
                      name="guestSource"
                      value="existing"
                      checked={guestSource === 'existing'}
                      onChange={() => setGuestSource('existing')}
                      className="accent-emerald-500"
                    />
                    <span>Registered Guest ({guests.length})</span>
                  </label>
                </div>

                {guestSource === 'new' ? (
                  <div className="space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-slate-300 mb-1">
                          Guest Full Name *
                        </label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. Sarah Jenkins"
                          value={detailedGuest.full_name}
                          onChange={(e) => setDetailedGuest({ ...detailedGuest, full_name: e.target.value })}
                          className="w-full px-3 py-1.5 text-xs bg-slate-900 border border-slate-800 rounded-lg text-slate-100 focus:outline-none focus:border-emerald-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-300 mb-1">
                          Mobile Phone *
                        </label>
                        <input
                          type="tel"
                          required
                          placeholder="+91 / International"
                          value={detailedGuest.phone}
                          onChange={(e) => setDetailedGuest({ ...detailedGuest, phone: e.target.value })}
                          className="w-full px-3 py-1.5 text-xs bg-slate-900 border border-slate-800 rounded-lg text-slate-100 focus:outline-none focus:border-emerald-500 font-mono"
                        />
                      </div>
                    </div>

                    {matchingExistingGuest && (
                      <div className="p-2.5 rounded-xl bg-teal-950/40 border border-teal-500/30 flex items-center justify-between text-xs text-teal-300">
                        <span className="flex items-center gap-1.5 font-medium">
                          <CheckCircle2 className="w-3.5 h-3.5 text-teal-400 shrink-0" />
                          <span>Repeat Guest: <strong>{matchingExistingGuest.full_name}</strong> ({existingBookingsCount} existing booking{existingBookingsCount !== 1 ? 's' : ''})</span>
                        </span>
                        <span className="text-[11px] text-emerald-400 font-mono bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                          Auto-linking ✓
                        </span>
                      </div>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-slate-300 mb-1">
                          Nationality
                        </label>
                        <input
                          type="text"
                          value={detailedGuest.nationality}
                          onChange={(e) => setDetailedGuest({ ...detailedGuest, nationality: e.target.value })}
                          className="w-full px-3 py-1.5 text-xs bg-slate-900 border border-slate-800 rounded-lg text-slate-100 focus:outline-none focus:border-emerald-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-300 mb-1">
                          ID Proof Type
                        </label>
                        <select
                          value={detailedGuest.id_document_type}
                          onChange={(e) => setDetailedGuest({ ...detailedGuest, id_document_type: e.target.value })}
                          className="w-full px-3 py-1.5 text-xs bg-slate-900 border border-slate-800 rounded-lg text-slate-100 focus:outline-none focus:border-emerald-500"
                        >
                          <option value="Aadhaar">Aadhaar Card</option>
                          <option value="Passport">Passport</option>
                          <option value="Voter ID">Voter ID</option>
                          <option value="Driver License">Driver License</option>
                          <option value="Other">Other Government ID</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-300 mb-1">
                          ID Number
                        </label>
                        <input
                          type="text"
                          placeholder="ID / Passport Number"
                          value={detailedGuest.id_document_number}
                          onChange={(e) => setDetailedGuest({ ...detailedGuest, id_document_number: e.target.value })}
                          className="w-full px-3 py-1.5 text-xs bg-slate-900 border border-slate-800 rounded-lg text-slate-100 focus:outline-none focus:border-emerald-500 font-mono"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-slate-400" /> Address
                      </label>
                      <input
                        type="text"
                        placeholder="City, State, Country"
                        value={detailedGuest.address}
                        onChange={(e) => setDetailedGuest({ ...detailedGuest, address: e.target.value })}
                        className="w-full px-3 py-1.5 text-xs bg-slate-900 border border-slate-800 rounded-lg text-slate-100 focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                  </div>
                ) : (
                  /* Select Existing Guest Record */
                  <div className="pt-2 border-t border-slate-800">
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Select Guest Record *
                    </label>
                    <select
                      value={selectedGuestId}
                      onChange={(e) => setSelectedGuestId(e.target.value)}
                      className="w-full px-3 py-2 text-xs bg-slate-900 border border-slate-800 rounded-xl text-slate-100 focus:outline-none focus:border-emerald-500"
                    >
                      {guests.map((g) => (
                        <option key={g.id} value={g.id}>
                          {g.full_name} ({g.phone} - {g.id_document_number || 'Pending ID'})
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              {/* Attach ID Documents Section (Take photo or browse file) */}
              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-xs text-slate-200 flex items-center gap-1.5">
                    <Paperclip className="w-4 h-4 text-emerald-400" />
                    Attach ID Proof Photos / Documents
                  </h4>
                  <span className="text-[10px] text-slate-400 font-mono">
                    {stagedFiles.length + existingGuestDocs.length} File(s)
                  </span>
                </div>

                <div className="relative border border-dashed border-slate-700 hover:border-emerald-500 rounded-xl p-3 text-center bg-slate-900/60 transition-colors cursor-pointer">
                  <input
                    type="file"
                    multiple
                    accept=".pdf,.jpg,.jpeg,.png,image/*"
                    onChange={handleMultipleFileChange}
                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                  />
                  <div className="flex items-center justify-center gap-2">
                    <Upload className="w-4 h-4 text-emerald-400" />
                    <span className="text-xs text-slate-300">
                      Take photo or upload ID scans (Passport, Aadhaar, License)
                    </span>
                  </div>
                </div>

                {stagedFiles.length > 0 && (
                  <div className="space-y-1.5 pt-1">
                    {stagedFiles.map((stg) => (
                      <div
                        key={stg.id}
                        className="p-2 rounded-lg bg-emerald-950/30 border border-emerald-500/30 flex items-center justify-between text-xs"
                      >
                        <span className="truncate font-medium text-slate-200">{stg.file_name}</span>
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => setPreviewDoc(stg)}
                            className="p-1 text-slate-400 hover:text-emerald-400"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => removeStagedFile(stg.id)}
                            className="p-1 text-slate-400 hover:text-rose-400"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Initial Status Selector for Detailed Mode */}
              <div className="p-3.5 rounded-xl bg-slate-950 border border-emerald-500/30 space-y-1.5">
                <label className="block text-xs font-bold text-emerald-400">
                  Initial Reservation Status *
                </label>
                <div className="flex items-center gap-4 text-xs pt-1">
                  <label className="flex items-center gap-1.5 cursor-pointer text-slate-200 font-bold">
                    <input
                      type="radio"
                      name="initialStatus"
                      value="Checked In"
                      checked={initialStatus === 'Checked In'}
                      onChange={(e) => setInitialStatus(e.target.value)}
                      className="accent-emerald-500"
                    />
                    <span>⚡ Instant Check-In & Mark Cottage(s) OCCUPIED</span>
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer text-slate-300">
                    <input
                      type="radio"
                      name="initialStatus"
                      value="Confirmed"
                      checked={initialStatus === 'Confirmed'}
                      onChange={(e) => setInitialStatus(e.target.value)}
                      className="accent-emerald-500"
                    />
                    <span>Confirmed (Upcoming Arrival)</span>
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* STAY DATES PICKERS */}
          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-emerald-400" />
                Stay Dates
              </span>
              <span className="text-[11px] text-slate-400">
                Check-in 2:00 PM • Check-out 11:00 AM
              </span>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Check-In Date *
                </label>
                <input
                  type="date"
                  value={checkInDate}
                  onChange={(e) => setCheckInDate(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-900 border border-slate-800 rounded-xl text-slate-200 focus:outline-none focus:border-emerald-500"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Check-Out Date *
                </label>
                <input
                  type="date"
                  value={checkOutDate}
                  onChange={(e) => setCheckOutDate(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-900 border border-slate-800 rounded-xl text-slate-200 focus:outline-none focus:border-emerald-500"
                  required
                />
              </div>
            </div>
          </div>

          {/* MULTI-ROOM / COTTAGE SELECTOR */}
          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <div>
                <h4 className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                  <BedDouble className="w-4 h-4 text-emerald-400" />
                  Select Cottages (Multi-Room Booking Supported) *
                </h4>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Click to select one or multiple cottages under this guest's name
                </p>
              </div>
              <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/20">
                {selectedRoomIds.length} Cottage{selectedRoomIds.length > 1 ? 's' : ''} Selected
              </span>
            </div>

            {/* Cottage Selection Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 pt-1">
              {rooms.map((r) => {
                const isSelected = selectedRoomIds.includes(r.id);
                const availInfo = roomAvailability[r.id];
                const isAvail = availInfo?.isAvailable;

                return (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => toggleRoomSelection(r.id)}
                    className={`p-3 rounded-xl border text-left transition-all relative flex flex-col justify-between ${
                      isSelected
                        ? 'bg-emerald-950/40 border-emerald-500 shadow-md shadow-emerald-950'
                        : isAvail
                        ? 'bg-slate-900 border-slate-800 hover:border-slate-700'
                        : 'bg-slate-900/40 border-rose-950/50 opacity-70 hover:opacity-100'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-1.5 font-bold text-xs text-slate-100">
                          <span>Room {r.room_number}</span>
                          <span className="text-[10px] font-normal text-slate-400">({r.room_type})</span>
                        </div>
                        <div className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                          <Users className="w-3 h-3 text-slate-500" />
                          Max: {r.capacity} Guests
                        </div>
                        <div className="flex items-center gap-2 text-[10px] mt-1 font-mono">
                          <span className="text-amber-400 flex items-center gap-0.5">
                            <Sun className="w-2.5 h-2.5" /> ₹{Number(r.weekday_rate || r.price_per_night || 3500).toLocaleString('en-IN')}<span className="text-[9px] text-slate-500">/wkday</span>
                          </span>
                          <span className="text-teal-400 flex items-center gap-0.5">
                            <Moon className="w-2.5 h-2.5" /> ₹{Number(r.weekend_rate || r.price_per_night || 4500).toLocaleString('en-IN')}<span className="text-[9px] text-slate-500">/wkend</span>
                          </span>
                        </div>
                      </div>

                      {/* Checkbox indicator */}
                      <div
                        className={`w-5 h-5 rounded-md border flex items-center justify-center shrink-0 transition-colors ${
                          isSelected
                            ? 'bg-emerald-500 border-emerald-400 text-white'
                            : 'border-slate-700 bg-slate-800'
                        }`}
                      >
                        {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                      </div>
                    </div>

                    <div className="mt-2 pt-1.5 border-t border-slate-800/60 flex items-center justify-between text-[10px]">
                      {isAvail ? (
                        <span className="text-emerald-400 font-semibold flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                          Available for dates
                        </span>
                      ) : (
                        <span className="text-rose-400 font-semibold flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" />
                          Booked on selected dates
                        </span>
                      )}

                      {isSelected && (
                        <span className="text-emerald-300 font-bold">Selected</span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Stay Pricing Calculation Breakdown */}
            {selectedRoomsList.length > 0 && stayCalculation.totalNights > 0 && (
              <div className="p-3.5 rounded-xl bg-slate-950/90 border border-emerald-500/30 space-y-2.5 mt-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-2">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-emerald-400" />
                    <div>
                      <h4 className="text-xs font-bold text-slate-100">
                        Stay Pricing Calculation & Breakdown
                      </h4>
                      <p className="text-[10px] text-slate-400">
                        Calculated from {checkInDate} to {checkOutDate} ({stayCalculation.totalNights} night{stayCalculation.totalNights > 1 ? 's' : ''})
                      </p>
                    </div>
                  </div>
                  <div className="sm:text-right bg-emerald-950/40 px-3 py-1.5 rounded-lg border border-emerald-500/20">
                    <span className="text-[10px] text-slate-400 block sm:inline mr-1">Total Stay Rate:</span>
                    <span className="text-sm font-bold text-emerald-400 font-mono">
                      ₹{stayCalculation.totalAmount.toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>

                {/* Night type counters */}
                <div className="flex flex-wrap gap-2 text-[11px]">
                  {stayCalculation.weekdayNights > 0 && (
                    <div className="px-2.5 py-1 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-300 flex items-center gap-1.5 font-medium">
                      <Sun className="w-3.5 h-3.5 text-amber-400" />
                      <span>{stayCalculation.weekdayNights} Weekday Night{stayCalculation.weekdayNights > 1 ? 's' : ''} (Sun–Thu)</span>
                    </div>
                  )}
                  {stayCalculation.weekendNights > 0 && (
                    <div className="px-2.5 py-1 rounded-lg bg-teal-500/10 border border-teal-500/30 text-teal-300 flex items-center gap-1.5 font-medium">
                      <Moon className="w-3.5 h-3.5 text-teal-400" />
                      <span>{stayCalculation.weekendNights} Weekend Night{stayCalculation.weekendNights > 1 ? 's' : ''} (Fri–Sat)</span>
                    </div>
                  )}
                </div>

                {/* Detailed per-cottage rate if multiple */}
                {selectedRoomsList.length > 1 && (
                  <div className="pt-1.5 border-t border-slate-900 grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                    {stayCalculation.roomsBreakdown.map((rb) => (
                      <div key={rb.roomId} className="flex items-center justify-between p-2 rounded-lg bg-slate-900 border border-slate-800/80">
                        <span className="text-slate-300 font-semibold">Cottage {rb.roomNumber}:</span>
                        <div className="text-right">
                          <span className="font-mono font-bold text-slate-200">₹{rb.totalAmount.toLocaleString('en-IN')}</span>
                          <span className="text-[10px] text-slate-500 block">
                            ({rb.weekdayNights} wkday @ ₹{rb.weekdayRate} + {rb.weekendNights} wkend @ ₹{rb.weekendRate})
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Guest Count & Notes */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-slate-400" />
                Total Number of Guests *
              </label>
              <input
                type="number"
                min="1"
                max="25"
                value={numGuests}
                onChange={(e) => setNumGuests(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-xl text-slate-200 focus:outline-none focus:border-emerald-500"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-slate-400" />
                Special Requests / Staff Notes
              </label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g. Extra mattress, campfire request, late arrival..."
                className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-xl text-slate-200 focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          {/* Inline Error Alert Box */}
          {errorMsg && (
            <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/40 text-rose-300 text-xs font-semibold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Submit Actions */}
          <div className="flex items-center justify-between pt-3 border-t border-slate-800">
            <span className="text-xs text-slate-400">
              Booking {selectedRoomIds.length} cottage{selectedRoomIds.length > 1 ? 's' : ''} for {numGuests} guest{numGuests > 1 ? 's' : ''}
            </span>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-slate-200"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white text-xs font-bold shadow-lg shadow-emerald-900/30 transition-all flex items-center gap-1.5"
              >
                {bookingTab === 'quick' ? <Zap className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
                {bookingTab === 'quick'
                  ? `Save Quick Booking (${selectedRoomIds.length} Room${selectedRoomIds.length > 1 ? 's' : ''})`
                  : initialStatus === 'Checked In'
                  ? `Instant Check-In (${selectedRoomIds.length} Room${selectedRoomIds.length > 1 ? 's' : ''})`
                  : `Confirm Reservation (${selectedRoomIds.length} Room${selectedRoomIds.length > 1 ? 's' : ''})`}
              </button>
            </div>
          </div>
        </form>
      </Modal>

      {/* Document Preview Modal */}
      <DocumentViewerModal
        isOpen={!!previewDoc}
        onClose={() => setPreviewDoc(null)}
        doc={previewDoc}
      />
    </>
  );
};
