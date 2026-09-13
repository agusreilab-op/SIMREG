import React, { useState, useEffect } from 'react';
import {
  User,
  Plus,
  Search,
  Printer,
  Calendar,
  CheckCircle2,
  X,
  Upload,
  Camera,
  ChevronLeft,
  ChevronRight,
  ListFilter,
  Clock,
  Sparkles,
  RotateCw,
  Building2,
  Stethoscope,
  RotateCcw,
  FileText,
  Check,
  IdCard,
  Save,
  AlertCircle,
  Filter,
  ArrowRight,
} from 'lucide-react';
import {
  AttendanceRecord,
  Company,
  MCUPackage,
  ClinicInfo,
  ThermalLabelConfig,
} from '../types';
import { generateAutoMrNumber, getCompanyInitial3, extractYear } from '../utils/mrNumber';
import { CameraModal } from './CameraModal';
import { initialPackages, defaultThermalConfig } from '../data/initialData';
import { ThermalLabelPrintModal } from './ThermalLabelPrintModal';

interface RegistrasiTemplateFormProps {
  companies: Company[];
  attendanceList: AttendanceRecord[];
  packages?: MCUPackage[];
  clinic?: ClinicInfo;
  labelConfig?: ThermalLabelConfig;
  onUpdateLabelConfig?: (config: ThermalLabelConfig) => void;
  onSave: (record: AttendanceRecord) => void;
  onNotify: (msg: string) => void;
  onOpenList?: () => void;
  initialMcuNo?: string;
}

// Function to calculate exact age in Years, Months, and Days
function calculateAgeBreakdown(birthDateStr: string) {
  if (!birthDateStr) return { years: 0, months: 0, days: 0 };
  let birth: Date;
  if (/^\d{2}[-/]\d{2}[-/]\d{4}$/.test(birthDateStr)) {
    const parts = birthDateStr.split(/[-/]/);
    birth = new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
  } else {
    birth = new Date(birthDateStr);
  }
  if (isNaN(birth.getTime())) return { years: 0, months: 0, days: 0 };
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
    years: Math.max(0, years),
    months: Math.max(0, months),
    days: Math.max(0, days),
  };
}

// Helper to determine next sequential MCU number
export function getNextMcuNumber(list: AttendanceRecord[]): string {
  if (!list || list.length === 0) return '101';
  let max = 0;
  for (const item of list) {
    const num = parseInt(item.mcuNo.replace(/\D/g, ''), 10);
    if (!isNaN(num) && num > max) {
      max = num;
    }
  }
  return String(max > 0 ? max + 1 : list.length + 101);
}

// Helper for formatted current timestamp (DD-MM-YYYY HH:mm:ss)
export function getFormattedNow(): { dateFormatted: string; timeFormatted: string; full: string } {
  const now = new Date();
  const day = String(now.getDate()).padStart(2, '0');
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const year = now.getFullYear();
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const seconds = String(now.getSeconds()).padStart(2, '0');

  const dateFormatted = `${day}-${month}-${year}`;
  const timeFormatted = `${hours}:${minutes}:${seconds}`;
  return {
    dateFormatted,
    timeFormatted,
    full: `${dateFormatted} ${timeFormatted}`,
  };
}

export const RegistrasiTemplateForm: React.FC<RegistrasiTemplateFormProps> = ({
  companies,
  attendanceList,
  packages = [],
  clinic,
  labelConfig,
  onUpdateLabelConfig,
  onSave,
  onNotify,
  onOpenList,
  initialMcuNo,
}) => {
  // Available MCU packages from master or default
  const availablePackages =
    packages && packages.length > 0 ? packages : initialPackages;

  // Current active index in attendanceList
  const [currentIndex, setCurrentIndex] = useState<number>(0);

  // Form states matching template fields
  const [kodePt, setKodePt] = useState<string>('PAN');
  const [namaPt, setNamaPt] = useState<string>('PT. PANARUB INDUSTRY');
  const [wilayah, setWilayah] = useState<string>('TNG');
  const [tglInput, setTglInput] = useState<string>('24-07-2025');

  const [noMcu, setNoMcu] = useState<string>('118');
  const [tglJamMcu, setTglJamMcu] = useState<string>('24-07-2025 11:18:22');

  const [nik, setNik] = useState<string>('20100900133');
  const [noAskes, setNoAskes] = useState<string>('');
  const [sdhMcu, setSdhMcu] = useState<boolean>(true);

  const [nama, setNama] = useState<string>('ABDUL ROHMAN');
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);

  const [tglLahir, setTglLahir] = useState<string>('1989-09-05');
  const [jk, setJk] = useState<'Pria' | 'Wanita'>('Pria');

  const [dept, setDept] = useState<string>('QIP CSA & INCOMING');
  const [bagian, setBagian] = useState<string>('QIP MIXING SL RUBBER');
  const [jabatan, setJabatan] = useState<string>('Operator Produksi');
  const [alamatPeserta, setAlamatPeserta] = useState<string>(
    'Jl. Merdeka No. 45, Karawaci, Tangerang'
  );
  const [telp, setTelp] = useState<string>('0812-9876-1234');

  const [paket, setPaket] = useState<string>('PAN-RO');
  const [tidakPuasa, setTidakPuasa] = useState<boolean>(false);
  const [keteranganPaket, setKeteranganPaket] =
    useState<string>('Daftar, Rontgen.');
  const [pemeriksaanTambahan, setPemeriksaanTambahan] = useState<string>('');
  const [keteranganMcu, setKeteranganMcu] = useState<string>(
    'Pemeriksaan rutin berkala tahunan K3.'
  );

  // Modals
  const [showExtraExamModal, setShowExtraExamModal] = useState<boolean>(false);
  const [showSearchModal, setShowSearchModal] = useState<boolean>(false);
  const [showLabelModal, setShowLabelModal] = useState<boolean>(false);
  const [showPrintPromptModal, setShowPrintPromptModal] = useState<boolean>(false);
  const [showCameraModal, setShowCameraModal] = useState<boolean>(false);

  // Search & Filter state for anti-mixup participant selection (NIK & Nama Anti-Tertukar)
  const [searchMode, setSearchMode] = useState<'all' | 'nik' | 'nama'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [searchNik, setSearchNik] = useState<string>('');
  const [searchNama, setSearchNama] = useState<string>('');
  const [searchPtFilter, setSearchPtFilter] = useState<string>('SEMUA');
  const [searchStatusFilter, setSearchStatusFilter] = useState<string>('SEMUA');

  // Load participant data when selection changes
  const loadParticipant = (record: AttendanceRecord) => {
    setKodePt(record.kodePt || 'PAN');
    setNamaPt(record.pt || 'PT. PANARUB INDUSTRY');
    setWilayah(record.wilayah || 'TNG');
    setTglInput(record.tglInput || '24-07-2025');

    setNoMcu(record.mcuNo || '118');
    setTglJamMcu(
      record.tglMcu ? `${record.tglMcu} ${record.jam}` : '24-07-2025 11:18:22'
    );

    setNik(record.nik || '20100900133');
    setNoAskes(record.noAskes || '');
    setSdhMcu(
      record.sudahMcu !== undefined ? record.sudahMcu : record.status === 'Hadir'
    );

    setNama(record.nama || '');
    setPhotoUrl(record.photoUrl || null);
    setTglLahir(record.tglLahir || '1989-09-05');
    setJk(record.jk || 'Pria');

    setDept(record.dept || '');
    setBagian(record.bagian || '');
    setJabatan(record.jabatan || '');
    setAlamatPeserta(record.alamatPeserta || '');
    setTelp(record.telp || '');

    setPaket(record.kodePaket || record.paket || 'PAN-RO');
    setTidakPuasa(record.tidakPuasa || false);
    setKeteranganPaket(record.keteranganPaket || 'Daftar, Rontgen.');
    setPemeriksaanTambahan(record.pemeriksaanTambahan || '');
    setKeteranganMcu(record.keteranganMcu || '');
  };

  useEffect(() => {
    if (initialMcuNo && attendanceList.length > 0) {
      const idx = attendanceList.findIndex((p) => p.mcuNo === initialMcuNo);
      if (idx !== -1) {
        setCurrentIndex(idx);
      }
    }
  }, [initialMcuNo, attendanceList]);

  useEffect(() => {
    if (attendanceList.length > 0 && attendanceList[currentIndex]) {
      loadParticipant(attendanceList[currentIndex]);
    }
  }, [currentIndex, attendanceList]);

  // Handle company dropdown change
  const handleCompanyChange = (code: string) => {
    setKodePt(code);
    const comp = companies.find((c) => c.kode === code);
    const newPtName = comp ? comp.nama : code;
    if (comp) {
      setNamaPt(comp.nama);
    }
    // Jika sedang dalam formulir peserta baru atau belum tersimpan, sesuaikan No MR
    if (!nama || nik === '') {
      const autoMr = generateAutoMrNumber(newPtName, tglJamMcu || tglInput, attendanceList, companies);
      setNoMcu(autoMr);
    }
  };

  // Handle package change
  const handlePackageChange = (val: string) => {
    setPaket(val);
    const found = availablePackages.find(
      (p) => p.kode === val || p.nama === val
    );
    if (found) {
      setKeteranganPaket(found.keterangan || found.nama);
    } else if (val === 'PAN-RO') {
      setKeteranganPaket('Daftar, Rontgen.');
    } else if (val === 'PAI-A' || val === 'PAN-STD') {
      setKeteranganPaket('Daftar, Fisik, Lab Darah Lengkap, Rontgen Thorax.');
    } else if (val === 'PAN-EXEC') {
      setKeteranganPaket(
        'Daftar, Fisik, Lab Lengkap, Rontgen, EKG 12-lead, Audiometri, Spirometri.'
      );
    } else {
      setKeteranganPaket('Daftar, Pemeriksaan Rutin K3.');
    }
  };

  // Active package configuration matching selected package code
  const activePackageConfig =
    availablePackages.find(
      (p) => p.kode === paket || p.nama === paket
    ) || availablePackages[0];

  // Age calculations
  const age = calculateAgeBreakdown(tglLahir);

  // Active participant record constructed from current state for printing/saving
  const currentPatientRecord: AttendanceRecord = {
    no: currentIndex + 1,
    id: attendanceList[currentIndex]?.id || Date.now(),
    mcuNo: noMcu,
    nik: nik,
    nama: nama,
    dept: dept,
    bagian: bagian,
    jabatan: jabatan,
    pt: namaPt,
    kodePt: kodePt,
    wilayah: wilayah,
    tglLahir: tglLahir,
    jk: jk,
    usia: String(age.years),
    paket: paket,
    kodePaket: paket,
    keteranganPaket: keteranganPaket,
    tglMcu: tglJamMcu.split(' ')[0] || tglInput,
    jam: tglJamMcu.split(' ')[1] || '08:00:00',
    tglInput: tglInput,
    status: sdhMcu ? 'Hadir' : 'Belum Hadir',
    sudahMcu: sdhMcu,
    noAskes: noAskes,
    alamat: alamatPeserta,
    telp: telp,
    photoUrl: photoUrl || undefined,
    tidakPuasa: tidakPuasa,
    pemeriksaanTambahan: pemeriksaanTambahan,
    keteranganMcu: keteranganMcu,
  };

  // New Participant with Auto MCU and Auto Timestamp
  const handleNew = () => {
    const nowObj = getFormattedNow();
    const autoMr = generateAutoMrNumber(
      namaPt || kodePt,
      nowObj.dateFormatted,
      attendanceList,
      companies
    );

    setNoMcu(autoMr);
    setTglJamMcu(nowObj.full);
    setTglInput(nowObj.dateFormatted);
    setNik('');
    setNoAskes('');
    setNama('');
    setPhotoUrl(null);
    setTglLahir('1995-01-01');
    setJk('Pria');
    setDept('');
    setBagian('');
    setJabatan('');
    setAlamatPeserta('');
    setTelp('');
    setSdhMcu(false);
    setPemeriksaanTambahan('');
    setKeteranganMcu('');
    onNotify(`Formulir disiapkan untuk pendaftaran baru. No. MR otomatis di-generate: [${autoMr}] (Struktur: [3 Digit Inisial] - [Tahun] - [No Urut]).`);
  };

  // Quick refresh clock timestamp
  const handleRefreshClock = () => {
    const nowObj = getFormattedNow();
    setTglJamMcu(nowObj.full);
    setTglInput(nowObj.dateFormatted);
    onNotify(`Waktu kedatangan MCU disinkronkan ke jam sekarang: ${nowObj.timeFormatted}`);
  };

  // Quick generate next MCU number
  const handleAutoMcuNo = () => {
    const autoMr = generateAutoMrNumber(
      namaPt || kodePt,
      tglJamMcu || tglInput,
      attendanceList,
      companies
    );
    setNoMcu(autoMr);
    onNotify(`Nomor MR otomatis diperbarui: [${autoMr}] (Struktur: [${getCompanyInitial3(namaPt || kodePt, companies)}] - [${extractYear(tglJamMcu || tglInput)}] - [Nomor Urut])`);
  };

  // Save
  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nama.trim()) {
      alert('Nama Peserta MCU tidak boleh kosong!');
      return;
    }

    const updatedRecord: AttendanceRecord = {
      no: currentIndex + 1,
      mcuNo: noMcu,
      nama: nama.toUpperCase(),
      jk,
      tglLahir,
      pt: namaPt,
      kodePt,
      wilayah,
      dept,
      bagian,
      jabatan,
      nik,
      noAskes,
      alamatPeserta,
      telp,
      paket,
      kodePaket: paket,
      keteranganPaket,
      pemeriksaanTambahan,
      keteranganMcu,
      tidakPuasa,
      sudahMcu: sdhMcu,
      photoUrl: photoUrl || undefined,
      tglMcu: tglJamMcu.split(' ')[0] || new Date().toISOString().split('T')[0],
      tglInput,
      status: sdhMcu ? 'Hadir' : 'Belum Hadir',
      jam: tglJamMcu.split(' ')[1] || '08:00',
    };

    onSave(updatedRecord);
    onNotify(
      `Data peserta [${noMcu} - ${nama.toUpperCase()}] berhasil disimpan!`
    );
    // Langsung muncul jendela cetak label (Ya / Batal, batal hanya simpan data saja)
    setShowPrintPromptModal(true);
  };

  // Extra exams checklist options
  const extraOptions = [
    'Narkoba 5 Parameter (Amp, Met, THC, Mor, Bzo)',
    'HBsAg (Hepatitis B Surface Antigen)',
    'Anti-HCV (Hepatitis C)',
    'Audiometri Nada Murni',
    'Spirometri Kapasitas Paru',
    'EKG 12-Lead Istirahat',
    'Treadmill Test',
    'USG Abdomen Upper/Lower',
    'Pemeriksaan Mata / Visus Ishihara',
  ];

  return (
    <div className="space-y-2.5">
      {/* Top Action Utility Toolbar - Sleek & Compact */}
      <div className="flex flex-wrap items-center justify-between gap-2 bg-white py-1.5 px-3 rounded-xl border border-slate-200 shadow-2xs">
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            onClick={handleNew}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 transition-colors shadow-2xs cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Peserta Baru</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setSearchMode('all');
              setShowSearchModal(true);
            }}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#0E7490] text-white text-xs font-bold hover:bg-[#0891B2] transition-colors shadow-2xs cursor-pointer"
            title="Buka jendela pencarian presisi NIK & Nama peserta"
          >
            <Search className="w-3.5 h-3.5" />
            <span>Cari Peserta</span>
          </button>

          {/* Quick Select Directly by NIK & Nama to Prevent Mix-up */}
          {attendanceList.length > 0 && (
            <div className="hidden md:flex items-center gap-1.5 bg-cyan-50/90 border border-cyan-300 rounded-lg px-2 py-0.5 text-xs shadow-2xs">
              <span className="font-bold text-cyan-900 whitespace-nowrap flex items-center gap-1 text-[11px]">
                <IdCard className="w-3 h-3 text-cyan-700" />
                Pilih:
              </span>
              <select
                id="quick-toolbar-select-participant"
                value={attendanceList[currentIndex]?.mcuNo || ''}
                onChange={(e) => {
                  const selected = attendanceList.findIndex(
                    (p) => p.mcuNo === e.target.value
                  );
                  if (selected !== -1) {
                    setCurrentIndex(selected);
                    onNotify(
                      `Peserta [NIK: ${attendanceList[selected].nik || '-'} | ${attendanceList[selected].nama}] aktif di formulir.`
                    );
                  }
                }}
                className="bg-white border border-cyan-300 rounded text-[11px] font-bold text-slate-800 py-0.5 px-1.5 focus:ring-1 focus:ring-cyan-500 focus:border-cyan-600 max-w-[260px] truncate cursor-pointer"
                title="Pilih langsung peserta berdasarkan NIK & Nama lengkap agar data tidak tertukar"
              >
                {attendanceList.map((p) => (
                  <option key={p.mcuNo} value={p.mcuNo}>
                    [NIK: {p.nik || '-'}] {p.nama} — {p.pt}
                  </option>
                ))}
              </select>
            </div>
          )}

          <button
            type="button"
            onClick={() => setShowLabelModal(true)}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 text-xs font-bold hover:bg-slate-200 transition-colors border border-slate-300 cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5 text-cyan-700" />
            <span>Cetak Stiker</span>
          </button>

          {onOpenList && (
            <button
              type="button"
              onClick={onOpenList}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-700 text-xs font-bold hover:bg-indigo-100 transition-colors border border-indigo-200 cursor-pointer"
            >
              <ListFilter className="w-3.5 h-3.5" />
              <span>Daftar Absensi</span>
            </button>
          )}
        </div>

        {/* Record Navigator */}
        <div className="flex items-center gap-2 text-[11.5px] text-[#475569]">
          <span>
            Data: <b>{currentIndex + 1}</b>/<b>{attendanceList.length}</b>
          </span>
          <div className="inline-flex border border-slate-300 rounded-lg overflow-hidden bg-white">
            <button
              type="button"
              disabled={currentIndex <= 0}
              onClick={() => setCurrentIndex((prev) => Math.max(0, prev - 1))}
              className="p-1 px-2 hover:bg-slate-100 disabled:opacity-30 cursor-pointer"
              title="Peserta Sebelumnya"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              disabled={currentIndex >= attendanceList.length - 1}
              onClick={() =>
                setCurrentIndex((prev) =>
                  Math.min(attendanceList.length - 1, prev + 1)
                )
              }
              className="p-1 px-2 hover:bg-slate-100 disabled:opacity-30 border-l border-slate-200 cursor-pointer"
              title="Peserta Berikutnya"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* MODERN REDESIGNED FORM ("INFORMASI DATA PESERTA MCU") - COMPACT & ELEGANT */}
      {/* ========================================================================= */}
      <div className="w-full max-w-7xl mx-auto rounded-xl overflow-hidden shadow-xs border border-slate-200/90 bg-white transition-all">
        {/* Compact Executive Header */}
        <div className="bg-gradient-to-r from-slate-900 via-cyan-950 to-slate-900 px-3 py-1.5 text-white border-b border-cyan-800/40 flex flex-wrap items-center justify-between gap-2">
          {/* Left: Title & Status */}
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-cyan-500/20 border border-cyan-400/30 flex items-center justify-center text-cyan-300 shadow-2xs">
              <User className="w-3.5 h-3.5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-white text-[12.5px] sm:text-[13px] font-black tracking-wide uppercase drop-shadow-2xs leading-none">
                  INFORMASI DATA PESERTA MCU
                </h1>
                <span className="text-[10px] text-cyan-300/80 font-semibold hidden md:inline">
                  &bull; Registrasi &amp; Rekam Medis
                </span>
              </div>
            </div>

            {/* Status Kehadiran Toggle */}
            <button
              type="button"
              onClick={() => setSdhMcu(!sdhMcu)}
              className={`ml-1 px-2 py-0.5 rounded-full text-[9.5px] font-bold tracking-wider flex items-center gap-1 transition-all shadow-2xs border cursor-pointer ${
                sdhMcu
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-400/50 hover:bg-emerald-500/30'
                  : 'bg-amber-500/20 text-amber-300 border-amber-400/50 hover:bg-amber-500/30'
              }`}
              title="Klik untuk mengubah status kehadiran peserta"
            >
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  sdhMcu ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'
                }`}
              />
              {sdhMcu ? 'HADIR (SUDAH MCU)' : 'BELUM MCU'}
            </button>
          </div>

          {/* Right: Compact Controls (MR, Jam, Pager) */}
          <div className="flex flex-wrap items-center gap-1.5">
            {/* No. MR */}
            <div className="flex items-center gap-1 bg-slate-800/90 border border-slate-700 rounded-md px-1.5 py-0.5">
              <span className="text-[10px] font-bold text-slate-300 uppercase">No. MR:</span>
              <input
                type="text"
                value={noMcu}
                onChange={(e) => setNoMcu(e.target.value)}
                className="w-24 bg-white border border-red-400 px-1 py-0.5 text-[11px] font-mono font-black text-red-600 text-center rounded shadow-2xs outline-none"
                placeholder="PAI-2026-001"
              />
              <button
                type="button"
                onClick={handleAutoMcuNo}
                title="Generate nomor MR otomatis"
                className="px-1.5 py-0.5 bg-red-600 hover:bg-red-700 text-white text-[9.5px] font-bold rounded flex items-center gap-0.5 transition-all cursor-pointer"
              >
                <Sparkles className="w-2.5 h-2.5" />
                <span>Auto</span>
              </button>
            </div>

            {/* Tgl / Jam MCU */}
            <div className="hidden sm:flex items-center gap-1 bg-slate-800/90 border border-slate-700 rounded-md px-1.5 py-0.5">
              <span className="text-[10px] font-semibold text-slate-300">Jam:</span>
              <input
                type="text"
                value={tglJamMcu}
                onChange={(e) => setTglJamMcu(e.target.value)}
                className="w-32 bg-slate-900 border border-slate-700 px-1 py-0.5 text-[10px] font-mono font-semibold text-slate-200 text-center rounded outline-none"
                placeholder="DD-MM-YYYY HH:mm:ss"
              />
              <button
                type="button"
                onClick={handleRefreshClock}
                title="Set jam sekarang"
                className="p-0.5 text-cyan-400 hover:text-cyan-200 rounded cursor-pointer"
              >
                <Clock className="w-3 h-3" />
              </button>
            </div>

            {/* Pager quick indicators */}
            <div className="flex items-center gap-0.5 bg-slate-800/90 border border-slate-700 rounded-md px-1 py-0.5 text-[10px] font-bold text-slate-300">
              <button
                type="button"
                disabled={currentIndex <= 0}
                onClick={() => setCurrentIndex((prev) => Math.max(0, prev - 1))}
                className="p-0.5 hover:text-white disabled:opacity-30 cursor-pointer"
                title="Peserta sebelumnya"
              >
                <ChevronLeft className="w-3 h-3" />
              </button>
              <span className="text-[9.5px] px-1 text-cyan-300 font-mono">
                {attendanceList.length > 0 ? `${currentIndex + 1}/${attendanceList.length}` : '0/0'}
              </span>
              <button
                type="button"
                disabled={currentIndex >= attendanceList.length - 1}
                onClick={() => setCurrentIndex((prev) => Math.min(attendanceList.length - 1, prev + 1))}
                className="p-0.5 hover:text-white disabled:opacity-30 cursor-pointer"
                title="Peserta berikutnya"
              >
                <ChevronRight className="w-3 h-3" />
              </button>
            </div>
          </div>
        </div>

        {/* Compact Elegant Form Body - Engineered to Fit Without Excessive Scrolling */}
        <form onSubmit={handleSave} className="p-2 sm:p-2.5 space-y-1.5 text-slate-800">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-2 items-start">
            {/* LEFT 9 COLUMNS: Data Perusahaan, Identitas & Paket */}
            <div className="lg:col-span-9 space-y-1.5">
              {/* SECTION 1: PERUSAHAAN & WILAYAH */}
              <div className="border border-slate-200/90 rounded-lg p-1.5 bg-slate-50/80 shadow-2xs">
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-1.5 items-center">
                  <div className="sm:col-span-4 flex flex-col gap-0.5">
                    <label className="text-[10px] font-bold text-slate-600 flex items-center gap-1">
                      <Building2 className="w-3 h-3 text-cyan-700" />
                      <span>Kode PT:</span>
                    </label>
                    <select
                      value={kodePt}
                      onChange={(e) => handleCompanyChange(e.target.value)}
                      className="w-full px-2 py-0.5 bg-white border border-slate-300 text-[11px] font-bold text-slate-800 rounded shadow-2xs focus:ring-1 focus:ring-cyan-500 focus:border-cyan-500 h-7"
                    >
                      {companies.map((c) => (
                        <option key={c.id} value={c.kode}>
                          {c.kode} - {c.nama}
                        </option>
                      ))}
                      <option value="PAN">PAN - PT. Panarub</option>
                      <option value="UMUM">UMUM - Peserta Mandiri</option>
                    </select>
                  </div>

                  <div className="sm:col-span-5 flex flex-col gap-0.5">
                    <label className="text-[10px] font-bold text-slate-600">
                      Nama Perusahaan:
                    </label>
                    <input
                      type="text"
                      value={namaPt}
                      onChange={(e) => setNamaPt(e.target.value)}
                      className="w-full px-2 py-0.5 bg-white border border-slate-300 text-[11px] font-bold text-slate-800 uppercase rounded shadow-2xs focus:ring-1 focus:ring-cyan-500 focus:border-cyan-500 h-7"
                      placeholder="PT. PANARUB INDUSTRY"
                    />
                  </div>

                  <div className="sm:col-span-3 flex flex-col gap-0.5">
                    <label className="text-[10px] font-bold text-slate-600">
                      Wilayah MCU:
                    </label>
                    <select
                      value={wilayah}
                      onChange={(e) => setWilayah(e.target.value)}
                      className="w-full px-2 py-0.5 bg-white border border-slate-300 text-[11px] font-semibold text-slate-800 rounded shadow-2xs focus:ring-1 focus:ring-cyan-500 focus:border-cyan-500 h-7"
                    >
                      <option value="TNG">TNG - Tangerang</option>
                      <option value="JKT">JKT - Jakarta</option>
                      <option value="BKS">BKS - Bekasi</option>
                      <option value="KRW">KRW - Karawang</option>
                      <option value="BDG">BDG - Bandung</option>
                      <option value="CLG">CLG - Cilegon</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* SECTION 2: IDENTITAS LENGKAP PESERTA */}
              <div className="border border-slate-200/90 rounded-lg p-2 bg-white shadow-2xs space-y-1">
                {/* Row A: NIK, No Askes, Tgl Input */}
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-1.5 items-center">
                  <div className="sm:col-span-5 flex flex-col gap-0.5">
                    <div className="flex items-center justify-between">
                      <label className="text-[10px] font-bold text-slate-600">
                        No. ID / NIK / NIP / NRP:
                      </label>
                      <button
                        type="button"
                        onClick={() => {
                          setSearchMode('nik');
                          setSearchNik(nik || '');
                          setShowSearchModal(true);
                        }}
                        className="text-[9.5px] font-bold text-cyan-700 hover:text-cyan-900 flex items-center gap-0.5 hover:underline cursor-pointer"
                        title="Cari via NIK"
                      >
                        <Search className="w-2.5 h-2.5" />
                        <span>Cari NIK</span>
                      </button>
                    </div>
                    <input
                      type="text"
                      value={nik}
                      onChange={(e) => setNik(e.target.value)}
                      className="w-full px-2 py-0.5 bg-white border border-slate-300 text-[11px] font-bold text-slate-800 rounded shadow-2xs focus:ring-1 focus:ring-cyan-500 focus:border-cyan-500 h-7"
                      placeholder="20100900133"
                    />
                  </div>

                  <div className="sm:col-span-4 flex flex-col gap-0.5">
                    <label className="text-[10px] font-bold text-slate-600">
                      No. Askes / BPJS:
                    </label>
                    <input
                      type="text"
                      value={noAskes}
                      onChange={(e) => setNoAskes(e.target.value)}
                      className="w-full px-2 py-0.5 bg-white border border-slate-300 text-[11px] text-slate-800 rounded shadow-2xs focus:ring-1 focus:ring-cyan-500 focus:border-cyan-500 h-7"
                      placeholder="00012345678"
                    />
                  </div>

                  <div className="sm:col-span-3 flex flex-col gap-0.5">
                    <label className="text-[10px] font-bold text-slate-600">
                      Tgl Input Data:
                    </label>
                    <input
                      type="text"
                      value={tglInput}
                      onChange={(e) => setTglInput(e.target.value)}
                      className="w-full px-2 py-0.5 bg-slate-50 border border-slate-300 text-[11px] font-semibold text-slate-800 text-center rounded shadow-2xs focus:ring-1 focus:ring-cyan-500 focus:border-cyan-500 h-7"
                      placeholder="DD-MM-YYYY"
                    />
                  </div>
                </div>

                {/* Row B: Nama Lengkap Peserta */}
                <div className="flex flex-col gap-0.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <label className="text-[10.5px] font-bold text-slate-700">
                        Nama Lengkap Peserta:
                      </label>
                      <button
                        type="button"
                        onClick={() => {
                          setSearchMode('nama');
                          setSearchNama(nama || '');
                          setShowSearchModal(true);
                        }}
                        className="text-[9.5px] font-bold text-cyan-700 hover:text-cyan-900 flex items-center gap-0.5 hover:underline cursor-pointer"
                        title="Cari via Nama"
                      >
                        <Search className="w-2.5 h-2.5" />
                        <span>Cari Nama</span>
                      </button>
                    </div>
                    <span className="text-[9.5px] text-slate-400">
                      *Huruf kapital
                    </span>
                  </div>
                  <input
                    type="text"
                    value={nama}
                    onChange={(e) => setNama(e.target.value)}
                    className="w-full px-2.5 py-0.5 bg-blue-50/50 border border-blue-200 text-xs font-black text-blue-950 uppercase rounded shadow-2xs tracking-wide focus:bg-white focus:ring-1 focus:ring-blue-500 focus:border-blue-500 h-7.5"
                    placeholder="NAMA LENGKAP PESERTA"
                    required
                  />
                </div>

                {/* Row C: Tanggal Lahir, Usia, Gender */}
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-1.5 items-center">
                  <div className="sm:col-span-4 flex flex-col gap-0.5">
                    <label className="text-[10px] font-bold text-slate-600">
                      Tanggal Lahir:
                    </label>
                    <input
                      type="date"
                      value={tglLahir}
                      onChange={(e) => setTglLahir(e.target.value)}
                      className="w-full px-2 py-0.5 bg-white border border-slate-300 text-[11px] font-bold text-slate-800 rounded shadow-2xs focus:ring-1 focus:ring-cyan-500 focus:border-cyan-500 h-7"
                    />
                  </div>

                  <div className="sm:col-span-5 flex flex-col gap-0.5">
                    <label className="text-[10px] font-bold text-slate-600">
                      Usia Terhitung:
                    </label>
                    <div className="flex items-center gap-1">
                      <div className="flex-1 bg-cyan-50 border border-cyan-200 rounded px-1 py-0.5 text-center shadow-2xs h-7 flex items-center justify-center">
                        <span className="text-xs font-black text-cyan-900 font-mono leading-none">
                          {age.years}
                        </span>
                        <span className="text-[9px] font-bold text-cyan-700 ml-0.5 leading-none">
                          Thn
                        </span>
                      </div>
                      <div className="flex-1 bg-cyan-50 border border-cyan-200 rounded px-1 py-0.5 text-center shadow-2xs h-7 flex items-center justify-center">
                        <span className="text-xs font-black text-cyan-900 font-mono leading-none">
                          {age.months}
                        </span>
                        <span className="text-[9px] font-bold text-cyan-700 ml-0.5 leading-none">
                          Bln
                        </span>
                      </div>
                      <div className="flex-1 bg-cyan-50 border border-cyan-200 rounded px-1 py-0.5 text-center shadow-2xs h-7 flex items-center justify-center">
                        <span className="text-xs font-black text-cyan-900 font-mono leading-none">
                          {age.days}
                        </span>
                        <span className="text-[9px] font-bold text-cyan-700 ml-0.5 leading-none">
                          Hari
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="sm:col-span-3 flex flex-col gap-0.5">
                    <label className="text-[10px] font-bold text-slate-600">
                      Jenis Kelamin:
                    </label>
                    <select
                      value={jk}
                      onChange={(e) => setJk(e.target.value as 'Pria' | 'Wanita')}
                      className="w-full px-2 py-0.5 bg-white border border-slate-300 text-[11px] font-bold text-slate-800 rounded shadow-2xs focus:ring-1 focus:ring-cyan-500 focus:border-cyan-500 h-7"
                    >
                      <option value="Pria">Pria (L)</option>
                      <option value="Wanita">Wanita (P)</option>
                    </select>
                  </div>
                </div>

                {/* Row D: Dept, Bagian, Jabatan */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-1.5">
                  <div className="flex flex-col gap-0.5">
                    <label className="text-[10px] font-bold text-slate-600">
                      Dept. / Instansi:
                    </label>
                    <input
                      type="text"
                      value={dept}
                      onChange={(e) => setDept(e.target.value)}
                      className="w-full px-2 py-0.5 bg-white border border-slate-300 text-[11px] font-semibold text-slate-800 uppercase rounded shadow-2xs focus:ring-1 focus:ring-cyan-500 focus:border-cyan-500 h-7"
                      placeholder="QIP CSA & INCOMING"
                    />
                  </div>

                  <div className="flex flex-col gap-0.5">
                    <label className="text-[10px] font-bold text-slate-600">
                      Bagian / Unit:
                    </label>
                    <input
                      type="text"
                      value={bagian}
                      onChange={(e) => setBagian(e.target.value)}
                      className="w-full px-2 py-0.5 bg-white border border-slate-300 text-[11px] font-semibold text-slate-800 uppercase rounded shadow-2xs focus:ring-1 focus:ring-cyan-500 focus:border-cyan-500 h-7"
                      placeholder="QIP MIXING SL RUBBER"
                    />
                  </div>

                  <div className="flex flex-col gap-0.5">
                    <label className="text-[10px] font-bold text-slate-600">
                      Jabatan:
                    </label>
                    <input
                      type="text"
                      value={jabatan}
                      onChange={(e) => setJabatan(e.target.value)}
                      className="w-full px-2 py-0.5 bg-white border border-slate-300 text-[11px] text-slate-800 rounded shadow-2xs focus:ring-1 focus:ring-cyan-500 focus:border-cyan-500 h-7"
                      placeholder="Operator Produksi"
                    />
                  </div>
                </div>

                {/* Row E: Alamat & Telepon */}
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-1.5">
                  <div className="sm:col-span-8 flex flex-col gap-0.5">
                    <label className="text-[10px] font-bold text-slate-600">
                      Alamat Peserta MCU:
                    </label>
                    <input
                      type="text"
                      value={alamatPeserta}
                      onChange={(e) => setAlamatPeserta(e.target.value)}
                      className="w-full px-2 py-0.5 bg-white border border-slate-300 text-[11px] text-slate-800 rounded shadow-2xs focus:ring-1 focus:ring-cyan-500 focus:border-cyan-500 h-7"
                      placeholder="Alamat domisili lengkap..."
                    />
                  </div>

                  <div className="sm:col-span-4 flex flex-col gap-0.5">
                    <label className="text-[10px] font-bold text-slate-600">
                      No. Tlp / WhatsApp:
                    </label>
                    <input
                      type="text"
                      value={telp}
                      onChange={(e) => setTelp(e.target.value)}
                      className="w-full px-2 py-0.5 bg-white border border-slate-300 text-[11px] text-slate-800 rounded shadow-2xs focus:ring-1 focus:ring-cyan-500 focus:border-cyan-500 h-7"
                      placeholder="0812-xxxx-xxxx"
                    />
                  </div>
                </div>
              </div>

              {/* SECTION 3: PAKET & CATATAN MEDIS */}
              <div className="border border-slate-200/90 rounded-lg p-1.5 bg-slate-50/80 shadow-2xs space-y-1.5">
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-1.5 items-center">
                  <div className="sm:col-span-6 flex flex-col gap-0.5">
                    <label className="text-[10px] font-bold text-slate-600 flex items-center gap-1">
                      <Stethoscope className="w-3 h-3 text-cyan-700" />
                      <span>Paket Pemeriksaan:</span>
                    </label>
                    <select
                      value={paket}
                      onChange={(e) => handlePackageChange(e.target.value)}
                      className="w-full px-2 py-0.5 bg-white border border-slate-300 text-[11px] font-bold text-slate-800 rounded shadow-2xs focus:ring-1 focus:ring-cyan-500 focus:border-cyan-500 h-7"
                    >
                      {availablePackages.map((p) => (
                        <option key={p.kode} value={p.kode}>
                          {p.kode} - {p.nama} ({p.labelCount || p.labels?.length || 3} Label)
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="sm:col-span-3 flex items-center pt-3 sm:pt-3.5">
                    <label className="flex items-center gap-1.5 bg-amber-50 hover:bg-amber-100 border border-amber-300/80 px-2 rounded cursor-pointer text-[10.5px] font-bold text-amber-900 transition-colors w-full justify-center h-7">
                      <input
                        type="checkbox"
                        checked={tidakPuasa}
                        onChange={(e) => setTidakPuasa(e.target.checked)}
                        className="w-3.5 h-3.5 accent-amber-600 rounded cursor-pointer"
                      />
                      <span>Tidak Puasa</span>
                    </label>
                  </div>

                  <div className="sm:col-span-3 flex items-center pt-3 sm:pt-3.5">
                    <button
                      type="button"
                      onClick={() => setShowExtraExamModal(true)}
                      className="w-full h-7 px-2 bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 text-[10.5px] font-bold rounded shadow-2xs transition-colors flex items-center justify-center gap-1 cursor-pointer"
                    >
                      <Plus className="w-3 h-3 text-cyan-600" />
                      <span>+ Tambahan</span>
                      {pemeriksaanTambahan && (
                        <span className="w-1.5 h-1.5 rounded-full bg-cyan-500" />
                      )}
                    </button>
                  </div>
                </div>

                {/* 3-Column Compact Notes: Keterangan Paket, Pemeriksaan Tambahan, Keterangan MCU */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-1.5">
                  <div className="flex flex-col gap-0.5">
                    <label className="text-[10px] font-bold text-slate-600">
                      Keterangan Paket:
                    </label>
                    <input
                      type="text"
                      value={keteranganPaket}
                      onChange={(e) => setKeteranganPaket(e.target.value)}
                      className="w-full px-2 py-0.5 bg-white border border-slate-300 text-[11px] font-semibold text-slate-800 rounded shadow-2xs focus:ring-1 focus:ring-cyan-500 focus:border-cyan-500 h-6.5"
                      placeholder="Daftar, Rontgen..."
                    />
                  </div>

                  <div className="flex flex-col gap-0.5">
                    <label className="text-[10px] font-bold text-slate-600">
                      Pemeriksaan Tambahan:
                    </label>
                    <input
                      type="text"
                      value={pemeriksaanTambahan}
                      onChange={(e) => setPemeriksaanTambahan(e.target.value)}
                      className="w-full px-2 py-0.5 bg-white border border-slate-300 text-[11px] text-slate-800 rounded shadow-2xs focus:ring-1 focus:ring-cyan-500 focus:border-cyan-500 h-6.5"
                      placeholder="Narkoba, HBsAg..."
                    />
                  </div>

                  <div className="flex flex-col gap-0.5">
                    <label className="text-[10px] font-bold text-slate-600">
                      Catatan Medis Khusus:
                    </label>
                    <input
                      type="text"
                      value={keteranganMcu}
                      onChange={(e) => setKeteranganMcu(e.target.value)}
                      className="w-full px-2 py-0.5 bg-white border border-slate-300 text-[11px] text-slate-800 rounded shadow-2xs focus:ring-1 focus:ring-cyan-500 focus:border-cyan-500 h-6.5"
                      placeholder="Kondisi khusus peserta..."
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* RIGHT 3 COLUMNS: Pasfoto, Thermal Label & Primary Actions */}
            <div className="lg:col-span-3 flex flex-col justify-between gap-1.5 bg-slate-50/70 p-2 rounded-lg border border-slate-200">
              {/* Pasfoto Box - Sleek Proportions */}
              <div className="flex flex-col items-center space-y-1.5">
                <div
                  onClick={() => setShowCameraModal(true)}
                  className="w-24 h-30 sm:w-26 sm:h-32 bg-white border-2 border-slate-300 rounded-lg p-0.5 shadow-2xs flex flex-col items-center justify-center relative group overflow-hidden cursor-pointer hover:border-cyan-500 transition-colors"
                  title="Klik untuk ambil foto kamera"
                >
                  {photoUrl ? (
                    <img
                      src={photoUrl}
                      alt="Foto Pasien"
                      className="w-full h-full object-cover rounded-md"
                    />
                  ) : (
                    <div className="w-full h-full bg-slate-100 rounded-md flex flex-col items-center justify-center text-slate-400">
                      <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center mb-1">
                        <User className="w-6 h-6 text-slate-500" />
                      </div>
                      <span className="text-[9.5px] font-bold text-slate-500">
                        Foto Peserta
                      </span>
                    </div>
                  )}

                  {/* Hover Overlay */}
                  <div className="absolute inset-0 bg-black/60 text-white opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center transition-opacity text-[9.5px] font-bold text-center p-1 rounded-md">
                    <Camera className="w-4 h-4 mb-0.5 text-cyan-300" />
                    Ambil Foto
                  </div>
                </div>

                {/* Photo Action Buttons - Side-by-side compact */}
                <div className="flex flex-col gap-1 w-full max-w-[140px]">
                  <div className="grid grid-cols-2 gap-1">
                    <button
                      type="button"
                      onClick={() => setShowCameraModal(true)}
                      className="py-1 px-1 bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-500 hover:to-teal-500 text-white text-[9.5px] font-bold rounded shadow-2xs flex items-center justify-center gap-0.5 transition-all cursor-pointer h-6.5"
                    >
                      <Camera className="w-2.5 h-2.5" />
                      <span>Kamera</span>
                    </button>

                    <label className="py-1 px-1 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 text-[9.5px] font-bold rounded shadow-2xs flex items-center justify-center gap-0.5 cursor-pointer transition-all h-6.5">
                      <Upload className="w-2.5 h-2.5 text-slate-500" />
                      <span>Unggah</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const url = URL.createObjectURL(file);
                            setPhotoUrl(url);
                            onNotify('Foto peserta berhasil dimuat.');
                          }
                        }}
                      />
                    </label>
                  </div>

                  {photoUrl && (
                    <button
                      type="button"
                      onClick={() => setPhotoUrl(null)}
                      className="w-full py-0.5 text-red-500 hover:text-red-700 text-[9.5px] font-semibold text-center hover:underline cursor-pointer"
                    >
                      Hapus Foto
                    </button>
                  )}
                </div>
              </div>

              {/* Thermal Label Synchronized Mini Banner */}
              <div className="p-1.5 rounded-lg bg-cyan-50/90 border border-cyan-200/90 text-[10px] space-y-0.5">
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-cyan-950 text-[10px] flex items-center gap-1">
                    <Printer className="w-3 h-3 text-cyan-700" />
                    <span>Label Stiker ({activePackageConfig?.labelCount || 3}):</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowLabelModal(true)}
                    className="text-[9.5px] text-cyan-800 font-bold hover:underline cursor-pointer"
                  >
                    Cetak &rarr;
                  </button>
                </div>
                <div className="text-[9.5px] font-mono font-semibold text-cyan-900 truncate">
                  {activePackageConfig?.labels?.map((l) => l.kode).join(' • ') || 'EDTA • URIN • BERKAS'}
                </div>
              </div>

              {/* Action Buttons: SIMPAN & BATAL */}
              <div className="space-y-1 pt-1 border-t border-slate-200">
                <button
                  type="submit"
                  className="w-full py-2 px-3 rounded-lg bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-black shadow-2xs transition-all flex items-center justify-center gap-1.5 cursor-pointer transform active:scale-95"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>SIMPAN PESERTA</span>
                </button>

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => {
                      if (attendanceList[currentIndex]) {
                        loadParticipant(attendanceList[currentIndex]);
                        onNotify('Perubahan data dibatalkan.');
                      }
                    }}
                    className="flex-1 py-1 px-1.5 rounded-md border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 text-[10px] font-bold shadow-2xs transition-colors flex items-center justify-center gap-1 cursor-pointer h-6.5"
                  >
                    <RotateCcw className="w-2.5 h-2.5 text-slate-500" />
                    <span>Reset</span>
                  </button>

                  <button
                    type="button"
                    disabled={currentIndex <= 0}
                    onClick={() => setCurrentIndex((prev) => Math.max(0, prev - 1))}
                    className="p-1 rounded-md border border-slate-300 bg-white hover:bg-slate-100 disabled:opacity-40 text-slate-700 text-[10px] font-bold flex items-center justify-center cursor-pointer h-6.5 w-6.5"
                    title="Sebelumnya"
                  >
                    <ChevronLeft className="w-3 h-3" />
                  </button>

                  <button
                    type="button"
                    disabled={currentIndex >= attendanceList.length - 1}
                    onClick={() => setCurrentIndex((prev) => Math.min(attendanceList.length - 1, prev + 1))}
                    className="p-1 rounded-md border border-slate-300 bg-white hover:bg-slate-100 disabled:opacity-40 text-slate-700 text-[10px] font-bold flex items-center justify-center cursor-pointer h-6.5 w-6.5"
                    title="Berikutnya"
                  >
                    <ChevronRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </form>
      </div>

      {/* ========================================================================= */}
      {/* MODAL 1: Pemeriksaan Tambahan Checklist */}
      {/* ========================================================================= */}
      {showExtraExamModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-lg w-full shadow-2xl border border-slate-300 overflow-hidden">
            <div className="bg-[#0E7490] text-white p-3.5 px-5 flex items-center justify-between">
              <h3 className="font-bold text-[15px]">Pilih Pemeriksaan Tambahan</h3>
              <button
                type="button"
                onClick={() => setShowExtraExamModal(false)}
                className="text-white/80 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-5 space-y-3 max-h-[60vh] overflow-y-auto">
              <p className="text-[12.5px] text-[#475569]">
                Pilih parameter pemeriksaan klinis tambahan di luar paket standar:
              </p>
              {extraOptions.map((opt) => {
                const isSelected = pemeriksaanTambahan.includes(opt);
                return (
                  <label
                    key={opt}
                    className="flex items-center gap-2.5 p-2 rounded-lg border border-slate-200 hover:bg-slate-50 cursor-pointer text-[13px] font-medium text-[#1E293B]"
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setPemeriksaanTambahan((prev) =>
                            prev ? `${prev}, ${opt}` : opt
                          );
                        } else {
                          const parts = pemeriksaanTambahan
                            .split(',')
                            .map((s) => s.trim())
                            .filter((s) => s !== opt);
                          setPemeriksaanTambahan(parts.join(', '));
                        }
                      }}
                      className="w-4 h-4 accent-[#0E7490]"
                    />
                    <span>{opt}</span>
                  </label>
                );
              })}
            </div>
            <div className="p-3 px-5 bg-slate-50 border-t border-slate-200 flex justify-end">
              <button
                type="button"
                onClick={() => setShowExtraExamModal(false)}
                className="px-4 py-2 bg-[#0E7490] text-white text-[13px] font-bold rounded-lg hover:bg-[#0891B2]"
              >
                Terapkan Pemeriksaan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: Cari / Pilih Peserta (Pilihan NIK & Nama Anti-Tertukar) */}
      {/* ========================================================================= */}
      {showSearchModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-4xl w-full shadow-2xl border border-slate-300 overflow-hidden transform transition-all animate-in fade-in zoom-in-95 duration-150 my-auto">
            {/* Header */}
            <div className="bg-gradient-to-r from-slate-900 via-cyan-950 to-slate-900 text-white p-4 px-6 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-[16px] flex items-center gap-2">
                    <Search className="w-5 h-5 text-cyan-400" />
                    Cari &amp; Pilih Peserta MCU
                  </h3>
                  <span className="text-[10.5px] font-bold uppercase tracking-wider bg-cyan-500/20 text-cyan-300 border border-cyan-400/30 px-2 py-0.5 rounded-full">
                    Verifikasi NIK &amp; Nama Anti-Tertukar
                  </span>
                </div>
                <p className="text-xs text-slate-300 mt-0.5">
                  Pilih peserta secara akurat berdasarkan No. NIK Karyawan dan Nama Lengkap agar data pemeriksaan tidak tertukar
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowSearchModal(false)}
                className="text-white/80 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
                title="Tutup Jendela"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 sm:p-5 space-y-4">
              {/* FEATURE 1: DROPDOWN PILIHAN CEPAT LANGSUNG BERDASARKAN NIK & NAMA */}
              <div className="bg-gradient-to-r from-cyan-50 to-blue-50 border border-cyan-200 rounded-xl p-3.5 shadow-2xs">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                  <label
                    htmlFor="modal-quick-select-dropdown"
                    className="text-[12.5px] font-black text-cyan-950 flex items-center gap-1.5"
                  >
                    <IdCard className="w-4 h-4 text-cyan-700" />
                    <span>Pilihan Cepat Langsung Peserta (Daftar NIK &amp; Nama):</span>
                  </label>
                  <span className="text-[11px] text-cyan-800 font-medium">
                    Total {attendanceList.length} peserta terdaftar
                  </span>
                </div>
                <div className="flex flex-col sm:flex-row items-center gap-2">
                  <select
                    id="modal-quick-select-dropdown"
                    value={attendanceList[currentIndex]?.mcuNo || ''}
                    onChange={(e) => {
                      const selected = attendanceList.find(
                        (p) => p.mcuNo === e.target.value
                      );
                      if (selected) {
                        const realIndex = attendanceList.findIndex(
                          (p) => p.mcuNo === selected.mcuNo
                        );
                        if (realIndex !== -1) {
                          setCurrentIndex(realIndex);
                          loadParticipant(selected);
                        }
                        setShowSearchModal(false);
                        onNotify(
                          `Peserta [NIK: ${selected.nik || '-'} | ${selected.nama}] berhasil dipilih ke formulir!`
                        );
                      }
                    }}
                    className="w-full bg-white border border-cyan-300 rounded-lg text-[13px] font-bold text-slate-800 py-2 px-3 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-600 shadow-2xs"
                  >
                    <option value="">-- Klik untuk Memilih Peserta Menurut NIK &amp; Nama --</option>
                    {attendanceList.map((p) => (
                      <option key={p.mcuNo} value={p.mcuNo}>
                        [NIK: {p.nik || 'Tanpa NIK'}] - {p.nama} ({p.pt} • MR: {p.mcuNo})
                      </option>
                    ))}
                  </select>
                </div>
                <p className="text-[11px] text-slate-500 mt-1.5 flex items-center gap-1">
                  <span className="font-semibold text-cyan-900">Tips:</span> Memilih dari daftar dropdown di atas langsung memuat data peserta ke formulir dengan aman tanpa risiko salah nama.
                </p>
              </div>

              {/* FEATURE 2: TAB PILIHAN MODE PENCARIAN */}
              <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
                <button
                  type="button"
                  onClick={() => setSearchMode('all')}
                  className={`px-3.5 py-1.5 rounded-lg text-[12.5px] font-bold flex items-center gap-1.5 transition-colors cursor-pointer ${
                    searchMode === 'all'
                      ? 'bg-cyan-700 text-white shadow-2xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  <Search className="w-3.5 h-3.5" />
                  Semua Pencarian
                </button>
                <button
                  type="button"
                  onClick={() => setSearchMode('nik')}
                  className={`px-3.5 py-1.5 rounded-lg text-[12.5px] font-bold flex items-center gap-1.5 transition-colors cursor-pointer ${
                    searchMode === 'nik'
                      ? 'bg-cyan-700 text-white shadow-2xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  <IdCard className="w-3.5 h-3.5" />
                  Menurut NIK (No. ID / KTP)
                </button>
                <button
                  type="button"
                  onClick={() => setSearchMode('nama')}
                  className={`px-3.5 py-1.5 rounded-lg text-[12.5px] font-bold flex items-center gap-1.5 transition-colors cursor-pointer ${
                    searchMode === 'nama'
                      ? 'bg-cyan-700 text-white shadow-2xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  <User className="w-3.5 h-3.5" />
                  Menurut Nama Peserta
                </button>
              </div>

              {/* FEATURE 3: KOTAK FILTER & PENCARIAN BERDASARKAN MODE */}
              {searchMode === 'all' && (
                <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="flex flex-col gap-1">
                      <label className="text-[12px] font-bold text-slate-700 flex items-center gap-1">
                        <IdCard className="w-3.5 h-3.5 text-cyan-700" />
                        Pilihan / Cari Berdasarkan NIK:
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          value={searchNik}
                          onChange={(e) => setSearchNik(e.target.value)}
                          placeholder="Ketik NIK / No. Karyawan..."
                          className="w-full pl-3 pr-8 py-2 bg-white border border-slate-300 rounded-lg text-[13px] font-bold text-slate-800 focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-600"
                        />
                        {searchNik && (
                          <button
                            type="button"
                            onClick={() => setSearchNik('')}
                            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-col gap-1">
                      <label className="text-[12px] font-bold text-slate-700 flex items-center gap-1">
                        <User className="w-3.5 h-3.5 text-cyan-700" />
                        Pilihan / Cari Berdasarkan Nama:
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          value={searchNama}
                          onChange={(e) => setSearchNama(e.target.value)}
                          placeholder="Ketik Nama Lengkap Peserta..."
                          className="w-full pl-3 pr-8 py-2 bg-white border border-slate-300 rounded-lg text-[13px] font-bold text-slate-800 focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-600 uppercase"
                        />
                        {searchNama && (
                          <button
                            type="button"
                            onClick={() => setSearchNama('')}
                            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Filter Tambahan (Perusahaan & Status) */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1 items-center">
                    <div>
                      <select
                        value={searchPtFilter}
                        onChange={(e) => setSearchPtFilter(e.target.value)}
                        className="w-full py-1.5 px-2.5 bg-white border border-slate-300 rounded-lg text-xs font-semibold text-slate-700"
                      >
                        <option value="SEMUA">Semua Perusahaan (PT)</option>
                        {companies.map((c) => (
                          <option key={c.kode} value={c.nama}>
                            {c.nama}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <select
                        value={searchStatusFilter}
                        onChange={(e) => setSearchStatusFilter(e.target.value)}
                        className="w-full py-1.5 px-2.5 bg-white border border-slate-300 rounded-lg text-xs font-semibold text-slate-700"
                      >
                        <option value="SEMUA">Semua Status Kehadiran</option>
                        <option value="Hadir">Status: Hadir</option>
                        <option value="Belum Hadir">Status: Belum Hadir</option>
                      </select>
                    </div>

                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Cari No MR / Dept..."
                        className="w-full py-1.5 px-2.5 bg-white border border-slate-300 rounded-lg text-xs text-slate-700"
                      />
                      {(searchNik || searchNama || searchQuery || searchPtFilter !== 'SEMUA' || searchStatusFilter !== 'SEMUA') && (
                        <button
                          type="button"
                          onClick={() => {
                            setSearchNik('');
                            setSearchNama('');
                            setSearchQuery('');
                            setSearchPtFilter('SEMUA');
                            setSearchStatusFilter('SEMUA');
                          }}
                          className="px-2.5 py-1.5 rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-bold whitespace-nowrap cursor-pointer"
                        >
                          Reset
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {searchMode === 'nik' && (
                <div className="bg-cyan-50/70 p-4 rounded-xl border border-cyan-200 space-y-2.5">
                  <label className="text-[12.5px] font-black text-cyan-950 flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <IdCard className="w-4 h-4 text-cyan-700" />
                      Pencarian Presisi Menurut No. NIK / ID Karyawan:
                    </span>
                    <span className="text-[11px] text-cyan-800 font-normal">
                      Pencocokan NIK memastikan tidak tertukar dengan nama yang sama
                    </span>
                  </label>
                  <div className="flex items-center gap-2">
                    <div className="relative flex-1">
                      <IdCard className="w-4 h-4 text-cyan-600 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={searchNik}
                        onChange={(e) => setSearchNik(e.target.value)}
                        placeholder="Ketik No. NIK Karyawan (contoh: 20100900133)..."
                        className="w-full pl-9 pr-8 py-2.5 bg-white border-2 border-cyan-400 rounded-xl text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-cyan-500 shadow-xs font-mono"
                        autoFocus
                      />
                      {searchNik && (
                        <button
                          type="button"
                          onClick={() => setSearchNik('')}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                    <select
                      value={searchPtFilter}
                      onChange={(e) => setSearchPtFilter(e.target.value)}
                      className="py-2.5 px-3 bg-white border border-cyan-300 rounded-xl text-xs font-bold text-slate-700"
                    >
                      <option value="SEMUA">Semua Perusahaan</option>
                      {companies.map((c) => (
                        <option key={c.kode} value={c.nama}>
                          {c.nama}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              {searchMode === 'nama' && (
                <div className="bg-blue-50/70 p-4 rounded-xl border border-blue-200 space-y-2.5">
                  <label className="text-[12.5px] font-black text-blue-950 flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <User className="w-4 h-4 text-blue-700" />
                      Pencarian Presisi Menurut Nama Peserta MCU:
                    </span>
                    <span className="text-[11px] text-blue-800 font-normal">
                      Cari nama lengkap atau bagian dari nama peserta
                    </span>
                  </label>
                  <div className="flex items-center gap-2">
                    <div className="relative flex-1">
                      <User className="w-4 h-4 text-blue-600 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={searchNama}
                        onChange={(e) => setSearchNama(e.target.value)}
                        placeholder="Ketik Nama Lengkap Peserta (contoh: ABDUL ROHMAN)..."
                        className="w-full pl-9 pr-8 py-2.5 bg-white border-2 border-blue-400 rounded-xl text-sm font-black text-blue-900 uppercase focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-xs"
                        autoFocus
                      />
                      {searchNama && (
                        <button
                          type="button"
                          onClick={() => setSearchNama('')}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                    <select
                      value={searchPtFilter}
                      onChange={(e) => setSearchPtFilter(e.target.value)}
                      className="py-2.5 px-3 bg-white border border-blue-300 rounded-xl text-xs font-bold text-slate-700"
                    >
                      <option value="SEMUA">Semua Perusahaan</option>
                      {companies.map((c) => (
                        <option key={c.kode} value={c.nama}>
                          {c.nama}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              {/* FEATURE 4: DAFTAR KARTU PESERTA HASIL PENCARIAN (ANTI-TERTUKAR) */}
              <div>
                <div className="flex items-center justify-between pb-2 text-xs font-bold text-slate-600">
                  <span>
                    Daftar Peserta Cocok ({
                      attendanceList.filter((p) => {
                        if (searchPtFilter !== 'SEMUA' && p.pt !== searchPtFilter) return false;
                        if (searchStatusFilter !== 'SEMUA' && p.status !== searchStatusFilter) return false;
                        if (searchMode === 'nik') {
                          const q = (searchNik || searchQuery).trim().toLowerCase();
                          if (!q) return true;
                          return !!p.nik && p.nik.toLowerCase().includes(q);
                        }
                        if (searchMode === 'nama') {
                          const q = (searchNama || searchQuery).trim().toLowerCase();
                          if (!q) return true;
                          return p.nama.toLowerCase().includes(q);
                        }
                        if (searchNik.trim() && (!p.nik || !p.nik.toLowerCase().includes(searchNik.trim().toLowerCase()))) {
                          return false;
                        }
                        if (searchNama.trim() && !p.nama.toLowerCase().includes(searchNama.trim().toLowerCase())) {
                          return false;
                        }
                        if (searchQuery.trim()) {
                          const q = searchQuery.trim().toLowerCase();
                          const matchNama = p.nama.toLowerCase().includes(q);
                          const matchMcu = p.mcuNo.toLowerCase().includes(q);
                          const matchNik = p.nik && p.nik.toLowerCase().includes(q);
                          const matchPt = p.pt.toLowerCase().includes(q);
                          const matchDept = p.dept && p.dept.toLowerCase().includes(q);
                          if (!matchNama && !matchMcu && !matchNik && !matchPt && !matchDept) return false;
                        }
                        return true;
                      }).length
                    } orang):
                  </span>
                  <span className="text-slate-400 font-normal">
                    Klik tombol &quot;Pilih Peserta&quot; untuk mengaktifkan ke formulir registrasi
                  </span>
                </div>

                <div className="max-h-76 overflow-y-auto divide-y divide-slate-100 border border-slate-200 rounded-xl p-1 bg-slate-50/50">
                  {attendanceList
                    .filter((p) => {
                      if (searchPtFilter !== 'SEMUA' && p.pt !== searchPtFilter) return false;
                      if (searchStatusFilter !== 'SEMUA' && p.status !== searchStatusFilter) return false;

                      if (searchMode === 'nik') {
                        const q = (searchNik || searchQuery).trim().toLowerCase();
                        if (!q) return true;
                        return !!p.nik && p.nik.toLowerCase().includes(q);
                      }
                      if (searchMode === 'nama') {
                        const q = (searchNama || searchQuery).trim().toLowerCase();
                        if (!q) return true;
                        return p.nama.toLowerCase().includes(q);
                      }

                      if (searchNik.trim() && (!p.nik || !p.nik.toLowerCase().includes(searchNik.trim().toLowerCase()))) {
                        return false;
                      }
                      if (searchNama.trim() && !p.nama.toLowerCase().includes(searchNama.trim().toLowerCase())) {
                        return false;
                      }
                      if (searchQuery.trim()) {
                        const q = searchQuery.trim().toLowerCase();
                        const matchNama = p.nama.toLowerCase().includes(q);
                        const matchMcu = p.mcuNo.toLowerCase().includes(q);
                        const matchNik = p.nik && p.nik.toLowerCase().includes(q);
                        const matchPt = p.pt.toLowerCase().includes(q);
                        const matchDept = p.dept && p.dept.toLowerCase().includes(q);
                        if (!matchNama && !matchMcu && !matchNik && !matchPt && !matchDept) return false;
                      }
                      return true;
                    })
                    .map((p) => {
                      const isCurrentlyActive = attendanceList[currentIndex]?.mcuNo === p.mcuNo;
                      return (
                        <div
                          key={p.mcuNo}
                          className={`p-3 sm:px-4 rounded-xl transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3 my-1 bg-white border ${
                            isCurrentlyActive
                              ? 'border-cyan-400 bg-cyan-50/40 shadow-xs'
                              : 'border-slate-200 hover:border-cyan-300 hover:bg-slate-50'
                          }`}
                        >
                          <div className="space-y-1 flex-1">
                            {/* Baris 1: NIK Badge, Nama Peserta, JK, Usia */}
                            <div className="flex flex-wrap items-center gap-2">
                              {/* NIK Highlighted Badge */}
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-slate-900 text-cyan-200 font-mono font-bold text-[11.5px] shadow-2xs">
                                <IdCard className="w-3 h-3 text-cyan-400" />
                                NIK: {p.nik || 'BELUM ADA NIK'}
                              </span>

                              {/* Nama Pasien Besar & Jelas */}
                              <span className="font-black text-slate-900 text-[14.5px] uppercase tracking-tight">
                                {p.nama}
                              </span>

                              <span className="text-[11px] px-2 py-0.5 rounded bg-slate-100 font-semibold text-slate-700">
                                {p.jk}
                              </span>

                              {p.tglLahir && (
                                <span className="text-[11.5px] text-slate-500 font-medium">
                                  Tgl Lahir: {p.tglLahir}
                                </span>
                              )}
                            </div>

                            {/* Baris 2: Perusahaan, Departemen, No MR & Paket */}
                            <div className="flex flex-wrap items-center gap-2 text-[12px] text-slate-600 pt-0.5">
                              <span className="font-bold text-slate-800">{p.pt}</span>
                              {p.dept && <span>• Dept: {p.dept}</span>}
                              {p.bagian && <span>({p.bagian})</span>}
                              <span className="inline-flex items-center px-2 py-0.2 rounded bg-amber-50 text-amber-800 border border-amber-200 text-[11px] font-mono font-bold">
                                MR: {p.mcuNo}
                              </span>
                              <span className="text-[11px] text-slate-500">
                                Paket: {p.kodePaket || p.paket}
                              </span>
                            </div>
                          </div>

                          {/* Tombol Pilih & Status Kehadiran */}
                          <div className="flex items-center gap-2.5 sm:self-center shrink-0">
                            <span
                              className={`text-[11px] font-bold px-2.5 py-1 rounded-full ${
                                p.status === 'Hadir'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : 'bg-amber-100 text-amber-800'
                              }`}
                            >
                              {p.status}
                            </span>

                            {isCurrentlyActive ? (
                              <span className="px-3 py-1.5 rounded-lg bg-cyan-100 text-cyan-800 text-[11.5px] font-bold inline-flex items-center gap-1">
                                <Check className="w-3.5 h-3.5" />
                                Aktif di Form
                              </span>
                            ) : (
                              <button
                                type="button"
                                onClick={() => {
                                  const realIndex = attendanceList.findIndex(
                                    (item) => item.mcuNo === p.mcuNo
                                  );
                                  if (realIndex !== -1) {
                                    setCurrentIndex(realIndex);
                                    loadParticipant(attendanceList[realIndex]);
                                  }
                                  setShowSearchModal(false);
                                  onNotify(
                                    `Peserta [NIK: ${p.nik || '-'} | ${p.nama}] terpilih dan dimuat ke formulir.`
                                  );
                                }}
                                className="px-3.5 py-1.5 rounded-lg bg-[#0E7490] hover:bg-[#0891B2] text-white text-[12px] font-bold inline-flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
                              >
                                <Check className="w-3.5 h-3.5" />
                                <span>Pilih Peserta</span>
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}

                  {/* Empty State jika tidak ada yang cocok */}
                  {attendanceList.filter((p) => {
                    if (searchPtFilter !== 'SEMUA' && p.pt !== searchPtFilter) return false;
                    if (searchStatusFilter !== 'SEMUA' && p.status !== searchStatusFilter) return false;
                    if (searchMode === 'nik') {
                      const q = (searchNik || searchQuery).trim().toLowerCase();
                      if (!q) return true;
                      return !!p.nik && p.nik.toLowerCase().includes(q);
                    }
                    if (searchMode === 'nama') {
                      const q = (searchNama || searchQuery).trim().toLowerCase();
                      if (!q) return true;
                      return p.nama.toLowerCase().includes(q);
                    }
                    if (searchNik.trim() && (!p.nik || !p.nik.toLowerCase().includes(searchNik.trim().toLowerCase()))) {
                      return false;
                    }
                    if (searchNama.trim() && !p.nama.toLowerCase().includes(searchNama.trim().toLowerCase())) {
                      return false;
                    }
                    if (searchQuery.trim()) {
                      const q = searchQuery.trim().toLowerCase();
                      const matchNama = p.nama.toLowerCase().includes(q);
                      const matchMcu = p.mcuNo.toLowerCase().includes(q);
                      const matchNik = p.nik && p.nik.toLowerCase().includes(q);
                      const matchPt = p.pt.toLowerCase().includes(q);
                      const matchDept = p.dept && p.dept.toLowerCase().includes(q);
                      if (!matchNama && !matchMcu && !matchNik && !matchPt && !matchDept) return false;
                    }
                    return true;
                  }).length === 0 && (
                    <div className="py-8 text-center space-y-2">
                      <AlertCircle className="w-8 h-8 text-amber-500 mx-auto" />
                      <p className="text-[13.5px] font-bold text-slate-800">
                        Tidak Ditemukan Peserta yang Cocok
                      </p>
                      <p className="text-xs text-slate-500 max-w-md mx-auto">
                        Silakan periksa kembali nomor NIK atau ejaan nama yang dicari, atau ganti filter perusahaan.
                      </p>
                      <button
                        type="button"
                        onClick={() => {
                          setSearchNik('');
                          setSearchNama('');
                          setSearchQuery('');
                          setSearchPtFilter('SEMUA');
                          setSearchStatusFilter('SEMUA');
                          setSearchMode('all');
                        }}
                        className="mt-2 px-3.5 py-1.5 rounded-lg bg-cyan-700 text-white text-xs font-bold hover:bg-cyan-800 cursor-pointer inline-flex items-center gap-1.5"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        Tampilkan Semua Peserta
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-3 px-6 bg-slate-100 border-t border-slate-200 flex items-center justify-between">
              <span className="text-[11.5px] text-slate-500 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block"></span>
                Gunakan NIK sebagai verifikator utama untuk mencegah kekeliruan data rekam medis.
              </span>
              <button
                type="button"
                onClick={() => setShowSearchModal(false)}
                className="px-4 py-1.5 rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-bold transition-colors cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: Konfirmasi Cetak Label Setelah Simpan (Ya / Batal) */}
      {/* ========================================================================= */}
      {showPrintPromptModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden transform transition-all animate-in fade-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="bg-gradient-to-r from-slate-900 via-cyan-950 to-slate-900 text-white p-4 px-5 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-cyan-500/20 border border-cyan-400/30 flex items-center justify-center text-cyan-300">
                  <Printer className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm tracking-wide">
                    Cetak Label Peserta MCU?
                  </h3>
                  <p className="text-[11px] text-cyan-200/80">
                    Konfirmasi Cetak Stiker Barcode
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowPrintPromptModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body */}
            <div className="p-5 space-y-4">
              <div className="flex items-start gap-3 bg-emerald-50 border border-emerald-200 p-3 rounded-xl text-emerald-900">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                <div className="text-xs">
                  <p className="font-bold text-emerald-950">
                    Data Berhasil Disimpan!
                  </p>
                  <p className="text-emerald-800 mt-0.5">
                    Data peserta <span className="font-black text-emerald-950">{noMcu} - {nama || 'PESERTA'}</span> telah tercatat dalam sistem.
                  </p>
                </div>
              </div>

              {/* Participant Preview Badge */}
              <div className="border border-slate-200 rounded-xl p-3.5 bg-slate-50 space-y-1.5 text-xs">
                <div className="flex justify-between items-center text-slate-500 text-[11px] uppercase font-bold tracking-wider">
                  <span>No. MCU / Antrean</span>
                  <span className="text-cyan-700 font-mono text-[13px] font-black">{noMcu}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-600 font-medium">Nama:</span>
                  <span className="font-black text-slate-900 uppercase">{nama}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-600 font-medium">Perusahaan:</span>
                  <span className="font-semibold text-slate-700">{namaPt}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-600 font-medium">Paket:</span>
                  <span className="font-bold text-cyan-800">
                    {paket} ({activePackageConfig?.labelCount || 3} Label Stiker)
                  </span>
                </div>
              </div>

              <p className="text-center text-slate-600 text-xs font-medium">
                Apakah Anda ingin langsung mencetak{' '}
                <span className="font-bold text-cyan-800">
                  {activePackageConfig?.labelCount || 3} stiker label thermal
                </span>{' '}
                (tabung darah, urine, &amp; berkas rekam medis)?
              </p>
            </div>

            {/* Actions: Batal (Hanya Simpan Data) vs Ya (Cetak Label) */}
            <div className="p-4 px-5 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => {
                  setShowPrintPromptModal(false);
                  onNotify(
                    `Data peserta [${noMcu} - ${nama}] berhasil disimpan (tanpa cetak label).`
                  );
                }}
                className="px-4 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-xl text-xs font-bold transition-colors shadow-2xs cursor-pointer"
              >
                Batal (Hanya Simpan Data)
              </button>

              <button
                type="button"
                onClick={() => {
                  setShowPrintPromptModal(false);
                  setShowLabelModal(true);
                }}
                className="px-5 py-2 bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-500 hover:to-teal-500 text-white rounded-xl text-xs font-bold shadow-md shadow-teal-700/20 flex items-center gap-1.5 transition-all transform active:scale-95 cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                Ya, Cetak Label ({activePackageConfig?.labelCount || 3})
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: CETAK LABEL THERMAL RESMI (DIATUR SESUAI PAKET MCU & UKURAN KERTAS) */}
      {/* ========================================================================= */}
      {showLabelModal && (
        <ThermalLabelPrintModal
          isOpen={showLabelModal}
          onClose={() => setShowLabelModal(false)}
          patient={currentPatientRecord}
          clinic={
            clinic || {
              nama: 'KLINIK UTAMA SEHAT BERSAMA',
              legalitas: 'Izin Operasional No. 445/092/Dinkes/2023',
              alamat: 'Jl. Pemuda No. 120, Kota Tangerang',
              kota: 'Tangerang',
              provinsi: 'Banten',
              kodePos: '15111',
              telp: '021-5523456 / 0812-3456-7890',
              email: 'mcu@kliniksehat.co.id',
              web: 'www.kliniksehat.co.id',
              penanggungJawab: 'dr. H. Hendra Wijaya, Sp.Ok',
              izinOperasional: '445/092/Dinkes/2023',
              dokterPJ: 'dr. H. Hendra Wijaya, Sp.Ok',
            }
          }
          packages={availablePackages}
          defaultConfig={labelConfig}
          onSaveConfig={onUpdateLabelConfig}
          onNotify={onNotify}
        />
      )}

      {/* Camera Photo Shoot Modal */}
      <CameraModal
        isOpen={showCameraModal}
        onClose={() => setShowCameraModal(false)}
        onCapture={(img) => {
          setPhotoUrl(img);
          onNotify(`Foto peserta [${nama || noMcu}] berhasil diambil via kamera photoshoot.`);
        }}
        participantName={nama || `Peserta MCU No. ${noMcu}`}
      />
    </div>
  );
};
