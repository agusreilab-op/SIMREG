import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Printer,
  Download,
  X,
  Layers,
  FileText,
  UserCheck,
  Stethoscope,
  FlaskConical,
  Activity,
  HeartPulse,
  Ear,
  Wind,
  Microscope,
  Camera,
  Upload,
  User,
  CheckSquare,
  Square,
  Settings2,
  Trash2,
  Hospital,
  Loader2,
} from 'lucide-react';
import {
  AttendanceRecord,
  ClinicInfo,
  MCUPackage,
  CompanyExaminerConfig,
} from '../types';
import { DEFAULT_FISIK_MATA } from './PemeriksaanFisikForm';
import { DEFAULT_LAB_ITEMS } from './LaboratoriumForm';
import { DEFAULT_NORMAL_RONTGEN } from './RontgenForm';
import { DEFAULT_NORMAL_EKG } from './EKGForm';
import { AudiogramVisualChart } from './AudiogramVisualChart';
import { initialPackages } from '../data/initialData';
import { calculateMedicalResume } from '../utils/medicalResumeGenerator';
import { downloadMcuBookletPdf, openMcuPrintWindow } from '../utils/mcuPrintUtils';

interface McuBookletModalProps {
  patient: AttendanceRecord;
  clinic: ClinicInfo;
  packageItem?: MCUPackage;
  examinerConfig?: CompanyExaminerConfig;
  initialAction?: 'preview' | 'print' | 'pdf';
  onClose: () => void;
  onNotify: (msg: string) => void;
}

export const McuBookletModal: React.FC<McuBookletModalProps> = ({
  patient,
  clinic,
  packageItem,
  examinerConfig,
  initialAction,
  onClose,
  onNotify,
}) => {
  // Loaded persisted clinical records
  const [resumeData, setResumeData] = useState<any>(null);
  const [fisikData, setFisikData] = useState<any>(null);
  const [labData, setLabData] = useState<any>(null);
  const [rontgenData, setRontgenData] = useState<any>(null);
  const [ekgData, setEkgData] = useState<any>(null);
  const [audiometriData, setAudiometriData] = useState<any>(null);
  const [spirometriData, setSpirometriData] = useState<any>(null);
  const [usgData, setUsgData] = useState<any>(null);
  const [treadmillData, setTreadmillData] = useState<any>(null);

  // Available packages from system
  const [allPackages, setAllPackages] = useState<MCUPackage[]>(initialPackages);
  const [selectedPackageKode, setSelectedPackageKode] = useState<string>(
    packageItem?.kode || patient.paket || ''
  );

  // Patient Photo (from record, localStorage, or custom upload)
  const [patientPhoto, setPatientPhoto] = useState<string | null>(
    patient.photoUrl || (patient as any).foto || null
  );

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Active view tab: 'all' or specific sheet id
  const [activeTab, setActiveTab] = useState<string>('all');

  // Custom exam toggles (Allows user to override/customize which pages are printed)
  const [customExamOverrides, setCustomExamOverrides] = useState<{
    fisik?: boolean;
    lab?: boolean;
    rontgen?: boolean;
    ekg?: boolean;
    audio?: boolean;
    spiro?: boolean;
    usg?: boolean;
    treadmill?: boolean;
  }>({});

  // Show/Hide custom package configuration bar
  const [showConfigBar, setShowConfigBar] = useState<boolean>(false);

  // Load persisted medical data and photos
  useEffect(() => {
    if (!patient?.mcuNo) return;
    const mcuNo = patient.mcuNo;

    try {
      const res = localStorage.getItem(`simreg_resume_${mcuNo}`);
      if (res) setResumeData(JSON.parse(res));
      else setResumeData(null);
    } catch (e) {}

    try {
      const fis = localStorage.getItem(`simreg_fisik_${mcuNo}`);
      if (fis) setFisikData(JSON.parse(fis));
      else setFisikData(null);
    } catch (e) {}

    try {
      const lab = localStorage.getItem(`simreg_lab_${mcuNo}`);
      if (lab) setLabData(JSON.parse(lab));
      else setLabData(null);
    } catch (e) {}

    try {
      const ron = localStorage.getItem(`simreg_rontgen_${mcuNo}`);
      if (ron) setRontgenData(JSON.parse(ron));
      else setRontgenData(null);
    } catch (e) {}

    try {
      const ekg = localStorage.getItem(`simreg_ekg_${mcuNo}`);
      if (ekg) setEkgData(JSON.parse(ekg));
      else setEkgData(null);
    } catch (e) {}

    try {
      const aud = localStorage.getItem(`simreg_audiometri_${mcuNo}`);
      if (aud) setAudiometriData(JSON.parse(aud));
      else setAudiometriData(null);
    } catch (e) {}

    try {
      const spi = localStorage.getItem(`simreg_spirometri_${mcuNo}`);
      if (spi) setSpirometriData(JSON.parse(spi));
      else setSpirometriData(null);
    } catch (e) {}

    try {
      const usg = localStorage.getItem(`simreg_usg_${mcuNo}`);
      if (usg) setUsgData(JSON.parse(usg));
      else setUsgData(null);
    } catch (e) {}

    try {
      const tm = localStorage.getItem(`simreg_treadmill_${mcuNo}`);
      if (tm) setTreadmillData(JSON.parse(tm));
      else setTreadmillData(null);
    } catch (e) {}

    // Load photo if saved locally
    try {
      const savedPhoto = localStorage.getItem(`simreg_photo_${mcuNo}`);
      if (savedPhoto) {
        setPatientPhoto(savedPhoto);
      } else if (patient.photoUrl || (patient as any).foto) {
        setPatientPhoto(patient.photoUrl || (patient as any).foto);
      }
    } catch (e) {}

    // Load custom packages from localStorage if available
    try {
      const rawPkgs = localStorage.getItem('simreg_packages');
      if (rawPkgs) {
        const parsed: MCUPackage[] = JSON.parse(rawPkgs);
        if (parsed.length > 0) setAllPackages(parsed);
      }
    } catch (e) {}
  }, [patient?.mcuNo, patient.photoUrl]);

  // Active matched package
  const activePackage = useMemo(() => {
    if (selectedPackageKode) {
      const match = allPackages.find(
        (p) =>
          p.kode === selectedPackageKode ||
          p.nama.toLowerCase().includes(selectedPackageKode.toLowerCase())
      );
      if (match) return match;
    }
    if (packageItem) return packageItem;
    const matchPatient = allPackages.find(
      (p) =>
        p.kode === patient.paket ||
        p.nama.toLowerCase().includes((patient.paket || '').toLowerCase())
    );
    return matchPatient || allPackages[0];
  }, [selectedPackageKode, packageItem, patient.paket, allPackages]);

  // Dynamic Exam Inclusion based on Package Configuration & Patient Tambahan
  const examInclusion = useMemo(() => {
    const list = [
      ...(activePackage?.exams || activePackage?.pemeriksaan || []),
    ].map((e) => e.toLowerCase());

    const tambahan = (patient.pemeriksaanTambahan || '').toLowerCase();

    const isInc = (pattern: RegExp) =>
      list.some((item) => pattern.test(item)) || pattern.test(tambahan);

    // Baseline calculation from package definitions
    const baseFisik = isInc(/fisik|vital|tanda vital|mata|visus|umum|dokter/) || list.length === 0 || fisikData !== null;
    const baseLab = isInc(/lab|laboratorium|darah|urin|urine|hema|kimia/) || labData !== null;
    const baseRontgen = isInc(/rontgen|radiologi|thorax|ro\b|xray|x-ray/) || rontgenData !== null;
    const baseEkg = isInc(/ekg|ecg|elektrokardiografi|jantung/) || ekgData !== null;
    const baseAudio = isInc(/audio|audiometri|pendengaran|tht|telinga/) || audiometriData !== null;
    const baseSpiro = isInc(/spiro|spirometri|paru|respirasi|fungsi paru/) || spirometriData !== null;
    const baseUsg = isInc(/usg|abdomen|ultrasonografi/) || usgData !== null;
    const baseTreadmill = isInc(/treadmill|treadmil|stress test|beban jantung/) || treadmillData !== null;

    // Apply manual overrides if toggled by user
    return {
      hasFisik: customExamOverrides.fisik !== undefined ? customExamOverrides.fisik : baseFisik,
      hasLab: customExamOverrides.lab !== undefined ? customExamOverrides.lab : baseLab,
      hasRontgen: customExamOverrides.rontgen !== undefined ? customExamOverrides.rontgen : baseRontgen,
      hasEkg: customExamOverrides.ekg !== undefined ? customExamOverrides.ekg : baseEkg,
      hasAudio: customExamOverrides.audio !== undefined ? customExamOverrides.audio : baseAudio,
      hasSpiro: customExamOverrides.spiro !== undefined ? customExamOverrides.spiro : baseSpiro,
      hasUsg: customExamOverrides.usg !== undefined ? customExamOverrides.usg : baseUsg,
      hasTreadmill: customExamOverrides.treadmill !== undefined ? customExamOverrides.treadmill : baseTreadmill,
    };
  }, [
    activePackage,
    patient.pemeriksaanTambahan,
    fisikData,
    labData,
    rontgenData,
    ekgData,
    audiometriData,
    spirometriData,
    usgData,
    treadmillData,
    customExamOverrides,
  ]);

  // Evaluated medical values
  const currentFisik = fisikData || DEFAULT_FISIK_MATA;
  const currentLabItems = labData?.items || DEFAULT_LAB_ITEMS;
  const currentRontgen = rontgenData?.data || DEFAULT_NORMAL_RONTGEN;
  const currentEkg = ekgData?.ekg || DEFAULT_NORMAL_EKG;

  // Format date helper: converts YYYY-MM-DD to DD-MM-YYYY
  const formatDate = (val?: string) => {
    if (!val) return '09-06-2026';
    if (val.includes('-') && val.length === 10) {
      const parts = val.split('-');
      if (parts[0].length === 4) {
        return `${parts[2]}-${parts[1]}-${parts[0]}`;
      }
    }
    return val;
  };

  // Calculate age helper
  const patientAge = useMemo(() => {
    if (!patient.tglLahir) return 46;
    try {
      const parts = patient.tglLahir.split('-');
      let birthYear = 1979;
      if (parts[0].length === 4) birthYear = parseInt(parts[0]);
      else if (parts[2] && parts[2].length === 4) birthYear = parseInt(parts[2]);
      const currentYear = new Date().getFullYear();
      const age = currentYear - birthYear;
      return isNaN(age) || age <= 0 ? 46 : age;
    } catch (e) {
      return 46;
    }
  }, [patient.tglLahir]);

  // Gender label
  const patientGender = useMemo(() => {
    const g = (patient.jk || '').toUpperCase();
    if (g.startsWith('P') && !g.startsWith('PR')) return 'Wanita';
    if (g.startsWith('W')) return 'Wanita';
    return 'Pria';
  }, [patient.jk]);

  // Doctors configuration: Strictly follows Master Data: Setting Dokter Pemeriksa (examinerConfig)
  const docKoordinator =
    examinerConfig?.koordinatorMcu ||
    resumeData?.koordinatorDoctor ||
    resumeData?.koordinatorMcu ||
    clinic?.dokterPJ ||
    'dr. Hendra Wijaya, Sp.Ok';

  const docPemeriksaFisik =
    examinerConfig?.pemeriksaFisik ||
    resumeData?.examinerDoctor ||
    'dr. Anisa Rahmawati';

  const docRad =
    examinerConfig?.dokterRadiologi ||
    rontgenData?.doctorName ||
    'dr. Farida Hanum, Sp.Rad';

  const docPatologi =
    examinerConfig?.dokterPatologiKlinik ||
    'dr. Kevin Hendrawan, Sp.PK';

  const docTht =
    examinerConfig?.dokterSpesialisTht ||
    'dr. Bambang Hermanto, Sp.THT-BKL';

  const docParu =
    examinerConfig?.dokterSpesialisParu ||
    'dr. Rina Setyowati, Sp.P, FAPSR';

  const docOkupasi =
    examinerConfig?.dokterSpesialisOkupasi ||
    resumeData?.okupasiDoctor ||
    clinic?.dokterPJ ||
    'dr. Budi Santoso, Sp.Ok';

  const docCardio =
    ekgData?.doctorName ||
    examinerConfig?.pemeriksaFisik ||
    'dr. Hendra Wijaya, Sp.JP';

  // Status Kesehatan
  const fitnessStatus = useMemo(() => {
    const s = resumeData?.kesimpulanUmum || resumeData?.fitnessCriteria || 'Fit with Note';
    if (s.toLowerCase().includes('restriction') || s.toLowerCase().includes('note') || s.toLowerCase().includes('catatan')) {
      return 'FIT WITH NOTE';
    }
    if (s.toLowerCase().includes('unfit') && s.toLowerCase().includes('temp')) {
      return 'TEMPORARY UNFIT';
    }
    if (s.toLowerCase().includes('unfit')) {
      return 'UNFIT TO WORK';
    }
    if (s.toLowerCase().includes('fit')) {
      return 'FIT TO WORK';
    }
    return 'FIT WITH NOTE';
  }, [resumeData]);

  // Auto-calculated clinical findings & advice for Page 1
  const autoCalculated = useMemo(() => {
    return calculateMedicalResume(patient.mcuNo);
  }, [patient?.mcuNo]);

  // Parse findings for Page 1
  const kesimpulanItems = useMemo(() => {
    if (resumeData?.medResume) {
      const lines = resumeData.medResume
        .split(/\n+|\d+\.\s+/)
        .map((l: string) => l.trim())
        .filter((l: string) => l.length > 2);
      if (lines.length > 0) return lines;
    }
    if (autoCalculated.findings && autoCalculated.findings.length > 0) {
      return autoCalculated.findings;
    }
    return [
      'Pemeriksaan fisik umum, tanda vital, dan seluruh hasil penunjang dalam batas normal (Fit to Work).',
    ];
  }, [resumeData?.medResume, autoCalculated.findings]);

  // Parse advice for Page 1
  const saranItems = useMemo(() => {
    if (resumeData?.doctorAdvice) {
      const lines = resumeData.doctorAdvice
        .split(/\n+|\d+\.\s+/)
        .map((l: string) => l.trim())
        .filter((l: string) => l.length > 2);
      if (lines.length > 0) return lines;
    }
    if (autoCalculated.advices && autoCalculated.advices.length > 0) {
      return autoCalculated.advices;
    }
    return [
      'Pertahankan pola hidup sehat, gizi seimbang, cukupi hidrasi air putih, olahraga rutin teratur, dan patuhi standar K3 di area kerja.',
    ];
  }, [resumeData?.doctorAdvice, autoCalculated.advices]);

  // Calculate BMI and Ideal weight range for Page 3
  const tb = currentFisik.tinggiBadan || 150;
  const bb = currentFisik.beratBadan || 60;
  const bmiVal = ((bb / Math.pow(tb / 100, 2)) || 26.66).toFixed(2);
  const idealBbMin = Math.round(18.5 * Math.pow(tb / 100, 2) * 10) / 10;
  const idealBbMax = Math.round(22.9 * Math.pow(tb / 100, 2) * 10) / 10;
  const idealBbRange = `${idealBbMin} - ${idealBbMax}`;

  // Handle Photo Upload
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (uploadEvent) => {
      const result = uploadEvent.target?.result as string;
      if (result) {
        setPatientPhoto(result);
        try {
          localStorage.setItem(`simreg_photo_${patient.mcuNo}`, result);
        } catch (err) {}
        onNotify(`Pasfoto peserta [${patient.nama}] berhasil disimpan dan dipasang pada template MCU.`);
      }
    };
    reader.readAsDataURL(file);
  };

  // Handle Remove Photo
  const handleRemovePhoto = () => {
    setPatientPhoto(null);
    try {
      localStorage.removeItem(`simreg_photo_${patient.mcuNo}`);
    } catch (err) {}
    onNotify('Pasfoto peserta telah dihapus dari template.');
  };

  // Dynamic Sheets Calculation for Tabs and Dynamic Page Numbers
  const activeSheets = useMemo(() => {
    const sheets: { id: string; title: string; shortTitle: string; icon: any }[] = [
      { id: 'page1', title: 'Hal 1: Cover & Kesimpulan MCU', shortTitle: 'Cover & Kesimpulan', icon: FileText },
      { id: 'page2', title: 'Hal 2: Team Dokter MCU', shortTitle: 'Team Dokter', icon: UserCheck },
    ];

    if (examInclusion.hasFisik) {
      sheets.push({ id: 'page3', title: 'Hal 3: Pemeriksaan Fisik', shortTitle: 'Fisik & Mata', icon: Stethoscope });
    }
    if (examInclusion.hasLab) {
      sheets.push({ id: 'page4', title: 'Hal 4: Laboratorium', shortTitle: 'Laboratorium', icon: FlaskConical });
    }
    if (examInclusion.hasRontgen) {
      sheets.push({ id: 'page5', title: 'Hal 5: Thorax Foto (Radiologi)', shortTitle: 'Thorax Foto', icon: Activity });
    }
    if (examInclusion.hasEkg) {
      sheets.push({ id: 'page6', title: 'Hal 6: Elektrokardiographi (EKG)', shortTitle: 'EKG', icon: HeartPulse });
    }
    if (examInclusion.hasAudio) {
      sheets.push({ id: 'audiometri', title: 'Audiometri Nada Murni', shortTitle: 'Audiometri', icon: Ear });
    }
    if (examInclusion.hasSpiro) {
      sheets.push({ id: 'spirometri', title: 'Spirometri (Faal Paru)', shortTitle: 'Spirometri', icon: Wind });
    }
    if (examInclusion.hasUsg) {
      sheets.push({ id: 'usg', title: 'USG Abdomen', shortTitle: 'USG Abdomen', icon: Microscope });
    }
    if (examInclusion.hasTreadmill) {
      sheets.push({ id: 'treadmill', title: 'Treadmill Test', shortTitle: 'Treadmill', icon: Activity });
    }

    return sheets;
  }, [examInclusion]);

  // Helper to get 1-based page number for dynamic footer
  const getPageInfo = (sheetId: string) => {
    const idx = activeSheets.findIndex((s) => s.id === sheetId);
    const pageNum = idx >= 0 ? idx + 1 : 1;
    return `Halaman ${pageNum} dari ${activeSheets.length}`;
  };

  const [isPrinting, setIsPrinting] = useState(false);
  const [processStatus, setProcessStatus] = useState<string>('');
  const [progressPercent, setProgressPercent] = useState<number>(0);

  // Full-Fledged PDF & Print Execution Engine
  const executePrint = async (mode: 'print' | 'pdf' = 'print') => {
    if (isPrinting) return;
    setIsPrinting(true);
    setProgressPercent(10);
    setProcessStatus(mode === 'pdf' ? 'Menyiapkan seluruh lembar buku MCU...' : 'Mempersiapkan jendela cetak resmi...');

    // Switch view to all pages so that every active sheet is in the DOM
    setActiveTab('all');

    const cleanNama = (patient.nama || 'Peserta').replace(/[^a-zA-Z0-9_-]/g, '_');
    const docTitle = `Buku_MCU_${patient.mcuNo || '001'}_${cleanNama}`;
    const originalTitle = document.title;
    document.title = docTitle;

    // Wait for React to render all sheets
    await new Promise((resolve) => setTimeout(resolve, 350));

    const printableEl = document.getElementById('mcu-printable-container');
    const sheets = Array.from(
      printableEl ? printableEl.querySelectorAll<HTMLElement>('.oza-page-sheet') : []
    );

    if (mode === 'print') {
      // 1. Open dedicated A4 print window immediately (native browser print dialog with full CSS)
      const openedWin = openMcuPrintWindow(patient, clinic, printableEl?.innerHTML || '');
      if (openedWin) {
        onNotify(`🖨️ Jendela cetak resmi Buku MCU untuk ${patient.nama} berhasil dibuka. Silakan cetak atau simpan.`);
      } else {
        // Fallback if popup blocked
        try {
          window.print();
        } catch (err) {
          console.error('Print fallback error:', err);
        }
        onNotify(`🖨️ Membuka dialog cetak untuk ${patient.nama}...`);
      }
      setIsPrinting(false);
      document.title = originalTitle;
      return;
    }

    // mode === 'pdf' (Tombol Unduh PDF)
    try {
      if (sheets.length === 0) {
        throw new Error('Lembar halaman tidak ditemukan.');
      }

      await downloadMcuBookletPdf(patient, sheets, (pct, status) => {
        setProgressPercent(pct);
        setProcessStatus(status);
      });

      onNotify(`✓ Berkas PDF Buku MCU untuk ${patient.nama} (${docTitle}.pdf) berhasil diunduh!`);
    } catch (err) {
      console.warn('Direct PDF canvas generation encountered error, falling back to clean print window:', err);
      // Fail-Safe Fallback: Open clean printable window where user can choose "Simpan sebagai PDF"
      const openedWin = openMcuPrintWindow(patient, clinic, printableEl?.innerHTML || '');
      if (openedWin) {
        onNotify('📄 Berkas dibuka di jendela cetak A4. Pilih "Simpan sebagai PDF" (Save as PDF) untuk mengunduh.');
      } else {
        try {
          window.print();
        } catch (e) {
          console.error('Fallback print error:', e);
        }
        onNotify('Silakan simpan berkas dengan memilih "Simpan sebagai PDF" pada dialog cetak.');
      }
    } finally {
      setIsPrinting(false);
      setProcessStatus('');
      setProgressPercent(100);
      document.title = originalTitle;
    }
  };

  // Auto trigger print/PDF if initialAction was specified
  useEffect(() => {
    if (initialAction === 'pdf') {
      const timer = setTimeout(() => {
        executePrint('pdf');
      }, 600);
      return () => clearTimeout(timer);
    } else if (initialAction === 'print') {
      const timer = setTimeout(() => {
        executePrint('print');
      }, 600);
      return () => clearTimeout(timer);
    }
  }, [initialAction]);

  // Helper component: Dynamic Clinic Header + Patient Box (with Optional Photo Thumbnail)
  const McuReportHeader = () => (
    <div className="flex items-start justify-between pb-3 border-b border-slate-300">
      {/* Left: Dynamic Clinic Logo & Identity */}
      <div className="flex items-center gap-3">
        {clinic?.logoUrl ? (
          <div className="max-w-[120px] max-h-14 flex items-center justify-center shrink-0">
            <img
              src={clinic.logoUrl}
              alt={clinic.nama}
              className="max-h-12 max-w-[120px] object-contain shrink-0"
            />
          </div>
        ) : (
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-600 via-cyan-700 to-blue-800 flex items-center justify-center shadow-xs border border-cyan-400 text-white shrink-0">
            <Hospital className="w-6 h-6" />
          </div>
        )}
        <div className="max-w-[270px]">
          <div className="text-[15px] font-black tracking-wider text-slate-900 leading-tight uppercase">
            {clinic?.nama || 'KLINIK PRATAMA SEHAT TERPADU'}
          </div>
          {clinic?.legalitas && (
            <div className="text-[10px] font-bold text-slate-700 tracking-tight leading-snug">
              {clinic.legalitas}
            </div>
          )}
          <div className="text-[9px] italic font-medium text-slate-600 tracking-tight mt-0.5 leading-tight">
            {clinic?.tagline || (clinic?.izinOperasional ? `Izin Operasional: ${clinic.izinOperasional}` : 'Pemeriksaan Kesehatan Kerja & MCU')}
          </div>
        </div>
      </div>

      {/* Right: Patient Data Box (with dynamic photo thumbnail if available) */}
      <div className="border border-slate-700 rounded-xs px-3 py-1.5 text-[9.5px] font-sans leading-tight text-slate-900 min-w-[340px] max-w-[420px] flex items-center gap-2.5 bg-white">
        {patientPhoto && (
          <div className="w-13 h-17 border border-slate-600 shrink-0 overflow-hidden bg-white shadow-2xs">
            <img
              src={patientPhoto}
              alt={patient.nama}
              className="w-full h-full object-cover"
            />
          </div>
        )}

        <div className="grid grid-cols-[105px_10px_1fr] gap-y-0.5 flex-1 items-baseline">
          <span className="font-semibold text-slate-700">No. ID / Mcu</span>
          <span className="font-bold text-slate-500 text-center">:</span>
          <span className="font-mono font-bold text-slate-950">{patient.mcuNo}</span>

          <span className="font-semibold text-slate-700">Tanggal Mcu</span>
          <span className="font-bold text-slate-500 text-center">:</span>
          <span className="font-medium text-slate-900">{formatDate(patient.tglMcu)}</span>

          <span className="font-semibold text-slate-700">N a m a</span>
          <span className="font-bold text-slate-500 text-center">:</span>
          <span className="font-bold text-slate-950 uppercase truncate max-w-[180px]">{patient.nama}</span>

          <span className="font-semibold text-slate-700">Tanggal Lahir (P/W)</span>
          <span className="font-bold text-slate-500 text-center">:</span>
          <div className="flex items-center gap-1.5 truncate max-w-[185px]">
            <span className="text-slate-900">{formatDate(patient.tglLahir)}</span>
            <span className="text-slate-700 font-medium">({patientGender} / {patientAge} Thn.)</span>
          </div>

          <span className="font-semibold text-slate-700">NIK / NRP</span>
          <span className="font-bold text-slate-500 text-center">:</span>
          <span className="font-mono text-slate-900">{patient.nik || '-'}</span>

          <span className="font-semibold text-slate-700">B a g i a n</span>
          <span className="font-bold text-slate-500 text-center">:</span>
          <span className="text-slate-900 truncate max-w-[180px]">{patient.bagian || patient.dept || '-'}</span>

          <span className="font-semibold text-slate-700">Perusahaan</span>
          <span className="font-bold text-slate-500 text-center">:</span>
          <span className="font-bold uppercase text-[9px] leading-tight text-slate-900 truncate max-w-[180px]">{patient.pt}</span>

          <span className="font-semibold text-slate-700">Paket MCU</span>
          <span className="font-bold text-slate-500 text-center">:</span>
          <span className="font-medium text-slate-900 text-[8.5px] leading-tight truncate max-w-[180px]">{activePackage?.nama || patient.paket || 'Paket Standar'}</span>
        </div>
      </div>
    </div>
  );
  const OzaHeader = McuReportHeader;

  // Helper component: Dynamic Clinic Footer (Nama Klinik, Alamat, Telp, Email, Web & Nomor Halaman)
  const McuReportFooter = ({ sheetId }: { sheetId: string }) => {
    const clinicName = clinic?.nama || 'KLINIK PRATAMA SEHAT TERPADU';
    const clinicLegalitas = clinic?.legalitas || '';
    const clinicAddress = clinic?.alamat || 'Jl. Kesehatan Raya No. 45';
    const clinicCity = clinic?.kota ? clinic.kota : '';
    const clinicProv = clinic?.provinsi ? clinic.provinsi : '';
    const clinicKodePos = clinic?.kodePos ? clinic.kodePos : '';
    const clinicPhone = clinic?.telp || clinic?.telepon || '-';
    const clinicWeb = clinic?.web || clinic?.website || '';
    const clinicEmail = clinic?.email || '';

    const locationDetails = [clinicCity, clinicProv, clinicKodePos ? `Kode Pos ${clinicKodePos}` : ''].filter(Boolean).join(', ');

    return (
      <div className="mt-auto pt-3 border-t border-slate-300 flex items-end justify-between text-[9px] text-slate-700">
        <div className="leading-snug max-w-[540px]">
          <div className="font-bold text-slate-900 text-[9.5px] uppercase tracking-tight">
            {clinicLegalitas ? `${clinicLegalitas} • ${clinicName}` : clinicName}
          </div>
          <div className="text-slate-800">
            {clinicAddress}
            {locationDetails ? ` — ${locationDetails}` : ''}
          </div>
          <div className="text-slate-700 flex flex-wrap items-center gap-x-2">
            <span>Telp: <strong className="text-slate-900 font-semibold">{clinicPhone}</strong></span>
            {clinicEmail && (
              <span>• Email: <strong className="text-slate-900 font-semibold">{clinicEmail}</strong></span>
            )}
            {clinicWeb && (
              <span>• Web: <strong className="text-slate-900 font-semibold">{clinicWeb}</strong></span>
            )}
          </div>
        </div>

        {/* Dynamic Page Number */}
        <div className="font-bold text-slate-700 text-[10px] pb-0.5 tracking-tight text-right shrink-0">
          {getPageInfo(sheetId)}
        </div>
      </div>
    );
  };
  const OzaFooter = McuReportFooter;

  // Helper component: Official Stamp & Signature dynamically synced to Clinic & Doctor
  const DoctorStampSignature = ({
    doctorName,
    roleTitle,
    customTtdUrl,
    customStempelUrl,
  }: {
    doctorName: string;
    roleTitle: string;
    customTtdUrl?: string;
    customStempelUrl?: string;
  }) => {
    const stampLegalitas = (clinic?.legalitas || clinic?.nama || 'KLINIK PENYELENGGARA MCU').toUpperCase();
    const stampNama = (clinic?.nama || 'KLINIK MCU TERPADU').toUpperCase();

    return (
      <div className="relative inline-flex flex-col items-center min-w-[210px]">
        <div className="text-[11px] text-slate-700 mb-1">{roleTitle}</div>
        <div className="relative w-36 h-20 flex items-center justify-center my-1">
          {/* Circular Clinic Stamp / Custom Digital Stamp */}
          {customStempelUrl ? (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-90 rotate-[-5deg]">
              <img
                src={customStempelUrl}
                alt="Stempel Digital Koordinator"
                className="w-24 h-24 object-contain"
              />
            </div>
          ) : (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-85 rotate-[-5deg]">
              <div className="w-24 h-24 rounded-full border-2 border-dashed border-cyan-700/80 p-0.5 flex items-center justify-center">
                <div className="w-full h-full rounded-full border-2 border-cyan-700/90 flex flex-col items-center justify-center text-center p-1 bg-cyan-50/20">
                  <span className="text-[6.5px] font-black text-cyan-800 tracking-tighter uppercase leading-none truncate max-w-[80px]">
                    ★ {stampLegalitas} ★
                  </span>
                  <span className="text-[9px] font-black text-cyan-900 tracking-wider uppercase my-0.5 truncate max-w-[82px]">
                    {stampNama}
                  </span>
                  <span className="text-[6px] font-extrabold text-cyan-800 tracking-tight uppercase leading-none">
                    PELAYANAN KESEHATAN MCU
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Doctor Signature: Custom Digital TTD or SVG vector */}
          {customTtdUrl ? (
            <img
              src={customTtdUrl}
              alt="TTD Digital Koordinator"
              className="relative z-10 max-h-16 max-w-[145px] object-contain drop-shadow-xs"
            />
          ) : (
            <svg
              className="relative z-10 w-32 h-16 text-blue-900 drop-shadow-xs"
              viewBox="0 0 160 80"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M 20 52 C 35 25, 45 15, 60 20 C 75 25, 55 65, 45 70 C 40 72, 70 30, 95 35 C 110 38, 85 65, 115 50 C 130 42, 145 35, 150 48"
                stroke="#1E3A8A"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M 30 45 L 85 40 M 95 42 L 140 38"
                stroke="#1E3A8A"
                strokeWidth="1.8"
                strokeLinecap="round"
              />
            </svg>
          )}
        </div>

        <div className="font-bold text-[12px] text-slate-900 mt-1 border-b border-slate-700 pb-0.5">
          {doctorName}
        </div>
      </div>
    );
  };

  return (
    <div
      id="mcu-booklet-modal"
      className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-y-auto"
    >
      {/* Dynamic print stylesheet for precise A4 print output */}
      <style>{`
        @media print {
          @page {
            size: A4 portrait;
            margin: 6mm 8mm 6mm 8mm;
          }
          html, body {
            background: white !important;
            color: black !important;
            margin: 0 !important;
            padding: 0 !important;
            overflow: visible !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          /* Hide anything outside the modal in print */
          body > *:not(#root) {
            display: none !important;
          }
          .no-print, .print\\:hidden {
            display: none !important;
          }
          #mcu-booklet-modal {
            position: static !important;
            inset: auto !important;
            width: 100% !important;
            height: auto !important;
            min-height: 100% !important;
            max-height: none !important;
            overflow: visible !important;
            background: transparent !important;
            backdrop-filter: none !important;
            padding: 0 !important;
            margin: 0 !important;
            display: block !important;
            z-index: auto !important;
          }
          #mcu-booklet-modal > div {
            max-height: none !important;
            height: auto !important;
            overflow: visible !important;
            border: none !important;
            border-radius: 0 !important;
            box-shadow: none !important;
            width: 100% !important;
            max-width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
            background: white !important;
          }
          #mcu-printable-container {
            width: 100% !important;
            max-width: 100% !important;
            padding: 0 !important;
            margin: 0 !important;
            background: white !important;
            overflow: visible !important;
            max-height: none !important;
            height: auto !important;
          }
          .oza-page-sheet {
            page-break-after: always !important;
            break-after: page !important;
            page-break-inside: avoid !important;
            break-inside: avoid !important;
            width: 100% !important;
            max-width: 210mm !important;
            min-height: 275mm !important;
            height: auto !important;
            display: flex !important;
            flex-direction: column !important;
            justify-content: space-between !important;
            box-sizing: border-box !important;
            padding: 4mm 2mm !important;
            margin: 0 auto !important;
            border: none !important;
            box-shadow: none !important;
            background: white !important;
          }
          .oza-page-sheet:last-child {
            page-break-after: auto !important;
            break-after: auto !important;
          }
        }
      `}</style>

      <div className="bg-white rounded-2xl max-w-5xl w-full shadow-2xl border border-slate-300 overflow-hidden flex flex-col max-h-[95vh] my-auto">
        {/* TOP BAR / CONTROLS (Hidden when printed) */}
        <div className="print:hidden bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white p-3.5 px-6 flex flex-wrap items-center justify-between gap-3 shrink-0 shadow-md">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-600 to-blue-700 flex items-center justify-center text-white shadow-xs font-black overflow-hidden shrink-0">
              {clinic?.logoUrl ? (
                <img src={clinic.logoUrl} alt={clinic.nama} className="w-full h-full object-contain p-0.5 bg-white" />
              ) : (
                <Hospital className="w-5 h-5 text-white" />
              )}
            </div>
            <div>
              <h4 className="font-extrabold text-[15px] tracking-tight flex items-center gap-2">
                Format Cetak Resmi MCU: {clinic?.nama || 'Klinik Penyelenggara'}
                <span className="text-[11px] font-semibold bg-white/20 text-cyan-200 px-2 py-0.5 rounded-full border border-cyan-300/30">
                  {patient.mcuNo}
                </span>
              </h4>
              <p className="text-[12px] text-slate-300">
                Template Dinamis: {activePackage?.nama || patient.paket || 'Paket Standar'} ({activeSheets.length} Halaman Siap Cetak)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Package configuration toggler button */}
            <button
              onClick={() => setShowConfigBar(!showConfigBar)}
              className={`px-3 py-1.5 rounded-xl text-[12px] font-bold flex items-center gap-1.5 transition-all cursor-pointer border ${
                showConfigBar
                  ? 'bg-amber-400 text-slate-950 border-amber-300 shadow-xs'
                  : 'bg-white/10 hover:bg-white/20 text-white border-white/20'
              }`}
              title="Atur Paket & Pemeriksaan Dinamis"
            >
              <Settings2 className="w-4 h-4" />
              <span>Atur Paket ({activeSheets.length} Hal)</span>
            </button>

            {/* Photo upload action */}
            <label className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-[12px] font-bold flex items-center gap-1.5 transition-all cursor-pointer border border-white/20">
              <Camera className="w-4 h-4 text-cyan-300" />
              <span>{patientPhoto ? 'Ganti Foto' : '+ Pasfoto'}</span>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handlePhotoUpload}
              />
            </label>

            {patientPhoto && (
              <button
                onClick={handleRemovePhoto}
                className="p-1.5 rounded-xl bg-white/10 hover:bg-rose-600/80 text-rose-300 hover:text-white transition-colors cursor-pointer"
                title="Hapus Pasfoto"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}

            <button
              onClick={() => executePrint('pdf')}
              disabled={isPrinting}
              className="px-3.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-[12px] font-bold flex items-center gap-1.5 transition-all cursor-pointer border border-white/20 disabled:opacity-50"
              title="Unduh Buku MCU Format PDF"
            >
              {isPrinting ? (
                <Loader2 className="w-4 h-4 animate-spin text-amber-300" />
              ) : (
                <Download className="w-4 h-4 text-amber-300" />
              )}
              Unduh PDF
            </button>

            <button
              onClick={() => executePrint('print')}
              disabled={isPrinting}
              className="px-4 py-1.5 rounded-xl bg-amber-400 text-slate-950 hover:bg-amber-300 text-[12.5px] font-black flex items-center gap-1.5 shadow-md transition-all cursor-pointer disabled:opacity-50"
              title="Cetak Buku MCU Sekarang"
            >
              {isPrinting ? (
                <Loader2 className="w-4 h-4 animate-spin text-slate-950" />
              ) : (
                <Printer className="w-4 h-4" />
              )}
              Cetak Sekarang
            </button>

            <button
              onClick={onClose}
              className="w-8 h-8 rounded-lg bg-white/10 hover:bg-rose-600 text-white flex items-center justify-center transition-colors ml-1 cursor-pointer"
              title="Tutup Pratinjau"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* DYNAMIC PACKAGE & EXAM CONFIGURATION DRAWER (Hidden in print) */}
        {showConfigBar && (
          <div className="print:hidden bg-amber-50/90 border-b border-amber-200 p-3 px-6 text-slate-900 shrink-0 animate-in slide-in-from-top-2 duration-150">
            <div className="flex flex-wrap items-center justify-between gap-3 text-[12px]">
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-amber-950 flex items-center gap-1.5">
                  <Settings2 className="w-4 h-4 text-amber-700" />
                  Paket Pemeriksaan:
                </span>
                <select
                  value={selectedPackageKode}
                  onChange={(e) => {
                    setSelectedPackageKode(e.target.value);
                    setCustomExamOverrides({});
                    onNotify(`Paket MCU diubah menjadi: ${e.target.value}`);
                  }}
                  className="bg-white border border-amber-300 rounded-lg px-3 py-1 font-semibold text-slate-800 text-[12px] shadow-2xs focus:ring-2 focus:ring-amber-500"
                >
                  {allPackages.map((pkg) => (
                    <option key={pkg.id || pkg.kode} value={pkg.kode}>
                      {pkg.kode} - {pkg.nama}
                    </option>
                  ))}
                </select>
              </div>

              {/* Individual exam sheet toggles */}
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-[11.5px] font-bold text-amber-900 mr-1">
                  Pilih Halaman Pemeriksaan:
                </span>

                {[
                  { key: 'fisik', label: 'Fisik & Mata', active: examInclusion.hasFisik },
                  { key: 'lab', label: 'Laboratorium', active: examInclusion.hasLab },
                  { key: 'rontgen', label: 'Thorax Foto', active: examInclusion.hasRontgen },
                  { key: 'ekg', label: 'EKG', active: examInclusion.hasEkg },
                  { key: 'audio', label: 'Audiometri', active: examInclusion.hasAudio },
                  { key: 'spiro', label: 'Spirometri', active: examInclusion.hasSpiro },
                  { key: 'usg', label: 'USG Abdomen', active: examInclusion.hasUsg },
                  { key: 'treadmill', label: 'Treadmill', active: examInclusion.hasTreadmill },
                ].map((item) => (
                  <button
                    key={item.key}
                    onClick={() => {
                      setCustomExamOverrides((prev) => ({
                        ...prev,
                        [item.key]: !item.active,
                      }));
                    }}
                    className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer border ${
                      item.active
                        ? 'bg-amber-500 text-slate-950 border-amber-600 shadow-2xs'
                        : 'bg-white text-slate-500 border-slate-300 hover:bg-slate-100'
                    }`}
                  >
                    {item.active ? (
                      <CheckSquare className="w-3.5 h-3.5 text-slate-950" />
                    ) : (
                      <Square className="w-3.5 h-3.5 text-slate-400" />
                    )}
                    <span>{item.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* NAVIGATION TABS (Hidden in print) */}
        <div className="print:hidden bg-slate-100 border-b border-slate-200 px-4 py-2 flex items-center gap-1.5 overflow-x-auto text-[12px] shrink-0 scrollbar-thin">
          <button
            onClick={() => setActiveTab('all')}
            className={`px-3 py-1.5 rounded-lg font-bold whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'all'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-200'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            Semua Halaman ({activeSheets.length} Lembar)
          </button>

          {activeSheets.map((sheet, idx) => {
            const IconComponent = sheet.icon;
            return (
              <button
                key={sheet.id}
                onClick={() => setActiveTab(sheet.id)}
                className={`px-3 py-1.5 rounded-lg font-bold whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer ${
                  activeTab === sheet.id
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'text-slate-600 hover:bg-slate-200'
                }`}
              >
                <IconComponent className={`w-3.5 h-3.5 ${activeTab === sheet.id ? 'text-amber-300' : 'text-slate-500'}`} />
                <span>
                  {idx + 1}. {sheet.shortTitle}
                </span>
              </button>
            );
          })}
        </div>

        {/* BOOKLET CONTENT (SCROLLABLE & PRINTABLE CONTAINER) */}
        <div
          id="mcu-printable-container"
          className="p-4 sm:p-8 overflow-y-auto space-y-12 bg-slate-200 print:bg-white print:p-0 print:m-0 print:space-y-0"
        >
          {/* ============================================================== */}
          {/* PAGE 1: COVER & KESIMPULAN MEDICAL CHECK UP                    */}
          {/* ============================================================== */}
          {(activeTab === 'all' || activeTab === 'page1') && (
            <div className="oza-page-sheet bg-white border border-slate-300 rounded-xl p-8 shadow-sm print:rounded-none max-w-[210mm] mx-auto min-h-[280mm] flex flex-col justify-between">
              <div>
                <OzaHeader />

                {/* Title */}
                <h1 className="text-center font-bold text-[15px] text-slate-900 mt-4 mb-3">
                  Laporan Hasil Medical Check Up
                </h1>

                {/* Patient Identity Meta Block & Pasfoto Peserta */}
                <div className="max-w-2xl mx-auto my-3 text-[11px] leading-relaxed">
                  <div className="flex items-start gap-4 justify-between">
                    {/* Left: Identity fields - perfectly aligned 3-column layout */}
                    <div className="grid grid-cols-[145px_12px_1fr] gap-y-1 text-[11px] leading-snug flex-1 bg-slate-50/70 p-3 rounded-lg border border-slate-200 shadow-2xs items-baseline">
                      <span className="font-semibold text-slate-700">No.ID/Mcu</span>
                      <span className="font-bold text-slate-500 text-center">:</span>
                      <span className="font-bold font-mono text-slate-950">{patient.mcuNo}</span>

                      <span className="font-semibold text-slate-700">Tanggal Mcu</span>
                      <span className="font-bold text-slate-500 text-center">:</span>
                      <span className="font-medium text-slate-900">{formatDate(patient.tglMcu)}</span>

                      <span className="font-semibold text-slate-700">N a m a</span>
                      <span className="font-bold text-slate-500 text-center">:</span>
                      <span className="font-bold text-slate-950 uppercase">{patient.nama}</span>

                      <span className="font-semibold text-slate-700">Tanggal Lahir (P/W)</span>
                      <span className="font-bold text-slate-500 text-center">:</span>
                      <div className="flex items-center gap-2">
                        <span className="text-slate-900 font-medium">{formatDate(patient.tglLahir)}</span>
                        <span className="font-semibold text-slate-800 bg-white px-2 py-0.5 rounded-sm border border-slate-200 text-[10.5px]">
                          {patientGender} / {patientAge} Thn.
                        </span>
                      </div>

                      <span className="font-semibold text-slate-700">NIK/NRP</span>
                      <span className="font-bold text-slate-500 text-center">:</span>
                      <span className="font-mono text-slate-900">{patient.nik || '-'}</span>

                      <span className="font-semibold text-slate-700">B a g i a n</span>
                      <span className="font-bold text-slate-500 text-center">:</span>
                      <span className="text-slate-900">{patient.bagian || patient.dept || '-'}</span>

                      <span className="font-semibold text-slate-700">Perusahaan</span>
                      <span className="font-bold text-slate-500 text-center">:</span>
                      <span className="font-bold uppercase text-[11px] text-slate-950">{patient.pt}</span>

                      <span className="font-semibold text-slate-700">Paket MCU</span>
                      <span className="font-bold text-slate-500 text-center">:</span>
                      <span className="font-bold text-sky-950">{activePackage?.nama || patient.paket || 'Paket Standar'}</span>

                      {patient.pemeriksaanTambahan && (
                        <>
                          <span className="font-semibold text-slate-700">Pemeriksaan Tambahan</span>
                          <span className="font-bold text-slate-500 text-center">:</span>
                          <span className="font-medium text-amber-900">{patient.pemeriksaanTambahan}</span>
                        </>
                      )}
                    </div>

                    {/* Right: Pasfoto Peserta (If available) */}
                    {patientPhoto ? (
                      <div className="flex flex-col items-center shrink-0">
                        <div className="w-24 h-32 border-2 border-slate-700 p-0.5 bg-white shadow-xs flex items-center justify-center overflow-hidden">
                          <img
                            src={patientPhoto}
                            alt={patient.nama}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <span className="text-[9px] font-bold text-slate-600 mt-1 uppercase tracking-tight">
                          Foto Peserta
                        </span>
                      </div>
                    ) : (
                      <div className="hidden sm:flex flex-col items-center shrink-0 print:hidden">
                        <label className="w-24 h-32 border-2 border-dashed border-slate-300 hover:border-amber-500 p-1 bg-slate-50 hover:bg-amber-50/40 rounded-xs flex flex-col items-center justify-center cursor-pointer transition-colors text-center text-slate-400 hover:text-amber-700">
                          <User className="w-8 h-8 mb-1" />
                          <span className="text-[9px] font-bold leading-tight">+ Tambah Pasfoto</span>
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={handlePhotoUpload}
                          />
                        </label>
                      </div>
                    )}
                  </div>
                </div>

                {/* Status Kesehatan & Kesimpulan Header Bar */}
                <div className="flex border border-slate-400 bg-slate-200 text-[11px] font-bold text-slate-900 my-3.5 shadow-2xs">
                  <div className="w-[42%] px-3 py-1.5 border-r border-slate-400 flex items-center justify-between">
                    <span>STATUS KESEHATAN</span>
                    <span className="font-black text-slate-950">: {fitnessStatus}</span>
                  </div>
                  <div className="flex-1 px-3 py-1.5 text-center font-black tracking-wide">
                    KESIMPULAN MEDICAL CHECK UP
                  </div>
                </div>

                {/* Kesimpulan List */}
                <div className="mt-3 text-[11px] text-slate-900 leading-relaxed">
                  <div className="font-bold italic mb-1.5">Kesimpulan :</div>
                  <div className="pl-2 space-y-1">
                    {kesimpulanItems.map((item, idx) => (
                      <div key={idx} className="flex items-start gap-1">
                        <span>•</span>
                        <span>{item}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Saran List */}
                <div className="mt-4 text-[11px] text-slate-900 leading-relaxed">
                  <div className="font-bold italic mb-1.5">Saran :</div>
                  <div className="pl-2 space-y-2 text-justify">
                    {saranItems.map((item, idx) => (
                      <div key={idx} className="flex items-start gap-1">
                        <span>•</span>
                        <span>{item}</span>
                      </div>
                    ))}
                    <div className="pt-2 font-medium">
                      Lakukan pemeriksaan kesehatan berkala setidaknya setiap 1 tahun sekali.
                    </div>
                  </div>
                </div>
              </div>

              <OzaFooter sheetId="page1" />
            </div>
          )}

          {/* ============================================================== */}
          {/* PAGE 2: TEAM DOKTER MCU & KOORDINATOR MCU (DINAMIS SESUAI PAKET)*/}
          {/* ============================================================== */}
          {(activeTab === 'all' || activeTab === 'page2') && (
            <div className="oza-page-sheet bg-white border border-slate-300 rounded-xl p-8 shadow-sm print:rounded-none max-w-[210mm] mx-auto min-h-[280mm] flex flex-col justify-between">
              <div>
                <OzaHeader />

                {/* Section Title Banner */}
                <div className="border-t-2 border-b-2 border-slate-800 bg-slate-200 py-1.5 text-center font-black text-[12px] text-slate-900 tracking-wider my-4">
                  LEMBAR PENGESAHAN &amp; TIM DOKTER PEMERIKSA MCU
                </div>

                <p className="text-[10.5px] text-slate-700 leading-relaxed mb-6 text-justify">
                  Pemeriksaan kesehatan kerja berkala ini diselenggarakan oleh Tim Medis dan Dokter Spesialis bersertifikasi resmi yang berwenang dalam bidang Kedokteran Kerja dan Kelaikan Kerja (Fit to Work) sesuai dengan Peraturan Menteri Tenaga Kerja dan Transmigrasi Republik Indonesia.
                </p>

                {/* Main Content Area: Team Dokter & Koordinator MCU */}
                <div className="grid grid-cols-2 gap-8 items-start my-6">
                  {/* Left: Team Dokter MCU (Dinamis disesuaikan dengan item pemeriksaan paket) */}
                  <div className="border border-slate-400 bg-slate-50/50 p-4 rounded-xs shadow-2xs">
                    <div className="bg-slate-300 py-1.5 px-3 font-bold text-[11.5px] text-slate-900 text-center tracking-wide mb-3 border border-slate-400 uppercase">
                      TIM DOKTER PEMERIKSA
                    </div>
                    <div className="space-y-2 text-[11px] font-semibold text-slate-900 leading-relaxed divide-y divide-slate-200">
                      <div className="pt-1 flex items-start justify-between">
                        <span className="font-bold">{docKoordinator}</span>
                        <span className="text-[10px] text-slate-600 font-normal">Koordinator MCU</span>
                      </div>
                      <div className="pt-1.5 flex items-start justify-between">
                        <span className="font-bold">{docOkupasi}</span>
                        <span className="text-[10px] text-slate-600 font-normal">Sp. Okupasi</span>
                      </div>
                      {examInclusion.hasFisik && (
                        <div className="pt-1.5 flex items-start justify-between">
                          <span className="font-bold">{docPemeriksaFisik}</span>
                          <span className="text-[10px] text-slate-600 font-normal">Pemeriksa Fisik</span>
                        </div>
                      )}
                      {examInclusion.hasLab && (
                        <div className="pt-1.5 flex items-start justify-between">
                          <span className="font-bold">{docPatologi}</span>
                          <span className="text-[10px] text-slate-600 font-normal">Sp. Patologi Klinik</span>
                        </div>
                      )}
                      {(examInclusion.hasRontgen || examInclusion.hasUsg) && (
                        <div className="pt-1.5 flex items-start justify-between">
                          <span className="font-bold">{docRad}</span>
                          <span className="text-[10px] text-slate-600 font-normal">Sp. Radiologi</span>
                        </div>
                      )}
                      {(examInclusion.hasEkg || examInclusion.hasTreadmill) && (
                        <div className="pt-1.5 flex items-start justify-between">
                          <span className="font-bold">{docCardio}</span>
                          <span className="text-[10px] text-slate-600 font-normal">Penilai EKG &amp; Jantung</span>
                        </div>
                      )}
                      {examInclusion.hasAudio && (
                        <div className="pt-1.5 flex items-start justify-between">
                          <span className="font-bold">{docTht}</span>
                          <span className="text-[10px] text-slate-600 font-normal">Sp. THT-BKL</span>
                        </div>
                      )}
                      {examInclusion.hasSpiro && (
                        <div className="pt-1.5 flex items-start justify-between">
                          <span className="font-bold">{docParu}</span>
                          <span className="text-[10px] text-slate-600 font-normal">Sp. Pulmonologi/Paru</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right: Koordinator MCU & Stamp */}
                  <div className="flex flex-col items-center justify-center p-4 border border-slate-400 bg-slate-50/50 rounded-xs shadow-2xs text-center">
                    <div className="text-[11px] font-bold text-slate-900 mb-1 uppercase tracking-wide">
                      Pengesahan Koordinator MCU
                    </div>
                    <div className="text-[10px] text-slate-600 mb-3">
                      {clinic?.kota || 'Tangerang'}, {formatDate(patient.tglMcu)}
                    </div>
                    <DoctorStampSignature
                      doctorName={docKoordinator}
                      roleTitle="Dokter Penanggung Jawab / Koordinator"
                      customTtdUrl={examinerConfig?.koordinatorTtdUrl}
                      customStempelUrl={examinerConfig?.koordinatorStempelUrl}
                    />
                  </div>
                </div>

                {/* Additional Note at bottom */}
                <div className="bg-slate-100 p-3 rounded-xs border border-slate-300 text-[9.5px] text-slate-700 leading-normal mt-8">
                  <span className="font-bold text-slate-900">Catatan Kerahasiaan Medis (Medical Confidentiality):</span> Seluruh data dan rekam hasil pemeriksaan dalam buku ini bersifat rahasia medis dan hanya diperuntukkan bagi peserta dan institusi yang bersangkutan demi kepentingan evaluasi kesehatan kerja dan keselamatan lingkungan kerja.
                </div>
              </div>

              <OzaFooter sheetId="page2" />
            </div>
          )}

          {/* ============================================================== */}
          {/* PAGE 3: HASIL PEMERIKSAAN FISIK                                */}
          {/* ============================================================== */}
          {examInclusion.hasFisik && (activeTab === 'all' || activeTab === 'page3') && (
            <div className="oza-page-sheet bg-white border border-slate-300 rounded-xl p-8 shadow-sm print:rounded-none max-w-[210mm] mx-auto min-h-[280mm] flex flex-col justify-between">
              <div>
                <OzaHeader />

                {/* Section Banner */}
                <div className="border-t-2 border-b-2 border-slate-800 bg-slate-200 py-1 text-center font-black text-[12px] text-slate-900 tracking-wider my-2.5">
                  HASIL PEMERIKSAAN FISIK
                </div>

                {/* 2-Column Table matching template */}
                <div className="grid grid-cols-2 gap-x-4 text-[10px] leading-tight">
                  {/* LEFT COLUMN */}
                  <div className="border border-slate-400">
                    <div className="flex bg-slate-200 font-bold border-b border-slate-400 text-slate-900 px-2 py-1">
                      <div className="w-[55%]">ITEM PEMERIKSAAN</div>
                      <div className="w-[45%] text-center tracking-widest">H A S I L</div>
                    </div>

                    <div className="divide-y divide-slate-300">
                      {/* Anamnesa */}
                      <div className="bg-slate-100 font-bold px-2 py-0.5 text-slate-900">Anamnesa</div>
                      <div className="flex px-2 py-0.5 justify-between"><span className="w-[55%] pl-1">Keluhan saat ini</span><span className="w-[45%] text-center font-medium">{currentFisik.keluhan || 'Tidak Ada'}</span></div>
                      <div className="flex px-2 py-0.5 justify-between"><span className="w-[55%] pl-1">Riwayat Alergi</span><span className="w-[45%] text-center font-medium">{currentFisik.riwayatAlergi || 'Tidak Ada'}</span></div>
                      <div className="flex px-2 py-0.5 justify-between"><span className="w-[55%] pl-1">Riwayat Kesehatan Dahulu</span><span className="w-[45%] text-center font-medium">{currentFisik.rkd || 'Tidak Ada'}</span></div>
                      <div className="flex px-2 py-0.5 justify-between"><span className="w-[55%] pl-1">Riwayat Penyakit Keluarga</span><span className="w-[45%] text-center font-medium">{currentFisik.rpk || 'Tidak Ada'}</span></div>
                      <div className="flex px-2 py-0.5 justify-between"><span className="w-[55%] pl-1">Riwayat Bahaya Lingkungan Kerja</span><span className="w-[45%] text-center font-medium">Tidak Ada</span></div>
                      <div className="flex px-2 py-0.5 justify-between"><span className="w-[55%] pl-1">Riwayat Kecelakaan Kerja</span><span className="w-[45%] text-center font-medium">Tidak Ada</span></div>

                      {/* Kebiasaan */}
                      <div className="bg-slate-100 font-bold px-2 py-0.5 text-slate-900">Kebiasaan</div>
                      <div className="flex px-2 py-0.5 justify-between"><span className="w-[55%] pl-1">Merokok</span><span className="w-[45%] text-center font-medium">{currentFisik.merokok ? 'Ya' : 'Tidak'}</span></div>
                      <div className="flex px-2 py-0.5 justify-between"><span className="w-[55%] pl-1">Olahraga</span><span className="w-[45%] text-center font-medium">{currentFisik.olahraga ? 'Ya' : 'Tidak'}</span></div>
                      <div className="flex px-2 py-0.5 justify-between"><span className="w-[55%] pl-1">Pola Istirahat/Tidur</span><span className="w-[45%] text-center font-medium">{currentFisik.polaTidur || 'Kurang'}</span></div>
                      <div className="flex px-2 py-0.5 justify-between"><span className="w-[55%] pl-1">Minum Alkohol</span><span className="w-[45%] text-center font-medium">{currentFisik.alkohol ? 'Ya' : 'Tidak'}</span></div>
                      <div className="flex px-2 py-0.5 justify-between"><span className="w-[55%] pl-1">Minum Kopi</span><span className="w-[45%] text-center font-medium">Tidak</span></div>

                      {/* Keadaan Fisik */}
                      <div className="bg-slate-100 font-bold px-2 py-0.5 text-slate-900">Keadaan Fisik</div>
                      <div className="flex px-2 py-0.5 justify-between"><span className="w-[55%] pl-1">Kesan Umum</span><span className="w-[45%] text-center font-medium">{currentFisik.kesanUmum || 'Baik'}</span></div>
                      <div className="flex px-2 py-0.5 justify-between"><span className="w-[55%] pl-1">Kulit</span><span className="w-[45%] text-center font-medium">{currentFisik.kulit || 'Normal'}</span></div>
                      <div className="flex px-2 py-0.5 justify-between"><span className="w-[55%] pl-1">Tinggi Badan</span><span className="w-[45%] text-center font-medium">{tb}</span></div>
                      <div className="flex px-2 py-0.5 justify-between"><span className="w-[55%] pl-1">Berat Badan</span><span className="w-[45%] text-center font-medium">{bb}</span></div>
                      <div className="flex px-2 py-0.5 justify-between"><span className="w-[55%] pl-1">Lingkar perut</span><span className="w-[45%] text-center font-medium">{currentFisik.lingkarPerut || 98}</span></div>
                      <div className="flex px-2 py-0.5 justify-between"><span className="w-[55%] pl-1">Berat Badan Ideal</span><span className="w-[45%] text-center font-medium">{idealBbRange}</span></div>
                      <div className="flex px-2 py-0.5 justify-between"><span className="w-[55%] pl-1">BMI</span><span className="w-[45%] text-center font-medium">{bmiVal}</span></div>
                      <div className="flex px-2 py-0.5 justify-between"><span className="w-[55%] pl-1">Tekanan Darah/Tensi</span><span className="w-[45%] text-center font-medium">{currentFisik.sistol || 120}/{currentFisik.diastol || 90}</span></div>
                      <div className="flex px-2 py-0.5 justify-between"><span className="w-[55%] pl-1">Nadi</span><span className="w-[45%] text-center font-medium">{currentFisik.nadi || 78}</span></div>
                      <div className="flex px-2 py-0.5 justify-between"><span className="w-[55%] pl-1">Pernafasan</span><span className="w-[45%] text-center font-medium">{currentFisik.pernafasan || 18}</span></div>
                      <div className="flex px-2 py-0.5 justify-between"><span className="w-[55%] pl-1">Suhu</span><span className="w-[45%] text-center font-medium">{currentFisik.suhu || '36.0'}</span></div>

                      {/* Mata */}
                      <div className="bg-slate-100 font-bold px-2 py-0.5 text-slate-900">Mata</div>
                      <div className="flex px-2 py-0.5 justify-between"><span className="w-[55%] pl-1">Memakai Kacamata</span><span className="w-[45%] text-center font-medium">Kanan: -2.00 Kiri: -2.00</span></div>
                      <div className="flex px-2 py-0.5 justify-between"><span className="w-[55%] pl-1">Visus Mata Kanan Kiri</span><span className="w-[45%] text-center font-medium">OD:{currentFisik.visusOd || '20/100'}, OS:{currentFisik.visusOs || '20/100'}</span></div>
                      <div className="flex px-2 py-0.5 justify-between"><span className="w-[55%] pl-1">Buta Warna</span><span className="w-[45%] text-center font-medium">{currentFisik.butaWarna || 'Normal'}</span></div>
                      <div className="flex px-2 py-0.5 justify-between"><span className="w-[55%] pl-1">Konjungtiva</span><span className="w-[45%] text-center font-medium">{currentFisik.konjungtiva || 'Normal'}</span></div>
                      <div className="flex px-2 py-0.5 justify-between"><span className="w-[55%] pl-1">Sklera</span><span className="w-[45%] text-center font-medium">{currentFisik.sklera || 'Normal'}</span></div>
                      <div className="flex px-2 py-0.5 justify-between"><span className="w-[55%] pl-1">Pupil</span><span className="w-[45%] text-center font-medium">Isokor</span></div>
                      <div className="flex px-2 py-0.5 justify-between"><span className="w-[55%] pl-1">Lain-lain</span><span className="w-[45%] text-center font-medium">Tidak Ada</span></div>

                      {/* Telinga, Hidung, Tenggorokan */}
                      <div className="bg-slate-100 font-bold px-2 py-0.5 text-slate-900">Telinga, Hidung, Tenggorokan</div>
                      <div className="flex px-2 py-0.5 justify-between"><span className="w-[55%] pl-1">Bentuk Telinga</span><span className="w-[45%] text-center font-medium">Normal</span></div>
                      <div className="flex px-2 py-0.5 justify-between"><span className="w-[55%] pl-1">Membran Timpani</span><span className="w-[45%] text-center font-medium">Normal</span></div>
                      <div className="flex px-2 py-0.5 justify-between"><span className="w-[55%] pl-1">Serumen</span><span className="w-[45%] text-center font-medium">{currentFisik.serumenProp === 'Tidak Ada' ? '-/-' : currentFisik.serumenProp || '-/-'}</span></div>
                      <div className="flex px-2 py-0.5 justify-between"><span className="w-[55%] pl-1">Hidung/Sputum/Concha</span><span className="w-[45%] text-center font-medium">Normal</span></div>
                      <div className="flex px-2 py-0.5 justify-between"><span className="w-[55%] pl-1">Sinus</span><span className="w-[45%] text-center font-medium">Normal</span></div>
                      <div className="flex px-2 py-0.5 justify-between"><span className="w-[55%] pl-1">Tonsil</span><span className="w-[45%] text-center font-medium">Normal</span></div>
                    </div>
                  </div>

                  {/* RIGHT COLUMN */}
                  <div className="border border-slate-400">
                    <div className="flex bg-slate-200 font-bold border-b border-slate-400 text-slate-900 px-2 py-1">
                      <div className="w-[55%]">ITEM PEMERIKSAAN</div>
                      <div className="w-[45%] text-center tracking-widest">H A S I L</div>
                    </div>

                    <div className="divide-y divide-slate-300">
                      {/* THT lanjutan */}
                      <div className="flex px-2 py-0.5 justify-between"><span className="w-[55%] pl-1">Faring</span><span className="w-[45%] text-center font-medium">Normal</span></div>
                      <div className="flex px-2 py-0.5 justify-between"><span className="w-[55%] pl-1">Lain-lain</span><span className="w-[45%] text-center font-medium">Normal</span></div>

                      {/* Mulut */}
                      <div className="bg-slate-100 font-bold px-2 py-0.5 text-slate-900">Mulut</div>
                      <div className="flex px-2 py-0.5 justify-between"><span className="w-[55%] pl-1">Bibir</span><span className="w-[45%] text-center font-medium">Normal</span></div>
                      <div className="flex px-2 py-0.5 justify-between"><span className="w-[55%] pl-1">Lidah</span><span className="w-[45%] text-center font-medium">Normal</span></div>
                      <div className="flex px-2 py-0.5 justify-between">
                        <span className="w-[55%] pl-1">Gigi</span>
                        <span className="w-[45%] text-center font-medium text-slate-900">
                          {currentFisik.kariesGigi ? 'Carries Gigi (Gigi Berlubang)' : 'Normal'}
                        </span>
                      </div>
                      <div className="flex px-2 py-0.5 justify-between"><span className="w-[55%] pl-1">Lain-lain</span><span className="w-[45%] text-center font-medium">Normal</span></div>

                      {/* Leher */}
                      <div className="bg-slate-100 font-bold px-2 py-0.5 text-slate-900">Leher</div>
                      <div className="flex px-2 py-0.5 justify-between"><span className="w-[55%] pl-1">Umum</span><span className="w-[45%] text-center font-medium">Normal</span></div>
                      <div className="flex px-2 py-0.5 justify-between"><span className="w-[55%] pl-1">Kelenjar Tyroid</span><span className="w-[45%] text-center font-medium">{currentFisik.tiroid || 'Normal'}</span></div>
                      <div className="flex px-2 py-0.5 justify-between"><span className="w-[55%] pl-1">Kelenjar Getah Bening</span><span className="w-[45%] text-center font-medium">{currentFisik.kelenjarGetahBening || 'Normal'}</span></div>
                      <div className="flex px-2 py-0.5 justify-between"><span className="w-[55%] pl-1">Lain-lain</span><span className="w-[45%] text-center font-medium">Normal</span></div>

                      {/* Thorax */}
                      <div className="bg-slate-100 font-bold px-2 py-0.5 text-slate-900">Thorax</div>
                      <div className="flex px-2 py-0.5 justify-between"><span className="w-[55%] pl-1">Bentuk</span><span className="w-[45%] text-center font-medium">Normal</span></div>
                      <div className="flex px-2 py-0.5 justify-between"><span className="w-[55%] pl-1">Paru-paru</span><span className="w-[45%] text-center font-medium">Normal</span></div>
                      <div className="flex px-2 py-0.5 justify-between"><span className="w-[55%] pl-1">Jantung</span><span className="w-[45%] text-center font-medium">Normal</span></div>
                      <div className="flex px-2 py-0.5 justify-between"><span className="w-[55%] pl-1">Lain-lain</span><span className="w-[45%] text-center font-medium">Normal</span></div>

                      {/* Abdomen */}
                      <div className="bg-slate-100 font-bold px-2 py-0.5 text-slate-900">Abdomen</div>
                      <div className="flex px-2 py-0.5 justify-between"><span className="w-[55%] pl-1">Bentuk</span><span className="w-[45%] text-center font-medium">Normal</span></div>
                      <div className="flex px-2 py-0.5 justify-between"><span className="w-[55%] pl-1">Palpasi/Perkusi</span><span className="w-[45%] text-center font-medium">Supel</span></div>
                      <div className="flex px-2 py-0.5 justify-between"><span className="w-[55%] pl-1">Hernia</span><span className="w-[45%] text-center font-medium">Normal</span></div>
                      <div className="flex px-2 py-0.5 justify-between"><span className="w-[55%] pl-1">Hati</span><span className="w-[45%] text-center font-medium">{currentFisik.hepar || 'Tidak Teraba'}</span></div>
                      <div className="flex px-2 py-0.5 justify-between"><span className="w-[55%] pl-1">Limpa</span><span className="w-[45%] text-center font-medium">{currentFisik.lien || 'Tidak Teraba'}</span></div>
                      <div className="flex px-2 py-0.5 justify-between"><span className="w-[55%] pl-1">Haemorrhoid</span><span className="w-[45%] text-center font-medium">Tidak Ada</span></div>
                      <div className="flex px-2 py-0.5 justify-between"><span className="w-[55%] pl-1">Lain-lain</span><span className="w-[45%] text-center font-medium">Tidak Ada</span></div>

                      {/* Extremitas */}
                      <div className="bg-slate-100 font-bold px-2 py-0.5 text-slate-900">Extremitas</div>
                      <div className="flex px-2 py-0.5 justify-between"><span className="w-[55%] pl-1">Tulang/Sendi</span><span className="w-[45%] text-center font-medium">Normal</span></div>
                      <div className="flex px-2 py-0.5 justify-between"><span className="w-[55%] pl-1">Otot-otot/Tonus</span><span className="w-[45%] text-center font-medium">Normal</span></div>
                      <div className="flex px-2 py-0.5 justify-between"><span className="w-[55%] pl-1">Jari-jari/Kuku</span><span className="w-[45%] text-center font-medium">Tidak Ada</span></div>
                      <div className="flex px-2 py-0.5 justify-between"><span className="w-[55%] pl-1">Lain-lain</span><span className="w-[45%] text-center font-medium">Tidak Ada</span></div>
                    </div>
                  </div>
                </div>
              </div>

              <OzaFooter sheetId="page3" />
            </div>
          )}

          {/* ============================================================== */}
          {/* PAGE 4: HASIL PEMERIKSAAN LABORATORIUM                         */}
          {/* ============================================================== */}
          {examInclusion.hasLab && (activeTab === 'all' || activeTab === 'page4') && (
            <div className="oza-page-sheet bg-white border border-slate-300 rounded-xl p-8 shadow-sm print:rounded-none max-w-[210mm] mx-auto min-h-[280mm] flex flex-col justify-between">
              <div>
                <OzaHeader />

                {/* Section Banner */}
                <div className="border-t-2 border-b-2 border-slate-800 bg-slate-200 py-1 text-center font-black text-[12px] text-slate-900 tracking-wider my-2.5">
                  HASIL PEMERIKSAAN LABORATORIUM
                </div>

                {/* Lab Results Table */}
                <table className="w-full text-left text-[10px] border-collapse border border-slate-400">
                  <thead className="bg-slate-200 font-bold text-slate-900 border-b border-slate-400">
                    <tr>
                      <th className="p-1.5 pl-2 border-r border-slate-400 w-[32%]">ITEM PEMERIKSAAN</th>
                      <th className="p-1.5 text-center border-r border-slate-400 w-[18%] tracking-wider">H A S I L</th>
                      <th className="p-1.5 text-center border-r border-slate-400 w-[24%]">NILAI NORMAL</th>
                      <th className="p-1.5 text-center border-r border-slate-400 w-[13%]">UNIT</th>
                      <th className="p-1.5 text-center w-[13%]">KETERANGAN</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-300 text-slate-900">
                    {/* 1. HEMATOLOGY */}
                    <tr className="bg-slate-100 font-bold">
                      <td colSpan={5} className="p-1 pl-2 text-slate-900">Hematology</td>
                    </tr>
                    <tr className="font-semibold text-slate-800">
                      <td colSpan={5} className="p-0.5 pl-4 text-[9.5px]">Darah Lengkap</td>
                    </tr>

                    <tr>
                      <td className="p-0.5 pl-6">Haemoglobin</td>
                      <td className="p-0.5 text-center font-mono font-bold">14.0</td>
                      <td className="p-0.5 text-center">P(13-16), W(12-14)</td>
                      <td className="p-0.5 text-center">g/dl</td>
                      <td className="p-0.5 text-center">-</td>
                    </tr>
                    <tr>
                      <td className="p-0.5 pl-6">Leukosit</td>
                      <td className="p-0.5 text-center font-mono font-bold">5.7</td>
                      <td className="p-0.5 text-center">5 - 10</td>
                      <td className="p-0.5 text-center">10^3/uL</td>
                      <td className="p-0.5 text-center">-</td>
                    </tr>
                    <tr>
                      <td className="p-0.5 pl-6">Haematokrit</td>
                      <td className="p-0.5 text-center font-mono font-bold">42</td>
                      <td className="p-0.5 text-center">P(40-48), W(37-43)</td>
                      <td className="p-0.5 text-center">%</td>
                      <td className="p-0.5 text-center">-</td>
                    </tr>
                    <tr>
                      <td className="p-0.5 pl-6">Thrombosit</td>
                      <td className="p-0.5 text-center font-mono font-bold">333</td>
                      <td className="p-0.5 text-center">150 - 450</td>
                      <td className="p-0.5 text-center">10^3/uL</td>
                      <td className="p-0.5 text-center">-</td>
                    </tr>
                    <tr>
                      <td className="p-0.5 pl-6">Eritrosit</td>
                      <td className="p-0.5 text-center font-mono font-bold">4.8</td>
                      <td className="p-0.5 text-center">P(4.5-5.5), W(4-5)</td>
                      <td className="p-0.5 text-center">10^6/uL</td>
                      <td className="p-0.5 text-center">-</td>
                    </tr>
                    <tr>
                      <td className="p-0.5 pl-6">MCV</td>
                      <td className="p-0.5 text-center font-mono font-bold">87</td>
                      <td className="p-0.5 text-center">82 - 92</td>
                      <td className="p-0.5 text-center">fL</td>
                      <td className="p-0.5 text-center">-</td>
                    </tr>
                    <tr>
                      <td className="p-0.5 pl-6">MCH</td>
                      <td className="p-0.5 text-center font-mono font-bold">29</td>
                      <td className="p-0.5 text-center">27 - 31</td>
                      <td className="p-0.5 text-center">Pg</td>
                      <td className="p-0.5 text-center">-</td>
                    </tr>
                    <tr>
                      <td className="p-0.5 pl-6">MCHC</td>
                      <td className="p-0.5 text-center font-mono font-bold">32</td>
                      <td className="p-0.5 text-center">32 - 36</td>
                      <td className="p-0.5 text-center">%</td>
                      <td className="p-0.5 text-center">-</td>
                    </tr>

                    {/* Hitung Jenis Lekosit */}
                    <tr className="font-semibold text-slate-800">
                      <td colSpan={5} className="p-0.5 pl-4 text-[9.5px]">Hitung Jenis Lekosit</td>
                    </tr>
                    <tr>
                      <td className="p-0.5 pl-6">Basofil</td>
                      <td className="p-0.5 text-center font-mono font-bold">0</td>
                      <td className="p-0.5 text-center">0 - 1</td>
                      <td className="p-0.5 text-center">%</td>
                      <td className="p-0.5 text-center">-</td>
                    </tr>
                    <tr>
                      <td className="p-0.5 pl-6">Eosinofil</td>
                      <td className="p-0.5 text-center font-mono font-bold">2</td>
                      <td className="p-0.5 text-center">1 - 3</td>
                      <td className="p-0.5 text-center">%</td>
                      <td className="p-0.5 text-center">-</td>
                    </tr>
                    <tr>
                      <td className="p-0.5 pl-6">Nitrofil Batang</td>
                      <td className="p-0.5 text-center font-mono font-bold">2</td>
                      <td className="p-0.5 text-center">2 - 6</td>
                      <td className="p-0.5 text-center">%</td>
                      <td className="p-0.5 text-center">-</td>
                    </tr>
                    <tr>
                      <td className="p-0.5 pl-6">Nitrofil Segmen</td>
                      <td className="p-0.5 text-center font-mono font-bold">52</td>
                      <td className="p-0.5 text-center">50 - 70</td>
                      <td className="p-0.5 text-center">%</td>
                      <td className="p-0.5 text-center">-</td>
                    </tr>
                    <tr>
                      <td className="p-0.5 pl-6">Limfosit</td>
                      <td className="p-0.5 text-center font-mono font-bold">40</td>
                      <td className="p-0.5 text-center">20 - 40</td>
                      <td className="p-0.5 text-center">%</td>
                      <td className="p-0.5 text-center">-</td>
                    </tr>
                    <tr>
                      <td className="p-0.5 pl-6">Monosit</td>
                      <td className="p-0.5 text-center font-mono font-bold">4</td>
                      <td className="p-0.5 text-center">2 - 8</td>
                      <td className="p-0.5 text-center">%</td>
                      <td className="p-0.5 text-center">-</td>
                    </tr>
                    <tr>
                      <td className="p-0.5 pl-6">LED</td>
                      <td className="p-0.5 text-center font-mono font-bold">11</td>
                      <td className="p-0.5 text-center">P(0-15), W(0-20)</td>
                      <td className="p-0.5 text-center">mml/Jam</td>
                      <td className="p-0.5 text-center">-</td>
                    </tr>

                    {/* 2. KIMIA DARAH (IF INCLUDED IN LAB DATA) */}
                    {currentLabItems.some((i: any) => i.category === 'Kimia Darah') && (
                      <>
                        <tr className="bg-slate-100 font-bold">
                          <td colSpan={5} className="p-1 pl-2 text-slate-900">Kimia Darah (Profil Lipid, Fungsi Hati, Fungsi Ginjal, Gula Darah)</td>
                        </tr>
                        {currentLabItems
                          .filter((i: any) => i.category === 'Kimia Darah')
                          .map((item: any) => {
                            const isAbnormal = item.status && item.status !== 'Normal';
                            return (
                              <tr key={item.id} className={isAbnormal ? 'text-red-600 font-bold' : ''}>
                                <td className="p-0.5 pl-6">{item.name}</td>
                                <td className="p-0.5 text-center font-mono">
                                  {item.value} {isAbnormal ? '*' : ''}
                                </td>
                                <td className="p-0.5 text-center text-slate-800 font-normal">{item.refRange}</td>
                                <td className="p-0.5 text-center text-slate-800 font-normal">{item.unit}</td>
                                <td className="p-0.5 text-center font-normal">{isAbnormal ? item.status : '-'}</td>
                              </tr>
                            );
                          })}
                      </>
                    )}

                    {/* 3. URINE ANALYSIS */}
                    <tr className="bg-slate-100 font-bold">
                      <td colSpan={5} className="p-1 pl-2 text-slate-900">Urine Analysis</td>
                    </tr>
                    <tr className="font-semibold text-slate-800">
                      <td colSpan={5} className="p-0.5 pl-4 text-[9.5px]">Makroskopis</td>
                    </tr>
                    <tr>
                      <td className="p-0.5 pl-6">Warna</td>
                      <td className="p-0.5 text-center font-medium">Kuning</td>
                      <td className="p-0.5 text-center">Kuning</td>
                      <td className="p-0.5 text-center">-</td>
                      <td className="p-0.5 text-center">-</td>
                    </tr>
                    <tr>
                      <td className="p-0.5 pl-6">Kejernihan</td>
                      <td className="p-0.5 text-center font-medium">Jernih</td>
                      <td className="p-0.5 text-center">Jernih</td>
                      <td className="p-0.5 text-center">-</td>
                      <td className="p-0.5 text-center">-</td>
                    </tr>
                    <tr>
                      <td className="p-0.5 pl-6">Berat Jenis</td>
                      <td className="p-0.5 text-center font-mono font-bold">1.020</td>
                      <td className="p-0.5 text-center">1.005 - 1.030</td>
                      <td className="p-0.5 text-center">-</td>
                      <td className="p-0.5 text-center">-</td>
                    </tr>
                    <tr>
                      <td className="p-0.5 pl-6">Blood</td>
                      <td className="p-0.5 text-center font-medium">Negatif</td>
                      <td className="p-0.5 text-center">Negatif</td>
                      <td className="p-0.5 text-center">-</td>
                      <td className="p-0.5 text-center">-</td>
                    </tr>
                    <tr>
                      <td className="p-0.5 pl-6">Lekosit Esterase</td>
                      <td className="p-0.5 text-center font-medium">Negatif</td>
                      <td className="p-0.5 text-center">Negatif</td>
                      <td className="p-0.5 text-center">-</td>
                      <td className="p-0.5 text-center">-</td>
                    </tr>
                    <tr>
                      <td className="p-0.5 pl-6">pH</td>
                      <td className="p-0.5 text-center font-mono font-bold">6.0</td>
                      <td className="p-0.5 text-center">5.0 - 8.0</td>
                      <td className="p-0.5 text-center">-</td>
                      <td className="p-0.5 text-center">-</td>
                    </tr>
                    <tr>
                      <td className="p-0.5 pl-6">Protein</td>
                      <td className="p-0.5 text-center font-medium">Negatif</td>
                      <td className="p-0.5 text-center">Negatif</td>
                      <td className="p-0.5 text-center">-</td>
                      <td className="p-0.5 text-center">-</td>
                    </tr>
                    <tr>
                      <td className="p-0.5 pl-6">Glukosa</td>
                      <td className="p-0.5 text-center font-medium">Negatif</td>
                      <td className="p-0.5 text-center">Negatif</td>
                      <td className="p-0.5 text-center">-</td>
                      <td className="p-0.5 text-center">-</td>
                    </tr>
                    <tr>
                      <td className="p-0.5 pl-6">Keton Urine</td>
                      <td className="p-0.5 text-center font-medium">Negatif</td>
                      <td className="p-0.5 text-center">Negatif</td>
                      <td className="p-0.5 text-center">-</td>
                      <td className="p-0.5 text-center">-</td>
                    </tr>
                    <tr>
                      <td className="p-0.5 pl-6">Urobilinogen</td>
                      <td className="p-0.5 text-center font-mono font-bold">0.2</td>
                      <td className="p-0.5 text-center">0.2 - 1.0</td>
                      <td className="p-0.5 text-center">mg/dl</td>
                      <td className="p-0.5 text-center">-</td>
                    </tr>
                    <tr>
                      <td className="p-0.5 pl-6">Bilirubin</td>
                      <td className="p-0.5 text-center font-medium">Negatif</td>
                      <td className="p-0.5 text-center">Negatif</td>
                      <td className="p-0.5 text-center">-</td>
                      <td className="p-0.5 text-center">-</td>
                    </tr>
                    <tr>
                      <td className="p-0.5 pl-6">Nitrit</td>
                      <td className="p-0.5 text-center font-medium">Negatif</td>
                      <td className="p-0.5 text-center">Negatif</td>
                      <td className="p-0.5 text-center">-</td>
                      <td className="p-0.5 text-center">-</td>
                    </tr>

                    {/* Mikroskopis */}
                    <tr className="font-semibold text-slate-800">
                      <td colSpan={5} className="p-0.5 pl-4 text-[9.5px]">Mikroskopis</td>
                    </tr>
                    <tr>
                      <td className="p-0.5 pl-6">Lekosit</td>
                      <td className="p-0.5 text-center font-mono font-medium">0 - 3</td>
                      <td className="p-0.5 text-center">0 - 5</td>
                      <td className="p-0.5 text-center">/LPB</td>
                      <td className="p-0.5 text-center">-</td>
                    </tr>
                    <tr className="text-red-600 font-bold">
                      <td className="p-0.5 pl-6">Eritrosit</td>
                      <td className="p-0.5 text-center font-mono">0 - 3 *</td>
                      <td className="p-0.5 text-center text-slate-900 font-normal">0 - 3</td>
                      <td className="p-0.5 text-center text-slate-900 font-normal">/LPB</td>
                      <td className="p-0.5 text-center font-normal">Perhatian</td>
                    </tr>
                    <tr>
                      <td className="p-0.5 pl-6">Epitel</td>
                      <td className="p-0.5 text-center font-medium">Positif</td>
                      <td className="p-0.5 text-center">Positif</td>
                      <td className="p-0.5 text-center">/LPK</td>
                      <td className="p-0.5 text-center">-</td>
                    </tr>
                    <tr>
                      <td className="p-0.5 pl-6">Silinder</td>
                      <td className="p-0.5 text-center font-medium">Negatif</td>
                      <td className="p-0.5 text-center">Negatif</td>
                      <td className="p-0.5 text-center">/LPK</td>
                      <td className="p-0.5 text-center">-</td>
                    </tr>
                    <tr>
                      <td className="p-0.5 pl-6">Bakteri</td>
                      <td className="p-0.5 text-center font-medium">Negatif</td>
                      <td className="p-0.5 text-center">Negatif</td>
                      <td className="p-0.5 text-center">/LPB</td>
                      <td className="p-0.5 text-center">-</td>
                    </tr>
                    <tr>
                      <td className="p-0.5 pl-6">Kristal</td>
                      <td className="p-0.5 text-center font-medium">Negatif</td>
                      <td className="p-0.5 text-center">Negatif</td>
                      <td className="p-0.5 text-center">/LPK</td>
                      <td className="p-0.5 text-center">-</td>
                    </tr>
                    <tr>
                      <td className="p-0.5 pl-6">Jamur</td>
                      <td className="p-0.5 text-center font-medium">Negatif</td>
                      <td className="p-0.5 text-center">Negatif</td>
                      <td className="p-0.5 text-center">/LPK</td>
                      <td className="p-0.5 text-center">-</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <OzaFooter sheetId="page4" />
            </div>
          )}

          {/* ============================================================== */}
          {/* PAGE 5: HASIL RADIOLOGI & KARDIOLOGI: THORAX FOTO              */}
          {/* ============================================================== */}
          {examInclusion.hasRontgen && (activeTab === 'all' || activeTab === 'page5') && (
            <div className="oza-page-sheet bg-white border border-slate-300 rounded-xl p-8 shadow-sm print:rounded-none max-w-[210mm] mx-auto min-h-[280mm] flex flex-col justify-between">
              <div>
                <OzaHeader />

                {/* Banner */}
                <div className="border-t-2 border-b-2 border-slate-800 bg-slate-200 py-1 text-center font-black text-[12px] text-slate-900 tracking-wider my-2.5">
                  HASIL PEMERIKSAAN RADIOLOGI DAN KARDIOLOGI
                </div>

                <div className="bg-slate-300 py-0.5 px-3 text-[11px] text-slate-900 font-bold flex justify-between items-center my-1.5 border border-slate-400">
                  <div className="flex-1 text-center font-extrabold tracking-wider">THORAX FOTO</div>
                  <div className="font-mono text-[10.5px]">No. RO : {patient.mcuNo.split('-')[1] || '0903'}</div>
                </div>

                {/* Hasil & Temuan Rontgen */}
                <div className="mt-5 text-[11px] text-slate-900 leading-relaxed pl-2">
                  <div className="font-bold italic mb-2">Hasil :</div>
                  <div className="space-y-1.5 pl-4">
                    <div className="flex">
                      <span className="w-16 font-semibold">Cor</span>
                      <span>: CTR &lt; 50%</span>
                    </div>
                    <div className="flex items-start">
                      <span className="w-16 font-semibold">Pulmo</span>
                      <div className="space-y-0.5">
                        <div>:-Tak tampak kelainan pada kedua lapang paru</div>
                        <div>-Kedua hillus normal</div>
                        <div>-Corakan bronchovaskuler normal</div>
                      </div>
                    </div>
                    <div>Kedua sinus &amp; diafragma normal</div>
                    <div className="pt-1 font-semibold text-slate-900">
                      {rontgenData?.data?.kesimpulanKhusus || 'Scoliosis Thoracal Grade 2-3'}
                    </div>
                  </div>

                  <div className="font-bold italic mt-8 mb-2">Kesimpulan :</div>
                  <div className="pl-4 font-semibold">
                    {rontgenData?.kesan || 'Scoliosis Thoracal Grade 2-3'}
                  </div>
                </div>

                {/* Signature Bottom Right */}
                <div className="flex justify-end mt-20 pr-8">
                  <DoctorStampSignature
                    doctorName={docRad}
                    roleTitle="Radiolog"
                  />
                </div>
              </div>

              <OzaFooter sheetId="page5" />
            </div>
          )}

          {/* ============================================================== */}
          {/* PAGE 6: HASIL RADIOLOGI & KARDIOLOGI: ELEKTROKARDIOGRAPHI (EKG)*/}
          {/* ============================================================== */}
          {examInclusion.hasEkg && (activeTab === 'all' || activeTab === 'page6') && (
            <div className="oza-page-sheet bg-white border border-slate-300 rounded-xl p-8 shadow-sm print:rounded-none max-w-[210mm] mx-auto min-h-[280mm] flex flex-col justify-between">
              <div>
                <OzaHeader />

                {/* Banner */}
                <div className="border-t-2 border-b-2 border-slate-800 bg-slate-200 py-1 text-center font-black text-[12px] text-slate-900 tracking-wider my-2.5">
                  HASIL PEMERIKSAAN RADIOLOGI DAN KARDIOLOGI
                </div>

                <div className="bg-slate-300 py-0.5 px-3 text-[11px] text-slate-900 font-extrabold text-center tracking-wider my-1.5 border border-slate-400">
                  ELEKTROKARDIOGRAPHI
                </div>

                {/* Hasil & Temuan EKG */}
                <div className="mt-5 text-[11px] text-slate-900 leading-relaxed pl-2">
                  <div className="font-bold italic mb-2">Hasil :</div>
                  <div className="space-y-1 pl-4">
                    <div>
                      {ekgData?.ekg?.irama
                        ? `Sinus Rythm axis (${ekgData.ekg.axis || 'N'}), P wave (N), PR int ${ekgData.ekg.pr || '0.15'} s.`
                        : 'Sinus Rythm axis (N), P wave (N), PR int 0.15 inch.'}
                    </div>
                    <div>
                      {ekgData?.ekg?.stSegment
                        ? `ST - T segment (${ekgData.ekg.stSegment}), aritmia (${ekgData.ekg.aritmia ? 'Positif' : 'N'})`
                        : 'ST - T segment (N), aritmia (N)'}
                    </div>
                  </div>

                  <div className="font-bold italic mt-8 mb-2">Kesimpulan :</div>
                  <div className="pl-4 font-semibold">
                    {ekgData?.diagnosis || 'Normal EKG.'}
                  </div>
                </div>

                {/* Signature Bottom Right */}
                <div className="flex justify-end mt-24 pr-8">
                  <DoctorStampSignature
                    doctorName={docCardio}
                    roleTitle="Cardiolog"
                  />
                </div>
              </div>

              <OzaFooter sheetId="page6" />
            </div>
          )}

          {/* ============================================================== */}
          {/* EXTRA PAGE: AUDIOMETRI NADA MURNI (IF IN PACKAGE)             */}
          {/* ============================================================== */}
          {examInclusion.hasAudio && (activeTab === 'all' || activeTab === 'audiometri') && (
            <div className="oza-page-sheet bg-white border border-slate-300 rounded-xl p-8 shadow-sm print:rounded-none max-w-[210mm] mx-auto min-h-[280mm] flex flex-col justify-between">
              <div>
                <OzaHeader />

                {/* Visual Audiogram Chart Layout persis sesuai format standar K3 klinis */}
                <div className="mt-2">
                  <AudiogramVisualChart
                    data={audiometriData?.data || audiometriData}
                    diagKanan={audiometriData?.diagKanan}
                    diagKiri={audiometriData?.diagKiri}
                    kesimpulan={audiometriData?.kesimpulan}
                    patientInfo={{
                      nama: patient.nama,
                      mcuNo: patient.mcuNo,
                      pt: patient.pt,
                      tglMcu: formatDate(patient.tglMcu),
                    }}
                    showHeaderBanner={true}
                    interactive={false}
                  />
                </div>

                <div className="flex justify-end mt-6 pr-4">
                  <DoctorStampSignature
                    doctorName={examinerConfig?.dokterSpesialisTht || 'dr. Bambang Hermanto, Sp.THT-BKL'}
                    roleTitle="Dokter Spesialis THT"
                  />
                </div>
              </div>

              <OzaFooter sheetId="audiometri" />
            </div>
          )}

          {/* ============================================================== */}
          {/* EXTRA PAGE: SPIROMETRI (FAAL PARU) (IF IN PACKAGE)            */}
          {/* ============================================================== */}
          {examInclusion.hasSpiro && (activeTab === 'all' || activeTab === 'spirometri') && (
            <div className="oza-page-sheet bg-white border border-slate-300 rounded-xl p-8 shadow-sm print:rounded-none max-w-[210mm] mx-auto min-h-[280mm] flex flex-col justify-between">
              <div>
                <OzaHeader />

                <div className="border-t-2 border-b-2 border-slate-800 bg-slate-200 py-1 text-center font-black text-[12px] text-slate-900 tracking-wider my-2.5">
                  HASIL PEMERIKSAAN SPIROMETRI (FAAL PARU)
                </div>

                <div className="mt-5 text-[11px] text-slate-900 leading-relaxed pl-2">
                  <div className="font-bold italic mb-2">Hasil Parameter Ventilasi:</div>
                  <div className="grid grid-cols-3 gap-3 pl-4 max-w-lg mb-4 text-[10.5px]">
                    <div className="border border-slate-300 p-2 bg-slate-50 text-center">
                      <span className="font-bold block">FVC (% Pred)</span>
                      <span className="text-[13px] font-black font-mono">{spirometriData?.data?.fvc || 88}%</span>
                    </div>
                    <div className="border border-slate-300 p-2 bg-slate-50 text-center">
                      <span className="font-bold block">FEV1 (% Pred)</span>
                      <span className="text-[13px] font-black font-mono">{spirometriData?.data?.fev1 || 85}%</span>
                    </div>
                    <div className="border border-slate-300 p-2 bg-slate-50 text-center">
                      <span className="font-bold block">FEV1 / FVC</span>
                      <span className="text-[13px] font-black font-mono">{spirometriData?.data?.rasio || 82}%</span>
                    </div>
                  </div>

                  <div className="font-bold italic mt-4 mb-2">Kesimpulan :</div>
                  <div className="pl-4 font-semibold">
                    {spirometriData?.diagnosis || 'Faal Paru Normal. Tidak Tampak Gangguan Restriksi Ataupun Obstruksi.'}
                  </div>
                </div>

                <div className="flex justify-end mt-20 pr-8">
                  <DoctorStampSignature
                    doctorName={examinerConfig?.dokterSpesialisParu || 'dr. Rina Setyowati, Sp.P, FAPSR'}
                    roleTitle="Dokter Spesialis Paru"
                  />
                </div>
              </div>

              <OzaFooter sheetId="spirometri" />
            </div>
          )}

          {/* ============================================================== */}
          {/* EXTRA PAGE: USG ABDOMEN (IF IN PACKAGE)                        */}
          {/* ============================================================== */}
          {examInclusion.hasUsg && (activeTab === 'all' || activeTab === 'usg') && (
            <div className="oza-page-sheet bg-white border border-slate-300 rounded-xl p-8 shadow-sm print:rounded-none max-w-[210mm] mx-auto min-h-[280mm] flex flex-col justify-between">
              <div>
                <OzaHeader />

                <div className="border-t-2 border-b-2 border-slate-800 bg-slate-200 py-1 text-center font-black text-[12px] text-slate-900 tracking-wider my-2.5">
                  HASIL PEMERIKSAAN ULTRASONOGRAFI (USG ABDOMEN)
                </div>

                <div className="mt-5 text-[11px] text-slate-900 leading-relaxed pl-2">
                  <div className="font-bold italic mb-2">Evaluasi Organ Intraabdomen:</div>
                  <div className="space-y-1.5 pl-4 text-[10.5px]">
                    <div>• Hepar : {usgData?.data?.heparDesc || 'Ukuran normal, intensitas eko parenkim homogen, tak tampak massa.'}</div>
                    <div>• Kandung Empedu : {usgData?.data?.vesikaFelleaDesc || 'Dinding tak menebal, tak tampak batu (kolelitiasis).'}</div>
                    <div>• Pankreas &amp; Lien : {usgData?.data?.pankreasLienDesc || 'Ukuran normal, ekotekstur parenkim homogen.'}</div>
                    <div>• Ginjal Dextra &amp; Sinistra : {usgData?.data?.renDesc || 'Diferensiasi kortekomeduler baik, tak tampak batu/hidronefrosis.'}</div>
                    <div>• Kandung Kemih : {usgData?.data?.vesicaUrinariaDesc || 'Dinding licin, tidak tampak batu atau massa intraluminal.'}</div>
                  </div>

                  <div className="font-bold italic mt-6 mb-2">Kesimpulan :</div>
                  <div className="pl-4 font-semibold">
                    {usgData?.kesan || 'Organ Intraabdomen Dalam Batas Normal.'}
                  </div>
                </div>

                <div className="flex justify-end mt-20 pr-8">
                  <DoctorStampSignature
                    doctorName={docRad}
                    roleTitle="Radiolog"
                  />
                </div>
              </div>

              <OzaFooter sheetId="usg" />
            </div>
          )}

          {/* ============================================================== */}
          {/* EXTRA PAGE: TREADMILL TEST (IF IN PACKAGE)                     */}
          {/* ============================================================== */}
          {examInclusion.hasTreadmill && (activeTab === 'all' || activeTab === 'treadmill') && (
            <div className="oza-page-sheet bg-white border border-slate-300 rounded-xl p-8 shadow-sm print:rounded-none max-w-[210mm] mx-auto min-h-[280mm] flex flex-col justify-between">
              <div>
                <OzaHeader />

                <div className="border-t-2 border-b-2 border-slate-800 bg-slate-200 py-1 text-center font-black text-[12px] text-slate-900 tracking-wider my-2.5">
                  HASIL PEMERIKSAAN UJI LATIH BEBAN JANTUNG (TREADMILL TEST)
                </div>

                <div className="mt-5 text-[11px] text-slate-900 leading-relaxed pl-2">
                  <div className="font-bold italic mb-2">Protokol &amp; Parameter Uji Latih Jantung (Bruce Protocol):</div>
                  <div className="grid grid-cols-3 gap-3 pl-4 max-w-xl mb-4 text-[10.5px]">
                    <div className="border border-slate-300 p-2 bg-slate-50 text-center">
                      <span className="font-bold block">Durasi Uji Latih</span>
                      <span className="text-[13px] font-black font-mono">{treadmillData?.durasiMenit || '09:45'} Menit</span>
                    </div>
                    <div className="border border-slate-300 p-2 bg-slate-50 text-center">
                      <span className="font-bold block">Max Target HR</span>
                      <span className="text-[13px] font-black font-mono">{treadmillData?.maxHrAchieved || 158} bpm ({treadmillData?.maxHrPercent || 91}%)</span>
                    </div>
                    <div className="border border-slate-300 p-2 bg-slate-50 text-center">
                      <span className="font-bold block">Beban Kerja (METs)</span>
                      <span className="text-[13px] font-black font-mono">{treadmillData?.workloadMets || '10.2'} METs</span>
                    </div>
                  </div>

                  <div className="font-bold italic mt-4 mb-2">Kesimpulan :</div>
                  <div className="pl-4 font-semibold">
                    {treadmillData?.kategoriHasil || 'Tes Beban Jantung Negatif Untuk Iskemia Miokard. Kapasitas Fungsional Aerobik Baik.'}
                  </div>
                </div>

                <div className="flex justify-end mt-20 pr-8">
                  <DoctorStampSignature
                    doctorName={docCardio}
                    roleTitle="Cardiolog"
                  />
                </div>
              </div>

              <OzaFooter sheetId="treadmill" />
            </div>
          )}
        </div>

        {/* MODAL FOOTER */}
        <div className="print:hidden bg-slate-100 border-t border-slate-300 p-3.5 px-6 flex items-center justify-between shrink-0">
          <div className="text-[12px] text-slate-600 flex items-center gap-3">
            <span>
              Peserta: <b>{patient.nama}</b> ({patient.mcuNo})
            </span>
            <span>•</span>
            <span>
              Paket: <b>{activePackage?.nama || patient.paket || 'Standar'}</b> ({activeSheets.length} Hal)
            </span>
            <span>•</span>
            <span className={patientPhoto ? 'text-emerald-700 font-bold' : 'text-slate-500'}>
              {patientPhoto ? '✓ Pasfoto Terpasang' : 'Tanpa Foto'}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-white border border-slate-300 text-slate-700 text-[13px] font-bold hover:bg-slate-50 transition-colors cursor-pointer"
            >
              Tutup
            </button>
            <button
              onClick={() => executePrint('print')}
              disabled={isPrinting}
              className="px-5 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 text-[13px] font-black flex items-center gap-2 shadow-md transition-all cursor-pointer disabled:opacity-50"
            >
              {isPrinting ? (
                <Loader2 className="w-4 h-4 animate-spin text-slate-950" />
              ) : (
                <Printer className="w-4 h-4" />
              )}
              Cetak Buku MCU ({clinic?.nama || 'Resmi'})
            </button>
          </div>
        </div>

        {/* PROGRESS MODAL OVERLAY */}
        {isPrinting && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl border border-slate-200 text-center space-y-4 animate-in fade-in zoom-in-95 duration-150">
              <div className="w-14 h-14 mx-auto rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white shadow-lg shadow-cyan-500/30">
                <Loader2 className="w-7 h-7 animate-spin" />
              </div>
              <div>
                <h4 className="font-extrabold text-slate-900 text-[15px]">Memproses Buku MCU</h4>
                <p className="text-xs text-slate-600 mt-1">{processStatus || 'Sedang menyiapkan halaman...'}</p>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden border border-slate-200">
                <div
                  className="bg-gradient-to-r from-cyan-500 to-blue-600 h-full rounded-full transition-all duration-300"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
              <div className="flex items-center justify-between text-[11px] text-slate-400 font-medium">
                <span>{progressPercent}% Selesai</span>
                <span>Format A4 Siap Cetak</span>
              </div>
              <p className="text-[11px] text-slate-500 leading-tight">
                Mohon tunggu beberapa detik hingga seluruh lembar A4 selesai dikonversi. Berkas PDF otomatis diunduh saat selesai.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
