import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { useApp } from '../../context/AppContext';
import {
  LogIn,
  ShieldCheck,
  AlertCircle,
  FileText,
  CreditCard,
  Upload,
  Paperclip,
  Camera,
  Trash2,
  Loader2,
  Image as ImageIcon,
} from 'lucide-react';

export const CheckInModal = ({ isOpen, onClose, booking }) => {
  const { guests, processCheckIn, updateGuest, documents, addDocument, showToast } = useApp();

  const [staffNotes, setStaffNotes] = useState('');
  const [verifiedId, setVerifiedId] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Guest & ID Completion fields
  const guestObj = booking ? guests.find((g) => g.id === booking.guest_id) : null;
  const isIdPending = !guestObj?.id_document_number || guestObj?.id_document_number === 'Pending Check-In';

  const [idType, setIdType] = useState(guestObj?.id_document_type || 'Aadhaar');
  const [idNumber, setIdNumber] = useState(guestObj?.id_document_number === 'Pending Check-In' ? '' : guestObj?.id_document_number || '');
  const [stagedFiles, setStagedFiles] = useState([]);

  if (!booking) return null;

  const guestDocs = documents.filter((d) => d.guest_id === booking.guest_id);

  const handleMultipleFileChange = (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;

    const validFiles = [];
    files.forEach((file) => {
      if (file.size > 15 * 1024 * 1024) {
        showToast(`File "${file.name}" exceeds 15 MB limit!`, 'error');
      } else {
        const previewUrl = URL.createObjectURL(file);
        validFiles.push({
          id: `staged-checkin-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          file_name: file.name,
          file_size: file.size > 1024 * 1024
            ? `${(file.size / (1024 * 1024)).toFixed(1)} MB`
            : `${(file.size / 1024).toFixed(0)} KB`,
          file_type: file.type || 'image/jpeg',
          preview_url: previewUrl,
          rawFile: file,
        });
      }
    });

    if (validFiles.length > 0) {
      setStagedFiles((prev) => [...prev, ...validFiles]);
      showToast(`Attached ${validFiles.length} photo/file(s) — click Confirm Check-In below to upload`, 'info');
    }
    e.target.value = '';
  };

  const removeStagedFile = (fileId) => {
    setStagedFiles((prev) => prev.filter((f) => f.id !== fileId));
    showToast('Attached file removed', 'info');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // 1. If staff provided ID details, update the guest record
      if (booking.guest_id && idNumber.trim()) {
        await updateGuest(booking.guest_id, {
          id_document_type: idType,
          id_document_number: idNumber.trim(),
        });
      }

      // 2. Upload and save all staged files to Supabase storage & DB
      if (booking.guest_id && stagedFiles.length > 0) {
        for (const stg of stagedFiles) {
          await addDocument({
            guest_id: booking.guest_id,
            guest_name: booking.guest_name,
            id_document_type: idType,
            file_name: stg.file_name,
            file_type: stg.file_type,
            file_size: stg.file_size,
            preview_url: stg.preview_url,
            rawFile: stg.rawFile,
          });
        }
      }

      // 3. Complete Check-In
      await processCheckIn(booking.id, staffNotes);
      setStagedFiles([]);
      onClose();
    } catch (err) {
      console.error('Check-in error:', err);
      showToast('Error during check-in. Please try again.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Guest Check-In & Verification">
      <form onSubmit={handleSubmit} className="space-y-4 max-h-[80vh] overflow-y-auto pr-1">
        {/* Booking Summary Box */}
        <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono text-emerald-400 font-bold">
              {booking.booking_ref}
            </span>
            <span className="px-2 py-0.5 rounded text-xs bg-slate-800 text-slate-300">
              Room: {booking.room_number}
            </span>
          </div>
          <h4 className="text-base font-bold text-slate-100">
            {booking.guest_name}
          </h4>
          <div className="grid grid-cols-2 gap-2 text-xs text-slate-400 pt-1 border-t border-slate-800/60">
            <div>Check-in: <strong className="text-slate-200">{booking.check_in_date}</strong></div>
            <div>Check-out: <strong className="text-slate-200">{booking.check_out_date}</strong></div>
            <div>Guests: <strong className="text-slate-200">{booking.num_guests} Person(s)</strong></div>
          </div>
        </div>

        {/* Document Verification Compliance Alert */}
        <div className={`p-3.5 rounded-xl border flex items-start gap-3 ${
          guestDocs.length > 0
            ? 'bg-slate-900 border-slate-800'
            : 'bg-amber-950/30 border-amber-500/30'
        }`}>
          {guestDocs.length > 0 ? (
            <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
          ) : (
            <AlertCircle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
          )}
          <div className="text-xs">
            <p className="font-semibold text-slate-200">
              {guestDocs.length > 0
                ? `${guestDocs.length} Verified Document(s) Attached`
                : isIdPending
                ? '⚠️ ID Proof Pending - Complete Details Below for Check-In'
                : 'No Document Scan Uploaded Yet'}
            </p>
            <p className="text-slate-400 mt-0.5">
              {guestDocs.length > 0
                ? `Attached ID: ${guestDocs[0].file_name}`
                : 'You can enter ID number and upload documents right here during check-in.'}
            </p>
          </div>
        </div>

        {/* Complete ID Proof Details Section */}
        <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
          <div className="border-b border-slate-800 pb-2">
            <h4 className="font-bold text-xs text-slate-200 flex items-center gap-1.5">
              <CreditCard className="w-4 h-4 text-emerald-400" />
              Complete / Verify ID Proof Details
            </h4>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                ID Document Type
              </label>
              <select
                value={idType}
                onChange={(e) => setIdType(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-900 border border-slate-800 rounded-xl text-slate-200 focus:outline-none focus:border-emerald-500"
              >
                <option value="Aadhaar">Aadhaar Card</option>
                <option value="Passport">Passport</option>
                <option value="Voter ID">Voter ID Card</option>
                <option value="Driver License">Driver's License</option>
                <option value="Other">Other Government ID</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Document Number
              </label>
              <input
                type="text"
                placeholder="e.g. 5489 1234 8901"
                value={idNumber}
                onChange={(e) => setIdNumber(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-900 border border-slate-800 rounded-xl text-slate-200 focus:outline-none focus:border-emerald-500 font-mono"
              />
            </div>
          </div>

          {/* Upload ID Scan File Box */}
          <div className="relative border border-dashed border-slate-700 hover:border-emerald-500 rounded-xl p-3 text-center bg-slate-900/60 transition-colors cursor-pointer">
            <input
              type="file"
              multiple
              accept=".pdf,.jpg,.jpeg,.png"
              onChange={handleMultipleFileChange}
              className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
            />
            <div className="flex items-center justify-center gap-2">
              <Upload className="w-4 h-4 text-emerald-400" />
              <span className="text-xs font-medium text-slate-300">
                Attach ID Scans / Photos (PDF, JPG, PNG)
              </span>
            </div>
          </div>

          {/* Attached Files Visual Cards */}
          {stagedFiles.length > 0 && (
            <div className="space-y-2 pt-1">
              <div className="flex items-center justify-between text-xs font-semibold text-emerald-400">
                <span>{stagedFiles.length} file(s) attached — Ready to upload:</span>
                <span className="text-[11px] text-slate-400 font-normal">Will upload on confirming check-in</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {stagedFiles.map((f) => (
                  <div
                    key={f.id}
                    className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between gap-2 shadow-sm"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      {f.preview_url ? (
                        <img
                          src={f.preview_url}
                          alt={f.file_name}
                          className="w-10 h-10 rounded-lg object-cover border border-slate-700 shrink-0"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-lg bg-slate-800 flex items-center justify-center shrink-0">
                          <FileText className="w-5 h-5 text-slate-400" />
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-slate-200 truncate">{f.file_name}</p>
                        <p className="text-[10px] text-slate-400">{f.file_size}</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeStagedFile(f.id)}
                      className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-slate-800 transition-colors shrink-0"
                      title="Remove this photo"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Verification Checkbox */}
        <label className="flex items-center gap-3 p-3 rounded-xl bg-slate-950 border border-slate-800 cursor-pointer hover:border-slate-700 transition-colors">
          <input
            type="checkbox"
            checked={verifiedId}
            onChange={(e) => setVerifiedId(e.target.checked)}
            className="w-4 h-4 rounded text-emerald-500 bg-slate-900 border-slate-700 focus:ring-emerald-500"
          />
          <span className="text-xs text-slate-300">
            Physical ID verified and matches guest record
          </span>
        </label>

        {/* Staff Notes textarea */}
        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
            <FileText className="w-3.5 h-3.5 text-slate-400" />
            Check-In Notes / Requests
          </label>
          <textarea
            value={staffNotes}
            onChange={(e) => setStaffNotes(e.target.value)}
            placeholder="e.g. Guest paid advance balance, requested breakfast at 8:30 AM..."
            className="w-full h-16 px-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-xl text-slate-200 focus:outline-none focus:border-emerald-500"
          />
        </div>

        {/* Submit Actions */}
        <div className="flex items-center justify-between pt-3 border-t border-slate-800">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-slate-200"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 disabled:opacity-50 text-white text-xs font-bold shadow-lg shadow-emerald-900/30 transition-all cursor-pointer"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Uploading ID & Checking In...</span>
              </>
            ) : (
              <>
                <LogIn className="w-4 h-4" />
                <span>Confirm Check-In & Complete Upload</span>
              </>
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
};

