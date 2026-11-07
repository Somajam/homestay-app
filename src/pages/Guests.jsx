import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { GuestModal } from '../components/modals/GuestModal';
import { DocumentUploadModal } from '../components/modals/DocumentUploadModal';
import { DocumentViewerModal } from '../components/modals/DocumentViewerModal';
import { Modal } from '../components/common/Modal';
import {
  Users,
  Search,
  Plus,
  FileText,
  Phone,
  Mail,
  Globe,
  Trash2,
  Edit,
  Eye,
  Upload,
  Calendar,
  ShieldCheck,
  ShieldAlert,
  FileArchive,
} from 'lucide-react';

export const Guests = () => {
  const { guests = [], bookings = [], documents = [], deleteGuest, currentRole } = useApp();

  const [searchTerm, setSearchTerm] = useState('');
  const [docFilter, setDocFilter] = useState('all');

  // Modals state
  const [showGuestModal, setShowGuestModal] = useState(false);
  const [editingGuest, setEditingGuest] = useState(null);
  const [viewingGuest, setViewingGuest] = useState(null);
  const [showDocUploadModal, setShowDocUploadModal] = useState(false);
  const [uploadGuestId, setUploadGuestId] = useState('');

  // Active Detail Tab inside Drawer Modal
  const [detailTab, setDetailTab] = useState('info'); // 'info' | 'history' | 'docs'
  const [previewDoc, setPreviewDoc] = useState(null);

  // Safe arrays
  const safeGuests = Array.isArray(guests) ? guests : [];
  const safeBookings = Array.isArray(bookings) ? bookings : [];
  const safeDocuments = Array.isArray(documents) ? documents : [];

  // Filtered Guests list (Null-safe for all fields)
  const filteredGuests = safeGuests.filter((g) => {
    if (!g) return false;
    const fullName = (g.full_name || '').toLowerCase();
    const phone = g.phone || '';
    const nationality = (g.nationality || '').toLowerCase();
    const idDocNum = (g.id_document_number || '').toLowerCase();
    const search = (searchTerm || '').toLowerCase();

    const matchesSearch =
      fullName.includes(search) ||
      phone.includes(search) ||
      nationality.includes(search) ||
      idDocNum.includes(search);

    const guestDocs = safeDocuments.filter((d) => d && d.guest_id === g.id);
    if (docFilter === 'has_id') return matchesSearch && guestDocs.length > 0;
    if (docFilter === 'missing_id') return matchesSearch && guestDocs.length === 0;
    return matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Top Header Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl">
        <div>
          <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <Users className="w-5 h-5 text-emerald-400" />
            Guest Directory & Document Archives
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Search guest records, view past stays, verify nationality documents, and attach ID proofs.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Link
            to="/reports-settings"
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-all"
          >
            <FileArchive className="w-3.5 h-3.5 text-emerald-400" />
            <span>Monthly Archives & Free-Tier Storage</span>
          </Link>

          <button
            onClick={() => {
              setEditingGuest(null);
              setShowGuestModal(true);
            }}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white text-xs font-bold shadow-lg shadow-emerald-900/30 transition-all"
          >
            <Plus className="w-4 h-4" />
            Add New Guest
          </button>
        </div>
      </div>

      {/* Search & Filter Controls */}
      <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Search input */}
        <div className="relative w-full sm:w-96">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search name, phone, nationality, ID number..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-xs bg-slate-950 border border-slate-800 rounded-xl text-slate-200 focus:outline-none focus:border-emerald-500"
          />
        </div>

        {/* Document compliance filter */}
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <span className="text-xs text-slate-400">Filter Documents:</span>
          <select
            value={docFilter}
            onChange={(e) => setDocFilter(e.target.value)}
            className="px-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-xl text-slate-200 focus:outline-none focus:border-emerald-500"
          >
            <option value="all">All Guests ({safeGuests.length})</option>
            <option value="has_id">Has ID Uploaded</option>
            <option value="missing_id">Missing ID Document</option>
          </select>
        </div>
      </div>

      {/* Guests Data Table */}
      <div className="rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950 text-slate-400 uppercase font-mono text-[11px] border-b border-slate-800">
              <tr>
                <th className="p-4">Guest Name</th>
                <th className="p-4">Contact Info</th>
                <th className="p-4">Nationality & ID</th>
                <th className="p-4">Stays</th>
                <th className="p-4">Documents</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredGuests.length === 0 ? (
                <tr>
                  <td colSpan="6" className="p-8 text-center text-slate-500">
                    No guest records found matching search query.
                  </td>
                </tr>
              ) : (
                filteredGuests.map((g) => {
                  if (!g) return null;
                  const guestBookings = safeBookings.filter((b) => b && b.guest_id === g.id);
                  const guestDocs = safeDocuments.filter((d) => d && d.guest_id === g.id);

                  return (
                    <tr key={g.id || Math.random()} className="hover:bg-slate-800/40 transition-colors">
                      <td
                        className="p-4 cursor-pointer"
                        onClick={() => {
                          setViewingGuest(g);
                          setDetailTab('info');
                        }}
                      >
                        <div className="font-bold text-slate-100 hover:text-emerald-400 transition-colors">
                          {g.full_name || 'Unnamed Guest'}
                        </div>
                        <div className="text-[10px] text-slate-500 mt-0.5">{g.address || 'Address not listed'}</div>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-1.5 text-slate-300">
                          <Phone className="w-3 h-3 text-slate-500" />
                          {g.phone || 'No Phone'}
                        </div>
                        <div className="flex items-center gap-1.5 text-slate-400 text-[11px] mt-0.5">
                          <Mail className="w-3 h-3 text-slate-500" />
                          {g.email || 'N/A'}
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-1.5">
                          <Globe className="w-3 h-3 text-emerald-400" />
                          <span>{g.nationality || 'Indian'}</span>
                        </div>
                        <div className="text-[10px] font-mono text-slate-400 mt-0.5">
                          {g.id_document_type || 'ID'}: {g.id_document_number || 'Pending Check-In'}
                        </div>
                      </td>
                      <td className="p-4">
                        <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-slate-800 text-slate-300 border border-slate-700">
                          {guestBookings.length} Stay(s)
                        </span>
                      </td>
                      <td className="p-4">
                        {guestDocs.length > 0 ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                            <ShieldCheck className="w-3 h-3" />
                            {guestDocs.length} File(s)
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-amber-500/10 text-amber-400 border border-amber-500/30">
                            <ShieldAlert className="w-3 h-3" />
                            Missing ID
                          </span>
                        )}
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => {
                              setViewingGuest(g);
                              setDetailTab('info');
                            }}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-400 hover:bg-slate-800 transition-colors"
                            title="View Details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => {
                              setUploadGuestId(g.id);
                              setShowDocUploadModal(true);
                            }}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-sky-400 hover:bg-slate-800 transition-colors"
                            title="Upload ID Document"
                          >
                            <Upload className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => {
                              setEditingGuest(g);
                              setShowGuestModal(true);
                            }}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
                            title="Edit Info"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          {currentRole === 'admin' && (
                            <button
                              onClick={() => deleteGuest(g.id)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-colors"
                              title="Delete Record (Admin Only)"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Guest Detail View Modal */}
      {viewingGuest && (
        <Modal
          isOpen={!!viewingGuest}
          onClose={() => setViewingGuest(null)}
          title={`Guest Details: ${viewingGuest.full_name || 'Guest'}`}
        >
          {/* Detail Tabs */}
          <div className="flex border-b border-slate-800 mb-4">
            <button
              onClick={() => setDetailTab('info')}
              className={`px-4 py-2 text-xs font-semibold border-b-2 transition-colors ${
                detailTab === 'info'
                  ? 'border-emerald-500 text-emerald-400'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              Personal Details
            </button>
            <button
              onClick={() => setDetailTab('history')}
              className={`px-4 py-2 text-xs font-semibold border-b-2 transition-colors ${
                detailTab === 'history'
                  ? 'border-emerald-500 text-emerald-400'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              Stays History ({safeBookings.filter((b) => b && b.guest_id === viewingGuest.id).length})
            </button>
            <button
              onClick={() => setDetailTab('docs')}
              className={`px-4 py-2 text-xs font-semibold border-b-2 transition-colors ${
                detailTab === 'docs'
                  ? 'border-emerald-500 text-emerald-400'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              Documents ({safeDocuments.filter((d) => d && d.guest_id === viewingGuest.id).length})
            </button>
          </div>

          {/* Tab 1: Info */}
          {detailTab === 'info' && (
            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-4 p-4 rounded-xl bg-slate-950 border border-slate-800">
                <div>
                  <span className="text-slate-500 block">Phone</span>
                  <span className="font-semibold text-slate-200">{viewingGuest.phone || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Email</span>
                  <span className="font-semibold text-slate-200">{viewingGuest.email || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Nationality</span>
                  <span className="font-semibold text-emerald-400">{viewingGuest.nationality || 'Indian'}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">ID Document</span>
                  <span className="font-mono text-slate-200">
                    {viewingGuest.id_document_type || 'ID'}: {viewingGuest.id_document_number || 'Pending Check-In'}
                  </span>
                </div>
              </div>
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-slate-500 block mb-1">Address</span>
                <p className="text-slate-300">{viewingGuest.address || 'No address registered'}</p>
              </div>
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-slate-500 block mb-1">Special Preferences / Notes</span>
                <p className="text-slate-300 italic">{viewingGuest.notes || 'No notes added.'}</p>
              </div>
            </div>
          )}

          {/* Tab 2: History */}
          {detailTab === 'history' && (
            <div className="space-y-3 text-xs">
              {safeBookings.filter((b) => b && b.guest_id === viewingGuest.id).length === 0 ? (
                <p className="text-slate-500 text-center py-6">No previous stays recorded.</p>
              ) : (
                safeBookings
                  .filter((b) => b && b.guest_id === viewingGuest.id)
                  .map((b) => (
                    <div
                      key={b.id}
                      className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between"
                    >
                      <div>
                        <div className="font-mono text-emerald-400 font-bold">{b.booking_ref}</div>
                        <div className="text-slate-300 font-semibold">{b.room_number}</div>
                        <div className="text-slate-400 text-[11px]">
                          {b.check_in_date} to {b.check_out_date}
                        </div>
                      </div>
                      <span className="px-2 py-1 rounded text-xs bg-slate-800 text-slate-200">
                        {b.status}
                      </span>
                    </div>
                  ))
              )}
            </div>
          )}

          {/* Tab 3: Documents */}
          {detailTab === 'docs' && (
            <div className="space-y-3 text-xs">
              <button
                onClick={() => {
                  setUploadGuestId(viewingGuest.id);
                  setShowDocUploadModal(true);
                }}
                className="w-full py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 flex items-center justify-center gap-2 font-semibold"
              >
                <Upload className="w-4 h-4 text-emerald-400" />
                Upload New Document Attachment
              </button>

              {safeDocuments.filter((d) => d && d.guest_id === viewingGuest.id).length === 0 ? (
                <p className="text-slate-500 text-center py-6">
                  No documents attached for this guest yet.
                </p>
              ) : (
                safeDocuments
                  .filter((d) => d && d.guest_id === viewingGuest.id)
                  .map((d) => (
                    <div
                      key={d.id}
                      className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between gap-3"
                    >
                      <div className="flex items-center gap-3">
                        <FileText className="w-6 h-6 text-emerald-400" />
                        <div>
                          <p className="font-semibold text-slate-200">{d.file_name}</p>
                          <p className="text-[10px] text-slate-500">
                            Size: {d.file_size} | Uploaded by: {d.uploaded_by}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setPreviewDoc(d)}
                          className="px-3 py-1 rounded-lg bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 text-xs font-semibold flex items-center gap-1"
                        >
                          <Eye className="w-3.5 h-3.5" /> View
                        </button>
                      </div>
                    </div>
                  ))
              )}
            </div>
          )}
        </Modal>
      )}

      {/* Document Preview Modal */}
      <DocumentViewerModal
        isOpen={!!previewDoc}
        onClose={() => setPreviewDoc(null)}
        doc={previewDoc}
      />

      {/* Guest Modal */}
      <GuestModal
        isOpen={showGuestModal}
        onClose={() => {
          setShowGuestModal(false);
          setEditingGuest(null);
          setPrefilledData(null);
        }}
        guestToEdit={editingGuest}
      />

      {/* Document Upload Modal */}
      <DocumentUploadModal
        isOpen={showDocUploadModal}
        onClose={() => setShowDocUploadModal(false)}
        defaultGuestId={uploadGuestId}
      />
    </div>
  );
};
