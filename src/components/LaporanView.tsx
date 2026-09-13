import React, { useState, useMemo } from 'react';
import {
  Printer,
  FileBarChart2,
  ChevronLeft,
  Search,
  Download,
  FileSpreadsheet,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Building,
  Layers,
  Filter,
  Eye,
  FileText,
  User,
  Sparkles,
  Stethoscope,
  Activity,
  Check,
} from 'lucide-react';
import {
  AttendanceRecord,
  ClinicInfo,
  Company,
  MCUPackage,
  CompanyExaminerConfig,
  Doctor,
  PhysicalExamParam,
  LabExamParam,
} from '../types';
import { initialPackages, getExaminersForCompany } from '../data/initialData';
import { McuBookletModal } from './McuBookletModal';
import {
  exportCorporateMcuToExcel,
  exportCorporateMcuToPdf,
} from '../utils/exportReportUtils';

interface LaporanViewProps {
  companies: Company[];
  attendanceList: AttendanceRecord[];
  clinic: ClinicInfo;
  packages?: MCUPackage[];
  examinerConfigs?: CompanyExaminerConfig[];
  doctors?: Doctor[];
  physicalParams?: PhysicalExamParam[];
  labParams?: LabExamParam[];
  onNotify: (msg: string) => void;
  initialSubAction?: LaporanSubAction;
  onSelectSubAction?: (sub: LaporanSubAction) => void;
}

export type LaporanSubAction = 'menu' | 'print' | 'report';

export const LaporanView: React.FC<LaporanViewProps> = ({
  companies,
  attendanceList,
  clinic,
  packages = initialPackages,
  examinerConfigs,
  doctors,
  physicalParams,
  labParams,
  onNotify,
  initialSubAction,
  onSelectSubAction,
}) => {
  const [subAction, setSubActionState] = useState<LaporanSubAction>(initialSubAction || 'menu');

  const setSubAction = (sub: LaporanSubAction) => {
    setSubActionState(sub);
    if (onSelectSubAction) onSelectSubAction(sub);
  };

  React.useEffect(() => {
    if (initialSubAction && initialSubAction !== subAction) {
      setSubActionState(initialSubAction);
    }
  }, [initialSubAction]);

  // Print booklet patient selection
  const [selectedMcuNo, setSelectedMcuNo] = useState(
    attendanceList[0]?.mcuNo || 'PAN-2025-001'
  );
  const [showBookletModal, setShowBookletModal] = useState(false);
  const [bookletAction, setBookletAction] = useState<'preview' | 'print' | 'pdf'>('preview');

  // Search & Filter for participant table
  const [searchQuery, setSearchQuery] = useState('');
  const [filterPt, setFilterPt] = useState('ALL');

  // Report filters - Default to 'SEMUA' so all corporate data loads immediately!
  const [reportPt, setReportPt] = useState('SEMUA');
  const [reportDept, setReportDept] = useState('SEMUA');
  const [reportStart, setReportStart] = useState('2025-05-01');
  const [reportEnd, setReportEnd] = useState('2025-05-31');
  const [reportSearch, setReportSearch] = useState('');

  // Dynamically derive departments from attendanceList
  const availableDepts = useMemo(() => {
    const depts = new Set<string>();
    attendanceList.forEach((p) => {
      if (reportPt === 'SEMUA' || p.pt.toLowerCase() === reportPt.toLowerCase()) {
        if (p.dept) depts.add(p.dept);
        if (p.bagian) depts.add(p.bagian);
      }
    });
    return Array.from(depts).filter(Boolean);
  }, [attendanceList, reportPt]);

  // Filtered participants for Corporate Report
  const filteredReportList = useMemo(() => {
    return attendanceList.filter((p) => {
      const matchPt = reportPt === 'SEMUA' || p.pt.toLowerCase() === reportPt.toLowerCase();
      const matchDept =
        reportDept === 'SEMUA' ||
        (p.dept && p.dept.toLowerCase() === reportDept.toLowerCase()) ||
        (p.bagian && p.bagian.toLowerCase() === reportDept.toLowerCase());
      const matchSearch =
        reportSearch === '' ||
        p.nama.toLowerCase().includes(reportSearch.toLowerCase()) ||
        p.mcuNo.toLowerCase().includes(reportSearch.toLowerCase()) ||
        (p.nik && p.nik.includes(reportSearch));
      return matchPt && matchDept && matchSearch;
    });
  }, [attendanceList, reportPt, reportDept, reportSearch]);

  // Active patient for printing
  const activePatient = useMemo(() => {
    return (
      attendanceList.find((p) => p.mcuNo === selectedMcuNo) ||
      attendanceList[0]
    );
  }, [attendanceList, selectedMcuNo]);

  // Match package from Master Data for active patient
  const activePackage = useMemo(() => {
    if (!activePatient) return undefined;
    const pList = packages || initialPackages;
    return (
      pList.find(
        (p) =>
          p.kode === activePatient.paket ||
          p.nama.toLowerCase().includes((activePatient.paket || '').toLowerCase())
      ) || pList[0]
    );
  }, [activePatient, packages]);

  // Match examiner config for active patient's company
  const activeExaminerConfig = useMemo(() => {
    if (!activePatient) return undefined;
    return getExaminersForCompany(
      activePatient.pt,
      examinerConfigs,
      doctors
    );
  }, [activePatient, examinerConfigs, doctors]);

  // Filtered patients for the table
  const filteredPatients = useMemo(() => {
    return attendanceList.filter((p) => {
      const matchSearch =
        searchQuery === '' ||
        p.nama.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.mcuNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.nik && p.nik.includes(searchQuery)) ||
        (p.dept && p.dept.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchPt = filterPt === 'ALL' || p.pt === filterPt;

      return matchSearch && matchPt;
    });
  }, [attendanceList, searchQuery, filterPt]);

  // Helper to check what exams are in a patient's package
  const getPackageExamList = (patientItem: AttendanceRecord): string[] => {
    const pkg = packages.find(
      (p) =>
        p.kode === patientItem.paket ||
        p.nama.toLowerCase().includes((patientItem.paket || '').toLowerCase())
    );
    const exams = pkg?.exams || pkg?.pemeriksaan || ['Pemeriksaan Fisik'];
    if (patientItem.pemeriksaanTambahan) {
      return [...exams, `+ ${patientItem.pemeriksaanTambahan}`];
    }
    return exams;
  };

  // Helper to inspect if input data exists in localStorage for a patient
  const checkInputDataStatus = (mcuNo: string) => {
    const hasFisik = !!localStorage.getItem(`simreg_fisik_${mcuNo}`);
    const hasLab = !!localStorage.getItem(`simreg_lab_${mcuNo}`);
    const hasRontgen = !!localStorage.getItem(`simreg_rontgen_${mcuNo}`);
    const hasEkg = !!localStorage.getItem(`simreg_ekg_${mcuNo}`);
    const hasResume = !!localStorage.getItem(`simreg_resume_${mcuNo}`);
    return { hasFisik, hasLab, hasRontgen, hasEkg, hasResume };
  };

  return (
    <div className="space-y-3.5 sm:space-y-4">
      {/* Breadcrumbs */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-1.5 text-xs sm:text-[12.5px] text-[#64748B]">
          <span>Dashboard</span>
          <span>/</span>
          <span className="font-bold text-[#0F172A]">Cetak &amp; Laporan</span>
          {subAction !== 'menu' && (
            <>
              <span>/</span>
              <span className="text-[#0E7490] font-bold capitalize">
                {subAction === 'print' ? 'Penerbitan & Cetak Buku Hasil MCU' : 'Download Laporan MCU'}
              </span>
            </>
          )}
        </div>

        {subAction !== 'menu' && (
          <button
            onClick={() => setSubAction('menu')}
            className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-bold rounded-lg bg-white border border-[#CBD5E1] text-[#334155] hover:bg-slate-50 transition-all shadow-2xs cursor-pointer"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
            Kembali ke Menu
          </button>
        )}
      </div>

      {/* Main Choice Cards */}
      {subAction === 'menu' && (
        <>
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-[17px] sm:text-[19px] font-extrabold text-[#0F172A] tracking-tight">
                Penerbitan &amp; Rekapitulasi Laporan MCU
              </h2>
              <p className="text-xs sm:text-[12.5px] text-slate-500">
                Cetak buku hasil MCU terintegrasi seluruh data input pemeriksaan &amp; paket master data
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {/* Cetak Hasil MCU */}
            <div
              onClick={() => setSubAction('print')}
              className="group cursor-pointer bg-white border border-[#E2E8F0] rounded-xl p-4 sm:p-5 shadow-2xs hover:shadow-md hover:border-[#A5F3FC] hover:-translate-y-0.5 transition-all flex flex-col"
            >
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#EDE9FE] to-[#DDD6FE] text-[#6D28D9] flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                <Printer className="w-5 h-5" />
              </div>
              <h3 className="text-[15px] font-bold text-[#0F172A] tracking-tight mb-1">
                Penerbitan &amp; Cetak Buku Hasil MCU
              </h3>
              <p className="text-xs text-[#64748B] leading-relaxed mb-3">
                Pratinjau lengkap buku hasil MCU yang terkoneksi langsung dengan seluruh hasil penginputan fisik, lab, rontgen, EKG, audiometri, spirometri, treadmill, dan USG sesuai paket MCU yang di-setting pada Master Data.
              </p>
              <div className="mt-auto pt-2 flex items-center gap-1.5 text-xs font-bold text-[#0E7490] group-hover:translate-x-1 transition-transform">
                <span>Buka Modul Cetak Buku MCU</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </div>
            </div>

            {/* Rekapitulasi Laporan Perusahaan */}
            <div
              onClick={() => setSubAction('report')}
              className="group cursor-pointer bg-white border border-[#E2E8F0] rounded-xl p-4 sm:p-5 shadow-2xs hover:shadow-md hover:border-[#A5F3FC] hover:-translate-y-0.5 transition-all flex flex-col"
            >
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#CFFAFE] to-[#BAE6FD] text-[#0E7490] flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                <FileBarChart2 className="w-5 h-5" />
              </div>
              <h3 className="text-[15px] font-bold text-[#0F172A] tracking-tight mb-1">
                Rekapitulasi Laporan MCU Perusahaan
              </h3>
              <p className="text-xs text-[#64748B] leading-relaxed mb-3">
                Ekspor rekapitulasi data hasil medical check up korporasi untuk analisis tren kesehatan kerja tahunan ke PDF atau format Excel spreadsheet.
              </p>
              <div className="mt-auto pt-2 flex items-center gap-1.5 text-xs font-bold text-[#0E7490] group-hover:translate-x-1 transition-transform">
                <span>Filter &amp; Ekspor Laporan</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </div>
            </div>
          </div>
        </>
      )}

      {/* ============================================================== */}
      {/* SubAction: Penerbitan & Cetak Hasil MCU                        */}
      {/* ============================================================== */}
      {subAction === 'print' && (
        <div className="space-y-3.5 sm:space-y-4">
          {/* Header & Quick Action Card */}
          <div className="bg-white border border-[#E2E8F0] rounded-xl p-3.5 sm:p-4 shadow-2xs space-y-3">
            <div className="border-b border-[#E2E8F0] pb-2.5 flex flex-wrap items-center justify-between gap-2.5">
              <div>
                <h3 className="text-[16px] font-bold text-[#0F172A] flex items-center gap-2">
                  <Printer className="w-4.5 h-4.5 text-[#0E7490]" />
                  Penerbitan &amp; Cetak Buku Hasil MCU
                </h3>
                <p className="text-[11.5px] text-[#64748B]">
                  Hasil pratinjau otomatis menampilkan seluruh hasil penginputan (fisik, lab, rontgen, penunjang) sesuai paket MCU yang di-setting pada Master Data.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  Koneksi Data Input: <b>Aktif Terintegrasi</b>
                </span>
              </div>
            </div>

            {/* Quick Picker */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-2.5">
              <div className="md:col-span-2">
                <label className="block text-[11px] font-bold text-[#334155] mb-0.5">
                  Pilih Peserta MCU
                </label>
                <select
                  value={selectedMcuNo}
                  onChange={(e) => setSelectedMcuNo(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-white border border-[#CBD5E1] rounded-lg text-xs focus:ring-2 focus:ring-cyan-500/20"
                >
                  {attendanceList.map((p) => (
                    <option key={p.mcuNo} value={p.mcuNo}>
                      {p.mcuNo} - {p.nama} ({p.pt}) - [{p.paket}]
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#334155] mb-0.5">
                  Paket MCU Terdaftar
                </label>
                <div className="w-full px-2.5 py-1.5 bg-slate-50 border border-[#CBD5E1] rounded-lg text-xs font-bold text-[#0E7490] truncate">
                  {activePatient?.paket} ({activePackage?.nama || 'Standar'})
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#334155] mb-0.5">
                  Perusahaan / PT
                </label>
                <div className="w-full px-2.5 py-1.5 bg-slate-50 border border-[#CBD5E1] rounded-lg text-xs text-slate-700 truncate">
                  {activePatient?.pt}
                </div>
              </div>
            </div>

            {/* Active Patient Details Banner */}
            {activePatient && (
              <div className="p-3 rounded-lg bg-gradient-to-r from-slate-50 via-cyan-50/40 to-blue-50/30 border border-slate-200 flex flex-wrap items-center justify-between gap-3">
                <div className="space-y-0.5">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="font-mono text-[11px] font-bold text-white bg-[#0E7490] px-1.5 py-0.2 rounded">
                      {activePatient.mcuNo}
                    </span>
                    <strong className="text-[13.5px] text-slate-900">{activePatient.nama}</strong>
                    <span className="text-[11.5px] text-slate-500">
                      • NIK: {activePatient.nik || '-'} • Dept: {activePatient.dept}
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-1 text-[11px] text-slate-600">
                    <span>Pemeriksaan Terkoneksi Paket [{activePatient.paket}]:</span>
                    {getPackageExamList(activePatient).map((exam, idx) => (
                      <span
                        key={idx}
                        className="px-1.5 py-0.2 bg-white border border-slate-200 rounded text-slate-800 font-medium text-[10.5px]"
                      >
                        {exam}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setBookletAction('preview');
                      setShowBookletModal(true);
                    }}
                    className="px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-[#0E7490] to-[#0891B2] hover:from-[#0891B2] hover:to-[#0284C7] text-white text-xs font-bold shadow-2xs flex items-center gap-1.5 cursor-pointer transition-all hover:scale-[1.01]"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    Pratinjau &amp; Cetak Buku MCU
                  </button>
                  <button
                    onClick={() => {
                      setBookletAction('pdf');
                      setShowBookletModal(true);
                    }}
                    className="px-3 py-1.5 rounded-lg bg-white border border-slate-300 text-slate-700 text-xs font-bold hover:bg-slate-50 flex items-center gap-1 cursor-pointer shadow-2xs"
                    title="Unduh PDF Buku Hasil MCU"
                  >
                    <Download className="w-3.5 h-3.5 text-slate-600" />
                    Unduh PDF
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Table of all participants to directly preview */}
          <div className="bg-white border border-[#E2E8F0] rounded-xl p-3.5 sm:p-4 shadow-2xs space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2.5 border-b border-slate-100 pb-2.5">
              <div>
                <h4 className="font-bold text-[14px] text-slate-900">
                  Daftar Seluruh Peserta &amp; Penerbitan Buku MCU
                </h4>
                <p className="text-[11.5px] text-slate-500">
                  Pilih peserta di bawah ini untuk melihat pratinjau hasil MCU yang tersinkronisasi
                </p>
              </div>

              {/* Filters */}
              <div className="flex flex-wrap items-center gap-2">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Cari nama, NIK, No. MCU..."
                    className="pl-8 pr-2.5 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-lg w-48 sm:w-56 focus:bg-white focus:ring-2 focus:ring-cyan-500/20"
                  />
                </div>

                <select
                  value={filterPt}
                  onChange={(e) => setFilterPt(e.target.value)}
                  className="px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-lg"
                >
                  <option value="ALL">Semua Perusahaan</option>
                  {companies.map((c) => (
                    <option key={c.id} value={c.nama}>
                      {c.nama}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="overflow-x-auto border border-slate-200 rounded-lg">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                  <tr>
                    <th className="p-2 sm:p-2.5">No. MCU</th>
                    <th className="p-2 sm:p-2.5">Nama Peserta</th>
                    <th className="p-2 sm:p-2.5">Perusahaan &amp; Dept</th>
                    <th className="p-2 sm:p-2.5">Paket MCU</th>
                    <th className="p-2 sm:p-2.5">Pemeriksaan Dalam Paket</th>
                    <th className="p-2 sm:p-2.5 text-center">Status Input</th>
                    <th className="p-2 sm:p-2.5 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {filteredPatients.map((p) => {
                    const status = checkInputDataStatus(p.mcuNo);
                    const isSelected = p.mcuNo === selectedMcuNo;
                    const exams = getPackageExamList(p);

                    return (
                      <tr
                        key={p.mcuNo}
                        className={`hover:bg-slate-50/80 transition-colors ${
                          isSelected ? 'bg-cyan-50/40 font-medium' : ''
                        }`}
                      >
                        <td className="p-2 sm:p-2.5 font-mono font-bold text-[#0E7490]">
                          {p.mcuNo}
                        </td>
                        <td className="p-2 sm:p-2.5">
                          <b className="text-slate-900">{p.nama}</b>
                          <span className="text-[10.5px] text-slate-500 block">
                            NIK: {p.nik || '-'} • {p.jk}
                          </span>
                        </td>
                        <td className="p-2 sm:p-2.5">
                          <span className="text-slate-800 font-medium">{p.pt}</span>
                          <span className="text-[10.5px] text-slate-500 block">
                            {p.dept} ({p.bagian || '-'})
                          </span>
                        </td>
                        <td className="p-2 sm:p-2.5">
                          <span className="px-1.5 py-0.2 rounded text-[10.5px] font-extrabold bg-[#0E7490]/10 text-[#0E7490] border border-[#0E7490]/20">
                            {p.paket}
                          </span>
                        </td>
                        <td className="p-2 sm:p-2.5 max-w-xs">
                          <div className="flex flex-wrap gap-1">
                            {exams.map((ex, i) => (
                              <span
                                key={i}
                                className="text-[10px] px-1.5 py-0.2 bg-slate-100 rounded text-slate-600 border border-slate-200"
                              >
                                {ex}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className="p-2 sm:p-2.5 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <span
                              title={status.hasFisik ? 'Fisik: Sudah diinput' : 'Fisik: Default'}
                              className={`w-2 h-2 rounded-full ${
                                status.hasFisik ? 'bg-emerald-500' : 'bg-slate-300'
                              }`}
                            />
                            <span
                              title={status.hasLab ? 'Lab: Sudah diinput' : 'Lab: Default'}
                              className={`w-2 h-2 rounded-full ${
                                status.hasLab ? 'bg-emerald-500' : 'bg-slate-300'
                              }`}
                            />
                            <span
                              title={status.hasRontgen ? 'Rontgen: Sudah diinput' : 'Rontgen: Default'}
                              className={`w-2 h-2 rounded-full ${
                                status.hasRontgen ? 'bg-emerald-500' : 'bg-slate-300'
                              }`}
                            />
                            <span
                              title={status.hasEkg ? 'EKG: Sudah diinput' : 'EKG: Default'}
                              className={`w-2 h-2 rounded-full ${
                                status.hasEkg ? 'bg-emerald-500' : 'bg-slate-300'
                              }`}
                            />
                          </div>
                        </td>
                        <td className="p-2 sm:p-2.5 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              onClick={() => {
                                setSelectedMcuNo(p.mcuNo);
                                setBookletAction('preview');
                                setShowBookletModal(true);
                              }}
                              className="px-2 py-1 rounded bg-[#0E7490] hover:bg-[#0891B2] text-white text-[11px] font-bold flex items-center gap-1 transition-colors cursor-pointer shadow-2xs"
                              title="Pratinjau & Cetak Buku MCU"
                            >
                              <Eye className="w-3 h-3" />
                              Preview
                            </button>
                            <button
                              onClick={() => {
                                setSelectedMcuNo(p.mcuNo);
                                setBookletAction('pdf');
                                setShowBookletModal(true);
                              }}
                              className="px-1.5 py-1 rounded bg-white border border-slate-300 text-slate-700 hover:bg-slate-100 text-[11px] font-bold flex items-center gap-1 transition-colors cursor-pointer shadow-2xs"
                              title="Unduh PDF Buku MCU"
                            >
                              <Download className="w-3 h-3 text-slate-600" />
                              PDF
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
        </div>
      )}

      {/* ============================================================== */}
      {/* SubAction: Download Laporan MCU (Corporate Report)              */}
      {/* ============================================================== */}
      {subAction === 'report' && (
        <div className="bg-white border border-[#E2E8F0] rounded-xl p-3.5 sm:p-5 shadow-2xs space-y-3.5 sm:space-y-4">
          <div className="border-b border-[#E2E8F0] pb-2.5">
            <h3 className="text-[16px] font-bold text-[#0F172A] flex items-center gap-2">
              <FileBarChart2 className="w-4.5 h-4.5 text-[#0E7490]" />
              Rekapitulasi &amp; Ekspor Laporan MCU Perusahaan
            </h3>
            <p className="text-[11.5px] text-[#64748B]">
              Ekspor rekapitulasi data hasil medical check up korporasi untuk analisis tren kesehatan kerja tahunan.
            </p>
          </div>

          <div className="p-2.5 rounded-lg bg-[#F0FDF4] border border-[#BBF7D0] text-xs text-[#166534]">
            Header, nomor izin, dan legalitas laporan otomatis sinkron dengan data <b>Master → Setting Klinik</b> ({clinic.nama}).
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
            <div>
              <label className="block text-[11px] font-bold text-[#334155] mb-0.5">
                PT / Perusahaan Klien
              </label>
              <select
                value={reportPt}
                onChange={(e) => setReportPt(e.target.value)}
                className="w-full px-2.5 py-1.5 bg-white border border-[#CBD5E1] rounded-lg text-xs focus:ring-2 focus:ring-cyan-500/20"
              >
                <option value="SEMUA">Semua Perusahaan ({attendanceList.length} Peserta)</option>
                {companies.map((c) => (
                  <option key={c.id} value={c.nama}>
                    {c.nama}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-[#334155] mb-0.5">
                Department / Divisi
              </label>
              <select
                value={reportDept}
                onChange={(e) => setReportDept(e.target.value)}
                className="w-full px-2.5 py-1.5 bg-white border border-[#CBD5E1] rounded-lg text-xs focus:ring-2 focus:ring-cyan-500/20"
              >
                <option value="SEMUA">Semua Department ({availableDepts.length} Divisi)</option>
                {availableDepts.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-[#334155] mb-0.5">
                Cari Peserta
              </label>
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={reportSearch}
                  onChange={(e) => setReportSearch(e.target.value)}
                  placeholder="Cari nama, NIK, no MCU..."
                  className="w-full pl-8 pr-2.5 py-1.5 bg-white border border-[#CBD5E1] rounded-lg text-xs focus:ring-2 focus:ring-cyan-500/20"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-[#334155] mb-0.5">
                Periode Tanggal MCU
              </label>
              <div className="grid grid-cols-2 gap-1.5">
                <input
                  type="date"
                  value={reportStart}
                  onChange={(e) => setReportStart(e.target.value)}
                  className="w-full px-2 py-1.5 bg-white border border-[#CBD5E1] rounded-lg text-xs"
                />
                <input
                  type="date"
                  value={reportEnd}
                  onChange={(e) => setReportEnd(e.target.value)}
                  className="w-full px-2 py-1.5 bg-white border border-[#CBD5E1] rounded-lg text-xs"
                />
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2.5 pt-2 border-t border-slate-100">
            <div className="text-xs text-slate-600">
              Ditemukan <b>{filteredReportList.length}</b> peserta dari total <b>{attendanceList.length}</b> di database.
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  try {
                    exportCorporateMcuToPdf(filteredReportList, clinic, {
                      companyName: reportPt,
                      department: reportDept,
                      startDate: reportStart,
                      endDate: reportEnd,
                    });
                    onNotify(`✓ Berkas Rekapitulasi PDF (${filteredReportList.length} data) berhasil diunduh!`);
                  } catch (err) {
                    console.error('Export PDF error:', err);
                    onNotify('Terjadi kesalahan saat membuat file PDF.');
                  }
                }}
                className="px-3 py-1.5 rounded-lg bg-white border border-slate-300 text-[#334155] text-xs font-bold hover:bg-slate-50 flex items-center gap-1.5 cursor-pointer shadow-2xs transition-colors"
              >
                <Download className="w-3.5 h-3.5 text-[#0E7490]" />
                Unduh PDF
              </button>
              <button
                type="button"
                onClick={() => {
                  try {
                    exportCorporateMcuToExcel(filteredReportList, clinic, {
                      companyName: reportPt,
                      department: reportDept,
                      startDate: reportStart,
                      endDate: reportEnd,
                    });
                    onNotify(`✓ Berkas Rekapitulasi Excel (${filteredReportList.length} data) berhasil diekspor!`);
                  } catch (err) {
                    console.error('Export Excel error:', err);
                    onNotify('Terjadi kesalahan saat membuat file Excel.');
                  }
                }}
                className="px-3 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-2xs transition-colors"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-700" />
                Unduh Excel (.xlsx)
              </button>
            </div>
          </div>

          {/* Real-time Data Table for Corporate Report */}
          <div className="overflow-x-auto border border-[#E2E8F0] rounded-lg shadow-2xs">
            <table className="w-full text-left text-xs min-w-[720px]">
              <thead>
                <tr className="bg-[#F8FAFC] border-b border-[#E2E8F0] text-[11px] font-bold text-[#475569]">
                  <th className="py-2 px-3 w-10">No</th>
                  <th className="py-2 px-3">No. MCU</th>
                  <th className="py-2 px-3">Nama Peserta</th>
                  <th className="py-2 px-3">NIK</th>
                  <th className="py-2 px-3">Perusahaan &amp; Dept</th>
                  <th className="py-2 px-3">Paket MCU</th>
                  <th className="py-2 px-3 text-center">Status</th>
                  <th className="py-2 px-3 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2E8F0]">
                {filteredReportList.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-6 text-center text-slate-500">
                      Tidak ada data peserta MCU yang sesuai dengan kriteria filter di atas.
                    </td>
                  </tr>
                ) : (
                  filteredReportList.map((p, idx) => (
                    <tr key={p.mcuNo} className="hover:bg-[#F8FAFC]">
                      <td className="py-2 px-3 text-[#64748B] font-medium">{idx + 1}</td>
                      <td className="py-2 px-3 font-mono font-bold text-[#0E7490]">{p.mcuNo}</td>
                      <td className="py-2 px-3">
                        <div className="font-bold text-[#0F172A]">{p.nama}</div>
                        <div className="text-[10.5px] text-[#64748B]">{p.jk} • {p.tglLahir}</div>
                      </td>
                      <td className="py-2 px-3">
                        <span className="font-mono text-[11px] font-bold text-slate-800 bg-slate-100 px-1.5 py-0.2 rounded border border-slate-200 inline-block">
                          {p.nik || '-'}
                        </span>
                      </td>
                      <td className="py-2 px-3">
                        <div className="font-medium text-[#0F172A]">{p.pt}</div>
                        <div className="text-[10.5px] text-[#64748B]">{p.dept} {p.bagian ? `• ${p.bagian}` : ''}</div>
                      </td>
                      <td className="py-2 px-3">
                        <span className="px-1.5 py-0.2 rounded bg-cyan-50 text-cyan-800 font-bold text-[10.5px] border border-cyan-200">
                          {p.paket}
                        </span>
                      </td>
                      <td className="py-2 px-3 text-center">
                        <span
                          className={`px-2 py-0.2 rounded-full text-[10.5px] font-bold ${
                            p.status === 'Hadir'
                              ? 'bg-[#DCFCE7] text-[#15803D]'
                              : 'bg-[#FEF3C7] text-[#B45309]'
                          }`}
                        >
                          {p.status}
                        </span>
                      </td>
                      <td className="py-2 px-3 text-center">
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedMcuNo(p.mcuNo);
                            setBookletAction('preview');
                            setShowBookletModal(true);
                          }}
                          className="px-2 py-0.5 rounded text-[11px] font-bold bg-cyan-50 hover:bg-cyan-100 text-[#0E7490] border border-cyan-200 inline-flex items-center gap-1 cursor-pointer transition-colors"
                        >
                          <Eye className="w-3 h-3" />
                          Buku MCU
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* Interactive Modal: MCU Booklet Preview & Print                */}
      {/* ============================================================== */}
      {showBookletModal && activePatient && (
        <McuBookletModal
          patient={activePatient}
          clinic={clinic}
          packageItem={activePackage}
          examinerConfig={activeExaminerConfig}
          initialAction={bookletAction}
          onClose={() => setShowBookletModal(false)}
          onNotify={onNotify}
        />
      )}
    </div>
  );
};
