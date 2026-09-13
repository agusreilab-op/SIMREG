import React, { useState, useMemo, useRef } from 'react';
import {
  MessageSquareHeart,
  Plus,
  FileSpreadsheet,
  Download,
  Upload,
  Search,
  Filter,
  Copy,
  Edit2,
  Trash2,
  X,
  CheckCircle2,
  AlertTriangle,
  FileDown,
  ClipboardPaste,
  Check,
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { MedicalAdviceMaster, AdviceCategory } from '../types';
import { ConfirmDeleteModal } from './ConfirmDeleteModal';

interface MasterSaranMedisTableProps {
  medicalAdvices: MedicalAdviceMaster[];
  onUpdateMedicalAdvices?: (advices: MedicalAdviceMaster[]) => void;
  onNotify: (msg: string) => void;
  isEmbeddedInResume?: boolean;
  onSelectAdviceForResume?: (advice: MedicalAdviceMaster) => void;
  onCloseEmbedded?: () => void;
}

const CATEGORY_OPTIONS: AdviceCategory[] = [
  'Gaya Hidup & Pola Makan',
  'Kardiovaskular & Hipertensi',
  'Profil Lipid & Kolesterol',
  'Diabetes & Metabolik',
  'Asam Urat & Ginjal',
  'Visus & Mata',
  'Audiometri & Kebisingan',
  'Spirometri & Fungsi Paru',
  'Ergonomi & Muskuloskeletal',
  'K3 & APD Lapangan',
];

export const MasterSaranMedisTable: React.FC<MasterSaranMedisTableProps> = ({
  medicalAdvices,
  onUpdateMedicalAdvices,
  onNotify,
  isEmbeddedInResume = false,
  onSelectAdviceForResume,
  onCloseEmbedded,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [urgencyFilter, setUrgencyFilter] = useState<string>('all');

  // Modal states
  const [showAddEditModal, setShowAddEditModal] = useState(false);
  const [editingItem, setEditingItem] = useState<MedicalAdviceMaster | null>(null);

  // Form states
  const [formData, setFormData] = useState<Omit<MedicalAdviceMaster, 'id'>>({
    kode: '',
    kategori: 'Gaya Hidup & Pola Makan',
    judulMasalah: '',
    saranMedis: '',
    tindakanLanjutan: '',
    tingkatUrgensi: 'Perhatian',
    isActive: true,
  });

  // Excel import modal states
  const [showImportModal, setShowImportModal] = useState(false);
  const [importMode, setImportMode] = useState<'append' | 'replace'>('append');
  const [parsedImportRows, setParsedImportRows] = useState<Partial<MedicalAdviceMaster>[]>([]);
  const [importError, setImportError] = useState<string | null>(null);
  const [pastedText, setPastedText] = useState('');
  const [importTab, setImportTab] = useState<'file' | 'paste'>('file');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Filtered advice list
  const filteredAdvices = useMemo(() => {
    return medicalAdvices.filter((item) => {
      const matchSearch =
        item.judulMasalah.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.kode.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.saranMedis.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.tindakanLanjutan.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.kategori.toLowerCase().includes(searchTerm.toLowerCase());

      const matchCategory =
        categoryFilter === 'all' || item.kategori === categoryFilter;

      const matchUrgency =
        urgencyFilter === 'all' || item.tingkatUrgensi === urgencyFilter;

      return matchSearch && matchCategory && matchUrgency;
    });
  }, [medicalAdvices, searchTerm, categoryFilter, urgencyFilter]);

  // Open modal for new item
  const handleOpenAdd = () => {
    setEditingItem(null);
    const nextNum = medicalAdvices.length + 1;
    const prefix = 'SARAN-';
    setFormData({
      kode: `${prefix}${String(nextNum).padStart(3, '0')}`,
      kategori: 'Gaya Hidup & Pola Makan',
      judulMasalah: '',
      saranMedis: '',
      tindakanLanjutan: 'Konsultasi dokter pemeriksa / monitoring berkala 3-6 bulan.',
      tingkatUrgensi: 'Perhatian',
      isActive: true,
    });
    setShowAddEditModal(true);
  };

  // Open modal for editing
  const handleOpenEdit = (item: MedicalAdviceMaster) => {
    setEditingItem(item);
    setFormData({
      kode: item.kode,
      kategori: item.kategori,
      judulMasalah: item.judulMasalah,
      saranMedis: item.saranMedis,
      tindakanLanjutan: item.tindakanLanjutan,
      tingkatUrgensi: item.tingkatUrgensi,
      isActive: item.isActive,
    });
    setShowAddEditModal(true);
  };

  // Save form (Add or Edit)
  const handleSaveForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.judulMasalah.trim() || !formData.saranMedis.trim()) {
      onNotify('Judul temuan klinis dan teks saran medis wajib diisi.');
      return;
    }

    let updatedList: MedicalAdviceMaster[];
    if (editingItem) {
      updatedList = medicalAdvices.map((a) =>
        a.id === editingItem.id ? { ...a, ...formData } : a
      );
      onNotify(`Master Saran Medis [${formData.kode}] berhasil diperbarui.`);
    } else {
      const newItem: MedicalAdviceMaster = {
        id: `adv-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        ...formData,
      };
      updatedList = [newItem, ...medicalAdvices];
      onNotify(`Master Saran Medis baru [${formData.kode}] berhasil ditambahkan.`);
    }

    if (onUpdateMedicalAdvices) {
      onUpdateMedicalAdvices(updatedList);
    }
    localStorage.setItem('simreg_medical_advices', JSON.stringify(updatedList));
    setShowAddEditModal(false);
  };

  // Delete modal state
  const [deleteModalState, setDeleteModalState] = useState<{
    isOpen: boolean;
    item: MedicalAdviceMaster | null;
  }>({
    isOpen: false,
    item: null,
  });

  // Delete an advice item
  const handleDelete = (item: MedicalAdviceMaster) => {
    setDeleteModalState({
      isOpen: true,
      item,
    });
  };

  const handleConfirmDelete = () => {
    const item = deleteModalState.item;
    setDeleteModalState({ isOpen: false, item: null });
    if (!item) return;

    const updatedList = medicalAdvices.filter((a) => a.id !== item.id);
    if (onUpdateMedicalAdvices) {
      onUpdateMedicalAdvices(updatedList);
    }
    localStorage.setItem('simreg_medical_advices', JSON.stringify(updatedList));
    onNotify(`Saran medis [${item.kode}] berhasil dihapus.`);
  };

  // Copy text helper
  const handleCopyText = (text: string, label: string) => {
    navigator.clipboard?.writeText(text);
    onNotify(`Teks saran medis "${label}" berhasil disalin ke clipboard.`);
  };

  // Generate and download Excel Template
  const handleDownloadExcelTemplate = () => {
    const templateData = [
      {
        'Kode Saran': 'SARAN-BMI-01',
        'Kategori': 'Gaya Hidup & Pola Makan',
        'Judul Temuan Medis': 'Overweight / Kelebihan Berat Badan (IMT 25.0 - 29.9)',
        'Rekomendasi & Saran Medis': 'Diet rendah kalori seimbang, batasi makanan tinggi gula dan lemak jenuh. Olahraga aerobik teratur minimal 150 menit per minggu.',
        'Tindakan Lanjutan': 'Konsultasi gizi, timbang berat badan berkala tiap bulan.',
        'Tingkat Urgensi': 'Perhatian',
      },
      {
        'Kode Saran': 'SARAN-HT-01',
        'Kategori': 'Kardiovaskular & Hipertensi',
        'Judul Temuan Medis': 'Hipertensi Derajat I (TD >= 140/90 mmHg)',
        'Rekomendasi & Saran Medis': 'Kurangi asupan garam harian (<2 gram/hari), hindari stres, istirahat cukup 7-8 jam per hari, dan lakukan evaluasi tensi berkala.',
        'Tindakan Lanjutan': 'Konsultasi ke dokter spesialis penyakit dalam atau faskes pertama.',
        'Tingkat Urgensi': 'Perhatian',
      },
      {
        'Kode Saran': 'SARAN-LIP-01',
        'Kategori': 'Profil Lipid & Kolesterol',
        'Judul Temuan Medis': 'Hiperkolesterolemia / Kolesterol Total Tinggi (> 200 mg/dL)',
        'Rekomendasi & Saran Medis': 'Batasi konsumsi gorengan, jeroan, dan santan. Tingkatkan konsumsi sayuran tinggi serat dan olahraga teratur.',
        'Tindakan Lanjutan': 'Pemeriksaan ulang profil lipid 3 bulan kemudian.',
        'Tingkat Urgensi': 'Perhatian',
      },
    ];

    const ws = XLSX.utils.json_to_sheet(templateData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Template Master Saran');
    XLSX.writeFile(wb, 'Template_Master_Saran_Medis_MCU.xlsx');
    onNotify('Template Excel Master Saran Medis berhasil diunduh.');
  };

  // Process Excel / CSV File upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    setImportError(null);
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const firstSheetName = wb.SheetNames[0];
        const ws = wb.Sheets[firstSheetName];
        const jsonData = XLSX.utils.sheet_to_json<Record<string, any>>(ws);

        if (!jsonData || jsonData.length === 0) {
          setImportError('File Excel kosong atau tidak memiliki data.');
          return;
        }

        const mappedRows: Partial<MedicalAdviceMaster>[] = jsonData.map((row, idx) => {
          const kode =
            row['Kode Saran'] || row['kode'] || row['Kode'] || `SARAN-IMP-${idx + 1}`;
          const kategoriRaw =
            row['Kategori'] || row['kategori'] || 'Gaya Hidup & Pola Makan';
          const validKategori = CATEGORY_OPTIONS.includes(kategoriRaw as AdviceCategory)
            ? (kategoriRaw as AdviceCategory)
            : 'Gaya Hidup & Pola Makan';

          const judulMasalah =
            row['Judul Temuan Medis'] ||
            row['Judul'] ||
            row['judulMasalah'] ||
            row['Temuan Medis'] ||
            `Temuan Medis ${idx + 1}`;

          const saranMedis =
            row['Rekomendasi & Saran Medis'] ||
            row['Saran Medis'] ||
            row['saranMedis'] ||
            row['Saran'] ||
            '';

          const tindakanLanjutan =
            row['Tindakan Lanjutan'] ||
            row['Tindakan'] ||
            row['tindakanLanjutan'] ||
            'Evaluasi dokter pemeriksa / faskes primer.';

          const urgensiRaw =
            row['Tingkat Urgensi'] || row['Urgensi'] || row['tingkatUrgensi'];
          const tingkatUrgensi =
            urgensiRaw === 'Rujukan Segera' || urgensiRaw === 'Rutin'
              ? urgensiRaw
              : 'Perhatian';

          return {
            id: `adv-imp-${Date.now()}-${idx}`,
            kode: String(kode),
            kategori: validKategori,
            judulMasalah: String(judulMasalah),
            saranMedis: String(saranMedis),
            tindakanLanjutan: String(tindakanLanjutan),
            tingkatUrgensi,
            isActive: true,
          };
        });

        setParsedImportRows(mappedRows);
        onNotify(`Berhasil membaca ${mappedRows.length} baris dari file Excel.`);
      } catch (err: any) {
        console.error(err);
        setImportError(`Gagal membaca file Excel: ${err.message || 'Format tidak valid'}`);
      }
    };
    reader.readAsBinaryString(file);
  };

  // Parse pasted text from Excel (tab-delimited)
  const handleParsePastedText = () => {
    setImportError(null);
    if (!pastedText.trim()) {
      setImportError('Silakan tempel data tabel dari Excel.');
      return;
    }

    const lines = pastedText.trim().split('\n');
    if (lines.length === 0) {
      setImportError('Tidak ada data yang ditemukan.');
      return;
    }

    const rows: Partial<MedicalAdviceMaster>[] = [];
    lines.forEach((line, idx) => {
      // Split by tab or semicolon or comma
      const cols = line.includes('\t') ? line.split('\t') : line.split(';');
      if (cols.length >= 2) {
        // Assume format: Kode \t Kategori \t Judul \t Saran \t Tindakan \t Urgensi
        // Or if fewer: Judul \t Saran
        let kode = `SARAN-PST-${idx + 1}`;
        let kategori: AdviceCategory = 'Gaya Hidup & Pola Makan';
        let judul = '';
        let saran = '';
        let tindakan = 'Evaluasi dokter pemeriksa.';
        let urgensi: 'Rutin' | 'Perhatian' | 'Rujukan Segera' = 'Perhatian';

        if (cols.length >= 4) {
          kode = cols[0]?.trim() || kode;
          const katInput = cols[1]?.trim();
          if (CATEGORY_OPTIONS.includes(katInput as AdviceCategory)) {
            kategori = katInput as AdviceCategory;
          }
          judul = cols[2]?.trim() || '';
          saran = cols[3]?.trim() || '';
          if (cols[4]) tindakan = cols[4].trim();
          if (cols[5]) {
            const u = cols[5].trim();
            if (u === 'Rutin' || u === 'Rujukan Segera') urgensi = u;
          }
        } else if (cols.length === 2) {
          judul = cols[0].trim();
          saran = cols[1].trim();
        } else if (cols.length === 3) {
          kode = cols[0].trim();
          judul = cols[1].trim();
          saran = cols[2].trim();
        }

        if (judul && saran) {
          rows.push({
            id: `adv-paste-${Date.now()}-${idx}`,
            kode,
            kategori,
            judulMasalah: judul,
            saranMedis: saran,
            tindakanLanjutan: tindakan,
            tingkatUrgensi: urgensi,
            isActive: true,
          });
        }
      }
    });

    if (rows.length === 0) {
      setImportError('Gagal mengenali baris. Pastikan ada minimal kolom Judul Temuan dan Saran Medis.');
      return;
    }

    setParsedImportRows(rows);
    onNotify(`Berhasil membaca ${rows.length} baris dari teks tempelan.`);
  };

  // Commit Import to Master Advices
  const handleCommitImport = () => {
    if (parsedImportRows.length === 0) {
      onNotify('Belum ada data untuk diimpor.');
      return;
    }

    const validRows = parsedImportRows.filter(
      (r) => r.judulMasalah && r.saranMedis
    ) as MedicalAdviceMaster[];

    let newList: MedicalAdviceMaster[];
    if (importMode === 'replace') {
      newList = validRows;
      onNotify(`Berhasil mengganti seluruh master saran dengan ${validRows.length} data baru.`);
    } else {
      // Append, ensuring unique codes
      const existingKodes = new Set(medicalAdvices.map((a) => a.kode));
      const newItems = validRows.map((item, idx) => {
        let uniqueKode = item.kode;
        if (existingKodes.has(uniqueKode)) {
          uniqueKode = `${item.kode}-${idx + 1}`;
        }
        return { ...item, kode: uniqueKode };
      });
      newList = [...newItems, ...medicalAdvices];
      onNotify(`Berhasil menambahkan ${validRows.length} saran medis dari Excel ke master.`);
    }

    if (onUpdateMedicalAdvices) {
      onUpdateMedicalAdvices(newList);
    }
    localStorage.setItem('simreg_medical_advices', JSON.stringify(newList));
    setShowImportModal(false);
    setParsedImportRows([]);
    setPastedText('');
  };

  return (
    <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden flex flex-col">
      {/* Top Header & Actions */}
      <div className="p-5 md:p-6 bg-gradient-to-r from-slate-50 via-amber-50/40 to-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-500 text-white flex items-center justify-center shadow-xs">
              <MessageSquareHeart className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-[17px] font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
                Koleksi Master Rekomendasi &amp; Saran Medis Okupasi
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 font-bold border border-amber-200">
                  {medicalAdvices.length} Saran
                </span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Basis pengetahuan klinis dokter okupasi untuk otomatisasi kesimpulan dan rekomendasi laporan MCU.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Tombol Import Excel */}
          <button
            type="button"
            id="btn-import-excel-saran"
            onClick={() => {
              setParsedImportRows([]);
              setImportError(null);
              setShowImportModal(true);
            }}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition-colors"
          >
            <FileSpreadsheet className="w-4 h-4" />
            Import dari Excel
          </button>

          {/* Tombol Tambah Saran Medis */}
          <button
            type="button"
            id="btn-tambah-saran-medis"
            onClick={handleOpenAdd}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 text-white text-xs font-bold shadow-sm shadow-amber-600/20 transition-all"
          >
            <Plus className="w-4 h-4" />
            Tambah Saran Medis
          </button>

          {isEmbeddedInResume && onCloseEmbedded && (
            <button
              type="button"
              onClick={onCloseEmbedded}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 border border-slate-200"
              title="Tutup Master Saran"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="p-4 bg-slate-50 border-b border-slate-200 grid grid-cols-1 sm:grid-cols-3 md:grid-cols-4 gap-3">
        <div className="sm:col-span-2 relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Cari kode, diagnosa klinis, atau kata kunci saran..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-white border border-slate-300 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500"
          />
        </div>

        <div>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-xl text-xs font-medium text-slate-700"
          >
            <option value="all">Semua Kategori Organ</option>
            {CATEGORY_OPTIONS.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>

        <div>
          <select
            value={urgencyFilter}
            onChange={(e) => setUrgencyFilter(e.target.value)}
            className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-xl text-xs font-medium text-slate-700"
          >
            <option value="all">Semua Tingkat Urgensi</option>
            <option value="Rutin">Rutin</option>
            <option value="Perhatian">Perhatian</option>
            <option value="Rujukan Segera">Rujukan Segera</option>
          </select>
        </div>
      </div>

      {/* Main Table View */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-100/80 border-b border-slate-200 text-[11.5px] font-extrabold text-slate-700 uppercase tracking-wider">
              <th className="py-3 px-3.5 w-12 text-center">No</th>
              <th className="py-3 px-3.5 w-28">Kode</th>
              <th className="py-3 px-3.5 w-44">Kategori</th>
              <th className="py-3 px-3.5 min-w-[180px]">Temuan Klinis / Diagnosa</th>
              <th className="py-3 px-3.5 min-w-[280px]">Rekomendasi &amp; Saran Medis</th>
              <th className="py-3 px-3.5 min-w-[180px]">Tindakan / Rujukan</th>
              <th className="py-3 px-3.5 w-28 text-center">Urgensi</th>
              <th className="py-3 px-3.5 w-28 text-center">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 text-xs">
            {filteredAdvices.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-12 text-center text-slate-400 bg-white">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <MessageSquareHeart className="w-8 h-8 text-slate-300" />
                    <span>Tidak ada saran medis yang sesuai dengan filter pencarian.</span>
                  </div>
                </td>
              </tr>
            ) : (
              filteredAdvices.map((item, index) => {
                const isUrgent = item.tingkatUrgensi === 'Rujukan Segera';
                const isAttention = item.tingkatUrgensi === 'Perhatian';

                return (
                  <tr
                    key={item.id}
                    className="hover:bg-amber-50/30 transition-colors group"
                  >
                    <td className="py-3 px-3.5 text-center font-semibold text-slate-400">
                      {index + 1}
                    </td>

                    <td className="py-3 px-3.5">
                      <span className="font-mono text-[11px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-800 border border-slate-200 block truncate">
                        {item.kode}
                      </span>
                    </td>

                    <td className="py-3 px-3.5">
                      <span className="inline-block px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-100 text-slate-700">
                        {item.kategori}
                      </span>
                    </td>

                    <td className="py-3 px-3.5">
                      <div className="font-bold text-slate-900 leading-snug">
                        {item.judulMasalah}
                      </div>
                    </td>

                    <td className="py-3 px-3.5">
                      <div className="text-slate-700 leading-relaxed max-h-24 overflow-y-auto pr-1">
                        {item.saranMedis}
                      </div>
                    </td>

                    <td className="py-3 px-3.5">
                      <div className="text-slate-600 text-[11.5px] leading-snug">
                        {item.tindakanLanjutan}
                      </div>
                    </td>

                    <td className="py-3 px-3.5 text-center">
                      <span
                        className={`inline-block px-2 py-0.5 rounded-full text-[10.5px] font-bold uppercase tracking-wider ${
                          isUrgent
                            ? 'bg-rose-100 text-rose-800 border border-rose-200'
                            : isAttention
                            ? 'bg-amber-100 text-amber-800 border border-amber-200'
                            : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                        }`}
                      >
                        {item.tingkatUrgensi}
                      </span>
                    </td>

                    <td className="py-3 px-3.5 text-center">
                      <div className="flex items-center justify-center gap-1">
                        {isEmbeddedInResume && onSelectAdviceForResume && (
                          <button
                            type="button"
                            onClick={() => onSelectAdviceForResume(item)}
                            className="px-2 py-1 rounded bg-purple-100 hover:bg-purple-200 text-purple-800 text-[11px] font-bold transition-colors"
                            title="Terapkan saran ini ke resume pasien"
                          >
                            + Terapkan
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => handleCopyText(item.saranMedis, item.judulMasalah)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-amber-700 hover:bg-amber-50 transition-colors"
                          title="Salin Teks Saran"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>

                        <button
                          type="button"
                          onClick={() => handleOpenEdit(item)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-blue-700 hover:bg-blue-50 transition-colors"
                          title="Edit Saran Medis"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDelete(item)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-700 hover:bg-rose-50 transition-colors"
                          title="Hapus Saran Medis"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Footer Info */}
      <div className="p-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
        <span>
          Menampilkan <b>{filteredAdvices.length}</b> dari total <b>{medicalAdvices.length}</b> master saran medis.
        </span>
        <span>Format tabel siap pakai &amp; terhubung dengan otomatisasi kesimpulan MCU</span>
      </div>

      {/* ========================================================================= */}
      {/* MODAL: TAMBAH / EDIT SARAN MEDIS                                          */}
      {/* ========================================================================= */}
      {showAddEditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-4 px-6 bg-gradient-to-r from-slate-900 via-amber-950 to-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <MessageSquareHeart className="w-5 h-5 text-amber-400" />
                <h3 className="font-extrabold text-sm">
                  {editingItem ? 'Edit Master Saran Medis' : 'Tambah Master Saran Medis Baru'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowAddEditModal(false)}
                className="text-slate-400 hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveForm} className="p-6 space-y-4 overflow-y-auto">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Kode Saran Medis *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.kode}
                    onChange={(e) => setFormData({ ...formData, kode: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono font-bold"
                    placeholder="Contoh: SARAN-BMI-01"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Kategori Sistem Organ *
                  </label>
                  <select
                    value={formData.kategori}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        kategori: e.target.value as AdviceCategory,
                      })
                    }
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold"
                  >
                    {CATEGORY_OPTIONS.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Judul Temuan Medis / Diagnosa Klinis *
                </label>
                <input
                  type="text"
                  required
                  value={formData.judulMasalah}
                  onChange={(e) =>
                    setFormData({ ...formData, judulMasalah: e.target.value })
                  }
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-800"
                  placeholder="Contoh: Overweight / Kelebihan Berat Badan (IMT >= 25.0)"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Teks Rekomendasi &amp; Saran Medis Okupasi *
                </label>
                <textarea
                  rows={4}
                  required
                  value={formData.saranMedis}
                  onChange={(e) =>
                    setFormData({ ...formData, saranMedis: e.target.value })
                  }
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-800 leading-relaxed"
                  placeholder="Masukkan kalimat saran medis yang akan otomatis muncul pada kolom saran..."
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Anjuran Tindakan Lanjutan / Rujukan Medis
                </label>
                <input
                  type="text"
                  value={formData.tindakanLanjutan}
                  onChange={(e) =>
                    setFormData({ ...formData, tindakanLanjutan: e.target.value })
                  }
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-800"
                  placeholder="Contoh: Konsultasi dokter spesialis / evaluasi 3 bulan lagi."
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Tingkat Urgensi
                  </label>
                  <select
                    value={formData.tingkatUrgensi}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        tingkatUrgensi: e.target.value as any,
                      })
                    }
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold"
                  >
                    <option value="Rutin">Rutin (Skrining Berkala)</option>
                    <option value="Perhatian">Perhatian (Gaya Hidup &amp; Monitoring)</option>
                    <option value="Rujukan Segera">Rujukan Segera (Dokter Spesialis)</option>
                  </select>
                </div>

                <div className="flex items-center pt-5">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.isActive}
                      onChange={(e) =>
                        setFormData({ ...formData, isActive: e.target.checked })
                      }
                      className="w-4 h-4 rounded text-amber-600 focus:ring-amber-500"
                    />
                    <span className="text-xs font-bold text-slate-700">
                      Status Aktif (Digunakan dalam Auto-fill)
                    </span>
                  </label>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowAddEditModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-xs font-bold text-slate-600 hover:bg-slate-100"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow-md shadow-amber-600/20"
                >
                  💾 Simpan Saran Medis
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: IMPORT DARI EXCEL                                                  */}
      {/* ========================================================================= */}
      {showImportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden flex flex-col max-h-[92vh]">
            {/* Header */}
            <div className="p-4 px-6 bg-gradient-to-r from-emerald-900 via-slate-900 to-emerald-950 text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <FileSpreadsheet className="w-5 h-5 text-emerald-400" />
                <div>
                  <h3 className="font-extrabold text-sm">
                    Import Master Saran Medis dari Excel / Spreadsheet
                  </h3>
                  <p className="text-[11px] text-emerald-300">
                    Upload file .xlsx / .csv atau tempel langsung data dari Excel.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowImportModal(false)}
                className="text-slate-400 hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body */}
            <div className="p-6 space-y-5 overflow-y-auto">
              {/* Template Download Prompt */}
              <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200 flex items-center justify-between gap-3">
                <div className="text-xs text-emerald-900">
                  <p className="font-bold mb-0.5">Belum memiliki format file Excel?</p>
                  <p className="text-[11.5px] text-emerald-700">
                    Unduh template resmi berformat .xlsx yang sudah dilengkapi kolom Kode, Kategori, Judul, Saran, dan Urgensi.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleDownloadExcelTemplate}
                  className="shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold shadow-xs"
                >
                  <Download className="w-3.5 h-3.5" />
                  Download Template
                </button>
              </div>

              {/* Tabs: File Upload vs Paste */}
              <div className="flex border-b border-slate-200 gap-4 text-xs font-bold">
                <button
                  type="button"
                  onClick={() => setImportTab('file')}
                  className={`pb-2.5 border-b-2 flex items-center gap-1.5 transition-colors ${
                    importTab === 'file'
                      ? 'border-emerald-600 text-emerald-800'
                      : 'border-transparent text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <Upload className="w-3.5 h-3.5" />
                  Upload File (.xlsx / .csv)
                </button>
                <button
                  type="button"
                  onClick={() => setImportTab('paste')}
                  className={`pb-2.5 border-b-2 flex items-center gap-1.5 transition-colors ${
                    importTab === 'paste'
                      ? 'border-emerald-600 text-emerald-800'
                      : 'border-transparent text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <ClipboardPaste className="w-3.5 h-3.5" />
                  Tempel (Paste) dari Excel
                </button>
              </div>

              {/* Tab 1: File Input */}
              {importTab === 'file' && (
                <div className="space-y-3">
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-slate-300 hover:border-emerald-500 rounded-2xl p-8 text-center cursor-pointer bg-slate-50/60 hover:bg-emerald-50/20 transition-all"
                  >
                    <Upload className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                    <p className="text-xs font-bold text-slate-800">
                      Klik untuk memilih file Excel (.xlsx, .xls, .csv)
                    </p>
                    <p className="text-[11px] text-slate-500 mt-1">
                      Maksimal 5MB. Header kolom akan otomatis disesuaikan.
                    </p>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".xlsx, .xls, .csv"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </div>
                </div>
              )}

              {/* Tab 2: Paste Area */}
              {importTab === 'paste' && (
                <div className="space-y-3">
                  <textarea
                    rows={5}
                    value={pastedText}
                    onChange={(e) => setPastedText(e.target.value)}
                    placeholder="Salin baris dari Excel (Ctrl+C) lalu tempel di sini (Ctrl+V)...&#10;Contoh format: Kode [Tab] Kategori [Tab] Judul Temuan [Tab] Saran Medis [Tab] Tindakan [Tab] Urgensi"
                    className="w-full p-3 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono text-slate-800"
                  />
                  <button
                    type="button"
                    onClick={handleParsePastedText}
                    className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold"
                  >
                    Proses Teks Tempelan
                  </button>
                </div>
              )}

              {/* Error Message */}
              {importError && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
                  <span>{importError}</span>
                </div>
              )}

              {/* Preview of Parsed Rows */}
              {parsedImportRows.length > 0 && (
                <div className="space-y-3 pt-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      Pratinjau Data ({parsedImportRows.length} baris siap diimpor)
                    </span>

                    {/* Import Mode: Append vs Replace */}
                    <div className="flex items-center gap-3 text-xs">
                      <label className="flex items-center gap-1.5 cursor-pointer">
                        <input
                          type="radio"
                          name="importMode"
                          checked={importMode === 'append'}
                          onChange={() => setImportMode('append')}
                          className="text-emerald-600"
                        />
                        <span className="font-semibold text-slate-700">Tambahkan (Append)</span>
                      </label>
                      <label className="flex items-center gap-1.5 cursor-pointer">
                        <input
                          type="radio"
                          name="importMode"
                          checked={importMode === 'replace'}
                          onChange={() => setImportMode('replace')}
                          className="text-emerald-600"
                        />
                        <span className="font-semibold text-slate-700">Ganti Semua (Replace)</span>
                      </label>
                    </div>
                  </div>

                  <div className="max-h-48 overflow-y-auto border border-slate-200 rounded-xl bg-slate-50">
                    <table className="w-full text-left text-[11px]">
                      <thead className="bg-slate-200 text-slate-700 font-bold sticky top-0">
                        <tr>
                          <th className="p-2">Kode</th>
                          <th className="p-2">Kategori</th>
                          <th className="p-2">Judul Temuan</th>
                          <th className="p-2">Saran Medis</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200">
                        {parsedImportRows.map((r, i) => (
                          <tr key={i} className="hover:bg-white">
                            <td className="p-2 font-mono font-bold text-slate-800">{r.kode}</td>
                            <td className="p-2 text-slate-600">{r.kategori}</td>
                            <td className="p-2 font-semibold text-slate-900">{r.judulMasalah}</td>
                            <td className="p-2 text-slate-600 truncate max-w-[200px]">{r.saranMedis}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowImportModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-xs font-bold text-slate-600 hover:bg-slate-100"
                >
                  Tutup
                </button>
                <button
                  type="button"
                  disabled={parsedImportRows.length === 0}
                  onClick={handleCommitImport}
                  className={`px-5 py-2 rounded-xl text-xs font-bold shadow-md transition-all ${
                    parsedImportRows.length > 0
                      ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/20'
                      : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                  }`}
                >
                  ✓ Terapkan Import ({parsedImportRows.length} Data)
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Confirm Delete Modal for Medical Advice */}
      <ConfirmDeleteModal
        isOpen={deleteModalState.isOpen}
        title="Hapus Master Saran Medis"
        category={deleteModalState.item?.kategori || 'Saran Medis'}
        itemName={deleteModalState.item?.judulMasalah || ''}
        itemCode={deleteModalState.item?.kode}
        warningMessage={`Saran medis "${deleteModalState.item?.judulMasalah}" akan dihapus dari basis data saran.`}
        onClose={() => setDeleteModalState({ isOpen: false, item: null })}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
};
