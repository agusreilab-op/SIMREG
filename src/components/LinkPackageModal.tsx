import React, { useState, useEffect } from 'react';
import { X, CheckSquare, Square, Save, Layers, Check } from 'lucide-react';
import { MCUPackage } from '../types';

interface LinkPackageModalProps {
  isOpen: boolean;
  paramName: string;
  paramCode: string;
  currentPackages: string[];
  availablePackages: MCUPackage[];
  onClose: () => void;
  onSave: (selectedCodes: string[]) => void;
}

export const LinkPackageModal: React.FC<LinkPackageModalProps> = ({
  isOpen,
  paramName,
  paramCode,
  currentPackages,
  availablePackages,
  onClose,
  onSave,
}) => {
  const [selectedCodes, setSelectedCodes] = useState<string[]>([]);

  useEffect(() => {
    setSelectedCodes(currentPackages && currentPackages.length > 0 ? currentPackages : ['ALL']);
  }, [currentPackages, isOpen]);

  if (!isOpen) return null;

  const togglePackage = (code: string) => {
    if (code === 'ALL') {
      if (selectedCodes.includes('ALL')) {
        setSelectedCodes([]);
      } else {
        setSelectedCodes(['ALL']);
      }
      return;
    }

    let next = selectedCodes.filter((c) => c !== 'ALL');
    if (next.includes(code)) {
      next = next.filter((c) => c !== code);
    } else {
      next.push(code);
    }
    if (next.length === 0) {
      next = ['ALL'];
    }
    setSelectedCodes(next);
  };

  const handleSelectAll = () => {
    setSelectedCodes(['ALL']);
  };

  const handleClearAll = () => {
    setSelectedCodes([]);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl shadow-xl border border-slate-200 max-w-lg w-full overflow-hidden flex flex-col">
        <div className="bg-teal-700 text-white p-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center">
              <Layers className="w-4 h-4 text-white" />
            </div>
            <div>
              <h3 className="text-sm font-extrabold">Hubungkan Parameter ke Paket MCU</h3>
              <p className="text-[11px] text-teal-100">{paramName} ({paramCode})</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-white/80 hover:text-white p-1 rounded-lg hover:bg-white/10"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <div className="flex items-center justify-between text-xs font-bold text-slate-700">
            <span>Pilih Paket Pemeriksaan:</span>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleSelectAll}
                className="text-teal-700 hover:underline text-[11px]"
              >
                Pilih Semua (ALL)
              </button>
              <span className="text-slate-300">|</span>
              <button
                type="button"
                onClick={handleClearAll}
                className="text-slate-500 hover:underline text-[11px]"
              >
                Kosongkan
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-2 max-h-60 overflow-y-auto pr-1">
            <div
              onClick={() => togglePackage('ALL')}
              className={`p-2.5 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                selectedCodes.includes('ALL')
                  ? 'bg-teal-50 border-teal-300 text-teal-950 font-bold'
                  : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100 font-medium'
              }`}
            >
              <div className="flex items-center gap-2 text-xs">
                {selectedCodes.includes('ALL') ? (
                  <CheckSquare className="w-4 h-4 text-teal-600" />
                ) : (
                  <Square className="w-4 h-4 text-slate-400" />
                )}
                <span>Semua Paket MCU (Global / ALL)</span>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded-md bg-teal-100 text-teal-800 font-mono font-bold">
                ALL
              </span>
            </div>

            {availablePackages.map((pkg) => {
              const pkgCode = pkg.kode || (pkg as any).code || '';
              const pkgName = pkg.nama || (pkg as any).name || '';
              const isChecked = selectedCodes.includes(pkgCode);
              return (
                <div
                  key={pkg.id || pkgCode}
                  onClick={() => togglePackage(pkgCode)}
                  className={`p-2.5 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                    isChecked
                      ? 'bg-teal-50 border-teal-300 text-teal-950 font-bold'
                      : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100 font-medium'
                  }`}
                >
                  <div className="flex items-center gap-2 text-xs">
                    {isChecked ? (
                      <CheckSquare className="w-4 h-4 text-teal-600" />
                    ) : (
                      <Square className="w-4 h-4 text-slate-400" />
                    )}
                    <span>{pkgName}</span>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded-md bg-slate-200 text-slate-800 font-mono font-bold">
                    {pkgCode}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1.5 text-xs font-bold text-slate-600 bg-white border border-slate-300 rounded-xl hover:bg-slate-100"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={() => onSave(selectedCodes)}
            className="px-4 py-1.5 text-xs font-bold text-white bg-teal-700 hover:bg-teal-800 rounded-xl shadow-xs flex items-center gap-1.5"
          >
            <Check className="w-4 h-4" />
            Simpan Keterkaitan Paket
          </button>
        </div>
      </div>
    </div>
  );
};
