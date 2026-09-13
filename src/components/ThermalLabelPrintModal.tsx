import React, { useState, useEffect } from 'react';
import {
  Printer,
  X,
  Settings2,
  Plus,
  Trash2,
  QrCode,
  Barcode,
  Sparkles,
  Info,
  Maximize2,
  Sliders,
  Type,
  Minus,
  RotateCcw,
  ExternalLink,
} from 'lucide-react';
import {
  AttendanceRecord,
  ClinicInfo,
  MCUPackage,
  ThermalLabelConfig,
  ThermalPreset,
  ThermalFontFamily,
  ThermalFontSize,
  ThermalFontWeight,
} from '../types';
import {
  executeThermalPrint,
  openThermalPrintTab,
  LabelItemData,
  renderSingleLabelHtml,
} from '../utils/thermalPrinter';

interface ThermalLabelPrintModalProps {
  isOpen: boolean;
  onClose: () => void;
  patient: AttendanceRecord;
  clinic: ClinicInfo;
  packages: MCUPackage[];
  defaultConfig?: ThermalLabelConfig;
  onSaveConfig?: (config: ThermalLabelConfig) => void;
  onNotify?: (msg: string) => void;
}

const PRESET_OPTIONS: {
  id: ThermalPreset;
  label: string;
  w: number;
  h: number;
  desc: string;
}[] = [
  {
    id: '50x30',
    label: '50 x 30 mm (Standar Tabung Lab & Berkas)',
    w: 50,
    h: 30,
    desc: 'Ukuran paling umum untuk tabung darah EDTA, serum kimia, pot urine & berkas',
  },
  {
    id: '40x30',
    label: '40 x 30 mm (Thermal Kompak)',
    w: 40,
    h: 30,
    desc: 'Ukuran label ringkas untuk printer thermal portabel / tabung kecil',
  },
  {
    id: '40x20',
    label: '40 x 20 mm (Tabung Mikro / Jarum)',
    w: 40,
    h: 20,
    desc: 'Ukuran mikro khusus spesimen kecil & tabung kapiler',
  },
  {
    id: '60x40',
    label: '60 x 40 mm (Thermal Sedang Lengkap)',
    w: 60,
    h: 40,
    desc: 'Lebih lega untuk rincian biohazard, pemeriksaan & instansi',
  },
  {
    id: '70x35',
    label: '70 x 35 mm (Thermal Barcode Panjang)',
    w: 70,
    h: 35,
    desc: 'Format panjang untuk barcode densitas tinggi',
  },
  {
    id: '80x50',
    label: '80 x 50 mm (Map / Berkas Rekam Medis)',
    w: 80,
    h: 50,
    desc: 'Stiker folder / map berkas rekam medis peserta',
  },
  {
    id: 'custom',
    label: 'Kustom (Ukuran Bebas mm)',
    w: 50,
    h: 30,
    desc: 'Sesuaikan lebar dan tinggi secara manual sesuai stok stiker thermal Anda',
  },
];

const FONT_FAMILY_OPTIONS: {
  id: ThermalFontFamily;
  label: string;
  desc: string;
}[] = [
  {
    id: 'mono',
    label: 'Monospace (Courier)',
    desc: 'Paling tajam, kontras tinggi & terbaca presisi di print head thermal',
  },
  {
    id: 'sans',
    label: 'Sans-Serif (Modern)',
    desc: 'Bentuk huruf bersih proporsional (Arial/Inter/Segoe)',
  },
  {
    id: 'condensed',
    label: 'Condensed (Rapat)',
    desc: 'Huruf kompak vertikal, muat banyak data pada label sempit',
  },
  {
    id: 'serif',
    label: 'Serif (Formal)',
    desc: 'Gaya huruf klasik formal medis (Georgia/Times)',
  },
];

const FONT_SIZE_OPTIONS: {
  id: ThermalFontSize;
  label: string;
  desc: string;
}[] = [
  { id: 'extra-compact', label: 'Ekstra Kecil', desc: 'Cocok untuk stiker mikro 40x20 mm' },
  { id: 'compact', label: 'Kecil', desc: 'Cocok untuk stiker kompak 40x30 mm' },
  { id: 'normal', label: 'Standar (Normal)', desc: 'Ukuran ideal untuk stiker 50x30 mm' },
  { id: 'large', label: 'Besar', desc: 'Tulisan lebih tebal & besar untuk tabung lab' },
  { id: 'extra-large', label: 'Ekstra Besar', desc: 'Keterbacaan maksimal untuk lansia' },
];

const FONT_WEIGHT_OPTIONS: {
  id: ThermalFontWeight;
  label: string;
}[] = [
  { id: 'normal', label: 'Normal' },
  { id: 'bold', label: 'Tebal (Bold)' },
  { id: 'extra-bold', label: 'Ekstra Tebal (Black)' },
];

export interface EditableLabelItem {
  id: string;
  title: string;
  code: string;
  selected: boolean;
  qty: number; // Jumlah lembar spesifik per label
}

export const ThermalLabelPrintModal: React.FC<ThermalLabelPrintModalProps> = ({
  isOpen,
  onClose,
  patient,
  clinic,
  packages,
  defaultConfig,
  onSaveConfig,
  onNotify,
}) => {
  // Find matched package from Master
  const matchedPkg = packages.find(
    (p) =>
      p.kode.toLowerCase() === (patient.paket || '').toLowerCase() ||
      p.nama.toLowerCase().includes((patient.paket || '').toLowerCase())
  );

  // Configuration state
  const [config, setConfig] = useState<ThermalLabelConfig>(
    defaultConfig || {
      widthMm: 50,
      heightMm: 30,
      preset: '50x30',
      showClinicHeader: true,
      showPt: true,
      showDept: true,
      showDob: true,
      showPackage: true,
      showBarcode: true,
      barcodeType: 'barcode',
      fontFamily: 'mono',
      fontSize: 'normal',
      fontWeight: 'bold',
      copiesPerLabel: 1,
      showNik: true,
      showMcuNo: true,
      showName: true,
    }
  );

  const [labelItems, setLabelItems] = useState<EditableLabelItem[]>([]);
  const [activePreviewIndex, setActivePreviewIndex] = useState(0);
  const [isPrinting, setIsPrinting] = useState(false);
  const [showSettingsDrawer, setShowSettingsDrawer] = useState(false);
  const [showFontPanel, setShowFontPanel] = useState(true);

  // Initialize label items based on matched package or sensible defaults with per-label quantities
  useEffect(() => {
    if (matchedPkg && matchedPkg.labels && matchedPkg.labels.length > 0) {
      setLabelItems(
        matchedPkg.labels.map((lbl, idx) => {
          // Default: Registrasi typically 2, RO typically 1
          let defaultQuantity = lbl.defaultQty && lbl.defaultQty > 0 ? lbl.defaultQty : 1;
          const isReg =
            lbl.kode?.toUpperCase().includes('REG') ||
            lbl.kode?.toUpperCase().includes('BERKAS') ||
            lbl.nama?.toLowerCase().includes('registrasi') ||
            lbl.nama?.toLowerCase().includes('rekam medis');
          const isRo =
            lbl.kode?.toUpperCase().includes('RO') ||
            lbl.kode?.toUpperCase().includes('RONTGEN') ||
            lbl.nama?.toLowerCase().includes('rontgen');

          if (!lbl.defaultQty) {
            if (isReg) defaultQuantity = 2;
            else if (isRo) defaultQuantity = 1;
          }

          return {
            id: lbl.id || `lbl-${idx}`,
            title: lbl.nama,
            code: lbl.kode || `LBL-${idx + 1}`,
            selected: true,
            qty: defaultQuantity,
          };
        })
      );
    } else {
      // Sensible fallback with realistic sample: Registrasi = 2, RO = 1, etc.
      const pkgText = (patient.paket || '').toLowerCase();
      const hasRo =
        pkgText.includes('ro') ||
        pkgText.includes('rontgen') ||
        pkgText.includes('pai') ||
        pkgText.includes('exec');
      const hasLab =
        pkgText.includes('pai') ||
        pkgText.includes('exec') ||
        pkgText.includes('std') ||
        pkgText.includes('darah');

      const fallback: EditableLabelItem[] = [
        {
          id: '1',
          title: 'REGISTRASI',
          code: 'REG',
          selected: true,
          qty: 2, // Label registrasi cetak 2 lembar
        },
      ];

      if (hasRo) {
        fallback.push({
          id: '2',
          title: 'RONTGEN (RO)',
          code: 'RO',
          selected: true,
          qty: 1,
        });
      }

      if (hasLab) {
        fallback.push({
          id: '3',
          title: 'LABORATORIUM',
          code: 'LAB',
          selected: true,
          qty: 1,
        });
      } else if (!hasRo) {
        fallback.push({
          id: '2',
          title: 'RONTGEN (RO)',
          code: 'RO',
          selected: true,
          qty: 1,
        });
      }

      setLabelItems(fallback);
    }
  }, [matchedPkg, patient.paket]);

  if (!isOpen) return null;

  // Selected items & total sheets calculation
  const activeItems = labelItems.filter((item) => item.selected);
  const totalLabelsToPrint = activeItems.reduce((sum, item) => sum + Math.max(1, item.qty || 1), 0);

  // Update specific item quantity
  const handleUpdateQty = (id: string, delta: number) => {
    setLabelItems((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          const newQty = Math.max(1, Math.min(20, (item.qty || 1) + delta));
          return { ...item, qty: newQty };
        }
        return item;
      })
    );
  };

  const handleSetDirectQty = (id: string, value: number) => {
    const validValue = Math.max(1, Math.min(20, value || 1));
    setLabelItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, qty: validValue } : item))
    );
  };

  // Quick preset actions for quantities
  const handleApplyPresetQty = (type: 'reg2-ro1' | 'all1' | 'all2' | 'reset-master') => {
    if (type === 'reg2-ro1') {
      setLabelItems((prev) =>
        prev.map((item) => {
          const isReg =
            item.code.toUpperCase().includes('REG') ||
            item.code.toUpperCase().includes('BERKAS') ||
            item.title.toLowerCase().includes('registrasi');
          const isRo =
            item.code.toUpperCase().includes('RO') ||
            item.code.toUpperCase().includes('RONTGEN') ||
            item.title.toLowerCase().includes('rontgen');

          if (isReg) return { ...item, qty: 2 };
          if (isRo) return { ...item, qty: 1 };
          return { ...item, qty: 1 };
        })
      );
      onNotify?.('Diterapkan: Label Registrasi 2 Lbr, Label RO 1 Lbr.');
    } else if (type === 'all1') {
      setLabelItems((prev) => prev.map((item) => ({ ...item, qty: 1 })));
      onNotify?.('Semua label diatur ke 1 lembar.');
    } else if (type === 'all2') {
      setLabelItems((prev) => prev.map((item) => ({ ...item, qty: 2 })));
      onNotify?.('Semua label diatur ke 2 lembar duplikat.');
    } else if (type === 'reset-master' && matchedPkg?.labels) {
      setLabelItems((prev) =>
        prev.map((item) => {
          const found = matchedPkg.labels.find((l) => l.kode === item.code);
          return { ...item, qty: found?.defaultQty || 1 };
        })
      );
      onNotify?.('Jumlah lembar dikembalikan ke setingan master paket.');
    }
  };

  // Handle Preset change
  const handlePresetChange = (presetId: ThermalPreset) => {
    const selected = PRESET_OPTIONS.find((p) => p.id === presetId);
    if (selected && presetId !== 'custom') {
      const updated: ThermalLabelConfig = {
        ...config,
        preset: presetId,
        widthMm: selected.w,
        heightMm: selected.h,
      };
      setConfig(updated);
      onSaveConfig?.(updated);
    } else {
      const updated: ThermalLabelConfig = {
        ...config,
        preset: 'custom',
      };
      setConfig(updated);
      onSaveConfig?.(updated);
    }
  };

  // Update Font Config
  const handleUpdateFontConfig = (partial: Partial<ThermalLabelConfig>) => {
    const updated: ThermalLabelConfig = {
      ...config,
      ...partial,
    };
    setConfig(updated);
    onSaveConfig?.(updated);
  };

  // Add custom label item
  const handleAddLabelItem = () => {
    const newId = `custom-${Date.now()}`;
    const nextNum = labelItems.length + 1;
    setLabelItems([
      ...labelItems,
      {
        id: newId,
        title: `LABEL TAMBAHAN #${nextNum}`,
        code: `LBL-${nextNum}`,
        selected: true,
        qty: 1,
      },
    ]);
  };

  // Remove label item
  const handleRemoveLabelItem = (id: string) => {
    if (labelItems.length <= 1) return;
    setLabelItems(labelItems.filter((i) => i.id !== id));
    if (activePreviewIndex >= labelItems.length - 1) {
      setActivePreviewIndex(Math.max(0, labelItems.length - 2));
    }
  };

  // Update label item title
  const handleUpdateLabelTitle = (id: string, title: string) => {
    setLabelItems(
      labelItems.map((i) => (i.id === id ? { ...i, title: title.toUpperCase() } : i))
    );
  };

  // Toggle selection
  const handleToggleSelect = (id: string) => {
    setLabelItems(
      labelItems.map((i) => (i.id === id ? { ...i, selected: !i.selected } : i))
    );
  };

  // Trigger Thermal Print
  const handlePrint = async () => {
    if (activeItems.length === 0) {
      onNotify?.('Pilih minimal 1 label untuk dicetak.');
      return;
    }

    setIsPrinting(true);
    try {
      const formattedItems: LabelItemData[] = activeItems.map((item, idx) => ({
        index: idx + 1,
        total: activeItems.length,
        labelTitle: item.title,
        labelCode: item.code,
        patient,
        quantity: Math.max(1, item.qty || 1),
      }));

      await executeThermalPrint(formattedItems, clinic, config);
      onNotify?.(
        `Mencetak ${totalLabelsToPrint} lembar stiker thermal untuk ${patient.nama} (#${patient.mcuNo})`
      );
      setTimeout(() => {
        setIsPrinting(false);
      }, 500);
    } catch (err) {
      console.error('Error printing thermal labels:', err);
      setIsPrinting(false);
      onNotify?.('Gagal mengirim ke printer. Periksa koneksi printer thermal Anda.');
    }
  };

  // Standalone tab print fallback
  const handlePrintNewTab = () => {
    if (activeItems.length === 0) {
      onNotify?.('Pilih minimal 1 label untuk dicetak.');
      return;
    }
    const formattedItems: LabelItemData[] = activeItems.map((item, idx) => ({
      index: idx + 1,
      total: activeItems.length,
      labelTitle: item.title,
      labelCode: item.code,
      patient,
      quantity: Math.max(1, item.qty || 1),
    }));
    const opened = openThermalPrintTab(formattedItems, clinic, config);
    if (opened) {
      onNotify?.(`Membuka jendela cetak mandiri thermal untuk ${patient.nama}`);
    } else {
      handlePrint();
    }
  };

  // Current preview label
  const activePreviewItem =
    activeItems[activePreviewIndex % Math.max(1, activeItems.length)] || activeItems[0] || {
      title: 'REGISTRASI',
      code: 'REG',
      qty: 2,
    };

  const previewItemData: LabelItemData = {
    index: (activePreviewIndex % Math.max(1, activeItems.length)) + 1,
    total: Math.max(1, activeItems.length),
    labelTitle: activePreviewItem.title,
    labelCode: activePreviewItem.code,
    patient,
    quantity: activePreviewItem.qty || 1,
    copyIndex: 1,
    copyTotal: activePreviewItem.qty || 1,
  };

  // Raw HTML string for live preview
  const previewHtml = renderSingleLabelHtml(previewItemData, clinic, config);

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-y-auto animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl max-w-5xl w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[95vh]">
        {/* Header Modal */}
        <div className="bg-gradient-to-r from-slate-950 via-cyan-950 to-slate-900 text-white p-4 px-6 flex items-center justify-between border-b border-cyan-800/40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/20 border border-cyan-400/30 flex items-center justify-center text-cyan-300 shadow-inner">
              <Printer className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-black text-[16px] tracking-wide text-white">
                  Cetak Label Stiker Thermal MCU
                </h3>
                <span className="px-2 py-0.5 rounded-full bg-cyan-400/20 border border-cyan-400/40 text-cyan-200 text-[10.5px] font-bold">
                  Roll / Continuous
                </span>
              </div>
              <p className="text-[12px] text-cyan-200/80">
                Atur jenis &amp; ukuran font, serta tentukan jumlah lembar masing-masing label stiker
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowSettingsDrawer(!showSettingsDrawer)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                showSettingsDrawer
                  ? 'bg-cyan-500 text-slate-950'
                  : 'bg-white/10 hover:bg-white/20 text-cyan-200'
              }`}
            >
              <Settings2 className="w-4 h-4" />
              <span>Opsi Label</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="text-slate-400 hover:text-white p-1.5 rounded-xl hover:bg-white/10 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Top Info Banner: Data Wajib & Paket Sinkronisasi */}
        <div className="bg-cyan-50 border-b border-cyan-100 p-3 px-6 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-cyan-950">
            <div className="flex items-center gap-1.5 font-bold">
              <span className="w-2 h-2 rounded-full bg-cyan-600" />
              <span>No. MCU:</span>
              <span className="px-2 py-0.5 rounded bg-cyan-900 text-white font-mono font-black">
                #{patient.mcuNo}
              </span>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-slate-500">Nama:</span>
              <strong className="text-slate-900 uppercase">{patient.nama}</strong>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-slate-500">NIK:</span>
              <strong className="text-slate-800">{patient.nik || '-'}</strong>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-slate-500">Paket:</span>
              <span className="px-2 py-0.5 rounded bg-cyan-100 text-cyan-900 font-bold border border-cyan-200">
                {patient.paket || 'MCU'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-950 font-black border border-emerald-300 shadow-2xs">
              🖨️ Total Cetak: {totalLabelsToPrint} Lembar
            </span>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4 flex-1 bg-slate-50/60">
          {/* SECTION 1: ATUR JENIS, UKURAN, DAN KETEBALAN FONT STIKER */}
          <div className="bg-white p-4 rounded-2xl border border-cyan-200/80 shadow-xs space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-cyan-100 text-cyan-800 flex items-center justify-center font-black">
                  <Type className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-bold text-[13.5px] text-slate-900">
                    Pengaturan Jenis &amp; Ukuran Font Stiker Thermal
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    Kustomisasi tipografi agar terbaca tajam dan tidak kabur pada mesin cetak thermal
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowFontPanel(!showFontPanel)}
                className="text-[11.5px] text-cyan-700 hover:text-cyan-900 font-bold cursor-pointer"
              >
                {showFontPanel ? 'Tutup Pengaturan Font ▲' : 'Buka Pengaturan Font ▼'}
              </button>
            </div>

            {showFontPanel && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 pt-1">
                {/* 1. Jenis Font (Font Family) */}
                <div className="space-y-1.5">
                  <label className="block text-[11.5px] font-bold text-slate-700">
                    Jenis Font (Font Family):
                  </label>
                  <select
                    value={config.fontFamily || 'mono'}
                    onChange={(e) =>
                      handleUpdateFontConfig({
                        fontFamily: e.target.value as ThermalFontFamily,
                      })
                    }
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-800 focus:ring-2 focus:ring-cyan-500 focus:bg-white"
                  >
                    {FONT_FAMILY_OPTIONS.map((opt) => (
                      <option key={opt.id} value={opt.id}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                  <p className="text-[10.5px] text-slate-500">
                    {FONT_FAMILY_OPTIONS.find((f) => f.id === (config.fontFamily || 'mono'))?.desc}
                  </p>
                </div>

                {/* 2. Ukuran Font (Font Size) */}
                <div className="space-y-1.5">
                  <label className="block text-[11.5px] font-bold text-slate-700">
                    Ukuran Font (Font Size):
                  </label>
                  <select
                    value={config.fontSize || 'normal'}
                    onChange={(e) =>
                      handleUpdateFontConfig({
                        fontSize: e.target.value as ThermalFontSize,
                      })
                    }
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-800 focus:ring-2 focus:ring-cyan-500 focus:bg-white"
                  >
                    {FONT_SIZE_OPTIONS.map((opt) => (
                      <option key={opt.id} value={opt.id}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                  <p className="text-[10.5px] text-slate-500">
                    {FONT_SIZE_OPTIONS.find((s) => s.id === (config.fontSize || 'normal'))?.desc}
                  </p>
                </div>

                {/* 3. Ketebalan Font (Font Weight) */}
                <div className="space-y-1.5">
                  <label className="block text-[11.5px] font-bold text-slate-700">
                    Ketebalan Huruf (Font Weight):
                  </label>
                  <div className="grid grid-cols-3 gap-1.5">
                    {FONT_WEIGHT_OPTIONS.map((w) => (
                      <button
                        key={w.id}
                        type="button"
                        onClick={() => handleUpdateFontConfig({ fontWeight: w.id })}
                        className={`py-2 px-1 rounded-xl text-[11px] font-bold border transition-all cursor-pointer ${
                          (config.fontWeight || 'bold') === w.id
                            ? 'bg-cyan-900 text-white border-cyan-950 shadow-2xs'
                            : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                        }`}
                      >
                        {w.label}
                      </button>
                    ))}
                  </div>
                  <p className="text-[10.5px] text-slate-500">
                    Disarankan &apos;Tebal&apos; untuk thermal transfer/direct
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* SECTION 2: DIMENSI KERTAS & FORMAT BARCODE */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
            {/* Pilihan Ukuran Kertas Thermal */}
            <div className="md:col-span-2 space-y-1.5">
              <label className="block text-[12px] font-bold text-slate-700 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Maximize2 className="w-3.5 h-3.5 text-cyan-700" />
                  Ukuran Label Kertas Printer Thermal:
                </span>
                <span className="text-cyan-700 font-mono font-bold">
                  {config.widthMm} x {config.heightMm} mm
                </span>
              </label>
              <div className="flex flex-col sm:flex-row gap-2">
                <select
                  value={config.preset}
                  onChange={(e) => handlePresetChange(e.target.value as ThermalPreset)}
                  className="flex-1 px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-cyan-500 focus:bg-white"
                >
                  {PRESET_OPTIONS.map((opt) => (
                    <option key={opt.id} value={opt.id}>
                      {opt.label}
                    </option>
                  ))}
                </select>

                {/* Input manual mm jika custom */}
                {config.preset === 'custom' && (
                  <div className="flex items-center gap-1.5 shrink-0 animate-in fade-in">
                    <input
                      type="number"
                      min="20"
                      max="150"
                      value={config.widthMm}
                      onChange={(e) =>
                        setConfig({
                          ...config,
                          widthMm: Math.max(15, parseInt(e.target.value) || 50),
                        })
                      }
                      title="Lebar (mm)"
                      className="w-16 px-2 py-2 text-center text-xs font-bold border border-slate-300 rounded-xl bg-white"
                      placeholder="Lebar"
                    />
                    <span className="text-slate-400 text-xs font-bold">×</span>
                    <input
                      type="number"
                      min="15"
                      max="150"
                      value={config.heightMm}
                      onChange={(e) =>
                        setConfig({
                          ...config,
                          heightMm: Math.max(10, parseInt(e.target.value) || 30),
                        })
                      }
                      title="Tinggi (mm)"
                      className="w-16 px-2 py-2 text-center text-xs font-bold border border-slate-300 rounded-xl bg-white"
                      placeholder="Tinggi"
                    />
                    <span className="text-slate-500 text-xs font-bold">mm</span>
                  </div>
                )}
              </div>
              <p className="text-[11px] text-slate-500">
                {PRESET_OPTIONS.find((p) => p.id === config.preset)?.desc}
              </p>
            </div>

            {/* Pilihan Barcode vs QR Code */}
            <div className="space-y-1.5">
              <label className="block text-[12px] font-bold text-slate-700">
                Format Simbologi Barcode:
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setConfig({ ...config, barcodeType: 'barcode' })}
                  className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 border transition-all cursor-pointer ${
                    config.barcodeType === 'barcode'
                      ? 'bg-cyan-900 text-white border-cyan-950 shadow-xs'
                      : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  <Barcode className="w-4 h-4" />
                  Code 128
                </button>
                <button
                  type="button"
                  onClick={() => setConfig({ ...config, barcodeType: 'qr' })}
                  className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 border transition-all cursor-pointer ${
                    config.barcodeType === 'qr'
                      ? 'bg-cyan-900 text-white border-cyan-950 shadow-xs'
                      : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  <QrCode className="w-4 h-4" />
                  QR Code
                </button>
              </div>
            </div>
          </div>

          {/* Settings Drawer (Jika dibuka) */}
          {showSettingsDrawer && (
            <div className="p-4 bg-cyan-50/70 border border-cyan-200 rounded-2xl space-y-3 animate-in fade-in zoom-in-95 duration-150">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-xs text-cyan-950 flex items-center gap-1.5">
                  <Sliders className="w-3.5 h-3.5 text-cyan-700" />
                  Kustomisasi Elemen yang Tercetak di Stiker Label
                </h4>
                <span className="text-[11px] text-cyan-700">
                  Data wajib (Nama, NIK, No. MCU, Paket) otomatis selalu aktif
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
                <label className="flex items-center gap-2 p-2 bg-white rounded-xl border border-cyan-200 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={config.showClinicHeader}
                    onChange={(e) =>
                      setConfig({ ...config, showClinicHeader: e.target.checked })
                    }
                    className="rounded text-cyan-700 cursor-pointer"
                  />
                  <span className="font-semibold text-slate-800">Nama Klinik</span>
                </label>

                <label className="flex items-center gap-2 p-2 bg-white rounded-xl border border-cyan-200 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={config.showPt}
                    onChange={(e) => setConfig({ ...config, showPt: e.target.checked })}
                    className="rounded text-cyan-700 cursor-pointer"
                  />
                  <span className="font-semibold text-slate-800">Nama PT / Perusahaan</span>
                </label>

                <label className="flex items-center gap-2 p-2 bg-white rounded-xl border border-cyan-200 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={config.showDept}
                    onChange={(e) => setConfig({ ...config, showDept: e.target.checked })}
                    className="rounded text-cyan-700 cursor-pointer"
                  />
                  <span className="font-semibold text-slate-800">Departemen / Bagian</span>
                </label>

                <label className="flex items-center gap-2 p-2 bg-white rounded-xl border border-cyan-200 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={config.showBarcode}
                    onChange={(e) => setConfig({ ...config, showBarcode: e.target.checked })}
                    className="rounded text-cyan-700 cursor-pointer"
                  />
                  <span className="font-semibold text-slate-800">Barcode / QR Code</span>
                </label>
              </div>
            </div>
          )}

          {/* SECTION 3: DAFTAR LABEL & JUMLAH LEMBAR SETIAP LABEL (LEFT) + LIVE PREVIEW (RIGHT) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
            {/* Left: Daftar Label & Pilihan Jumlah Lembar (7 Kolom) */}
            <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-xs space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-3 gap-2">
                <div>
                  <h4 className="font-bold text-[14px] text-slate-900 flex items-center gap-2">
                    <span>🏷️</span>
                    Daftar Label &amp; Jumlah Lembar Cetak
                  </h4>
                  <p className="text-[11.5px] text-slate-500">
                    Atur berapa lembar stiker yang dicetak per masing-masing jenis label.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleAddLabelItem}
                  className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-cyan-800 rounded-xl text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer self-start sm:self-auto"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Tambah Label
                </button>
              </div>

              {/* Quick Preset Buttons for Sheet Counts */}
              <div className="flex flex-wrap items-center gap-1.5 text-xs bg-cyan-50/50 p-2 rounded-xl border border-cyan-100">
                <span className="text-[11px] font-bold text-cyan-900 flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-cyan-700" />
                  Atur Cepat Lembar:
                </span>
                <button
                  type="button"
                  onClick={() => handleApplyPresetQty('reg2-ro1')}
                  className="px-2 py-0.5 rounded-lg bg-white border border-cyan-300 text-cyan-800 font-bold hover:bg-cyan-100/50 cursor-pointer text-[11px]"
                >
                  ⚡ Registrasi x2, RO x1
                </button>
                <button
                  type="button"
                  onClick={() => handleApplyPresetQty('all1')}
                  className="px-2 py-0.5 rounded-lg bg-white border border-slate-300 text-slate-700 font-bold hover:bg-slate-100 cursor-pointer text-[11px]"
                >
                  Semua 1 Lembar
                </button>
                <button
                  type="button"
                  onClick={() => handleApplyPresetQty('all2')}
                  className="px-2 py-0.5 rounded-lg bg-white border border-slate-300 text-slate-700 font-bold hover:bg-slate-100 cursor-pointer text-[11px]"
                >
                  Semua 2 Lembar
                </button>
                {matchedPkg && (
                  <button
                    type="button"
                    onClick={() => handleApplyPresetQty('reset-master')}
                    className="px-2 py-0.5 rounded-lg bg-white border border-slate-300 text-slate-600 font-semibold hover:bg-slate-100 cursor-pointer text-[11px] flex items-center gap-1"
                  >
                    <RotateCcw className="w-2.5 h-2.5" />
                    Reset Paket
                  </button>
                )}
              </div>

              {/* Items List with Interactive Quantity Steppers */}
              <div className="space-y-2 max-h-[320px] overflow-y-auto pr-1">
                {labelItems.map((item, idx) => (
                  <div
                    key={item.id}
                    className={`flex items-center justify-between gap-2 p-2.5 rounded-xl border transition-all ${
                      item.selected
                        ? idx === activePreviewIndex
                          ? 'bg-cyan-50/80 border-cyan-500 ring-2 ring-cyan-400/20'
                          : 'bg-white border-slate-200 hover:border-cyan-300'
                        : 'bg-slate-100/70 border-slate-200 opacity-50'
                    }`}
                  >
                    {/* Checkbox & Index */}
                    <div className="flex items-center gap-2 shrink-0">
                      <input
                        type="checkbox"
                        checked={item.selected}
                        onChange={() => handleToggleSelect(item.id)}
                        className="w-4 h-4 rounded text-cyan-700 focus:ring-cyan-500 cursor-pointer"
                      />
                      <span className="w-5 h-5 rounded-md bg-slate-200 font-mono text-[10px] font-black flex items-center justify-center text-slate-700">
                        {idx + 1}
                      </span>
                    </div>

                    {/* Label Title Input */}
                    <div className="flex-1 min-w-0">
                      <input
                        type="text"
                        value={item.title}
                        onChange={(e) => handleUpdateLabelTitle(item.id, e.target.value)}
                        className="w-full px-2 py-0.5 text-[12px] font-bold uppercase bg-transparent border-0 border-b border-dashed border-slate-300 focus:border-cyan-600 focus:ring-0 text-slate-900 truncate"
                        placeholder="Nama / Tujuan Label..."
                      />
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="px-1.5 py-0.2 rounded bg-slate-100 text-slate-700 font-mono text-[9.5px] font-bold">
                          {item.code}
                        </span>
                        {item.qty > 1 && (
                          <span className="text-[10px] font-bold text-cyan-700">
                            • Dicetak {item.qty} lembar berurutan
                          </span>
                        )}
                      </div>
                    </div>

                    {/* FITUR PILIHAN JUMLAH LEMBAR SETIAP LABEL (Contoh: Registrasi cetak 2, RO cetak 1) */}
                    <div className="flex items-center gap-1.5 shrink-0 bg-slate-50 border border-slate-200 rounded-xl p-1">
                      <span className="text-[10.5px] font-bold text-slate-500 pl-1">Jml:</span>
                      <button
                        type="button"
                        disabled={!item.selected || item.qty <= 1}
                        onClick={() => handleUpdateQty(item.id, -1)}
                        className="w-6 h-6 rounded-lg bg-white hover:bg-slate-200 text-slate-700 font-black flex items-center justify-center text-xs shadow-2xs disabled:opacity-30 cursor-pointer"
                        title="Kurangi lembar"
                      >
                        <Minus className="w-3 h-3" />
                      </button>

                      <input
                        type="number"
                        min={1}
                        max={20}
                        disabled={!item.selected}
                        value={item.qty || 1}
                        onChange={(e) => handleSetDirectQty(item.id, parseInt(e.target.value) || 1)}
                        className="w-9 text-center font-black text-xs bg-white rounded border border-slate-200 py-0.5 text-cyan-900"
                      />

                      <button
                        type="button"
                        disabled={!item.selected}
                        onClick={() => handleUpdateQty(item.id, 1)}
                        className="w-6 h-6 rounded-lg bg-white hover:bg-slate-200 text-slate-700 font-black flex items-center justify-center text-xs shadow-2xs disabled:opacity-30 cursor-pointer"
                        title="Tambah lembar"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                      <span className="text-[10.5px] font-bold text-slate-700 pr-1">Lbr</span>
                    </div>

                    {/* View Preview Button */}
                    <button
                      type="button"
                      onClick={() => setActivePreviewIndex(idx)}
                      className={`px-2 py-1 rounded-lg text-[10.5px] font-bold transition-colors shrink-0 cursor-pointer ${
                        idx === activePreviewIndex
                          ? 'bg-cyan-700 text-white shadow-2xs'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      Lihat
                    </button>

                    {/* Delete button if extra */}
                    {labelItems.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveLabelItem(item.id)}
                        className="text-slate-400 hover:text-red-600 p-1 rounded transition-colors shrink-0 cursor-pointer"
                        title="Hapus Label Ini"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                ))}
              </div>

              <div className="pt-2 flex flex-wrap items-center justify-between text-[11px] text-slate-500 border-t border-slate-100 gap-2">
                <span>
                  💡 Setiap label akan dicetak berurutan sejumlah lembar yang ditentukan.
                </span>
                <span className="font-bold text-cyan-950 bg-cyan-100/60 px-2 py-0.5 rounded border border-cyan-200">
                  Total Terpilih: {activeItems.length} Jenis ({totalLabelsToPrint} Lembar)
                </span>
              </div>
            </div>

            {/* Right: Live Visual Preview of the Selected Thermal Sticker (5 Kolom) */}
            <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-[14px] text-slate-900">
                    Pratinjau Stiker Thermal
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    Ukuran {config.widthMm} x {config.heightMm} mm • Font: {config.fontFamily || 'mono'} ({config.fontSize || 'normal'})
                  </p>
                </div>
                <span className="px-2 py-0.5 rounded-full bg-slate-900 text-white font-mono text-[10.5px] font-black">
                  Label {previewItemData.index}/{previewItemData.total}
                </span>
              </div>

              {/* Realistic Thermal Sticker Canvas Preview */}
              <div className="bg-slate-200/80 p-3 rounded-xl flex items-center justify-center min-h-[210px] border border-dashed border-slate-300">
                <div
                  className="bg-white rounded shadow-md border border-slate-400 transition-all duration-200 overflow-hidden"
                  style={{
                    width: `${Math.min(config.widthMm * 5.2, 320)}px`,
                    height: `${Math.min(config.heightMm * 5.2, 220)}px`,
                    maxHeight: '220px',
                  }}
                >
                  <div
                    className="w-full h-full transform origin-top-left"
                    style={{
                      transform: `scale(${Math.min(
                        320 / (config.widthMm * 3.78),
                        220 / (config.heightMm * 3.78)
                      )})`,
                      width: `${config.widthMm}mm`,
                      height: `${config.heightMm}mm`,
                    }}
                    dangerouslySetInnerHTML={{ __html: previewHtml }}
                  />
                </div>
              </div>

              {/* Active preview item quantity badge */}
              <div className="flex items-center justify-between bg-slate-50 p-2 rounded-xl border border-slate-200 text-xs">
                <div className="flex items-center gap-1.5 text-slate-700">
                  <span className="font-bold">Target Stiker:</span>
                  <strong className="text-cyan-900 uppercase truncate max-w-[170px]">
                    {previewItemData.labelTitle}
                  </strong>
                </div>
                <span className="px-2 py-0.5 rounded bg-cyan-100 text-cyan-900 font-bold border border-cyan-300">
                  Dicetak {activePreviewItem.qty || 1} Lembar
                </span>
              </div>

              {/* Navigation between labels preview */}
              <div className="flex items-center justify-between gap-2 pt-1 text-xs">
                <button
                  type="button"
                  disabled={activeItems.length <= 1}
                  onClick={() =>
                    setActivePreviewIndex(
                      (prev) => (prev - 1 + activeItems.length) % activeItems.length
                    )
                  }
                  className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold disabled:opacity-40 cursor-pointer"
                >
                  ◀ Sebelumnya
                </button>
                <span className="font-bold text-slate-500 text-[11px]">
                  {activePreviewIndex + 1} dari {activeItems.length}
                </span>
                <button
                  type="button"
                  disabled={activeItems.length <= 1}
                  onClick={() =>
                    setActivePreviewIndex((prev) => (prev + 1) % activeItems.length)
                  }
                  className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold disabled:opacity-40 cursor-pointer"
                >
                  Berikutnya ▶
                </button>
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded-xl p-2.5 text-[11px] text-amber-900 space-y-1">
                <div className="flex items-center gap-1.5 font-bold text-amber-950">
                  <Info className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                  Data Wajib Otomatis Tercetak:
                </div>
                <p className="text-amber-800 leading-relaxed text-[10.5px]">
                  <b>Nama Peserta</b>, <b>NIK</b>, <b>No. MCU</b>, dan <b>Paket</b> selalu tercantum jelas di setiap stiker label tabung maupun berkas.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Action Footer */}
        <div className="p-4 px-6 bg-slate-100 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-xs text-slate-600 flex items-center gap-2">
            <span className="inline-block w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
            <span>
              Siap cetak <b>{totalLabelsToPrint} Lembar Stiker</b> ({config.widthMm}x{config.heightMm}mm) untuk{' '}
              <b className="text-slate-900">{patient.nama}</b>
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl bg-white hover:bg-slate-200 border border-slate-300 text-slate-700 text-xs font-bold transition-colors cursor-pointer"
            >
              Batal / Tutup
            </button>
            <button
              type="button"
              disabled={isPrinting || activeItems.length === 0}
              onClick={handlePrintNewTab}
              className="flex-1 sm:flex-none px-3.5 py-2.5 rounded-xl bg-white hover:bg-cyan-50 border border-cyan-300 text-cyan-800 text-xs font-bold transition-all shadow-2xs flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
              title="Buka jendela cetak mandiri (bebas dari pemblokiran iframe atau dialog browser)"
            >
              <ExternalLink className="w-3.5 h-3.5 text-cyan-700" />
              Buka Tab Cetak
            </button>
            <button
              type="button"
              disabled={isPrinting || activeItems.length === 0}
              onClick={handlePrint}
              className="flex-1 sm:flex-none px-6 py-2.5 rounded-xl bg-gradient-to-r from-cyan-700 to-teal-700 hover:from-cyan-600 hover:to-teal-600 text-white text-xs font-black shadow-lg shadow-cyan-900/20 flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              {isPrinting ? 'Mengirim ke Printer...' : `Cetak ${totalLabelsToPrint} Lembar Stiker`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
