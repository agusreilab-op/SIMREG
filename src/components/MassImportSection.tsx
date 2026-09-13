import React, { useState } from 'react';
import {
  FileSpreadsheet,
  Download,
  Upload,
  CheckCircle2,
  AlertCircle,
  Clock,
  UserCheck,
  Hash,
  Sparkles,
  Calendar,
  FileText,
  Copy,
  ChevronRight,
  Eye,
} from 'lucide-react';
import { AttendanceRecord, Company } from '../types';
import { getCompanyInitial3 } from '../utils/mrNumber';

interface MassImportSectionProps {
  companies: Company[];
  attendanceList: AttendanceRecord[];
  onBulkAddPatients: (patients: AttendanceRecord[]) => void;
  onNotify: (msg: string) => void;
  onNavigateToForm: () => void;
}

// 11 Required Column Headers as requested by the user:
export const REQUIRED_EXCEL_HEADERS = [
  'kode PT',
  'Wilayah MCU',
  'NIK Karyawan',
  'nama karyawan',
  'tgl lahir',
  'jenis kelamin',
  'departemen',
  'bagian',
  'jabatan',
  'paket pemeriksaan',
  'kode paket',
] as const;

export interface ParsedImportRow {
  kodePt: string;
  wilayah: string;
  nik: string;
  nama: string;
  tglLahir: string;
  jk: 'Pria' | 'Wanita';
  dept: string;
  bagian: string;
  jabatan: string;
  paketPemeriksaan: string;
  kodePaket: string;
  // Generated fields:
  mcuNoAuto: string;
  tglJamAuto: string;
  jamAuto: string;
  usiaAutoText: string;
  usiaThn: number;
}

// Function to calculate exact age
function calculateAge(birthDateStr: string) {
  if (!birthDateStr) return { text: '-', years: 0 };
  let birth: Date;
  if (/^\d{2}[-/]\d{2}[-/]\d{4}$/.test(birthDateStr)) {
    const parts = birthDateStr.split(/[-/]/);
    birth = new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
  } else {
    birth = new Date(birthDateStr);
  }
  if (isNaN(birth.getTime())) return { text: '-', years: 0 };
  const today = new Date();

  let years = today.getFullYear() - birth.getFullYear();
  let months = today.getMonth() - birth.getMonth();
  let days = today.getDate() - birth.getDate();

  if (days < 0) {
    months--;
    const prevMonth = new Date(today.getFullYear(), today.getMonth(), 0);
    days += prevMonth.getDate();
  }
  if (months < 0) {
    years--;
    months += 12;
  }
  return {
    text: `${Math.max(0, years)} Thn ${Math.max(0, months)} Bln ${Math.max(0, days)} Hari`,
    years: Math.max(0, years),
  };
}

export function getStartingMcuNumber(attendanceList: AttendanceRecord[]): number {
  if (!attendanceList || attendanceList.length === 0) return 101;
  let max = 0;
  for (const item of attendanceList) {
    const num = parseInt(item.mcuNo.replace(/\D/g, ''), 10);
    if (!isNaN(num) && num > max) {
      max = num;
    }
  }
  return max > 0 ? max + 1 : attendanceList.length + 101;
}

const SAMPLE_CSV_DATA = [
  'kode PT,Wilayah MCU,NIK Karyawan,nama karyawan,tgl lahir,jenis kelamin,departemen,bagian,jabatan,paket pemeriksaan,kode paket',
  'KODE_PT,PUSAT,3201234567890001,NAMA KARYAWAN 1,1992-04-15,Pria,PRODUKSI,OPERATOR,Staff Lapangan,Paket Standard MCU,PAKET-STD',
  'KODE_PT,PUSAT,3201234567890002,NAMA KARYAWAN 2,1995-08-20,Wanita,FINANCE,ACCOUNTING,Staff Keuangan,Paket Basic MCU,PAKET-BASIC',
].join('\n');

export const MassImportSection: React.FC<MassImportSectionProps> = ({
  companies,
  attendanceList,
  onBulkAddPatients,
  onNotify,
  onNavigateToForm,
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [parsedRows, setParsedRows] = useState<ParsedImportRow[]>([]);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [showDataPreview, setShowDataPreview] = useState<boolean>(true);
  const [defaultStatus, setDefaultStatus] = useState<'Hadir' | 'Belum Hadir'>('Belum Hadir');

  // Starting MCU number
  const initialNextMcu = getStartingMcuNumber(attendanceList);
  const [startMcuNo, setStartMcuNo] = useState<number>(initialNextMcu);

  // Helper to parse CSV / Tab delimited text
  const parseSpreadsheetText = (text: string, baseMcuNo: number) => {
    setPreviewError(null);
    try {
      const lines = text
        .split(/\r?\n/)
        .map((l) => l.trim())
        .filter((l) => l.length > 0);

      if (lines.length < 2) {
        setPreviewError('File tidak memiliki baris data atau baris header kosong.');
        return [];
      }

      // Detect delimiter (, or ; or \t)
      const firstLine = lines[0];
      let delimiter = ',';
      if (firstLine.includes('\t')) delimiter = '\t';
      else if (firstLine.includes(';')) delimiter = ';';

      const headers = firstLine.split(delimiter).map((h) => h.replace(/^["']|["']$/g, '').trim().toLowerCase());

      // Helper to find header index
      const findIndex = (searchTerms: string[]) => {
        return headers.findIndex((h) =>
          searchTerms.some((term) => h === term.toLowerCase() || h.includes(term.toLowerCase()))
        );
      };

      const idxKodePt = findIndex(['kode pt', 'kode_pt', 'kd pt']);
      const idxWilayah = findIndex(['wilayah mcu', 'wilayah', 'lokasi']);
      const idxNik = findIndex(['nik karyawan', 'nik', 'no id', 'nip']);
      const idxNama = findIndex(['nama karyawan', 'nama', 'nama peserta']);
      const idxTglLahir = findIndex(['tgl lahir', 'tanggal lahir', 'birthdate']);
      const idxJk = findIndex(['jenis kelamin', 'jk', 'gender']);
      const idxDept = findIndex(['departemen', 'dept']);
      const idxBagian = findIndex(['bagian', 'unit', 'divisi']);
      const idxJabatan = findIndex(['jabatan', 'posisi']);
      const idxPaket = findIndex(['paket pemeriksaan', 'paket mcu', 'paket']);
      const idxKodePaket = findIndex(['kode paket', 'kd paket']);

      const now = new Date();
      const tglFormatted = `${String(now.getDate()).padStart(2, '0')}-${String(
        now.getMonth() + 1
      ).padStart(2, '0')}-${now.getFullYear()}`;

      const rows: ParsedImportRow[] = [];
      let currentMcu = baseMcuNo;

      // Base time calculation starting from now
      let baseHour = now.getHours();
      let baseMin = now.getMinutes();

      for (let i = 1; i < lines.length; i++) {
        const line = lines[i];
        if (!line) continue;
        const cols = line.split(delimiter).map((c) => c.replace(/^["']|["']$/g, '').trim());

        const getCol = (idx: number, fallback = '') =>
          idx >= 0 && cols[idx] !== undefined ? cols[idx] : fallback;

        const nama = getCol(idxNama, cols[3] || '');
        if (!nama) continue; // Skip empty rows

        const kodePt = getCol(idxKodePt, cols[0] || 'PAN');
        const wilayah = getCol(idxWilayah, cols[1] || 'TNG');
        const nik = getCol(idxNik, cols[2] || '');
        const tglLahir = getCol(idxTglLahir, cols[4] || '1990-01-01');
        const rawJk = getCol(idxJk, cols[5] || 'Pria');
        const jk: 'Pria' | 'Wanita' =
          rawJk.toLowerCase().startsWith('w') || rawJk.toLowerCase().startsWith('pemb')
            ? 'Wanita'
            : 'Pria';
        const dept = getCol(idxDept, cols[6] || 'PRODUKSI');
        const bagian = getCol(idxBagian, cols[7] || '');
        const jabatan = getCol(idxJabatan, cols[8] || 'Staff');
        const paketPemeriksaan = getCol(
          idxPaket,
          cols[9] || 'Paket Standar MCU'
        );
        const kodePaket = getCol(idxKodePaket, cols[10] || 'PAKET-STD');

        // Otomatis Nomor Medical Record (MR) / MCU
        // Struktur: [3 Digit Inisial Perusahaan] - [Tahun] - [Nomor Urut Peserta]
        const companyInitial = getCompanyInitial3(kodePt || 'UMUM', companies);
        const yearCurrent = new Date().getFullYear();
        const mcuNoAuto = `${companyInitial}-${yearCurrent}-${String(currentMcu).padStart(3, '0')}`;
        currentMcu++;

        // Otomatis Jam dengan interval realistis 1-2 menit
        const minuteOffset = (i - 1) * 2;
        const calcMin = (baseMin + minuteOffset) % 60;
        const calcHour = (baseHour + Math.floor((baseMin + minuteOffset) / 60)) % 24;
        const jamAuto = `${String(calcHour).padStart(2, '0')}:${String(calcMin).padStart(2, '0')}:${String((i * 17) % 60).padStart(2, '0')}`;
        const tglJamAuto = `${tglFormatted} ${jamAuto}`;

        // Otomatis Usia
        const ageCalc = calculateAge(tglLahir);

        rows.push({
          kodePt: kodePt.toUpperCase(),
          wilayah: wilayah.toUpperCase(),
          nik,
          nama: nama.toUpperCase(),
          tglLahir,
          jk,
          dept: dept.toUpperCase(),
          bagian: bagian.toUpperCase(),
          jabatan,
          paketPemeriksaan,
          kodePaket: kodePaket.toUpperCase(),
          mcuNoAuto,
          tglJamAuto,
          jamAuto,
          usiaAutoText: ageCalc.text,
          usiaThn: ageCalc.years,
        });
      }

      return rows;
    } catch (err: any) {
      setPreviewError(`Gagal membaca berkas: ${err.message || 'Format tidak dikenali'}`);
      return [];
    }
  };

  // Handle file input
  const handleFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSelectedFile(file);
    const reader = new FileReader();

    reader.onload = (evt) => {
      const content = evt.target?.result as string;
      if (content) {
        const rows = parseSpreadsheetText(content, startMcuNo);
        setParsedRows(rows);
        if (rows.length > 0) {
          onNotify(`Berhasil membaca ${rows.length} data peserta dari ${file.name}`);
        }
      }
    };

    reader.onerror = () => {
      setPreviewError('Gagal membaca file dari komputer Anda.');
    };

    reader.readAsText(file);
  };

  // Load sample dataset
  const handleLoadSample = () => {
    const rows = parseSpreadsheetText(SAMPLE_CSV_DATA, startMcuNo);
    setParsedRows(rows);
    setSelectedFile(null);
    onNotify('5 data contoh peserta berhasil dimuat untuk simulasi impor.');
  };

  // Download official CSV template
  const handleDownloadTemplate = () => {
    // Add BOM for Microsoft Excel UTF-8 recognition
    const bom = '\uFEFF';
    const csvContent = bom + SAMPLE_CSV_DATA;
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'Template_Registrasi_MCU_Onsite.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    onNotify('Template Excel Registrasi MCU Onsite berhasil diunduh!');
  };

  // Execute bulk import
  const handleExecuteImport = () => {
    if (parsedRows.length === 0) {
      onNotify('Belum ada data peserta yang siap diimpor. Silakan muat file terlebih dahulu.');
      return;
    }

    setIsProcessing(true);

    setTimeout(() => {
      const newAttendanceRecords: AttendanceRecord[] = parsedRows.map((row, index) => {
        // Resolve company name from kodePt
        const comp = companies.find((c) => c.kode === row.kodePt);
        const ptNama = comp ? comp.nama : `PT. ${row.kodePt}`;

        return {
          no: attendanceList.length + index + 1,
          mcuNo: row.mcuNoAuto,
          nama: row.nama,
          jk: row.jk,
          tglLahir: row.tglLahir,
          pt: ptNama,
          kodePt: row.kodePt,
          wilayah: row.wilayah,
          dept: row.dept,
          bagian: row.bagian,
          jabatan: row.jabatan,
          nik: row.nik,
          paket: row.kodePaket || 'PAKET-STD',
          kodePaket: row.kodePaket,
          keteranganPaket: row.paketPemeriksaan,
          tglMcu: row.tglJamAuto.split(' ')[0],
          tglInput: row.tglJamAuto.split(' ')[0],
          status: defaultStatus,
          sudahMcu: defaultStatus === 'Hadir',
          jam: row.jamAuto,
        };
      });

      onBulkAddPatients(newAttendanceRecords);
      setIsProcessing(false);
      onNotify(
        `Sukses! ${newAttendanceRecords.length} peserta MCU Onsite berhasil didaftarkan dengan No. MCU ${parsedRows[0].mcuNoAuto} - ${parsedRows[parsedRows.length - 1].mcuNoAuto}.`
      );
      // Navigate to form view
      onNavigateToForm();
    }, 400);
  };

  return (
    <div className="space-y-6">
      {/* Overview Banner Card */}
      <div className="bg-gradient-to-r from-[#0F172A] via-[#1E293B] to-[#0E7490] text-white rounded-2xl p-6 shadow-md border border-slate-700">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-cyan-400/20 text-cyan-300 text-[12px] font-bold border border-cyan-400/30">
              <Sparkles className="w-3.5 h-3.5" />
              Sesuai Format Formulir MCU Onsite
            </div>
            <h3 className="text-[20px] font-extrabold tracking-tight">
              Impor Massal Spreadsheet Peserta MCU
            </h3>
            <p className="text-[13px] text-slate-300 max-w-2xl">
              Unggah berkas Excel / CSV dengan 11 kolom baku. Sistem akan secara <b>otomatis</b> memberikan{' '}
              <b>Nomor MCU berurutan</b>, merekam <b>Tanggal & Jam kedatangan otomatis</b>, serta{' '}
              <b>menghitung Usia (Tahun, Bulan, Hari)</b> peserta secara presisi.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleDownloadTemplate}
              className="px-4 py-2.5 rounded-xl bg-white text-[#0F172A] text-[13px] font-bold hover:bg-slate-100 flex items-center gap-2 shadow-sm transition-all"
            >
              <Download className="w-4 h-4 text-[#0E7490]" />
              Unduh Template Excel (.CSV)
            </button>
          </div>
        </div>
      </div>

      {/* 11 Required Column Badges Checklist */}
      <div className="bg-white border border-[#E2E8F0] rounded-2xl p-5 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-[13.5px] font-bold text-[#0F172A] flex items-center gap-2">
            <FileSpreadsheet className="w-4 h-4 text-[#0E7490]" />
            11 Kolom Header Wajib Sesuai Formulir Registrasi MCU Onsite:
          </h4>
          <span className="text-[12px] text-[#64748B]">Urutan kolom fleksibel / otomatis terpetakan</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
          {REQUIRED_EXCEL_HEADERS.map((hdr, idx) => (
            <div
              key={hdr}
              className="p-2.5 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] flex flex-col justify-center"
            >
              <div className="flex items-center gap-1.5 text-[11px] font-bold text-[#64748B]">
                <span className="w-4 h-4 rounded-full bg-[#E2E8F0] text-[#475569] flex items-center justify-center text-[10px]">
                  {idx + 1}
                </span>
                Kolom {idx + 1}
              </div>
              <div className="font-bold text-[12.5px] text-[#0F172A] mt-0.5 capitalize">
                {hdr}
              </div>
            </div>
          ))}
        </div>

        <div className="p-3 bg-cyan-50 border border-cyan-200 rounded-xl flex flex-wrap items-center justify-between gap-2 text-[12.5px] text-cyan-900">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-cyan-700 shrink-0" />
            <span>
              <b>Sistem Otomatis:</b> No. MCU (urutan kedatangan), Tanggal & Jam MCU (waktu registrasi), dan Usia peserta dihitung otomatis saat diproses.
            </span>
          </div>
          <button
            type="button"
            onClick={handleLoadSample}
            className="px-3 py-1 rounded-lg bg-cyan-700 text-white font-bold text-[12px] hover:bg-cyan-800 transition-colors shadow-xs"
          >
            Muat Contoh 5 Peserta
          </button>
        </div>
      </div>

      {/* Upload Box and Settings */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Drag & Drop File Upload Box */}
        <div className="lg:col-span-2 bg-white border border-[#E2E8F0] rounded-2xl p-6 shadow-xs space-y-4">
          <h4 className="text-[14px] font-bold text-[#0F172A] flex items-center gap-2">
            <Upload className="w-4 h-4 text-[#0E7490]" />
            Pilih Berkas Spreadsheet Klien
          </h4>

          <div className="border-2 border-dashed border-[#CBD5E1] hover:border-[#0E7490] rounded-2xl p-8 text-center bg-[#F8FAFC] transition-colors cursor-pointer relative group">
            <input
              type="file"
              accept=".csv,.txt,.xlsx,.xls"
              onChange={handleFileSelected}
              className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10"
            />
            <div className="w-14 h-14 rounded-2xl bg-cyan-100 text-[#0E7490] flex items-center justify-center mx-auto mb-3 group-hover:scale-105 transition-transform">
              <Upload className="w-7 h-7" />
            </div>
            <h5 className="text-[14px] font-bold text-[#0F172A] mb-1">
              {selectedFile ? selectedFile.name : 'Tarik dan letakkan file Excel / CSV di sini'}
            </h5>
            <p className="text-[12px] text-[#64748B]">
              Atau klik untuk menelusuri dari folder komputer Anda (.csv, .xlsx, .xls)
            </p>
          </div>

          {previewError && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-[12.5px] flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{previewError}</span>
            </div>
          )}
        </div>

        {/* Automation Settings Card */}
        <div className="bg-white border border-[#E2E8F0] rounded-2xl p-6 shadow-xs space-y-4 flex flex-col justify-between">
          <div>
            <h4 className="text-[14px] font-bold text-[#0F172A] flex items-center gap-2 mb-3">
              <Clock className="w-4 h-4 text-[#0E7490]" />
              Pengaturan Otomatisasi Antrean
            </h4>

            <div className="space-y-3.5">
              <div>
                <label className="block text-[12px] font-bold text-[#475569] mb-1">
                  Nomor MCU Awal (Urutan Daftar)
                </label>
                <div className="relative">
                  <Hash className="w-4 h-4 text-[#94A3B8] absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="number"
                    value={startMcuNo}
                    onChange={(e) => {
                      const val = parseInt(e.target.value) || 1;
                      setStartMcuNo(val);
                      if (selectedFile) {
                        // Re-parse with new start number
                        const reader = new FileReader();
                        reader.onload = (evt) => {
                          const content = evt.target?.result as string;
                          if (content) {
                            setParsedRows(parseSpreadsheetText(content, val));
                          }
                        };
                        reader.readAsText(selectedFile);
                      } else if (parsedRows.length > 0) {
                        setParsedRows(parseSpreadsheetText(SAMPLE_CSV_DATA, val));
                      }
                    }}
                    className="w-full pl-9 pr-3 py-2 bg-white border border-[#CBD5E1] rounded-xl text-[13px] font-bold text-[#0F172A]"
                  />
                </div>
                <p className="text-[11px] text-[#64748B] mt-1">
                  Nomor berikutnya otomatis dihitung (+1 per peserta).
                </p>
              </div>

              <div>
                <label className="block text-[12px] font-bold text-[#475569] mb-1">
                  Status Kehadiran Default
                </label>
                <select
                  value={defaultStatus}
                  onChange={(e) => setDefaultStatus(e.target.value as any)}
                  className="w-full px-3 py-2 bg-white border border-[#CBD5E1] rounded-xl text-[13px] font-bold text-[#0F172A]"
                >
                  <option value="Belum Hadir">Belum Hadir (Pra-Registrasi)</option>
                  <option value="Hadir">Hadir (Registrasi Langsung di Meja)</option>
                </select>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-[#E2E8F0]">
            <button
              type="button"
              disabled={parsedRows.length === 0 || isProcessing}
              onClick={handleExecuteImport}
              className="w-full py-3 px-4 bg-gradient-to-r from-[#0E7490] to-[#0891B2] hover:opacity-95 text-white text-[13.5px] font-extrabold rounded-xl shadow-md shadow-cyan-700/20 flex items-center justify-center gap-2 disabled:opacity-40 transition-all"
            >
              <CheckCircle2 className="w-4 h-4" />
              {isProcessing
                ? 'Memproses Impor...'
                : `Proses Impor (${parsedRows.length} Peserta)`}
            </button>
          </div>
        </div>
      </div>

      {/* Live Preview Table of Parsed Rows */}
      {parsedRows.length > 0 && (
        <div className="bg-white border border-[#E2E8F0] rounded-2xl p-6 shadow-xs space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#E2E8F0] pb-3">
            <div className="flex items-center gap-2">
              <Eye className="w-5 h-5 text-[#0E7490]" />
              <h4 className="text-[15px] font-bold text-[#0F172A]">
                Pratinjau Data Peserta yang Siap Diimpor ({parsedRows.length} Baris)
              </h4>
            </div>
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full text-[12px] font-bold bg-[#DCFCE7] text-[#15803D] border border-[#86EFAC] flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> Siap Diimpor
              </span>
              <span className="px-3 py-1 rounded-full text-[12px] font-bold bg-cyan-50 text-cyan-800 border border-cyan-200">
                Range MCU: {parsedRows[0].mcuNoAuto} - {parsedRows[parsedRows.length - 1].mcuNoAuto}
              </span>
            </div>
          </div>

          <div className="overflow-x-auto border border-[#E2E8F0] rounded-xl shadow-xs max-h-[420px] overflow-y-auto">
            <table className="w-full text-left text-[12.5px] min-w-[1100px]">
              <thead className="sticky top-0 bg-[#F1F5F9] z-10 border-b border-[#CBD5E1]">
                <tr className="text-[#334155] font-bold">
                  <th className="py-2.5 px-3 w-10 text-center">No</th>
                  <th className="py-2.5 px-3 bg-cyan-100/70 text-[#0E7490]">
                    No. MCU (Auto)
                  </th>
                  <th className="py-2.5 px-3">Kode PT</th>
                  <th className="py-2.5 px-3">Wilayah</th>
                  <th className="py-2.5 px-3">NIK</th>
                  <th className="py-2.5 px-3">Nama Karyawan</th>
                  <th className="py-2.5 px-3">Tgl Lahir</th>
                  <th className="py-2.5 px-3 bg-emerald-100/70 text-[#15803D]">
                    Usia (Auto)
                  </th>
                  <th className="py-2.5 px-3">JK</th>
                  <th className="py-2.5 px-3">Departemen</th>
                  <th className="py-2.5 px-3">Bagian</th>
                  <th className="py-2.5 px-3">Jabatan</th>
                  <th className="py-2.5 px-3">Paket</th>
                  <th className="py-2.5 px-3">Kode Paket</th>
                  <th className="py-2.5 px-3 bg-amber-100/70 text-[#B45309]">
                    Tgl & Jam (Auto)
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2E8F0]">
                {parsedRows.map((r, i) => (
                  <tr key={i} className="hover:bg-slate-50/80">
                    <td className="py-2 px-3 text-center text-[#64748B] font-semibold">
                      {i + 1}
                    </td>
                    <td className="py-2 px-3 font-extrabold text-[#0E7490] bg-cyan-50/40">
                      {r.mcuNoAuto}
                    </td>
                    <td className="py-2 px-3 font-bold text-[#0F172A]">{r.kodePt}</td>
                    <td className="py-2 px-3">{r.wilayah}</td>
                    <td className="py-2 px-3 font-mono text-[11.5px] text-[#475569]">
                      {r.nik}
                    </td>
                    <td className="py-2 px-3 font-bold text-[#0F172A]">{r.nama}</td>
                    <td className="py-2 px-3 font-mono text-[12px]">{r.tglLahir}</td>
                    <td className="py-2 px-3 font-bold text-[#15803D] bg-emerald-50/40 text-[11.5px]">
                      {r.usiaAutoText}
                    </td>
                    <td className="py-2 px-3">
                      <span
                        className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                          r.jk === 'Pria'
                            ? 'bg-blue-50 text-blue-700'
                            : 'bg-pink-50 text-pink-700'
                        }`}
                      >
                        {r.jk}
                      </span>
                    </td>
                    <td className="py-2 px-3 text-[#475569]">{r.dept}</td>
                    <td className="py-2 px-3 text-[#475569]">{r.bagian || '-'}</td>
                    <td className="py-2 px-3 text-[#475569]">{r.jabatan || '-'}</td>
                    <td className="py-2 px-3 text-[#0F172A]">{r.paketPemeriksaan}</td>
                    <td className="py-2 px-3">
                      <span className="px-2 py-0.5 rounded bg-slate-100 text-[#334155] font-bold text-[11px] border border-slate-300">
                        {r.kodePaket}
                      </span>
                    </td>
                    <td className="py-2 px-3 font-mono text-[11.5px] text-[#B45309] bg-amber-50/40">
                      {r.tglJamAuto}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="button"
              disabled={isProcessing}
              onClick={handleExecuteImport}
              className="px-6 py-2.5 bg-gradient-to-r from-[#0E7490] to-[#0891B2] hover:opacity-95 text-white text-[13px] font-extrabold rounded-xl shadow-md shadow-cyan-700/20 flex items-center gap-2"
            >
              <CheckCircle2 className="w-4 h-4" />
              Selesaikan Impor & Buka Formulir Peserta
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
