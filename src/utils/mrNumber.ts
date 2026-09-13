import { AttendanceRecord, Company } from '../types';

/**
 * Mendapatkan 3 Digit Inisial Perusahaan
 * Mengutamakan kode perusahaan resmi atau mengekstrak 3 huruf inisial dari nama PT
 */
export function getCompanyInitial3(
  companyNameOrCode: string,
  companies?: Company[]
): string {
  if (!companyNameOrCode) return 'MCU';

  const trimmed = companyNameOrCode.trim();

  // 1. Cek apakah cocok dengan master data companies
  if (companies && companies.length > 0) {
    const found = companies.find(
      (c) =>
        c.kode.toLowerCase() === trimmed.toLowerCase() ||
        c.nama.toLowerCase() === trimmed.toLowerCase()
    );
    if (found && found.kode && found.kode.length === 3 && /^[A-Za-z]{3}$/.test(found.kode)) {
      return found.kode.toUpperCase();
    }
    if (found && found.nama) {
      return deriveInitialFromCompanyName(found.nama);
    }
  }

  // 2. Jika kode input langsung 3 huruf
  if (trimmed.length === 3 && /^[A-Za-z]{3}$/.test(trimmed)) {
    return trimmed.toUpperCase();
  }

  return deriveInitialFromCompanyName(trimmed);
}

/**
 * Ekstraksi 3 huruf inisial dari nama PT
 * Menghapus prefix PT, CV, UD, TBK dll lalu mengambil akronim huruf pertama
 */
function deriveInitialFromCompanyName(name: string): string {
  const cleaned = name
    .replace(/^PT\.?\s+/i, '')
    .replace(/^CV\.?\s+/i, '')
    .replace(/^UD\.?\s+/i, '')
    .replace(/^PD\.?\s+/i, '')
    .replace(/\s+TBK\.?$/i, '')
    .replace(/[^a-zA-Z0-9\s]/g, ' ')
    .trim();

  const words = cleaned.split(/\s+/).filter(Boolean);

  if (words.length >= 3) {
    // 3 kata atau lebih: ambil huruf pertama dari 3 kata utama
    // Contoh: Pratama Abadi Industri -> PAI
    // Contoh: Sejahtera Mandiri Sentosa -> SMS
    // Contoh: Contoh Perkasa Teknik -> CPT
    return (words[0][0] + words[1][0] + words[2][0]).toUpperCase();
  } else if (words.length === 2) {
    // 2 kata: 2 huruf dari kata 1 + 1 huruf dari kata 2
    // Contoh: Panarub Industry -> PAN
    if (words[0].length >= 2 && words[1].length >= 1) {
      return (words[0].substring(0, 2) + words[1][0]).toUpperCase();
    }
    return (words[0] + words[1]).substring(0, 3).toUpperCase().padEnd(3, 'X');
  } else if (words.length === 1) {
    // 1 kata: 3 huruf pertama
    return words[0].substring(0, 3).toUpperCase().padEnd(3, 'X');
  }

  return 'MCU';
}

/**
 * Ekstraksi 4 Digit Tahun dari tanggal (YYYY-MM-DD, DD-MM-YYYY, atau tahun angka)
 */
export function extractYear(dateOrYearStr?: string | number): string {
  if (!dateOrYearStr) return String(new Date().getFullYear());
  const str = String(dateOrYearStr);
  const match = str.match(/\b(20\d{2})\b/);
  if (match) return match[1];
  return String(new Date().getFullYear());
}

/**
 * Generator Otomatis Nomor Medical Record (No. MR / No. MCU)
 * Struktur Kode: [3 Digit Inisial Perusahaan] - [Tahun] - [Nomor Urut Peserta]
 * Contoh:
 * - PAI-2026-0001 atau PAI-2026-001
 * - PAN-2025-001
 * - SMS-2026-001
 * - CPT-2026-001
 */
export function generateAutoMrNumber(
  companyNameOrCode: string,
  dateOrYear?: string | number,
  attendanceList: AttendanceRecord[] = [],
  companies?: Company[],
  padDigits: number = 3
): string {
  const initial = getCompanyInitial3(companyNameOrCode, companies);
  const year = extractYear(dateOrYear);

  let maxSeq = 0;
  const targetPrefix = `${initial}-${year}-`;

  if (attendanceList && attendanceList.length > 0) {
    attendanceList.forEach((rec) => {
      const currentNo = (rec.mcuNo || '').trim().toUpperCase();
      if (currentNo.startsWith(targetPrefix)) {
        const seqPart = currentNo.replace(targetPrefix, '');
        const parsed = parseInt(seqPart, 10);
        if (!isNaN(parsed) && parsed > maxSeq) {
          maxSeq = parsed;
        }
      } else {
        // Cek jika PT dan tahun sama meskipun format lama
        const recInitial = getCompanyInitial3(rec.pt, companies);
        const recYear = extractYear(rec.tglMcu);
        if (recInitial === initial && recYear === year) {
          const digitsOnly = currentNo.replace(/\D/g, '');
          const lastNumber = parseInt(digitsOnly.slice(-4), 10);
          if (!isNaN(lastNumber) && lastNumber > maxSeq) {
            maxSeq = lastNumber;
          }
        }
      }
    });
  }

  const nextSeq = maxSeq + 1;
  const formattedSeq = String(nextSeq).padStart(padDigits, '0');
  return `${initial}-${year}-${formattedSeq}`;
}
