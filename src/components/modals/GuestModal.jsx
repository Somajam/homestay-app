import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { useApp } from '../../context/AppContext';
import { DocumentViewerModal } from './DocumentViewerModal';
import {
  User,
  Phone,
  Mail,
  MapPin,
  Globe,
  CreditCard,
  FileText,
  BedDouble,
  Calendar,
  Users,
  CheckCircle2,
  Upload,
  Eye,
  Trash2,
  Paperclip,
  ShieldCheck,
  Camera,
  Zap,
  Sun,
  Moon,
  Sparkles,
} from 'lucide-react';
import { calculateStayRate } from '../../utils/pricing';
import { sanitizePhoneNumber, isValidPhoneNumber } from '../../utils/phoneValidation';

export const GuestModal = ({ isOpen, onClose, guestToEdit = null }) => {
  const { rooms, bookings = [], documents, addGuest, updateGuest, addBooking, addDocument, deleteDocument, showToast } = useApp();

  const todayStr = new Date().toISOString().split('T')[0];
  const tomorrowStr = new Date(Date.now() + 86400000).toISOString().split('T')[0];

  const [formData, setFormData] = useState({
    full_name: '',
    phone: '',
    email: '',
    address: '',
    nationality: 'Indian',
    id_document_type: 'Aadhaar',
    id_document_number: '',
    notes: '',
    // Unified Stay Details
    room_id: '',
    check_in_date: todayStr,
    check_out_date: tomorrowStr,
    num_guests: '2',
    booking_status: 'Confirmed',
  });

  // Staged files attached in this modal session
  const [stagedFiles, setStagedFiles] = useState([]);
  const [previewDoc, setPreviewDoc] = useState(null);

  useEffect(() => {
    setStagedFiles([]);
    if (guestToEdit) {
      setFormData({
        full_name: guestToEdit.full_name || '',
        phone: guestToEdit.phone || '',
        email: guestToEdit.email || '',
        address: guestToEdit.address || '',
        nationality: guestToEdit.nationality || 'Indian',
        id_document_type: guestToEdit.id_document_type || 'Aadhaar',
        id_document_number: guestToEdit.id_document_number || '',
        notes: guestToEdit.notes || '',
        room_id: '',
        check_in_date: todayStr,
        check_out_date: tomorrowStr,
        num_guests: '2',
        booking_status: 'Confirmed',
      });
    } else {
      setFormData({
        full_name: '',
        phone: '',
        email: '',
        address: '',
        nationality: 'Indian',
        id_document_type: 'Aadhaar',
        id_document_number: '',
        notes: '',
        room_id: '',
        check_in_date: todayStr,
        check_out_date: tomorrowStr,
        num_guests: '2',
        booking_status: 'Confirmed',
      });
    }
  }, [guestToEdit, isOpen]);

  // Existing documents if editing an existing guest
  const existingDocs = guestToEdit ? documents.filter((d) => d.guest_id === guestToEdit.id) : [];

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
          id: `staged-${Date.now()}-${Math.random()}`,
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
      showToast(`Attached ${validFiles.length} photo/file(s) to form`, 'info');
    }
  };

  const removeStagedFile = (fileId) => {
    setStagedFiles((prev) => prev.filter((f) => f.id !== fileId));
    showToast('Attached file removed', 'info');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isValidPhoneNumber(formData.phone)) {
      showToast('Mobile number must contain at least 10 digits and cannot contain letters!', 'warning');
      return;
    }
    let guestObj = guestToEdit;

    if (guestToEdit) {
      await updateGuest(guestToEdit.id, formData);
    } else {
      guestObj = await addGuest(formData);
    }

    const targetGuestId = guestObj ? guestObj.id : guestToEdit?.id;
    const targetGuestName = formData.full_name || 'Guest';

    // If a room is selected in 1-Step Booking, create the reservation!
    if (!guestToEdit && formData.room_id && targetGuestId) {
      const targetRoom = rooms.find((r) => r.id === formData.room_id);
      const stayPricing = calculateStayRate(targetRoom, formData.check_in_date, formData.check_out_date);

      await addBooking({
        guest_id: targetGuestId,
        guest_name: targetGuestName,
        room_id: formData.room_id,
        check_in_date: formData.check_in_date,
        check_out_date: formData.check_out_date,
        num_guests: parseInt(formData.num_guests, 10) || 2,
        booking_status: formData.booking_status || 'Confirmed',
        notes: formData.notes || '',
        total_amount: stayPricing.totalAmount,
      });
    }

    // Save all staged files to documents archive
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

    onClose();
  };

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title={guestToEdit ? 'Edit Guest Profile' : 'Add New Guest & Assign Room'}
      >
        <form onSubmit={handleSubmit} className="space-y-4 max-h-[80vh] overflow-y-auto pr-1">

          {/* Full Name & Phone */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-emerald-400" />
                Full Name *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Ramesh Nair"
                value={formData.full_name}
                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-xl text-slate-200 focus:outline-none focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-slate-400" />
                Phone Number *
              </label>
              <input
                type="tel"
                required
                placeholder="e.g. +91 98470 00000"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: sanitizePhoneNumber(e.target.value) })}
                className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-xl text-slate-200 focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          {/* Email & Nationality */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-slate-400" />
                Email Address
              </label>
              <input
                type="email"
                placeholder="guest@example.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-xl text-slate-200 focus:outline-none focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5 text-slate-400" />
                Nationality (Optional)
              </label>
              <input
                type="text"
                placeholder="e.g. Indian, British, German"
                value={formData.nationality}
                onChange={(e) => setFormData({ ...formData, nationality: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-xl text-slate-200 focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          {/* ID Document Details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1.5">
                <CreditCard className="w-3.5 h-3.5 text-slate-400" />
                ID Document Type (Optional for Booking)
              </label>
              <select
                value={formData.id_document_type}
                onChange={(e) => setFormData({ ...formData, id_document_type: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-xl text-slate-200 focus:outline-none focus:border-emerald-500"
              >
                <option value="Aadhaar">Aadhaar Card</option>
                <option value="Passport">Passport</option>
                <option value="Voter ID">Voter ID Card</option>
                <option value="Driver License">Driver's License</option>
                <option value="Pending">Pending Check-In</option>
                <option value="Other">Other Government ID</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Document Number (Optional for Booking)
              </label>
              <input
                type="text"
                placeholder="e.g. 5489 1234 8901 (Can fill at Check-In)"
                value={formData.id_document_number}
                onChange={(e) => setFormData({ ...formData, id_document_number: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-xl text-slate-200 focus:outline-none focus:border-emerald-500 font-mono"
              />
            </div>
          </div>

          {/* Address */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-slate-400" />
              Home Address
            </label>
            <input
              type="text"
              placeholder="City, State, Country"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-xl text-slate-200 focus:outline-none focus:border-emerald-500"
            />
          </div>

          {/* Multi-Document Attachment Zone */}
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-xs text-slate-100 flex items-center gap-1.5">
                <Paperclip className="w-4 h-4 text-emerald-400" />
                Attach ID Proof Documents (Multiple Supported)
              </h4>
              <span className="text-[10px] text-slate-400 font-mono">
                {stagedFiles.length + existingDocs.length} File(s) Attached
              </span>
            </div>

            {/* File Upload Box */}
            <div className="relative border border-dashed border-slate-700 hover:border-emerald-500 rounded-xl p-4 text-center bg-slate-900/60 transition-colors group cursor-pointer">
              <input
                type="file"
                multiple
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={handleMultipleFileChange}
                className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
              />
              <div className="flex items-center justify-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center shrink-0">
                  <Upload className="w-4 h-4" />
                </div>
                <div className="text-left">
                  <p className="text-xs font-semibold text-slate-200">
                    Click or drag multiple files here (Passport, Aadhaar, Driving License...)
                  </p>
                  <p className="text-[10px] text-slate-400">PDF, JPG, PNG up to 5 MB each</p>
                </div>
              </div>
            </div>

            {/* Attached Documents List (Staged + Existing) */}
            {(stagedFiles.length > 0 || existingDocs.length > 0) && (
              <div className="space-y-2 pt-1">
                {/* Existing saved docs if editing */}
                {existingDocs.map((d) => (
                  <div
                    key={d.id}
                    className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-between gap-2 text-xs"
                  >
                    <div className="flex items-center gap-2 overflow-hidden">
                      <FileText className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span className="truncate font-medium text-slate-200">{d.file_name}</span>
                      <span className="text-[10px] text-slate-500 font-mono shrink-0">({d.file_size})</span>
                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shrink-0">
                        Saved
                      </span>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => setPreviewDoc(d)}
                        className="p-1 rounded text-slate-400 hover:text-emerald-400 hover:bg-slate-800"
                        title="View Document"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => deleteDocument(d.id)}
                        className="p-1 rounded text-slate-400 hover:text-rose-400 hover:bg-slate-800"
                        title="Delete Document"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}

                {/* Staged new docs */}
                {stagedFiles.map((stg) => (
                  <div
                    key={stg.id}
                    className="p-2.5 rounded-lg bg-emerald-950/30 border border-emerald-500/30 flex items-center justify-between gap-2 text-xs"
                  >
                    <div className="flex items-center gap-2 overflow-hidden">
                      <FileText className="w-4 h-4 text-sky-400 shrink-0" />
                      <span className="truncate font-medium text-slate-200">{stg.file_name}</span>
                      <span className="text-[10px] text-slate-500 font-mono shrink-0">({stg.file_size})</span>
                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-sky-500/10 text-sky-400 border border-sky-500/20 shrink-0">
                        New Attachment
                      </span>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => setPreviewDoc(stg)}
                        className="p-1 rounded text-slate-400 hover:text-emerald-400 hover:bg-slate-800"
                        title="View Staged File"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => removeStagedFile(stg.id)}
                        className="p-1 rounded text-slate-400 hover:text-rose-400 hover:bg-slate-800"
                        title="Remove Attachment"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Unified Stay Details Section (Only for new guest registration) */}
          {!guestToEdit && (
            <div className="p-4 rounded-xl bg-slate-950/90 border border-emerald-500/30 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <h4 className="font-bold text-xs text-emerald-400 flex items-center gap-1.5">
                  <BedDouble className="w-4 h-4" />
                  Room Assignment & Stay Schedule
                </h4>
                <span className="text-[10px] font-mono bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded border border-emerald-500/20">
                  1-Step Booking
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1.5">
                    <BedDouble className="w-3.5 h-3.5 text-slate-400" />
                    Assign Room *
                  </label>
                  <select
                    required
                    value={formData.room_id}
                    onChange={(e) => setFormData({ ...formData, room_id: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-slate-900 border border-slate-800 rounded-xl text-slate-100 focus:outline-none focus:border-emerald-500"
                  >
                    <option value="">-- Select Room (1BHK Cottage) --</option>
                    {rooms.map((r) => {
                      const isConflict = bookings.some(
                        (b) =>
                          b &&
                          b.room_id === r.id &&
                          b.status !== 'Cancelled' &&
                          b.status !== 'Checked Out' &&
                          new Date(formData.check_in_date) < new Date(b.check_out_date) &&
                          new Date(formData.check_out_date) > new Date(b.check_in_date)
                      );
                      const isAvail = !isConflict && r.status !== 'Maintenance';
                      return (
                        <option key={r.id} value={r.id} disabled={!isAvail}>
                          Cottage {r.room_number} {isConflict ? '(Booked for dates)' : r.status === 'Maintenance' ? '(Under Maintenance)' : '(Available)'} — Wkday: ₹{r.weekday_rate || r.price_per_night} / Wkend: ₹{r.weekend_rate || r.price_per_night}
                        </option>
                      );
                    })}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-slate-400" />
                    Number of Guests *
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="6"
                    required
                    value={formData.num_guests}
                    onChange={(e) => setFormData({ ...formData, num_guests: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-slate-900 border border-slate-800 rounded-xl text-slate-100 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    Check-In / Start Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.check_in_date}
                    onChange={(e) => setFormData({ ...formData, check_in_date: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-slate-900 border border-slate-800 rounded-xl text-slate-100 focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    Check-Out / End Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.check_out_date}
                    onChange={(e) => setFormData({ ...formData, check_out_date: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-slate-900 border border-slate-800 rounded-xl text-slate-100 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              {/* Stay Rate Estimate Preview */}
              {(() => {
                const selRoom = rooms.find((r) => r.id === formData.room_id);
                const calc = selRoom && formData.check_in_date && formData.check_out_date
                  ? calculateStayRate(selRoom, formData.check_in_date, formData.check_out_date)
                  : null;

                if (!calc || calc.totalNights <= 0) return null;

                return (
                  <div className="p-2.5 rounded-xl bg-slate-900 border border-emerald-500/30 flex flex-wrap items-center justify-between gap-2 text-[11px]">
                    <div className="flex items-center gap-1.5 text-emerald-300 font-medium">
                      <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                      <span>
                        {calc.totalNights} Night{calc.totalNights > 1 ? 's' : ''}: {calc.weekdayNights} Wkday (Sun–Thu) + {calc.weekendNights} Wkend (Fri–Sat)
                      </span>
                    </div>
                    <div className="font-mono font-bold text-emerald-400">
                      Est. Total: ₹{calc.totalAmount.toLocaleString('en-IN')}
                    </div>
                  </div>
                );
              })()}

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Initial Reservation Status
                </label>
                <div className="flex items-center gap-4 text-xs">
                  <label className="flex items-center gap-1.5 cursor-pointer text-slate-300">
                    <input
                      type="radio"
                      name="booking_status"
                      value="Confirmed"
                      checked={formData.booking_status === 'Confirmed'}
                      onChange={(e) => setFormData({ ...formData, booking_status: e.target.value })}
                      className="accent-emerald-500"
                    />
                    <span>Confirmed (Upcoming)</span>
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer text-slate-300">
                    <input
                      type="radio"
                      name="booking_status"
                      value="Checked In"
                      checked={formData.booking_status === 'Checked In'}
                      onChange={(e) => setFormData({ ...formData, booking_status: e.target.value })}
                      className="accent-emerald-500"
                    />
                    <span>Instant Check-In</span>
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* Guest Notes */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-slate-400" />
              Guest Preferences & Staff Notes
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Food preferences, extra bed request, campfire preference..."
              className="w-full h-16 px-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-xl text-slate-200 focus:outline-none focus:border-emerald-500"
            />
          </div>

          {/* Buttons */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-slate-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white text-xs font-bold shadow-lg shadow-emerald-900/30 transition-all flex items-center gap-1.5"
            >
              <CheckCircle2 className="w-4 h-4" />
              {guestToEdit ? 'Save Changes' : 'Register Guest & Create Booking'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Document Viewer Modal */}
      <DocumentViewerModal
        isOpen={!!previewDoc}
        onClose={() => setPreviewDoc(null)}
        doc={previewDoc}
      />
    </>
  );
};


