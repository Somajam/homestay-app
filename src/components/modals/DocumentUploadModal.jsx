import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { useApp } from '../../context/AppContext';
import { Upload, FileText, CheckCircle2, AlertCircle, Sparkles, Loader2 } from 'lucide-react';
import { compressImage } from '../../utils/imageCompressor';

export const DocumentUploadModal = ({ isOpen, onClose, defaultGuestId = '' }) => {
  const { guests, addDocument, showToast } = useApp();
  const [selectedGuestId, setSelectedGuestId] = useState(defaultGuestId || guests[0]?.id || '');
  const [docType, setDocType] = useState('Aadhaar');
  const [simulatedFile, setSimulatedFile] = useState(null);
  const [compressInfo, setCompressInfo] = useState(null);
  const [isCompressing, setIsCompressing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 15 * 1024 * 1024) {
      showToast('File exceeds 15 MB limit! Please pick a smaller file.', 'error');
      return;
    }

    if (file.type.startsWith('image/')) {
      setIsCompressing(true);
      try {
        const compressed = await compressImage(file, {
          maxWidth: 1600,
          maxHeight: 1600,
          quality: 0.78,
        });
        setSimulatedFile(compressed.file);
        setCompressInfo(compressed);
        if (compressed.savedPercent !== '0%') {
          showToast(`Compressed photo: ${compressed.originalFormatted} → ${compressed.compressedFormatted} (Saved ${compressed.savedPercent} storage)`, 'success');
        }
      } catch {
        file.preview_url = URL.createObjectURL(file);
        setSimulatedFile(file);
      } finally {
        setIsCompressing(false);
      }
    } else {
      // PDF or document
      file.preview_url = URL.createObjectURL(file);
      setSimulatedFile(file);
      setCompressInfo(null);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedGuestId) {
      showToast('Please select a guest', 'warning');
      return;
    }
    const guest = guests.find((g) => g.id === selectedGuestId);
    const fileName = simulatedFile
      ? simulatedFile.name
      : `${guest?.full_name?.toLowerCase().replace(/\s+/g, '_')}_${docType.toLowerCase()}.jpg`;

    setIsUploading(true);
    try {
      await addDocument({
        guest_id: selectedGuestId,
        guest_name: guest ? guest.full_name : 'Guest',
        id_document_type: docType,
        file_name: fileName,
        file_type: simulatedFile ? simulatedFile.type : 'image/jpeg',
        file_size: simulatedFile
          ? simulatedFile.size > 1024 * 1024
            ? `${(simulatedFile.size / (1024 * 1024)).toFixed(1)} MB`
            : `${(simulatedFile.size / 1024).toFixed(0)} KB`
          : '220 KB',
        preview_url: compressInfo?.previewUrl || simulatedFile?.preview_url || null,
        rawFile: simulatedFile || null,
      });

      setSimulatedFile(null);
      setCompressInfo(null);
      onClose();
    } catch (err) {
      console.error(err);
      showToast('Failed to upload document. Please retry.', 'error');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Upload Guest ID Document">
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Select Guest */}
        <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Target Guest Record *
            </label>
          <select
            value={selectedGuestId}
            onChange={(e) => setSelectedGuestId(e.target.value)}
            className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-xl text-slate-200 focus:outline-none focus:border-emerald-500"
            required
          >
            {guests.map((g) => (
              <option key={g.id} value={g.id}>
                {g.full_name} ({g.id_document_type}: {g.id_document_number})
              </option>
            ))}
          </select>
        </div>

        {/* Document Classification */}
        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1.5">
            Document Category *
          </label>
          <select
            value={docType}
            onChange={(e) => setDocType(e.target.value)}
            className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-xl text-slate-200 focus:outline-none focus:border-emerald-500"
          >
            <option value="Passport">Passport Scan / Photo</option>
            <option value="Aadhaar">Aadhaar Card (Front & Back)</option>
            <option value="Visa">Visa Entry Document</option>
            <option value="Driver License">Driver's License</option>
            <option value="Voter ID">Voter ID Card</option>
            <option value="Other">Other Verified Document</option>
          </select>
        </div>

        {/* Drag & Drop File Box */}
        <div className="relative border-2 border-dashed border-slate-700 hover:border-emerald-500/60 rounded-2xl p-6 text-center bg-slate-950/60 transition-colors group cursor-pointer">
          <input
            type="file"
            accept=".pdf,.jpg,.jpeg,.png"
            onChange={handleFileChange}
            className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
          />
          <div className="flex flex-col items-center justify-center space-y-2">
            <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Upload className="w-6 h-6 text-emerald-400" />
            </div>
            {isCompressing ? (
              <p className="text-xs font-semibold text-emerald-400 animate-pulse">
                Optimizing photo to preserve cloud database free tier...
              </p>
            ) : simulatedFile ? (
              <div className="space-y-1.5">
                <div className="flex items-center justify-center gap-2 text-emerald-400 text-xs font-semibold">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Selected: {simulatedFile.name} ({(simulatedFile.size / 1024).toFixed(0)} KB)</span>
                </div>
                {compressInfo && compressInfo.savedPercent !== '0%' && (
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-[11px] text-emerald-300 font-medium">
                    <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Free Tier Protected: Saved {compressInfo.savedPercent} ({compressInfo.originalFormatted} → {compressInfo.compressedFormatted})</span>
                  </div>
                )}
              </div>
            ) : (
              <>
                <p className="text-xs font-semibold text-slate-200">
                  Click or drag file here to attach
                </p>
                <p className="text-[11px] text-slate-400">
                  Supported: JPG, PNG, PDF (Images auto-compressed to preserve free storage)
                </p>
              </>
            )}
          </div>
        </div>

        {/* Compliance Note */}
        <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-start gap-2.5 text-xs text-slate-400">
          <AlertCircle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
          <span>
            Documents are encrypted and stored in private Supabase Storage bucket <code>guest-documents</code> accessible only to staff.
          </span>
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
            disabled={isUploading}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 disabled:opacity-50 text-white text-xs font-bold shadow-lg shadow-emerald-900/30 transition-all cursor-pointer"
          >
            {isUploading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Uploading Document...</span>
              </>
            ) : (
              <>
                <FileText className="w-4 h-4" />
                <span>Upload Document & Attach</span>
              </>
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
};
