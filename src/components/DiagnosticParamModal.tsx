import React, { useState, useEffect } from 'react';
import { X, Save, CheckSquare, Square, Tag, Layers, Stethoscope } from 'lucide-react';
import { DiagnosticExamParam, DiagnosticModality, MCUPackage } from '../types';

interface DiagnosticParamModalProps {
  isOpen: boolean;
  modality: DiagnosticModality;
  editingItem: DiagnosticExamParam | null;
  categories: string[];
  packages: MCUPackage[];
  onClose: () => void;
  onSave: (data: Omit<DiagnosticExamParam, 'id'>) => void;
}

export const DiagnosticParamModal: React.FC<DiagnosticParamModalProps> = ({
  isOpen,
  modality,
  editingItem,
  categories,
  packages,
  onClose,
  onSave,
}) => {
  const [kode, setKode] = useState('');
  const [nama, setNama] = useState('');
  const [kategori, setKategori] = useState('');
  const [tipeInput, setTipeInput] = useState<'number' | 'text' | 'select' | 'checkbox'>('text');
  const [nilaiNormal, setNilaiNormal] = useState('');
  const [satuan, setSatuan] = useState('');
  const [pilihanOpsiStr, setPilihanOpsiStr] = useState('');
  const [keterangan, setKeterangan] = useState('');
  const [selectedPaketCodes, setSelectedPaketCodes] = useState<string[]>(['ALL']);
  const [isActive, setIsActive] = useState(true);

  useEffect(() => {
    if (editingItem) {
      setKode(editingItem.kode);
      setNama(editingItem.nama);
      setKategori(editingItem.kategori);
      setTipeInput(editingItem.tipeInput);
      setNilaiNormal(editingItem.nilaiNormal);
      setSatuan(editingItem.satuan || '');
      setPilihanOpsiStr(editingItem.pilihanOpsi ? editingItem.pilihanOpsi.join(', ') : '');
      setKeterangan(editingItem.keterangan || '');
      setSelectedPaketCodes(editingItem.paketCodes && editingItem.paketCodes.length > 0 ? editingItem.paketCodes : ['ALL']);
      setIsActive(editingItem.isActive);
    } else {
      const prefixMap: Record<DiagnosticModality, string> = {
        rontgen: 'RO',
        ekg: 'EKG',
        audio: 'AUD',
        spiro: 'SPI',
        penunjang: 'PEN',
      };
      setKode(`${prefixMap[modality] || 'EXAM'}-${Date.now().toString().slice(-4)}`);
      setNama('');
      setKategori(categories[0] || 'Umum');
      setTipeInput(modality === 'audio' || modality === 'spiro' ? 'number' : 'text');
      setNilaiNormal('');
      setSatuan(
        modality === 'audio' ? 'dB' : modality === 'spiro' ? '%' : modality === 'ekg' ? 'bpm' : ''
      );
      setPilihanOpsiStr('');
      setKeterangan('');
      setSelectedPaketCodes(['ALL']);
      setIsActive(true);
    }
  }, [editingItem, modality, categories, isOpen]);

  if (!isOpen) return null;

  const togglePackage = (code: string) => {
    if (code === 'ALL') {
      if (selectedPaketCodes.includes('ALL')) {
        setSelectedPaketCodes([]);
      } else {
        setSelectedPaketCodes(['ALL']);
      }
      return;
    }

    let next = selectedPaketCodes.filter((c) => c !== 'ALL');
    if (next.includes(code)) {
      next = next.filter((c) => c !== code);
    } else {
      next.push(code);
    }
    if (next.length === 0) {
      next = ['ALL'];
    }
    setSelectedPaketCodes(next);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nama.trim() || !kode.trim()) {
      return;
    }

    const opsiList = pilihanOpsiStr
      ? pilihanOpsiStr
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean)
      : undefined;

    onSave({
      kode: kode.trim().toUpperCase(),
      nama: nama.trim(),
      modalitas: modality,
      kategori,
      tipeInput,
      nilaiNormal: nilaiNormal.trim(),
      satuan: satuan.trim() || undefined,
      pilihanOpsi: opsiList,
      keterangan: keterangan.trim() || undefined,
      paketCodes: selectedPaketCodes.length > 0 ? selectedPaketCodes : ['ALL'],
      isActive,
    });
  };

  const getModalityTitle = () => {
    switch (modality) {
      case 'rontgen':
        return 'Parameter Rontgen Thorax';
      case 'ekg':
        return 'Parameter EKG Jantung';
      case 'audio':
        return 'Parameter Audiometri (Audio)';
      case 'spiro':
        return 'Parameter Spirometri (Spiro)';
      case 'penunjang':
        return 'Parameter Penunjang (USG, Treadmill, dll)';
      default:
        return 'Parameter Pemeriksaan';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl shadow-xl border border-slate-200 max-w-2xl w-full overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-teal-700 text-white p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center">
              <Stethoscope className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-base font-extrabold tracking-tight">
                {editingItem ? 'Edit' : 'Tambah'} {getModalityTitle()}
              </h3>
              <p className="text-xs text-teal-100 mt-0.5">
                Standarisasi nilai acuan normal dan keterkaitan paket MCU
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-white/80 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-1 text-slate-800">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Kode Parameter <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={kode}
                onChange={(e) => setKode(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono font-bold focus:bg-white focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all"
                placeholder="cth: RO-CTR, EKG-HR"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Kategori Organ / Bagian <span className="text-rose-500">*</span>
              </label>
              <select
                value={kategori}
                onChange={(e) => setKategori(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold focus:bg-white focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all"
              >
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Nama Lengkap Parameter <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={nama}
              onChange={(e) => setNama(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold focus:bg-white focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all"
              placeholder="cth: Cardio-Thoracic Ratio (CTR)"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Tipe Input
              </label>
              <select
                value={tipeInput}
                onChange={(e) => setTipeInput(e.target.value as any)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold focus:bg-white focus:ring-2 focus:ring-teal-500 transition-all"
              >
                <option value="text">Teks Deskriptif</option>
                <option value="number">Angka / Nilai Kuantitatif</option>
                <option value="select">Pilihan Dropdown (Select)</option>
                <option value="checkbox">Ya / Tidak (Checkbox)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Nilai Acuan Normal <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={nilaiNormal}
                onChange={(e) => setNilaiNormal(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold focus:bg-white focus:ring-2 focus:ring-teal-500 transition-all"
                placeholder="cth: < 50%, ≤ 25 dB, Normal"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Satuan (Opsional)
              </label>
              <input
                type="text"
                value={satuan}
                onChange={(e) => setSatuan(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold focus:bg-white focus:ring-2 focus:ring-teal-500 transition-all"
                placeholder="cth: bpm, dB, %, Liter"
              />
            </div>
          </div>

          {tipeInput === 'select' && (
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Pilihan Dropdown (Pisahkan dengan tanda koma)
              </label>
              <input
                type="text"
                value={pilihanOpsiStr}
                onChange={(e) => setPilihanOpsiStr(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold focus:bg-white focus:ring-2 focus:ring-teal-500 transition-all"
                placeholder="Normal, Ringan, Sedang, Berat"
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Keterangan / Catatan Klinis K3 (Opsional)
            </label>
            <textarea
              rows={2}
              value={keterangan}
              onChange={(e) => setKeterangan(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold focus:bg-white focus:ring-2 focus:ring-teal-500 transition-all"
              placeholder="Petunjuk evaluasi atau batas rujukan"
            />
          </div>

          {/* Target MCU Package Selection */}
          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl">
            <div className="flex items-center gap-1.5 mb-2 text-xs font-bold text-slate-800">
              <Layers className="w-3.5 h-3.5 text-teal-700" />
              <span>Sertakan Parameter Ini Pada Paket MCU:</span>
            </div>

            <div className="flex flex-wrap gap-2 pt-1">
              <button
                type="button"
                onClick={() => togglePackage('ALL')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
                  selectedPaketCodes.includes('ALL')
                    ? 'bg-teal-700 text-white shadow-xs'
                    : 'bg-white border border-slate-300 text-slate-600 hover:bg-slate-100'
                }`}
              >
                {selectedPaketCodes.includes('ALL') ? (
                  <CheckSquare className="w-3.5 h-3.5" />
                ) : (
                  <Square className="w-3.5 h-3.5" />
                )}
                Semua Paket (ALL)
              </button>

              {packages.map((pkg) => {
                const pkgCode = pkg.kode || (pkg as any).code || '';
                const pkgName = pkg.nama || (pkg as any).name || '';
                const isSelected = selectedPaketCodes.includes(pkgCode);
                return (
                  <button
                    key={pkg.id || pkgCode}
                    type="button"
                    onClick={() => togglePackage(pkgCode)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
                      isSelected
                        ? 'bg-teal-600 text-white shadow-xs'
                        : 'bg-white border border-slate-300 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    {isSelected ? (
                      <CheckSquare className="w-3.5 h-3.5" />
                    ) : (
                      <Square className="w-3.5 h-3.5" />
                    )}
                    {pkgCode} - {pkgName}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Active status */}
          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="param-is-active"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              className="w-4 h-4 text-teal-600 rounded-sm border-slate-300 focus:ring-teal-500"
            />
            <label htmlFor="param-is-active" className="text-xs font-bold text-slate-700 cursor-pointer">
              Parameter Aktif (Tampil dalam form pemeriksaan dan cetak buku MCU)
            </label>
          </div>

          {/* Submit Actions */}
          <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-slate-600 bg-white border border-slate-300 rounded-xl hover:bg-slate-50 transition-all"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-bold text-white bg-teal-700 hover:bg-teal-800 rounded-xl shadow-xs transition-all flex items-center gap-1.5"
            >
              <Save className="w-4 h-4" />
              {editingItem ? 'Simpan Perubahan' : 'Tambah Parameter'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
