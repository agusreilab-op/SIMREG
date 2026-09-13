import React from 'react';
import { Trash2, AlertTriangle, X } from 'lucide-react';

export interface DeleteTargetInfo {
  type: 'fisik' | 'lab' | 'rontgen' | 'ekg' | 'audio' | 'spiro' | 'penunjang';
  id: string;
  name: string;
  code: string;
}

interface DeleteParamConfirmModalProps {
  isOpen: boolean;
  target: DeleteTargetInfo | null;
  onClose: () => void;
  onConfirm: () => void;
}

export const DeleteParamConfirmModal: React.FC<DeleteParamConfirmModalProps> = ({
  isOpen,
  target,
  onClose,
  onConfirm,
}) => {
  if (!isOpen || !target) return null;

  const getTypeName = (type: DeleteTargetInfo['type']) => {
    switch (type) {
      case 'fisik':
        return 'Pemeriksaan Fisik';
      case 'lab':
        return 'Laboratorium';
      case 'rontgen':
        return 'Rontgen Thorax';
      case 'ekg':
        return 'EKG Jantung';
      case 'audio':
        return 'Audiometri';
      case 'spiro':
        return 'Spirometri';
      case 'penunjang':
        return 'Pemeriksaan Penunjang';
      default:
        return 'Pemeriksaan';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl shadow-xl border border-slate-200 max-w-md w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="bg-rose-50 border-b border-rose-100 p-5 flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-600 text-white flex items-center justify-center shadow-xs">
              <Trash2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-slate-900">
                Hapus Parameter Pemeriksaan
              </h3>
              <span className="inline-block mt-0.5 px-2 py-0.5 text-[11px] font-bold rounded-md bg-rose-100 text-rose-800 border border-rose-200">
                {getTypeName(target.type)}
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-white/80 transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl">
            <div className="text-xs text-slate-500 font-semibold mb-1">Parameter yang akan dihapus:</div>
            <div className="text-sm font-bold text-slate-900">{target.name}</div>
            <div className="text-xs font-mono text-slate-600 mt-0.5">Kode: {target.code}</div>
          </div>

          <div className="flex items-start gap-2.5 p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 text-xs leading-relaxed">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div>
              Parameter ini akan dihapus dari daftar master pemeriksaan dan tidak akan lagi dimasukkan ke dalam paket MCU baru.
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold text-slate-700 bg-white border border-slate-300 rounded-xl hover:bg-slate-100 transition-all"
          >
            Batal
          </button>
          <button
            type="button"
            id="btn-confirm-delete-parameter"
            onClick={onConfirm}
            className="px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-xs transition-all flex items-center gap-1.5"
          >
            <Trash2 className="w-4 h-4" />
            Ya, Hapus Sekarang
          </button>
        </div>
      </div>
    </div>
  );
};
