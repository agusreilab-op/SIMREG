import React, { useState, useRef } from 'react';
import {
  Upload,
  FileSpreadsheet,
  Download,
  ClipboardPaste,
  CheckCircle2,
  AlertTriangle,
  X,
  Check,
  AlertCircle,
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { PhysicalExamParam, PhysicalParamCategory, MCUPackage } from '../types';

interface ImportPhysicalParamsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (params: PhysicalExamParam[], mode: 'upsert' | 'append' | 'replace') => void;
  onDownloadTemplate: () => void;
  availablePackages?: MCUPackage[];
}

const PHYSICAL_CATEGORIES: PhysicalParamCategory[] = [
  'Tanda Vital',
  'Antropometri',
  'Mata & Penglihatan',
  'Kepala & Leher',
  'THT',
  'Gigi & Mulut',
  'Thorax & Jantung',
  'Paru-paru',
  'Abdomen',
  'Ekstremitas & Kulit',
  'Neurologis & Refleks',
];

export const ImportPhysicalParamsModal: React.FC<ImportPhysicalParamsModalProps> = ({
  isOpen,
  onClose,
  onImport,
  onDownloadTemplate,
}) => {
  const [activeTab, setActiveTab] = useState<'upload' | 'paste'>('upload');
  const [pasteText, setPasteText] = useState('');
  const [fileName, setFileName] = useState('');
  const [parsedRows, setParsedRows] = useState<PhysicalExamParam[]>([]);
  const [importMode, setImportMode] = useState<'upsert' | 'append' | 'replace'>('upsert');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const mapRowToPhysicalParam = (row: any, index: number): PhysicalExamParam | null => {
    const getVal = (...keys: string[]): string => {
      for (const key of keys) {
        for (const rKey of Object.keys(row)) {
          if (rKey.trim().toLowerCase() === key.toLowerCase()) {
            const val = row[rKey];
            return val !== undefined && val !== null ? String(val).trim() : '';
          }
        }
      }
      return '';
    };

    const nama = getVal('Nama Parameter', 'Nama', 'Parameter', 'Nama Pemeriksaan');
    if (!nama) return null;

    const kode = getVal('Kode Parameter', 'Kode', 'ID') || `FIS-${String(index + 1).padStart(3, '0')}`;

    const kategoriRaw = getVal('Kategori Organ', 'Kategori', 'Organ');
    let kategori: PhysicalParamCategory = 'Tanda Vital';
    const foundCat = PHYSICAL_CATEGORIES.find(
      (c) => c.toLowerCase() === kategoriRaw.toLowerCase()
    );
    if (foundCat) {
      kategori = foundCat;
    } else {
      const partial = PHYSICAL_CATEGORIES.find(
        (c) =>
          c.toLowerCase().includes(kategoriRaw.toLowerCase()) ||
          kategoriRaw.toLowerCase().includes(c.toLowerCase())
      );
      if (partial) kategori = partial;
    }

    const targetPaketRaw = getVal('Target Kode Paket', 'Target Paket', 'Kode Paket', 'Paket');
    const paketCodes = targetPaketRaw
      ? targetPaketRaw.split(/[,;/]+/).map((s) => s.trim().toUpperCase()).filter(Boolean)
      : ['ALL'];

    const tipeInputRaw = getVal('Tipe Input', 'Tipe').toLowerCase();
    let tipeInput: 'text' | 'number' | 'select' | 'checkbox' = 'text';
    if (tipeInputRaw.includes('num') || tipeInputRaw.includes('angka')) tipeInput = 'number';
    else if (tipeInputRaw.includes('sel') || tipeInputRaw.includes('opsi') || tipeInputRaw.includes('pilihan')) tipeInput = 'select';
    else if (tipeInputRaw.includes('check') || tipeInputRaw.includes('centang')) tipeInput = 'checkbox';

    const nilaiNormal = getVal('Nilai Acuan / Normal', 'Nilai Normal', 'Nilai Acuan', 'Normal') || 'Dalam Batas Normal';
    const satuan = getVal('Satuan', 'Unit');
    const opsiRaw = getVal('Pilihan Opsi', 'Opsi', 'Pilihan');
    const pilihanOpsi = opsiRaw ? opsiRaw.split(/[,;/]+/).map((s) => s.trim()).filter(Boolean) : undefined;
    const keterangan = getVal('Keterangan', 'Catatan', 'Deskripsi');
    const statusRaw = getVal('Status').toLowerCase();
    const isActive = statusRaw === 'nonaktif' || statusRaw === 'false' || statusRaw === '0' ? false : true;

    return {
      id: `imp-fis-${Date.now()}-${index}`,
      kode,
      nama,
      kategori,
      paketCodes,
      tipeInput,
      nilaiNormal,
      satuan,
      pilihanOpsi,
      keterangan,
      isActive,
    };
  };

  const processDataRows = (rawRows: any[]) => {
    if (!rawRows || rawRows.length === 0) {
      setErrorMsg('File atau teks tidak memiliki baris data.');
      setParsedRows([]);
      return;
    }

    const mapped: PhysicalExamParam[] = [];
    rawRows.forEach((row, i) => {
      const item = mapRowToPhysicalParam(row, i);
      if (item) mapped.push(item);
    });

    if (mapped.length === 0) {
      setErrorMsg('Tidak dapat menemukan data parameter fisik yang valid. Pastikan header kolom sesuai template (Nama Parameter, Kode, Kategori Organ, Target Kode Paket, Nilai Acuan / Normal).');
      setParsedRows([]);
      return;
    }

    setErrorMsg(null);
    setParsedRows(mapped);
  };

  const handleFileUpload = (file: File) => {
    setErrorMsg(null);
    setFileName(file.name);
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { defval: '' });
        processDataRows(jsonData);
      } catch (err) {
        console.error(err);
        setErrorMsg('Gagal membaca file Excel. Pastikan file valid (.xlsx, .xls, .csv).');
      }
    };

    reader.onerror = () => {
      setErrorMsg('Terjadi kesalahan saat membaca file.');
    };

    reader.readAsArrayBuffer(file);
  };

  const handlePasteProcess = () => {
    if (!pasteText.trim()) {
      setErrorMsg('Silakan tempel baris data dari spreadsheet terlebih dahulu.');
      return;
    }

    const lines = pasteText.trim().split('\n').map((l) => l.trim()).filter(Boolean);
    if (lines.length < 2) {
      setErrorMsg('Data tempelan harus berisi minimal 1 baris header dan 1 baris data.');
      return;
    }

    const delimiter = lines[0].includes('\t') ? '\t' : lines[0].includes(';') ? ';' : ',';
    const headers = lines[0].split(delimiter).map((h) => h.trim().replace(/^["']|["']$/g, ''));
    const rows: any[] = [];

    for (let i = 1; i < lines.length; i++) {
      const cols = lines[i].split(delimiter).map((c) => c.trim().replace(/^["']|["']$/g, ''));
      const obj: any = {};
      headers.forEach((h, idx) => {
        obj[h] = cols[idx] || '';
      });
      rows.push(obj);
    }

    processDataRows(rows);
  };

  const handleConfirmImport = () => {
    if (parsedRows.length === 0) return;
    onImport(parsedRows, importMode);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-4 px-6 bg-gradient-to-r from-teal-900 to-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-teal-500/20 border border-teal-400/30 flex items-center justify-center text-teal-300">
              <Upload className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-base flex items-center gap-2">
                Import Parameter Pemeriksaan Fisik
              </h3>
              <p className="text-xs text-teal-200">
                Unggah spreadsheet Excel atau tempel data dengan kolom tabel terstandarisasi
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-teal-200 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1 text-xs">
          {/* Action Ribbon: Download Template */}
          <div className="p-3.5 bg-teal-50/80 border border-teal-200 rounded-xl flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <FileSpreadsheet className="w-5 h-5 text-teal-700 shrink-0" />
              <div>
                <span className="font-bold text-teal-900">Format Template Import Excel</span>
                <p className="text-[11px] text-teal-700">
                  Header: No, Kode Parameter, Nama Parameter, Kategori Organ, Target Kode Paket, Tipe Input, Nilai Acuan / Normal, Satuan, Status
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onDownloadTemplate}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-teal-700 hover:bg-teal-800 text-white font-bold rounded-lg shadow-xs transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              Download Template Excel (.xlsx)
            </button>
          </div>

          {/* Tab Selector */}
          <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
            <button
              type="button"
              onClick={() => setActiveTab('upload')}
              className={`px-4 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition-all ${
                activeTab === 'upload'
                  ? 'bg-teal-100 text-teal-900 border border-teal-200'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <Upload className="w-3.5 h-3.5" />
              Upload File Excel (.xlsx / .csv)
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('paste')}
              className={`px-4 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition-all ${
                activeTab === 'paste'
                  ? 'bg-teal-100 text-teal-900 border border-teal-200'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <ClipboardPaste className="w-3.5 h-3.5" />
              Tempel dari Spreadsheet
            </button>
          </div>

          {/* Tab 1: Upload */}
          {activeTab === 'upload' && (
            <div>
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx, .xls, .csv"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleFileUpload(file);
                }}
              />
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragging(true);
                }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setIsDragging(false);
                  const file = e.dataTransfer.files?.[0];
                  if (file) handleFileUpload(file);
                }}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all ${
                  isDragging
                    ? 'border-teal-500 bg-teal-50'
                    : 'border-slate-300 hover:border-teal-400 bg-slate-50/50 hover:bg-slate-50'
                }`}
              >
                <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-teal-100 text-teal-700 flex items-center justify-center">
                  <Upload className="w-6 h-6" />
                </div>
                <div className="font-bold text-slate-800 text-sm mb-1">
                  {fileName ? `File terpilih: ${fileName}` : 'Klik atau seret file Excel ke sini'}
                </div>
                <div className="text-[11px] text-slate-500">
                  Mendukung file berekstensi .xlsx, .xls, atau .csv dengan header tabel standar
                </div>
              </div>
            </div>
          )}

          {/* Tab 2: Paste */}
          {activeTab === 'paste' && (
            <div className="space-y-3">
              <textarea
                value={pasteText}
                onChange={(e) => setPasteText(e.target.value)}
                placeholder="Salin baris dari Excel / Google Sheets termasuk baris judul kolom lalu tempel di sini..."
                rows={5}
                className="w-full p-3 font-mono text-xs bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={handlePasteProcess}
                  className="px-4 py-1.5 bg-teal-700 hover:bg-teal-800 text-white font-bold rounded-lg shadow-xs"
                >
                  Analisis Teks Tempelan
                </button>
              </div>
            </div>
          )}

          {/* Error Banner */}
          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl flex items-center gap-2 font-medium">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Preview Table */}
          {parsedRows.length > 0 && (
            <div className="space-y-3 pt-2">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 pb-2">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span className="font-extrabold text-slate-800">
                    Preview Data ({parsedRows.length} Parameter Terdeteksi)
                  </span>
                </div>

                {/* Import Mode Selector */}
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-600">Metode Import:</span>
                  <select
                    value={importMode}
                    onChange={(e) => setImportMode(e.target.value as any)}
                    className="px-2.5 py-1 bg-white border border-slate-300 rounded-lg text-xs font-semibold text-slate-800"
                  >
                    <option value="upsert">Perbarui jika kode sama, tambah baru (Upsert)</option>
                    <option value="append">Hanya tambah data baru (Abaikan kode duplikat)</option>
                    <option value="replace">Ganti seluruh parameter yang ada</option>
                  </select>
                </div>
              </div>

              <div className="max-h-60 overflow-y-auto border border-slate-200 rounded-xl">
                <table className="w-full text-left border-collapse text-[11px]">
                  <thead className="bg-slate-100 text-slate-700 font-bold sticky top-0 border-b border-slate-200">
                    <tr>
                      <th className="py-2 px-2.5 w-10 text-center">No</th>
                      <th className="py-2 px-2.5 w-24">Kode</th>
                      <th className="py-2 px-2.5 min-w-[140px]">Nama Parameter</th>
                      <th className="py-2 px-2.5 w-32">Kategori</th>
                      <th className="py-2 px-2.5 w-28">Target Paket</th>
                      <th className="py-2 px-2.5 min-w-[150px]">Nilai Normal</th>
                      <th className="py-2 px-2.5 w-16">Satuan</th>
                      <th className="py-2 px-2.5 w-16 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {parsedRows.map((row, idx) => (
                      <tr key={idx} className="hover:bg-teal-50/50">
                        <td className="py-1.5 px-2.5 text-center text-slate-400">{idx + 1}</td>
                        <td className="py-1.5 px-2.5 font-mono font-bold text-teal-800">{row.kode}</td>
                        <td className="py-1.5 px-2.5 font-bold text-slate-800">{row.nama}</td>
                        <td className="py-1.5 px-2.5 text-slate-600">{row.kategori}</td>
                        <td className="py-1.5 px-2.5">
                          <span className="px-1.5 py-0.5 rounded bg-amber-50 border border-amber-200 text-amber-800 font-mono text-[10px] font-bold">
                            {row.paketCodes && row.paketCodes.length > 0 ? row.paketCodes.join(', ') : 'ALL'}
                          </span>
                        </td>
                        <td className="py-1.5 px-2.5 text-slate-700 truncate max-w-[180px]">{row.nilaiNormal}</td>
                        <td className="py-1.5 px-2.5 text-slate-500 font-semibold">{row.satuan || '-'}</td>
                        <td className="py-1.5 px-2.5 text-center">
                          <span
                            className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                              row.isActive ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'
                            }`}
                          >
                            {row.isActive ? 'Aktif' : 'Nonaktif'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 px-6 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
          <div className="text-slate-500 text-xs">
            {parsedRows.length > 0 ? (
              <span className="font-semibold text-teal-800">
                Siap mengimpor {parsedRows.length} parameter ke master sistem
              </span>
            ) : (
              <span>Unggah file atau tempel teks untuk memulai</span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-300 rounded-xl font-bold text-slate-600 hover:bg-slate-100 transition-colors"
            >
              Batal
            </button>
            <button
              type="button"
              disabled={parsedRows.length === 0}
              onClick={handleConfirmImport}
              className={`px-5 py-2 rounded-xl font-bold text-white shadow-xs flex items-center gap-1.5 transition-all ${
                parsedRows.length > 0
                  ? 'bg-teal-700 hover:bg-teal-800 cursor-pointer'
                  : 'bg-slate-300 cursor-not-allowed'
              }`}
            >
              <Check className="w-4 h-4" />
              Proses Import ({parsedRows.length})
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
