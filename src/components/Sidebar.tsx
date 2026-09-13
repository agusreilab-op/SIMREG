import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Activity,
  Home,
  UserPlus,
  Settings,
  Stethoscope,
  BarChart3,
  Building2,
  Calendar,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  X,
  Users,
  Upload,
  Tag,
  Grid,
  Building,
  UserCheck,
  Package,
  Sliders,
  MessageSquareHeart,
  Hospital,
  ShieldCheck,
  FlaskConical,
  FileText,
  HeartPulse,
  Ear,
  Wind,
  Zap,
  Microscope,
  Printer,
  FileSpreadsheet,
  ArrowUpRight,
} from 'lucide-react';
import { Page, UserSession } from '../types';
import { MasterSubAction } from './MasterView';
import { RegistrasiTab } from './RegistrasiView';
import { LaporanSubAction } from './LaporanView';

export interface SubMenuItemConfig {
  id: string;
  num?: string;
  label: string;
  badge?: string;
  icon: React.ReactNode;
  action: () => void;
  isActive: boolean;
}

interface ModuleNavConfig {
  id: Page;
  label: string;
  icon: React.ReactNode;
  badge?: string;
  subTitle?: string;
  subBadge?: string;
  subItems?: SubMenuItemConfig[];
}

interface SidebarProps {
  currentPage: Page;
  onSelectPage: (page: Page) => void;
  session?: UserSession | null;
  onOpenSessionModal?: () => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
  isMobileOpen?: boolean;
  onCloseMobile?: () => void;

  // Sub-actions
  masterSubAction?: MasterSubAction;
  onSelectMasterSubAction?: (sub: MasterSubAction) => void;
  registrasiTab?: RegistrasiTab;
  onSelectRegistrasiTab?: (tab: RegistrasiTab) => void;
  medicalActiveAction?: string | null;
  onSelectMedicalAction?: (action: string | null) => void;
  laporanSubAction?: LaporanSubAction;
  onSelectLaporanSubAction?: (sub: LaporanSubAction) => void;

  // Counts for live badges
  attendanceCount?: number;
  companyCount?: number;
  doctorCount?: number;
  packageCount?: number;
}

interface PopoverPosition {
  top: number;
  left: number;
  isDropup: boolean;
  isShiftedLeft: boolean;
  width: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentPage,
  onSelectPage,
  session,
  onOpenSessionModal,
  isCollapsed = false,
  onToggleCollapse,
  isMobileOpen = false,
  onCloseMobile,
  masterSubAction = 'menu',
  onSelectMasterSubAction,
  registrasiTab = 'form',
  onSelectRegistrasiTab,
  medicalActiveAction = null,
  onSelectMedicalAction,
  laporanSubAction = 'menu',
  onSelectLaporanSubAction,
  attendanceCount = 0,
  companyCount = 0,
  doctorCount = 0,
  packageCount = 0,
}) => {
  // Mobile accordion state (expanded module ID)
  const [mobileExpandedModule, setMobileExpandedModule] = useState<Page | null>(null);

  // Desktop smart popover state
  const [activeFlyoutModule, setActiveFlyoutModule] = useState<Page | null>(null);
  const [popoverPos, setPopoverPos] = useState<PopoverPosition | null>(null);

  // DOM Trigger refs for collision calculation
  const triggerRefs = useRef<{ [key in Page]?: HTMLButtonElement | null }>({});
  const popoverRef = useRef<HTMLDivElement | null>(null);
  const hoverTimeoutRef = useRef<number | null>(null);

  // Close popover when clicking outside or pressing Escape
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        popoverRef.current &&
        !popoverRef.current.contains(e.target as Node) &&
        !(Object.values(triggerRefs.current) as (HTMLButtonElement | null | undefined)[]).some((el) =>
          el?.contains(e.target as Node)
        )
      ) {
        setActiveFlyoutModule(null);
        setPopoverPos(null);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setActiveFlyoutModule(null);
        setPopoverPos(null);
      }
    };

    window.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  // Recalculate smart positioning on window resize or scroll
  const calculateSmartPosition = useCallback((page: Page, itemCount: number): PopoverPosition | null => {
    const triggerEl = triggerRefs.current[page];
    if (!triggerEl) return null;

    const rect = triggerEl.getBoundingClientRect();
    const viewportW = window.innerWidth;
    const viewportH = window.innerHeight;

    // Desktop optimization for 9 items: 2 columns
    const isNineItems = itemCount >= 8;
    const menuWidth = isNineItems ? 430 : 275;

    // Height calculation:
    // Header: ~42px
    // For 2-column layout (9 items): ceil(9/2) = 5 rows * 36px = 180px + padding 16px = ~238px
    // For 1-column layout (4 items): 4 * 38px = 152px + header 42px + padding 16px = ~210px
    const rows = isNineItems ? Math.ceil(itemCount / 2) : itemCount;
    const itemHeight = isNineItems ? 36 : 38;
    const menuHeight = 44 + rows * itemHeight + 16;

    // 1. Horizontal positioning & Collision Detection:
    // Default: appear to the right of the sidebar button (+10px margin)
    let left = rect.right + 10;
    let isShiftedLeft = false;

    // Collision detection: right boundary
    if (left + menuWidth > viewportW - 12) {
      // Flip / Shift to the left of the button
      left = Math.max(12, rect.left - menuWidth - 10);
      isShiftedLeft = true;
    }

    // 2. Vertical positioning & Smart Dropup Collision Detection:
    let top = rect.top;
    let isDropup = false;

    // Collision detection: bottom boundary (if extending down exceeds screen)
    if (rect.top + menuHeight > viewportH - 16) {
      isDropup = true;
      // Flip upwards so that bottom of popover aligns with bottom of trigger button
      top = Math.max(12, rect.bottom - menuHeight);
    } else {
      top = Math.max(12, rect.top);
    }

    return {
      top,
      left,
      isDropup,
      isShiftedLeft,
      width: menuWidth,
    };
  }, []);

  const openDesktopFlyout = (page: Page, itemCount: number) => {
    if (window.innerWidth < 1024) return; // Only for desktop
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
      hoverTimeoutRef.current = null;
    }
    const pos = calculateSmartPosition(page, itemCount);
    if (pos) {
      setPopoverPos(pos);
      setActiveFlyoutModule(page);
    }
  };

  const scheduleCloseDesktopFlyout = () => {
    if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
    hoverTimeoutRef.current = window.setTimeout(() => {
      setActiveFlyoutModule(null);
      setPopoverPos(null);
    }, 180);
  };

  const cancelCloseDesktopFlyout = () => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
      hoverTimeoutRef.current = null;
    }
  };

  // Build the complete module configuration with 9 items for Master & Medical Record
  const navModules: ModuleNavConfig[] = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: <Home className="w-[19px] h-[19px]" />,
    },
    {
      id: 'registrasi',
      label: 'Registrasi',
      icon: <UserPlus className="w-[19px] h-[19px]" />,
      badge: attendanceCount > 0 ? `${attendanceCount}` : undefined,
      subTitle: 'Registrasi & Onsite MCU',
      subBadge: '4 Sub-Menu',
      subItems: [
        {
          id: 'attendance',
          num: '1',
          label: 'Daftar Presensi Peserta',
          badge: 'Tabel Presensi',
          icon: <Users className="w-3.5 h-3.5 text-cyan-600" />,
          action: () => {
            onSelectPage('registrasi');
            if (onSelectRegistrasiTab) onSelectRegistrasiTab('attendance');
          },
          isActive: currentPage === 'registrasi' && registrasiTab === 'attendance',
        },
        {
          id: 'form',
          num: '2',
          label: 'Form Registrasi Pasien',
          badge: 'Input Baru',
          icon: <UserPlus className="w-3.5 h-3.5 text-emerald-600" />,
          action: () => {
            onSelectPage('registrasi');
            if (onSelectRegistrasiTab) onSelectRegistrasiTab('form');
          },
          isActive: currentPage === 'registrasi' && registrasiTab === 'form',
        },
        {
          id: 'import',
          num: '3',
          label: 'Impor Massal Excel',
          badge: 'Upload XLS',
          icon: <Upload className="w-3.5 h-3.5 text-purple-600" />,
          action: () => {
            onSelectPage('registrasi');
            if (onSelectRegistrasiTab) onSelectRegistrasiTab('import');
          },
          isActive: currentPage === 'registrasi' && registrasiTab === 'import',
        },
        {
          id: 'thermal',
          num: '4',
          label: 'Cetak Label Barcode',
          badge: 'Thermal Stiker',
          icon: <Tag className="w-3.5 h-3.5 text-amber-600" />,
          action: () => {
            onSelectPage('registrasi');
            if (onSelectRegistrasiTab) onSelectRegistrasiTab('attendance');
          },
          isActive: false,
        },
      ],
    },
    {
      id: 'master',
      label: 'Master Data',
      icon: <Settings className="w-[19px] h-[19px]" />,
      badge: '9 Modul',
      subTitle: 'Konfigurasi Master Data',
      subBadge: '9 Sub-Modul',
      subItems: [
        {
          id: 'menu',
          num: '0',
          label: 'Ikhtisar Semua Master',
          badge: 'Ringkasan',
          icon: <Grid className="w-3.5 h-3.5 text-slate-700" />,
          action: () => {
            onSelectPage('master');
            if (onSelectMasterSubAction) onSelectMasterSubAction('menu');
          },
          isActive: currentPage === 'master' && masterSubAction === 'menu',
        },
        {
          id: 'company',
          num: '1',
          label: 'Perusahaan Rekanan',
          badge: `${companyCount} PT`,
          icon: <Building className="w-3.5 h-3.5 text-blue-600" />,
          action: () => {
            onSelectPage('master');
            if (onSelectMasterSubAction) onSelectMasterSubAction('company');
          },
          isActive: currentPage === 'master' && masterSubAction === 'company',
        },
        {
          id: 'doctor',
          num: '2',
          label: 'Master Dokter',
          badge: `${doctorCount} Dokter`,
          icon: <UserCheck className="w-3.5 h-3.5 text-emerald-600" />,
          action: () => {
            onSelectPage('master');
            if (onSelectMasterSubAction) onSelectMasterSubAction('doctor');
          },
          isActive: currentPage === 'master' && masterSubAction === 'doctor',
        },
        {
          id: 'examiner',
          num: '3',
          label: 'Penugasan Tim Dokter',
          badge: 'Tim Dokter PT',
          icon: <Stethoscope className="w-3.5 h-3.5 text-indigo-600" />,
          action: () => {
            onSelectPage('master');
            if (onSelectMasterSubAction) onSelectMasterSubAction('examiner');
          },
          isActive: currentPage === 'master' && masterSubAction === 'examiner',
        },
        {
          id: 'package',
          num: '4',
          label: 'Paket MCU & Label',
          badge: `${packageCount} Paket`,
          icon: <Package className="w-3.5 h-3.5 text-purple-600" />,
          action: () => {
            onSelectPage('master');
            if (onSelectMasterSubAction) onSelectMasterSubAction('package');
          },
          isActive: currentPage === 'master' && masterSubAction === 'package',
        },
        {
          id: 'exam',
          num: '5',
          label: 'Parameter Klinis',
          badge: 'Nilai Normal',
          icon: <Sliders className="w-3.5 h-3.5 text-teal-600" />,
          action: () => {
            onSelectPage('master');
            if (onSelectMasterSubAction) onSelectMasterSubAction('exam');
          },
          isActive: currentPage === 'master' && masterSubAction === 'exam',
        },
        {
          id: 'saran-medis',
          num: '6',
          label: 'Master Saran Medis',
          badge: 'Saran Klinis',
          icon: <MessageSquareHeart className="w-3.5 h-3.5 text-rose-600" />,
          action: () => {
            onSelectPage('master');
            if (onSelectMasterSubAction) onSelectMasterSubAction('saran-medis');
          },
          isActive: currentPage === 'master' && masterSubAction === 'saran-medis',
        },
        {
          id: 'clinic',
          num: '7',
          label: 'Identitas & Kop Klinik',
          badge: 'Legalitas',
          icon: <Hospital className="w-3.5 h-3.5 text-cyan-600" />,
          action: () => {
            onSelectPage('master');
            if (onSelectMasterSubAction) onSelectMasterSubAction('clinic');
          },
          isActive: currentPage === 'master' && masterSubAction === 'clinic',
        },
        {
          id: 'login-access',
          num: '8',
          label: 'Akses Pengguna',
          badge: 'Hak Akses',
          icon: <ShieldCheck className="w-3.5 h-3.5 text-amber-600" />,
          action: () => {
            onSelectPage('master');
            if (onSelectMasterSubAction) onSelectMasterSubAction('login-access');
          },
          isActive: currentPage === 'master' && masterSubAction === 'login-access',
        },
      ],
    },
    {
      id: 'medical',
      label: 'Medical Record',
      icon: <Stethoscope className="w-[19px] h-[19px]" />,
      badge: '9 Menu',
      subTitle: 'Rekam Medis & Pemeriksaan',
      subBadge: '9 Modalitas',
      subItems: [
        {
          id: 'Resume & Kategori',
          num: '1',
          label: 'Resume & Kelaikan',
          badge: 'Fit to Work',
          icon: <ShieldCheck className="w-3.5 h-3.5 text-purple-600" />,
          action: () => {
            onSelectPage('medical');
            if (onSelectMedicalAction) onSelectMedicalAction('Resume & Kategori');
          },
          isActive: currentPage === 'medical' && medicalActiveAction === 'Resume & Kategori',
        },
        {
          id: 'Pemeriksaan Fisik',
          num: '2',
          label: 'Pemeriksaan Fisik',
          badge: 'Fisik & Visus',
          icon: <Activity className="w-3.5 h-3.5 text-teal-600" />,
          action: () => {
            onSelectPage('medical');
            if (onSelectMedicalAction) onSelectMedicalAction('Pemeriksaan Fisik');
          },
          isActive: currentPage === 'medical' && medicalActiveAction === 'Pemeriksaan Fisik',
        },
        {
          id: 'Laboratorium',
          num: '3',
          label: 'Laboratorium',
          badge: 'Darah & Urin',
          icon: <FlaskConical className="w-3.5 h-3.5 text-amber-600" />,
          action: () => {
            onSelectPage('medical');
            if (onSelectMedicalAction) onSelectMedicalAction('Laboratorium');
          },
          isActive: currentPage === 'medical' && medicalActiveAction === 'Laboratorium',
        },
        {
          id: 'Rontgen Thorax',
          num: '4',
          label: 'Rontgen Thorax',
          badge: 'Radiologi PA',
          icon: <FileText className="w-3.5 h-3.5 text-cyan-600" />,
          action: () => {
            onSelectPage('medical');
            if (onSelectMedicalAction) onSelectMedicalAction('Rontgen Thorax');
          },
          isActive: currentPage === 'medical' && medicalActiveAction === 'Rontgen Thorax',
        },
        {
          id: 'EKG',
          num: '5',
          label: 'Elektrokardiografi',
          badge: '12-Lead EKG',
          icon: <HeartPulse className="w-3.5 h-3.5 text-rose-600" />,
          action: () => {
            onSelectPage('medical');
            if (onSelectMedicalAction) onSelectMedicalAction('EKG');
          },
          isActive: currentPage === 'medical' && medicalActiveAction === 'EKG',
        },
        {
          id: 'Audiometri',
          num: '6',
          label: 'Uji Audiometri',
          badge: 'Ambang Dengar',
          icon: <Ear className="w-3.5 h-3.5 text-blue-600" />,
          action: () => {
            onSelectPage('medical');
            if (onSelectMedicalAction) onSelectMedicalAction('Audiometri');
          },
          isActive: currentPage === 'medical' && medicalActiveAction === 'Audiometri',
        },
        {
          id: 'Spirometri',
          num: '7',
          label: 'Uji Spirometri',
          badge: 'Fungsi Paru',
          icon: <Wind className="w-3.5 h-3.5 text-sky-600" />,
          action: () => {
            onSelectPage('medical');
            if (onSelectMedicalAction) onSelectMedicalAction('Spirometri');
          },
          isActive: currentPage === 'medical' && medicalActiveAction === 'Spirometri',
        },
        {
          id: 'Treadmill Test',
          num: '8',
          label: 'Treadmill Test',
          badge: 'Uji Beban',
          icon: <Zap className="w-3.5 h-3.5 text-indigo-600" />,
          action: () => {
            onSelectPage('medical');
            if (onSelectMedicalAction) onSelectMedicalAction('Treadmill Test');
          },
          isActive: currentPage === 'medical' && medicalActiveAction === 'Treadmill Test',
        },
        {
          id: 'USG Abdomen',
          num: '9',
          label: 'USG Abdomen',
          badge: 'Ultrasonografi',
          icon: <Microscope className="w-3.5 h-3.5 text-emerald-600" />,
          action: () => {
            onSelectPage('medical');
            if (onSelectMedicalAction) onSelectMedicalAction('USG Abdomen');
          },
          isActive: currentPage === 'medical' && medicalActiveAction === 'USG Abdomen',
        },
      ],
    },
    {
      id: 'laporan',
      label: 'Cetak & Laporan',
      icon: <BarChart3 className="w-[19px] h-[19px]" />,
      subTitle: 'Penerbitan & Rekapitulasi Laporan',
      subBadge: '2 Modul',
      subItems: [
        {
          id: 'print',
          num: '1',
          label: 'Penerbitan Buku MCU',
          badge: 'Cetak Hasil',
          icon: <Printer className="w-3.5 h-3.5 text-amber-600" />,
          action: () => {
            onSelectPage('laporan');
            if (onSelectLaporanSubAction) onSelectLaporanSubAction('print');
          },
          isActive: currentPage === 'laporan' && laporanSubAction === 'print',
        },
        {
          id: 'report',
          num: '2',
          label: 'Rekap Laporan Perusahaan',
          badge: 'PDF & Excel',
          icon: <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />,
          action: () => {
            onSelectPage('laporan');
            if (onSelectLaporanSubAction) onSelectLaporanSubAction('report');
          },
          isActive: currentPage === 'laporan' && laporanSubAction === 'report',
        },
      ],
    },
  ];

  // Active flyout configuration
  const activeFlyoutConfig = navModules.find((m) => m.id === activeFlyoutModule);

  const handleModuleClick = (module: ModuleNavConfig) => {
    // If on mobile: toggle the accordion
    if (window.innerWidth < 1024) {
      if (module.subItems && module.subItems.length > 0) {
        setMobileExpandedModule((prev) => (prev === module.id ? null : module.id));
      } else {
        onSelectPage(module.id);
        if (onCloseMobile) onCloseMobile();
      }
      return;
    }

    // On desktop:
    onSelectPage(module.id);
    if (module.subItems && module.subItems.length > 0) {
      // Toggle flyout or recalculate
      if (activeFlyoutModule === module.id) {
        setActiveFlyoutModule(null);
        setPopoverPos(null);
      } else {
        openDesktopFlyout(module.id, module.subItems.length);
      }
    } else {
      setActiveFlyoutModule(null);
      setPopoverPos(null);
    }
  };

  const handleSubItemClick = (action: () => void) => {
    action();
    setActiveFlyoutModule(null);
    setPopoverPos(null);
    if (onCloseMobile) onCloseMobile();
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isMobileOpen && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 z-40 bg-slate-900/60 backdrop-blur-xs lg:hidden transition-opacity"
        />
      )}

      {/* Sidebar Aside */}
      <aside
        className={`fixed inset-y-0 left-0 bg-white border-r border-[#E2E8F0] z-50 flex flex-col justify-between transition-all duration-300 ease-in-out ${
          isCollapsed ? 'w-[76px] px-2.5 py-4' : 'w-[260px] p-5'
        } ${
          isMobileOpen
            ? 'translate-x-0 shadow-2xl'
            : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="flex flex-col h-full overflow-hidden">
          {/* Brand Header */}
          <div className={`pb-4 mb-3 flex items-center border-b border-[#E2E8F0] shrink-0 ${isCollapsed ? 'justify-center' : 'justify-between'}`}>
            <div
              className={`flex items-center gap-3 cursor-pointer overflow-hidden ${isCollapsed ? 'justify-center' : ''}`}
              onClick={() => {
                onSelectPage('dashboard');
                if (onCloseMobile) onCloseMobile();
              }}
              title="SIMREG MCU Dashboard"
            >
              <div className="w-[40px] h-[40px] rounded-xl bg-gradient-to-br from-[#0E7490] to-[#06B6D4] flex items-center justify-center text-white shadow-md shadow-cyan-500/25 shrink-0">
                <Activity className="w-[22px] h-[22px] stroke-[2.3]" />
              </div>
              {!isCollapsed && (
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <h1 className="text-[19px] font-extrabold tracking-tight leading-none bg-gradient-to-r from-[#0E7490] to-[#0284C7] bg-clip-text text-transparent">
                      SIMREG
                    </h1>
                    <span className="px-1.5 py-0.2 rounded text-[9px] font-black bg-cyan-100 text-cyan-900 border border-cyan-200">
                      MCU v3.2
                    </span>
                  </div>
                  <p className="text-[11px] font-semibold text-[#64748B] mt-1 truncate">
                    Sistem Medical Check Up
                  </p>
                </div>
              )}
            </div>

            {/* Mobile Close Button */}
            <button
              onClick={onCloseMobile}
              className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg lg:hidden cursor-pointer"
              title="Tutup Menu"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Section Header */}
          {!isCollapsed && (
            <div className="text-[10.5px] text-[#94A3B8] font-bold px-2.5 py-1 uppercase tracking-wider shrink-0 flex items-center justify-between">
              <span>Navigasi Modul</span>
              <span className="text-[9.5px] font-semibold text-slate-400">Smart UI</span>
            </div>
          )}

          {/* Nav List with Native Mobile Scroll (Zero internal trapped scrollbars) */}
          <nav className="mt-1 flex-1 overflow-y-auto space-y-1 pr-0.5 custom-scrollbar">
            {navModules.map((module) => {
              const isActive = currentPage === module.id;
              const hasSub = !!(module.subItems && module.subItems.length > 0);
              const isMobileExpanded = mobileExpandedModule === module.id;
              const isFlyoutOpen = activeFlyoutModule === module.id;

              return (
                <div key={module.id} className="relative">
                  <button
                    ref={(el) => {
                      triggerRefs.current[module.id] = el;
                    }}
                    type="button"
                    onClick={() => handleModuleClick(module)}
                    onMouseEnter={() => {
                      if (hasSub && !isCollapsed) {
                        openDesktopFlyout(module.id, module.subItems?.length || 0);
                      } else if (hasSub && isCollapsed) {
                        openDesktopFlyout(module.id, module.subItems?.length || 0);
                      }
                    }}
                    onMouseLeave={() => {
                      if (hasSub) {
                        scheduleCloseDesktopFlyout();
                      }
                    }}
                    title={isCollapsed ? module.label : undefined}
                    className={`w-full flex items-center rounded-xl font-semibold text-[13px] transition-all text-left relative group cursor-pointer ${
                      isCollapsed
                        ? 'justify-center p-2.5'
                        : 'justify-between px-3 py-2.5'
                    } ${
                      isActive
                        ? 'bg-gradient-to-r from-[#ECFEFF] to-[#E0F2FE] text-[#0E7490] font-bold shadow-xs border border-cyan-200/60'
                        : 'text-[#475569] hover:bg-[#F1F5F9] hover:text-[#0E7490]'
                    } ${isFlyoutOpen ? 'ring-2 ring-cyan-500/30' : ''}`}
                  >
                    <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'gap-2.5 min-w-0'}`}>
                      <span
                        className={`transition-colors shrink-0 ${
                          isActive ? 'text-[#0E7490]' : 'text-[#64748B]'
                        }`}
                      >
                        {module.icon}
                      </span>
                      {!isCollapsed && (
                        <span className="truncate">{module.label}</span>
                      )}
                    </div>

                    {!isCollapsed && (
                      <div className="flex items-center gap-1.5 shrink-0">
                        {module.badge && (
                          <span
                            className={`px-1.5 py-0.2 rounded text-[10px] font-bold ${
                              isActive
                                ? 'bg-cyan-600 text-white shadow-2xs'
                                : 'bg-slate-100 text-slate-600 border border-slate-200'
                            }`}
                          >
                            {module.badge}
                          </span>
                        )}
                        {hasSub && (
                          <ChevronDown
                            className={`w-3.5 h-3.5 transition-transform duration-200 ${
                              isMobileExpanded ? 'rotate-180 text-cyan-700' : 'text-slate-400'
                            }`}
                          />
                        )}
                      </div>
                    )}

                    {/* Tooltip on collapsed desktop */}
                    {isCollapsed && (
                      <div className="absolute left-full ml-2 px-2.5 py-1 bg-slate-900 text-white text-xs font-semibold rounded-lg opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-50 whitespace-nowrap shadow-lg">
                        {module.label}
                        {hasSub && ` (${module.subItems?.length} items)`}
                      </div>
                    )}
                  </button>

                  {/* MOBILE ACCORDION (Otomatis menjadi accordion di layar mobile) */}
                  {hasSub && isMobileExpanded && (
                    <div className="lg:hidden ml-3 pl-2.5 border-l-2 border-cyan-400/80 my-1 space-y-1 transition-all">
                      {module.subItems?.map((sub) => (
                        <button
                          key={sub.id}
                          type="button"
                          onClick={() => handleSubItemClick(sub.action)}
                          className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-xs font-semibold transition-all text-left cursor-pointer ${
                            sub.isActive
                              ? 'bg-cyan-700 text-white font-bold shadow-2xs'
                              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                          }`}
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="shrink-0">{sub.icon}</span>
                            <span className="truncate">{sub.label}</span>
                          </div>
                          {sub.badge && (
                            <span
                              className={`text-[9.5px] px-1.5 py-0.2 rounded font-bold shrink-0 ${
                                sub.isActive
                                  ? 'bg-cyan-800 text-cyan-100'
                                  : 'bg-slate-100 text-slate-600 border border-slate-200'
                              }`}
                            >
                              {sub.badge}
                            </span>
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </nav>

          {/* Footer Area: Active Session & Collapse Toggle */}
          <div className="space-y-2 pt-3 border-t border-slate-100 shrink-0">
            {/* Active Session Card */}
            {session && !isCollapsed && (
              <div className="p-2.5 rounded-xl bg-gradient-to-br from-slate-50 to-cyan-50/40 border border-slate-200 text-xs space-y-1.5 shadow-2xs">
                <div className="flex items-center justify-between">
                  <span className="text-[9.5px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                    <Building2 className="w-3 h-3 text-cyan-700" />
                    Lingkup MCU
                  </span>
                  {onOpenSessionModal && (
                    <button
                      type="button"
                      onClick={onOpenSessionModal}
                      className="text-[10px] font-bold text-cyan-700 hover:text-cyan-800 inline-flex items-center gap-0.5 cursor-pointer"
                      title="Ganti PT / Periode MCU"
                    >
                      <RefreshCw className="w-2.5 h-2.5" />
                      Ubah
                    </button>
                  )}
                </div>

                <div>
                  <div className="font-extrabold text-slate-800 text-[11.5px] leading-tight truncate" title={session.selectedPt}>
                    {session.selectedPt === 'ALL' || !session.selectedPt
                      ? 'Semua Perusahaan'
                      : session.selectedPt}
                  </div>
                  <div className="text-[10px] text-cyan-800 font-semibold mt-0.5 flex items-center gap-1 truncate">
                    <Calendar className="w-2.5 h-2.5 shrink-0" />
                    <span className="truncate">
                      {!session.selectedPeriode || session.selectedPeriode === 'ALL'
                        ? 'Semua Periode'
                        : session.selectedPeriode}
                    </span>
                  </div>
                </div>

                <div className="pt-1 border-t border-slate-200/70 flex items-center justify-between text-[10px]">
                  <span className="text-slate-500 truncate max-w-[120px]">
                    {session.namaLengkap}
                  </span>
                  <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-white text-slate-700 border border-slate-200">
                    {session.role === 'admin' ? 'Admin' : 'Petugas'}
                  </span>
                </div>
              </div>
            )}

            {/* Desktop Collapse / Expand Button */}
            {onToggleCollapse && (
              <button
                type="button"
                onClick={onToggleCollapse}
                title={isCollapsed ? 'Perluas Sidebar' : 'Ciutkan Sidebar'}
                className="hidden lg:flex items-center justify-center w-full py-2 rounded-xl text-slate-500 hover:text-cyan-800 hover:bg-slate-100 transition-colors text-xs font-semibold gap-2 border border-slate-200/80 cursor-pointer"
              >
                {isCollapsed ? (
                  <ChevronRight className="w-4 h-4 text-slate-600" />
                ) : (
                  <>
                    <ChevronLeft className="w-4 h-4 text-slate-600" />
                    <span className="text-[11.5px]">Ciutkan Sidebar</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </aside>

      {/* DESKTOP SMART POPOVER (COLLISION DETECTION & DROPUP SUPPORT) */}
      {/* Tanpa scrollbar internal: seluruh item terlihat langsung dengan proporsional padding */}
      {activeFlyoutConfig && activeFlyoutConfig.subItems && popoverPos && (
        <div
          ref={popoverRef}
          onMouseEnter={cancelCloseDesktopFlyout}
          onMouseLeave={scheduleCloseDesktopFlyout}
          style={{
            position: 'fixed',
            top: `${popoverPos.top}px`,
            left: `${popoverPos.left}px`,
            width: `${popoverPos.width}px`,
            zIndex: 9999,
          }}
          className="hidden lg:block bg-white border border-slate-300/80 rounded-2xl shadow-2xl shadow-cyan-950/20 p-2.5 transition-all duration-150 animate-in fade-in zoom-in-95 overflow-visible"
        >
          {/* Header Popover with Collision & Orientation Badge */}
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-100 px-1">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-cyan-100 text-cyan-800 flex items-center justify-center font-bold text-xs">
                {activeFlyoutConfig.icon}
              </div>
              <div>
                <h4 className="text-xs font-extrabold text-slate-900 tracking-tight leading-tight">
                  {activeFlyoutConfig.subTitle || activeFlyoutConfig.label}
                </h4>
                <p className="text-[10px] text-slate-500 font-medium">
                  {activeFlyoutConfig.subItems.length} item langsung tersedia
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              {popoverPos.isDropup && (
                <span
                  className="px-1.5 py-0.5 rounded text-[9.5px] font-extrabold bg-amber-50 text-amber-700 border border-amber-200/80 flex items-center gap-0.5"
                  title="Otomatis berbalik ke atas (Dropup) karena batas bawah layar terdeteksi"
                >
                  <ArrowUpRight className="w-2.5 h-2.5" />
                  Dropup
                </span>
              )}
              <span className="px-1.5 py-0.5 rounded text-[9.5px] font-bold bg-cyan-50 text-cyan-800 border border-cyan-200">
                {activeFlyoutConfig.subBadge || `${activeFlyoutConfig.subItems.length} Menu`}
              </span>
              <button
                type="button"
                onClick={() => {
                  setActiveFlyoutModule(null);
                  setPopoverPos(null);
                }}
                className="p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer ml-1"
                title="Tutup Menu"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* CONTENT GRID / LIST:
              Untuk 9 item: disusun dalam 2 kolom ringkas dengan padding proporsional
              Tidak ada scrollbar internal sama sekali (semua langsung terlihat) */}
          <div
            className={
              activeFlyoutConfig.subItems.length >= 8
                ? 'grid grid-cols-2 gap-1.5'
                : 'space-y-1'
            }
          >
            {activeFlyoutConfig.subItems.map((sub) => (
              <button
                key={sub.id}
                type="button"
                onClick={() => handleSubItemClick(sub.action)}
                className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl text-[11.5px] font-semibold transition-all text-left cursor-pointer group/item ${
                  sub.isActive
                    ? 'bg-gradient-to-r from-cyan-600 to-teal-700 text-white font-bold shadow-xs'
                    : 'text-slate-700 hover:bg-cyan-50/70 hover:text-cyan-900 border border-transparent hover:border-cyan-200/70'
                }`}
              >
                <div className="flex items-center gap-2 min-w-0">
                  {sub.num !== undefined && (
                    <span
                      className={`w-4 h-4 rounded-md flex items-center justify-center text-[10px] font-mono font-black shrink-0 ${
                        sub.isActive
                          ? 'bg-white text-cyan-800 shadow-2xs'
                          : 'bg-slate-100 text-slate-600 group-hover/item:bg-cyan-100 group-hover/item:text-cyan-800'
                      }`}
                    >
                      {sub.num}
                    </span>
                  )}
                  <span className="shrink-0">{sub.icon}</span>
                  <span className="truncate leading-tight">{sub.label}</span>
                </div>

                {sub.badge && (
                  <span
                    className={`text-[9px] px-1.5 py-0.2 rounded font-bold shrink-0 ml-1 ${
                      sub.isActive
                        ? 'bg-cyan-800 text-white'
                        : 'bg-slate-100 text-slate-500 group-hover/item:bg-white group-hover/item:text-cyan-800 border border-slate-200/60'
                    }`}
                  >
                    {sub.badge}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Bottom helper tip */}
          <div className="mt-2 pt-1.5 border-t border-slate-100 px-1 flex items-center justify-between text-[9.5px] text-slate-400">
            <span>Klik item untuk buka langsung</span>
            <span>Tekan Esc untuk tutup</span>
          </div>
        </div>
      )}
    </>
  );
};
