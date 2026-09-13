import React, { useState } from 'react';
import {
  Users,
  Activity,
  CheckCircle2,
  AlertCircle,
  UserPlus,
  Settings,
  HeartPulse,
  BarChart3,
  ArrowRight,
  ClipboardCheck,
  Search,
  ChevronRight,
} from 'lucide-react';
import { Page, AttendanceRecord } from '../types';

interface DashboardViewProps {
  onNavigate: (page: Page) => void;
  patientCount?: number;
  mcuCount?: number;
  completedCount?: number;
  followUpCount?: number;
  attendanceList?: AttendanceRecord[];
  onToggleAttendance?: (mcuNo: string) => void;
  onSelectPatient?: (mcuNo: string) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  onNavigate,
  patientCount = 0,
  mcuCount = 0,
  completedCount = 0,
  followUpCount = 0,
  attendanceList = [],
  onToggleAttendance,
  onSelectPatient,
}) => {
  const [filterTab, setFilterTab] = useState<'ALL' | 'Hadir' | 'Belum Hadir'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredList = attendanceList.filter((p) => {
    const matchStatus = filterTab === 'ALL' || p.status === filterTab;
    const matchSearch =
      searchQuery === '' ||
      p.nama.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.mcuNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.pt.toLowerCase().includes(searchQuery.toLowerCase());
    return matchStatus && matchSearch;
  });

  return (
    <div className="space-y-3.5 sm:space-y-4">
      {/* Hero Welcome Banner - Compact & Ergonomic */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#0E7490] via-[#0891B2] to-[#0284C7] p-3.5 sm:p-4.5 text-white shadow-md shadow-cyan-900/10">
        <div className="absolute -top-16 -right-16 w-48 h-48 rounded-full bg-white/10 blur-xl pointer-events-none" />
        <div className="absolute -bottom-10 right-36 w-40 h-40 rounded-full bg-cyan-300/20 blur-lg pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/15 backdrop-blur-md border border-white/20 text-[11px] font-semibold text-white tracking-wide mb-1.5 shadow-2xs">
              <span className="relative flex h-1.5 w-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-400"></span>
              </span>
              Sistem Aktif &amp; Terintegrasi Realtime
            </div>

            <h2 className="text-[17px] sm:text-[19px] font-extrabold text-white tracking-tight leading-snug">
              Selamat Datang di SIMREG Medical Check Up
            </h2>
            <p className="text-[12px] sm:text-[12.5px] text-white/85 leading-relaxed font-normal mt-0.5">
              Pusat kendali registrasi peserta, konfigurasi parameter klinis, rekam medis okupasi, serta otomasi penerbitan laporan hasil MCU.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => onNavigate('registrasi')}
              className="px-3 py-1.5 rounded-xl bg-white text-[#0E7490] hover:bg-cyan-50 font-bold text-xs shadow-xs transition-colors flex items-center gap-1 cursor-pointer"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Registrasi Baru</span>
            </button>
            <button
              onClick={() => onNavigate('medical')}
              className="px-3 py-1.5 rounded-xl bg-cyan-900/40 hover:bg-cyan-900/60 text-white border border-white/25 font-bold text-xs transition-colors flex items-center gap-1 cursor-pointer"
            >
              <HeartPulse className="w-3.5 h-3.5" />
              <span>Input MCU</span>
            </button>
          </div>
        </div>
      </div>

      {/* 4 KPI Metrics - Compact Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3.5">
        {/* Pasien Hari Ini */}
        <div className="bg-white border border-[#E2E8F0] rounded-xl p-3 sm:p-3.5 shadow-2xs flex items-center justify-between hover:shadow-xs transition-all">
          <div>
            <span className="text-[11.5px] font-semibold text-[#64748B] block">
              Total Peserta MCU
            </span>
            <strong className="text-[22px] sm:text-[24px] font-black text-[#0F172A] tracking-tight block mt-0.5">
              {patientCount}
            </strong>
          </div>
          <div className="w-9 h-9 rounded-lg bg-[#F0F9FF] text-[#0284C7] flex items-center justify-center shrink-0">
            <Users className="w-4.5 h-4.5" />
          </div>
        </div>

        {/* MCU Hadir */}
        <div className="bg-white border border-[#E2E8F0] rounded-xl p-3 sm:p-3.5 shadow-2xs flex items-center justify-between hover:shadow-xs transition-all">
          <div>
            <span className="text-[11.5px] font-semibold text-[#64748B] block">
              Peserta Hadir
            </span>
            <strong className="text-[22px] sm:text-[24px] font-black text-emerald-700 tracking-tight block mt-0.5">
              {mcuCount}
            </strong>
          </div>
          <div className="w-9 h-9 rounded-lg bg-[#ECFDF5] text-[#059669] flex items-center justify-center shrink-0">
            <Activity className="w-4.5 h-4.5" />
          </div>
        </div>

        {/* MCU Selesai */}
        <div className="bg-white border border-[#E2E8F0] rounded-xl p-3 sm:p-3.5 shadow-2xs flex items-center justify-between hover:shadow-xs transition-all">
          <div>
            <span className="text-[11.5px] font-semibold text-[#64748B] block">
              Pemeriksaan Selesai
            </span>
            <strong className="text-[22px] sm:text-[24px] font-black text-indigo-700 tracking-tight block mt-0.5">
              {completedCount}
            </strong>
          </div>
          <div className="w-9 h-9 rounded-lg bg-[#EEF2FF] text-[#4F46E5] flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-4.5 h-4.5" />
          </div>
        </div>

        {/* Perlu Follow Up / Belum Hadir */}
        <div className="bg-white border border-[#E2E8F0] rounded-xl p-3 sm:p-3.5 shadow-2xs flex items-center justify-between hover:shadow-xs transition-all">
          <div>
            <span className="text-[11.5px] font-semibold text-[#64748B] block">
              Belum Hadir
            </span>
            <strong className="text-[22px] sm:text-[24px] font-black text-amber-700 tracking-tight block mt-0.5">
              {followUpCount}
            </strong>
          </div>
          <div className="w-9 h-9 rounded-lg bg-[#FFFBEB] text-[#D97706] flex items-center justify-center shrink-0">
            <AlertCircle className="w-4.5 h-4.5" />
          </div>
        </div>
      </div>

      {/* 4 Main Action Cards - Compact & Ergonomic */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3.5">
        {/* Registrasi */}
        <div
          onClick={() => onNavigate('registrasi')}
          className="group cursor-pointer bg-white border border-[#E2E8F0] rounded-xl p-3.5 sm:p-4 shadow-2xs hover:shadow-md hover:border-[#A5F3FC] hover:-translate-y-0.5 transition-all duration-200 flex flex-col"
        >
          <div className="flex items-center justify-between mb-2">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#E0F2FE] to-[#BAE6FD] text-[#0284C7] flex items-center justify-center group-hover:scale-105 transition-transform">
              <UserPlus className="w-4.5 h-4.5" />
            </div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider group-hover:text-cyan-700">MODUL 1</span>
          </div>
          <h3 className="text-[14px] font-bold text-[#0F172A] tracking-tight mb-1">
            REGISTRASI
          </h3>
          <p className="text-[11.5px] text-[#64748B] leading-snug mb-2.5 line-clamp-2">
            Pendaftaran peserta umum &amp; impor massal peserta MCU onsite.
          </p>
          <div className="mt-auto pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] font-bold text-[#0E7490]">
            <span>Buka Registrasi</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
          </div>
        </div>

        {/* Master */}
        <div
          onClick={() => onNavigate('master')}
          className="group cursor-pointer bg-white border border-[#E2E8F0] rounded-xl p-3.5 sm:p-4 shadow-2xs hover:shadow-md hover:border-[#A5F3FC] hover:-translate-y-0.5 transition-all duration-200 flex flex-col"
        >
          <div className="flex items-center justify-between mb-2">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#F1F5F9] to-[#E2E8F0] text-[#334155] flex items-center justify-center group-hover:scale-105 transition-transform">
              <Settings className="w-4.5 h-4.5" />
            </div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider group-hover:text-cyan-700">MODUL 2</span>
          </div>
          <h3 className="text-[14px] font-bold text-[#0F172A] tracking-tight mb-1">
            MASTER DATA
          </h3>
          <p className="text-[11.5px] text-[#64748B] leading-snug mb-2.5 line-clamp-2">
            Data perusahaan, dokter, paket MCU, dan setting parameter.
          </p>
          <div className="mt-auto pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] font-bold text-[#0E7490]">
            <span>Buka Master</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
          </div>
        </div>

        {/* Medical Record */}
        <div
          onClick={() => onNavigate('medical')}
          className="group cursor-pointer bg-white border border-[#E2E8F0] rounded-xl p-3.5 sm:p-4 shadow-2xs hover:shadow-md hover:border-[#A5F3FC] hover:-translate-y-0.5 transition-all duration-200 flex flex-col"
        >
          <div className="flex items-center justify-between mb-2">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#CCFBF1] to-[#99F6E4] text-[#0F766E] flex items-center justify-center group-hover:scale-105 transition-transform">
              <HeartPulse className="w-4.5 h-4.5" />
            </div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider group-hover:text-cyan-700">MODUL 3</span>
          </div>
          <h3 className="text-[14px] font-bold text-[#0F172A] tracking-tight mb-1">
            MEDICAL RECORD
          </h3>
          <p className="text-[11.5px] text-[#64748B] leading-snug mb-2.5 line-clamp-2">
            Entri hasil pemeriksaan fisik, lab, radiologi, EKG, audiometri.
          </p>
          <div className="mt-auto pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] font-bold text-[#0E7490]">
            <span>Buka Rekam Medis</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
          </div>
        </div>

        {/* Cetak & Laporan */}
        <div
          onClick={() => onNavigate('laporan')}
          className="group cursor-pointer bg-white border border-[#E2E8F0] rounded-xl p-3.5 sm:p-4 shadow-2xs hover:shadow-md hover:border-[#A5F3FC] hover:-translate-y-0.5 transition-all duration-200 flex flex-col"
        >
          <div className="flex items-center justify-between mb-2">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#EDE9FE] to-[#DDD6FE] text-[#6D28D9] flex items-center justify-center group-hover:scale-105 transition-transform">
              <BarChart3 className="w-4.5 h-4.5" />
            </div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider group-hover:text-cyan-700">MODUL 4</span>
          </div>
          <h3 className="text-[14px] font-bold text-[#0F172A] tracking-tight mb-1">
            CETAK &amp; LAPORAN
          </h3>
          <p className="text-[11.5px] text-[#64748B] leading-snug mb-2.5 line-clamp-2">
            Unduh resume medis, buku hasil, serta rekapitulasi PDF/Excel.
          </p>
          <div className="mt-auto pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] font-bold text-[#0E7490]">
            <span>Buka Laporan</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
          </div>
        </div>
      </div>

      {/* Real-time Data Table Preview on Dashboard */}
      {attendanceList.length > 0 && (
        <div className="bg-white border border-[#E2E8F0] rounded-xl p-3.5 sm:p-4 shadow-2xs space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2.5 border-b border-slate-100 pb-2.5">
            <div>
              <h3 className="text-[15px] font-extrabold text-[#0F172A] flex items-center gap-2">
                <ClipboardCheck className="w-4.5 h-4.5 text-[#0E7490]" />
                Monitoring Peserta MCU Terdaftar
              </h3>
              <p className="text-[11.5px] text-slate-500">
                Memuat {attendanceList.length} peserta realtime. Klik nama atau tombol untuk langsung buka rekam medis.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Cari peserta..."
                  className="pl-8 pr-2.5 py-1 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:ring-2 focus:ring-cyan-500/20 w-40 sm:w-52"
                />
              </div>

              <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg text-xs font-bold">
                <button
                  onClick={() => setFilterTab('ALL')}
                  className={`px-2.5 py-1 rounded-md transition-colors ${
                    filterTab === 'ALL'
                      ? 'bg-white text-slate-900 shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Semua ({attendanceList.length})
                </button>
                <button
                  onClick={() => setFilterTab('Hadir')}
                  className={`px-2.5 py-1 rounded-md transition-colors ${
                    filterTab === 'Hadir'
                      ? 'bg-white text-emerald-700 shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Hadir ({mcuCount})
                </button>
                <button
                  onClick={() => setFilterTab('Belum Hadir')}
                  className={`px-2.5 py-1 rounded-md transition-colors ${
                    filterTab === 'Belum Hadir'
                      ? 'bg-white text-amber-700 shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Belum ({followUpCount})
                </button>
              </div>
            </div>
          </div>

          {/* Table Container with clean horizontal scrolling & compact rows */}
          <div className="overflow-x-auto rounded-lg border border-slate-200">
            <table className="w-full text-left text-[12px] border-collapse min-w-[680px]">
              <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                <tr>
                  <th className="py-2 px-3">No. MCU</th>
                  <th className="py-2 px-3">Nama Peserta</th>
                  <th className="py-2 px-3">Perusahaan &amp; Dept</th>
                  <th className="py-2 px-3">Paket MCU</th>
                  <th className="py-2 px-3 text-center">Status Kehadiran</th>
                  <th className="py-2 px-3 text-center">Aksi Cepat</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredList.slice(0, 8).map((p) => {
                  const isHadir = p.status === 'Hadir';
                  return (
                    <tr key={p.mcuNo} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-2 px-3 font-mono font-bold text-[#0E7490]">
                        {p.mcuNo}
                      </td>
                      <td className="py-2 px-3">
                        <strong className="text-slate-900 block leading-tight">{p.nama}</strong>
                        <span className="text-[10.5px] text-slate-500">
                          NIK: {p.nik || '-'} &bull; {p.jk}
                        </span>
                      </td>
                      <td className="py-2 px-3">
                        <span className="text-slate-800 font-medium block leading-tight">{p.pt}</span>
                        <span className="text-[10.5px] text-slate-500 block">
                          {p.dept} {p.bagian ? `(${p.bagian})` : ''}
                        </span>
                      </td>
                      <td className="py-2 px-3">
                        <span className="px-2 py-0.5 rounded text-[10.5px] font-extrabold bg-cyan-50 text-cyan-800 border border-cyan-200">
                          {p.paket}
                        </span>
                      </td>
                      <td className="py-2 px-3 text-center">
                        <button
                          onClick={() => onToggleAttendance && onToggleAttendance(p.mcuNo)}
                          className={`px-2 py-0.5 rounded-full text-[10.5px] font-bold border cursor-pointer transition-all ${
                            isHadir
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-300 hover:bg-emerald-100'
                              : 'bg-amber-50 text-amber-700 border-amber-300 hover:bg-amber-100'
                          }`}
                          title="Klik untuk mengubah status kehadiran"
                        >
                          {isHadir ? '✓ Hadir' : '○ Belum Hadir'}
                        </button>
                      </td>
                      <td className="py-2 px-3 text-center">
                        <button
                          onClick={() => {
                            if (onSelectPatient) onSelectPatient(p.mcuNo);
                            onNavigate('medical');
                          }}
                          className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-slate-100 hover:bg-[#0E7490] hover:text-white text-slate-700 rounded-md text-xs font-bold transition-colors cursor-pointer"
                        >
                          <span>Periksa</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between text-xs text-slate-500 pt-0.5">
            <span>
              Menampilkan {Math.min(8, filteredList.length)} dari {filteredList.length} peserta.
            </span>
            <button
              onClick={() => onNavigate('registrasi')}
              className="font-bold text-[#0E7490] hover:underline flex items-center gap-1 cursor-pointer"
            >
              <span>Buka Modul Registrasi Selengkapnya</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
