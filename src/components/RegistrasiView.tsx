import React, { useState } from 'react';
import {
  User,
  Building,
  ClipboardCheck,
  ChevronLeft,
  FileSpreadsheet,
  Download,
  Printer,
  Search,
  CheckCircle2,
  Clock,
  ArrowRight,
  Upload,
  UserCheck,
  Calendar,
  FileText,
  X,
} from 'lucide-react';
import { AttendanceRecord, Company, MCUPackage, ClinicInfo, ThermalLabelConfig } from '../types';
import { RegistrasiTemplateForm } from './RegistrasiTemplateForm';
import { MassImportSection } from './MassImportSection';
import { ThermalLabelPrintModal } from './ThermalLabelPrintModal';
import { exportCorporateMcuToExcel } from '../utils/exportReportUtils';

interface RegistrasiViewProps {
  companies: Company[];
  attendanceList: AttendanceRecord[];
  packages?: MCUPackage[];
  clinic?: ClinicInfo;
  labelConfig?: ThermalLabelConfig;
  onUpdateLabelConfig?: (config: ThermalLabelConfig) => void;
  onAddPatient: (patient: Partial<AttendanceRecord>) => void;
  onSavePatient?: (patient: AttendanceRecord) => void;
  onToggleAttendance: (mcuNo: string) => void;
  onNotify: (msg: string) => void;
  onBulkAddPatients?: (records: AttendanceRecord[]) => void;
  initialTab?: RegistrasiTab;
  onTabChange?: (tab: RegistrasiTab) => void;
}

export type RegistrasiTab = 'form' | 'import' | 'attendance';

export const RegistrasiView: React.FC<RegistrasiViewProps> = ({
  companies,
  attendanceList,
  packages = [],
  clinic,
  labelConfig,
  onUpdateLabelConfig,
  onAddPatient,
  onSavePatient,
  onToggleAttendance,
  onNotify,
  onBulkAddPatients,
  initialTab,
  onTabChange,
}) => {
  // Default to initialTab or 'form'
  const [activeTab, setActiveTabState] = useState<RegistrasiTab>(initialTab || 'form');

  const setActiveTab = (tab: RegistrasiTab) => {
    setActiveTabState(tab);
    if (onTabChange) onTabChange(tab);
  };

  React.useEffect(() => {
    if (initialTab && initialTab !== activeTab) {
      setActiveTabState(initialTab);
    }
  }, [initialTab]);

  const [selectedMcuForForm, setSelectedMcuForForm] = useState<string | undefined>(undefined);
  const [reprintPatient, setReprintPatient] = useState<AttendanceRecord | null>(null);

  // Attendance filter states - Default to 'SEMUA' so all participants are loaded immediately!
  const [filterPt, setFilterPt] = useState('SEMUA');
  const [filterTgl, setFilterTgl] = useState('2025-07-24');
  const [filterStatus, setFilterStatus] = useState('SEMUA');
  const [attendanceSearch, setAttendanceSearch] = useState('');

  // Filtered attendance list
  const filteredAttendance = attendanceList.filter((item) => {
    const matchPt = filterPt === 'SEMUA' || item.pt.toLowerCase() === filterPt.toLowerCase();
    const matchStatus =
      filterStatus === 'SEMUA' || item.status === filterStatus;
    const matchSearch =
      attendanceSearch === '' ||
      item.nama.toLowerCase().includes(attendanceSearch.toLowerCase()) ||
      item.mcuNo.toLowerCase().includes(attendanceSearch.toLowerCase()) ||
      (item.nik && item.nik.includes(attendanceSearch)) ||
      item.dept.toLowerCase().includes(attendanceSearch.toLowerCase()) ||
      item.pt.toLowerCase().includes(attendanceSearch.toLowerCase());
    return matchPt && matchStatus && matchSearch;
  });

  const totalHadir = attendanceList.filter((i) => i.status === 'Hadir').length;
  const totalBelum = attendanceList.filter((i) => i.status === 'Belum Hadir').length;

  const handleExportExcel = () => {
    if (filteredAttendance.length === 0) {
      onNotify('Tidak ada data peserta yang sesuai untuk diekspor.');
      return;
    }
    const defaultClinicInfo: ClinicInfo = clinic || {
      nama: 'KLINIK UTAMA RAWAT JALAN OZA MEDIKA',
      alamat: 'Jl. Raya Merak No. 12, Cilegon, Banten',
      telepon: '(0254) 571234',
      email: 'info@ozamedika.co.id',
      penanggungJawab: 'dr. H. Ahmad Fauzi, Sp.Ok',
      sipDokter: 'SIP. 446/012/DINKES/2023',
    };
    exportCorporateMcuToExcel(filteredAttendance, defaultClinicInfo, {
      companyName: filterPt,
      department: 'SEMUA',
      startDate: '',
      endDate: '',
    });
    onNotify(`Berhasil mengekspor ${filteredAttendance.length} peserta ke format Excel (.xlsx)!`);
  };

  const handleSave = (record: AttendanceRecord) => {
    if (onSavePatient) {
      onSavePatient(record);
    } else {
      onAddPatient(record);
    }
  };

  return (
    <div className="space-y-3.5 sm:space-y-4">
      {/* Breadcrumb & Navigation Mode Tabs */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5">
        <div className="flex flex-wrap items-center gap-1.5 text-xs sm:text-[12.5px] text-[#64748B]">
          <span>Dashboard</span>
          <span>/</span>
          <span className="font-bold text-[#0F172A]">Registrasi Peserta MCU</span>
          <span>/</span>
          <span className="text-[#0E7490] font-bold">
            {activeTab === 'form' && 'Form Informasi Data Peserta MCU'}
            {activeTab === 'import' && 'Impor Massal Excel'}
            {activeTab === 'attendance' && 'Daftar Hadir & Monitoring'}
          </span>
        </div>

        {/* Tab Controls */}
        <div className="flex flex-wrap items-center gap-1 p-0.5 bg-slate-200/80 rounded-xl border border-slate-300 text-xs font-bold">
          <button
            type="button"
            onClick={() => setActiveTab('form')}
            className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeTab === 'form'
                ? 'bg-white text-[#0E7490] shadow-2xs'
                : 'text-[#475569] hover:text-[#0F172A]'
            }`}
          >
            <User className="w-3.5 h-3.5 shrink-0" />
            <span>Formulir Peserta (Template MCU)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('attendance')}
            className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeTab === 'attendance'
                ? 'bg-white text-[#0E7490] shadow-2xs'
                : 'text-[#475569] hover:text-[#0F172A]'
            }`}
          >
            <ClipboardCheck className="w-3.5 h-3.5 shrink-0" />
            <span>Daftar Hadir MCU ({attendanceList.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('import')}
            className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeTab === 'import'
                ? 'bg-white text-[#0E7490] shadow-2xs'
                : 'text-[#475569] hover:text-[#0F172A]'
            }`}
          >
            <FileSpreadsheet className="w-3.5 h-3.5 shrink-0" />
            <span>Impor Massal Excel</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: EXACT TEMPLATE FORM "INFORMASI DATA PESERTA MCU" */}
      {/* ========================================================================= */}
      {activeTab === 'form' && (
        <RegistrasiTemplateForm
          companies={companies}
          attendanceList={attendanceList}
          packages={packages}
          clinic={clinic}
          labelConfig={labelConfig}
          onUpdateLabelConfig={onUpdateLabelConfig}
          onSave={handleSave}
          onNotify={onNotify}
          onOpenList={() => setActiveTab('attendance')}
          initialMcuNo={selectedMcuForForm}
        />
      )}

      {/* ========================================================================= */}
      {/* TAB 2: DAFTAR HADIR & ABSENSI REAL-TIME */}
      {/* ========================================================================= */}
      {activeTab === 'attendance' && (
        <div className="bg-white border border-[#E2E8F0] rounded-xl p-3.5 sm:p-4 shadow-2xs space-y-3.5">
          <div className="flex flex-wrap items-center justify-between gap-2.5 border-b border-[#E2E8F0] pb-2.5">
            <div>
              <h3 className="text-[16px] font-bold text-[#0F172A] flex items-center gap-2">
                <ClipboardCheck className="w-4.5 h-4.5 text-[#0E7490]" />
                Monitoring Absensi &amp; Daftar Peserta MCU
              </h3>
              <p className="text-[11.5px] text-[#64748B]">
                Pantau status kehadiran peserta, verifikasi identitas, dan cetak berkas absensi harian.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-1.5">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#ECFEFF] text-[#0E7490] border border-[#A5F3FC]">
                Total: {attendanceList.length}
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#DCFCE7] text-[#15803D] border border-[#86EFAC]">
                Hadir: {totalHadir}
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#FEF3C7] text-[#B45309] border border-[#FCD34D]">
                Belum: {totalBelum}
              </span>
            </div>
          </div>

          {/* Filters Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 bg-[#F8FAFC] p-2.5 sm:p-3 rounded-lg border border-[#E2E8F0]">
            <div>
              <label className="block text-[11px] font-bold text-[#475569] mb-0.5">
                Perusahaan (PT)
              </label>
              <select
                value={filterPt}
                onChange={(e) => setFilterPt(e.target.value)}
                className="w-full px-2.5 py-1.5 bg-white border border-[#CBD5E1] rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-cyan-500/20"
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
              <label className="block text-[11px] font-bold text-[#475569] mb-0.5">
                Status Kehadiran
              </label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="w-full px-2.5 py-1.5 bg-white border border-[#CBD5E1] rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-cyan-500/20"
              >
                <option value="SEMUA">Semua Status</option>
                <option value="Hadir">Hadir ({totalHadir})</option>
                <option value="Belum Hadir">Belum Hadir ({totalBelum})</option>
              </select>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-[11px] font-bold text-[#475569] mb-0.5">
                Cari Peserta
              </label>
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-[#94A3B8] absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={attendanceSearch}
                  onChange={(e) => setAttendanceSearch(e.target.value)}
                  placeholder="Cari nama peserta, No MCU, NIK, PT, atau dept..."
                  className="w-full pl-8 pr-7 py-1.5 bg-white border border-[#CBD5E1] rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-cyan-500/20"
                />
                {attendanceSearch && (
                  <button
                    onClick={() => setAttendanceSearch('')}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Quick Action Export Buttons */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-[12.5px] text-[#64748B]">
              Menampilkan <b>{filteredAttendance.length}</b> dari{' '}
              <b>{attendanceList.length}</b> peserta.
            </p>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={handleExportExcel}
                className="px-3.5 py-1.5 rounded-lg border border-[#CBD5E1] bg-white hover:bg-slate-50 text-[#334155] text-[12.5px] font-bold flex items-center gap-1.5 shadow-xs cursor-pointer transition-colors"
                title="Unduh seluruh data peserta yang tampil ke berkas Excel .xlsx"
              >
                <Download className="w-3.5 h-3.5 text-emerald-600" />
                Ekspor Excel
              </button>
              <button
                type="button"
                onClick={() => {
                  window.print();
                }}
                className="px-3.5 py-1.5 rounded-lg bg-[#0E7490] hover:bg-[#0891B2] text-white text-[12.5px] font-bold flex items-center gap-1.5 shadow-xs cursor-pointer transition-colors"
                title="Cetak Berkas Daftar Hadir Resmi"
              >
                <Printer className="w-3.5 h-3.5" />
                Cetak Daftar Hadir
              </button>
            </div>
          </div>

          {/* Attendance Table */}
          <div className="overflow-x-auto border border-[#E2E8F0] rounded-xl shadow-xs">
            <table className="w-full text-left text-[13px] min-w-[780px]">
              <thead>
                <tr className="bg-[#F8FAFC] border-b border-[#E2E8F0] text-[12px] font-bold text-[#475569]">
                  <th className="py-3 px-4 w-12">No</th>
                  <th className="py-3 px-4">No. MCU</th>
                  <th className="py-3 px-4">Nama Peserta</th>
                  <th className="py-3 px-4">NIK / ID</th>
                  <th className="py-3 px-4">Perusahaan &amp; Dept</th>
                  <th className="py-3 px-4">Paket</th>
                  <th className="py-3 px-4">Status &amp; Jam</th>
                  <th className="py-3 px-4 text-center">Aksi Absensi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2E8F0]">
                {filteredAttendance.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-slate-500">
                      Tidak ada peserta MCU yang sesuai dengan filter pencarian.
                    </td>
                  </tr>
                ) : (
                  filteredAttendance.map((item, idx) => (
                    <tr key={item.mcuNo} className="hover:bg-[#F8FAFC]">
                      <td className="py-3 px-4 text-[#64748B] font-medium">
                        {idx + 1}
                      </td>
                      <td className="py-3 px-4 font-bold text-[#0E7490] font-mono">
                        {item.mcuNo}
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-bold text-[#0F172A]">{item.nama}</div>
                        <div className="text-[11.5px] text-[#64748B]">
                          {item.jk} • {item.tglLahir}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-mono text-[12px] font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded border border-slate-200 inline-block">
                          {item.nik || '-'}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-medium text-[#0F172A]">{item.pt}</div>
                        <div className="text-[11.5px] text-[#64748B]">
                          {item.dept} {item.bagian ? `• ${item.bagian}` : ''}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded bg-slate-100 text-[#334155] font-bold text-[11px] border border-slate-300">
                          {item.paket}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1.5">
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                              item.status === 'Hadir'
                                ? 'bg-[#DCFCE7] text-[#15803D]'
                                : 'bg-[#FEF3C7] text-[#B45309]'
                            }`}
                          >
                            {item.status}
                          </span>
                          {item.status === 'Hadir' && (
                            <span className="text-[11.5px] text-[#64748B]">
                              {item.jam}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => onToggleAttendance(item.mcuNo)}
                            className={`px-2.5 py-1 rounded text-[11.5px] font-bold transition-all cursor-pointer ${
                              item.status === 'Hadir'
                                ? 'bg-amber-100 text-amber-800 hover:bg-amber-200'
                                : 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                            }`}
                            title="Klik untuk mengubah status kehadiran"
                          >
                            {item.status === 'Hadir' ? 'Batalkan' : 'Tandai Hadir'}
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              setSelectedMcuForForm(item.mcuNo);
                              setActiveTab('form');
                            }}
                            className="px-2.5 py-1 rounded text-[11.5px] font-bold text-[#0E7490] hover:bg-cyan-50 border border-transparent hover:border-cyan-200 cursor-pointer transition-colors"
                            title="Buka dan edit data peserta ini langsung di formulir"
                          >
                            Edit
                          </button>

                          <button
                            type="button"
                            onClick={() => setReprintPatient(item)}
                            className="px-2 py-1 rounded text-[11.5px] font-bold bg-cyan-50 hover:bg-cyan-100 text-cyan-800 border border-cyan-200 flex items-center gap-1 shadow-2xs cursor-pointer transition-colors"
                            title="Cetak Ulang Label Stiker Thermal"
                          >
                            <Printer className="w-3 h-3" />
                            Label
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
      {/* TAB 3: IMPOR MASSAL EXCEL */}
      {/* ========================================================================= */}
      {activeTab === 'import' && (
        <MassImportSection
          companies={companies}
          attendanceList={attendanceList}
          onBulkAddPatients={(records) => {
            if (onBulkAddPatients) {
              onBulkAddPatients(records);
            }
          }}
          onNotify={onNotify}
          onNavigateToForm={() => setActiveTab('form')}
        />
      )}

      {/* Reprint Thermal Label Modal from Attendance Table */}
      {reprintPatient && (
        <ThermalLabelPrintModal
          isOpen={true}
          onClose={() => setReprintPatient(null)}
          patient={reprintPatient}
          clinic={
            clinic || {
              nama: 'KLINIK SEHAT TERPADU',
              legalitas: '',
              alamat: '',
              kota: '',
              provinsi: '',
              kodePos: '',
              telp: '',
              email: '',
              web: '',
              penanggungJawab: '',
              izinOperasional: '',
              dokterPJ: '',
            }
          }
          packages={packages}
          defaultConfig={labelConfig}
          onSaveConfig={onUpdateLabelConfig}
          onNotify={onNotify}
        />
      )}
    </div>
  );
};
