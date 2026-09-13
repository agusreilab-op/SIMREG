import React, { useState, useEffect, useMemo } from 'react';
import {
  FlaskConical,
  Activity,
  Plus,
  Search,
  Filter,
  Edit2,
  Trash2,
  X,
  CheckCircle2,
  AlertTriangle,
  Sliders,
  Layers,
  Save,
  Check,
  Building,
  Package,
  Upload,
  Download,
  FileSpreadsheet,
  Tag,
  Info,
  HeartPulse,
  Radio,
  Volume2,
  Wind,
  Stethoscope,
  ChevronRight,
  CheckSquare,
  Square,
  HelpCircle,
} from 'lucide-react';
import * as XLSX from 'xlsx';
import {
  PhysicalExamParam,
  PhysicalParamCategory,
  LabExamParam,
  LabParamCategory,
  DiagnosticExamParam,
  DiagnosticModality,
  Company,
  MCUPackage,
} from '../types';
import {
  initialPhysicalExamParams,
  initialLabExamParams,
  initialPackages,
} from '../data/initialData';
import {
  initialRontgenParams,
  initialEKGParams,
  initialAudioParams,
  initialSpiroParams,
  initialPenunjangParams,
} from '../data/initialDiagnosticParams';
import { ImportPhysicalParamsModal } from './ImportPhysicalParamsModal';
import { ImportLabParamsModal } from './ImportLabParamsModal';
import { DeleteParamConfirmModal, DeleteTargetInfo } from './DeleteParamConfirmModal';
import { DiagnosticParamModal } from './DiagnosticParamModal';
import { LinkPackageModal } from './LinkPackageModal';

interface SettingPemeriksaanViewProps {
  companies: Company[];
  exams: string[];
  packages?: MCUPackage[];
  selectedPackageCode?: string;
  onSelectPackageCode?: (code: string) => void;
  physicalParams?: PhysicalExamParam[];
  labParams?: LabExamParam[];
  onUpdatePhysicalParams?: (params: PhysicalExamParam[]) => void;
  onUpdateLabParams?: (params: LabExamParam[]) => void;
  onUpdatePackages?: (packages: MCUPackage[]) => void;
  onNavigateToSettingPaket?: () => void;
  onNotify: (msg: string) => void;
}

type TabType = 'fisik' | 'lab' | 'rontgen' | 'ekg' | 'audio' | 'spiro' | 'penunjang' | 'paket';

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

const LAB_CATEGORIES: LabParamCategory[] = [
  'Hematologi',
  'Kimia Darah',
  'Urinalisis',
  'Skrining Narkoba',
  'Imunologi & Serologi',
  'Feses Lengkap',
];

const RONTGEN_CATEGORIES = [
  'Cor (Jantung)',
  'Pulmo (Paru)',
  'Sinus & Diafragma',
  'Skeletal & Dinding Dada',
  'Kesimpulan & Resume',
];

const EKG_CATEGORIES = [
  'Tanda & Laju',
  'Irama',
  'Interval & Konduksi',
  'Axis Jantung',
  'Morfologi Gelombang',
  'Kesimpulan',
];

const AUDIO_CATEGORIES = [
  'Ambang Dengar AC Telinga Kanan',
  'Ambang Dengar AC Telinga Kiri',
  'Rata-Rata Ambang Dengar (PTA)',
  'Klasifikasi & Derajat',
  'K3 Okupasi & Proteksi Pendengaran',
];

const SPIRO_CATEGORIES = [
  'Parameter Ventilasi',
  'Rasio Faal Paru',
  'Kesimpulan',
];

const PENUNJANG_CATEGORIES = [
  'Treadmill Stress Test',
  'USG Abdomen',
  'Lainnya',
];

export const SettingPemeriksaanView: React.FC<SettingPemeriksaanViewProps> = ({
  companies,
  exams,
  packages = initialPackages,
  selectedPackageCode = 'ALL',
  onSelectPackageCode,
  physicalParams: propPhysicalParams,
  labParams: propLabParams,
  onUpdatePhysicalParams,
  onUpdateLabParams,
  onUpdatePackages,
  onNavigateToSettingPaket,
  onNotify,
}) => {
  // Helper to load packages from localStorage or fallback
  const getStoredPackages = (): MCUPackage[] => {
    try {
      const saved = localStorage.getItem('simreg_packages');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return packages && packages.length > 0 ? packages : initialPackages;
  };

  const [packageList, setPackageList] = useState<MCUPackage[]>(getStoredPackages);

  // Sync whenever packages prop changes
  useEffect(() => {
    if (packages && packages.length > 0) {
      setPackageList(packages);
    }
  }, [packages]);

  // Sync whenever simreg_packages_updated or storage event occurs
  useEffect(() => {
    const handlePackagesUpdate = () => {
      setPackageList(getStoredPackages());
    };
    window.addEventListener('simreg_packages_updated', handlePackagesUpdate);
    window.addEventListener('storage', handlePackagesUpdate);
    return () => {
      window.removeEventListener('simreg_packages_updated', handlePackagesUpdate);
      window.removeEventListener('storage', handlePackagesUpdate);
    };
  }, []);

  const [activeTab, setActiveTab] = useState<TabType>('fisik');

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [filterPackageCode, setFilterPackageCode] = useState<string>(selectedPackageCode || 'ALL');

  useEffect(() => {
    if (selectedPackageCode) {
      setFilterPackageCode(selectedPackageCode);
    }
  }, [selectedPackageCode]);

  const handleSelectPackage = (code: string) => {
    setFilterPackageCode(code);
    if (onSelectPackageCode) {
      onSelectPackageCode(code);
    }
  };

  // Delete Modal State
  const [deleteTarget, setDeleteTarget] = useState<DeleteTargetInfo | null>(null);

  // Link Package Modal State
  const [linkPackageTarget, setLinkPackageTarget] = useState<{
    paramType: DeleteTargetInfo['type'];
    id: string;
    name: string;
    code: string;
    currentPackages: string[];
  } | null>(null);

  // Diagnostic Modal State
  const [diagnosticModal, setDiagnosticModal] = useState<{
    isOpen: boolean;
    modality: DiagnosticModality;
    item: DiagnosticExamParam | null;
  }>({
    isOpen: false,
    modality: 'rontgen',
    item: null,
  });

  // Physical Form & Modal State
  const [showPhysicalModal, setShowPhysicalModal] = useState(false);
  const [editingPhysical, setEditingPhysical] = useState<PhysicalExamParam | null>(null);
  const [physicalForm, setPhysicalForm] = useState<Omit<PhysicalExamParam, 'id'>>({
    kode: '',
    nama: '',
    kategori: 'Tanda Vital',
    paketCodes: ['ALL'],
    tipeInput: 'text',
    nilaiNormal: '',
    satuan: '',
    pilihanOpsi: [],
    keterangan: '',
    isActive: true,
  });

  // Lab Form & Modal State
  const [showLabModal, setShowLabModal] = useState(false);
  const [editingLab, setEditingLab] = useState<LabExamParam | null>(null);
  const [labForm, setLabForm] = useState<Omit<LabExamParam, 'id'>>({
    kode: '',
    nama: '',
    kategori: 'Hematologi',
    subKategori: '',
    paketCodes: ['ALL'],
    nilaiRujukanPria: '',
    nilaiRujukanWanita: '',
    satuan: '',
    metodeTes: '',
    keterangan: '',
    isActive: true,
  });

  // Import Modals
  const [showImportPhysicalModal, setShowImportPhysicalModal] = useState(false);
  const [showImportLabModal, setShowImportLabModal] = useState(false);

  // Parameters Lists State with localStorage persistence
  const [physicalList, setPhysicalList] = useState<PhysicalExamParam[]>(() => {
    const saved = localStorage.getItem('simreg_physical_params');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error(e);
      }
    }
    return propPhysicalParams && propPhysicalParams.length > 0
      ? propPhysicalParams
      : initialPhysicalExamParams;
  });

  const [labList, setLabList] = useState<LabExamParam[]>(() => {
    const saved = localStorage.getItem('simreg_lab_params');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error(e);
      }
    }
    return propLabParams && propLabParams.length > 0 ? propLabParams : initialLabExamParams;
  });

  const [rontgenList, setRontgenList] = useState<DiagnosticExamParam[]>(() => {
    const saved = localStorage.getItem('simreg_rontgen_params');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error(e);
      }
    }
    return initialRontgenParams;
  });

  const [ekgList, setEkgList] = useState<DiagnosticExamParam[]>(() => {
    const saved = localStorage.getItem('simreg_ekg_params');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error(e);
      }
    }
    return initialEKGParams;
  });

  const [audioList, setAudioList] = useState<DiagnosticExamParam[]>(() => {
    const saved = localStorage.getItem('simreg_audio_params');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error(e);
      }
    }
    return initialAudioParams;
  });

  const [spiroList, setSpiroList] = useState<DiagnosticExamParam[]>(() => {
    const saved = localStorage.getItem('simreg_spiro_params');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error(e);
      }
    }
    return initialSpiroParams;
  });

  const [penunjangList, setPenunjangList] = useState<DiagnosticExamParam[]>(() => {
    const saved = localStorage.getItem('simreg_penunjang_params');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error(e);
      }
    }
    return initialPenunjangParams;
  });

  // Package Standardization Tab States
  const [selectedCompany, setSelectedCompany] = useState(
    companies[0]?.nama || 'Semua Perusahaan / Rekanan'
  );
  const [selectedPackage, setSelectedPackage] = useState(
    packageList[0]?.kode || (packages && packages[0]?.kode) || 'PAKET-STD'
  );

  useEffect(() => {
    if (packageList.length > 0 && !packageList.some((p) => p.kode === selectedPackage)) {
      setSelectedPackage(packageList[0].kode);
    }
  }, [packageList, selectedPackage]);

  const [packageModalityTab, setPackageModalityTab] = useState<
    'fisik' | 'lab' | 'rontgen' | 'ekg' | 'audio' | 'spiro' | 'penunjang'
  >('fisik');
  const [pkgSearchQuery, setPkgSearchQuery] = useState('');

  // --------------------------------------------------------------------------
  // Delete Handler with In-App Confirmation Modal (100% Reliable, no window.confirm)
  // --------------------------------------------------------------------------
  const openDeleteConfirm = (
    type: DeleteTargetInfo['type'],
    id: string,
    name: string,
    code: string
  ) => {
    setDeleteTarget({ type, id, name, code });
  };

  const handleExecuteDelete = () => {
    if (!deleteTarget) return;

    const { type, id, name } = deleteTarget;

    switch (type) {
      case 'fisik': {
        const updated = physicalList.filter((p) => p.id !== id);
        setPhysicalList(updated);
        localStorage.setItem('simreg_physical_params', JSON.stringify(updated));
        if (onUpdatePhysicalParams) onUpdatePhysicalParams(updated);
        onNotify(`Parameter fisik "${name}" berhasil dihapus.`);
        break;
      }
      case 'lab': {
        const updated = labList.filter((l) => l.id !== id);
        setLabList(updated);
        localStorage.setItem('simreg_lab_params', JSON.stringify(updated));
        if (onUpdateLabParams) onUpdateLabParams(updated);
        onNotify(`Parameter lab "${name}" berhasil dihapus.`);
        break;
      }
      case 'rontgen': {
        const updated = rontgenList.filter((r) => r.id !== id);
        setRontgenList(updated);
        localStorage.setItem('simreg_rontgen_params', JSON.stringify(updated));
        onNotify(`Parameter rontgen "${name}" berhasil dihapus.`);
        break;
      }
      case 'ekg': {
        const updated = ekgList.filter((e) => e.id !== id);
        setEkgList(updated);
        localStorage.setItem('simreg_ekg_params', JSON.stringify(updated));
        onNotify(`Parameter EKG "${name}" berhasil dihapus.`);
        break;
      }
      case 'audio': {
        const updated = audioList.filter((a) => a.id !== id);
        setAudioList(updated);
        localStorage.setItem('simreg_audio_params', JSON.stringify(updated));
        onNotify(`Parameter audiometri "${name}" berhasil dihapus.`);
        break;
      }
      case 'spiro': {
        const updated = spiroList.filter((s) => s.id !== id);
        setSpiroList(updated);
        localStorage.setItem('simreg_spiro_params', JSON.stringify(updated));
        onNotify(`Parameter spirometri "${name}" berhasil dihapus.`);
        break;
      }
      case 'penunjang': {
        const updated = penunjangList.filter((p) => p.id !== id);
        setPenunjangList(updated);
        localStorage.setItem('simreg_penunjang_params', JSON.stringify(updated));
        onNotify(`Parameter penunjang "${name}" berhasil dihapus.`);
        break;
      }
    }

    setDeleteTarget(null);
  };

  // --------------------------------------------------------------------------
  // Link Package Handler
  // --------------------------------------------------------------------------
  const handleSaveLinkedPackages = (selectedCodes: string[]) => {
    if (!linkPackageTarget) return;
    const { paramType, id, name } = linkPackageTarget;

    switch (paramType) {
      case 'fisik': {
        const updated = physicalList.map((p) =>
          p.id === id ? { ...p, paketCodes: selectedCodes } : p
        );
        setPhysicalList(updated);
        localStorage.setItem('simreg_physical_params', JSON.stringify(updated));
        if (onUpdatePhysicalParams) onUpdatePhysicalParams(updated);
        break;
      }
      case 'lab': {
        const updated = labList.map((l) =>
          l.id === id ? { ...l, paketCodes: selectedCodes } : l
        );
        setLabList(updated);
        localStorage.setItem('simreg_lab_params', JSON.stringify(updated));
        if (onUpdateLabParams) onUpdateLabParams(updated);
        break;
      }
      case 'rontgen': {
        const updated = rontgenList.map((r) =>
          r.id === id ? { ...r, paketCodes: selectedCodes } : r
        );
        setRontgenList(updated);
        localStorage.setItem('simreg_rontgen_params', JSON.stringify(updated));
        break;
      }
      case 'ekg': {
        const updated = ekgList.map((e) =>
          e.id === id ? { ...e, paketCodes: selectedCodes } : e
        );
        setEkgList(updated);
        localStorage.setItem('simreg_ekg_params', JSON.stringify(updated));
        break;
      }
      case 'audio': {
        const updated = audioList.map((a) =>
          a.id === id ? { ...a, paketCodes: selectedCodes } : a
        );
        setAudioList(updated);
        localStorage.setItem('simreg_audio_params', JSON.stringify(updated));
        break;
      }
      case 'spiro': {
        const updated = spiroList.map((s) =>
          s.id === id ? { ...s, paketCodes: selectedCodes } : s
        );
        setSpiroList(updated);
        localStorage.setItem('simreg_spiro_params', JSON.stringify(updated));
        break;
      }
      case 'penunjang': {
        const updated = penunjangList.map((p) =>
          p.id === id ? { ...p, paketCodes: selectedCodes } : p
        );
        setPenunjangList(updated);
        localStorage.setItem('simreg_penunjang_params', JSON.stringify(updated));
        break;
      }
    }

    onNotify(`Keterkaitan paket untuk "${name}" berhasil diperbarui.`);
    setLinkPackageTarget(null);
  };

  // --------------------------------------------------------------------------
  // Diagnostic Param Add/Edit Handler
  // --------------------------------------------------------------------------
  const handleOpenAddDiagnostic = (modality: DiagnosticModality) => {
    setDiagnosticModal({
      isOpen: true,
      modality,
      item: null,
    });
  };

  const handleOpenEditDiagnostic = (item: DiagnosticExamParam) => {
    setDiagnosticModal({
      isOpen: true,
      modality: item.modalitas,
      item,
    });
  };

  const handleSaveDiagnosticParam = (data: Omit<DiagnosticExamParam, 'id'>) => {
    const { modality, item } = diagnosticModal;
    const isEditing = !!item;

    let targetSetter: React.Dispatch<React.SetStateAction<DiagnosticExamParam[]>>;
    let targetKey: string;
    let currentList: DiagnosticExamParam[];

    switch (modality) {
      case 'rontgen':
        targetSetter = setRontgenList;
        targetKey = 'simreg_rontgen_params';
        currentList = rontgenList;
        break;
      case 'ekg':
        targetSetter = setEkgList;
        targetKey = 'simreg_ekg_params';
        currentList = ekgList;
        break;
      case 'audio':
        targetSetter = setAudioList;
        targetKey = 'simreg_audio_params';
        currentList = audioList;
        break;
      case 'spiro':
        targetSetter = setSpiroList;
        targetKey = 'simreg_spiro_params';
        currentList = spiroList;
        break;
      case 'penunjang':
      default:
        targetSetter = setPenunjangList;
        targetKey = 'simreg_penunjang_params';
        currentList = penunjangList;
        break;
    }

    let updatedList: DiagnosticExamParam[];
    if (isEditing && item) {
      updatedList = currentList.map((p) =>
        p.id === item.id ? { ...p, ...data, id: item.id } : p
      );
      onNotify(`Parameter [${data.nama}] berhasil diperbarui.`);
    } else {
      const newParam: DiagnosticExamParam = {
        id: `param-${modality}-${Date.now()}`,
        ...data,
      };
      updatedList = [newParam, ...currentList];
      onNotify(`Parameter [${data.nama}] berhasil ditambahkan.`);
    }

    targetSetter(updatedList);
    localStorage.setItem(targetKey, JSON.stringify(updatedList));
    setDiagnosticModal({ isOpen: false, modality: 'rontgen', item: null });
  };

  // --------------------------------------------------------------------------
  // Physical CRUD Handlers
  // --------------------------------------------------------------------------
  const handleOpenAddPhysical = () => {
    setEditingPhysical(null);
    setPhysicalForm({
      kode: `PF-${String(physicalList.length + 1).padStart(3, '0')}`,
      nama: '',
      kategori: 'Tanda Vital',
      paketCodes: ['ALL'],
      tipeInput: 'text',
      nilaiNormal: '',
      satuan: '',
      pilihanOpsi: [],
      keterangan: '',
      isActive: true,
    });
    setShowPhysicalModal(true);
  };

  const handleOpenEditPhysical = (item: PhysicalExamParam) => {
    setEditingPhysical(item);
    setPhysicalForm({
      kode: item.kode,
      nama: item.nama,
      kategori: item.kategori,
      paketCodes: item.paketCodes && item.paketCodes.length > 0 ? item.paketCodes : ['ALL'],
      tipeInput: item.tipeInput,
      nilaiNormal: item.nilaiNormal,
      satuan: item.satuan || '',
      pilihanOpsi: item.pilihanOpsi || [],
      keterangan: item.keterangan || '',
      isActive: item.isActive,
    });
    setShowPhysicalModal(true);
  };

  const handleSavePhysical = (e: React.FormEvent) => {
    e.preventDefault();
    if (!physicalForm.nama.trim() || !physicalForm.kode.trim()) {
      onNotify('Nama parameter dan kode pemeriksaan wajib diisi.');
      return;
    }

    let updated: PhysicalExamParam[];
    if (editingPhysical) {
      updated = physicalList.map((p) =>
        p.id === editingPhysical.id ? { ...p, ...physicalForm } : p
      );
      onNotify(`Parameter fisik [${physicalForm.nama}] berhasil diperbarui.`);
    } else {
      const newItem: PhysicalExamParam = {
        id: `param-pf-${Date.now()}`,
        ...physicalForm,
      };
      updated = [newItem, ...physicalList];
      onNotify(`Parameter fisik [${physicalForm.nama}] berhasil ditambahkan.`);
    }

    setPhysicalList(updated);
    localStorage.setItem('simreg_physical_params', JSON.stringify(updated));
    if (onUpdatePhysicalParams) onUpdatePhysicalParams(updated);
    setShowPhysicalModal(false);
  };

  // --------------------------------------------------------------------------
  // Lab CRUD Handlers
  // --------------------------------------------------------------------------
  const handleOpenAddLab = () => {
    setEditingLab(null);
    setLabForm({
      kode: `LAB-${String(labList.length + 1).padStart(3, '0')}`,
      nama: '',
      kategori: 'Hematologi',
      subKategori: 'Darah Lengkap',
      paketCodes: ['ALL'],
      nilaiRujukanPria: '',
      nilaiRujukanWanita: '',
      satuan: '',
      metodeTes: 'Automated Analyzer',
      keterangan: '',
      isActive: true,
    });
    setShowLabModal(true);
  };

  const handleOpenEditLab = (item: LabExamParam) => {
    setEditingLab(item);
    setLabForm({
      kode: item.kode,
      nama: item.nama,
      kategori: item.kategori,
      subKategori: item.subKategori || '',
      paketCodes: item.paketCodes && item.paketCodes.length > 0 ? item.paketCodes : ['ALL'],
      nilaiRujukanPria: item.nilaiRujukanPria,
      nilaiRujukanWanita: item.nilaiRujukanWanita,
      satuan: item.satuan,
      metodeTes: item.metodeTes || '',
      keterangan: item.keterangan || '',
      isActive: item.isActive,
    });
    setShowLabModal(true);
  };

  const handleSaveLab = (e: React.FormEvent) => {
    e.preventDefault();
    if (!labForm.nama.trim() || !labForm.kode.trim()) {
      onNotify('Nama parameter lab dan kode pemeriksaan wajib diisi.');
      return;
    }

    let updated: LabExamParam[];
    if (editingLab) {
      updated = labList.map((l) =>
        l.id === editingLab.id ? { ...l, ...labForm } : l
      );
      onNotify(`Parameter lab [${labForm.nama}] berhasil diperbarui.`);
    } else {
      const newItem: LabExamParam = {
        id: `param-lab-${Date.now()}`,
        ...labForm,
      };
      updated = [newItem, ...labList];
      onNotify(`Parameter lab [${labForm.nama}] berhasil ditambahkan.`);
    }

    setLabList(updated);
    localStorage.setItem('simreg_lab_params', JSON.stringify(updated));
    if (onUpdateLabParams) onUpdateLabParams(updated);
    setShowLabModal(false);
  };

  // --------------------------------------------------------------------------
  // Excel Download Helper
  // --------------------------------------------------------------------------
  const handleExportExcel = (type: TabType) => {
    let filename = '';
    let sheetName = '';
    let rows: any[] = [];

    switch (type) {
      case 'fisik':
        filename = 'Master_Parameter_Fisik_MCU.xlsx';
        sheetName = 'Parameter_Fisik';
        rows = physicalList.map((p, idx) => ({
          No: idx + 1,
          'Kode Parameter': p.kode,
          'Nama Parameter': p.nama,
          Kategori: p.kategori,
          'Target Paket': p.paketCodes?.join(', ') || 'ALL',
          'Tipe Input': p.tipeInput,
          'Nilai Normal': p.nilaiNormal,
          Satuan: p.satuan || '',
          Status: p.isActive ? 'Aktif' : 'Nonaktif',
        }));
        break;
      case 'lab':
        filename = 'Master_Parameter_Laboratorium_MCU.xlsx';
        sheetName = 'Parameter_Lab';
        rows = labList.map((l, idx) => ({
          No: idx + 1,
          'Kode Tes': l.kode,
          'Nama Parameter': l.nama,
          Kategori: l.kategori,
          'Sub Kategori': l.subKategori || '',
          'Target Paket': l.paketCodes?.join(', ') || 'ALL',
          'Nilai Rujukan Pria': l.nilaiRujukanPria,
          'Nilai Rujukan Wanita': l.nilaiRujukanWanita,
          Satuan: l.satuan,
          Status: l.isActive ? 'Aktif' : 'Nonaktif',
        }));
        break;
      case 'rontgen':
        filename = 'Master_Parameter_Rontgen_Thorax.xlsx';
        sheetName = 'Parameter_Rontgen';
        rows = rontgenList.map((r, idx) => ({
          No: idx + 1,
          Kode: r.kode,
          'Nama Parameter': r.nama,
          Kategori: r.kategori,
          'Target Paket': r.paketCodes?.join(', ') || 'ALL',
          'Nilai Acuan Normal': r.nilaiNormal,
          Status: r.isActive ? 'Aktif' : 'Nonaktif',
        }));
        break;
      case 'ekg':
        filename = 'Master_Parameter_EKG_Jantung.xlsx';
        sheetName = 'Parameter_EKG';
        rows = ekgList.map((e, idx) => ({
          No: idx + 1,
          Kode: e.kode,
          'Nama Parameter': e.nama,
          Kategori: e.kategori,
          'Target Paket': e.paketCodes?.join(', ') || 'ALL',
          'Nilai Acuan Normal': e.nilaiNormal,
          Satuan: e.satuan || '',
          Status: e.isActive ? 'Aktif' : 'Nonaktif',
        }));
        break;
      case 'audio':
        filename = 'Master_Parameter_Audiometri.xlsx';
        sheetName = 'Parameter_Audio';
        rows = audioList.map((a, idx) => ({
          No: idx + 1,
          Kode: a.kode,
          'Nama Parameter': a.nama,
          Kategori: a.kategori,
          'Target Paket': a.paketCodes?.join(', ') || 'ALL',
          'Nilai Acuan Normal': a.nilaiNormal,
          Satuan: a.satuan || '',
          Status: a.isActive ? 'Aktif' : 'Nonaktif',
        }));
        break;
      case 'spiro':
        filename = 'Master_Parameter_Spirometri.xlsx';
        sheetName = 'Parameter_Spiro';
        rows = spiroList.map((s, idx) => ({
          No: idx + 1,
          Kode: s.kode,
          'Nama Parameter': s.nama,
          Kategori: s.kategori,
          'Target Paket': s.paketCodes?.join(', ') || 'ALL',
          'Nilai Acuan Normal': s.nilaiNormal,
          Satuan: s.satuan || '',
          Status: s.isActive ? 'Aktif' : 'Nonaktif',
        }));
        break;
      case 'penunjang':
        filename = 'Master_Parameter_Penunjang_Lain.xlsx';
        sheetName = 'Parameter_Penunjang';
        rows = penunjangList.map((p, idx) => ({
          No: idx + 1,
          Kode: p.kode,
          'Nama Parameter': p.nama,
          Kategori: p.kategori,
          'Target Paket': p.paketCodes?.join(', ') || 'ALL',
          'Nilai Acuan Normal': p.nilaiNormal,
          Satuan: p.satuan || '',
          Status: p.isActive ? 'Aktif' : 'Nonaktif',
        }));
        break;
    }

    if (rows.length === 0) return;
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, sheetName);
    XLSX.writeFile(wb, filename);
    onNotify(`Berkas Excel ${filename} berhasil diunduh.`);
  };

  // --------------------------------------------------------------------------
  // Filtered Lists
  // --------------------------------------------------------------------------
  const matchPackageCriteria = (codes?: string[]) => {
    if (filterPackageCode === 'ALL') return true;
    if (!codes || codes.length === 0) return true;
    return codes.includes('ALL') || codes.includes(filterPackageCode);
  };

  const filteredPhysical = useMemo(() => {
    return physicalList.filter((p) => {
      const matchSearch =
        p.nama.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.kode.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.nilaiNormal.toLowerCase().includes(searchQuery.toLowerCase());
      const matchCat = categoryFilter === 'ALL' || p.kategori === categoryFilter;
      const matchPkg = matchPackageCriteria(p.paketCodes);
      return matchSearch && matchCat && matchPkg;
    });
  }, [physicalList, searchQuery, categoryFilter, filterPackageCode]);

  const filteredLab = useMemo(() => {
    return labList.filter((l) => {
      const matchSearch =
        l.nama.toLowerCase().includes(searchQuery.toLowerCase()) ||
        l.kode.toLowerCase().includes(searchQuery.toLowerCase()) ||
        l.nilaiRujukanPria.toLowerCase().includes(searchQuery.toLowerCase()) ||
        l.satuan.toLowerCase().includes(searchQuery.toLowerCase());
      const matchCat = categoryFilter === 'ALL' || l.kategori === categoryFilter;
      const matchPkg = matchPackageCriteria(l.paketCodes);
      return matchSearch && matchCat && matchPkg;
    });
  }, [labList, searchQuery, categoryFilter, filterPackageCode]);

  const filteredRontgen = useMemo(() => {
    return rontgenList.filter((r) => {
      const matchSearch =
        r.nama.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.kode.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.nilaiNormal.toLowerCase().includes(searchQuery.toLowerCase());
      const matchCat = categoryFilter === 'ALL' || r.kategori === categoryFilter;
      const matchPkg = matchPackageCriteria(r.paketCodes);
      return matchSearch && matchCat && matchPkg;
    });
  }, [rontgenList, searchQuery, categoryFilter, filterPackageCode]);

  const filteredEkg = useMemo(() => {
    return ekgList.filter((e) => {
      const matchSearch =
        e.nama.toLowerCase().includes(searchQuery.toLowerCase()) ||
        e.kode.toLowerCase().includes(searchQuery.toLowerCase()) ||
        e.nilaiNormal.toLowerCase().includes(searchQuery.toLowerCase());
      const matchCat = categoryFilter === 'ALL' || e.kategori === categoryFilter;
      const matchPkg = matchPackageCriteria(e.paketCodes);
      return matchSearch && matchCat && matchPkg;
    });
  }, [ekgList, searchQuery, categoryFilter, filterPackageCode]);

  const filteredAudio = useMemo(() => {
    return audioList.filter((a) => {
      const matchSearch =
        a.nama.toLowerCase().includes(searchQuery.toLowerCase()) ||
        a.kode.toLowerCase().includes(searchQuery.toLowerCase()) ||
        a.nilaiNormal.toLowerCase().includes(searchQuery.toLowerCase());
      const matchCat = categoryFilter === 'ALL' || a.kategori === categoryFilter;
      const matchPkg = matchPackageCriteria(a.paketCodes);
      return matchSearch && matchCat && matchPkg;
    });
  }, [audioList, searchQuery, categoryFilter, filterPackageCode]);

  const filteredSpiro = useMemo(() => {
    return spiroList.filter((s) => {
      const matchSearch =
        s.nama.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.kode.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.nilaiNormal.toLowerCase().includes(searchQuery.toLowerCase());
      const matchCat = categoryFilter === 'ALL' || s.kategori === categoryFilter;
      const matchPkg = matchPackageCriteria(s.paketCodes);
      return matchSearch && matchCat && matchPkg;
    });
  }, [spiroList, searchQuery, categoryFilter, filterPackageCode]);

  const filteredPenunjang = useMemo(() => {
    return penunjangList.filter((p) => {
      const matchSearch =
        p.nama.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.kode.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.nilaiNormal.toLowerCase().includes(searchQuery.toLowerCase());
      const matchCat = categoryFilter === 'ALL' || p.kategori === categoryFilter;
      const matchPkg = matchPackageCriteria(p.paketCodes);
      return matchSearch && matchCat && matchPkg;
    });
  }, [penunjangList, searchQuery, categoryFilter, filterPackageCode]);

  // --------------------------------------------------------------------------
  // Package Standardization Toggle Checkbox
  // --------------------------------------------------------------------------
  const toggleParamInPackage = (
    modality: 'fisik' | 'lab' | 'rontgen' | 'ekg' | 'audio' | 'spiro' | 'penunjang',
    paramId: string
  ) => {
    const pkg = selectedPackage;

    const updateCodes = (codes: string[] = []) => {
      if (codes.includes(pkg)) {
        return codes.filter((c) => c !== pkg);
      } else {
        return [...codes, pkg];
      }
    };

    switch (modality) {
      case 'fisik': {
        const updated = physicalList.map((p) =>
          p.id === paramId ? { ...p, paketCodes: updateCodes(p.paketCodes) } : p
        );
        setPhysicalList(updated);
        localStorage.setItem('simreg_physical_params', JSON.stringify(updated));
        if (onUpdatePhysicalParams) onUpdatePhysicalParams(updated);
        break;
      }
      case 'lab': {
        const updated = labList.map((l) =>
          l.id === paramId ? { ...l, paketCodes: updateCodes(l.paketCodes) } : l
        );
        setLabList(updated);
        localStorage.setItem('simreg_lab_params', JSON.stringify(updated));
        if (onUpdateLabParams) onUpdateLabParams(updated);
        break;
      }
      case 'rontgen': {
        const updated = rontgenList.map((r) =>
          r.id === paramId ? { ...r, paketCodes: updateCodes(r.paketCodes) } : r
        );
        setRontgenList(updated);
        localStorage.setItem('simreg_rontgen_params', JSON.stringify(updated));
        break;
      }
      case 'ekg': {
        const updated = ekgList.map((e) =>
          e.id === paramId ? { ...e, paketCodes: updateCodes(e.paketCodes) } : e
        );
        setEkgList(updated);
        localStorage.setItem('simreg_ekg_params', JSON.stringify(updated));
        break;
      }
      case 'audio': {
        const updated = audioList.map((a) =>
          a.id === paramId ? { ...a, paketCodes: updateCodes(a.paketCodes) } : a
        );
        setAudioList(updated);
        localStorage.setItem('simreg_audio_params', JSON.stringify(updated));
        break;
      }
      case 'spiro': {
        const updated = spiroList.map((s) =>
          s.id === paramId ? { ...s, paketCodes: updateCodes(s.paketCodes) } : s
        );
        setSpiroList(updated);
        localStorage.setItem('simreg_spiro_params', JSON.stringify(updated));
        break;
      }
      case 'penunjang': {
        const updated = penunjangList.map((p) =>
          p.id === paramId ? { ...p, paketCodes: updateCodes(p.paketCodes) } : p
        );
        setPenunjangList(updated);
        localStorage.setItem('simreg_penunjang_params', JSON.stringify(updated));
        break;
      }
    }
  };

  const toggleSelectAllInPackage = (
    modality: 'fisik' | 'lab' | 'rontgen' | 'ekg' | 'audio' | 'spiro' | 'penunjang',
    selectAll: boolean
  ) => {
    const pkg = selectedPackage;

    const applyToCodes = (codes: string[] = []) => {
      if (selectAll) {
        return codes.includes(pkg) ? codes : [...codes, pkg];
      } else {
        return codes.filter((c) => c !== pkg);
      }
    };

    switch (modality) {
      case 'fisik': {
        const updated = physicalList.map((p) => ({ ...p, paketCodes: applyToCodes(p.paketCodes) }));
        setPhysicalList(updated);
        localStorage.setItem('simreg_physical_params', JSON.stringify(updated));
        if (onUpdatePhysicalParams) onUpdatePhysicalParams(updated);
        break;
      }
      case 'lab': {
        const updated = labList.map((l) => ({ ...l, paketCodes: applyToCodes(l.paketCodes) }));
        setLabList(updated);
        localStorage.setItem('simreg_lab_params', JSON.stringify(updated));
        if (onUpdateLabParams) onUpdateLabParams(updated);
        break;
      }
      case 'rontgen': {
        const updated = rontgenList.map((r) => ({ ...r, paketCodes: applyToCodes(r.paketCodes) }));
        setRontgenList(updated);
        localStorage.setItem('simreg_rontgen_params', JSON.stringify(updated));
        break;
      }
      case 'ekg': {
        const updated = ekgList.map((e) => ({ ...e, paketCodes: applyToCodes(e.paketCodes) }));
        setEkgList(updated);
        localStorage.setItem('simreg_ekg_params', JSON.stringify(updated));
        break;
      }
      case 'audio': {
        const updated = audioList.map((a) => ({ ...a, paketCodes: applyToCodes(a.paketCodes) }));
        setAudioList(updated);
        localStorage.setItem('simreg_audio_params', JSON.stringify(updated));
        break;
      }
      case 'spiro': {
        const updated = spiroList.map((s) => ({ ...s, paketCodes: applyToCodes(s.paketCodes) }));
        setSpiroList(updated);
        localStorage.setItem('simreg_spiro_params', JSON.stringify(updated));
        break;
      }
      case 'penunjang': {
        const updated = penunjangList.map((p) => ({ ...p, paketCodes: applyToCodes(p.paketCodes) }));
        setPenunjangList(updated);
        localStorage.setItem('simreg_penunjang_params', JSON.stringify(updated));
        break;
      }
    }

    onNotify(
      selectAll
        ? `Semua parameter ${modality.toUpperCase()} dihubungkan ke paket ${pkg}.`
        : `Semua parameter ${modality.toUpperCase()} dilepas dari paket ${pkg}.`
    );
  };

  // Helper to render package badges with quick click
  const renderPackageBadges = (
    itemType: DeleteTargetInfo['type'],
    itemId: string,
    itemName: string,
    itemCode: string,
    codes?: string[]
  ) => {
    const list = codes && codes.length > 0 ? codes : ['ALL'];
    return (
      <div className="flex flex-wrap items-center gap-1">
        {list.map((c) => (
          <span
            key={c}
            className={`px-1.5 py-0.5 rounded-md text-[10px] font-bold font-mono ${
              c === 'ALL'
                ? 'bg-teal-100 text-teal-800 border border-teal-200'
                : 'bg-slate-100 text-slate-700 border border-slate-300'
            }`}
          >
            {c}
          </span>
        ))}
        <button
          type="button"
          onClick={() =>
            setLinkPackageTarget({
              paramType: itemType,
              id: itemId,
              name: itemName,
              code: itemCode,
              currentPackages: list,
            })
          }
          className="p-0.5 text-[10px] text-teal-700 hover:text-teal-900 font-bold hover:bg-teal-50 rounded-xs transition-all"
          title="Ubah / Hubungkan Paket MCU"
        >
          <Tag className="w-3 h-3 inline mr-0.5" />
          Pilih
        </button>
      </div>
    );
  };

  return (
    <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden flex flex-col space-y-4 p-4 sm:p-5 md:p-6">
      {/* Header Banner */}
      <div className="border-b border-slate-200 pb-3.5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-teal-600 text-white flex items-center justify-center shadow-xs">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-[19px] font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
                Setting Pemeriksaan
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-teal-100 text-teal-800 font-bold border border-teal-200">
                  Parameter Klinis &amp; Paket MCU
                </span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Konfigurasi acuan klinis, nilai normal laboratorium, rontgen, EKG, audiometri, spirometri, serta standarisasi paket PT.
              </p>
            </div>
          </div>
        </div>

        {/* Tab Selector Nav */}
        <div className="flex flex-wrap items-center p-1 bg-slate-100 rounded-xl border border-slate-200 gap-1">
          <button
            type="button"
            onClick={() => {
              setActiveTab('fisik');
              setCategoryFilter('ALL');
              setSearchQuery('');
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'fisik'
                ? 'bg-white text-teal-800 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            Fisik ({physicalList.length})
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('lab');
              setCategoryFilter('ALL');
              setSearchQuery('');
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'lab'
                ? 'bg-white text-teal-800 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <FlaskConical className="w-3.5 h-3.5" />
            Lab ({labList.length})
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('rontgen');
              setCategoryFilter('ALL');
              setSearchQuery('');
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'rontgen'
                ? 'bg-white text-teal-800 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Radio className="w-3.5 h-3.5" />
            Rontgen ({rontgenList.length})
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('ekg');
              setCategoryFilter('ALL');
              setSearchQuery('');
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'ekg'
                ? 'bg-white text-teal-800 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <HeartPulse className="w-3.5 h-3.5" />
            EKG ({ekgList.length})
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('audio');
              setCategoryFilter('ALL');
              setSearchQuery('');
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'audio'
                ? 'bg-white text-teal-800 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Volume2 className="w-3.5 h-3.5" />
            Audio ({audioList.length})
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('spiro');
              setCategoryFilter('ALL');
              setSearchQuery('');
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'spiro'
                ? 'bg-white text-teal-800 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Wind className="w-3.5 h-3.5" />
            Spiro ({spiroList.length})
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('penunjang');
              setCategoryFilter('ALL');
              setSearchQuery('');
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'penunjang'
                ? 'bg-white text-teal-800 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Stethoscope className="w-3.5 h-3.5" />
            Penunjang ({penunjangList.length})
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('paket');
              setSearchQuery('');
            }}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'paket'
                ? 'bg-teal-700 text-white shadow-xs'
                : 'text-teal-800 hover:text-teal-950 hover:bg-white/60'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            Standarisasi Paket PT
          </button>
        </div>
      </div>

      {/* Global Filter Bar (when not in Paket tab) */}
      {activeTab !== 'paket' && (
        <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <Tag className="w-3.5 h-3.5 text-teal-700" />
              <span className="text-xs font-bold text-slate-700">Filter Target Paket:</span>
              <select
                id="filter-target-paket-select"
                value={filterPackageCode}
                onChange={(e) => handleSelectPackage(e.target.value)}
                className="px-2.5 py-1 bg-white border-2 border-teal-400 rounded-lg text-xs font-bold text-teal-900 shadow-2xs focus:ring-2 focus:ring-teal-500 cursor-pointer"
              >
                <option value="ALL">Semua Paket MCU (Global / ALL)</option>
                {packageList.map((pkg) => {
                  const pkgCode = pkg.kode || (pkg as any).code || '';
                  const pkgName = pkg.nama || (pkg as any).name || '';
                  const pkgComp = pkg.perusahaan ? ` [${pkg.perusahaan}]` : '';
                  return (
                    <option key={pkg.id || pkgCode} value={pkgCode}>
                      {pkgCode} - {pkgName}{pkgComp}
                    </option>
                  );
                })}
              </select>

              {onNavigateToSettingPaket && (
                <button
                  type="button"
                  onClick={onNavigateToSettingPaket}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200 text-xs font-bold transition-all shadow-2xs cursor-pointer"
                  title="Buka Setting Paket MCU untuk menambah / mengedit paket"
                >
                  <Package className="w-3.5 h-3.5 text-teal-700" />
                  Setting Paket MCU
                  <ChevronRight className="w-3 h-3 text-teal-700" />
                </button>
              )}

              <span className="text-[11px] font-bold text-teal-700 bg-teal-50 px-2.5 py-0.5 rounded-full border border-teal-200">
                {packageList.length} Paket Terkoneksi
              </span>
            </div>

            <div className="flex items-center gap-2">
              <Filter className="w-3.5 h-3.5 text-slate-500" />
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="px-2.5 py-1 bg-white border border-slate-300 rounded-lg text-xs font-semibold text-slate-800 shadow-2xs"
              >
                <option value="ALL">Semua Kategori</option>
                {activeTab === 'fisik' &&
                  PHYSICAL_CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                {activeTab === 'lab' &&
                  LAB_CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                {activeTab === 'rontgen' &&
                  RONTGEN_CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                {activeTab === 'ekg' &&
                  EKG_CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                {activeTab === 'audio' &&
                  AUDIO_CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                {activeTab === 'spiro' &&
                  SPIRO_CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                {activeTab === 'penunjang' &&
                  PENUNJANG_CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
              </select>
            </div>
          </div>

          <div className="relative min-w-[220px]">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari parameter, kode, nilai rujukan..."
              className="w-full pl-8 pr-3 py-1 bg-white border border-slate-300 rounded-lg text-xs font-medium placeholder:text-slate-400 focus:outline-hidden focus:ring-1 focus:ring-teal-500"
            />
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 1: PARAMETER FISIK                                                    */}
      {/* ========================================================================= */}
      {activeTab === 'fisik' && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-teal-700" />
              <h3 className="text-sm font-extrabold text-slate-800">
                Daftar Parameter Fisik Head-to-Toe &amp; Tanda Vital
              </h3>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => handleExportExcel('fisik')}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold shadow-xs transition-all"
              >
                <Download className="w-3.5 h-3.5 text-teal-600" />
                Download Excel
              </button>
              <button
                type="button"
                onClick={() => setShowImportPhysicalModal(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-teal-300 bg-teal-50 hover:bg-teal-100 text-teal-800 text-xs font-bold shadow-xs transition-all"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-teal-700" />
                Import Excel
              </button>
              <button
                type="button"
                onClick={handleOpenAddPhysical}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-teal-700 hover:bg-teal-800 text-white text-xs font-bold shadow-xs transition-all"
              >
                <Plus className="w-4 h-4" />
                Tambah Parameter Fisik
              </button>
            </div>
          </div>

          {/* Physical Table */}
          <div className="border border-slate-200 rounded-xl overflow-x-auto shadow-2xs">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100/80 border-b border-slate-200 text-slate-700 font-extrabold">
                <tr>
                  <th className="py-3 px-3 w-12 text-center">No</th>
                  <th className="py-3 px-3 w-24">Kode</th>
                  <th className="py-3 px-4">Nama Parameter</th>
                  <th className="py-3 px-3">Kategori</th>
                  <th className="py-3 px-3">Target Paket</th>
                  <th className="py-3 px-3">Tipe Input</th>
                  <th className="py-3 px-4">Nilai Normal</th>
                  <th className="py-3 px-2 text-center">Status</th>
                  <th className="py-3 px-3 text-center w-28">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-slate-800 font-medium">
                {filteredPhysical.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-8 text-center text-slate-400 font-medium">
                      Tidak ada parameter fisik yang cocok dengan kriteria pencarian.
                    </td>
                  </tr>
                ) : (
                  filteredPhysical.map((p, idx) => (
                    <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-2.5 px-3 text-center text-slate-500">{idx + 1}</td>
                      <td className="py-2.5 px-3 font-mono font-bold text-teal-900">{p.kode}</td>
                      <td className="py-2.5 px-4 font-bold text-slate-900">{p.nama}</td>
                      <td className="py-2.5 px-3">
                        <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[11px] font-semibold border border-slate-200">
                          {p.kategori}
                        </span>
                      </td>
                      <td className="py-2.5 px-3">
                        {renderPackageBadges('fisik', p.id, p.nama, p.kode, p.paketCodes)}
                      </td>
                      <td className="py-2.5 px-3 capitalize text-slate-600">{p.tipeInput}</td>
                      <td className="py-2.5 px-4 font-semibold text-slate-700">
                        {p.nilaiNormal} {p.satuan ? `(${p.satuan})` : ''}
                      </td>
                      <td className="py-2.5 px-2 text-center">
                        <button
                          type="button"
                          onClick={() => {
                            const updated = physicalList.map((item) =>
                              item.id === p.id ? { ...item, isActive: !item.isActive } : item
                            );
                            setPhysicalList(updated);
                            localStorage.setItem('simreg_physical_params', JSON.stringify(updated));
                            if (onUpdatePhysicalParams) onUpdatePhysicalParams(updated);
                          }}
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold transition-all ${
                            p.isActive
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                              : 'bg-slate-100 text-slate-500 border border-slate-200'
                          }`}
                        >
                          {p.isActive ? 'Aktif' : 'Nonaktif'}
                        </button>
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleOpenEditPhysical(p)}
                            className="p-1.5 text-slate-600 hover:text-teal-700 hover:bg-teal-50 rounded-lg transition-all"
                            title="Edit Parameter"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => openDeleteConfirm('fisik', p.id, p.nama, p.kode)}
                            className="p-1.5 text-slate-600 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
                            title="Hapus Parameter"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: PARAMETER LABORATORIUM                                            */}
      {/* ========================================================================= */}
      {activeTab === 'lab' && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <FlaskConical className="w-4 h-4 text-teal-700" />
              <h3 className="text-sm font-extrabold text-slate-800">
                Daftar Parameter Laboratorium Klinis &amp; Skrining Toksikologi
              </h3>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => handleExportExcel('lab')}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold shadow-xs transition-all"
              >
                <Download className="w-3.5 h-3.5 text-teal-600" />
                Download Excel
              </button>
              <button
                type="button"
                onClick={() => setShowImportLabModal(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-teal-300 bg-teal-50 hover:bg-teal-100 text-teal-800 text-xs font-bold shadow-xs transition-all"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-teal-700" />
                Import Excel
              </button>
              <button
                type="button"
                onClick={handleOpenAddLab}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-teal-700 hover:bg-teal-800 text-white text-xs font-bold shadow-xs transition-all"
              >
                <Plus className="w-4 h-4" />
                Tambah Parameter Lab
              </button>
            </div>
          </div>

          {/* Lab Table */}
          <div className="border border-slate-200 rounded-xl overflow-x-auto shadow-2xs">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100/80 border-b border-slate-200 text-slate-700 font-extrabold">
                <tr>
                  <th className="py-3 px-3 w-12 text-center">No</th>
                  <th className="py-3 px-3 w-24">Kode</th>
                  <th className="py-3 px-4">Nama Pemeriksaan Lab</th>
                  <th className="py-3 px-3">Kategori</th>
                  <th className="py-3 px-3">Target Paket</th>
                  <th className="py-3 px-3">Rujukan Pria</th>
                  <th className="py-3 px-3">Rujukan Wanita</th>
                  <th className="py-3 px-2">Satuan</th>
                  <th className="py-3 px-2 text-center">Status</th>
                  <th className="py-3 px-3 text-center w-28">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-slate-800 font-medium">
                {filteredLab.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="py-8 text-center text-slate-400 font-medium">
                      Tidak ada parameter lab yang cocok dengan kriteria pencarian.
                    </td>
                  </tr>
                ) : (
                  filteredLab.map((l, idx) => (
                    <tr key={l.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-2.5 px-3 text-center text-slate-500">{idx + 1}</td>
                      <td className="py-2.5 px-3 font-mono font-bold text-teal-900">{l.kode}</td>
                      <td className="py-2.5 px-4 font-bold text-slate-900">
                        {l.nama}
                        {l.subKategori && (
                          <span className="block text-[10px] text-slate-500 font-normal">
                            {l.subKategori}
                          </span>
                        )}
                      </td>
                      <td className="py-2.5 px-3">
                        <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[11px] font-semibold border border-slate-200">
                          {l.kategori}
                        </span>
                      </td>
                      <td className="py-2.5 px-3">
                        {renderPackageBadges('lab', l.id, l.nama, l.kode, l.paketCodes)}
                      </td>
                      <td className="py-2.5 px-3 text-slate-700 font-semibold">{l.nilaiRujukanPria}</td>
                      <td className="py-2.5 px-3 text-slate-700 font-semibold">{l.nilaiRujukanWanita}</td>
                      <td className="py-2.5 px-2 text-slate-500 font-mono">{l.satuan}</td>
                      <td className="py-2.5 px-2 text-center">
                        <button
                          type="button"
                          onClick={() => {
                            const updated = labList.map((item) =>
                              item.id === l.id ? { ...item, isActive: !item.isActive } : item
                            );
                            setLabList(updated);
                            localStorage.setItem('simreg_lab_params', JSON.stringify(updated));
                            if (onUpdateLabParams) onUpdateLabParams(updated);
                          }}
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold transition-all ${
                            l.isActive
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                              : 'bg-slate-100 text-slate-500 border border-slate-200'
                          }`}
                        >
                          {l.isActive ? 'Aktif' : 'Nonaktif'}
                        </button>
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleOpenEditLab(l)}
                            className="p-1.5 text-slate-600 hover:text-teal-700 hover:bg-teal-50 rounded-lg transition-all"
                            title="Edit Parameter"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => openDeleteConfirm('lab', l.id, l.nama, l.kode)}
                            className="p-1.5 text-slate-600 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
                            title="Hapus Parameter"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: PARAMETER RONTGEN (THORAX)                                         */}
      {/* ========================================================================= */}
      {activeTab === 'rontgen' && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Radio className="w-4 h-4 text-teal-700" />
              <h3 className="text-sm font-extrabold text-slate-800">
                Daftar Parameter Rontgen Thorax (Foto Rontgen Dada)
              </h3>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => handleExportExcel('rontgen')}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold shadow-xs transition-all"
              >
                <Download className="w-3.5 h-3.5 text-teal-600" />
                Download Excel
              </button>
              <button
                type="button"
                onClick={() => handleOpenAddDiagnostic('rontgen')}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-teal-700 hover:bg-teal-800 text-white text-xs font-bold shadow-xs transition-all"
              >
                <Plus className="w-4 h-4" />
                Tambah Parameter Rontgen
              </button>
            </div>
          </div>

          {/* Rontgen Table */}
          <div className="border border-slate-200 rounded-xl overflow-x-auto shadow-2xs">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100/80 border-b border-slate-200 text-slate-700 font-extrabold">
                <tr>
                  <th className="py-3 px-3 w-12 text-center">No</th>
                  <th className="py-3 px-3 w-24">Kode</th>
                  <th className="py-3 px-4">Nama Parameter Rontgen</th>
                  <th className="py-3 px-3">Kategori</th>
                  <th className="py-3 px-3">Target Paket</th>
                  <th className="py-3 px-4">Nilai Acuan Normal</th>
                  <th className="py-3 px-2 text-center">Status</th>
                  <th className="py-3 px-3 text-center w-28">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-slate-800 font-medium">
                {filteredRontgen.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-slate-400 font-medium">
                      Tidak ada parameter rontgen yang cocok dengan kriteria pencarian.
                    </td>
                  </tr>
                ) : (
                  filteredRontgen.map((r, idx) => (
                    <tr key={r.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-2.5 px-3 text-center text-slate-500">{idx + 1}</td>
                      <td className="py-2.5 px-3 font-mono font-bold text-teal-900">{r.kode}</td>
                      <td className="py-2.5 px-4 font-bold text-slate-900">{r.nama}</td>
                      <td className="py-2.5 px-3">
                        <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[11px] font-semibold border border-slate-200">
                          {r.kategori}
                        </span>
                      </td>
                      <td className="py-2.5 px-3">
                        {renderPackageBadges('rontgen', r.id, r.nama, r.kode, r.paketCodes)}
                      </td>
                      <td className="py-2.5 px-4 font-semibold text-slate-700">{r.nilaiNormal}</td>
                      <td className="py-2.5 px-2 text-center">
                        <button
                          type="button"
                          onClick={() => {
                            const updated = rontgenList.map((item) =>
                              item.id === r.id ? { ...item, isActive: !item.isActive } : item
                            );
                            setRontgenList(updated);
                            localStorage.setItem('simreg_rontgen_params', JSON.stringify(updated));
                          }}
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold transition-all ${
                            r.isActive
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                              : 'bg-slate-100 text-slate-500 border border-slate-200'
                          }`}
                        >
                          {r.isActive ? 'Aktif' : 'Nonaktif'}
                        </button>
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleOpenEditDiagnostic(r)}
                            className="p-1.5 text-slate-600 hover:text-teal-700 hover:bg-teal-50 rounded-lg transition-all"
                            title="Edit Parameter"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => openDeleteConfirm('rontgen', r.id, r.nama, r.kode)}
                            className="p-1.5 text-slate-600 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
                            title="Hapus Parameter"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: PARAMETER EKG (JANTUNG)                                            */}
      {/* ========================================================================= */}
      {activeTab === 'ekg' && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <HeartPulse className="w-4 h-4 text-teal-700" />
              <h3 className="text-sm font-extrabold text-slate-800">
                Daftar Parameter Elektrokardiogram (EKG 12-Lead)
              </h3>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => handleExportExcel('ekg')}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold shadow-xs transition-all"
              >
                <Download className="w-3.5 h-3.5 text-teal-600" />
                Download Excel
              </button>
              <button
                type="button"
                onClick={() => handleOpenAddDiagnostic('ekg')}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-teal-700 hover:bg-teal-800 text-white text-xs font-bold shadow-xs transition-all"
              >
                <Plus className="w-4 h-4" />
                Tambah Parameter EKG
              </button>
            </div>
          </div>

          {/* EKG Table */}
          <div className="border border-slate-200 rounded-xl overflow-x-auto shadow-2xs">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100/80 border-b border-slate-200 text-slate-700 font-extrabold">
                <tr>
                  <th className="py-3 px-3 w-12 text-center">No</th>
                  <th className="py-3 px-3 w-24">Kode</th>
                  <th className="py-3 px-4">Nama Parameter EKG</th>
                  <th className="py-3 px-3">Kategori</th>
                  <th className="py-3 px-3">Target Paket</th>
                  <th className="py-3 px-4">Nilai Acuan Normal</th>
                  <th className="py-3 px-2">Satuan</th>
                  <th className="py-3 px-2 text-center">Status</th>
                  <th className="py-3 px-3 text-center w-28">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-slate-800 font-medium">
                {filteredEkg.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-8 text-center text-slate-400 font-medium">
                      Tidak ada parameter EKG yang cocok dengan kriteria pencarian.
                    </td>
                  </tr>
                ) : (
                  filteredEkg.map((e, idx) => (
                    <tr key={e.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-2.5 px-3 text-center text-slate-500">{idx + 1}</td>
                      <td className="py-2.5 px-3 font-mono font-bold text-teal-900">{e.kode}</td>
                      <td className="py-2.5 px-4 font-bold text-slate-900">{e.nama}</td>
                      <td className="py-2.5 px-3">
                        <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[11px] font-semibold border border-slate-200">
                          {e.kategori}
                        </span>
                      </td>
                      <td className="py-2.5 px-3">
                        {renderPackageBadges('ekg', e.id, e.nama, e.kode, e.paketCodes)}
                      </td>
                      <td className="py-2.5 px-4 font-semibold text-slate-700">{e.nilaiNormal}</td>
                      <td className="py-2.5 px-2 text-slate-500 font-mono">{e.satuan || '-'}</td>
                      <td className="py-2.5 px-2 text-center">
                        <button
                          type="button"
                          onClick={() => {
                            const updated = ekgList.map((item) =>
                              item.id === e.id ? { ...item, isActive: !item.isActive } : item
                            );
                            setEkgList(updated);
                            localStorage.setItem('simreg_ekg_params', JSON.stringify(updated));
                          }}
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold transition-all ${
                            e.isActive
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                              : 'bg-slate-100 text-slate-500 border border-slate-200'
                          }`}
                        >
                          {e.isActive ? 'Aktif' : 'Nonaktif'}
                        </button>
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleOpenEditDiagnostic(e)}
                            className="p-1.5 text-slate-600 hover:text-teal-700 hover:bg-teal-50 rounded-lg transition-all"
                            title="Edit Parameter"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => openDeleteConfirm('ekg', e.id, e.nama, e.kode)}
                            className="p-1.5 text-slate-600 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
                            title="Hapus Parameter"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 5: PARAMETER AUDIOMETRI (AUDIO)                                       */}
      {/* ========================================================================= */}
      {activeTab === 'audio' && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Volume2 className="w-4 h-4 text-teal-700" />
              <h3 className="text-sm font-extrabold text-slate-800">
                Daftar Parameter Audiometri &amp; Skrining Kebisingan Kerja (NIHL)
              </h3>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => handleExportExcel('audio')}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold shadow-xs transition-all"
              >
                <Download className="w-3.5 h-3.5 text-teal-600" />
                Download Excel
              </button>
              <button
                type="button"
                onClick={() => handleOpenAddDiagnostic('audio')}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-teal-700 hover:bg-teal-800 text-white text-xs font-bold shadow-xs transition-all"
              >
                <Plus className="w-4 h-4" />
                Tambah Parameter Audiometri
              </button>
            </div>
          </div>

          {/* Audio Table */}
          <div className="border border-slate-200 rounded-xl overflow-x-auto shadow-2xs">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100/80 border-b border-slate-200 text-slate-700 font-extrabold">
                <tr>
                  <th className="py-3 px-3 w-12 text-center">No</th>
                  <th className="py-3 px-3 w-24">Kode</th>
                  <th className="py-3 px-4">Nama Parameter Audiometri</th>
                  <th className="py-3 px-3">Kategori</th>
                  <th className="py-3 px-3">Target Paket</th>
                  <th className="py-3 px-4">Nilai Acuan Normal</th>
                  <th className="py-3 px-2">Satuan</th>
                  <th className="py-3 px-2 text-center">Status</th>
                  <th className="py-3 px-3 text-center w-28">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-slate-800 font-medium">
                {filteredAudio.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-8 text-center text-slate-400 font-medium">
                      Tidak ada parameter audiometri yang cocok dengan kriteria pencarian.
                    </td>
                  </tr>
                ) : (
                  filteredAudio.map((a, idx) => (
                    <tr key={a.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-2.5 px-3 text-center text-slate-500">{idx + 1}</td>
                      <td className="py-2.5 px-3 font-mono font-bold text-teal-900">{a.kode}</td>
                      <td className="py-2.5 px-4 font-bold text-slate-900">{a.nama}</td>
                      <td className="py-2.5 px-3">
                        <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[11px] font-semibold border border-slate-200">
                          {a.kategori}
                        </span>
                      </td>
                      <td className="py-2.5 px-3">
                        {renderPackageBadges('audio', a.id, a.nama, a.kode, a.paketCodes)}
                      </td>
                      <td className="py-2.5 px-4 font-semibold text-slate-700">{a.nilaiNormal}</td>
                      <td className="py-2.5 px-2 text-slate-500 font-mono">{a.satuan || 'dB'}</td>
                      <td className="py-2.5 px-2 text-center">
                        <button
                          type="button"
                          onClick={() => {
                            const updated = audioList.map((item) =>
                              item.id === a.id ? { ...item, isActive: !item.isActive } : item
                            );
                            setAudioList(updated);
                            localStorage.setItem('simreg_audio_params', JSON.stringify(updated));
                          }}
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold transition-all ${
                            a.isActive
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                              : 'bg-slate-100 text-slate-500 border border-slate-200'
                          }`}
                        >
                          {a.isActive ? 'Aktif' : 'Nonaktif'}
                        </button>
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleOpenEditDiagnostic(a)}
                            className="p-1.5 text-slate-600 hover:text-teal-700 hover:bg-teal-50 rounded-lg transition-all"
                            title="Edit Parameter"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => openDeleteConfirm('audio', a.id, a.nama, a.kode)}
                            className="p-1.5 text-slate-600 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
                            title="Hapus Parameter"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 6: PARAMETER SPIROMETRI (SPIRO)                                       */}
      {/* ========================================================================= */}
      {activeTab === 'spiro' && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Wind className="w-4 h-4 text-teal-700" />
              <h3 className="text-sm font-extrabold text-slate-800">
                Daftar Parameter Spirometri &amp; Faal Paru Okupasi (ATS/GOLD)
              </h3>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => handleExportExcel('spiro')}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold shadow-xs transition-all"
              >
                <Download className="w-3.5 h-3.5 text-teal-600" />
                Download Excel
              </button>
              <button
                type="button"
                onClick={() => handleOpenAddDiagnostic('spiro')}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-teal-700 hover:bg-teal-800 text-white text-xs font-bold shadow-xs transition-all"
              >
                <Plus className="w-4 h-4" />
                Tambah Parameter Spirometri
              </button>
            </div>
          </div>

          {/* Spiro Table */}
          <div className="border border-slate-200 rounded-xl overflow-x-auto shadow-2xs">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100/80 border-b border-slate-200 text-slate-700 font-extrabold">
                <tr>
                  <th className="py-3 px-3 w-12 text-center">No</th>
                  <th className="py-3 px-3 w-24">Kode</th>
                  <th className="py-3 px-4">Nama Parameter Faal Paru</th>
                  <th className="py-3 px-3">Kategori</th>
                  <th className="py-3 px-3">Target Paket</th>
                  <th className="py-3 px-4">Nilai Acuan Normal</th>
                  <th className="py-3 px-2">Satuan</th>
                  <th className="py-3 px-2 text-center">Status</th>
                  <th className="py-3 px-3 text-center w-28">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-slate-800 font-medium">
                {filteredSpiro.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-8 text-center text-slate-400 font-medium">
                      Tidak ada parameter spirometri yang cocok dengan kriteria pencarian.
                    </td>
                  </tr>
                ) : (
                  filteredSpiro.map((s, idx) => (
                    <tr key={s.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-2.5 px-3 text-center text-slate-500">{idx + 1}</td>
                      <td className="py-2.5 px-3 font-mono font-bold text-teal-900">{s.kode}</td>
                      <td className="py-2.5 px-4 font-bold text-slate-900">{s.nama}</td>
                      <td className="py-2.5 px-3">
                        <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[11px] font-semibold border border-slate-200">
                          {s.kategori}
                        </span>
                      </td>
                      <td className="py-2.5 px-3">
                        {renderPackageBadges('spiro', s.id, s.nama, s.kode, s.paketCodes)}
                      </td>
                      <td className="py-2.5 px-4 font-semibold text-slate-700">{s.nilaiNormal}</td>
                      <td className="py-2.5 px-2 text-slate-500 font-mono">{s.satuan || '%'}</td>
                      <td className="py-2.5 px-2 text-center">
                        <button
                          type="button"
                          onClick={() => {
                            const updated = spiroList.map((item) =>
                              item.id === s.id ? { ...item, isActive: !item.isActive } : item
                            );
                            setSpiroList(updated);
                            localStorage.setItem('simreg_spiro_params', JSON.stringify(updated));
                          }}
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold transition-all ${
                            s.isActive
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                              : 'bg-slate-100 text-slate-500 border border-slate-200'
                          }`}
                        >
                          {s.isActive ? 'Aktif' : 'Nonaktif'}
                        </button>
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleOpenEditDiagnostic(s)}
                            className="p-1.5 text-slate-600 hover:text-teal-700 hover:bg-teal-50 rounded-lg transition-all"
                            title="Edit Parameter"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => openDeleteConfirm('spiro', s.id, s.nama, s.kode)}
                            className="p-1.5 text-slate-600 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
                            title="Hapus Parameter"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 7: PARAMETER PENUNJANG LAIN (TREADMILL, USG, DLL)                     */}
      {/* ========================================================================= */}
      {activeTab === 'penunjang' && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Stethoscope className="w-4 h-4 text-teal-700" />
              <h3 className="text-sm font-extrabold text-slate-800">
                Daftar Parameter Penunjang Diagnostik (Treadmill Test, USG Abdomen, dll)
              </h3>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => handleExportExcel('penunjang')}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold shadow-xs transition-all"
              >
                <Download className="w-3.5 h-3.5 text-teal-600" />
                Download Excel
              </button>
              <button
                type="button"
                onClick={() => handleOpenAddDiagnostic('penunjang')}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-teal-700 hover:bg-teal-800 text-white text-xs font-bold shadow-xs transition-all"
              >
                <Plus className="w-4 h-4" />
                Tambah Parameter Penunjang
              </button>
            </div>
          </div>

          {/* Penunjang Table */}
          <div className="border border-slate-200 rounded-xl overflow-x-auto shadow-2xs">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100/80 border-b border-slate-200 text-slate-700 font-extrabold">
                <tr>
                  <th className="py-3 px-3 w-12 text-center">No</th>
                  <th className="py-3 px-3 w-24">Kode</th>
                  <th className="py-3 px-4">Nama Parameter</th>
                  <th className="py-3 px-3">Kategori</th>
                  <th className="py-3 px-3">Target Paket</th>
                  <th className="py-3 px-4">Nilai Acuan Normal</th>
                  <th className="py-3 px-2">Satuan</th>
                  <th className="py-3 px-2 text-center">Status</th>
                  <th className="py-3 px-3 text-center w-28">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-slate-800 font-medium">
                {filteredPenunjang.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-8 text-center text-slate-400 font-medium">
                      Tidak ada parameter penunjang yang cocok dengan kriteria pencarian.
                    </td>
                  </tr>
                ) : (
                  filteredPenunjang.map((p, idx) => (
                    <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-2.5 px-3 text-center text-slate-500">{idx + 1}</td>
                      <td className="py-2.5 px-3 font-mono font-bold text-teal-900">{p.kode}</td>
                      <td className="py-2.5 px-4 font-bold text-slate-900">{p.nama}</td>
                      <td className="py-2.5 px-3">
                        <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[11px] font-semibold border border-slate-200">
                          {p.kategori}
                        </span>
                      </td>
                      <td className="py-2.5 px-3">
                        {renderPackageBadges('penunjang', p.id, p.nama, p.kode, p.paketCodes)}
                      </td>
                      <td className="py-2.5 px-4 font-semibold text-slate-700">{p.nilaiNormal}</td>
                      <td className="py-2.5 px-2 text-slate-500 font-mono">{p.satuan || '-'}</td>
                      <td className="py-2.5 px-2 text-center">
                        <button
                          type="button"
                          onClick={() => {
                            const updated = penunjangList.map((item) =>
                              item.id === p.id ? { ...item, isActive: !item.isActive } : item
                            );
                            setPenunjangList(updated);
                            localStorage.setItem('simreg_penunjang_params', JSON.stringify(updated));
                          }}
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold transition-all ${
                            p.isActive
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                              : 'bg-slate-100 text-slate-500 border border-slate-200'
                          }`}
                        >
                          {p.isActive ? 'Aktif' : 'Nonaktif'}
                        </button>
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleOpenEditDiagnostic(p)}
                            className="p-1.5 text-slate-600 hover:text-teal-700 hover:bg-teal-50 rounded-lg transition-all"
                            title="Edit Parameter"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => openDeleteConfirm('penunjang', p.id, p.nama, p.kode)}
                            className="p-1.5 text-slate-600 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
                            title="Hapus Parameter"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 8: STANDARISASI PAKET PT (MULTI-MODALITY CHECKLIST PER PAKET)        */}
      {/* ========================================================================= */}
      {activeTab === 'paket' && (
        <div className="space-y-6">
          <div className="bg-slate-50 p-4 border border-slate-200 rounded-xl space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Perusahaan / Klien Korporat:
                </label>
                <div className="relative">
                  <Building className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <select
                    value={selectedCompany}
                    onChange={(e) => setSelectedCompany(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-800 shadow-2xs"
                  >
                    {companies.map((c) => (
                      <option key={c.id || c.nama} value={c.nama}>
                        {c.nama}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Pilih Paket MCU Yang Dikonfigurasi:
                </label>
                <div className="relative">
                  <Package className="w-4 h-4 text-teal-600 absolute left-3 top-1/2 -translate-y-1/2" />
                  <select
                    value={selectedPackage}
                    onChange={(e) => setSelectedPackage(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-white border border-teal-300 rounded-xl text-xs font-extrabold text-teal-900 shadow-2xs cursor-pointer"
                  >
                    {packageList.map((p) => {
                      const pkgCode = p.kode || (p as any).code || '';
                      const pkgName = p.nama || (p as any).name || '';
                      const pkgComp = p.perusahaan ? ` (${p.perusahaan})` : '';
                      return (
                        <option key={p.id || pkgCode} value={pkgCode}>
                          {pkgCode} - {pkgName}{pkgComp}
                        </option>
                      );
                    })}
                  </select>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2 text-xs text-slate-600 font-medium">
              <Info className="w-4 h-4 text-teal-600 shrink-0" />
              <span>
                Centang parameter yang termasuk dalam paket <strong>{selectedPackage}</strong>.
                Perubahan tersimpan otomatis secara real-time.
              </span>
            </div>
          </div>

          {/* Sub-selector for exam modalities inside package */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-3">
            <div className="flex flex-wrap gap-1.5 p-1 bg-slate-100 rounded-xl border border-slate-200">
              {(
                [
                  { key: 'fisik', label: '1. Fisik', icon: Activity },
                  { key: 'lab', label: '2. Laboratorium', icon: FlaskConical },
                  { key: 'rontgen', label: '3. Rontgen', icon: Radio },
                  { key: 'ekg', label: '4. EKG Jantung', icon: HeartPulse },
                  { key: 'audio', label: '5. Audiometri', icon: Volume2 },
                  { key: 'spiro', label: '6. Spirometri', icon: Wind },
                  { key: 'penunjang', label: '7. Penunjang', icon: Stethoscope },
                ] as const
              ).map((m) => {
                const IconComponent = m.icon;
                const isCurrent = packageModalityTab === m.key;
                return (
                  <button
                    key={m.key}
                    type="button"
                    onClick={() => {
                      setPackageModalityTab(m.key);
                      setPkgSearchQuery('');
                    }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                      isCurrent
                        ? 'bg-teal-700 text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-white/70'
                    }`}
                  >
                    <IconComponent className="w-3.5 h-3.5" />
                    {m.label}
                  </button>
                );
              })}
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => toggleSelectAllInPackage(packageModalityTab, true)}
                className="px-3 py-1.5 text-xs font-bold text-teal-800 bg-teal-50 border border-teal-200 rounded-xl hover:bg-teal-100 transition-all flex items-center gap-1"
              >
                <CheckSquare className="w-3.5 h-3.5" />
                Pilih Semua
              </button>
              <button
                type="button"
                onClick={() => toggleSelectAllInPackage(packageModalityTab, false)}
                className="px-3 py-1.5 text-xs font-bold text-slate-600 bg-white border border-slate-300 rounded-xl hover:bg-slate-50 transition-all flex items-center gap-1"
              >
                <Square className="w-3.5 h-3.5" />
                Batal Pilih Semua
              </button>
            </div>
          </div>

          {/* Search inside Package view */}
          <div className="relative max-w-sm">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={pkgSearchQuery}
              onChange={(e) => setPkgSearchQuery(e.target.value)}
              placeholder="Cari parameter dalam modul ini..."
              className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium placeholder:text-slate-400 focus:bg-white focus:ring-1 focus:ring-teal-500"
            />
          </div>

          {/* Checklist Grid / Table */}
          <div className="border border-slate-200 rounded-xl overflow-x-auto shadow-2xs">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100/80 border-b border-slate-200 text-slate-700 font-extrabold">
                <tr>
                  <th className="py-3 px-4 w-12 text-center">Pilih</th>
                  <th className="py-3 px-3 w-28">Kode</th>
                  <th className="py-3 px-4">Nama Parameter</th>
                  <th className="py-3 px-3">Kategori</th>
                  <th className="py-3 px-4">Nilai Normal / Rujukan</th>
                  <th className="py-3 px-3">Status Dalam Paket {selectedPackage}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-slate-800 font-medium">
                {(() => {
                  let items: Array<{
                    id: string;
                    kode: string;
                    nama: string;
                    kategori: string;
                    normal: string;
                    paketCodes?: string[];
                  }> = [];

                  switch (packageModalityTab) {
                    case 'fisik':
                      items = physicalList.map((p) => ({
                        id: p.id,
                        kode: p.kode,
                        nama: p.nama,
                        kategori: p.kategori,
                        normal: p.nilaiNormal,
                        paketCodes: p.paketCodes,
                      }));
                      break;
                    case 'lab':
                      items = labList.map((l) => ({
                        id: l.id,
                        kode: l.kode,
                        nama: l.nama,
                        kategori: l.kategori,
                        normal: `${l.nilaiRujukanPria} (P) / ${l.nilaiRujukanWanita} (W)`,
                        paketCodes: l.paketCodes,
                      }));
                      break;
                    case 'rontgen':
                      items = rontgenList.map((r) => ({
                        id: r.id,
                        kode: r.kode,
                        nama: r.nama,
                        kategori: r.kategori,
                        normal: r.nilaiNormal,
                        paketCodes: r.paketCodes,
                      }));
                      break;
                    case 'ekg':
                      items = ekgList.map((e) => ({
                        id: e.id,
                        kode: e.kode,
                        nama: e.nama,
                        kategori: e.kategori,
                        normal: e.nilaiNormal,
                        paketCodes: e.paketCodes,
                      }));
                      break;
                    case 'audio':
                      items = audioList.map((a) => ({
                        id: a.id,
                        kode: a.kode,
                        nama: a.nama,
                        kategori: a.kategori,
                        normal: a.nilaiNormal,
                        paketCodes: a.paketCodes,
                      }));
                      break;
                    case 'spiro':
                      items = spiroList.map((s) => ({
                        id: s.id,
                        kode: s.kode,
                        nama: s.nama,
                        kategori: s.kategori,
                        normal: s.nilaiNormal,
                        paketCodes: s.paketCodes,
                      }));
                      break;
                    case 'penunjang':
                      items = penunjangList.map((p) => ({
                        id: p.id,
                        kode: p.kode,
                        nama: p.nama,
                        kategori: p.kategori,
                        normal: p.nilaiNormal,
                        paketCodes: p.paketCodes,
                      }));
                      break;
                  }

                  const filteredItems = items.filter((item) =>
                    item.nama.toLowerCase().includes(pkgSearchQuery.toLowerCase()) ||
                    item.kode.toLowerCase().includes(pkgSearchQuery.toLowerCase()) ||
                    item.kategori.toLowerCase().includes(pkgSearchQuery.toLowerCase())
                  );

                  if (filteredItems.length === 0) {
                    return (
                      <tr>
                        <td colSpan={6} className="py-8 text-center text-slate-400 font-medium">
                          Tidak ada parameter yang cocok dengan kriteria pencarian.
                        </td>
                      </tr>
                    );
                  }

                  return filteredItems.map((item) => {
                    const isIncluded =
                      item.paketCodes?.includes(selectedPackage) ||
                      item.paketCodes?.includes('ALL');

                    return (
                      <tr
                        key={item.id}
                        onClick={() => toggleParamInPackage(packageModalityTab, item.id)}
                        className={`cursor-pointer transition-colors ${
                          isIncluded ? 'bg-teal-50/40 hover:bg-teal-50/70' : 'hover:bg-slate-50'
                        }`}
                      >
                        <td className="py-2.5 px-4 text-center">
                          <input
                            type="checkbox"
                            checked={isIncluded}
                            onChange={() => {}}
                            className="w-4 h-4 text-teal-600 rounded-sm border-slate-300 focus:ring-teal-500 cursor-pointer pointer-events-none"
                          />
                        </td>
                        <td className="py-2.5 px-3 font-mono font-bold text-teal-900">{item.kode}</td>
                        <td className="py-2.5 px-4 font-bold text-slate-900">{item.nama}</td>
                        <td className="py-2.5 px-3">
                          <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[11px] font-semibold border border-slate-200">
                            {item.kategori}
                          </span>
                        </td>
                        <td className="py-2.5 px-4 font-semibold text-slate-700">{item.normal}</td>
                        <td className="py-2.5 px-3">
                          {isIncluded ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                              Termasuk Paket
                            </span>
                          ) : (
                            <span className="text-[11px] font-medium text-slate-400">
                              Tidak Disertakan
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  });
                })()}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODALS SECTION                                                            */}
      {/* ========================================================================= */}

      {/* 1. In-App Delete Confirmation Modal (Replaces window.confirm) */}
      <DeleteParamConfirmModal
        isOpen={!!deleteTarget}
        target={deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleExecuteDelete}
      />

      {/* 2. Link Package Modal */}
      {linkPackageTarget && (
        <LinkPackageModal
          isOpen={!!linkPackageTarget}
          paramName={linkPackageTarget.name}
          paramCode={linkPackageTarget.code}
          currentPackages={linkPackageTarget.currentPackages}
          availablePackages={packageList}
          onClose={() => setLinkPackageTarget(null)}
          onSave={handleSaveLinkedPackages}
        />
      )}

      {/* 3. Diagnostic Parameter Modal (Rontgen, EKG, Audio, Spiro, Penunjang) */}
      <DiagnosticParamModal
        isOpen={diagnosticModal.isOpen}
        modality={diagnosticModal.modality}
        editingItem={diagnosticModal.item}
        categories={
          diagnosticModal.modality === 'rontgen'
            ? RONTGEN_CATEGORIES
            : diagnosticModal.modality === 'ekg'
            ? EKG_CATEGORIES
            : diagnosticModal.modality === 'audio'
            ? AUDIO_CATEGORIES
            : diagnosticModal.modality === 'spiro'
            ? SPIRO_CATEGORIES
            : PENUNJANG_CATEGORIES
        }
        packages={packageList}
        onClose={() => setDiagnosticModal({ isOpen: false, modality: 'rontgen', item: null })}
        onSave={handleSaveDiagnosticParam}
      />

      {/* 4. Physical Param Modal */}
      {showPhysicalModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 max-w-xl w-full overflow-hidden flex flex-col">
            <div className="bg-teal-700 text-white p-5 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Activity className="w-5 h-5 text-teal-200" />
                <div>
                  <h3 className="text-base font-extrabold">
                    {editingPhysical ? 'Edit Parameter Fisik' : 'Tambah Parameter Fisik'}
                  </h3>
                  <p className="text-xs text-teal-100">Pemeriksaan head-to-toe dan tanda vital</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowPhysicalModal(false)}
                className="text-white/80 hover:text-white p-1 rounded-lg hover:bg-white/10"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSavePhysical} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Kode Parameter</label>
                  <input
                    type="text"
                    required
                    value={physicalForm.kode}
                    onChange={(e) => setPhysicalForm({ ...physicalForm, kode: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Kategori Organ</label>
                  <select
                    value={physicalForm.kategori}
                    onChange={(e) =>
                      setPhysicalForm({ ...physicalForm, kategori: e.target.value as any })
                    }
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold"
                  >
                    {PHYSICAL_CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Nama Parameter</label>
                <input
                  type="text"
                  required
                  value={physicalForm.nama}
                  onChange={(e) => setPhysicalForm({ ...physicalForm, nama: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold"
                  placeholder="cth: Tekanan Darah, Visus OS, Auskultasi Paru"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Nilai Acuan Normal</label>
                  <input
                    type="text"
                    required
                    value={physicalForm.nilaiNormal}
                    onChange={(e) => setPhysicalForm({ ...physicalForm, nilaiNormal: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold"
                    placeholder="cth: 120/80 mmHg, Vesikuler, Normal"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Satuan (Opsional)</label>
                  <input
                    type="text"
                    value={physicalForm.satuan || ''}
                    onChange={(e) => setPhysicalForm({ ...physicalForm, satuan: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold"
                    placeholder="cth: mmHg, cm, kg"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="pf-is-active"
                  checked={physicalForm.isActive}
                  onChange={(e) => setPhysicalForm({ ...physicalForm, isActive: e.target.checked })}
                  className="w-4 h-4 text-teal-600 rounded-sm"
                />
                <label htmlFor="pf-is-active" className="text-xs font-bold text-slate-700">
                  Parameter Aktif
                </label>
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowPhysicalModal(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 bg-white border border-slate-300 rounded-xl hover:bg-slate-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold text-white bg-teal-700 hover:bg-teal-800 rounded-xl shadow-xs flex items-center gap-1.5"
                >
                  <Save className="w-4 h-4" />
                  {editingPhysical ? 'Simpan Perubahan' : 'Tambah Parameter'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 5. Lab Param Modal */}
      {showLabModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 max-w-xl w-full overflow-hidden flex flex-col">
            <div className="bg-teal-700 text-white p-5 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <FlaskConical className="w-5 h-5 text-teal-200" />
                <div>
                  <h3 className="text-base font-extrabold">
                    {editingLab ? 'Edit Parameter Lab' : 'Tambah Parameter Lab'}
                  </h3>
                  <p className="text-xs text-teal-100">Nilai rujukan spesifik pria &amp; wanita</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowLabModal(false)}
                className="text-white/80 hover:text-white p-1 rounded-lg hover:bg-white/10"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveLab} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Kode Tes</label>
                  <input
                    type="text"
                    required
                    value={labForm.kode}
                    onChange={(e) => setLabForm({ ...labForm, kode: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Kategori Lab</label>
                  <select
                    value={labForm.kategori}
                    onChange={(e) => setLabForm({ ...labForm, kategori: e.target.value as any })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold"
                  >
                    {LAB_CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Nama Pemeriksaan Lab</label>
                <input
                  type="text"
                  required
                  value={labForm.nama}
                  onChange={(e) => setLabForm({ ...labForm, nama: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold"
                  placeholder="cth: Hemoglobin, Glukosa Puasa, Asam Urat"
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Rujukan Pria</label>
                  <input
                    type="text"
                    required
                    value={labForm.nilaiRujukanPria}
                    onChange={(e) => setLabForm({ ...labForm, nilaiRujukanPria: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold"
                    placeholder="13.0 - 17.5"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Rujukan Wanita</label>
                  <input
                    type="text"
                    required
                    value={labForm.nilaiRujukanWanita}
                    onChange={(e) => setLabForm({ ...labForm, nilaiRujukanWanita: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold"
                    placeholder="12.0 - 16.0"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Satuan</label>
                  <input
                    type="text"
                    required
                    value={labForm.satuan}
                    onChange={(e) => setLabForm({ ...labForm, satuan: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold"
                    placeholder="g/dL, mg/dL"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="lab-is-active"
                  checked={labForm.isActive}
                  onChange={(e) => setLabForm({ ...labForm, isActive: e.target.checked })}
                  className="w-4 h-4 text-teal-600 rounded-sm"
                />
                <label htmlFor="lab-is-active" className="text-xs font-bold text-slate-700">
                  Parameter Aktif
                </label>
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowLabModal(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 bg-white border border-slate-300 rounded-xl hover:bg-slate-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold text-white bg-teal-700 hover:bg-teal-800 rounded-xl shadow-xs flex items-center gap-1.5"
                >
                  <Save className="w-4 h-4" />
                  {editingLab ? 'Simpan Perubahan' : 'Tambah Parameter'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 6. Import Physical Excel Modal */}
      <ImportPhysicalParamsModal
        isOpen={showImportPhysicalModal}
        onClose={() => setShowImportPhysicalModal(false)}
        onImport={(imported, mode) => {
          let next: PhysicalExamParam[];
          if (mode === 'replace') {
            next = imported;
          } else if (mode === 'append') {
            next = [...physicalList, ...imported];
          } else {
            const map = new Map<string, PhysicalExamParam>(
              physicalList.map((p) => [p.kode.toLowerCase(), p])
            );
            imported.forEach((p) => map.set(p.kode.toLowerCase(), p));
            next = Array.from(map.values()) as PhysicalExamParam[];
          }
          setPhysicalList(next);
          localStorage.setItem('simreg_physical_params', JSON.stringify(next));
          if (onUpdatePhysicalParams) onUpdatePhysicalParams(next);
          onNotify(`Berhasil mengimpor ${imported.length} parameter fisik.`);
          setShowImportPhysicalModal(false);
        }}
        onDownloadTemplate={() => handleExportExcel('fisik')}
        availablePackages={packageList}
      />

      {/* 7. Import Lab Excel Modal */}
      <ImportLabParamsModal
        isOpen={showImportLabModal}
        onClose={() => setShowImportLabModal(false)}
        onImport={(imported, mode) => {
          let next: LabExamParam[];
          if (mode === 'replace') {
            next = imported;
          } else if (mode === 'append') {
            next = [...labList, ...imported];
          } else {
            const map = new Map<string, LabExamParam>(
              labList.map((l) => [l.kode.toLowerCase(), l])
            );
            imported.forEach((l) => map.set(l.kode.toLowerCase(), l));
            next = Array.from(map.values()) as LabExamParam[];
          }
          setLabList(next);
          localStorage.setItem('simreg_lab_params', JSON.stringify(next));
          if (onUpdateLabParams) onUpdateLabParams(next);
          onNotify(`Berhasil mengimpor ${imported.length} parameter lab.`);
          setShowImportLabModal(false);
        }}
        onDownloadTemplate={() => handleExportExcel('lab')}
        availablePackages={packageList}
      />
    </div>
  );
};
