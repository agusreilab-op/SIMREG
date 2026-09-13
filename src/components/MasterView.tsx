import React, { useState, useEffect, useRef } from 'react';
import {
  Building,
  UserCheck,
  Package,
  FlaskConical,
  FileText,
  Hospital,
  ChevronLeft,
  Plus,
  ArrowRight,
  Edit,
  Trash2,
  CheckCircle2,
  Activity,
  HeartPulse,
  Ear,
  Wind,
  Eye,
  Microscope,
  Printer,
  Sliders,
  Check,
  Settings2,
  RotateCcw,
  Tag,
  Stethoscope,
  ShieldCheck,
  Lock,
  ExternalLink,
  X,
  MessageSquareHeart,
  Upload,
  Image as ImageIcon,
  Camera,
  Search,
  Sparkles,
  Columns,
  Layers,
  Grid,
  List,
  Zap,
} from 'lucide-react';
import {
  Company,
  Doctor,
  ClinicInfo,
  MCUPackage,
  PackageLabelItem,
  ThermalLabelConfig,
  AttendanceRecord,
  CompanyExaminerConfig,
  UserAccount,
  UserSession,
  PhysicalExamParam,
  LabExamParam,
  MedicalAdviceMaster,
  MCUTemplateMaster,
} from '../types';
import {
  initialPackages,
  defaultThermalConfig,
  thermalPresets,
  initialExaminerConfigs,
  initialUserAccounts,
} from '../data/initialData';
import {
  executeThermalPrint,
  openThermalPrintTab,
  renderSingleLabelHtml,
  LabelItemData,
} from '../utils/thermalPrinter';
import {
  savePackageToCloud,
  deletePackageFromCloud,
  deleteCompanyFromCloud,
  deleteDoctorFromCloud,
} from '../lib/firebase';
import { ConfirmDeleteModal } from './ConfirmDeleteModal';
import { ExaminerConfigView } from './ExaminerConfigView';
import { PengaturanLoginAksesView } from './PengaturanLoginAksesView';
import { SettingPemeriksaanView } from './SettingPemeriksaanView';
import { MasterSaranMedisTable } from './MasterSaranMedisTable';

interface MasterViewProps {
  companies: Company[];
  doctors: Doctor[];
  clinic: ClinicInfo;
  exams: string[];
  packages?: MCUPackage[];
  labelConfig?: ThermalLabelConfig;
  examinerConfigs?: CompanyExaminerConfig[];
  session?: UserSession | null;
  userAccounts?: UserAccount[];
  physicalParams?: PhysicalExamParam[];
  labParams?: LabExamParam[];
  medicalAdvices?: MedicalAdviceMaster[];
  mcuTemplates?: MCUTemplateMaster[];
  selectedPackageCode?: string;
  onSelectPackageCode?: (code: string) => void;
  onUpdatePackages?: (packages: MCUPackage[]) => void;
  onUpdateLabelConfig?: (config: ThermalLabelConfig) => void;
  onUpdateCompanies: (companies: Company[]) => void;
  onUpdateDoctors: (doctors: Doctor[]) => void;
  onUpdateClinic: (clinic: ClinicInfo) => void;
  onUpdateExaminerConfigs?: (configs: CompanyExaminerConfig[]) => void;
  onUpdateUserAccounts?: (accounts: UserAccount[]) => void;
  onUpdatePhysicalParams?: (params: PhysicalExamParam[]) => void;
  onUpdateLabParams?: (params: LabExamParam[]) => void;
  onUpdateMedicalAdvices?: (advices: MedicalAdviceMaster[]) => void;
  onUpdateMCUTemplates?: (templates: MCUTemplateMaster[]) => void;
  onAddExamType: (examName: string) => void;
  onNotify: (msg: string) => void;
  subAction?: MasterSubAction;
  onSelectSubAction?: (sub: MasterSubAction) => void;
}

export type MasterSubAction =
  | 'menu'
  | 'company'
  | 'doctor'
  | 'examiner'
  | 'package'
  | 'exam'
  | 'saran-medis'
  | 'clinic'
  | 'login-access';

// Helper to map any exam item name to its corresponding thermal sticker label configuration
export const mapExamToDefaultLabel = (
  examName: string
): { kode: string; nama: string; keterangan: string; defaultQty: number } => {
  const norm = (examName || '').trim().toLowerCase();

  // 1. EDTA / Hematologi / Darah Rutin / Darah Lengkap / CBC / DL
  if (
    norm.includes('edta') ||
    norm.includes('hema') ||
    norm.includes('darah rutin') ||
    norm.includes('darah lengkap') ||
    norm.includes('cbc') ||
    norm === 'dl'
  ) {
    return {
      kode: 'EDTA',
      nama: 'Tabung EDTA (Hematologi)',
      keterangan: 'Tabung Ungu EDTA Hematologi Rutin',
      defaultQty: 1,
    };
  }

  // 2. Kimia Darah / Serum / Profil Lipid / Kolesterol / Glukosa / SGOT / SGPT / Ureum / Kreatinin
  if (
    norm.includes('kimia') ||
    norm.includes('serum') ||
    norm.includes('lipid') ||
    norm.includes('kolesterol') ||
    norm.includes('glukosa') ||
    norm.includes('gula') ||
    norm.includes('asam urat') ||
    norm.includes('sgot') ||
    norm.includes('sgpt') ||
    norm.includes('ureum') ||
    norm.includes('kreatinin') ||
    norm.includes('clot')
  ) {
    return {
      kode: 'KIMIA',
      nama: 'Tabung Kimia Darah (Serum)',
      keterangan: 'Tabung Merah/Kuning Kimia Darah & Serum',
      defaultQty: 1,
    };
  }

  // 3. Urine / Urin Rutin / Urine Lengkap
  if (norm.includes('urin')) {
    return {
      kode: 'URIN',
      nama: 'Pot Urine Rutin',
      keterangan: 'Wadah Pot Sampel Urine',
      defaultQty: 1,
    };
  }

  // 4. Registrasi / Berkas MCU
  if (norm.includes('registrasi') || norm.includes('reg') || norm.includes('berkas')) {
    return {
      kode: 'REG',
      nama: 'Registrasi (Berkas MCU)',
      keterangan: 'Label Formulir Pendaftaran & Berkas Medis',
      defaultQty: 2,
    };
  }

  // 5. Rontgen Thorax / Foto Dada / RO / X-Ray
  if (
    norm.includes('rontgen') ||
    norm.includes('thorax') ||
    norm.includes('x-ray') ||
    norm.includes('xray') ||
    norm === 'ro'
  ) {
    return {
      kode: 'RO',
      nama: 'Rontgen Thorax (RO)',
      keterangan: 'Amplop / Film Foto Rontgen Thorax',
      defaultQty: 1,
    };
  }

  // 6. EKG / Elektrokardiografi / Jantung
  if (norm.includes('ekg') || norm.includes('jantung') || norm.includes('ecg')) {
    return {
      kode: 'EKG',
      nama: 'Rekaman EKG Jantung',
      keterangan: 'Printout Elektrokardiogram 12-Lead',
      defaultQty: 1,
    };
  }

  // 7. Tes Narkoba / Napza / Drug Screen
  if (norm.includes('narkoba') || norm.includes('drug') || norm.includes('napza')) {
    return {
      kode: 'NARKOBA',
      nama: 'Pot Urine Narkoba',
      keterangan: 'Wadah Pot Screening Tes Narkoba',
      defaultQty: 1,
    };
  }

  // 8. Audiometri / Pendengaran
  if (norm.includes('audio') || norm.includes('pendengaran') || norm.includes('pta')) {
    return {
      kode: 'AUDIO',
      nama: 'Lembar Audiometri',
      keterangan: 'Lembar Hasil Tes Pendengaran (PTA)',
      defaultQty: 1,
    };
  }

  // 9. Spirometri / Paru / Faal Paru
  if (norm.includes('spiro') || norm.includes('paru')) {
    return {
      kode: 'SPIRO',
      nama: 'Grafik Spirometri',
      keterangan: 'Grafik Uji Fungsi Ventilasi Paru',
      defaultQty: 1,
    };
  }

  // 10. Treadmill Test / Uji Latih Jantung
  if (norm.includes('treadmill') || norm.includes('tmt')) {
    return {
      kode: 'TMD',
      nama: 'Printout Treadmill Test',
      keterangan: 'Hasil Uji Latih Jantung Beban',
      defaultQty: 1,
    };
  }

  // 11. USG Abdomen / Ultrasonografi
  if (norm.includes('usg') || norm.includes('ultra')) {
    return {
      kode: 'USG',
      nama: 'Printout USG Abdomen',
      keterangan: 'Hasil Printout Foto USG Abdomen',
      defaultQty: 1,
    };
  }

  // 12. Feses / Tinja / Stool
  if (norm.includes('feses') || norm.includes('tinja') || norm.includes('stool')) {
    return {
      kode: 'FESES',
      nama: 'Pot Feses Rutin',
      keterangan: 'Wadah Pot Sampel Feses',
      defaultQty: 1,
    };
  }

  // 13. Sputum / Dahak / BTA
  if (norm.includes('sputum') || norm.includes('bta') || norm.includes('dahak')) {
    return {
      kode: 'SPUTUM',
      nama: 'Pot Sputum BTA',
      keterangan: 'Wadah Pot Dahak BTA',
      defaultQty: 1,
    };
  }

  // 14. Pap Smear / Sitologi
  if (norm.includes('pap') || norm.includes('smear') || norm.includes('sitologi')) {
    return {
      kode: 'PAP',
      nama: 'Slide Pap Smear',
      keterangan: 'Slide Kaca Fiksasi Pap Smear',
      defaultQty: 1,
    };
  }

  // 15. Lab Umum / Laboratorium Terpadu
  if (norm.includes('lab')) {
    return {
      kode: 'LAB',
      nama: 'Laboratorium Terpadu',
      keterangan: 'Spesimen Lab Terpadu (Hema, Kimia, Urin)',
      defaultQty: 1,
    };
  }

  // 16. Pemeriksaan Fisik
  if (norm.includes('fisik') || norm.includes('dokter')) {
    return {
      kode: 'FISIK',
      nama: 'Status Pemeriksaan Fisik',
      keterangan: 'Lembar Status Fisik Dokter & TTV',
      defaultQty: 1,
    };
  }

  // Custom fallback: derive an uppercase abbreviation from words
  const words = (examName || '').trim().split(/\s+/).filter(Boolean);
  let derivedCode = '';
  if (words.length === 1) {
    derivedCode = examName.replace(/[^a-zA-Z0-9]/g, '').slice(0, 6).toUpperCase();
  } else {
    derivedCode = words.map((w) => w[0]).join('').slice(0, 5).toUpperCase();
  }
  if (!derivedCode) derivedCode = 'LBL';

  return {
    kode: derivedCode,
    nama: examName.trim(),
    keterangan: `Label Stiker ${examName.trim()}`,
    defaultQty: 1,
  };
};

export const PACKAGE_PRESETS = [
  {
    nama: 'Paket Basic MCU (Fisik, EDTA, Urine, RO)',
    kode: 'MCU-BASIC',
    keterangan: 'Pemeriksaan dasar berkala: fisik dokter, EDTA darah rutin, urine rutin & rontgen thorax',
    exams: ['Registrasi', 'Pemeriksaan Fisik', 'EDTA (Hematologi)', 'Urine Rutin', 'Rontgen Thorax'],
    labels: [
      { id: '1', nama: 'Registrasi (Berkas MCU)', kode: 'REG', defaultQty: 2, sourceExam: 'Registrasi' },
      { id: '2', nama: 'Tabung EDTA (Hematologi)', kode: 'EDTA', defaultQty: 1, sourceExam: 'EDTA (Hematologi)' },
      { id: '3', nama: 'Pot Urine Rutin', kode: 'URIN', defaultQty: 1, sourceExam: 'Urine Rutin' },
      { id: '4', nama: 'Rontgen Thorax (RO)', kode: 'RO', defaultQty: 1, sourceExam: 'Rontgen Thorax' },
    ],
  },
  {
    nama: 'Paket Standard Karyawan (Fisik, EDTA, Kimia, Urine, RO, EKG)',
    kode: 'MCU-STD',
    keterangan: 'Pemeriksaan lengkap karyawan: fisik, EDTA darah, kimia darah, urine, RO & EKG jantung',
    exams: ['Registrasi', 'Pemeriksaan Fisik', 'EDTA (Hematologi)', 'Kimia Darah', 'Urine Rutin', 'Rontgen Thorax', 'EKG'],
    labels: [
      { id: '1', nama: 'Registrasi (Berkas MCU)', kode: 'REG', defaultQty: 2, sourceExam: 'Registrasi' },
      { id: '2', nama: 'Tabung EDTA (Hematologi)', kode: 'EDTA', defaultQty: 1, sourceExam: 'EDTA (Hematologi)' },
      { id: '3', nama: 'Tabung Kimia Darah', kode: 'KIMIA', defaultQty: 1, sourceExam: 'Kimia Darah' },
      { id: '4', nama: 'Pot Urine Rutin', kode: 'URIN', defaultQty: 1, sourceExam: 'Urine Rutin' },
      { id: '5', nama: 'Rontgen Thorax (RO)', kode: 'RO', defaultQty: 1, sourceExam: 'Rontgen Thorax' },
      { id: '6', nama: 'Rekaman EKG Jantung', kode: 'EKG', defaultQty: 1, sourceExam: 'EKG' },
    ],
  },
  {
    nama: 'Paket Executive / Sp.Ok (Komprehensif + Audio + Spiro)',
    kode: 'MCU-EXEC',
    keterangan: 'Pemeriksaan menyeluruh manajemen & okupasi dengan fungsi pendengaran dan paru',
    exams: ['Registrasi', 'Pemeriksaan Fisik', 'EDTA (Hematologi)', 'Kimia Darah', 'Urine Rutin', 'Rontgen Thorax', 'EKG', 'Audiometri', 'Spirometri'],
    labels: [
      { id: '1', nama: 'Registrasi (Berkas MCU)', kode: 'REG', defaultQty: 2, sourceExam: 'Registrasi' },
      { id: '2', nama: 'Tabung EDTA (Hematologi)', kode: 'EDTA', defaultQty: 1, sourceExam: 'EDTA (Hematologi)' },
      { id: '3', nama: 'Tabung Kimia Darah', kode: 'KIMIA', defaultQty: 1, sourceExam: 'Kimia Darah' },
      { id: '4', nama: 'Pot Urine Rutin', kode: 'URIN', defaultQty: 1, sourceExam: 'Urine Rutin' },
      { id: '5', nama: 'Rontgen Thorax (RO)', kode: 'RO', defaultQty: 1, sourceExam: 'Rontgen Thorax' },
      { id: '6', nama: 'Rekaman EKG Jantung', kode: 'EKG', defaultQty: 1, sourceExam: 'EKG' },
      { id: '7', nama: 'Lembar Audiometri', kode: 'AUDIO', defaultQty: 1, sourceExam: 'Audiometri' },
      { id: '8', nama: 'Grafik Spirometri', kode: 'SPIRO', defaultQty: 1, sourceExam: 'Spirometri' },
    ],
  },
  {
    nama: 'Paket Khusus Tambang & Plant (Safety + Narkoba)',
    kode: 'MCU-MINING',
    keterangan: 'Standar fit to work industri tambang & konstruksi dengan skrining tes narkoba',
    exams: ['Registrasi', 'Pemeriksaan Fisik', 'EDTA (Hematologi)', 'Tes Narkoba', 'Rontgen Thorax', 'Audiometri', 'Spirometri'],
    labels: [
      { id: '1', nama: 'Registrasi (Berkas MCU)', kode: 'REG', defaultQty: 2, sourceExam: 'Registrasi' },
      { id: '2', nama: 'Tabung EDTA (Hematologi)', kode: 'EDTA', defaultQty: 1, sourceExam: 'EDTA (Hematologi)' },
      { id: '3', nama: 'Pot Urine Narkoba', kode: 'NARKOBA', defaultQty: 1, sourceExam: 'Tes Narkoba' },
      { id: '4', nama: 'Rontgen Thorax (RO)', kode: 'RO', defaultQty: 1, sourceExam: 'Rontgen Thorax' },
      { id: '5', nama: 'Lembar Audiometri', kode: 'AUDIO', defaultQty: 1, sourceExam: 'Audiometri' },
      { id: '6', nama: 'Grafik Spirometri', kode: 'SPIRO', defaultQty: 1, sourceExam: 'Spirometri' },
    ],
  },
];

export const MasterView: React.FC<MasterViewProps> = ({
  companies,
  doctors,
  clinic,
  exams,
  packages = initialPackages,
  labelConfig = defaultThermalConfig,
  examinerConfigs = initialExaminerConfigs,
  session,
  userAccounts = initialUserAccounts,
  physicalParams,
  labParams,
  medicalAdvices,
  mcuTemplates,
  selectedPackageCode = 'ALL',
  onSelectPackageCode,
  onUpdatePackages,
  onUpdateLabelConfig,
  onUpdateCompanies,
  onUpdateDoctors,
  onUpdateClinic,
  onUpdateExaminerConfigs,
  onUpdateUserAccounts,
  onUpdatePhysicalParams,
  onUpdateLabParams,
  onUpdateMedicalAdvices,
  onUpdateMCUTemplates,
  onAddExamType,
  onNotify,
  subAction: propSubAction,
  onSelectSubAction,
}) => {
  const [internalSubAction, setInternalSubAction] = useState<MasterSubAction>('menu');
  const subAction = propSubAction !== undefined ? propSubAction : internalSubAction;
  const setSubAction = (newAction: MasterSubAction) => {
    setInternalSubAction(newAction);
    if (onSelectSubAction) {
      onSelectSubAction(newAction);
    }
  };

  // Company form states
  const [editingCompId, setEditingCompId] = useState<number | null>(null);
  const [compNama, setCompNama] = useState('');
  const [compKode, setCompKode] = useState('');
  const [compTelp, setCompTelp] = useState('');
  const [compEmail, setCompEmail] = useState('');
  const [compPic, setCompPic] = useState('');
  const [compJabatan, setCompJabatan] = useState('');
  const [compPicTelp, setCompPicTelp] = useState('');
  const [compAlamat, setCompAlamat] = useState('');

  // Doctor form states
  const [editingDocId, setEditingDocId] = useState<number | null>(null);
  const [docNama, setDocNama] = useState('');
  const [docSpesialis, setDocSpesialis] = useState(
    'Spesialis Kedokteran Okupasi (Sp.Ok)'
  );
  const [docTelp, setDocTelp] = useState('');
  const [docSip, setDocSip] = useState('');
  const [docStr, setDocStr] = useState('');
  const [docAlamat, setDocAlamat] = useState('');

  // Helper to load packages from localStorage or fallback
  const getLatestPackages = (): MCUPackage[] => {
    try {
      const saved = localStorage.getItem('simreg_packages');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return packages && packages.length > 0 ? packages : initialPackages;
  };

  const [localPackages, setLocalPackages] = useState<MCUPackage[]>(getLatestPackages);
  const [savedHighlightId, setSavedHighlightId] = useState<number | null>(null);

  const packageTableRef = useRef<HTMLDivElement>(null);
  const packageFormRef = useRef<HTMLDivElement>(null);

  // Synchronize localPackages with prop changes
  useEffect(() => {
    if (packages && packages.length > 0) {
      setLocalPackages(packages);
    }
  }, [packages]);

  // Synchronize with external changes or localStorage events
  useEffect(() => {
    const handlePkgUpdate = () => {
      setLocalPackages(getLatestPackages());
    };
    window.addEventListener('simreg_packages_updated', handlePkgUpdate);
    window.addEventListener('storage', handlePkgUpdate);
    return () => {
      window.removeEventListener('simreg_packages_updated', handlePkgUpdate);
      window.removeEventListener('storage', handlePkgUpdate);
    };
  }, []);

  // Package configuration states
  const [editingPkgId, setEditingPkgId] = useState<number | null>(null);
  const [pkgKode, setPkgKode] = useState('');
  const [pkgNama, setPkgNama] = useState('');
  const [pkgComp, setPkgComp] = useState(companies[0]?.nama || '');
  const [pkgKeterangan, setPkgKeterangan] = useState('');
  const [selectedPkgExams, setSelectedPkgExams] = useState<string[]>([
    'Registrasi',
    'Rontgen Thorax',
  ]);
  const [pkgLabelCount, setPkgLabelCount] = useState<number>(2);
  const [autoSyncLabels, setAutoSyncLabels] = useState<boolean>(true);
  const [pkgLabels, setPkgLabels] = useState<PackageLabelItem[]>([
    { id: '1', nama: 'Registrasi (Berkas MCU)', kode: 'REG', defaultQty: 2, sourceExam: 'Registrasi' },
    {
      id: '2',
      nama: 'Rontgen Thorax (RO)',
      kode: 'RO',
      defaultQty: 1,
      sourceExam: 'Rontgen Thorax',
    },
  ]);

  // View mode and search states for single-screen experience
  const [menuSearch, setMenuSearch] = useState('');
  const [packageViewMode, setPackageViewMode] = useState<'split' | 'form' | 'table'>('split');
  const [pkgSearch, setPkgSearch] = useState('');

  const handleApplyPreset = (preset: typeof PACKAGE_PRESETS[0]) => {
    setPkgKode(preset.kode);
    setPkgNama(preset.nama);
    setPkgKeterangan(preset.keterangan);
    setSelectedPkgExams(preset.exams);
    setPkgLabelCount(preset.labels.length);
    setPkgLabels(preset.labels);
    onNotify(`Preset [${preset.kode}] berhasil dimuat ke formulir!`);
  };

  // Thermal printer configuration state
  const [thermalConfigState, setThermalConfigState] =
    useState<ThermalLabelConfig>(labelConfig || defaultThermalConfig);
  const [packageTab, setPackageTab] = useState<'packages' | 'thermal'>('packages');
  const [showTestThermalModal, setShowTestThermalModal] = useState(false);
  const [testThermalModalItems, setTestThermalModalItems] = useState<LabelItemData[]>([]);
  const [testThermalActiveLabelIndex, setTestThermalActiveLabelIndex] = useState(0);

  const [newExamInput, setNewExamInput] = useState('');
  const [showAddExamModal, setShowAddExamModal] = useState(false);

  // Exam parameter configuration states
  const [examComp, setExamComp] = useState(companies[0]?.nama || '');
  const [examPkg, setExamPkg] = useState('PAI-A');
  const [examType, setExamType] = useState('Pemeriksaan Fisik');

  // Clinic form states
  const [clinicState, setClinicState] = useState<ClinicInfo>(clinic);

  React.useEffect(() => {
    if (clinic) {
      setClinicState(clinic);
    }
  }, [clinic]);

  // Company Actions
  const handleSaveCompany = (e: React.FormEvent) => {
    e.preventDefault();
    if (!compNama || !compTelp) {
      onNotify('Harap isi Nama Perusahaan dan No. Telepon.');
      return;
    }

    if (editingCompId) {
      const updated = companies.map((c) =>
        c.id === editingCompId
          ? {
              ...c,
              nama: compNama,
              kode: compKode || c.kode,
              alamat: compAlamat,
              telp: compTelp,
              email: compEmail,
              pic: compPic,
              picJabatan: compJabatan,
              picTelp: compPicTelp,
            }
          : c
      );
      onUpdateCompanies(updated);
      onNotify(`Data ${compNama} berhasil diperbarui!`);
      setEditingCompId(null);
    } else {
      const newId =
        companies.length > 0 ? Math.max(...companies.map((c) => c.id)) + 1 : 1;
      const newComp: Company = {
        id: newId,
        nama: compNama,
        kode: compKode || `PT-00${newId}`,
        alamat: compAlamat,
        telp: compTelp,
        email: compEmail,
        pic: compPic,
        picJabatan: compJabatan,
        picTelp: compPicTelp,
      };
      onUpdateCompanies([...companies, newComp]);
      onNotify(`Perusahaan rekanan ${compNama} berhasil ditambahkan!`);
    }

    // Reset
    setCompNama('');
    setCompKode('');
    setCompTelp('');
    setCompEmail('');
    setCompPic('');
    setCompJabatan('');
    setCompPicTelp('');
    setCompAlamat('');
  };

  const handleEditCompany = (c: Company) => {
    setEditingCompId(c.id);
    setCompNama(c.nama);
    setCompKode(c.kode);
    setCompTelp(c.telp);
    setCompEmail(c.email);
    setCompPic(c.pic);
    setCompJabatan(c.picJabatan || '');
    setCompPicTelp(c.picTelp || '');
    setCompAlamat(c.alamat);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Delete confirmation modal state
  const [deleteModalState, setDeleteModalState] = useState<{
    isOpen: boolean;
    type: 'company' | 'doctor' | 'package';
    id: number;
    name: string;
    code?: string;
  }>({
    isOpen: false,
    type: 'company',
    id: 0,
    name: '',
  });

  const handleDeleteCompany = (id: number) => {
    const c = companies.find((x) => x.id === id);
    if (!c) return;
    setDeleteModalState({
      isOpen: true,
      type: 'company',
      id: c.id,
      name: c.nama,
      code: c.kode,
    });
  };

  // Doctor Actions
  const handleSaveDoctor = (e: React.FormEvent) => {
    e.preventDefault();
    if (!docNama || !docTelp) {
      onNotify('Harap isi Nama Dokter dan No. Telepon.');
      return;
    }

    if (editingDocId) {
      const updated = doctors.map((d) =>
        d.id === editingDocId
          ? {
              ...d,
              nama: docNama,
              spesialis: docSpesialis,
              telp: docTelp,
              sip: docSip,
              str: docStr,
              alamat: docAlamat,
            }
          : d
      );
      onUpdateDoctors(updated);
      onNotify(`Data dokter ${docNama} berhasil diperbarui!`);
      setEditingDocId(null);
    } else {
      const newId =
        doctors.length > 0 ? Math.max(...doctors.map((d) => d.id)) + 1 : 1;
      const newDoc: Doctor = {
        id: newId,
        kode: `DOC-00${newId}`,
        nama: docNama,
        spesialis: docSpesialis,
        telp: docTelp,
        sip: docSip || '-',
        str: docStr || '-',
        alamat: docAlamat || '-',
      };
      onUpdateDoctors([...doctors, newDoc]);
      onNotify(`Dokter pemeriksa ${docNama} berhasil ditambahkan!`);
    }

    setDocNama('');
    setDocTelp('');
    setDocSip('');
    setDocStr('');
    setDocAlamat('');
  };

  const handleEditDoctor = (d: Doctor) => {
    setEditingDocId(d.id);
    setDocNama(d.nama);
    setDocSpesialis(d.spesialis);
    setDocTelp(d.telp);
    setDocSip(d.sip);
    setDocStr(d.str);
    setDocAlamat(d.alamat);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDeleteDoctor = (id: number) => {
    const d = doctors.find((x) => x.id === id);
    if (!d) return;
    setDeleteModalState({
      isOpen: true,
      type: 'doctor',
      id: d.id,
      name: d.nama,
      code: d.kode,
    });
  };

  // Toggle Exam in package with reactive thermal label synchronization
  const togglePkgExam = (exam: string) => {
    const isSelected = selectedPkgExams.includes(exam);
    if (isSelected) {
      // Uncheck exam
      const nextExams = selectedPkgExams.filter((x) => x !== exam);
      setSelectedPkgExams(nextExams);

      if (autoSyncLabels) {
        const def = mapExamToDefaultLabel(exam);
        const nextLabels = pkgLabels.filter(
          (l) => l.sourceExam !== exam && l.kode !== def.kode
        );
        setPkgLabels(nextLabels);
        setPkgLabelCount(nextLabels.length);
        onNotify(`Pemeriksaan "${exam}" dinonaktifkan → Label stiker [${def.kode}] dihapus.`);
      }
    } else {
      // Check exam
      const nextExams = [...selectedPkgExams, exam];
      setSelectedPkgExams(nextExams);

      if (autoSyncLabels) {
        const def = mapExamToDefaultLabel(exam);
        const exists = pkgLabels.some(
          (l) => l.sourceExam === exam || l.kode === def.kode
        );
        if (!exists) {
          const newLabel: PackageLabelItem = {
            id: `lbl-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
            nama: def.nama,
            kode: def.kode,
            keterangan: def.keterangan,
            defaultQty: def.defaultQty,
            sourceExam: exam,
          };
          const nextLabels = [...pkgLabels, newLabel];
          setPkgLabels(nextLabels);
          setPkgLabelCount(nextLabels.length);
          onNotify(
            `Pemeriksaan "${exam}" aktif → Label stiker [${def.kode} - ${def.nama}] otomatis ditambahkan!`
          );
        }
      }
    }
  };

  // Quick add an exam and its associated thermal label
  const handleAddPresetExamAndLabel = (examName: string) => {
    if (!selectedPkgExams.includes(examName)) {
      setSelectedPkgExams((prev) => [...prev, examName]);
    }
    const def = mapExamToDefaultLabel(examName);
    const exists = pkgLabels.some(
      (l) => l.sourceExam === examName || l.kode === def.kode
    );
    if (!exists) {
      const newLabel: PackageLabelItem = {
        id: `lbl-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        nama: def.nama,
        kode: def.kode,
        keterangan: def.keterangan,
        defaultQty: def.defaultQty,
        sourceExam: examName,
      };
      const nextLabels = [...pkgLabels, newLabel];
      setPkgLabels(nextLabels);
      setPkgLabelCount(nextLabels.length);
      onNotify(`Label stiker [${def.kode} - ${def.nama}] berhasil ditambahkan!`);
    } else {
      onNotify(`Label stiker [${def.kode}] sudah ada dalam daftar.`);
    }
  };

  // Auto generate labels based on active exams
  const handleAutoGenerateLabels = () => {
    const generated: PackageLabelItem[] = [];
    const usedCodes = new Set<string>();

    // 1. Process all selected exams into distinct labels
    selectedPkgExams.forEach((exam) => {
      const def = mapExamToDefaultLabel(exam);
      if (!usedCodes.has(def.kode)) {
        usedCodes.add(def.kode);
        generated.push({
          id: `lbl-${Date.now()}-${generated.length + 1}`,
          nama: def.nama,
          kode: def.kode,
          keterangan: def.keterangan,
          defaultQty: def.defaultQty,
          sourceExam: exam,
        });
      }
    });

    // 2. Ensure Registrasi is included if MCU package has standard registration
    const includesReg = selectedPkgExams.some((e) =>
      e.toLowerCase().includes('registrasi') || e.toLowerCase().includes('reg')
    );
    if (!includesReg && !usedCodes.has('REG')) {
      const defReg = mapExamToDefaultLabel('Registrasi');
      generated.unshift({
        id: `lbl-${Date.now()}-reg`,
        nama: defReg.nama,
        kode: defReg.kode,
        keterangan: defReg.keterangan,
        defaultQty: defReg.defaultQty,
        sourceExam: 'Registrasi',
      });
    }

    setPkgLabels(generated);
    setPkgLabelCount(generated.length);
    onNotify(
      `Berhasil menyinkronkan ${generated.length} label stiker thermal (${generated.map((g) => g.kode).join(', ')}) dari pemeriksaan aktif!`
    );
  };

  // Add a blank/manual custom label
  const handleAddManualLabel = () => {
    const nextNum = pkgLabels.length + 1;
    const newLabel: PackageLabelItem = {
      id: `lbl-${Date.now()}-${nextNum}`,
      nama: `Stiker Tambahan #${nextNum}`,
      kode: `LBL-${nextNum}`,
      keterangan: 'Stiker Tambahan Spesimen / Berkas',
      defaultQty: 1,
    };
    const nextLabels = [...pkgLabels, newLabel];
    setPkgLabels(nextLabels);
    setPkgLabelCount(nextLabels.length);
    onNotify(`Stiker manual #${nextNum} berhasil ditambahkan.`);
  };

  // Delete label from thermal configuration list
  const handleDeleteLabel = (index: number) => {
    const target = pkgLabels[index];
    const nextLabels = pkgLabels.filter((_, i) => i !== index);
    setPkgLabels(nextLabels);
    setPkgLabelCount(nextLabels.length);
    onNotify(`Stiker [${target?.kode || target?.nama}] dihapus dari setingan stiker.`);
  };

  // Save Package Handler
  const handleSavePackage = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanKode = pkgKode.trim().toUpperCase();
    const cleanNama = pkgNama.trim();

    if (!cleanKode || !cleanNama) {
      onNotify('Harap lengkapi Kode Paket dan Nama Paket MCU.');
      return;
    }

    const currentPackages = getLatestPackages();
    const finalLabels = pkgLabels.slice(0, Math.max(pkgLabelCount, pkgLabels.length));

    let updated: MCUPackage[] = [];
    let savedId: number;

    // Check if editing specific ID or if code matches existing package
    const existingById = editingPkgId
      ? currentPackages.find((p) => p.id === editingPkgId)
      : null;
    const existingByKode = !existingById
      ? currentPackages.find((p) => p.kode.trim().toUpperCase() === cleanKode)
      : null;
    const targetPkg = existingById || existingByKode;

    if (targetPkg) {
      savedId = targetPkg.id;
      updated = currentPackages.map((p) =>
        p.id === targetPkg.id
          ? {
              ...p,
              kode: cleanKode,
              nama: cleanNama,
              perusahaan: pkgComp || '',
              keterangan: pkgKeterangan.trim(),
              exams: selectedPkgExams,
              pemeriksaan: selectedPkgExams,
              labelCount: pkgLabelCount,
              labels: finalLabels,
            }
          : p
      );
      onNotify(`Paket MCU [${cleanKode}] berhasil diperbarui!`);
    } else {
      const maxId = currentPackages.reduce((max, p) => {
        const numId = Number(p.id);
        return !isNaN(numId) && numId > max ? numId : max;
      }, 0);
      savedId = maxId + 1;
      const newPkg: MCUPackage = {
        id: savedId,
        kode: cleanKode,
        nama: cleanNama,
        perusahaan: pkgComp || '',
        keterangan: pkgKeterangan.trim(),
        exams: selectedPkgExams,
        pemeriksaan: selectedPkgExams,
        labelCount: pkgLabelCount,
        labels: finalLabels,
      };
      updated = [...currentPackages, newPkg];
      onNotify(
        `Paket MCU baru [${cleanKode}] berhasil disimpan dengan ${pkgLabelCount} label!`
      );
    }

    // Save to localStorage
    try {
      localStorage.setItem('simreg_packages', JSON.stringify(updated));
      window.dispatchEvent(new Event('simreg_packages_updated'));
    } catch (err) {
      console.error('Failed to save to localStorage:', err);
    }

    // Update local and parent state
    setLocalPackages(updated);
    if (onUpdatePackages) {
      onUpdatePackages(updated);
    }

    // Save to Firestore Cloud
    const savedPkg = updated.find((p) => p.id === savedId);
    if (savedPkg) {
      savePackageToCloud(savedPkg).catch(console.error);
    }

    // Reset Form
    setEditingPkgId(null);
    setPkgKode('');
    setPkgNama('');
    setPkgKeterangan('');
    setSelectedPkgExams(['Registrasi', 'Rontgen Thorax']);
    setPkgLabelCount(2);
    setPkgLabels([
      { id: '1', nama: 'Registrasi (Berkas MCU)', kode: 'REG', defaultQty: 2, sourceExam: 'Registrasi' },
      { id: '2', nama: 'Rontgen Thorax (RO)', kode: 'RO', defaultQty: 1, sourceExam: 'Rontgen Thorax' },
    ]);

    // Highlight the saved package in table
    setSavedHighlightId(savedId);
    setTimeout(() => {
      setSavedHighlightId(null);
    }, 4500);

    // Scroll to the package table so the user immediately sees it
    packageTableRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  };

  const handleEditPackage = (p: MCUPackage) => {
    setEditingPkgId(p.id);
    setPkgKode(p.kode);
    setPkgNama(p.nama);
    setPkgComp(p.perusahaan || companies[0]?.nama || '');
    setPkgKeterangan(p.keterangan || '');
    const currentExams = p.pemeriksaan || p.exams || ['Registrasi', 'Rontgen Thorax'];
    setSelectedPkgExams(currentExams);

    let loadedLabels: PackageLabelItem[] = [];
    if (p.labels && p.labels.length > 0) {
      loadedLabels = p.labels;
    } else {
      const usedCodes = new Set<string>();
      currentExams.forEach((ex, idx) => {
        const def = mapExamToDefaultLabel(ex);
        if (!usedCodes.has(def.kode)) {
          usedCodes.add(def.kode);
          loadedLabels.push({
            id: String(idx + 1),
            nama: def.nama,
            kode: def.kode,
            keterangan: def.keterangan,
            defaultQty: def.defaultQty,
            sourceExam: ex,
          });
        }
      });
    }

    setPkgLabels(loadedLabels);
    setPkgLabelCount(p.labelCount || loadedLabels.length || 2);
    packageFormRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    onNotify(`Mode edit paket [${p.kode} - ${p.nama}]. Item pemeriksaan & stiker thermal tersinkronisasi.`);
  };

  const handleDeletePackage = (id: number) => {
    const currentPackages = getLatestPackages();
    const target = currentPackages.find((x) => x.id === id);
    if (!target) return;
    setDeleteModalState({
      isOpen: true,
      type: 'package',
      id: target.id,
      name: target.nama,
      code: target.kode,
    });
  };

  const handleExecuteDelete = () => {
    const { type, id, name } = deleteModalState;
    setDeleteModalState((prev) => ({ ...prev, isOpen: false }));

    if (type === 'company') {
      const updated = companies.filter((c) => c.id !== id);
      onUpdateCompanies(updated);
      try {
        localStorage.setItem('simreg_companies', JSON.stringify(updated));
      } catch {}
      deleteCompanyFromCloud(id).catch((err) => {
        console.error('Error deleting company from cloud:', err);
      });
      if (editingCompId === id) {
        setEditingCompId(null);
        setCompNama('');
        setCompKode('');
      }
      onNotify(`Data perusahaan "${name}" berhasil dihapus.`);
    } else if (type === 'doctor') {
      const updated = doctors.filter((d) => d.id !== id);
      onUpdateDoctors(updated);
      try {
        localStorage.setItem('simreg_doctors', JSON.stringify(updated));
      } catch {}
      deleteDoctorFromCloud(id).catch((err) => {
        console.error('Error deleting doctor from cloud:', err);
      });
      if (editingDocId === id) {
        setEditingDocId(null);
        setDocNama('');
      }
      onNotify(`Data dokter "${name}" berhasil dihapus.`);
    } else if (type === 'package') {
      const currentPackages = getLatestPackages();
      const target = currentPackages.find((x) => x.id === id);
      const updated = currentPackages.filter((x) => x.id !== id);
      try {
        localStorage.setItem('simreg_packages', JSON.stringify(updated));
        window.dispatchEvent(new Event('simreg_packages_updated'));
      } catch {}
      setLocalPackages(updated);
      if (onUpdatePackages) {
        onUpdatePackages(updated);
      }
      deletePackageFromCloud(id).catch((err) => {
        console.error('Error deleting package from cloud:', err);
      });
      if (editingPkgId === id) {
        setEditingPkgId(null);
        setPkgKode('');
        setPkgNama('');
        setPkgKeterangan('');
      }
      onNotify(`Paket MCU [${target?.kode || id}] berhasil dihapus.`);
    }
  };

  const handleTestPrintFromMaster = (samplePkg?: MCUPackage) => {
    const sampleRecord: AttendanceRecord = {
      no: 999,
      id: 999,
      mcuNo: '001',
      nik: '3271018900010002',
      nama: 'TEST PARTICIPANT THERMAL',
      pt:
        samplePkg?.perusahaan ||
        pkgComp ||
        companies[0]?.nama ||
        'PT. PANARUB INDUSTRY',
      dept: 'PRODUKSI & QC',
      bagian: 'LINE OPERATOR',
      jabatan: 'OPERATOR',
      tglLahir: '1992-05-15',
      jk: 'Pria',
      paket: samplePkg?.kode || pkgKode || 'PAN-RO',
      kodePaket: samplePkg?.kode || pkgKode || 'RO',
      keteranganPaket: samplePkg?.keterangan || pkgKeterangan || 'Uji Cetak Printer Thermal',
      tglMcu: new Date().toISOString().split('T')[0],
      jam: '08:30:00',
      tglInput: new Date().toISOString().split('T')[0],
      status: 'Hadir',
    };

    const targetLabels = samplePkg
      ? samplePkg.labels
      : pkgLabels.slice(0, pkgLabelCount);

    const effectiveLabels =
      targetLabels && targetLabels.length > 0
        ? targetLabels
        : [
            { id: '1', nama: 'REGISTRASI & BERKAS', kode: 'REG', defaultQty: 2 },
            { id: '2', nama: 'RONTGEN THORAX (RO)', kode: 'RO', defaultQty: 1 },
            { id: '3', nama: 'LAB DARAH EDTA', kode: 'EDTA', defaultQty: 1 },
          ];

    const items: LabelItemData[] = effectiveLabels.map((lbl, idx) => ({
      index: idx + 1,
      total: effectiveLabels.length,
      labelTitle: lbl.nama,
      labelCode: lbl.kode,
      patient: sampleRecord,
      quantity: lbl.defaultQty || 1,
    }));

    setTestThermalModalItems(items);
    setTestThermalActiveLabelIndex(0);
    setShowTestThermalModal(true);

    executeThermalPrint(items, clinic, {
      ...thermalConfigState,
      preset: thermalConfigState.preset || '50x30',
    });
    onNotify('Membuka dialog uji cetak ke printer thermal.');
  };

  const handleSaveThermalConfig = (updated: ThermalLabelConfig) => {
    setThermalConfigState(updated);
    if (onUpdateLabelConfig) {
      onUpdateLabelConfig(updated);
    }
    onNotify('Pengaturan printer thermal berhasil disimpan sebagai default.');
  };

  const masterMenuItems = [
    {
      id: 'company' as MasterSubAction,
      num: 1,
      label: 'Setting Perusahaan Rekanan',
      shortLabel: 'Perusahaan',
      badge: `${companies.length} Klien`,
      color: 'from-blue-500 to-sky-600',
      icon: <Building className="w-6 h-6 text-white" />,
      desc: 'Kelola data PT rekanan MCU, alamat & PIC HSE',
    },
    {
      id: 'doctor' as MasterSubAction,
      num: 2,
      label: 'Master Dokter Pemeriksa',
      shortLabel: 'Master Dokter',
      badge: `${doctors.length} Dokter`,
      color: 'from-emerald-500 to-teal-600',
      icon: <UserCheck className="w-6 h-6 text-white" />,
      desc: 'Daftar dokter, SIP, STR & spesialisasi okupasi',
    },
    {
      id: 'examiner' as MasterSubAction,
      num: 3,
      label: 'Penugasan Tim Dokter PT',
      shortLabel: 'Penugasan Dokter',
      badge: `${examinerConfigs?.length || 0} Penugasan`,
      color: 'from-indigo-500 to-violet-600',
      icon: <Stethoscope className="w-6 h-6 text-white" />,
      desc: 'Atur tim dokter penanggung jawab per PT',
    },
    {
      id: 'package' as MasterSubAction,
      num: 4,
      label: 'Setting Paket MCU & Label',
      shortLabel: 'Paket MCU & Label',
      badge: `${localPackages.length} Paket`,
      color: 'from-purple-600 to-indigo-700',
      icon: <Package className="w-6 h-6 text-white" />,
      desc: 'Tarif paket MCU & stiker barcode printer thermal',
    },
    {
      id: 'exam' as MasterSubAction,
      num: 5,
      label: 'Setting Parameter Pemeriksaan',
      shortLabel: 'Parameter Klinis',
      badge: `${exams.length} Modalitas`,
      color: 'from-teal-500 to-cyan-600',
      icon: <Sliders className="w-6 h-6 text-white" />,
      desc: 'Parameter fisik, nilai normal lab, rontgen & PT',
    },
    {
      id: 'saran-medis' as MasterSubAction,
      num: 6,
      label: 'Koleksi Master Saran Medis',
      shortLabel: 'Master Saran Medis',
      badge: `${medicalAdvices?.length || 0} Saran`,
      color: 'from-emerald-600 to-teal-700',
      icon: <MessageSquareHeart className="w-6 h-6 text-white" />,
      desc: 'Koleksi saran klinis okupasi & impor Excel',
    },
    {
      id: 'clinic' as MasterSubAction,
      num: 7,
      label: 'Identitas & Kop Klinik',
      shortLabel: 'Identitas Klinik',
      badge: 'Kop & Izin',
      color: 'from-rose-500 to-pink-600',
      icon: <Hospital className="w-6 h-6 text-white" />,
      desc: 'Logo resmi, legalitas, izin & stempel klinik',
    },
    ...(session?.role === 'admin'
      ? [
          {
            id: 'login-access' as MasterSubAction,
            num: 8,
            label: 'Pengaturan Login Akses',
            shortLabel: 'Akses Pengguna',
            badge: `${userAccounts?.length || 0} Akun`,
            color: 'from-amber-500 to-orange-600',
            icon: <ShieldCheck className="w-6 h-6 text-white" />,
            desc: 'Akun user, kata sandi & hak akses modul',
            adminOnly: true,
          },
        ]
      : []),
  ];

  return (
    <div className="space-y-6">
      {/* Sub-action Header / Breadcrumbs */}
      {subAction !== 'menu' && (
        <div className="flex items-center justify-between bg-white border border-[#E2E8F0] rounded-xl px-4 py-3 shadow-xs">
          <button
            type="button"
            onClick={() => setSubAction('menu')}
            className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Kembali ke Master Data</span>
          </button>
          <div className="text-xs font-semibold text-slate-600">
            {masterMenuItems.find((m) => m.id === subAction)?.label || 'Master Data'}
          </div>
        </div>
      )}

      {/* Main Choice Cards: Only show when 'menu' */}
      {subAction === 'menu' && (
        <div className="space-y-6">
          <div className="bg-white border border-[#E2E8F0] rounded-2xl p-6 md:p-8 shadow-xs">
            <div className="max-w-3xl">
              <h2 className="text-xl md:text-2xl font-bold text-[#0F172A] tracking-tight">
                Master Data Sistem MCU
              </h2>
              <p className="text-sm text-[#64748B] mt-1">
                Pusat pengelolaan konfigurasi data master, dokter pemeriksa, rekanan perusahaan, paket pemeriksaan, hingga legalitas izin klinik.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {masterMenuItems.map((item) => (
              <div
                key={item.id}
                onClick={() => setSubAction(item.id)}
                className="group cursor-pointer bg-white border border-[#E2E8F0] hover:border-[#0E7490] rounded-2xl p-6 shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div
                      className={`w-12 h-12 rounded-xl bg-gradient-to-br ${item.color} text-white flex items-center justify-center shadow-xs`}
                    >
                      {item.icon}
                    </div>
                    <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-slate-100 text-slate-700">
                      {item.badge}
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-[#0F172A] mb-1 group-hover:text-[#0E7490] transition-colors">
                    {item.label}
                  </h3>
                  <p className="text-sm text-[#64748B] leading-relaxed">
                    {item.desc}
                  </p>
                </div>
                <div className="pt-4 border-t border-slate-100 mt-4 flex items-center justify-between text-xs font-bold text-[#0E7490]">
                  <span>Buka Modul</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SubAction 1: Setting Data Perusahaan */}
      {subAction === 'company' && (
        <div className="bg-white border border-[#E2E8F0] rounded-2xl p-6 md:p-8 shadow-xs space-y-6">
          <div className="border-b border-[#E2E8F0] pb-4 flex items-center justify-between">
            <div>
              <h3 className="text-[18px] font-bold text-[#0F172A] flex items-center gap-2">
                <Building className="w-5 h-5 text-[#0E7490]" />
                Input &amp; Edit Perusahaan Rekanan MCU
              </h3>
              <p className="text-[13px] text-[#64748B]">
                Kelola basis data korporasi rekanan, PIC kesehatan kerja (HSE),
                dan nomor kontak resmi.
              </p>
            </div>
            {editingCompId && (
              <span className="px-3 py-1 bg-amber-100 text-amber-800 text-[12px] font-bold rounded-lg">
                Mode Edit: {compNama}
              </span>
            )}
          </div>

          {/* Form */}
          <form onSubmit={handleSaveCompany} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-[12.5px] font-bold text-[#334155] mb-1">
                  Nama PT / Perusahaan *
                </label>
                <input
                  type="text"
                  value={compNama}
                  onChange={(e) => setCompNama(e.target.value)}
                  placeholder="contoh: PT. Pratama Abadi Industri"
                  className="w-full px-3 py-2 bg-white border border-[#CBD5E1] rounded-lg text-[13px]"
                  required
                />
              </div>

              <div>
                <label className="block text-[12.5px] font-bold text-[#334155] mb-1">
                  Kode Perusahaan
                </label>
                <input
                  type="text"
                  value={compKode}
                  onChange={(e) => setCompKode(e.target.value)}
                  placeholder="contoh: PT-004"
                  className="w-full px-3 py-2 bg-white border border-[#CBD5E1] rounded-lg text-[13px]"
                />
              </div>

              <div>
                <label className="block text-[12.5px] font-bold text-[#334155] mb-1">
                  No. Telepon Kantor *
                </label>
                <input
                  type="text"
                  value={compTelp}
                  onChange={(e) => setCompTelp(e.target.value)}
                  placeholder="021-xxxxxxxx"
                  className="w-full px-3 py-2 bg-white border border-[#CBD5E1] rounded-lg text-[13px]"
                  required
                />
              </div>

              <div>
                <label className="block text-[12.5px] font-bold text-[#334155] mb-1">
                  Email Perusahaan *
                </label>
                <input
                  type="email"
                  value={compEmail}
                  onChange={(e) => setCompEmail(e.target.value)}
                  placeholder="hse@perusahaan.com"
                  className="w-full px-3 py-2 bg-white border border-[#CBD5E1] rounded-lg text-[13px]"
                  required
                />
              </div>

              <div>
                <label className="block text-[12.5px] font-bold text-[#334155] mb-1">
                  Nama PIC (Person in Charge) *
                </label>
                <input
                  type="text"
                  value={compPic}
                  onChange={(e) => setCompPic(e.target.value)}
                  placeholder="Nama Contact Person HR/HSE"
                  className="w-full px-3 py-2 bg-white border border-[#CBD5E1] rounded-lg text-[13px]"
                  required
                />
              </div>

              <div>
                <label className="block text-[12.5px] font-bold text-[#334155] mb-1">
                  Jabatan PIC
                </label>
                <input
                  type="text"
                  value={compJabatan}
                  onChange={(e) => setCompJabatan(e.target.value)}
                  placeholder="HR & HSE Manager"
                  className="w-full px-3 py-2 bg-white border border-[#CBD5E1] rounded-lg text-[13px]"
                />
              </div>

              <div>
                <label className="block text-[12.5px] font-bold text-[#334155] mb-1">
                  No. WhatsApp PIC
                </label>
                <input
                  type="text"
                  value={compPicTelp}
                  onChange={(e) => setCompPicTelp(e.target.value)}
                  placeholder="08xxxxxxxxxx"
                  className="w-full px-3 py-2 bg-white border border-[#CBD5E1] rounded-lg text-[13px]"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-[12.5px] font-bold text-[#334155] mb-1">
                  Alamat Lengkap Perusahaan *
                </label>
                <input
                  type="text"
                  value={compAlamat}
                  onChange={(e) => setCompAlamat(e.target.value)}
                  placeholder="Jl. Raya Industri Km..., Kawasan Industri..."
                  className="w-full px-3 py-2 bg-white border border-[#CBD5E1] rounded-lg text-[13px]"
                  required
                />
              </div>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="submit"
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#0E7490] to-[#0891B2] text-white text-[13px] font-bold shadow-md shadow-cyan-600/20 hover:opacity-95"
              >
                💾 {editingCompId ? 'Perbarui Perusahaan' : 'Simpan Data Perusahaan'}
              </button>
              {editingCompId && (
                <button
                  type="button"
                  onClick={() => {
                    setEditingCompId(null);
                    setCompNama('');
                    setCompKode('');
                    setCompTelp('');
                    setCompEmail('');
                    setCompPic('');
                    setCompJabatan('');
                    setCompPicTelp('');
                    setCompAlamat('');
                  }}
                  className="px-4 py-2.5 rounded-xl bg-slate-100 text-[#475569] text-[13px] font-bold hover:bg-slate-200"
                >
                  Batal Edit
                </button>
              )}
            </div>
          </form>

          {/* Table */}
          <div className="pt-4">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-bold text-[15px] text-[#0F172A]">
                Daftar Perusahaan Rekanan
              </h4>
              <span className="px-3 py-1 rounded-full text-[11px] font-bold bg-[#ECFDF5] text-[#059669] border border-[#A7F3D0]">
                {companies.length} Perusahaan Terdaftar
              </span>
            </div>

            <div className="overflow-x-auto border border-[#E2E8F0] rounded-xl">
              <table className="w-full text-left text-[13px] border-collapse min-w-[760px]">
                <thead>
                  <tr className="bg-[#F8FAFC] border-b border-[#E2E8F0] text-[12px] font-bold text-[#475569]">
                    <th className="py-3 px-4 w-12">No.</th>
                    <th className="py-3 px-4">Nama Perusahaan</th>
                    <th className="py-3 px-4">Alamat</th>
                    <th className="py-3 px-4">Kontak Perusahaan</th>
                    <th className="py-3 px-4">PIC HSE</th>
                    <th className="py-3 px-4">Telp PIC</th>
                    <th className="py-3 px-4 text-center w-36">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E2E8F0]">
                  {companies.map((c, idx) => (
                    <tr key={c.id} className="hover:bg-[#F8FAFC]">
                      <td className="py-3 px-4 text-[#64748B]">{idx + 1}</td>
                      <td className="py-3 px-4">
                        <strong className="text-[#0F172A] block">{c.nama}</strong>
                        <small className="text-[#64748B]">Kode: {c.kode}</small>
                      </td>
                      <td className="py-3 px-4 text-[#475569] max-w-[220px]">
                        <span className="line-clamp-2">{c.alamat}</span>
                      </td>
                      <td className="py-3 px-4 text-[#475569]">
                        <div>{c.telp}</div>
                        <small className="text-[#64748B]">{c.email}</small>
                      </td>
                      <td className="py-3 px-4">
                        <b className="text-[#0F172A] block">{c.pic}</b>
                        <small className="text-[#0E7490]">{c.picJabatan || '-'}</small>
                      </td>
                      <td className="py-3 px-4 text-[#475569]">{c.picTelp || '-'}</td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => handleEditCompany(c)}
                            className="p-1.5 rounded-lg bg-[#E0F2FE] text-[#0369A1] hover:bg-[#BAE6FD]"
                            title="Edit"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteCompany(c.id)}
                            className="p-1.5 rounded-lg bg-[#FEE2E2] text-[#B91C1C] hover:bg-[#FECDD3]"
                            title="Hapus"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* SubAction 2: Master Dokter */}
      {subAction === 'doctor' && (
        <div className="bg-white border border-[#E2E8F0] rounded-2xl p-6 md:p-8 shadow-xs space-y-6">
          <div className="border-b border-[#E2E8F0] pb-4 flex items-center justify-between">
            <div>
              <h3 className="text-[18px] font-bold text-[#0F172A] flex items-center gap-2">
                <UserCheck className="w-5 h-5 text-[#0E7490]" />
                Master Dokter MCU
              </h3>
              <p className="text-[13px] text-[#64748B]">
                Pencatatan legalitas seluruh dokter okupasi (Sp.Ok), radiologi, patologi klinik, THT, paru, dan dokter umum.
              </p>
            </div>
            {editingDocId && (
              <span className="px-3 py-1 bg-amber-100 text-amber-800 text-[12px] font-bold rounded-lg">
                Mode Edit: {docNama}
              </span>
            )}
          </div>

          <form onSubmit={handleSaveDoctor} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-[12.5px] font-bold text-[#334155] mb-1">
                  Nama Lengkap Dokter (beserta Gelar) *
                </label>
                <input
                  type="text"
                  value={docNama}
                  onChange={(e) => setDocNama(e.target.value)}
                  placeholder="dr. Budi Santoso, Sp.Ok"
                  className="w-full px-3 py-2 bg-white border border-[#CBD5E1] rounded-lg text-[13px]"
                  required
                />
              </div>

              <div>
                <label className="block text-[12.5px] font-bold text-[#334155] mb-1">
                  Spesialis / Bidang Keahlian *
                </label>
                <select
                  value={docSpesialis}
                  onChange={(e) => setDocSpesialis(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-[#CBD5E1] rounded-lg text-[13px]"
                >
                  <option value="Spesialis Kedokteran Okupasi (Sp.Ok)">
                    Spesialis Kedokteran Okupasi (Sp.Ok)
                  </option>
                  <option value="Spesialis Radiologi (Sp.Rad)">
                    Spesialis Radiologi (Sp.Rad)
                  </option>
                  <option value="Spesialis Patologi Klinik (Sp.PK)">
                    Spesialis Patologi Klinik (Sp.PK)
                  </option>
                  <option value="Spesialis Telinga Hidung Tenggorok (Sp.THT-BKL)">
                    Spesialis Telinga Hidung Tenggorok (Sp.THT-BKL)
                  </option>
                  <option value="Spesialis Pulmonologi & Kedokteran Respirasi / Paru (Sp.P)">
                    Spesialis Pulmonologi &amp; Kedokteran Respirasi / Paru (Sp.P)
                  </option>
                  <option value="Spesialis Jantung & Pembuluh Darah (Sp.JP)">
                    Spesialis Jantung &amp; Pembuluh Darah (Sp.JP)
                  </option>
                  <option value="Dokter Umum / Pemeriksa MCU">
                    Dokter Umum / Pemeriksa MCU
                  </option>
                  <option value="Dokter Penanggung Jawab Teknis">
                    Dokter Penanggung Jawab Teknis
                  </option>
                </select>
              </div>

              <div>
                <label className="block text-[12.5px] font-bold text-[#334155] mb-1">
                  No. HP / WhatsApp Dokter *
                </label>
                <input
                  type="text"
                  value={docTelp}
                  onChange={(e) => setDocTelp(e.target.value)}
                  placeholder="08xxxxxxxxxx"
                  className="w-full px-3 py-2 bg-white border border-[#CBD5E1] rounded-lg text-[13px]"
                  required
                />
              </div>

              <div>
                <label className="block text-[12.5px] font-bold text-[#334155] mb-1">
                  No. SIP (Surat Izin Praktik)
                </label>
                <input
                  type="text"
                  value={docSip}
                  onChange={(e) => setDocSip(e.target.value)}
                  placeholder="SIP.503/412/Dinkes/2023"
                  className="w-full px-3 py-2 bg-white border border-[#CBD5E1] rounded-lg text-[13px]"
                />
              </div>

              <div>
                <label className="block text-[12.5px] font-bold text-[#334155] mb-1">
                  No. STR Dokter
                </label>
                <input
                  type="text"
                  value={docStr}
                  onChange={(e) => setDocStr(e.target.value)}
                  placeholder="STR-3171-8892-019"
                  className="w-full px-3 py-2 bg-white border border-[#CBD5E1] rounded-lg text-[13px]"
                />
              </div>

              <div>
                <label className="block text-[12.5px] font-bold text-[#334155] mb-1">
                  Alamat Domisili / Praktek
                </label>
                <input
                  type="text"
                  value={docAlamat}
                  onChange={(e) => setDocAlamat(e.target.value)}
                  placeholder="Alamat praktek dokter..."
                  className="w-full px-3 py-2 bg-white border border-[#CBD5E1] rounded-lg text-[13px]"
                />
              </div>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="submit"
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#0E7490] to-[#0891B2] text-white text-[13px] font-bold shadow-md shadow-cyan-600/20 hover:opacity-95"
              >
                💾 {editingDocId ? 'Perbarui Data Dokter' : 'Simpan Data Dokter'}
              </button>
              {editingDocId && (
                <button
                  type="button"
                  onClick={() => {
                    setEditingDocId(null);
                    setDocNama('');
                    setDocTelp('');
                    setDocSip('');
                    setDocStr('');
                    setDocAlamat('');
                  }}
                  className="px-4 py-2.5 rounded-xl bg-slate-100 text-[#475569] text-[13px] font-bold hover:bg-slate-200"
                >
                  Batal
                </button>
              )}
            </div>
          </form>

          {/* Table */}
          <div className="pt-4">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-bold text-[15px] text-[#0F172A]">
                Daftar Tenaga Medis MCU
              </h4>
              <span className="px-3 py-1 rounded-full text-[11px] font-bold bg-[#ECFDF5] text-[#059669] border border-[#A7F3D0]">
                {doctors.length} Dokter Aktif
              </span>
            </div>

            <div className="overflow-x-auto border border-[#E2E8F0] rounded-xl">
              <table className="w-full text-left text-[13px] border-collapse min-w-[760px]">
                <thead>
                  <tr className="bg-[#F8FAFC] border-b border-[#E2E8F0] text-[12px] font-bold text-[#475569]">
                    <th className="py-3 px-4 w-12">No.</th>
                    <th className="py-3 px-4">Nama Dokter</th>
                    <th className="py-3 px-4">Spesialisasi</th>
                    <th className="py-3 px-4">Legalitas (STR/SIP)</th>
                    <th className="py-3 px-4">No. Telepon</th>
                    <th className="py-3 px-4">Alamat</th>
                    <th className="py-3 px-4 text-center w-36">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E2E8F0]">
                  {doctors.map((d, idx) => (
                    <tr key={d.id} className="hover:bg-[#F8FAFC]">
                      <td className="py-3 px-4 text-[#64748B]">{idx + 1}</td>
                      <td className="py-3 px-4">
                        <strong className="text-[#0F172A] block">{d.nama}</strong>
                        <small className="text-[#64748B]">Kode: {d.kode}</small>
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#F1F5F9] text-[#334155] border border-[#CBD5E1]">
                          {d.spesialis}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-[12px] text-[#475569]">
                        <div><b>STR:</b> {d.str}</div>
                        <div><b>SIP:</b> {d.sip}</div>
                      </td>
                      <td className="py-3 px-4 text-[#475569]">{d.telp}</td>
                      <td className="py-3 px-4 text-[#475569] max-w-[200px]">
                        <span className="line-clamp-2">{d.alamat}</span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => handleEditDoctor(d)}
                            className="p-1.5 rounded-lg bg-[#E0F2FE] text-[#0369A1] hover:bg-[#BAE6FD]"
                            title="Edit"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteDoctor(d.id)}
                            className="p-1.5 rounded-lg bg-[#FEE2E2] text-[#B91C1C] hover:bg-[#FECDD3]"
                            title="Hapus"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* SubAction: Setting Dokter Pemeriksa */}
      {subAction === 'examiner' && (
        <ExaminerConfigView
          companies={companies}
          doctors={doctors}
          examinerConfigs={examinerConfigs}
          clinic={clinic}
          onUpdateExaminerConfigs={onUpdateExaminerConfigs || (() => {})}
          onNotify={onNotify}
        />
      )}

      {/* SubAction 3: Setting Paket MCU & Pengaturan Printer Thermal */}
      {subAction === 'package' && (
        <div className="space-y-6">
          {/* Top Bar with Navigation Tabs */}
          <div className="bg-white border border-[#E2E8F0] rounded-2xl p-4 md:p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h3 className="text-[18px] font-bold text-[#0F172A] flex items-center gap-2">
                <Package className="w-5 h-5 text-[#0E7490]" />
                Master Setting Paket MCU &amp; Printer Thermal
              </h3>
              <p className="text-[13px] text-[#64748B] mt-0.5">
                Konfigurasi jumlah stiker label barcode otomatis per paket MCU serta ukuran kertas printer thermal.
              </p>
            </div>

            {/* Action buttons & Segmented Control Tabs */}
            <div className="flex flex-wrap items-center gap-2.5">
              <button
                type="button"
                onClick={() => setSubAction('exam')}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-teal-50 text-teal-800 border border-teal-200 hover:bg-teal-100 transition-all shadow-2xs cursor-pointer"
                title="Buka Setting Pemeriksaan untuk melihat dan menghubungkan parameter dengan paket MCU"
              >
                <FlaskConical className="w-3.5 h-3.5 text-teal-700" />
                Setting Pemeriksaan
              </button>

              {/* Segmented Control Tabs */}
              <div className="flex items-center p-1 bg-slate-100 rounded-xl border border-slate-200 shrink-0">
                <button
                  type="button"
                  onClick={() => setPackageTab('packages')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    packageTab === 'packages'
                      ? 'bg-white text-cyan-800 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Package className="w-3.5 h-3.5 text-cyan-600" />
                  Paket MCU &amp; Alokasi Label
                </button>

                <button
                  type="button"
                  onClick={() => setPackageTab('thermal')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    packageTab === 'thermal'
                      ? 'bg-white text-cyan-800 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Printer className="w-3.5 h-3.5 text-cyan-600" />
                  Setting Ukuran Printer Thermal
                </button>
              </div>
            </div>
          </div>

          {/* TAB 1: PAKET MCU & ALOKASI LABEL TERCETAK */}
          {packageTab === 'packages' && (
            <div className="space-y-6">
              {/* Existing Packages Table */}
              <div ref={packageTableRef} className="bg-white border border-[#E2E8F0] rounded-2xl p-6 shadow-xs space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#E2E8F0] pb-3">
                  <div>
                    <h4 className="font-bold text-[15px] text-[#0F172A] flex items-center gap-2">
                      <Tag className="w-4 h-4 text-cyan-700" />
                      Daftar Paket MCU Terdaftar &amp; Alokasi Label Stiker ({localPackages.length} Paket)
                    </h4>
                    <p className="text-[12px] text-[#64748B]">
                      Jumlah stiker yang akan otomatis dicetak saat peserta registrasi paket terkait.
                    </p>
                  </div>
                  <button
                    type="button"
                    id="btn-create-new-package"
                    onClick={() => {
                      setEditingPkgId(null);
                      setPkgKode('');
                      setPkgNama('');
                      setPkgKeterangan('');
                      setSelectedPkgExams(['Registrasi', 'Rontgen Thorax']);
                      setPkgLabelCount(2);
                      setPkgLabels([
                        { id: '1', nama: 'Registrasi', kode: 'REG', defaultQty: 2 },
                        { id: '2', nama: 'Rontgen (RO)', kode: 'RO', defaultQty: 1 },
                      ]);
                      packageFormRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    }}
                    className="px-3.5 py-1.5 rounded-xl bg-cyan-50 hover:bg-cyan-100 text-cyan-800 border border-cyan-300 text-xs font-bold flex items-center gap-1.5 shadow-2xs self-start sm:self-auto cursor-pointer transition-all"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Buat Paket Baru
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-[12.5px]">
                    <thead className="bg-[#F8FAFC] text-[#475569] font-bold border-b border-[#E2E8F0]">
                      <tr>
                        <th className="py-2.5 px-3 w-10">No</th>
                        <th className="py-2.5 px-3">Kode &amp; Nama Paket</th>
                        <th className="py-2.5 px-3">Perusahaan Klien</th>
                        <th className="py-2.5 px-3">Item Pemeriksaan</th>
                        <th className="py-2.5 px-3 text-center">Jumlah Label Tercetak</th>
                        <th className="py-2.5 px-3">Rincian Stiker Label</th>
                        <th className="py-2.5 px-3 text-center w-36">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E2E8F0]">
                      {localPackages.map((pkg, idx) => {
                        const count = pkg.labelCount || pkg.labels?.length || 3;
                        const isHighlighted = savedHighlightId === pkg.id;
                        return (
                          <tr
                            key={pkg.id}
                            className={`transition-all duration-300 ${
                              isHighlighted
                                ? 'bg-teal-50 border-2 border-teal-400 font-medium ring-2 ring-teal-300'
                                : 'hover:bg-[#F8FAFC]'
                            }`}
                          >
                            <td className="py-3 px-3 text-[#64748B] font-semibold">{idx + 1}</td>
                            <td className="py-3 px-3">
                              <span className="inline-block px-2 py-0.5 rounded-md font-mono text-[11px] font-black bg-slate-900 text-white mr-1.5">
                                {pkg.kode}
                              </span>
                              {isHighlighted && (
                                <span className="inline-block mr-1 px-2 py-0.5 rounded text-[10px] font-black bg-emerald-600 text-white animate-pulse">
                                  ✓ Tersimpan
                                </span>
                              )}
                              <strong className="text-[#0F172A] block text-[13px] mt-0.5">
                                {pkg.nama}
                              </strong>
                              {pkg.keterangan && (
                                <span className="text-[11px] text-slate-500 line-clamp-1">
                                  {pkg.keterangan}
                                </span>
                              )}
                            </td>
                            <td className="py-3 px-3 font-semibold text-slate-700">
                              {pkg.perusahaan || 'Semua Perusahaan'}
                            </td>
                            <td className="py-3 px-3">
                              <div className="flex flex-wrap gap-1 max-w-[240px]">
                                {pkg.pemeriksaan?.slice(0, 3).map((ex) => (
                                  <span
                                    key={ex}
                                    className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 text-[10.5px] font-medium border border-slate-200"
                                  >
                                    {ex.replace('Pemeriksaan ', '')}
                                  </span>
                                ))}
                                {(pkg.pemeriksaan?.length || 0) > 3 && (
                                  <span className="px-1.5 py-0.5 rounded bg-cyan-50 text-cyan-700 text-[10px] font-bold border border-cyan-200">
                                    +{(pkg.pemeriksaan?.length || 0) - 3} lainnya
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="py-3 px-3 text-center">
                              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-[12px] font-black bg-cyan-100 text-cyan-900 border border-cyan-300">
                                🖨️ {count} Stiker
                              </span>
                            </td>
                            <td className="py-3 px-3">
                              <div className="flex flex-wrap gap-1 max-w-[260px]">
                                {pkg.labels?.map((lbl) => (
                                  <span
                                    key={lbl.id}
                                    className="px-1.5 py-0.5 rounded bg-cyan-50 border border-cyan-200/80 text-[10.5px] font-bold text-cyan-800"
                                    title={lbl.keterangan || lbl.nama}
                                  >
                                    🏷️ {lbl.kode || lbl.nama}
                                  </span>
                                ))}
                              </div>
                            </td>
                            <td className="py-3 px-3 text-center">
                              <div className="flex items-center justify-center gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => handleTestPrintFromMaster(pkg)}
                                  className="p-1.5 rounded-lg bg-teal-50 text-teal-700 hover:bg-teal-100 border border-teal-200 cursor-pointer"
                                  title="Uji Cetak Label Paket Ini ke Printer Thermal"
                                >
                                  <Printer className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleEditPackage(pkg)}
                                  className="p-1.5 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 cursor-pointer"
                                  title="Edit Paket"
                                >
                                  <Edit className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeletePackage(pkg.id)}
                                  className="p-1.5 rounded-lg bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 cursor-pointer"
                                  title="Hapus Paket"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Form Tambah / Edit Paket MCU */}
              <div ref={packageFormRef} id="form-package-mcu" className="bg-white border-2 border-cyan-200/80 rounded-2xl p-6 shadow-sm space-y-5">
                <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-cyan-50 border border-cyan-200 flex items-center justify-center text-cyan-700">
                      <Edit className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="font-bold text-[15px] text-[#0F172A]">
                        {editingPkgId
                          ? `Edit Konfigurasi Paket MCU: ${pkgKode || 'Paket Terpilih'}`
                          : 'Tambah Konfigurasi Paket MCU Baru'}
                      </h4>
                      <p className="text-[12px] text-[#64748B]">
                        Lengkapi detail paket, jenis pemeriksaan, dan setelan stiker label thermal.
                      </p>
                    </div>
                  </div>

                  {editingPkgId && (
                    <button
                      type="button"
                      onClick={() => {
                        setEditingPkgId(null);
                        setPkgKode('');
                        setPkgNama('');
                        setPkgKeterangan('');
                        setSelectedPkgExams(['Registrasi', 'Rontgen Thorax']);
                        setPkgLabelCount(2);
                        setPkgLabels([
                          { id: '1', nama: 'Registrasi', kode: 'REG', defaultQty: 2 },
                          { id: '2', nama: 'Rontgen (RO)', kode: 'RO', defaultQty: 1 },
                        ]);
                        onNotify('Edit dibatalkan.');
                      }}
                      className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold cursor-pointer"
                    >
                      Batal Edit
                    </button>
                  )}
                </div>

                <form onSubmit={handleSavePackage} className="space-y-5">
                  {/* Basic Info */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-[12px] font-bold text-[#334155] mb-1">
                        Kode Paket MCU <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={pkgKode}
                        onChange={(e) => setPkgKode(e.target.value)}
                        placeholder="Contoh: PAN-RO, PAI-A, EXEC..."
                        className="w-full px-3 py-2 bg-white border border-[#CBD5E1] rounded-lg text-[13px] font-bold uppercase focus:ring-2 focus:ring-cyan-500/20"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-[12px] font-bold text-[#334155] mb-1">
                        Nama Paket MCU <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={pkgNama}
                        onChange={(e) => setPkgNama(e.target.value)}
                        placeholder="Nama lengkap paket pemeriksaan"
                        className="w-full px-3 py-2 bg-white border border-[#CBD5E1] rounded-lg text-[13px] font-semibold focus:ring-2 focus:ring-cyan-500/20"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-[12px] font-bold text-[#334155] mb-1">
                        Perusahaan / Klien Spesifik
                      </label>
                      <select
                        value={pkgComp}
                        onChange={(e) => setPkgComp(e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-[#CBD5E1] rounded-lg text-[13px] focus:ring-2 focus:ring-cyan-500/20"
                      >
                        <option value="">Semua Perusahaan (Umum)</option>
                        {companies.map((c) => (
                          <option key={c.id} value={c.nama}>
                            {c.nama}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[12px] font-bold text-[#334155] mb-1">
                      Keterangan Ringkas Paket
                    </label>
                    <input
                      type="text"
                      value={pkgKeterangan}
                      onChange={(e) => setPkgKeterangan(e.target.value)}
                      placeholder="Daftar, Rontgen Thorax, Fisik, dsb."
                      className="w-full px-3 py-2 bg-white border border-[#CBD5E1] rounded-lg text-[13px] focus:ring-2 focus:ring-cyan-500/20"
                    />
                  </div>

                  {/* Checklist Pemeriksaan dengan Koneksi ke Stiker Thermal */}
                  <div className="space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <label className="block text-[13px] font-extrabold text-[#1E293B]">
                            Item Pemeriksaan yang Termasuk ({selectedPkgExams.length} Terpilih)
                          </label>
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-teal-50 text-teal-700 border border-teal-200">
                            <Zap className="w-3 h-3 text-teal-600" />
                            Sinkron ke Stiker Thermal
                          </span>
                        </div>
                        <p className="text-[11.5px] text-slate-500">
                          Centang pemeriksaan di bawah — setelan label stiker thermal otomatis menyesuaikan.
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => setShowAddExamModal(true)}
                        className="px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center gap-1 shadow-2xs cursor-pointer border border-slate-200"
                      >
                        <Plus className="w-3.5 h-3.5 text-cyan-600" />
                        Tambah Jenis Baru
                      </button>
                    </div>

                    {/* Quick Select Popular Clinical Exam Badges */}
                    <div className="flex flex-wrap items-center gap-1.5 p-2 rounded-xl bg-slate-50 border border-slate-200/90 text-xs">
                      <span className="text-[11px] font-bold text-slate-500 mr-1 flex items-center gap-1">
                        <span>Pilih Cepat:</span>
                      </span>
                      {[
                        { name: 'EDTA (Hematologi)', code: 'EDTA' },
                        { name: 'Kimia Darah', code: 'KIMIA' },
                        { name: 'Urine Rutin', code: 'URIN' },
                        { name: 'Rontgen Thorax', code: 'RO' },
                        { name: 'EKG', code: 'EKG' },
                        { name: 'Registrasi', code: 'REG' },
                        { name: 'Tes Narkoba', code: 'NARKOBA' },
                        { name: 'Audiometri', code: 'AUDIO' },
                        { name: 'Spirometri', code: 'SPIRO' },
                      ].map((item) => {
                        const isSelected = selectedPkgExams.includes(item.name);
                        return (
                          <button
                            key={item.name}
                            type="button"
                            onClick={() => handleAddPresetExamAndLabel(item.name)}
                            className={`px-2 py-1 rounded-lg text-[11px] font-bold transition-all flex items-center gap-1 cursor-pointer ${
                              isSelected
                                ? 'bg-cyan-700 text-white shadow-2xs'
                                : 'bg-white text-slate-700 hover:bg-cyan-50 hover:text-cyan-800 border border-slate-200'
                            }`}
                          >
                            <span>{isSelected ? '✓' : '+'}</span>
                            <span>{item.name}</span>
                            <span
                              className={`text-[9.5px] px-1 rounded font-mono ${
                                isSelected ? 'bg-cyan-800 text-cyan-100' : 'bg-slate-100 text-slate-600'
                              }`}
                            >
                              [{item.code}]
                            </span>
                          </button>
                        );
                      })}
                    </div>

                    {/* Checkbox Grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                      {Array.from(
                        new Set([
                          'Registrasi',
                          'EDTA (Hematologi)',
                          'Kimia Darah',
                          'Urine Rutin',
                          'Rontgen Thorax',
                          'EKG',
                          'Pemeriksaan Fisik',
                          'Laboratorium',
                          'Tes Narkoba',
                          'Audiometri',
                          'Spirometri',
                          'Treadmill Test',
                          'USG Abdomen',
                          ...exams,
                          ...selectedPkgExams,
                        ])
                      ).map((ex) => {
                        const checked = selectedPkgExams.includes(ex);
                        const labelDef = mapExamToDefaultLabel(ex);
                        return (
                          <label
                            key={ex}
                            className={`flex flex-col justify-between p-2 rounded-xl border transition-all cursor-pointer select-none ${
                              checked
                                ? 'bg-cyan-50/90 border-cyan-400 text-cyan-950 font-bold shadow-2xs ring-1 ring-cyan-300'
                                : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300'
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              <input
                                type="checkbox"
                                checked={checked}
                                onChange={() => togglePkgExam(ex)}
                                className="w-4 h-4 accent-cyan-600 rounded cursor-pointer shrink-0"
                              />
                              <span className="text-[11.5px] leading-tight break-words">{ex}</span>
                            </div>
                            <div className="flex items-center justify-between pt-1.5 mt-1 border-t border-slate-200/60 text-[10px]">
                              <span className="text-slate-500">Stiker:</span>
                              <span
                                className={`px-1.5 py-0.5 rounded font-mono font-bold text-[9.5px] ${
                                  checked
                                    ? 'bg-cyan-200 text-cyan-900'
                                    : 'bg-slate-100 text-slate-500'
                                }`}
                              >
                                🏷️ {labelDef.kode}
                              </span>
                            </div>
                          </label>
                        );
                      })}
                    </div>
                  </div>

                  {/* SETTING JUMLAH LABEL STIKER THERMAL SESUAI PAKET */}
                  <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-cyan-50/80 via-slate-50 to-teal-50/60 border-2 border-cyan-300 space-y-4 shadow-sm">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-cyan-200/90 pb-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-lg bg-cyan-700 text-white flex items-center justify-center shadow-2xs">
                            <Printer className="w-4 h-4" />
                          </div>
                          <h5 className="font-black text-[14px] sm:text-[15px] text-cyan-950">
                            Setingan Jumlah Label Stiker Thermal untuk Paket Ini
                          </h5>
                        </div>
                        <p className="text-[11.5px] text-cyan-900 mt-1">
                          Label stiker thermal otomatis bertambah/berkurang saat item pemeriksaan (EDTA, Kimia, Urine, RO, dll) dipilih di atas.
                        </p>
                      </div>

                      <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
                        <label
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-bold cursor-pointer transition-colors shadow-2xs ${
                            autoSyncLabels
                              ? 'bg-teal-600 text-white border-teal-700'
                              : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                          }`}
                          title="Jika aktif, setiap centang/hapus item pemeriksaan akan langsung menyesuaikan stiker di bawah"
                        >
                          <input
                            type="checkbox"
                            checked={autoSyncLabels}
                            onChange={(e) => setAutoSyncLabels(e.target.checked)}
                            className="w-3.5 h-3.5 accent-teal-500 rounded"
                          />
                          <span>⚡ Auto-Sinkron</span>
                        </label>

                        <button
                          type="button"
                          onClick={handleAutoGenerateLabels}
                          className="px-3 py-1.5 rounded-lg bg-cyan-800 hover:bg-cyan-900 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs cursor-pointer"
                          title="Muat ulang seluruh label stiker sesuai item pemeriksaan yang terpilih"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          <span>Sinkronkan Ulang</span>
                        </button>

                        <button
                          type="button"
                          onClick={handleAddManualLabel}
                          className="px-2.5 py-1.5 rounded-lg bg-white hover:bg-cyan-50 text-cyan-900 border border-cyan-300 text-xs font-bold flex items-center gap-1 cursor-pointer"
                          title="Tambah stiker kosong / manual tanpa harus terkait ke pemeriksaan"
                        >
                          <Plus className="w-3.5 h-3.5 text-cyan-700" />
                          <span>+ Stiker Bebas</span>
                        </button>
                      </div>
                    </div>

                    {/* Quick Add Specimen Stickers */}
                    <div className="flex flex-wrap items-center gap-1.5 text-xs bg-white/90 p-2.5 rounded-xl border border-cyan-200">
                      <span className="font-bold text-slate-700 text-[11px] mr-1">
                        Tambah Spesimen Cepat:
                      </span>
                      {[
                        { label: '+ Tabung EDTA', exam: 'EDTA (Hematologi)' },
                        { label: '+ Tabung Kimia', exam: 'Kimia Darah' },
                        { label: '+ Pot Urine', exam: 'Urine Rutin' },
                        { label: '+ Rontgen (RO)', exam: 'Rontgen Thorax' },
                        { label: '+ Rekaman EKG', exam: 'EKG' },
                        { label: '+ Registrasi (Berkas)', exam: 'Registrasi' },
                      ].map((s) => (
                        <button
                          key={s.label}
                          type="button"
                          onClick={() => handleAddPresetExamAndLabel(s.exam)}
                          className="px-2 py-0.5 rounded-md bg-cyan-50 hover:bg-cyan-100 text-cyan-900 font-bold border border-cyan-200 text-[11px] cursor-pointer"
                        >
                          {s.label}
                        </button>
                      ))}
                    </div>

                    {/* Selector Jumlah Label */}
                    <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3 rounded-xl border border-cyan-200/90 shadow-2xs">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xs font-extrabold text-slate-700">
                          Jumlah Label Tercetak:
                        </span>
                        <div className="flex items-center gap-1">
                          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                            <button
                              key={num}
                              type="button"
                              onClick={() => {
                                setPkgLabelCount(num);
                                if (pkgLabels.length < num) {
                                  const additions: PackageLabelItem[] = [];
                                  for (let i = pkgLabels.length; i < num; i++) {
                                    additions.push({
                                      id: `lbl-add-${Date.now()}-${i + 1}`,
                                      nama: `Stiker Tambahan #${i + 1}`,
                                      kode: `LBL-${i + 1}`,
                                      defaultQty: 1,
                                    });
                                  }
                                  setPkgLabels([...pkgLabels, ...additions]);
                                }
                              }}
                              className={`w-8 h-8 rounded-lg font-black text-xs transition-all cursor-pointer ${
                                pkgLabelCount === num
                                  ? 'bg-cyan-700 text-white shadow-md shadow-cyan-700/20 scale-105'
                                  : 'bg-slate-50 border border-slate-300 text-slate-700 hover:bg-slate-100'
                              }`}
                            >
                              {num}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-[11.5px] font-extrabold text-cyan-950 bg-cyan-100 px-3 py-1 rounded-lg border border-cyan-300">
                          🖨️ {pkgLabels.length} Stiker Dikonfigurasi
                        </span>
                      </div>
                    </div>

                    {/* Detail Stiker List */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-extrabold text-slate-800">
                          Daftar Lembar Stiker yang Akan Dicetak Saat Registrasi:
                        </span>
                        <span className="text-[11px] text-slate-500">
                          Tiap label dapat diedit nama, kode barcode, dan jumlah lembar (defaultQty)
                        </span>
                      </div>

                      {pkgLabels.length === 0 ? (
                        <div className="p-6 text-center bg-white rounded-xl border-2 border-dashed border-slate-300 text-slate-500 space-y-2">
                          <p className="text-xs font-semibold">
                            Belum ada label stiker yang ditambahkan untuk paket ini.
                          </p>
                          <button
                            type="button"
                            onClick={handleAutoGenerateLabels}
                            className="px-3 py-1.5 rounded-lg bg-cyan-700 text-white text-xs font-bold cursor-pointer"
                          >
                            Sinkronkan dari Pemeriksaan Terpilih
                          </button>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                          {pkgLabels.map((lbl, i) => (
                            <div
                              key={lbl.id || i}
                              className="p-3 rounded-xl bg-white border border-cyan-200 shadow-2xs space-y-2 relative group hover:border-cyan-400 transition-colors"
                            >
                              <div className="flex items-center justify-between text-[11px] font-bold">
                                <div className="flex items-center gap-1.5">
                                  <span className="w-5 h-5 rounded-full bg-cyan-700 text-white flex items-center justify-center text-[10px]">
                                    {i + 1}
                                  </span>
                                  <span className="text-cyan-900 font-extrabold">Stiker #{i + 1}</span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <span className="px-1.5 py-0.5 rounded bg-cyan-100 text-cyan-900 font-mono text-[10.5px] font-black">
                                    {lbl.kode}
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteLabel(i)}
                                    className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50 cursor-pointer transition-colors"
                                    title="Hapus stiker ini"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>

                              {lbl.sourceExam && (
                                <div className="flex items-center gap-1 text-[10px] text-teal-800 bg-teal-50 border border-teal-200/80 px-1.5 py-0.5 rounded-md">
                                  <Zap className="w-2.5 h-2.5 text-teal-600 shrink-0" />
                                  <span className="truncate">Sumber: <b>{lbl.sourceExam}</b></span>
                                </div>
                              )}

                              <div>
                                <label className="block text-[10px] font-bold text-slate-500 mb-0.5">
                                  Nama Label / Spesimen:
                                </label>
                                <input
                                  type="text"
                                  value={lbl.nama}
                                  onChange={(e) => {
                                    const next = [...pkgLabels];
                                    next[i] = { ...next[i], nama: e.target.value };
                                    setPkgLabels(next);
                                  }}
                                  className="w-full px-2.5 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-800 focus:bg-white focus:ring-1 focus:ring-cyan-500"
                                  placeholder="Nama spesimen..."
                                />
                              </div>

                              <div className="flex items-center justify-between gap-1.5 pt-1 border-t border-slate-100">
                                <div className="flex items-center gap-1">
                                  <span className="text-[10px] font-bold text-slate-500">Kode:</span>
                                  <input
                                    type="text"
                                    value={lbl.kode}
                                    onChange={(e) => {
                                      const next = [...pkgLabels];
                                      next[i] = { ...next[i], kode: e.target.value.toUpperCase() };
                                      setPkgLabels(next);
                                    }}
                                    className="w-16 px-1.5 py-0.5 bg-slate-50 border border-slate-200 rounded font-mono text-[10.5px] font-black uppercase text-cyan-950 focus:bg-white"
                                  />
                                </div>

                                {/* Stepper Jumlah Lembar Cetak */}
                                <div
                                  className="flex items-center gap-1 bg-cyan-50/80 border border-cyan-200 rounded-lg px-1.5 py-0.5"
                                  title="Jumlah lembar stiker yang otomatis dicetak untuk spesimen ini"
                                >
                                  <span className="text-[9.5px] font-bold text-cyan-900">Jml:</span>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const next = [...pkgLabels];
                                      const current = next[i].defaultQty || 1;
                                      next[i] = { ...next[i], defaultQty: Math.max(1, current - 1) };
                                      setPkgLabels(next);
                                    }}
                                    className="w-4 h-4 bg-white hover:bg-cyan-100 text-cyan-900 font-bold rounded flex items-center justify-center text-[10px] border border-cyan-300 cursor-pointer"
                                  >
                                    -
                                  </button>
                                  <input
                                    type="number"
                                    min="1"
                                    max="10"
                                    value={lbl.defaultQty || 1}
                                    onChange={(e) => {
                                      const val = Math.max(1, parseInt(e.target.value) || 1);
                                      const next = [...pkgLabels];
                                      next[i] = { ...next[i], defaultQty: val };
                                      setPkgLabels(next);
                                    }}
                                    className="w-6 text-center font-black text-[11px] bg-transparent border-0 p-0 text-cyan-950"
                                  />
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const next = [...pkgLabels];
                                      const current = next[i].defaultQty || 1;
                                      next[i] = { ...next[i], defaultQty: Math.min(10, current + 1) };
                                      setPkgLabels(next);
                                    }}
                                    className="w-4 h-4 bg-white hover:bg-cyan-100 text-cyan-900 font-bold rounded flex items-center justify-center text-[10px] border border-cyan-300 cursor-pointer"
                                  >
                                    +
                                  </button>
                                  <span className="text-[9.5px] font-bold text-cyan-800">Lbr</span>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Submit Actions */}
                  <div className="flex items-center justify-between pt-2">
                    <button
                      type="button"
                      onClick={() => handleTestPrintFromMaster()}
                      className="px-4 py-2.5 rounded-xl bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 text-xs font-bold flex items-center gap-1.5 shadow-2xs cursor-pointer"
                    >
                      <Printer className="w-3.5 h-3.5 text-cyan-600" />
                      Uji Cetak ke Printer Thermal
                    </button>

                    <button
                      type="submit"
                      id="btn-submit-package-mcu"
                      className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-cyan-700 to-teal-700 hover:from-cyan-600 hover:to-teal-600 text-white text-xs font-extrabold shadow-md shadow-teal-800/20 flex items-center gap-2 cursor-pointer transition-all active:scale-95 hover:shadow-lg"
                    >
                      <Check className="w-4 h-4" />
                      {editingPkgId ? 'Perbarui Paket MCU' : 'Simpan Paket MCU Baru'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* TAB 2: PENGATURAN MESIN PRINTER THERMAL & UKURAN KERTAS */}
          {packageTab === 'thermal' && (
            <div className="bg-white border border-[#E2E8F0] rounded-2xl p-6 md:p-8 shadow-xs space-y-6">
              <div className="border-b border-[#E2E8F0] pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h4 className="font-bold text-[16px] text-[#0F172A] flex items-center gap-2">
                    <Sliders className="w-4.5 h-4.5 text-cyan-700" />
                    Pengaturan Mesin Printer Thermal &amp; Dimensi Kertas
                  </h4>
                  <p className="text-[12.5px] text-[#64748B]">
                    Sesuaikan ukuran kertas stiker roll thermal (biasanya 50x30mm), format barcode, margin, dan data peserta.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleTestPrintFromMaster()}
                    className="px-4 py-2 rounded-xl bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-300 text-xs font-bold flex items-center gap-1.5 shadow-2xs cursor-pointer"
                  >
                    <Printer className="w-3.5 h-3.5 text-teal-700" />
                    Uji Cetak Sampel
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSaveThermalConfig(thermalConfigState)}
                    className="px-5 py-2 rounded-xl bg-cyan-700 hover:bg-cyan-800 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-cyan-700/20 cursor-pointer"
                  >
                    <Check className="w-3.5 h-3.5" />
                    Simpan Default
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Left Form: Dimension & Options */}
                <div className="lg:col-span-7 space-y-5">
                  {/* Preset Buttons */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-2">
                      Pilihan Ukuran Stiker Kertas Thermal:
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {thermalPresets.map((preset) => {
                        const isSelected =
                          thermalConfigState.widthMm === preset.width &&
                          thermalConfigState.heightMm === preset.height;
                        return (
                          <button
                            key={preset.label}
                            type="button"
                            onClick={() => {
                              setThermalConfigState({
                                ...thermalConfigState,
                                widthMm: preset.width,
                                heightMm: preset.height,
                              });
                              onNotify(`Ukuran thermal diubah ke ${preset.label}`);
                            }}
                            className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                              isSelected
                                ? 'bg-cyan-50 border-cyan-500 text-cyan-900 font-bold shadow-2xs ring-1 ring-cyan-500'
                                : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-white'
                            }`}
                          >
                            <span className="block text-xs font-black">{preset.label}</span>
                            <span className="text-[10.5px] text-slate-500">
                              {preset.description}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Manual Width & Height */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">
                        Lebar (mm):
                      </label>
                      <input
                        type="number"
                        min={25}
                        max={110}
                        value={thermalConfigState.widthMm}
                        onChange={(e) =>
                          setThermalConfigState({
                            ...thermalConfigState,
                            widthMm: Number(e.target.value) || 50,
                          })
                        }
                        className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-bold text-slate-800"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">
                        Tinggi (mm):
                      </label>
                      <input
                        type="number"
                        min={15}
                        max={150}
                        value={thermalConfigState.heightMm}
                        onChange={(e) =>
                          setThermalConfigState({
                            ...thermalConfigState,
                            heightMm: Number(e.target.value) || 30,
                          })
                        }
                        className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-bold text-slate-800"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">
                        Jenis Font (Font Family):
                      </label>
                      <select
                        value={thermalConfigState.fontFamily || 'mono'}
                        onChange={(e) =>
                          setThermalConfigState({
                            ...thermalConfigState,
                            fontFamily: e.target.value as any,
                          })
                        }
                        className="w-full px-2 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-bold text-slate-800"
                      >
                        <option value="mono">Monospace (Courier)</option>
                        <option value="sans">Sans-Serif (Modern)</option>
                        <option value="condensed">Condensed (Rapat)</option>
                        <option value="serif">Serif (Formal)</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">
                        Ukuran Font (Font Size):
                      </label>
                      <select
                        value={thermalConfigState.fontSize || 'normal'}
                        onChange={(e) =>
                          setThermalConfigState({
                            ...thermalConfigState,
                            fontSize: e.target.value as any,
                          })
                        }
                        className="w-full px-2 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-bold text-slate-800"
                      >
                        <option value="extra-compact">Ekstra Kecil (Mikro)</option>
                        <option value="compact">Kecil (Kompak)</option>
                        <option value="normal">Standar (Normal)</option>
                        <option value="large">Besar (Jelas)</option>
                        <option value="extra-large">Ekstra Besar</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">
                        Ketebalan Huruf (Font Weight):
                      </label>
                      <select
                        value={thermalConfigState.fontWeight || 'bold'}
                        onChange={(e) =>
                          setThermalConfigState({
                            ...thermalConfigState,
                            fontWeight: e.target.value as any,
                          })
                        }
                        className="w-full px-2 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-bold text-slate-800"
                      >
                        <option value="normal">Normal</option>
                        <option value="bold">Tebal (Bold - Rekomendasi)</option>
                        <option value="extra-bold">Ekstra Tebal (Black)</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">
                        Format Barcode:
                      </label>
                      <select
                        value={thermalConfigState.barcodeType || 'barcode'}
                        onChange={(e) =>
                          setThermalConfigState({
                            ...thermalConfigState,
                            barcodeType: e.target.value as 'barcode' | 'qr',
                          })
                        }
                        className="w-full px-2 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-bold text-slate-800"
                      >
                        <option value="barcode">Code 128 (Barcode Garis)</option>
                        <option value="qr">QR Code (Kotak 2D)</option>
                      </select>
                    </div>
                  </div>

                  {/* Switches Field Stiker */}
                  <div className="space-y-2">
                    <label className="block text-xs font-bold text-slate-700">
                      Field yang Tercetak di Stiker Label:
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                      <label className="flex items-center gap-2 p-2.5 rounded-lg bg-slate-50 border border-slate-200 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={thermalConfigState.includeClinicName}
                          onChange={(e) =>
                            setThermalConfigState({
                              ...thermalConfigState,
                              includeClinicName: e.target.checked,
                            })
                          }
                          className="w-4 h-4 accent-cyan-600 rounded"
                        />
                        <span className="font-semibold text-slate-700">Nama Fasilitas / Klinik</span>
                      </label>

                      <label className="flex items-center gap-2 p-2.5 rounded-lg bg-slate-50 border border-slate-200 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={thermalConfigState.includeCompany}
                          onChange={(e) =>
                            setThermalConfigState({
                              ...thermalConfigState,
                              includeCompany: e.target.checked,
                            })
                          }
                          className="w-4 h-4 accent-cyan-600 rounded"
                        />
                        <span className="font-semibold text-slate-700">Nama Perusahaan / PT</span>
                      </label>

                      <label className="flex items-center gap-2 p-2.5 rounded-lg bg-slate-50 border border-slate-200 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={thermalConfigState.includeDob}
                          onChange={(e) =>
                            setThermalConfigState({
                              ...thermalConfigState,
                              includeDob: e.target.checked,
                            })
                          }
                          className="w-4 h-4 accent-cyan-600 rounded"
                        />
                        <span className="font-semibold text-slate-700">Tgl Lahir &amp; Jenis Kelamin</span>
                      </label>

                      <label className="flex items-center gap-2 p-2.5 rounded-lg bg-slate-50 border border-slate-200 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={thermalConfigState.includeDept}
                          onChange={(e) =>
                            setThermalConfigState({
                              ...thermalConfigState,
                              includeDept: e.target.checked,
                            })
                          }
                          className="w-4 h-4 accent-cyan-600 rounded"
                        />
                        <span className="font-semibold text-slate-700">Departemen / Bagian</span>
                      </label>

                      <label className="flex items-center gap-2 p-2.5 rounded-lg bg-slate-50 border border-slate-200 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={thermalConfigState.includeSpecimenNote}
                          onChange={(e) =>
                            setThermalConfigState({
                              ...thermalConfigState,
                              includeSpecimenNote: e.target.checked,
                            })
                          }
                          className="w-4 h-4 accent-cyan-600 rounded"
                        />
                        <span className="font-semibold text-slate-700">Keterangan Spesimen Tabung</span>
                      </label>

                      <label className="flex items-center gap-2 p-2.5 rounded-lg bg-slate-50 border border-slate-200 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={thermalConfigState.includeFooterDate}
                          onChange={(e) =>
                            setThermalConfigState({
                              ...thermalConfigState,
                              includeFooterDate: e.target.checked,
                            })
                          }
                          className="w-4 h-4 accent-cyan-600 rounded"
                        />
                        <span className="font-semibold text-slate-700">Footer Jam &amp; Tgl MCU</span>
                      </label>
                    </div>
                  </div>
                </div>

                {/* Right Column: Live Visual Thermal Preview */}
                <div className="lg:col-span-5 flex flex-col items-center justify-center p-5 bg-slate-100 rounded-2xl border border-slate-300">
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-3">
                    Pratinjau Hasil Cetak Kertas Thermal ({thermalConfigState.widthMm} x {thermalConfigState.heightMm} mm)
                  </span>

                  {/* Thermal Sticker Mockup */}
                  <div
                    style={{
                      width: `${Math.min(320, thermalConfigState.widthMm * 5)}px`,
                      minHeight: `${thermalConfigState.heightMm * 4.5}px`,
                    }}
                    className="bg-white border-2 border-dashed border-slate-400 rounded-lg p-3 shadow-md text-slate-900 flex flex-col justify-between select-none"
                  >
                    {/* Header */}
                    {thermalConfigState.includeClinicName && (
                      <div className="text-[9px] font-black text-center text-slate-600 uppercase border-b border-slate-200 pb-0.5 truncate">
                        {clinic.nama}
                      </div>
                    )}

                    <div className="text-center my-1">
                      {thermalConfigState.includeCompany && (
                        <div className="text-[8.5px] font-bold text-slate-500 uppercase truncate">
                          {companies[0]?.nama || 'PT. PRATAMA NUSANTARA'}
                        </div>
                      )}
                      <div className="text-[13px] font-black tracking-wide uppercase truncate leading-tight">
                        SUGIARTO NUGROHO
                      </div>
                      <div className="text-[10px] font-black font-mono text-cyan-900">
                        MCU-2025-001 • NIK: 327101890001
                      </div>
                      {thermalConfigState.includeDob && (
                        <div className="text-[8.5px] text-slate-600">
                          15-05-1992 (Pria) {thermalConfigState.includeDept && '• DEPT: PRODUKSI'}
                        </div>
                      )}
                    </div>

                    {/* Barcode Simulated */}
                    <div className="my-1 flex flex-col items-center">
                      {thermalConfigState.barcodeType === 'QR' ? (
                        <div className="w-12 h-12 bg-slate-900 p-1 flex items-center justify-center rounded">
                          <div className="w-10 h-10 bg-white grid grid-cols-3 gap-0.5 p-0.5">
                            <div className="bg-black"></div>
                            <div className="bg-white"></div>
                            <div className="bg-black"></div>
                            <div className="bg-white"></div>
                            <div className="bg-black"></div>
                            <div className="bg-white"></div>
                            <div className="bg-black"></div>
                            <div className="bg-black"></div>
                            <div className="bg-black"></div>
                          </div>
                        </div>
                      ) : (
                        <div className="h-7 w-full max-w-[200px] bg-[repeating-linear-gradient(90deg,#000_0px,#000_1.5px,#fff_1.5px,#fff_3px,#000_3px,#000_5px,#fff_5px,#fff_6.5px,#000_6.5px,#000_7.5px)]" />
                      )}
                      <span className="text-[8px] font-mono font-bold tracking-widest text-slate-700 mt-0.5">
                        *MCU-2025-001*
                      </span>
                    </div>

                    {/* Footer */}
                    <div className="border-t border-slate-200 pt-0.5 flex items-center justify-between text-[8px] text-slate-600 font-bold">
                      <span className="truncate">PAI-A: TABUNG EDTA</span>
                      {thermalConfigState.includeFooterDate && (
                        <span>24/07/2025</span>
                      )}
                    </div>
                  </div>

                  <p className="text-[11px] text-slate-500 text-center mt-3 max-w-[280px]">
                    Kertas stiker kontinu otomatis dipotong per halaman stiker sesuai setelan paket MCU.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Modal Tambah Jenis Pemeriksaan */}
          {showAddExamModal && (
            <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
              <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl border border-[#CBD5E1] space-y-4">
                <h4 className="text-[16px] font-bold text-[#0F172A]">
                  Tambah Jenis Pemeriksaan Baru
                </h4>
                <p className="text-[13px] text-[#64748B]">
                  Masukkan nama jenis pemeriksaan baru (misal: Treadmill Test, Pap Smear, Tes Narkoba 6 Parameter).
                </p>
                <input
                  type="text"
                  value={newExamInput}
                  onChange={(e) => setNewExamInput(e.target.value)}
                  placeholder="Nama pemeriksaan..."
                  className="w-full px-3.5 py-2.5 bg-white border border-[#CBD5E1] rounded-xl text-[13.5px]"
                  autoFocus
                />
                <div className="flex justify-end gap-2.5 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowAddExamModal(false)}
                    className="px-4 py-2 text-[13px] font-bold rounded-xl bg-slate-100 text-[#475569] cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (newExamInput.trim()) {
                        const trimmed = newExamInput.trim();
                        onAddExamType(trimmed);
                        if (!selectedPkgExams.includes(trimmed)) {
                          setSelectedPkgExams([...selectedPkgExams, trimmed]);
                        }
                        if (autoSyncLabels) {
                          const def = mapExamToDefaultLabel(trimmed);
                          const exists = pkgLabels.some(
                            (l) => l.sourceExam === trimmed || l.kode === def.kode
                          );
                          if (!exists) {
                            const newLabel: PackageLabelItem = {
                              id: `lbl-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
                              nama: def.nama,
                              kode: def.kode,
                              keterangan: def.keterangan,
                              defaultQty: def.defaultQty,
                              sourceExam: trimmed,
                            };
                            const nextLabels = [...pkgLabels, newLabel];
                            setPkgLabels(nextLabels);
                            setPkgLabelCount(nextLabels.length);
                          }
                        }
                        onNotify(
                          `Jenis pemeriksaan "${trimmed}" berhasil ditambahkan & label stiker thermal disinkronkan!`
                        );
                        setNewExamInput('');
                        setShowAddExamModal(false);
                      }
                    }}
                    className="px-4 py-2 text-[13px] font-bold rounded-xl bg-[#0E7490] text-white hover:bg-[#0891B2] cursor-pointer"
                  >
                    Simpan &amp; Aktifkan
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* SubAction: Setting Pemeriksaan (Parameter Fisik, Lab, Standarisasi Paket) */}
      {subAction === "exam" && (
        <SettingPemeriksaanView
          companies={companies}
          exams={exams}
          packages={localPackages}
          selectedPackageCode={selectedPackageCode}
          onSelectPackageCode={onSelectPackageCode}
          physicalParams={physicalParams}
          labParams={labParams}
          onUpdatePhysicalParams={onUpdatePhysicalParams}
          onUpdateLabParams={onUpdateLabParams}
          onUpdatePackages={onUpdatePackages}
          onNavigateToSettingPaket={() => setSubAction('package')}
          onNotify={onNotify}
        />
      )}

      {/* SubAction: Koleksi Master Rekomendasi & Saran Medis Okupasi (BENTUK TABEL & IMPORT EXCEL) */}
      {subAction === "saran-medis" && (
        <MasterSaranMedisTable
          medicalAdvices={medicalAdvices || []}
          onUpdateMedicalAdvices={onUpdateMedicalAdvices}
          onNotify={onNotify}
        />
      )}
      {/* SubAction 6: Setting Klinik & Identitas Penyelenggara */}
      {subAction === 'clinic' && (
        <div className="bg-white border border-[#E2E8F0] rounded-2xl p-6 md:p-8 shadow-xs space-y-8">
          <div className="border-b border-[#E2E8F0] pb-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h3 className="text-[19px] font-black text-[#0F172A] flex items-center gap-2">
                <Hospital className="w-6 h-6 text-[#0E7490]" />
                Identitas &amp; Legalitas Klinik Penyelenggara
              </h3>
              <p className="text-[13px] text-[#64748B] mt-1">
                Logo dan identitas resmi ini otomatis diterapkan pada Kop Surat, Header Buku MCU, Stempel Resmi, dan Lembar Pengesahan Hasil.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full text-[11.5px] font-bold bg-cyan-50 text-cyan-800 border border-cyan-200 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-cyan-600" />
                Template MCU Tersinkronisasi
              </span>
            </div>
          </div>

          {/* SECTION 1: PENGATURAN LOGO KLINIK */}
          <div className="bg-slate-50/80 border border-slate-200 rounded-2xl p-5 md:p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h4 className="text-[15px] font-black text-slate-900 flex items-center gap-2">
                  <ImageIcon className="w-4 h-4 text-cyan-700" />
                  Logo Resmi Klinik / Faskes Penyelenggara
                </h4>
                <p className="text-[12px] text-slate-500">
                  Unggah file logo klinik Anda untuk menggantikan logo bawaan pada seluruh dokumen cetak MCU.
                </p>
              </div>
              {clinicState.logoUrl && (
                <button
                  type="button"
                  onClick={() => setClinicState({ ...clinicState, logoUrl: '' })}
                  className="text-[12px] font-bold text-rose-600 hover:text-rose-700 flex items-center gap-1 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Hapus Logo
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
              {/* Logo Preview Frame */}
              <div className="lg:col-span-4 flex flex-col items-center justify-center p-4 bg-white border border-slate-200 rounded-xl shadow-2xs text-center">
                <span className="text-[10.5px] font-bold uppercase tracking-wider text-slate-400 mb-2">
                  Tampilan Logo Terpasang
                </span>
                <div className="w-full h-28 border border-dashed border-slate-300 rounded-lg flex items-center justify-center bg-slate-50 p-2 overflow-hidden">
                  {clinicState.logoUrl ? (
                    <img
                      src={clinicState.logoUrl}
                      alt={clinicState.nama}
                      className="max-h-24 max-w-full object-contain"
                    />
                  ) : (
                    <div className="flex flex-col items-center text-slate-400 text-[11px]">
                      <Hospital className="w-10 h-10 text-slate-300 mb-1" />
                      <span>Belum ada logo terpasang</span>
                      <span className="text-[9.5px] text-slate-400">(Menggunakan emblem standar)</span>
                    </div>
                  )}
                </div>

                <div className="mt-2 text-[11px] font-bold text-slate-700 truncate max-w-[200px]">
                  {clinicState.nama || 'Nama Klinik'}
                </div>
              </div>

              {/* Upload Controls & Presets */}
              <div className="lg:col-span-8 space-y-3">
                <div className="flex flex-wrap gap-2 items-center">
                  <label className="px-4 py-2 bg-cyan-700 hover:bg-cyan-800 text-white rounded-xl text-[12.5px] font-bold cursor-pointer transition-colors flex items-center gap-2 shadow-xs">
                    <Upload className="w-4 h-4" />
                    <span>Unggah Berkas Logo (PNG/JPG/SVG/WebP)</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        if (file.size > 3 * 1024 * 1024) {
                          alert('Ukuran file terlalu besar! Maksimal 3MB.');
                          return;
                        }
                        const reader = new FileReader();
                        reader.onload = (loadEvt) => {
                          const result = loadEvt.target?.result as string;
                          if (result) {
                            setClinicState({ ...clinicState, logoUrl: result });
                            onNotify('Logo klinik berhasil dimuat!');
                          }
                        };
                        reader.readAsDataURL(file);
                      }}
                    />
                  </label>

                  <span className="text-[12px] text-slate-400">atau pilih logo preset medis:</span>
                </div>

                {/* Preset Logos */}
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      const svg =
                        'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="46" fill="%230E7490"/><path d="M50 25v50M25 50h50" stroke="%23ffffff" stroke-width="12" stroke-linecap="round"/><circle cx="50" cy="50" r="42" stroke="%23A5F3FC" stroke-width="2" stroke-dasharray="4 2"/></svg>';
                      setClinicState({ ...clinicState, logoUrl: svg });
                      onNotify('Logo preset Medika Cyan diterapkan!');
                    }}
                    className="p-2 border border-slate-200 bg-white hover:border-cyan-500 rounded-lg flex items-center gap-2 text-left text-[11px] font-semibold text-slate-700 cursor-pointer transition-all hover:shadow-xs"
                  >
                    <div className="w-7 h-7 rounded-full bg-cyan-700 flex items-center justify-center text-white font-bold text-xs shrink-0">
                      +
                    </div>
                    <span className="truncate">Medika Cyan</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      const svg =
                        'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" rx="20" fill="%23059669"/><path d="M50 20v60M20 50h60" stroke="%23ffffff" stroke-width="14" stroke-linecap="round"/><circle cx="50" cy="50" r="38" stroke="%23ffffff" stroke-width="2" stroke-opacity="0.4"/></svg>';
                      setClinicState({ ...clinicState, logoUrl: svg });
                      onNotify('Logo preset K3 Emerald diterapkan!');
                    }}
                    className="p-2 border border-slate-200 bg-white hover:border-emerald-500 rounded-lg flex items-center gap-2 text-left text-[11px] font-semibold text-slate-700 cursor-pointer transition-all hover:shadow-xs"
                  >
                    <div className="w-7 h-7 rounded-md bg-emerald-600 flex items-center justify-center text-white font-bold text-xs shrink-0">
                      +
                    </div>
                    <span className="truncate">K3 Emerald</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      const svg =
                        'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><path d="M50 15 L85 28 C85 62 50 85 50 85 C50 85 15 62 15 28 Z" fill="%231E3A8A" stroke="%23F59E0B" stroke-width="4"/><path d="M50 32v34M33 49h34" stroke="%23ffffff" stroke-width="8" stroke-linecap="round"/></svg>';
                      setClinicState({ ...clinicState, logoUrl: svg });
                      onNotify('Logo preset Shield Husada diterapkan!');
                    }}
                    className="p-2 border border-slate-200 bg-white hover:border-blue-500 rounded-lg flex items-center gap-2 text-left text-[11px] font-semibold text-slate-700 cursor-pointer transition-all hover:shadow-xs"
                  >
                    <div className="w-7 h-7 rounded-sm bg-blue-900 border border-amber-400 flex items-center justify-center text-amber-300 font-bold text-xs shrink-0">
                      +
                    </div>
                    <span className="truncate">Shield Husada</span>
                  </button>
                </div>

                <div className="pt-1">
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">
                    Atau Masukkan Tautan / URL Gambar Logo:
                  </label>
                  <input
                    type="text"
                    placeholder="https://domain.com/logo-klinik.png"
                    value={clinicState.logoUrl || ''}
                    onChange={(e) => setClinicState({ ...clinicState, logoUrl: e.target.value })}
                    className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-[12px] font-mono"
                  />
                </div>
              </div>
            </div>

            {/* Live Header MCU Simulator */}
            <div className="mt-5 pt-4 border-t border-slate-200">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-2 block">
                Pratinjau Live: Header Laporan MCU (Kop Surat)
              </span>
              <div className="bg-white border border-slate-300 rounded-xl p-4 shadow-2xs flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 min-w-0">
                  {clinicState.logoUrl ? (
                    <img
                      src={clinicState.logoUrl}
                      alt={clinicState.nama}
                      className="max-h-12 max-w-[130px] object-contain shrink-0"
                    />
                  ) : (
                    <div className="w-11 h-11 rounded-lg bg-gradient-to-br from-cyan-600 to-blue-800 text-white flex items-center justify-center shrink-0 font-black">
                      <Hospital className="w-6 h-6" />
                    </div>
                  )}
                  <div className="min-w-0">
                    <div className="text-[14px] font-black text-slate-900 tracking-wide uppercase truncate">
                      {clinicState.nama || 'KLINIK PENYELENGGARA MCU'}
                    </div>
                    <div className="text-[10.5px] font-bold text-slate-700 truncate">
                      {clinicState.legalitas || 'PT. PENYELENGGARA KESEHATAN'}
                    </div>
                    <div className="text-[9.5px] italic text-slate-500 truncate">
                      {clinicState.tagline || (clinicState.izinOperasional ? `Izin: ${clinicState.izinOperasional}` : 'Pemeriksaan Kesehatan Kerja & MCU')}
                    </div>
                  </div>
                </div>

                <div className="hidden sm:block border border-slate-400 rounded-xs px-2 py-1 text-[9px] font-mono text-slate-700 shrink-0">
                  <div>No. ID/Mcu : PAN-2025-001</div>
                  <div>Pasien &nbsp; &nbsp; : ABDUL ROHMAN (Pria)</div>
                  <div>Paket &nbsp; &nbsp; &nbsp;: Paket MCU Lengkap</div>
                </div>
              </div>
            </div>
          </div>

          {/* SECTION 2: FORM DATA IDENTITAS & LEGALITAS */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              onUpdateClinic(clinicState);
              onNotify('Identitas dan Logo klinik berhasil disimpan!');
            }}
            className="space-y-6"
          >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <div>
                <label className="block text-[12.5px] font-bold text-[#334155] mb-1">
                  Nama Fasilitas / Klinik *
                </label>
                <input
                  type="text"
                  value={clinicState.nama}
                  onChange={(e) => setClinicState({ ...clinicState, nama: e.target.value })}
                  placeholder="contoh: Klinik Pratama Sehat Terpadu"
                  className="w-full px-3 py-2 bg-white border border-[#CBD5E1] rounded-lg text-[13px] font-medium"
                  required
                />
              </div>

              <div>
                <label className="block text-[12.5px] font-bold text-[#334155] mb-1">
                  Slogan / Motto Klinik (Tagline)
                </label>
                <input
                  type="text"
                  value={clinicState.tagline || ''}
                  onChange={(e) => setClinicState({ ...clinicState, tagline: e.target.value })}
                  placeholder="contoh: Layanan Kesehatan Kerja & MCU Terpadu"
                  className="w-full px-3 py-2 bg-white border border-[#CBD5E1] rounded-lg text-[13px]"
                />
              </div>

              <div>
                <label className="block text-[12.5px] font-bold text-[#334155] mb-1">
                  Badan Hukum / Legalitas PT
                </label>
                <input
                  type="text"
                  value={clinicState.legalitas}
                  onChange={(e) => setClinicState({ ...clinicState, legalitas: e.target.value })}
                  placeholder="contoh: PT. Medika Sehat Nusantara"
                  className="w-full px-3 py-2 bg-white border border-[#CBD5E1] rounded-lg text-[13px]"
                />
              </div>

              <div>
                <label className="block text-[12.5px] font-bold text-[#334155] mb-1">
                  Nomor Izin Operasional Klinik
                </label>
                <input
                  type="text"
                  value={clinicState.izinOperasional}
                  onChange={(e) => setClinicState({ ...clinicState, izinOperasional: e.target.value })}
                  placeholder="contoh: 503/089/DPMPTSP/KLINIK/2023"
                  className="w-full px-3 py-2 bg-white border border-[#CBD5E1] rounded-lg text-[13px]"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-[12.5px] font-bold text-[#334155] mb-1">
                  Alamat Lengkap Fasilitas / Klinik
                </label>
                <input
                  type="text"
                  value={clinicState.alamat}
                  onChange={(e) => setClinicState({ ...clinicState, alamat: e.target.value })}
                  placeholder="contoh: Jl. Kesehatan Raya No. 45, Kebayoran Baru"
                  className="w-full px-3 py-2 bg-white border border-[#CBD5E1] rounded-lg text-[13px]"
                />
              </div>

              <div>
                <label className="block text-[12.5px] font-bold text-[#334155] mb-1">
                  Kota / Kabupaten
                </label>
                <input
                  type="text"
                  value={clinicState.kota}
                  onChange={(e) => setClinicState({ ...clinicState, kota: e.target.value })}
                  placeholder="contoh: Jakarta Selatan"
                  className="w-full px-3 py-2 bg-white border border-[#CBD5E1] rounded-lg text-[13px]"
                />
              </div>

              <div>
                <label className="block text-[12.5px] font-bold text-[#334155] mb-1">
                  Provinsi
                </label>
                <input
                  type="text"
                  value={clinicState.provinsi || ''}
                  onChange={(e) => setClinicState({ ...clinicState, provinsi: e.target.value })}
                  placeholder="contoh: DKI Jakarta"
                  className="w-full px-3 py-2 bg-white border border-[#CBD5E1] rounded-lg text-[13px]"
                />
              </div>

              <div>
                <label className="block text-[12.5px] font-bold text-[#334155] mb-1">
                  Kode Pos
                </label>
                <input
                  type="text"
                  value={clinicState.kodePos || ''}
                  onChange={(e) => setClinicState({ ...clinicState, kodePos: e.target.value })}
                  placeholder="contoh: 12180"
                  className="w-full px-3 py-2 bg-white border border-[#CBD5E1] rounded-lg text-[13px]"
                />
              </div>

              <div>
                <label className="block text-[12.5px] font-bold text-[#334155] mb-1">
                  No. Telepon / Hotline
                </label>
                <input
                  type="text"
                  value={clinicState.telp}
                  onChange={(e) => setClinicState({ ...clinicState, telp: e.target.value, telepon: e.target.value })}
                  placeholder="contoh: 021-72891100"
                  className="w-full px-3 py-2 bg-white border border-[#CBD5E1] rounded-lg text-[13px]"
                />
              </div>

              <div>
                <label className="block text-[12.5px] font-bold text-[#334155] mb-1">
                  Email Pelayanan MCU
                </label>
                <input
                  type="email"
                  value={clinicState.email}
                  onChange={(e) => setClinicState({ ...clinicState, email: e.target.value })}
                  placeholder="contoh: pelayanan@kliniksehat.co.id"
                  className="w-full px-3 py-2 bg-white border border-[#CBD5E1] rounded-lg text-[13px]"
                />
              </div>

              <div>
                <label className="block text-[12.5px] font-bold text-[#334155] mb-1">
                  Website Resmi Klinik
                </label>
                <input
                  type="text"
                  value={clinicState.web || clinicState.website || ''}
                  onChange={(e) => setClinicState({ ...clinicState, web: e.target.value, website: e.target.value })}
                  placeholder="contoh: www.kliniksehat.co.id"
                  className="w-full px-3 py-2 bg-white border border-[#CBD5E1] rounded-lg text-[13px]"
                />
              </div>

              <div>
                <label className="block text-[12.5px] font-bold text-[#334155] mb-1">
                  Dokter Penanggung Jawab Teknis (Dokter PJ)
                </label>
                <input
                  type="text"
                  value={clinicState.dokterPJ}
                  onChange={(e) => setClinicState({ ...clinicState, dokterPJ: e.target.value })}
                  placeholder="contoh: dr. Budi Santoso, Sp.Ok"
                  className="w-full px-3 py-2 bg-white border border-[#CBD5E1] rounded-lg text-[13px]"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-[12.5px] font-bold text-[#334155] mb-1">
                  Direktur / Pimpinan Penyelenggara
                </label>
                <input
                  type="text"
                  value={clinicState.penanggungJawab || ''}
                  onChange={(e) => setClinicState({ ...clinicState, penanggungJawab: e.target.value })}
                  placeholder="contoh: dr. H. Hendra Wijaya, MARS"
                  className="w-full px-3 py-2 bg-white border border-[#CBD5E1] rounded-lg text-[13px]"
                />
              </div>
            </div>

            <div className="pt-3 border-t border-slate-200 flex items-center justify-between">
              <span className="text-[12px] text-slate-500">
                Pastikan nama klinik dan kontak sudah sesuai untuk legalitas buku MCU resmi.
              </span>
              <button
                type="submit"
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#0E7490] to-[#0891B2] text-white text-[13px] font-bold shadow-md shadow-cyan-600/20 hover:opacity-95 cursor-pointer flex items-center gap-2"
              >
                <span>💾 Simpan Identitas &amp; Logo Klinik</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* SubAction 8: Pengaturan Login Akses (Admin Exclusive) */}
      {subAction === 'login-access' && (
        <PengaturanLoginAksesView
          userAccounts={userAccounts}
          onUpdateUserAccounts={onUpdateUserAccounts || (() => {})}
          currentSession={session || null}
          companies={companies}
          onNotify={onNotify}
        />
      )}

      {/* MODAL UJI CETAK PRINTER THERMAL */}
      {showTestThermalModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
            {/* Header */}
            <div className="p-4 px-6 bg-gradient-to-r from-slate-900 via-cyan-950 to-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-cyan-600/30 border border-cyan-400/40 flex items-center justify-center text-cyan-300">
                  <Printer className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-sm tracking-wide flex items-center gap-2">
                    UJI CETAK PRINTER THERMAL
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-400/30">
                      {thermalConfigState.widthMm} x {thermalConfigState.heightMm} mm
                    </span>
                  </h3>
                  <p className="text-[11px] text-cyan-200/80">
                    Memunculkan dialog printer browser & verifikasi stiker barcode
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowTestThermalModal(false)}
                className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 text-white/80 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Notification Banner */}
            <div className="bg-cyan-50 border-b border-cyan-100 p-3 px-6 text-[12px] text-cyan-900 flex items-start gap-2.5">
              <span className="text-base leading-none">ℹ️</span>
              <div>
                <b>Perintah dialog printer telah dikirim ke browser.</b> Jika dialog printer belum otomatis muncul karena aturan keamanan iframe atau pop-up, klik tombol <b>&quot;Munculkan Dialog Printer Sekarang&quot;</b> atau buka di <b>&quot;Tab Baru / Jendela Mandiri&quot;</b>.
              </div>
            </div>

            {/* Body */}
            <div className="p-6 overflow-y-auto space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 items-start">
                {/* Visual Label Preview */}
                <div className="flex flex-col items-center">
                  <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center justify-between w-full">
                    <span>Simulasi Stiker ({testThermalActiveLabelIndex + 1}/{testThermalModalItems.length})</span>
                    <span className="text-[10px] text-cyan-700 bg-cyan-100 px-1.5 py-0.5 rounded">
                      {thermalConfigState.preset}
                    </span>
                  </div>

                  {/* Card containing the real thermal label */}
                  <div className="bg-slate-100 p-4 rounded-xl border border-slate-200 shadow-inner flex flex-col items-center justify-center w-full min-h-[160px]">
                    <div
                      className="bg-white shadow-md border border-slate-400 rounded-xs overflow-hidden"
                      dangerouslySetInnerHTML={{
                        __html: renderSingleLabelHtml(
                          testThermalModalItems[testThermalActiveLabelIndex] || testThermalModalItems[0] || {
                            index: 1,
                            total: 1,
                            labelTitle: 'REGISTRASI',
                            labelCode: 'REG',
                            patient: {
                              no: 1,
                              id: 1,
                              mcuNo: '001',
                              nik: '3271018900010002',
                              nama: 'TEST PARTICIPANT THERMAL',
                              pt: 'PT. PANARUB INDUSTRY',
                              dept: 'PRODUKSI',
                              bagian: 'OPERATOR',
                              jabatan: 'OPERATOR',
                              tglLahir: '1992-05-15',
                              jk: 'Pria',
                              paket: 'PAN-RO',
                              kodePaket: 'RO',
                              keteranganPaket: 'Paket MCU Rontgen',
                              tglMcu: new Date().toISOString().split('T')[0],
                              jam: '08:30:00',
                              tglInput: new Date().toISOString().split('T')[0],
                              status: 'Hadir',
                            },
                            quantity: 1,
                          },
                          clinic,
                          thermalConfigState
                        ),
                      }}
                    />
                  </div>

                  {/* Multiple Labels Pagination if more than 1 label */}
                  {testThermalModalItems.length > 1 && (
                    <div className="flex items-center gap-1 mt-2">
                      {testThermalModalItems.map((lbl, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setTestThermalActiveLabelIndex(idx)}
                          className={`px-2 py-0.5 rounded text-[11px] font-bold cursor-pointer transition-all ${
                            testThermalActiveLabelIndex === idx
                              ? 'bg-cyan-700 text-white'
                              : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                          }`}
                        >
                          {lbl.labelCode || idx + 1}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Parameters & Printer Info */}
                <div className="space-y-3 text-[12.5px]">
                  <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-2">
                    <div className="font-bold text-slate-800 border-b border-slate-200 pb-1.5 flex items-center justify-between">
                      <span>Konfigurasi Mesin Thermal</span>
                      <span className="text-[11px] text-emerald-700 font-semibold bg-emerald-100 px-2 py-0.5 rounded-full">
                        Driver Siap
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-y-1.5 text-slate-600 text-[11.5px]">
                      <div>Ukuran Kertas:</div>
                      <div className="font-semibold text-slate-900">{thermalConfigState.widthMm} x {thermalConfigState.heightMm} mm</div>
                      <div>Tipe Font:</div>
                      <div className="font-semibold text-slate-900">{thermalConfigState.fontFamily} ({thermalConfigState.fontSize})</div>
                      <div>Format Barcode:</div>
                      <div className="font-semibold text-slate-900">{thermalConfigState.barcodeType === 'qr' ? '2D QR Code' : '1D Code 128'}</div>
                      <div>Jumlah Stiker Uji:</div>
                      <div className="font-semibold text-slate-900">{testThermalModalItems.reduce((acc, i) => acc + (i.quantity || 1), 0)} lembar stiker</div>
                    </div>
                  </div>

                  <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-2">
                    <div className="font-bold text-slate-800 border-b border-slate-200 pb-1.5">
                      Data Sampel Uji Cetak
                    </div>
                    <div className="grid grid-cols-2 gap-y-1 text-slate-600 text-[11.5px]">
                      <div>Nama Peserta:</div>
                      <div className="font-bold text-slate-900">TEST PARTICIPANT THERMAL</div>
                      <div>No. MCU & NIK:</div>
                      <div className="font-semibold text-slate-900 font-mono">#001 (3271018900010002)</div>
                      <div>Perusahaan:</div>
                      <div className="font-semibold text-slate-900 truncate">PT. PANARUB INDUSTRY</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer Actions */}
            <div className="p-4 px-6 bg-slate-100 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => setShowTestThermalModal(false)}
                className="px-4 py-2.5 rounded-xl bg-white hover:bg-slate-200 border border-slate-300 text-slate-700 text-xs font-bold transition-colors cursor-pointer"
              >
                Tutup
              </button>

              <div className="flex flex-wrap items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => {
                    const opened = openThermalPrintTab(testThermalModalItems, clinic, thermalConfigState);
                    if (opened) {
                      onNotify('Membuka jendela cetak mandiri thermal di tab baru.');
                    } else {
                      executeThermalPrint(testThermalModalItems, clinic, thermalConfigState);
                    }
                  }}
                  className="px-3.5 py-2.5 rounded-xl bg-white hover:bg-cyan-50 border border-cyan-300 text-cyan-800 text-xs font-bold transition-all shadow-2xs flex items-center gap-1.5 cursor-pointer"
                  title="Buka jendela cetak mandiri di tab baru (bebas proteksi iframe)"
                >
                  <ExternalLink className="w-3.5 h-3.5 text-cyan-700" />
                  Buka di Jendela / Tab Cetak Baru
                </button>

                <button
                  type="button"
                  onClick={() => {
                    executeThermalPrint(testThermalModalItems, clinic, thermalConfigState);
                    onNotify('Memicu dialog printer browser untuk uji cetak.');
                  }}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-700 to-teal-700 hover:from-cyan-600 hover:to-teal-600 text-white text-xs font-black shadow-lg shadow-cyan-900/20 flex items-center gap-2 transition-all active:scale-95 cursor-pointer"
                >
                  <Printer className="w-4 h-4" />
                  Munculkan Dialog Printer Sekarang
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Confirm Delete Modal for Company, Doctor, and Package */}
      <ConfirmDeleteModal
        isOpen={deleteModalState.isOpen}
        title={
          deleteModalState.type === 'company'
            ? 'Hapus Perusahaan Rekanan'
            : deleteModalState.type === 'doctor'
            ? 'Hapus Dokter Pemeriksa'
            : 'Hapus Paket MCU'
        }
        category={
          deleteModalState.type === 'company'
            ? 'Master Perusahaan Rekanan'
            : deleteModalState.type === 'doctor'
            ? 'Master Tenaga Medis'
            : 'Master Paket Pemeriksaan'
        }
        itemName={deleteModalState.name}
        itemCode={deleteModalState.code}
        warningMessage={
          deleteModalState.type === 'company'
            ? `Data perusahaan "${deleteModalState.name}" akan dihapus permanen dari sistem dan Cloud Firestore.`
            : deleteModalState.type === 'doctor'
            ? `Data dokter pemeriksa "${deleteModalState.name}" akan dihapus permanen dari sistem dan Cloud Firestore.`
            : `Paket MCU "${deleteModalState.name}" akan dihapus permanen dari sistem dan Cloud Firestore.`
        }
        onClose={() => setDeleteModalState((prev) => ({ ...prev, isOpen: false }))}
        onConfirm={handleExecuteDelete}
      />
    </div>
  );
};
