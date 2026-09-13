import React, { useState, useEffect, useRef } from 'react';
import { Page, UserSession, AttendanceRecord, Company, MCUPackage } from '../types';
import {
  Building2,
  Calendar,
  LogOut,
  RefreshCw,
  Search,
  Bell,
  Plus,
  Menu,
  Clock,
  Users,
  CheckCircle2,
  ChevronDown,
  FileText,
  Tag,
  Stethoscope,
  X,
  SlidersHorizontal,
  Home,
  UserPlus,
  Settings,
  BarChart3,
  User,
  ExternalLink,
  Package,
} from 'lucide-react';

interface TopNavbarProps {
  currentPage: Page;
  onSelectPage: (page: Page) => void;
  subTitle?: string;
  attendanceList?: AttendanceRecord[];
  companies?: Company[];
  session?: UserSession | null;
  onUpdateSession?: (newSession: UserSession) => void;
  onOpenSessionModal?: () => void;
  onLogout?: () => void;
  onToggleMobileSidebar?: () => void;
  onSelectPatient?: (mcuNo: string) => void;
  onOpenThermalModal?: () => void;
  selectedPackageCode?: string;
  onSelectPackageCode?: (code: string) => void;
  packages?: MCUPackage[];
  isCloudConnected?: boolean;
}

export const TopNavbar: React.FC<TopNavbarProps> = ({
  currentPage,
  onSelectPage,
  subTitle,
  attendanceList = [],
  companies = [],
  session,
  onUpdateSession,
  onOpenSessionModal,
  onLogout,
  onToggleMobileSidebar,
  onSelectPatient,
  onOpenThermalModal,
  selectedPackageCode = 'ALL',
  onSelectPackageCode,
  packages = [],
  isCloudConnected = true,
}) => {
  // Live digital clock
  const [timeStr, setTimeStr] = useState<string>('');
  const [dateStr, setDateStr] = useState<string>('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimeStr(
        now.toLocaleTimeString('id-ID', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        }) + ' WIB'
      );
      setDateStr(
        now.toLocaleDateString('id-ID', {
          weekday: 'short',
          day: 'numeric',
          month: 'short',
          year: 'numeric',
        })
      );
    };
    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  // Dropdown / Popover states
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isQuickActionsOpen, setIsQuickActionsOpen] = useState(false);
  const [isPtDropdownOpen, setIsPtDropdownOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  // Quick switch PT / Periode state within dropdown
  const [tempPt, setTempPt] = useState(session?.selectedPt || 'ALL');
  const [tempPeriode, setTempPeriode] = useState(session?.selectedPeriode || 'ALL');

  useEffect(() => {
    if (session) {
      setTempPt(session.selectedPt || 'ALL');
      setTempPeriode(session.selectedPeriode || 'ALL');
    }
  }, [session]);

  // Click outside to close dropdowns
  const searchRef = useRef<HTMLDivElement>(null);
  const quickActionRef = useRef<HTMLDivElement>(null);
  const ptDropdownRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setIsSearchOpen(false);
      }
      if (quickActionRef.current && !quickActionRef.current.contains(e.target as Node)) {
        setIsQuickActionsOpen(false);
      }
      if (ptDropdownRef.current && !ptDropdownRef.current.contains(e.target as Node)) {
        setIsPtDropdownOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setIsNotifOpen(false);
      }
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setIsProfileOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Real-time metrics
  const totalCount = attendanceList.length;
  const hadirCount = attendanceList.filter((p) => p.status === 'Hadir').length;
  const hadirPercentage = totalCount > 0 ? Math.round((hadirCount / totalCount) * 100) : 0;

  // Search results
  const searchResults = searchQuery.trim()
    ? attendanceList
        .filter((item) => {
          const q = searchQuery.toLowerCase();
          return (
            item.nama.toLowerCase().includes(q) ||
            item.mcuNo.toLowerCase().includes(q) ||
            item.pt.toLowerCase().includes(q) ||
            (item.dept && item.dept.toLowerCase().includes(q))
          );
        })
        .slice(0, 6)
    : [];

  // Notifications mock dynamic feed
  const [notifications, setNotifications] = useState([
    {
      id: 1,
      title: 'Sinkronisasi Otomatis',
      desc: 'Master Saran Medis & Parameter Lab aktif tersinkronisasi.',
      time: 'Baru saja',
      unread: true,
    },
    {
      id: 2,
      title: 'Kehadiran Terkini',
      desc: `${hadirCount} dari ${totalCount} peserta telah terverifikasi hadir.`,
      time: '5 menit lalu',
      unread: true,
    },
    {
      id: 3,
      title: 'Printer Thermal',
      desc: 'Pengaturan label thermal barcode 50x30 siap digunakan.',
      time: '15 menit lalu',
      unread: false,
    },
  ]);

  const unreadNotifCount = notifications.filter((n) => n.unread).length;

  const markAllNotifRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, unread: false })));
  };

  const handleApplyPtPeriode = (newPt: string, newPeriode: string) => {
    if (session && onUpdateSession) {
      const updated: UserSession = {
        ...session,
        selectedPt: newPt,
        selectedPeriode: newPeriode,
      };
      onUpdateSession(updated);
      setIsPtDropdownOpen(false);
    } else if (onOpenSessionModal) {
      onOpenSessionModal();
      setIsPtDropdownOpen(false);
    }
  };

  const getPageInfo = () => {
    switch (currentPage) {
      case 'dashboard':
        return { label: 'Dashboard', icon: <Home className="w-4 h-4 text-cyan-600" /> };
      case 'registrasi':
        return { label: 'Registrasi Pasien & Onsite', icon: <UserPlus className="w-4 h-4 text-cyan-600" /> };
      case 'master':
        return { label: 'Master Data Konfigurasi', icon: <Settings className="w-4 h-4 text-cyan-600" /> };
      case 'medical':
        return { label: 'Medical Record Pemeriksaan', icon: <Stethoscope className="w-4 h-4 text-cyan-600" /> };
      case 'laporan':
        return { label: 'Cetak & Laporan MCU', icon: <BarChart3 className="w-4 h-4 text-cyan-600" /> };
      default:
        return { label: 'Dashboard', icon: <Home className="w-4 h-4 text-cyan-600" /> };
    }
  };

  const pageInfo = getPageInfo();

  const getRoleShortBadge = (role?: string) => {
    switch (role) {
      case 'admin':
        return { label: 'Admin MCU', color: 'bg-teal-100 text-teal-800 border-teal-200' };
      case 'dokter_okupasi':
        return { label: 'Dokter Sp.Ok', color: 'bg-purple-100 text-purple-800 border-purple-200' };
      case 'dokter_pemeriksa':
        return { label: 'Dokter Pemeriksa', color: 'bg-blue-100 text-blue-800 border-blue-200' };
      case 'petugas_registrasi':
        return { label: 'Registrasi', color: 'bg-cyan-100 text-cyan-800 border-cyan-200' };
      case 'petugas_lab':
        return { label: 'Analis Lab', color: 'bg-amber-100 text-amber-800 border-amber-200' };
      case 'pic_perusahaan':
        return { label: 'PIC Perusahaan', color: 'bg-indigo-100 text-indigo-800 border-indigo-200' };
      default:
        return { label: 'User MCU', color: 'bg-slate-100 text-slate-800 border-slate-200' };
    }
  };

  const roleInfo = getRoleShortBadge(session?.role);

  return (
    <header className="h-[54px] sm:h-[58px] bg-white/95 backdrop-blur-md border-b border-[#E2E8F0] flex items-center justify-between px-3 sm:px-5 sticky top-0 z-30 gap-2.5">
      {/* LEFT SECTION: Mobile Toggle, Dynamic Breadcrumbs & Page Indicator */}
      <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
        {/* Mobile Sidebar Hamburger */}
        {onToggleMobileSidebar && (
          <button
            onClick={onToggleMobileSidebar}
            className="p-2 -ml-1 text-slate-600 hover:text-cyan-700 hover:bg-slate-100 rounded-xl lg:hidden transition-colors"
            title="Buka Menu"
          >
            <Menu className="w-5 h-5" />
          </button>
        )}

        {/* Dynamic Breadcrumbs */}
        <div className="flex items-center gap-2 text-xs sm:text-[13px] font-semibold text-slate-500 overflow-hidden">
          <button
            onClick={() => onSelectPage('dashboard')}
            className="hover:text-cyan-700 transition-colors flex items-center gap-1.5 shrink-0"
            title="Kembali ke Dashboard"
          >
            <span className="font-extrabold text-[#0E7490]">SIMREG</span>
          </button>
          <span className="text-slate-300 font-bold">/</span>

          <div className="flex items-center gap-1.5 min-w-0 font-bold text-slate-800 truncate">
            {pageInfo.icon}
            <span className="truncate">{subTitle || pageInfo.label}</span>
          </div>
        </div>

        {/* Real-time Attendance Mini Ticker (Hidden on small mobile) */}
        {totalCount > 0 && (
          <div className="hidden xl:flex items-center gap-2 ml-2 pl-3 border-l border-slate-200 text-xs">
            <div className="flex items-center gap-1.5 bg-emerald-50 border border-emerald-200/80 px-2.5 py-1 rounded-full text-emerald-800 font-bold">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>
                {hadirCount}/{totalCount} Hadir
              </span>
              <span className="text-[10.5px] font-normal text-emerald-600">
                ({hadirPercentage}%)
              </span>
            </div>
          </div>
        )}
      </div>

      {/* CENTER / SEARCH BAR: Global Dynamic Patient Finder */}
      <div className="hidden md:flex flex-1 max-w-xs lg:max-w-sm relative" ref={searchRef}>
        <div className="relative w-full">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setIsSearchOpen(true);
            }}
            onFocus={() => setIsSearchOpen(true)}
            placeholder="Cari No. MCU, Pasien, PT..."
            className="w-full pl-9 pr-8 py-1.5 bg-slate-100/90 hover:bg-slate-100 focus:bg-white text-xs text-slate-800 placeholder:text-slate-400 font-medium rounded-xl border border-transparent focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/10 focus:outline-none transition-all shadow-2xs"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          {searchQuery && (
            <button
              onClick={() => {
                setSearchQuery('');
                setIsSearchOpen(false);
              }}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Search Results Dropdown */}
        {isSearchOpen && searchQuery.trim() !== '' && (
          <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden z-50 text-xs animate-in fade-in zoom-in-95 duration-150">
            <div className="p-2.5 bg-slate-50 border-b border-slate-100 flex items-center justify-between text-[11px] text-slate-500 font-bold uppercase tracking-wider">
              <span>Hasil Pencarian Pasien ({searchResults.length})</span>
              <span className="text-[10px] text-cyan-700 lowercase font-normal">Tekan hasil untuk buka data</span>
            </div>

            {searchResults.length === 0 ? (
              <div className="p-6 text-center text-slate-400">
                <Users className="w-6 h-6 mx-auto mb-1.5 opacity-40" />
                <p className="font-semibold text-slate-600">Pasien tidak ditemukan</p>
                <p className="text-[11px] mt-0.5">Coba cari dengan nama lain, PT, atau No. MCU</p>
              </div>
            ) : (
              <div className="max-h-72 overflow-y-auto divide-y divide-slate-100">
                {searchResults.map((item) => (
                  <div
                    key={item.mcuNo}
                    className="p-3 hover:bg-cyan-50/50 transition-colors flex items-center justify-between gap-2 cursor-pointer group"
                    onClick={() => {
                      if (onSelectPatient) onSelectPatient(item.mcuNo);
                      onSelectPage('medical');
                      setIsSearchOpen(false);
                      setSearchQuery('');
                    }}
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-cyan-800 text-[11px] bg-cyan-100/70 px-1.5 py-0.2 rounded">
                          {item.mcuNo}
                        </span>
                        <span className="font-bold text-slate-800 truncate group-hover:text-cyan-800">
                          {item.nama}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5 truncate">
                        {item.pt} • {item.dept || 'Umum'} • {item.paket}
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <span
                        className={`px-2 py-0.5 text-[10px] font-bold rounded-full border ${
                          item.status === 'Hadir'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : 'bg-slate-100 text-slate-600 border-slate-200'
                        }`}
                      >
                        {item.status}
                      </span>
                      <ExternalLink className="w-3.5 h-3.5 text-slate-400 group-hover:text-cyan-700" />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* RIGHT CONTROLS: Clock, PT/Periode Switcher, Quick Actions, Notifications, Profile */}
      <div className="flex items-center gap-2 sm:gap-2.5">
        {/* Firebase Firestore Realtime Badge */}
        <div
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-semibold border transition-all ${
            isCloudConnected
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
              : 'bg-amber-50 text-amber-800 border-amber-200'
          }`}
          title={
            isCloudConnected
              ? 'Firebase Firestore Realtime Aktif - Seluruh data MCU tersinkronisasi otomatis antar klien & stasiun'
              : 'Menghubungkan ke Firebase Cloud...'
          }
        >
          <span
            className={`w-2 h-2 rounded-full ${
              isCloudConnected ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'
            }`}
          />
          <span className="text-[11px] font-bold hidden sm:inline">
            {isCloudConnected ? 'Firebase Realtime' : 'Menghubungkan...'}
          </span>
        </div>

        {/* Dynamic Digital Clock */}
        <div className="hidden 2xl:flex items-center gap-1.5 px-3 py-1 bg-slate-50 border border-slate-200/80 rounded-xl text-slate-700 text-xs font-semibold">
          <Clock className="w-3.5 h-3.5 text-cyan-700" />
          <span>{dateStr}</span>
          <span className="text-slate-300">•</span>
          <span className="font-mono font-bold text-cyan-900">{timeStr}</span>
        </div>

        {/* Dynamic PT & Periode Quick Switcher Dropdown */}
        <div className="relative" ref={ptDropdownRef}>
          <button
            onClick={() => setIsPtDropdownOpen(!isPtDropdownOpen)}
            className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200/80 border border-slate-200 text-slate-800 text-xs font-semibold transition-all shadow-2xs cursor-pointer"
            title="Klik untuk ganti Lingkup MCU (PT & Periode)"
          >
            <Building2 className="w-3.5 h-3.5 text-cyan-700 shrink-0" />
            <div className="text-left hidden sm:block max-w-[130px] lg:max-w-[180px] truncate leading-tight">
              <span className="block font-bold text-[#0F172A] truncate">
                {session?.selectedPt === 'ALL' || !session?.selectedPt
                  ? 'Semua Perusahaan'
                  : session.selectedPt}
              </span>
              <span className="block text-[10px] text-cyan-700 truncate font-normal">
                {!session?.selectedPeriode || session?.selectedPeriode === 'ALL'
                  ? 'Semua Periode'
                  : `Periode: ${session.selectedPeriode}`}
              </span>
            </div>
            <ChevronDown className="w-3 h-3 text-slate-500 shrink-0" />
          </button>

          {/* Quick PT Switcher Popover */}
          {isPtDropdownOpen && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-slate-200 p-4 z-50 animate-in fade-in zoom-in-95 duration-150">
              <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100">
                <div className="flex items-center gap-1.5">
                  <SlidersHorizontal className="w-4 h-4 text-cyan-700" />
                  <span className="text-xs font-bold text-slate-800">
                    Ganti Lingkup MCU Cepat
                  </span>
                </div>
                {onOpenSessionModal && (
                  <button
                    onClick={() => {
                      setIsPtDropdownOpen(false);
                      onOpenSessionModal();
                    }}
                    className="text-[11px] font-bold text-cyan-700 hover:underline inline-flex items-center gap-1"
                  >
                    <span>Lengkap</span>
                    <ExternalLink className="w-3 h-3" />
                  </button>
                )}
              </div>

              {/* PT Selector */}
              <div className="space-y-2">
                <label className="text-[11px] font-bold text-slate-600 block uppercase tracking-wider">
                  Pilih Perusahaan (PT)
                </label>
                <div className="max-h-40 overflow-y-auto space-y-1 pr-1">
                  <button
                    type="button"
                    onClick={() => setTempPt('ALL')}
                    className={`w-full text-left px-3 py-2 rounded-xl text-xs font-medium transition-colors flex items-center justify-between ${
                      tempPt === 'ALL'
                        ? 'bg-cyan-50 text-cyan-900 font-bold border border-cyan-200'
                        : 'hover:bg-slate-50 text-slate-700 border border-transparent'
                    }`}
                  >
                    <span>🏢 Semua Perusahaan (Terbuka Penuh)</span>
                    {tempPt === 'ALL' && <CheckCircle2 className="w-3.5 h-3.5 text-cyan-700" />}
                  </button>

                  {companies.map((comp) => (
                    <button
                      key={comp.id}
                      type="button"
                      onClick={() => setTempPt(comp.nama)}
                      className={`w-full text-left px-3 py-2 rounded-xl text-xs font-medium transition-colors flex items-center justify-between ${
                        tempPt === comp.nama
                          ? 'bg-cyan-50 text-cyan-900 font-bold border border-cyan-200'
                          : 'hover:bg-slate-50 text-slate-700 border border-transparent'
                      }`}
                    >
                      <span className="truncate pr-2">{comp.nama}</span>
                      {tempPt === comp.nama && (
                        <CheckCircle2 className="w-3.5 h-3.5 text-cyan-700 shrink-0" />
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Periode Selector */}
              <div className="mt-3 pt-3 border-t border-slate-100">
                <label className="text-[11px] font-bold text-slate-600 block mb-1 uppercase tracking-wider">
                  Filter Periode / Tanggal MCU
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={tempPeriode}
                    onChange={(e) => setTempPeriode(e.target.value)}
                    placeholder="Contoh: 2026-09 atau ALL"
                    className="flex-1 px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:border-cyan-500 focus:outline-none font-medium"
                  />
                  <button
                    type="button"
                    onClick={() => setTempPeriode('ALL')}
                    className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 rounded-xl text-[11px] font-bold text-slate-700 border border-slate-200 shrink-0"
                    title="Buka semua periode"
                  >
                    Semua
                  </button>
                </div>
                <p className="text-[10px] text-slate-400 mt-1">
                  Ketik <b>ALL</b> agar seluruh tanggal MCU terbuka.
                </p>
              </div>

              {/* Action Apply */}
              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsPtDropdownOpen(false)}
                  className="px-3 py-1.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={() => handleApplyPtPeriode(tempPt, tempPeriode)}
                  className="px-4 py-1.5 rounded-xl text-xs font-bold bg-[#0E7490] hover:bg-[#0891B2] text-white shadow-xs"
                >
                  Terapkan Lingkup
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Dynamic Quick Actions ("+ Aksi Cepat") atau Pilihan Kode Paket pada Modul Master Data */}
        {currentPage === 'master' ? (
          <div className="relative" ref={quickActionRef}>
            <button
              onClick={() => setIsQuickActionsOpen(!isQuickActionsOpen)}
              id="btn-navbar-kode-paket"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-750 hover:to-amber-850 text-white text-xs font-bold transition-all shadow-xs cursor-pointer border border-amber-500/40"
              title="Pilih Kode Paket untuk Pengaturan Parameter Pemeriksaan"
            >
              <Package className="w-3.5 h-3.5 stroke-[2.5] text-amber-200 shrink-0" />
              <span className="text-amber-100 font-medium hidden md:inline">Kode Paket:</span>
              <span className="font-extrabold truncate max-w-[120px] text-white">
                {selectedPackageCode === 'ALL' || !selectedPackageCode ? 'Semua Paket' : selectedPackageCode}
              </span>
              <ChevronDown className="w-3 h-3 text-amber-200" />
            </button>

            {isQuickActionsOpen && (
              <div className="absolute right-0 mt-2 w-72 bg-white rounded-2xl shadow-xl border border-slate-200 p-2 z-50 animate-in fade-in zoom-in-95 duration-150">
                <div className="px-3 py-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 flex items-center justify-between">
                  <span>Pilih Kode Paket Master</span>
                  <span className="text-[10px] font-semibold text-amber-600">Setting Parameter</span>
                </div>
                <div className="py-1 space-y-0.5 max-h-64 overflow-y-auto">
                  <button
                    onClick={() => {
                      if (onSelectPackageCode) onSelectPackageCode('ALL');
                      setIsQuickActionsOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-colors text-left ${
                      selectedPackageCode === 'ALL' || !selectedPackageCode
                        ? 'bg-amber-50 text-amber-900 font-bold border border-amber-200'
                        : 'text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center font-bold text-[10px]">
                        ALL
                      </div>
                      <div>
                        <div className="font-bold text-slate-900">Semua Paket (Global)</div>
                        <div className="text-[10px] text-slate-400 font-normal">Tampilkan seluruh parameter</div>
                      </div>
                    </div>
                    {(selectedPackageCode === 'ALL' || !selectedPackageCode) && (
                      <CheckCircle2 className="w-4 h-4 text-amber-600 shrink-0" />
                    )}
                  </button>

                  {packages.map((pkg) => {
                    const isSelected = selectedPackageCode === pkg.kode;
                    return (
                      <button
                        key={pkg.id}
                        onClick={() => {
                          if (onSelectPackageCode) onSelectPackageCode(pkg.kode);
                          setIsQuickActionsOpen(false);
                        }}
                        className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-colors text-left ${
                          isSelected
                            ? 'bg-amber-50 text-amber-900 font-bold border border-amber-200'
                            : 'text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center font-mono font-bold text-[10px] border border-slate-200 shrink-0">
                            {pkg.kode.substring(0, 3)}
                          </div>
                          <div className="truncate max-w-[170px]">
                            <div className="font-bold text-slate-800 flex items-center gap-1">
                              <span className="text-amber-700 font-mono">{pkg.kode}</span>
                            </div>
                            <div className="text-[10px] text-slate-500 truncate">{pkg.perusahaan || pkg.nama}</div>
                          </div>
                        </div>
                        {isSelected && <CheckCircle2 className="w-4 h-4 text-amber-600 shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="relative" ref={quickActionRef}>
            <button
              onClick={() => setIsQuickActionsOpen(!isQuickActionsOpen)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-[#0E7490] to-[#0284C7] hover:from-[#0891B2] hover:to-[#0369A1] text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
              title="Aksi Cepat"
            >
              <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
              <span className="hidden sm:inline">Aksi Cepat</span>
              <ChevronDown className="w-3 h-3 opacity-80" />
            </button>

            {isQuickActionsOpen && (
              <div className="absolute right-0 mt-2 w-60 bg-white rounded-2xl shadow-xl border border-slate-200 p-2 z-50 animate-in fade-in zoom-in-95 duration-150">
                <div className="px-3 py-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100">
                  Pintas Aksi Sistem
                </div>
                <div className="py-1 space-y-0.5">
                  <button
                    onClick={() => {
                      onSelectPage('registrasi');
                      setIsQuickActionsOpen(false);
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs text-slate-700 hover:bg-cyan-50 hover:text-cyan-900 font-semibold transition-colors text-left"
                  >
                    <UserPlus className="w-4 h-4 text-cyan-600 shrink-0" />
                    <span>+ Registrasi Pasien Baru</span>
                  </button>

                  {onOpenThermalModal && (
                    <button
                      onClick={() => {
                        onOpenThermalModal();
                        setIsQuickActionsOpen(false);
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs text-slate-700 hover:bg-cyan-50 hover:text-cyan-900 font-semibold transition-colors text-left"
                    >
                      <Tag className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>Cetak Label Barcode Thermal</span>
                    </button>
                  )}

                  <button
                    onClick={() => {
                      onSelectPage('medical');
                      setIsQuickActionsOpen(false);
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs text-slate-700 hover:bg-cyan-50 hover:text-cyan-900 font-semibold transition-colors text-left"
                  >
                    <Stethoscope className="w-4 h-4 text-purple-600 shrink-0" />
                    <span>Input Hasil Medical Record</span>
                  </button>

                  <button
                    onClick={() => {
                      onSelectPage('laporan');
                      setIsQuickActionsOpen(false);
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs text-slate-700 hover:bg-cyan-50 hover:text-cyan-900 font-semibold transition-colors text-left"
                  >
                    <FileText className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>Rekap Laporan &amp; Sertifikat</span>
                  </button>

                  <button
                    onClick={() => {
                      onSelectPage('master');
                      setIsQuickActionsOpen(false);
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs text-slate-700 hover:bg-cyan-50 hover:text-cyan-900 font-semibold transition-colors text-left"
                  >
                    <Settings className="w-4 h-4 text-slate-600 shrink-0" />
                    <span>Setting Master Pemeriksaan</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Dynamic Notifications Bell */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => setIsNotifOpen(!isNotifOpen)}
            className="p-2 rounded-xl text-slate-500 hover:text-cyan-700 hover:bg-slate-100 transition-colors relative cursor-pointer"
            title="Notifikasi &amp; Aktivitas"
          >
            <Bell className="w-4 h-4" />
            {unreadNotifCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-500 ring-2 ring-white" />
            )}
          </button>

          {isNotifOpen && (
            <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-150">
              <div className="p-3 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800">
                  Aktivitas &amp; Notifikasi
                </span>
                {unreadNotifCount > 0 && (
                  <button
                    onClick={markAllNotifRead}
                    className="text-[10px] font-bold text-cyan-700 hover:underline"
                  >
                    Tandai dibaca
                  </button>
                )}
              </div>

              <div className="divide-y divide-slate-100 max-h-72 overflow-y-auto">
                {notifications.map((n) => (
                  <div
                    key={n.id}
                    className={`p-3 text-xs transition-colors hover:bg-slate-50 ${
                      n.unread ? 'bg-cyan-50/30' : ''
                    }`}
                  >
                    <div className="flex items-center justify-between font-bold text-slate-800">
                      <span>{n.title}</span>
                      <span className="text-[10px] text-slate-400 font-normal">
                        {n.time}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-600 mt-1 leading-relaxed">
                      {n.desc}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Dynamic User Profile & Popover Menu */}
        <div className="relative pl-1 border-l border-slate-200" ref={profileRef}>
          <button
            onClick={() => setIsProfileOpen(!isProfileOpen)}
            className="flex items-center gap-2 p-1 sm:px-2 sm:py-1 rounded-full hover:bg-slate-100 transition-colors cursor-pointer"
            title="Profil Pengguna"
          >
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#0E7490] to-[#38BDF8] text-white text-xs font-bold flex items-center justify-center shadow-xs">
              {session?.username ? session.username.charAt(0).toUpperCase() : 'A'}
            </div>
            <div className="text-left hidden lg:block">
              <span className="text-[#0F172A] text-xs font-bold block leading-tight truncate max-w-[110px]">
                {session?.namaLengkap || 'Admin MCU'}
              </span>
              <span className="text-[10px] text-slate-500 font-medium block">
                {roleInfo.label}
              </span>
            </div>
            <ChevronDown className="w-3 h-3 text-slate-400 hidden sm:block" />
          </button>

          {isProfileOpen && (
            <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-xl border border-slate-200 p-3 z-50 animate-in fade-in zoom-in-95 duration-150">
              <div className="p-2 border-b border-slate-100 flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#0E7490] to-[#38BDF8] text-white font-black text-sm flex items-center justify-center shadow-md">
                  {session?.username ? session.username.charAt(0).toUpperCase() : 'A'}
                </div>
                <div className="min-w-0">
                  <h4 className="font-extrabold text-xs text-slate-800 truncate">
                    {session?.namaLengkap || 'Admin SIMREG'}
                  </h4>
                  <div className="text-[10.5px] text-slate-500 font-mono truncate">
                    @{session?.username || 'admin'}
                  </div>
                  <span
                    className={`inline-block text-[9.5px] font-bold px-2 py-0.2 rounded-full border mt-1 ${roleInfo.color}`}
                  >
                    {roleInfo.label}
                  </span>
                </div>
              </div>

              <div className="p-2 bg-slate-50 rounded-xl mb-2 text-[11px] space-y-1">
                <div className="text-slate-500 flex items-center justify-between">
                  <span>Lingkup PT:</span>
                  <span className="font-bold text-slate-800 truncate max-w-[120px]">
                    {session?.selectedPt || 'Semua PT'}
                  </span>
                </div>
                <div className="text-slate-500 flex items-center justify-between">
                  <span>Periode:</span>
                  <span className="font-bold text-cyan-800 truncate max-w-[120px]">
                    {session?.selectedPeriode || 'Semua Periode'}
                  </span>
                </div>
              </div>

              <div className="space-y-1 pt-1 border-t border-slate-100">
                {onOpenSessionModal && (
                  <button
                    onClick={() => {
                      setIsProfileOpen(false);
                      onOpenSessionModal();
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-colors text-left"
                  >
                    <RefreshCw className="w-3.5 h-3.5 text-cyan-700" />
                    <span>Ganti Lingkup MCU / Akun</span>
                  </button>
                )}

                {onLogout && (
                  <button
                    onClick={() => {
                      setIsProfileOpen(false);
                      onLogout();
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-rose-600 hover:bg-rose-50 transition-colors text-left"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Keluar / Selesai Sesi</span>
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
