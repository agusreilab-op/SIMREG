import React, { useState, useRef, useEffect } from 'react';
import {
  Stethoscope,
  Building,
  UserCheck,
  Plus,
  Edit,
  Trash2,
  CheckCircle2,
  Info,
  Search,
  Sparkles,
  Activity,
  Microscope,
  FileText,
  Ear,
  Wind,
  ShieldCheck,
  Save,
  X,
  Copy,
  PenTool,
  Stamp,
  Signature,
  Upload,
  RotateCcw,
  Check,
  AlertCircle,
  Eye,
  Sliders,
  Palette,
} from 'lucide-react';
import { Company, Doctor, CompanyExaminerConfig, ClinicInfo } from '../types';
import {
  generateDoctorSignatureSvg,
  generateDoctorStampSvg,
  SIGNATURE_PRESETS,
  STAMP_PRESETS,
} from '../utils/signatureStampPresets';
import { ConfirmDeleteModal } from './ConfirmDeleteModal';

interface ExaminerConfigViewProps {
  companies: Company[];
  doctors: Doctor[];
  examinerConfigs: CompanyExaminerConfig[];
  clinic?: ClinicInfo;
  onUpdateExaminerConfigs: (configs: CompanyExaminerConfig[]) => void;
  onNotify: (msg: string) => void;
}

export const ExaminerConfigView: React.FC<ExaminerConfigViewProps> = ({
  companies,
  doctors,
  examinerConfigs,
  clinic,
  onUpdateExaminerConfigs,
  onNotify,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  // Form states for Add / Edit
  const [formCompany, setFormCompany] = useState('');
  const [formKoordinator, setFormKoordinator] = useState('');
  const [formKoordinatorTtd, setFormKoordinatorTtd] = useState('');
  const [formKoordinatorStempel, setFormKoordinatorStempel] = useState('');
  const [formFisik, setFormFisik] = useState('');
  const [formRadiologi, setFormRadiologi] = useState('');
  const [formPatologi, setFormPatologi] = useState('');
  const [formTht, setFormTht] = useState('');
  const [formParu, setFormParu] = useState('');
  const [formOkupasi, setFormOkupasi] = useState('');
  const [formKeterangan, setFormKeterangan] = useState('');
  const [formLokasi, setFormLokasi] = useState('');
  const [formTglTugas, setFormTglTugas] = useState('');

  // Dedicated Quick Modal State: TTD & Stempel Digital Dokter Koordinator
  const [ttdModalConfig, setTtdModalConfig] = useState<CompanyExaminerConfig | null>(null);
  const [modalTtd, setModalTtd] = useState('');
  const [modalStempel, setModalStempel] = useState('');
  const [ttdTab, setTtdTab] = useState<'upload' | 'draw' | 'preset'>('upload');
  const [stempelTab, setStempelTab] = useState<'generate' | 'upload' | 'preset'>('generate');
  
  // Stamp generator form states
  const [stampGenClinic, setStampGenClinic] = useState('');
  const [stampGenDoctor, setStampGenDoctor] = useState('');
  const [stampGenRole, setStampGenRole] = useState('KOORDINATOR MCU');
  const [stampGenLegalitas, setStampGenLegalitas] = useState('PELAYANAN KESEHATAN MCU');
  const [stampColor, setStampColor] = useState('#0E7490');

  // Drawing Canvas states
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawColor, setDrawColor] = useState('#1E3A8A');
  const [hasDrawnOnCanvas, setHasDrawnOnCanvas] = useState(false);

  // Filtered list
  const filteredConfigs = examinerConfigs.filter(
    (c) =>
      c.companyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.koordinatorMcu.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.pemeriksaFisik.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Open modal/form for add
  const handleOpenAdd = () => {
    setEditingId(null);
    const firstCompany = companies[0]?.nama || '';
    setFormCompany(firstCompany);

    // Auto-suggest default doctors based on specialty
    const defOkupasi =
      doctors.find((d) => d.spesialis.toLowerCase().includes('okupasi'))?.nama ||
      doctors[0]?.nama ||
      '';
    const defFisik =
      doctors.find(
        (d) =>
          d.spesialis.toLowerCase().includes('umum') ||
          d.spesialis.toLowerCase().includes('pemeriksa')
      )?.nama ||
      doctors[3]?.nama ||
      '';
    const defRad =
      doctors.find((d) => d.spesialis.toLowerCase().includes('radiologi'))?.nama ||
      doctors[1]?.nama ||
      '';
    const defPK =
      doctors.find((d) => d.spesialis.toLowerCase().includes('patologi'))?.nama ||
      doctors[2]?.nama ||
      '';
    const defTht =
      doctors.find((d) => d.spesialis.toLowerCase().includes('tht'))?.nama ||
      doctors[4]?.nama ||
      '';
    const defParu =
      doctors.find((d) => d.spesialis.toLowerCase().includes('paru'))?.nama ||
      doctors[5]?.nama ||
      '';

    setFormKoordinator(defOkupasi);
    setFormKoordinatorTtd(generateDoctorSignatureSvg(defOkupasi, 0, '#1E3A8A'));
    setFormKoordinatorStempel(
      generateDoctorStampSvg({
        clinicName: clinic?.nama || 'KLINIK MEDIKA SEHAT NUSANTARA',
        doctorName: defOkupasi,
        roleTitle: 'KOORDINATOR MCU',
        color: '#0E7490',
      })
    );
    setFormFisik(defFisik);
    setFormRadiologi(defRad);
    setFormPatologi(defPK);
    setFormTht(defTht);
    setFormParu(defParu);
    setFormOkupasi(defOkupasi);
    setFormKeterangan('Penugasan Tim Medis Pemeriksaan Kesehatan Kerja');
    setFormLokasi('');
    setFormTglTugas(new Date().toISOString().split('T')[0]);
    setIsEditing(true);
  };

  // Open modal/form for edit
  const handleOpenEdit = (config: CompanyExaminerConfig) => {
    setEditingId(config.id);
    setFormCompany(config.companyName);
    setFormKoordinator(config.koordinatorMcu);
    setFormKoordinatorTtd(config.koordinatorTtdUrl || '');
    setFormKoordinatorStempel(config.koordinatorStempelUrl || '');
    setFormFisik(config.pemeriksaFisik);
    setFormRadiologi(config.dokterRadiologi);
    setFormPatologi(config.dokterPatologiKlinik);
    setFormTht(config.dokterSpesialisTht);
    setFormParu(config.dokterSpesialisParu);
    setFormOkupasi(config.dokterSpesialisOkupasi);
    setFormKeterangan(config.keterangan || '');
    setFormLokasi(config.lokasiMcu || '');
    setFormTglTugas(config.tglTugas || new Date().toISOString().split('T')[0]);
    setIsEditing(true);
  };

  // Open dedicated modal for TTD & Stempel Koordinator
  const handleOpenTtdStempelModal = (config: CompanyExaminerConfig) => {
    setTtdModalConfig(config);
    setModalTtd(config.koordinatorTtdUrl || '');
    setModalStempel(config.koordinatorStempelUrl || '');
    setStampGenClinic(clinic?.nama || 'KLINIK MEDIKA SEHAT NUSANTARA');
    setStampGenDoctor(config.koordinatorMcu || 'dr. Koordinator MCU');
    setStampGenRole('KOORDINATOR MCU');
    setStampGenLegalitas(clinic?.legalitas || 'PELAYANAN KESEHATAN MCU');
    setTtdTab('upload');
    setStempelTab('generate');
    setHasDrawnOnCanvas(false);
  };

  // Save full configuration
  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formCompany.trim()) {
      onNotify('Silakan pilih atau masukkan nama perusahaan!');
      return;
    }

    if (editingId !== null) {
      // Update existing
      const updated = examinerConfigs.map((c) =>
        c.id === editingId
          ? {
              ...c,
              companyName: formCompany.trim(),
              koordinatorMcu: formKoordinator,
              koordinatorTtdUrl: formKoordinatorTtd,
              koordinatorStempelUrl: formKoordinatorStempel,
              pemeriksaFisik: formFisik,
              dokterRadiologi: formRadiologi,
              dokterPatologiKlinik: formPatologi,
              dokterSpesialisTht: formTht,
              dokterSpesialisParu: formParu,
              dokterSpesialisOkupasi: formOkupasi,
              keterangan: formKeterangan,
              lokasiMcu: formLokasi,
              tglTugas: formTglTugas,
            }
          : c
      );
      onUpdateExaminerConfigs(updated);
      onNotify(`Penugasan tim dokter untuk ${formCompany} berhasil diperbarui!`);
    } else {
      // Create new
      const newConfig: CompanyExaminerConfig = {
        id: Date.now(),
        companyName: formCompany.trim(),
        koordinatorMcu: formKoordinator,
        koordinatorTtdUrl: formKoordinatorTtd,
        koordinatorStempelUrl: formKoordinatorStempel,
        pemeriksaFisik: formFisik,
        dokterRadiologi: formRadiologi,
        dokterPatologiKlinik: formPatologi,
        dokterSpesialisTht: formTht,
        dokterSpesialisParu: formParu,
        dokterSpesialisOkupasi: formOkupasi,
        keterangan: formKeterangan,
        lokasiMcu: formLokasi,
        tglTugas: formTglTugas,
      };
      onUpdateExaminerConfigs([newConfig, ...examinerConfigs]);
      onNotify(`Penugasan dokter pemeriksa untuk ${formCompany} berhasil ditambahkan!`);
    }

    setIsEditing(false);
  };

  // Delete confirmation modal state
  const [deleteModalState, setDeleteModalState] = useState<{
    isOpen: boolean;
    id: number;
    compName: string;
  }>({
    isOpen: false,
    id: 0,
    compName: '',
  });

  // Delete configuration
  const handleDelete = (id: number, compName: string) => {
    setDeleteModalState({
      isOpen: true,
      id,
      compName,
    });
  };

  const handleConfirmDelete = () => {
    const { id, compName } = deleteModalState;
    setDeleteModalState((prev) => ({ ...prev, isOpen: false }));
    const filtered = examinerConfigs.filter((c) => c.id !== id);
    onUpdateExaminerConfigs(filtered);
    onNotify(`Penugasan dokter untuk ${compName} telah dihapus.`);
  };

  // Duplicate configuration
  const handleDuplicate = (config: CompanyExaminerConfig) => {
    const duplicated: CompanyExaminerConfig = {
      ...config,
      id: Date.now(),
      companyName: `${config.companyName} (Salinan)`,
    };
    onUpdateExaminerConfigs([duplicated, ...examinerConfigs]);
    onNotify(`Penugasan dokter berhasil disalin sebagai ${duplicated.companyName}!`);
  };

  // Save TTD & Stempel from dedicated modal
  const handleSaveTtdStempelModal = () => {
    if (!ttdModalConfig) return;

    const updated = examinerConfigs.map((c) =>
      c.id === ttdModalConfig.id
        ? {
            ...c,
            koordinatorTtdUrl: modalTtd,
            koordinatorStempelUrl: modalStempel,
          }
        : c
    );

    onUpdateExaminerConfigs(updated);
    onNotify(
      `TTD dan Stempel Digital Dokter Koordinator (${ttdModalConfig.koordinatorMcu}) untuk ${ttdModalConfig.companyName} berhasil disimpan!`
    );
    setTtdModalConfig(null);
  };

  // File Upload Handlers
  const handleUploadTtdFile = (e: React.ChangeEvent<HTMLInputElement>, isForm: boolean = false) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      if (result) {
        if (isForm) {
          setFormKoordinatorTtd(result);
        } else {
          setModalTtd(result);
        }
        onNotify('File TTD digital berhasil dimuat.');
      }
    };
    reader.readAsDataURL(file);
  };

  const handleUploadStempelFile = (
    e: React.ChangeEvent<HTMLInputElement>,
    isForm: boolean = false
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      if (result) {
        if (isForm) {
          setFormKoordinatorStempel(result);
        } else {
          setModalStempel(result);
        }
        onNotify('File Stempel digital berhasil dimuat.');
      }
    };
    reader.readAsDataURL(file);
  };

  // Canvas Drawing Handlers
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = 'touches' in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = 'touches' in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top;

    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.strokeStyle = drawColor;
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    setIsDrawing(true);
    setHasDrawnOnCanvas(true);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = 'touches' in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = 'touches' in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top;

    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasDrawnOnCanvas(false);
  };

  const applyCanvasSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dataUrl = canvas.toDataURL('image/png');
    setModalTtd(dataUrl);
    onNotify('Goresan TTD digital berhasil diterapkan!');
  };

  // Apply Generated Stamp
  const handleApplyGeneratedStamp = () => {
    const generatedSvg = generateDoctorStampSvg({
      clinicName: stampGenClinic || clinic?.nama,
      doctorName: stampGenDoctor,
      roleTitle: stampGenRole,
      legalitas: stampGenLegalitas,
      color: stampColor,
    });
    setModalStempel(generatedSvg);
    onNotify('Stempel digital bulat resmi berhasil dibuat & diterapkan!');
  };

  return (
    <div className="space-y-6">
      {/* Header Info */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-[20px] font-extrabold text-[#0F172A] tracking-tight flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-sm">
              <Stethoscope className="w-5 h-5" />
            </div>
            Setting Dokter Pemeriksa MCU
          </h2>
          <p className="text-[13px] text-[#64748B] mt-0.5">
            Konfigurasi penugasan tim dokter per perusahaan klien, lengkap dengan fitur pengesahan TTD &amp; stempel digital khusus Dokter Koordinator MCU.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleOpenAdd}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-[13px] font-bold shadow-md shadow-indigo-600/20 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Tambah Penugasan PT
          </button>
        </div>
      </div>

      {/* Role Explanation Banner */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-indigo-50 via-sky-50 to-blue-50 border border-indigo-200/80 text-[12.5px] shadow-2xs">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center shrink-0 mt-0.5 shadow-xs">
            <Sparkles className="w-4 h-4" />
          </div>
          <div className="space-y-1.5 flex-1">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h4 className="font-extrabold text-indigo-950 text-[13.5px]">
                Integrasi Peran Tim Dokter &amp; Tanda Tangan / Stempel Digital Resmi:
              </h4>
              <span className="text-[11px] font-bold px-2 py-0.5 bg-indigo-600 text-white rounded-full">
                Fitur Baru: TTD &amp; Stempel Koordinator
              </span>
            </div>
            <p className="text-[11.5px] text-slate-600">
              Dokter Koordinator MCU bertindak sebagai penanggung jawab utama yang mengesahkan buku laporan hasil pemeriksaan kesehatan kerja. TTD dan stempel digital yang Anda atur akan otomatis tercetak di Halaman 2 Booklet MCU dan Lembar Rekapitulasi PT.
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-2 pt-1">
              <div className="p-2 rounded-lg bg-white border-2 border-indigo-300 shadow-2xs">
                <div className="text-[11px] font-black text-indigo-800 uppercase tracking-wider flex items-center gap-1">
                  <UserCheck className="w-3 h-3 text-indigo-600" /> Koordinator
                </div>
                <div className="text-[10px] font-semibold text-indigo-900 mt-0.5">TTD &amp; Stempel Resmi PT</div>
              </div>
              <div className="p-2 rounded-lg bg-white border border-indigo-100 shadow-2xs">
                <div className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider flex items-center gap-1">
                  <Activity className="w-3 h-3" /> Fisik
                </div>
                <div className="text-[10px] text-slate-600 mt-0.5">Vital &amp; Head-to-Toe</div>
              </div>
              <div className="p-2 rounded-lg bg-white border border-indigo-100 shadow-2xs">
                <div className="text-[11px] font-bold text-blue-700 uppercase tracking-wider flex items-center gap-1">
                  <FileText className="w-3 h-3" /> Radiologi
                </div>
                <div className="text-[10px] text-slate-600 mt-0.5">Thorax &amp; PACS Lightbox</div>
              </div>
              <div className="p-2 rounded-lg bg-white border border-indigo-100 shadow-2xs">
                <div className="text-[11px] font-bold text-amber-700 uppercase tracking-wider flex items-center gap-1">
                  <Microscope className="w-3 h-3" /> Patologi (PK)
                </div>
                <div className="text-[10px] text-slate-600 mt-0.5">Hema, Kimia &amp; Urin</div>
              </div>
              <div className="p-2 rounded-lg bg-white border border-indigo-100 shadow-2xs">
                <div className="text-[11px] font-bold text-purple-700 uppercase tracking-wider flex items-center gap-1">
                  <Ear className="w-3 h-3" /> THT
                </div>
                <div className="text-[10px] text-slate-600 mt-0.5">Audiometri Nada Murni</div>
              </div>
              <div className="p-2 rounded-lg bg-white border border-indigo-100 shadow-2xs">
                <div className="text-[11px] font-bold text-teal-700 uppercase tracking-wider flex items-center gap-1">
                  <Wind className="w-3 h-3" /> Paru (Sp.P)
                </div>
                <div className="text-[10px] text-slate-600 mt-0.5">Spirometri Faal Paru</div>
              </div>
              <div className="p-2 rounded-lg bg-white border border-indigo-100 shadow-2xs">
                <div className="text-[11px] font-bold text-rose-700 uppercase tracking-wider flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3" /> Okupasi (Sp.Ok)
                </div>
                <div className="text-[10px] text-slate-600 mt-0.5">Fitness to Work K3</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filter / Search Bar */}
      <div className="flex items-center justify-between gap-4 bg-white p-3.5 rounded-xl border border-slate-200">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Cari perusahaan atau nama dokter pemeriksa..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-[13px] text-slate-800 placeholder-slate-400 focus:bg-white focus:border-indigo-500 focus:outline-none transition-colors"
          />
        </div>
        <div className="text-[12px] text-slate-500 font-medium">
          Menampilkan <b>{filteredConfigs.length}</b> dari {examinerConfigs.length} penugasan PT
        </div>
      </div>

      {/* Card Grid of Configurations */}
      <div className="grid grid-cols-1 gap-4">
        {filteredConfigs.map((cfg) => {
          const isDefault = cfg.companyName.toLowerCase().includes('default');
          return (
            <div
              key={cfg.id}
              className={`bg-white border rounded-2xl p-5 shadow-xs transition-all ${
                isDefault
                  ? 'border-indigo-200 bg-indigo-50/10'
                  : 'border-slate-200 hover:border-indigo-300 hover:shadow-md'
              }`}
            >
              <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-100 pb-3 mb-4">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-11 h-11 rounded-xl flex items-center justify-center font-extrabold text-[15px] ${
                      isDefault
                        ? 'bg-indigo-100 text-indigo-700'
                        : 'bg-slate-100 text-slate-700'
                    }`}
                  >
                    <Building className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-[16px] font-bold text-slate-900">
                        {cfg.companyName}
                      </h3>
                      {isDefault && (
                        <span className="px-2 py-0.5 rounded-full text-[10.5px] font-extrabold bg-indigo-100 text-indigo-800 border border-indigo-200">
                          Default Fallback
                        </span>
                      )}
                    </div>
                    <div className="flex flex-wrap items-center gap-3 text-[12px] text-slate-500 mt-0.5">
                      {cfg.lokasiMcu && (
                        <span>
                          Lokasi: <b className="text-slate-700">{cfg.lokasiMcu}</b>
                        </span>
                      )}
                      {cfg.tglTugas && (
                        <span>
                          Tgl Pelaksanaan: <b className="text-slate-700">{cfg.tglTugas}</b>
                        </span>
                      )}
                      {cfg.keterangan && (
                        <span className="text-slate-400">| {cfg.keterangan}</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => handleDuplicate(cfg)}
                    title="Duplikasi Penugasan ke PT Baru"
                    className="p-2 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors cursor-pointer"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleOpenEdit(cfg)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-[12px] font-bold transition-colors cursor-pointer"
                  >
                    <Edit className="w-3.5 h-3.5" />
                    Edit Tim Dokter
                  </button>
                  {!isDefault && (
                    <button
                      onClick={() => handleDelete(cfg.id, cfg.companyName)}
                      className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              {/* Doctors Assignment Matrix */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                {/* 1. Koordinator MCU (SPECIAL CARD WITH TTD & STEMPEL ACTIONS) */}
                <div className="p-3.5 rounded-xl bg-gradient-to-b from-indigo-50/70 via-white to-indigo-50/30 border-2 border-indigo-200/90 shadow-xs flex flex-col justify-between relative">
                  <div>
                    <div className="flex items-center justify-between gap-1 mb-1">
                      <span className="text-[11px] font-black text-indigo-700 uppercase tracking-wider flex items-center gap-1">
                        <UserCheck className="w-3.5 h-3.5 text-indigo-600" />
                        Koordinator MCU
                      </span>
                      <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded bg-indigo-100 text-indigo-800 border border-indigo-200">
                        Pengesah
                      </span>
                    </div>
                    <div className="font-bold text-[13.5px] text-slate-900 leading-tight">
                      {cfg.koordinatorMcu || '-'}
                    </div>
                    <div className="text-[10.5px] text-slate-500 mt-0.5">Penanggung jawab tim &amp; booklet PT</div>
                  </div>

                  {/* Status Badges & Thumbnail for TTD + Stempel */}
                  <div className="mt-3 pt-2 border-t border-indigo-100 space-y-2">
                    <div className="flex items-center gap-1.5 flex-wrap text-[10.5px]">
                      {/* TTD badge */}
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded font-semibold border ${
                          cfg.koordinatorTtdUrl
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : 'bg-slate-100 text-slate-500 border-slate-200'
                        }`}
                      >
                        <Signature className="w-3 h-3" />
                        {cfg.koordinatorTtdUrl ? 'TTD Aktif' : 'Belum Ada TTD'}
                      </span>

                      {/* Stempel badge */}
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded font-semibold border ${
                          cfg.koordinatorStempelUrl
                            ? 'bg-cyan-50 text-cyan-800 border-cyan-200'
                            : 'bg-slate-100 text-slate-500 border-slate-200'
                        }`}
                      >
                        <Stamp className="w-3 h-3" />
                        {cfg.koordinatorStempelUrl ? 'Stempel Aktif' : 'Belum Ada Stempel'}
                      </span>
                    </div>

                    {/* Miniature visual preview if either is set */}
                    {(cfg.koordinatorTtdUrl || cfg.koordinatorStempelUrl) && (
                      <div className="relative h-12 bg-white rounded-lg border border-indigo-100 p-1 flex items-center justify-center overflow-hidden shadow-2xs">
                        {cfg.koordinatorStempelUrl && (
                          <img
                            src={cfg.koordinatorStempelUrl}
                            alt="Stempel"
                            className="absolute h-11 w-11 object-contain opacity-80 rotate-[-5deg]"
                          />
                        )}
                        {cfg.koordinatorTtdUrl ? (
                          <img
                            src={cfg.koordinatorTtdUrl}
                            alt="TTD"
                            className="relative z-10 h-8 max-w-[90px] object-contain drop-shadow-2xs"
                          />
                        ) : (
                          <span className="text-[10px] text-slate-400 italic">Hanya Stempel</span>
                        )}
                      </div>
                    )}

                    {/* Dedicated Button for Dokter Koordinator MCU */}
                    <button
                      onClick={() => handleOpenTtdStempelModal(cfg)}
                      className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-[11.5px] font-bold shadow-xs hover:shadow-sm transition-all cursor-pointer"
                      title="Atur Tanda Tangan & Stempel Digital Dokter Koordinator MCU"
                    >
                      <PenTool className="w-3.5 h-3.5" />
                      <span>
                        {cfg.koordinatorTtdUrl || cfg.koordinatorStempelUrl
                          ? 'Atur TTD & Stempel'
                          : '+ Tambah TTD & Stempel'}
                      </span>
                    </button>
                  </div>
                </div>

                {/* 2. Pemeriksa Fisik */}
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 flex flex-col justify-between">
                  <div className="text-[11px] font-bold text-emerald-600 uppercase tracking-wider flex items-center gap-1.5 mb-1">
                    <Activity className="w-3.5 h-3.5" />
                    Pemeriksa Fisik
                  </div>
                  <div className="font-bold text-[13px] text-slate-900 leading-tight">
                    {cfg.pemeriksaFisik || '-'}
                  </div>
                  <div className="text-[11px] text-slate-400 mt-1">Tanda vital, visus &amp; fisik lengkap</div>
                </div>

                {/* 3. Dokter Radiologi */}
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 flex flex-col justify-between">
                  <div className="text-[11px] font-bold text-blue-600 uppercase tracking-wider flex items-center gap-1.5 mb-1">
                    <FileText className="w-3.5 h-3.5" />
                    Dokter Radiologi (Sp.Rad)
                  </div>
                  <div className="font-bold text-[13px] text-slate-900 leading-tight">
                    {cfg.dokterRadiologi || '-'}
                  </div>
                  <div className="text-[11px] text-slate-400 mt-1">Eksplorasi Thorax PA &amp; CTR</div>
                </div>

                {/* 4. Dokter Patologi Klinik */}
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 flex flex-col justify-between">
                  <div className="text-[11px] font-bold text-amber-600 uppercase tracking-wider flex items-center gap-1.5 mb-1">
                    <Microscope className="w-3.5 h-3.5" />
                    Dokter Patologi Klinik (Sp.PK)
                  </div>
                  <div className="font-bold text-[13px] text-slate-900 leading-tight">
                    {cfg.dokterPatologiKlinik || '-'}
                  </div>
                  <div className="text-[11px] text-slate-400 mt-1">Verifikator hasil tes laboratorium</div>
                </div>

                {/* 5. Dokter Spesialis THT */}
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 flex flex-col justify-between">
                  <div className="text-[11px] font-bold text-purple-600 uppercase tracking-wider flex items-center gap-1.5 mb-1">
                    <Ear className="w-3.5 h-3.5" />
                    Dokter Spesialis THT (Sp.THT-BKL)
                  </div>
                  <div className="font-bold text-[13px] text-slate-900 leading-tight">
                    {cfg.dokterSpesialisTht || '-'}
                  </div>
                  <div className="text-[11px] text-slate-400 mt-1">Pembaca audiogram nada murni PTA</div>
                </div>

                {/* 6. Dokter Spesialis Paru */}
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 flex flex-col justify-between">
                  <div className="text-[11px] font-bold text-teal-600 uppercase tracking-wider flex items-center gap-1.5 mb-1">
                    <Wind className="w-3.5 h-3.5" />
                    Dokter Spesialis Paru (Sp.P)
                  </div>
                  <div className="font-bold text-[13px] text-slate-900 leading-tight">
                    {cfg.dokterSpesialisParu || '-'}
                  </div>
                  <div className="text-[11px] text-slate-400 mt-1">Evaluasi ventilasi kurva spirometri</div>
                </div>

                {/* 7. Dokter Spesialis Okupasi */}
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 flex flex-col justify-between sm:col-span-2 lg:col-span-1">
                  <div className="text-[11px] font-bold text-rose-600 uppercase tracking-wider flex items-center gap-1.5 mb-1">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    Dokter Spesialis Okupasi (Sp.Ok)
                  </div>
                  <div className="font-bold text-[13px] text-slate-900 leading-tight">
                    {cfg.dokterSpesialisOkupasi || '-'}
                  </div>
                  <div className="text-[11px] text-slate-400 mt-1">Pengesah status Fitness to Work K3</div>
                </div>
              </div>
            </div>
          );
        })}

        {filteredConfigs.length === 0 && (
          <div className="text-center py-12 bg-white rounded-2xl border border-slate-200 text-slate-400">
            <Stethoscope className="w-10 h-10 mx-auto mb-2 text-slate-300" />
            <p className="text-[14px] font-medium text-slate-600">Tidak ada penugasan dokter yang cocok.</p>
            <p className="text-[12px] text-slate-400 mt-0.5">Silakan tambahkan penugasan baru dengan menekan tombol Tambah di atas.</p>
          </div>
        )}
      </div>

      {/* DEDICATED MODAL: TTD & STEMPEL DIGITAL DOKTER KOORDINATOR MCU */}
      {ttdModalConfig && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-4xl w-full p-6 sm:p-7 shadow-2xl border border-slate-100 space-y-6 max-h-[94vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-start justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-md shadow-indigo-600/20 shrink-0">
                  <PenTool className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-[18px] font-extrabold text-slate-900">
                    Pengaturan Tanda Tangan &amp; Stempel Digital
                  </h3>
                  <p className="text-[12.5px] text-slate-500">
                    Khusus untuk <b className="text-indigo-900">Dokter Koordinator MCU ({ttdModalConfig.koordinatorMcu})</b> pada proyek <b className="text-slate-800">{ttdModalConfig.companyName}</b>.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setTtdModalConfig(null)}
                className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Explanation Note */}
            <div className="flex items-center gap-2.5 p-3 rounded-xl bg-indigo-50/80 border border-indigo-200 text-[12px] text-indigo-900 font-medium">
              <Info className="w-4 h-4 text-indigo-600 shrink-0" />
              <span>
                TTD dan stempel resmi ini akan otomatis dipasang bertumpuk pada kolom pengesahan <b>Koordinator MCU (Halaman 2 Booklet MCU)</b> dan surat penugasan rekapitulasi.
              </span>
            </div>

            {/* 2-Column Setting Grid: TTD (Left) & Stempel (Right) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* PANEL 1: TANDA TANGAN DIGITAL (TTD) */}
              <div className="p-4 rounded-2xl bg-slate-50/80 border border-slate-200 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Signature className="w-4 h-4 text-indigo-600" />
                    <h4 className="font-bold text-[14px] text-slate-900">1. Tanda Tangan Digital (TTD)</h4>
                  </div>
                  {modalTtd && (
                    <button
                      onClick={() => setModalTtd('')}
                      className="text-[11px] font-bold text-rose-600 hover:text-rose-700 transition-colors cursor-pointer"
                    >
                      Hapus TTD
                    </button>
                  )}
                </div>

                {/* Sub-tabs for TTD */}
                <div className="flex p-1 bg-slate-200/80 rounded-xl text-[11.5px] font-bold">
                  <button
                    type="button"
                    onClick={() => setTtdTab('upload')}
                    className={`flex-1 py-1.5 rounded-lg transition-all cursor-pointer ${
                      ttdTab === 'upload' ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Upload File
                  </button>
                  <button
                    type="button"
                    onClick={() => setTtdTab('draw')}
                    className={`flex-1 py-1.5 rounded-lg transition-all cursor-pointer ${
                      ttdTab === 'draw' ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Gores Langsung
                  </button>
                  <button
                    type="button"
                    onClick={() => setTtdTab('preset')}
                    className={`flex-1 py-1.5 rounded-lg transition-all cursor-pointer ${
                      ttdTab === 'preset' ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Pilihan Preset
                  </button>
                </div>

                {/* Tab: Upload File TTD */}
                {ttdTab === 'upload' && (
                  <div className="space-y-3">
                    <label className="border-2 border-dashed border-slate-300 hover:border-indigo-400 rounded-xl p-4 flex flex-col items-center justify-center gap-2 bg-white cursor-pointer transition-colors">
                      <Upload className="w-6 h-6 text-slate-400" />
                      <div className="text-center">
                        <span className="text-[12px] font-bold text-indigo-600">Pilih file gambar TTD</span>
                        <p className="text-[10.5px] text-slate-400 mt-0.5">Format PNG (transparan disarankan), JPG, SVG</p>
                      </div>
                      <input
                        type="file"
                        accept="image/png,image/jpeg,image/svg+xml"
                        onChange={(e) => handleUploadTtdFile(e, false)}
                        className="hidden"
                      />
                    </label>
                  </div>
                )}

                {/* Tab: Gores Langsung (Drawing Canvas) */}
                {ttdTab === 'draw' && (
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between text-[11px] text-slate-500">
                      <span>Goreskan tanda tangan pada area kotak di bawah:</span>
                      <div className="flex items-center gap-1.5">
                        <span>Warna:</span>
                        <button
                          type="button"
                          onClick={() => setDrawColor('#1E3A8A')}
                          className={`w-4 h-4 rounded-full border ${drawColor === '#1E3A8A' ? 'ring-2 ring-indigo-500 ring-offset-1' : ''}`}
                          style={{ backgroundColor: '#1E3A8A' }}
                          title="Biru Tinta Dokter"
                        />
                        <button
                          type="button"
                          onClick={() => setDrawColor('#0F172A')}
                          className={`w-4 h-4 rounded-full border ${drawColor === '#0F172A' ? 'ring-2 ring-indigo-500 ring-offset-1' : ''}`}
                          style={{ backgroundColor: '#0F172A' }}
                          title="Hitam Pekat"
                        />
                      </div>
                    </div>

                    <div className="bg-white rounded-xl border border-slate-300 overflow-hidden shadow-2xs touch-none">
                      <canvas
                        ref={canvasRef}
                        width={340}
                        height={130}
                        onMouseDown={startDrawing}
                        onMouseMove={draw}
                        onMouseUp={stopDrawing}
                        onMouseLeave={stopDrawing}
                        onTouchStart={startDrawing}
                        onTouchMove={draw}
                        onTouchEnd={stopDrawing}
                        className="w-full h-[130px] cursor-crosshair bg-white"
                      />
                    </div>

                    <div className="flex items-center justify-between gap-2">
                      <button
                        type="button"
                        onClick={clearCanvas}
                        className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg cursor-pointer"
                      >
                        <RotateCcw className="w-3 h-3" /> Bersihkan
                      </button>
                      <button
                        type="button"
                        onClick={applyCanvasSignature}
                        disabled={!hasDrawnOnCanvas}
                        className="inline-flex items-center gap-1 px-3 py-1 text-[11px] font-bold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 rounded-lg shadow-xs cursor-pointer"
                      >
                        <Check className="w-3 h-3" /> Gunakan Goresan Ini
                      </button>
                    </div>
                  </div>
                )}

                {/* Tab: Presets */}
                {ttdTab === 'preset' && (
                  <div className="space-y-2">
                    <p className="text-[11px] text-slate-500">Pilih salah satu template tanda tangan dokter:</p>
                    <div className="grid grid-cols-1 gap-2">
                      {SIGNATURE_PRESETS.map((preset) => {
                        const sampleSvg = generateDoctorSignatureSvg(
                          ttdModalConfig.koordinatorMcu,
                          preset.styleIndex,
                          preset.color
                        );
                        return (
                          <div
                            key={preset.id}
                            onClick={() => {
                              setModalTtd(sampleSvg);
                              onNotify(`Preset ${preset.nama} dipilih.`);
                            }}
                            className="p-2 bg-white rounded-xl border border-slate-200 hover:border-indigo-500 flex items-center justify-between gap-2 cursor-pointer transition-all hover:shadow-xs"
                          >
                            <div className="flex items-center gap-2">
                              <img src={sampleSvg} alt={preset.nama} className="h-8 max-w-[80px] object-contain" />
                              <span className="text-[11.5px] font-bold text-slate-800">{preset.nama}</span>
                            </div>
                            <span className="text-[10.5px] font-bold text-indigo-600">Pilih</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Active TTD Preview Box */}
                <div className="p-3 bg-white rounded-xl border border-slate-200">
                  <div className="text-[11px] font-bold text-slate-600 mb-1.5 flex items-center justify-between">
                    <span>Pratinjau TTD Aktif:</span>
                    {modalTtd ? (
                      <span className="text-emerald-600 font-bold flex items-center gap-1 text-[10px]">
                        <CheckCircle2 className="w-3 h-3" /> Terpasang
                      </span>
                    ) : (
                      <span className="text-slate-400 italic text-[10px]">Belum ada TTD</span>
                    )}
                  </div>
                  <div className="h-16 bg-slate-50 rounded-lg flex items-center justify-center p-2 border border-slate-100">
                    {modalTtd ? (
                      <img src={modalTtd} alt="TTD Aktif" className="max-h-14 max-w-[150px] object-contain drop-shadow-xs" />
                    ) : (
                      <span className="text-[11px] text-slate-400 italic">Silakan upload, gores, atau pilih preset</span>
                    )}
                  </div>
                </div>
              </div>

              {/* PANEL 2: STEMPEL DIGITAL RESMI */}
              <div className="p-4 rounded-2xl bg-slate-50/80 border border-slate-200 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Stamp className="w-4 h-4 text-cyan-700" />
                    <h4 className="font-bold text-[14px] text-slate-900">2. Stempel Digital Resmi</h4>
                  </div>
                  {modalStempel && (
                    <button
                      onClick={() => setModalStempel('')}
                      className="text-[11px] font-bold text-rose-600 hover:text-rose-700 transition-colors cursor-pointer"
                    >
                      Hapus Stempel
                    </button>
                  )}
                </div>

                {/* Sub-tabs for Stempel */}
                <div className="flex p-1 bg-slate-200/80 rounded-xl text-[11.5px] font-bold">
                  <button
                    type="button"
                    onClick={() => setStempelTab('generate')}
                    className={`flex-1 py-1.5 rounded-lg transition-all cursor-pointer ${
                      stempelTab === 'generate' ? 'bg-white text-cyan-800 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Buat Otomatis
                  </button>
                  <button
                    type="button"
                    onClick={() => setStempelTab('upload')}
                    className={`flex-1 py-1.5 rounded-lg transition-all cursor-pointer ${
                      stempelTab === 'upload' ? 'bg-white text-cyan-800 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Upload File
                  </button>
                  <button
                    type="button"
                    onClick={() => setStempelTab('preset')}
                    className={`flex-1 py-1.5 rounded-lg transition-all cursor-pointer ${
                      stempelTab === 'preset' ? 'bg-white text-cyan-800 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Preset Warna
                  </button>
                </div>

                {/* Tab: Buat Otomatis (Generator Cap Bulat K3) */}
                {stempelTab === 'generate' && (
                  <div className="space-y-2.5">
                    <div className="grid grid-cols-1 gap-2">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-600 mb-0.5">Nama Klinik / Faskes</label>
                        <input
                          type="text"
                          value={stampGenClinic}
                          onChange={(e) => setStampGenClinic(e.target.value)}
                          className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-[12px]"
                          placeholder="Nama klinik penyelenggara..."
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-[11px] font-bold text-slate-600 mb-0.5">Dokter Koordinator</label>
                          <input
                            type="text"
                            value={stampGenDoctor}
                            onChange={(e) => setStampGenDoctor(e.target.value)}
                            className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-[12px]"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-bold text-slate-600 mb-0.5">Warna Tinta Cap</label>
                          <select
                            value={stampColor}
                            onChange={(e) => setStampColor(e.target.value)}
                            className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-[12px] font-semibold text-slate-800"
                          >
                            <option value="#0E7490">Tosca Medis (Cyan)</option>
                            <option value="#1E3A8A">Biru Tua Medis (Blue)</option>
                            <option value="#6B21A8">Ungu Cap Basah (Purple)</option>
                            <option value="#991B1B">Merah Resmi K3 (Red)</option>
                          </select>
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={handleApplyGeneratedStamp}
                      className="w-full inline-flex items-center justify-center gap-1.5 py-2 rounded-xl bg-cyan-700 hover:bg-cyan-800 text-white text-[12px] font-bold shadow-xs transition-colors cursor-pointer"
                    >
                      <Stamp className="w-3.5 h-3.5" />
                      Generate &amp; Terapkan Stempel Ini
                    </button>
                  </div>
                )}

                {/* Tab: Upload File Stempel */}
                {stempelTab === 'upload' && (
                  <div className="space-y-3">
                    <label className="border-2 border-dashed border-slate-300 hover:border-cyan-500 rounded-xl p-4 flex flex-col items-center justify-center gap-2 bg-white cursor-pointer transition-colors">
                      <Upload className="w-6 h-6 text-slate-400" />
                      <div className="text-center">
                        <span className="text-[12px] font-bold text-cyan-700">Pilih file gambar stempel</span>
                        <p className="text-[10.5px] text-slate-400 mt-0.5">Format PNG transparan disarankan</p>
                      </div>
                      <input
                        type="file"
                        accept="image/png,image/jpeg,image/svg+xml"
                        onChange={(e) => handleUploadStempelFile(e, false)}
                        className="hidden"
                      />
                    </label>
                  </div>
                )}

                {/* Tab: Presets */}
                {stempelTab === 'preset' && (
                  <div className="space-y-2">
                    <p className="text-[11px] text-slate-500">Pilih warna tinta cap stempel:</p>
                    <div className="grid grid-cols-2 gap-2">
                      {STAMP_PRESETS.map((preset) => {
                        const stampSample = generateDoctorStampSvg({
                          clinicName: clinic?.nama,
                          doctorName: ttdModalConfig.koordinatorMcu,
                          color: preset.color,
                        });
                        return (
                          <div
                            key={preset.id}
                            onClick={() => {
                              setModalStempel(stampSample);
                              setStampColor(preset.color);
                              onNotify(`Warna ${preset.nama} diterapkan.`);
                            }}
                            className="p-2.5 bg-white rounded-xl border border-slate-200 hover:border-cyan-600 flex items-center gap-2 cursor-pointer transition-all hover:shadow-xs"
                          >
                            <img src={stampSample} alt={preset.nama} className="w-10 h-10 object-contain" />
                            <div className="text-[11px] font-bold text-slate-800 leading-tight">
                              {preset.nama}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Active Stempel Preview Box */}
                <div className="p-3 bg-white rounded-xl border border-slate-200">
                  <div className="text-[11px] font-bold text-slate-600 mb-1.5 flex items-center justify-between">
                    <span>Pratinjau Stempel Aktif:</span>
                    {modalStempel ? (
                      <span className="text-cyan-700 font-bold flex items-center gap-1 text-[10px]">
                        <CheckCircle2 className="w-3 h-3" /> Terpasang
                      </span>
                    ) : (
                      <span className="text-slate-400 italic text-[10px]">Belum ada Stempel</span>
                    )}
                  </div>
                  <div className="h-16 bg-slate-50 rounded-lg flex items-center justify-center p-2 border border-slate-100">
                    {modalStempel ? (
                      <img src={modalStempel} alt="Stempel Aktif" className="max-h-14 max-w-[80px] object-contain drop-shadow-xs" />
                    ) : (
                      <span className="text-[11px] text-slate-400 italic">Silakan buat otomatis atau upload file</span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* LIVE DOCUMENT PREVIEW (SIMULASI CETAK LEMBAR MCU) */}
            <div className="p-4 rounded-2xl bg-slate-100 border border-slate-300">
              <h4 className="text-[12px] font-extrabold text-slate-800 mb-2 flex items-center gap-1.5">
                <Eye className="w-4 h-4 text-slate-600" />
                Simulasi Tampilan Pengesahan pada Halaman 2 Booklet MCU:
              </h4>

              <div className="bg-white rounded-xl border border-slate-300 p-5 max-w-sm mx-auto shadow-sm text-center">
                <div className="text-[11.5px] font-bold text-slate-800 mb-1">
                  Koordinator MCU
                </div>
                <div className="text-[10px] text-slate-500 mb-2">
                  Dokter Penanggung Jawab / Koordinator
                </div>

                <div className="relative w-44 h-24 mx-auto flex items-center justify-center my-1">
                  {/* Stempel Layer */}
                  {modalStempel ? (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-90 rotate-[-6deg]">
                      <img src={modalStempel} alt="Stempel Preview" className="w-24 h-24 object-contain" />
                    </div>
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-25">
                      <span className="text-[10px] text-slate-400 italic">[Area Stempel Cap]</span>
                    </div>
                  )}

                  {/* TTD Layer */}
                  {modalTtd ? (
                    <img
                      src={modalTtd}
                      alt="TTD Preview"
                      className="relative z-10 max-h-16 max-w-[140px] object-contain drop-shadow-xs"
                    />
                  ) : (
                    <span className="relative z-10 text-[11px] text-slate-400 italic">[Area Tanda Tangan]</span>
                  )}
                </div>

                <div className="font-bold text-[12px] text-slate-900 border-b border-slate-700 pb-0.5 mt-2 inline-block min-w-[180px]">
                  {ttdModalConfig.koordinatorMcu}
                </div>
              </div>
            </div>

            {/* Footer Actions */}
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setTtdModalConfig(null)}
                className="px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-[13px] font-bold transition-colors cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleSaveTtdStempelModal}
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-[13px] font-bold shadow-md shadow-indigo-600/20 transition-all cursor-pointer"
              >
                <Save className="w-4 h-4" />
                Simpan TTD &amp; Stempel Koordinator
              </button>
            </div>
          </div>
        </div>
      )}

      {/* FULL MODAL / DIALOG FORM EDIT & TAMBAH PENUGASAN PT */}
      {isEditing && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-3xl w-full p-6 sm:p-8 shadow-2xl border border-slate-100 space-y-6 max-h-[92vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-md">
                  <Stethoscope className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-[18px] font-extrabold text-slate-900">
                    {editingId !== null ? 'Edit Penugasan Tim Dokter MCU' : 'Tambah Penugasan Dokter MCU PT'}
                  </h3>
                  <p className="text-[12.5px] text-slate-500">
                    Tentukan dokter pemeriksa untuk setiap peran pada pemeriksaan kesehatan kerja perusahaan.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsEditing(false)}
                className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-5">
              {/* Perusahaan / PT */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3">
                <label className="block text-[13px] font-bold text-slate-900">
                  Pilih Perusahaan / PT Klien <span className="text-rose-500">*</span>
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <select
                      value={formCompany}
                      onChange={(e) => setFormCompany(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-[13px] text-slate-800 font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                    >
                      <option value="">-- Pilih dari Daftar Perusahaan --</option>
                      {companies.map((c) => (
                        <option key={c.id} value={c.nama}>
                          {c.nama} ({c.kode})
                        </option>
                      ))}
                      <option value="PT. A">PT. A (Contoh Proyek)</option>
                      <option value="Default / Standar Umum">Default / Standar Umum</option>
                    </select>
                  </div>
                  <div>
                    <input
                      type="text"
                      placeholder="Atau ketik nama PT manual..."
                      value={formCompany}
                      onChange={(e) => setFormCompany(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-[13px] text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div>
                    <label className="block text-[11.5px] font-bold text-slate-600 mb-1">
                      Lokasi Pelaksanaan MCU (Opsional)
                    </label>
                    <input
                      type="text"
                      placeholder="contoh: In-House Klinik Pabrik / Gd. Auditorium"
                      value={formLokasi}
                      onChange={(e) => setFormLokasi(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-[12.5px]"
                    />
                  </div>
                  <div>
                    <label className="block text-[11.5px] font-bold text-slate-600 mb-1">
                      Tanggal Tugas MCU
                    </label>
                    <input
                      type="date"
                      value={formTglTugas}
                      onChange={(e) => setFormTglTugas(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-[12.5px]"
                    />
                  </div>
                </div>
              </div>

              {/* 7 Dokter Peranan Form */}
              <div className="space-y-4">
                <h4 className="font-extrabold text-[14.5px] text-slate-900 border-b border-slate-100 pb-2 flex items-center justify-between">
                  <span>Daftar Tim Dokter Pemeriksa Berdasarkan Peran</span>
                  <span className="text-[12px] font-normal text-slate-500">
                    Otomatis masuk ke Form MCU peserta PT ini
                  </span>
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* 1. Koordinator MCU (WITH TTD & STEMPEL CONFIGURATION EMBEDDED) */}
                  <div className="p-4 rounded-xl border-2 border-indigo-200 bg-indigo-50/40 space-y-3 md:col-span-2">
                    <div className="flex items-center justify-between">
                      <label className="block text-[12.5px] font-extrabold text-indigo-950 flex items-center gap-1.5">
                        <UserCheck className="w-4 h-4 text-indigo-600" />
                        1. Koordinator MCU (Penanggung Jawab Proyek) <span className="text-rose-500">*</span>
                      </label>
                      <span className="text-[11px] font-bold text-indigo-700 bg-white px-2 py-0.5 rounded border border-indigo-200">
                        Pengesah Booklet MCU
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <select
                          value={formKoordinator}
                          onChange={(e) => {
                            const newDoc = e.target.value;
                            setFormKoordinator(newDoc);
                            if (!formKoordinatorTtd && newDoc) {
                              setFormKoordinatorTtd(generateDoctorSignatureSvg(newDoc, 0, '#1E3A8A'));
                            }
                            if (!formKoordinatorStempel && newDoc) {
                              setFormKoordinatorStempel(
                                generateDoctorStampSvg({
                                  clinicName: clinic?.nama,
                                  doctorName: newDoc,
                                  color: '#0E7490',
                                })
                              );
                            }
                          }}
                          className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-[13px] font-semibold text-slate-800"
                        >
                          <option value="">-- Pilih Dokter Koordinator --</option>
                          {doctors.map((d) => (
                            <option key={d.id} value={d.nama}>
                              {d.nama} ({d.spesialis})
                            </option>
                          ))}
                        </select>
                        <p className="text-[11px] text-slate-500 mt-1">
                          Penanggung jawab pengesahan hasil MCU &amp; buku rekapitulasi.
                        </p>
                      </div>

                      {/* TTD & Stempel Controls */}
                      <div className="bg-white p-2.5 rounded-xl border border-indigo-200/80 space-y-2">
                        <div className="flex items-center justify-between text-[11px] font-bold text-slate-700">
                          <span>TTD &amp; Stempel Digital:</span>
                          <div className="flex items-center gap-1">
                            {formKoordinatorTtd && <span className="text-emerald-600">✓ TTD</span>}
                            {formKoordinatorStempel && <span className="text-cyan-700">✓ Stempel</span>}
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <label className="flex-1 inline-flex items-center justify-center gap-1 py-1.5 px-2 bg-slate-100 hover:bg-slate-200 rounded-lg text-[11px] font-bold text-slate-700 cursor-pointer transition-colors">
                            <Upload className="w-3 h-3 text-indigo-600" />
                            <span>Upload TTD</span>
                            <input
                              type="file"
                              accept="image/png,image/jpeg,image/svg+xml"
                              onChange={(e) => handleUploadTtdFile(e, true)}
                              className="hidden"
                            />
                          </label>

                          <label className="flex-1 inline-flex items-center justify-center gap-1 py-1.5 px-2 bg-slate-100 hover:bg-slate-200 rounded-lg text-[11px] font-bold text-slate-700 cursor-pointer transition-colors">
                            <Stamp className="w-3 h-3 text-cyan-700" />
                            <span>Upload Stempel</span>
                            <input
                              type="file"
                              accept="image/png,image/jpeg,image/svg+xml"
                              onChange={(e) => handleUploadStempelFile(e, true)}
                              className="hidden"
                            />
                          </label>

                          <button
                            type="button"
                            onClick={() => {
                              const doc = formKoordinator || 'dr. Koordinator MCU';
                              setFormKoordinatorTtd(generateDoctorSignatureSvg(doc, 0, '#1E3A8A'));
                              setFormKoordinatorStempel(
                                generateDoctorStampSvg({
                                  clinicName: clinic?.nama,
                                  doctorName: doc,
                                  color: '#0E7490',
                                })
                              );
                              onNotify('Preset TTD & Stempel otomatis telah dimuat.');
                            }}
                            className="px-2.5 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-[11px] font-bold rounded-lg cursor-pointer transition-colors"
                            title="Generate Otomatis Preset TTD & Stempel Resmi"
                          >
                            Preset
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* 2. Pemeriksa Fisik */}
                  <div className="p-3.5 rounded-xl border border-emerald-200 bg-emerald-50/30 space-y-1.5">
                    <label className="block text-[12px] font-bold text-emerald-900 flex items-center gap-1.5">
                      <Activity className="w-4 h-4 text-emerald-600" />
                      Pemeriksa Fisik <span className="text-rose-500">*</span>
                    </label>
                    <select
                      value={formFisik}
                      onChange={(e) => setFormFisik(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-[13px] font-semibold text-slate-800"
                    >
                      <option value="">-- Pilih Dokter Pemeriksa Fisik --</option>
                      {doctors.map((d) => (
                        <option key={d.id} value={d.nama}>
                          {d.nama} ({d.spesialis})
                        </option>
                      ))}
                    </select>
                    <p className="text-[11px] text-slate-500">Masuk ke Form Tanda Vital, Visus &amp; Head-to-Toe.</p>
                  </div>

                  {/* 3. Dokter Radiologi */}
                  <div className="p-3.5 rounded-xl border border-blue-200 bg-blue-50/30 space-y-1.5">
                    <label className="block text-[12px] font-bold text-blue-900 flex items-center gap-1.5">
                      <FileText className="w-4 h-4 text-blue-600" />
                      Dokter Radiologi (Sp.Rad) <span className="text-rose-500">*</span>
                    </label>
                    <select
                      value={formRadiologi}
                      onChange={(e) => setFormRadiologi(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-[13px] font-semibold text-slate-800"
                    >
                      <option value="">-- Pilih Dokter Spesialis Radiologi --</option>
                      {doctors.map((d) => (
                        <option key={d.id} value={d.nama}>
                          {d.nama} ({d.spesialis})
                        </option>
                      ))}
                    </select>
                    <p className="text-[11px] text-slate-500">Masuk ke Form Rontgen Thorax, CTR &amp; USG Abdomen.</p>
                  </div>

                  {/* 4. Dokter Patologi Klinik */}
                  <div className="p-3.5 rounded-xl border border-amber-200 bg-amber-50/30 space-y-1.5">
                    <label className="block text-[12px] font-bold text-amber-900 flex items-center gap-1.5">
                      <Microscope className="w-4 h-4 text-amber-600" />
                      Dokter Patologi Klinik (Sp.PK) <span className="text-rose-500">*</span>
                    </label>
                    <select
                      value={formPatologi}
                      onChange={(e) => setFormPatologi(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-[13px] font-semibold text-slate-800"
                    >
                      <option value="">-- Pilih Dokter Spesialis Patologi Klinik --</option>
                      {doctors.map((d) => (
                        <option key={d.id} value={d.nama}>
                          {d.nama} ({d.spesialis})
                        </option>
                      ))}
                    </select>
                    <p className="text-[11px] text-slate-500">Masuk ke Form Laboratorium Hematologi, Kimia &amp; Urin.</p>
                  </div>

                  {/* 5. Dokter Spesialis THT */}
                  <div className="p-3.5 rounded-xl border border-purple-200 bg-purple-50/30 space-y-1.5">
                    <label className="block text-[12px] font-bold text-purple-900 flex items-center gap-1.5">
                      <Ear className="w-4 h-4 text-purple-600" />
                      Dokter Spesialis THT (Sp.THT-BKL) <span className="text-rose-500">*</span>
                    </label>
                    <select
                      value={formTht}
                      onChange={(e) => setFormTht(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-[13px] font-semibold text-slate-800"
                    >
                      <option value="">-- Pilih Dokter Spesialis THT --</option>
                      {doctors.map((d) => (
                        <option key={d.id} value={d.nama}>
                          {d.nama} ({d.spesialis})
                        </option>
                      ))}
                    </select>
                    <p className="text-[11px] text-slate-500">Masuk ke Form Audiometri &amp; Interpretasi Nada Murni.</p>
                  </div>

                  {/* 6. Dokter Spesialis Paru */}
                  <div className="p-3.5 rounded-xl border border-teal-200 bg-teal-50/30 space-y-1.5">
                    <label className="block text-[12px] font-bold text-teal-900 flex items-center gap-1.5">
                      <Wind className="w-4 h-4 text-teal-600" />
                      Dokter Spesialis Paru (Sp.P) <span className="text-rose-500">*</span>
                    </label>
                    <select
                      value={formParu}
                      onChange={(e) => setFormParu(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-[13px] font-semibold text-slate-800"
                    >
                      <option value="">-- Pilih Dokter Spesialis Paru --</option>
                      {doctors.map((d) => (
                        <option key={d.id} value={d.nama}>
                          {d.nama} ({d.spesialis})
                        </option>
                      ))}
                    </select>
                    <p className="text-[11px] text-slate-500">Masuk ke Form Spirometri &amp; Gangguan Ventilasi Paru.</p>
                  </div>

                  {/* 7. Dokter Spesialis Okupasi */}
                  <div className="p-3.5 rounded-xl border border-rose-200 bg-rose-50/30 space-y-1.5 md:col-span-2">
                    <label className="block text-[12px] font-bold text-rose-900 flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4 text-rose-600" />
                      Dokter Spesialis Okupasi (Sp.Ok) <span className="text-rose-500">*</span>
                    </label>
                    <select
                      value={formOkupasi}
                      onChange={(e) => setFormOkupasi(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-[13px] font-semibold text-slate-800"
                    >
                      <option value="">-- Pilih Dokter Spesialis Kedokteran Okupasi --</option>
                      {doctors.map((d) => (
                        <option key={d.id} value={d.nama}>
                          {d.nama} ({d.spesialis})
                        </option>
                      ))}
                    </select>
                    <p className="text-[11px] text-slate-500">
                      Penilai akhir kelaikan kerja K3 (Fit to Work / Fit with Restriction / Unfit) &amp; Buku Laporan MCU.
                    </p>
                  </div>
                </div>
              </div>

              {/* Catatan / Keterangan */}
              <div>
                <label className="block text-[12.5px] font-bold text-slate-700 mb-1">
                  Catatan / Keterangan Tim Penugasan (Opsional)
                </label>
                <input
                  type="text"
                  placeholder="contoh: Tim MCU onsite pemeriksaan berkala tahunan K3..."
                  value={formKeterangan}
                  onChange={(e) => setFormKeterangan(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-[13px] text-slate-800"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-[13px] font-bold transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-[13px] font-bold shadow-md shadow-indigo-600/20 transition-all cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  Simpan Penugasan Dokter
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Confirm Delete Modal for Examiner Config */}
      <ConfirmDeleteModal
        isOpen={deleteModalState.isOpen}
        title="Hapus Penugasan Tim Dokter"
        category="Konfigurasi Tim Dokter"
        itemName={`Perusahaan: ${deleteModalState.compName}`}
        warningMessage={`Konfigurasi tim dokter pemeriksa untuk "${deleteModalState.compName}" akan dihapus dari sistem.`}
        onClose={() => setDeleteModalState((prev) => ({ ...prev, isOpen: false }))}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
};
