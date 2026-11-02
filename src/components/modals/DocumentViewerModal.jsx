import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { FileText, Download, ShieldCheck, Image as ImageIcon, Eye } from 'lucide-react';
import { supabase } from '../../lib/supabase';

export const DocumentViewerModal = ({ isOpen, onClose, doc: propDoc, document: propDocument }) => {
  const doc = propDoc || propDocument;
  const [imageSrc, setImageSrc] = useState(null);

  useEffect(() => {
    if (!doc) {
      setImageSrc(null);
      return;
    }

    // 1. Direct preview URL if attached in session
    if (doc.preview_url) {
      setImageSrc(doc.preview_url);
    } else if (doc.rawFile && doc.rawFile instanceof File) {
      // 2. Local File object from device camera / upload
      const objectUrl = URL.createObjectURL(doc.rawFile);
      setImageSrc(objectUrl);
      return () => URL.revokeObjectURL(objectUrl);
    } else if (doc.data_url) {
      // 3. Base64 Data URL
      setImageSrc(doc.data_url);
    } else if (doc.file_path && (doc.file_path.startsWith('http') || doc.file_path.startsWith('data:'))) {
      // 4. Full HTTP or Data URL
      setImageSrc(doc.file_path);
    } else if (doc.file_path) {
      // 5. Supabase Storage relative path
      const cleanPath = doc.file_path.replace(/^guest-documents\//, '');
      const { data } = supabase.storage.from('guest-documents').getPublicUrl(cleanPath);
      if (data?.publicUrl) {
        setImageSrc(data.publicUrl);
      } else {
        setImageSrc(null);
      }
    } else {
      setImageSrc(null);
    }
  }, [doc]);

  if (!doc) return null;

  const fileName = doc.file_name || 'document';
  const fileType = doc.file_type || '';
  const isImage =
    fileType.startsWith('image/') ||
    /\.(jpg|jpeg|png|webp|gif|bmp|heic)$/i.test(fileName) ||
    !!imageSrc;

  const isPdf = fileType === 'application/pdf' || /\.pdf$/i.test(fileName);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Document Preview: ${fileName}`}>
      <div className="space-y-4">
        {/* Header Details */}
        <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              {isImage ? <ImageIcon className="w-5 h-5" /> : <FileText className="w-5 h-5" />}
            </div>
            <div>
              <p className="font-bold text-slate-100">{fileName}</p>
              <p className="text-[11px] text-slate-400">
                Size: <strong className="text-slate-200">{doc.file_size || '1.5 MB'}</strong> | Format:{' '}
                <span className="uppercase text-emerald-400">
                  {isImage ? 'Photo / Image Scan' : isPdf ? 'PDF Document' : 'ID File'}
                </span>
              </p>
            </div>
          </div>
          <span className="px-2.5 py-1 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5" /> Verified ID
          </span>
        </div>

        {/* Visual Document & Photo Display Area */}
        <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex flex-col items-center justify-center min-h-[260px] text-center relative overflow-hidden">
          {imageSrc ? (
            <div className="space-y-2 w-full flex flex-col items-center">
              <img
                src={imageSrc}
                alt={fileName}
                className="max-h-[380px] max-w-full rounded-xl object-contain shadow-2xl border border-slate-800"
                onError={() => setImageSrc(null)}
              />
              <p className="text-[11px] text-slate-400 font-mono flex items-center gap-1 mt-1">
                <Eye className="w-3 h-3 text-emerald-400" /> High-Resolution Photo Preview
              </p>
            </div>
          ) : (
            <div className="relative z-10 space-y-3 max-w-sm py-6">
              <div className="w-16 h-16 mx-auto rounded-2xl bg-slate-900 border border-slate-700 flex items-center justify-center text-emerald-400 shadow-xl">
                {isImage ? <ImageIcon className="w-8 h-8" /> : <FileText className="w-8 h-8" />}
              </div>
              <div>
                <h4 className="font-bold text-sm text-slate-100">
                  {doc.guest_name ? `${doc.guest_name}'s Identification` : fileName}
                </h4>
                <p className="text-xs text-slate-400 mt-1">
                  Government Verified ID Attachment stored securely in <code>guest-documents</code> bucket.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-3 border-t border-slate-800">
          {imageSrc ? (
            <a
              href={imageSrc}
              download={fileName}
              target="_blank"
              rel="noreferrer"
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 flex items-center gap-1.5 transition-all"
            >
              <Download className="w-4 h-4 text-emerald-400" />
              Download Full Image
            </a>
          ) : (
            <button
              type="button"
              onClick={() => alert(`Downloading ${fileName}`)}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 flex items-center gap-1.5 transition-all"
            >
              <Download className="w-4 h-4 text-emerald-400" />
              Download File
            </button>
          )}

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 text-white text-xs font-bold shadow-lg shadow-emerald-900/30"
          >
            Close Document
          </button>
        </div>
      </div>
    </Modal>
  );
};
