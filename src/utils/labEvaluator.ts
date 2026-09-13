// Utilitas Evaluator Status dan Nilai Rujukan Laboratorium SIMREG
// Mengevaluasi nilai hasil laboratorium berdasarkan parameter standar klinis okupasi

export interface LabItemCheck {
  id?: string;
  name?: string;
  value?: string | number;
  unit?: string;
  refRange?: string;
  status?: 'Normal' | 'Tinggi' | 'Rendah' | 'Abnormal' | string;
}

export const evaluateLabItemStatus = (
  item: LabItemCheck
): 'Normal' | 'Tinggi' | 'Rendah' | 'Abnormal' => {
  const rawVal = item.value !== undefined && item.value !== null ? String(item.value).trim() : '';
  if (!rawVal || rawVal === '-' || rawVal === '–') return 'Normal';

  const valLower = rawVal.toLowerCase();
  const id = (item.id || '').toLowerCase();
  const name = (item.name || '').toLowerCase();

  // Daftar nilai kualitatif normal
  const normalKeywords = [
    'normal',
    'negatif',
    'negative',
    'non reaktif',
    'non-reaktif',
    'nonreactive',
    'jernih',
    'kuning',
    'kuning muda',
    'tidak ada',
    'nihil',
    '0',
  ];

  // Daftar nilai kualitatif abnormal
  const abnormalKeywords = [
    'positif',
    'positive',
    'reaktif',
    'reactive',
    'trace',
    'keruh',
    'kuning tua',
    'coklat',
    'merah',
    'banyak',
    'penuh',
    '+1',
    '+2',
    '+3',
    '+4',
    '+',
    '++',
    '+++',
    '++++',
  ];

  // 1. Skrining Narkoba (Amphetamine, THC/Marijuana, Morfin, Benzodiazepin, dll)
  if (
    id.startsWith('narkoba_') ||
    name.includes('narkoba') ||
    name.includes('amphetamine') ||
    name.includes('marijuana') ||
    name.includes('thc') ||
    name.includes('morphine') ||
    name.includes('benzodiazepine') ||
    name.includes('cocaine') ||
    name.includes('methamphetamine')
  ) {
    if (abnormalKeywords.some((kw) => valLower.includes(kw))) return 'Abnormal';
    if (!normalKeywords.includes(valLower) && valLower !== '') return 'Abnormal';
    return 'Normal';
  }

  // 2. Urinalisis Kualitatif (Protein, Glukosa, Bilirubin, Keton, Nitrit, Blood/Darah Samar, Kristal, Bakteri)
  if (
    id === 'u_protein' ||
    id === 'u_glukosa' ||
    id === 'u_bilirubin' ||
    id === 'u_keton' ||
    id === 'u_nitrit' ||
    id === 'u_blood' ||
    id === 'u_sed_kristal' ||
    id === 'u_sed_bakteri' ||
    id === 'u_sed_silinder' ||
    name.includes('protein urine') ||
    name.includes('glukosa urine') ||
    name.includes('darah samar') ||
    name.includes('reduksi urine') ||
    name.includes('kristal') ||
    name.includes('bakteri')
  ) {
    if (abnormalKeywords.some((kw) => valLower.includes(kw))) {
      return id === 'u_protein' || id === 'u_glukosa' ? 'Tinggi' : 'Abnormal';
    }
    if (!normalKeywords.includes(valLower) && valLower !== '') {
      return 'Abnormal';
    }
    return 'Normal';
  }

  // 3. Kejernihan Urin
  if (id === 'u_kejernihan' || name.includes('kejernihan')) {
    if (valLower.includes('keruh') || valLower.includes('cloudy')) return 'Abnormal';
    return 'Normal';
  }

  // 4. Sedimen Mikroskopis Urin: Leukosit (0 - 5 /LPB), Eritrosit (0 - 2 /LPB)
  if (id === 'u_sed_leuko' || name.includes('leukosit urine') || name.includes('leukosit (sedimen)')) {
    if (valLower.includes('penuh') || valLower.includes('banyak')) return 'Tinggi';
    const matches = rawVal.match(/\d+(\.\d+)?/g);
    if (matches && matches.length > 0) {
      const maxVal = Math.max(...matches.map(Number));
      if (maxVal > 5) return 'Tinggi';
    }
    return 'Normal';
  }

  if (id === 'u_sed_eri' || name.includes('eritrosit urine') || name.includes('eritrosit (sedimen)')) {
    if (valLower.includes('penuh') || valLower.includes('banyak')) return 'Tinggi';
    const matches = rawVal.match(/\d+(\.\d+)?/g);
    if (matches && matches.length > 0) {
      const maxVal = Math.max(...matches.map(Number));
      if (maxVal > 2) return 'Tinggi';
    }
    return 'Normal';
  }

  // 4b. Berat Jenis Urin (Specific Gravity / BJ: id: 'bj', 'u_bj', dll)
  if (
    id === 'bj' ||
    id === 'u_bj' ||
    name.includes('berat jenis') ||
    name.includes('specific gravity')
  ) {
    let cleanVal = rawVal.replace(',', '.').trim();
    let num = parseFloat(cleanVal);
    if (isNaN(num)) return 'Normal';
    // Jika ditulis tanpa desimal (misal 1000, 1005, 1010, 1015, 1020, 1025, 1030)
    if (num >= 500) {
      num = num / 1000;
    }
    // Rentang rujukan fisiologis BJ urin: 1.000 - 1.030 (atau 1.003 - 1.030)
    // Nilai 1.000 (urin encer fisiologis / hidrasi baik) adalah normal
    if (num >= 1.000 && num <= 1.030) return 'Normal';
    if (num > 1.030) return 'Tinggi';
    if (num < 1.000) return 'Rendah';
    return 'Normal';
  }

  // 4c. pH Urin (id: 'ph', 'u_ph', 'ph urine')
  if (id === 'ph' || id === 'u_ph' || name.includes('ph urine') || name === 'ph') {
    let cleanVal = rawVal.replace(',', '.').trim();
    let num = parseFloat(cleanVal);
    if (!isNaN(num)) {
      if (num < 4.5) return 'Rendah';
      if (num > 8.0) return 'Tinggi';
      return 'Normal';
    }
  }

  // 5. Parameter Numerik Klinis
  // Bersihkan pemisah ribuan titik/koma (misal "12.000" atau "245.000" atau "14,8")
  let cleanNumStr = rawVal;
  if (/^\d{2,3}\.\d{3}$/.test(cleanNumStr)) {
    // Pola ribuan dengan titik untuk leukosit/trombosit: 10.000, 245.000
    cleanNumStr = cleanNumStr.replace('.', '');
  } else if (/^\d{1}\.\d{3}$/.test(cleanNumStr)) {
    // Angka 1 digit didepan titik (misal 6.800 atau 1.000)
    if (id === 'leuko' || name.includes('leukosit')) {
      cleanNumStr = cleanNumStr.replace('.', '');
    }
  } else if (/^\d+,\d+$/.test(cleanNumStr)) {
    // Pola desimal dengan koma, e.g. 14,8 atau 8,5
    cleanNumStr = cleanNumStr.replace(',', '.');
  } else {
    cleanNumStr = cleanNumStr.replace(/,/g, '');
  }

  const numVal = parseFloat(cleanNumStr);

  if (!isNaN(numVal)) {
    // Kolesterol Total (< 200 mg/dL)
    if (id === 'kol_tot' || name.includes('kolesterol total')) {
      if (numVal >= 200) return 'Tinggi';
      return 'Normal';
    }

    // Trigliserida (< 150 mg/dL)
    if (id === 'trigliserida' || name.includes('trigliserida')) {
      if (numVal >= 150) return 'Tinggi';
      return 'Normal';
    }

    // Kolesterol LDL (< 100 mg/dL)
    if (id === 'ldl' || name.includes('kolesterol ldl')) {
      if (numVal >= 100) return 'Tinggi';
      return 'Normal';
    }

    // Kolesterol HDL (>= 40 mg/dL)
    if (id === 'hdl' || name.includes('kolesterol hdl')) {
      if (numVal < 40) return 'Rendah';
      return 'Normal';
    }

    // Asam Urat (3.4 - 7.0 mg/dL)
    if (id === 'asam_urat' || name.includes('asam urat')) {
      if (numVal > 7.0) return 'Tinggi';
      if (numVal < 2.5) return 'Rendah';
      return 'Normal';
    }

    // Glukosa Puasa / Sewaktu
    if (id === 'gdp' || name.includes('glukosa puasa') || name.includes('gula darah puasa')) {
      if (numVal > 100) return 'Tinggi';
      if (numVal < 70) return 'Rendah';
      return 'Normal';
    }
    if (id === 'gds' || name.includes('glukosa sewaktu') || name.includes('gula darah sewaktu')) {
      if (numVal >= 140) return 'Tinggi';
      if (numVal < 70) return 'Rendah';
      return 'Normal';
    }

    // Enzim Hati (SGOT / SGPT)
    if (id === 'sgot' || name.includes('sgot') || name.includes('ast')) {
      if (numVal > 37) return 'Tinggi';
      return 'Normal';
    }
    if (id === 'sgpt' || name.includes('sgpt') || name.includes('alt')) {
      if (numVal > 42) return 'Tinggi';
      return 'Normal';
    }

    // Bilirubin Total (0.2 - 1.2 mg/dL)
    if (id === 'bili_tot' || name.includes('bilirubin total')) {
      if (numVal > 1.2) return 'Tinggi';
      return 'Normal';
    }

    // Fungsi Ginjal (Ureum: 15 - 45, Kreatinin: 0.6 - 1.3)
    if (id === 'ureum' || name.includes('ureum')) {
      if (numVal > 45) return 'Tinggi';
      if (numVal < 15) return 'Rendah';
      return 'Normal';
    }
    if (id === 'kreatinin' || name.includes('kreatinin')) {
      if (numVal > 1.3) return 'Tinggi';
      if (numVal < 0.6) return 'Rendah';
      return 'Normal';
    }

    // Hemoglobin (13.5 - 17.5 g/dL)
    if (id === 'hb' || name.includes('hemoglobin')) {
      if (numVal < 13.0) return 'Rendah';
      if (numVal > 17.5) return 'Tinggi';
      return 'Normal';
    }

    // Leukosit (4.500 - 10.000 /uL)
    if (id === 'leuko' || name.includes('leukosit')) {
      if (numVal > 10000) return 'Tinggi';
      if (numVal < 4000) return 'Rendah';
      return 'Normal';
    }

    // Trombosit (150.000 - 450.000 /uL)
    if (id === 'trombo' || name.includes('trombosit')) {
      if (numVal < 150000) return 'Rendah';
      if (numVal > 450000) return 'Tinggi';
      return 'Normal';
    }

    // Hematokrit (40 - 52 %)
    if (id === 'ht' || name.includes('hematokrit')) {
      if (numVal < 40.0) return 'Rendah';
      if (numVal > 52.0) return 'Tinggi';
      return 'Normal';
    }

    // Eritrosit (4.5 - 5.5 jt/uL)
    if (id === 'eri' || name.includes('eritrosit')) {
      if (numVal < 4.5) return 'Rendah';
      if (numVal > 5.5) return 'Tinggi';
      return 'Normal';
    }

    // Laju Endap Darah (0 - 15 mm/jam)
    if (id === 'led' || name.includes('laju endap darah')) {
      if (numVal > 15) return 'Tinggi';
      return 'Normal';
    }

    // Hitung Jenis Leukosit
    if (id === 'diff_eos' || name.includes('eosinofil')) {
      if (numVal > 4) return 'Tinggi';
      if (numVal < 1) return 'Rendah';
      return 'Normal';
    }
    if (id === 'diff_baso' || name.includes('basofil')) {
      if (numVal > 1) return 'Tinggi';
      return 'Normal';
    }
    if (id === 'diff_batang' || name.includes('batang')) {
      if (numVal > 6) return 'Tinggi';
      if (numVal < 2) return 'Rendah';
      return 'Normal';
    }
    if (id === 'diff_seg' || name.includes('segmen')) {
      if (numVal > 70) return 'Tinggi';
      if (numVal < 50) return 'Rendah';
      return 'Normal';
    }
    if (id === 'diff_limfo' || name.includes('limfosit')) {
      if (numVal > 40) return 'Tinggi';
      if (numVal < 20) return 'Rendah';
      return 'Normal';
    }
    if (id === 'diff_mono' || name.includes('monosit')) {
      if (numVal > 8) return 'Tinggi';
      if (numVal < 2) return 'Rendah';
      return 'Normal';
    }

    // Fallback parsing nilai rujukan generik (contoh: "10 - 20" atau "< 100" atau "> 50")
    if (item.refRange) {
      const range = item.refRange.trim();
      if (range.startsWith('<')) {
        const threshold = parseFloat(range.replace('<', '').trim());
        if (!isNaN(threshold) && numVal > threshold) return 'Tinggi';
      } else if (range.startsWith('>')) {
        const threshold = parseFloat(range.replace('>', '').trim());
        if (!isNaN(threshold) && numVal < threshold) return 'Rendah';
      } else if (range.includes('-')) {
        const parts = range.split('-').map((p) => parseFloat(p.trim().replace(/,/g, '')));
        if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
          if (numVal < parts[0]) return 'Rendah';
          if (numVal > parts[1]) return 'Tinggi';
        }
      }
    }
  }

  // Jika eksplisit ada kata kunci negatif dalam nilai rujukan dan nilai input bukan salah satu kata normal
  if (
    item.refRange &&
    item.refRange.toLowerCase().includes('negatif') &&
    !normalKeywords.includes(valLower) &&
    valLower !== ''
  ) {
    return 'Abnormal';
  }

  return 'Normal';
};
