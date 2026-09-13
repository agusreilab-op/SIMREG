import { MedicalAdviceMaster } from '../types';
import { initialMedicalAdvices } from '../data/initialData';
import { evaluateLabItemStatus } from './labEvaluator';

export interface GeneratedMedicalResume {
  medResume: string;
  doctorAdvice: string;
  fitnessCriteria: string;
  medCategory: string;
  findings: string[];
  advices: string[];
  hasPhysicalData: boolean;
  isAllNormal: boolean;
  summaryStats: {
    tensi?: string;
    bmi?: number;
    bmiCategory?: string;
    bb?: number;
    tb?: number;
    findingsCount: number;
  };
}

export const DUMMY_DEFAULT_RESUME =
  'Pemeriksaan fisik dalam batas normal. Tekanan darah 120/80 mmHg, denyut nadi 76x/m. Tajam penglihatan visus normal, buta warna negatif. Hasil lab profil darah, kimia darah, dan urin dalam rentang rujukan. Rontgen Thorax, EKG 12-lead, Audiometri, Spirometri, USG Abdomen dan Uji Treadmill dalam batas normal.';

export const isOldDummyResume = (text?: string): boolean => {
  if (!text) return true;
  const trimmed = text.trim();
  return (
    trimmed === '' ||
    trimmed.includes('Tekanan darah 120/80 mmHg, denyut nadi 76x/m') ||
    trimmed.includes('Tekanan darah 120/80 mmHg') ||
    trimmed.includes('dalam batas normal (Fit to Work)') ||
    trimmed.includes('Pemeriksaan fisik umum, tanda vital, dan seluruh hasil pemeriksaan penunjang') ||
    trimmed.includes('Pemeriksaan fisik dalam batas normal.')
  );
};

export const getStoredAdvices = (): MedicalAdviceMaster[] => {
  try {
    const raw = localStorage.getItem('simreg_medical_advices');
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {}
  return initialMedicalAdvices;
};

/**
 * Otomatis menghitung Resume Medis & Diagnosa Klinis (Kesimpulan Temuan)
 * serta Rekomendasi / Saran Dokter Okupasi berdasarkan data aktual pemeriksaan:
 * 1. Fisik, Tensi (JNC VII), Antropometri/BMI (Asia Pasifik WPRO), Mata/Visus, Gigi, Abdomen, THT, Paru, Jantung
 * 2. Laboratorium Darah & Urin
 * 3. Rontgen Thorax
 * 4. EKG 12-Lead
 * 5. Audiometri
 * 6. Spirometri
 * 7. Treadmill
 * 8. USG Abdomen
 */
export const calculateMedicalResume = (
  patientMcuNo: string,
  customAdvices?: MedicalAdviceMaster[]
): GeneratedMedicalResume => {
  const activeAdvices = customAdvices && customAdvices.length > 0 ? customAdvices : getStoredAdvices();

  let fisikData: any = null;
  let labData: any = null;
  let rontgenData: any = null;
  let ekgData: any = null;
  let audiometriData: any = null;
  let spirometriData: any = null;
  let treadmillData: any = null;
  let usgData: any = null;

  try {
    const rf = localStorage.getItem(`simreg_fisik_${patientMcuNo}`);
    if (rf) fisikData = JSON.parse(rf);
    const rl = localStorage.getItem(`simreg_lab_${patientMcuNo}`);
    if (rl) labData = JSON.parse(rl);
    const rr = localStorage.getItem(`simreg_rontgen_${patientMcuNo}`);
    if (rr) rontgenData = JSON.parse(rr);
    const re = localStorage.getItem(`simreg_ekg_${patientMcuNo}`);
    if (re) ekgData = JSON.parse(re);
    const ra = localStorage.getItem(`simreg_audiometri_${patientMcuNo}`);
    if (ra) audiometriData = JSON.parse(ra);
    const rs = localStorage.getItem(`simreg_spirometri_${patientMcuNo}`);
    if (rs) spirometriData = JSON.parse(rs);
    const rt = localStorage.getItem(`simreg_treadmill_${patientMcuNo}`);
    if (rt) treadmillData = JSON.parse(rt);
    const ru = localStorage.getItem(`simreg_usg_${patientMcuNo}`);
    if (ru) usgData = JSON.parse(ru);
  } catch (e) {}

  const findings: string[] = [];
  const adviceList: string[] = [];

  const getAdvice = (kodeOrKeyword: string, fallbackText: string): string => {
    const found = activeAdvices.find(
      (a) =>
        a.kode.toLowerCase() === kodeOrKeyword.toLowerCase() ||
        a.judulMasalah.toLowerCase().includes(kodeOrKeyword.toLowerCase())
    );
    return found?.saranMedis || fallbackText;
  };

  // 1. EVALUASI PEMERIKSAAN FISIK & ANTROPOMETRI
  const hasPhysicalData = !!fisikData;
  const bb = fisikData?.beratBadan != null ? Number(fisikData.beratBadan) : 0;
  const tb = fisikData?.tinggiBadan != null ? Number(fisikData.tinggiBadan) : 0;
  const sistole = fisikData?.tensiSistole != null ? Number(fisikData.tensiSistole) : 0;
  const diastole = fisikData?.tensiDiastole != null ? Number(fisikData.tensiDiastole) : 0;

  const ishihara = fisikData?.ishiharaButaWarna ?? '';
  const visusOd = fisikData?.visusOdTanpaKacamata ?? '';
  const visusOs = fisikData?.visusOsTanpaKacamata ?? '';
  const visusOdGlass = fisikData?.visusOdKacamata ?? '';
  const visusOsGlass = fisikData?.visusOsKacamata ?? '';
  const abdomenNotes = fisikData?.abdomen ?? '';
  const gigiMulutNotes = fisikData?.gigiMulut ?? '';
  const thtNotes = fisikData?.tht ?? '';
  const paruNotes = fisikData?.paru ?? '';
  const jantungNotes = fisikData?.jantung ?? '';

  // Tekanan Darah (Standar JNC VII)
  if (sistole > 0 || diastole > 0) {
    if (sistole >= 160 || diastole >= 100) {
      findings.push(`Hipertensi Derajat 2. (TD:${sistole}/${diastole} mmHg)`);
      adviceList.push(
        getAdvice(
          'SARAN-HT-03',
          'Kontrol tekanan darah secara teratur. Diperlukan evaluasi terapi farmakologis antihipertensi segera serta pembatasan asupan natrium/garam ketat.'
        )
      );
    } else if (sistole >= 140 || diastole >= 90) {
      findings.push(`Hipertensi Derajat 1. (TD:${sistole}/${diastole} mmHg)`);
      adviceList.push(
        getAdvice(
          'SARAN-HT-02',
          'Kontrol tekanan darah secara teratur. Batasi konsumsi garam ketat, kurangi makanan olahan/kemasan, kelola stres, dan evaluasi tensi berkala.'
        )
      );
    } else if (sistole > 120 || diastole > 80) {
      findings.push(`Pre hipertensi. (TD: ${sistole}/${diastole} mmHg)`);
      adviceList.push(
        getAdvice(
          'SARAN-HT-01',
          'Kontrol tekanan darah secara teratur. Batasi asupan natrium/garam (< 2000 mg/hari), kurangi makanan olahan/pengawet, kelola stres, dan olahraga aerobik rutin 30 menit per hari.'
        )
      );
    }
  }

  // Antropometri IMT / BMI (Standar Asia Pasifik WPRO)
  let bmiVal = 0;
  let bmiCategory = 'Normal';
  if (tb > 0 && bb > 0) {
    const tbMeter = tb / 100;
    bmiVal = Number((bb / (tbMeter * tbMeter)).toFixed(1));
    if (bmiVal >= 30.0) {
      bmiCategory = 'Obesitas Tingkat II';
      findings.push(`Obesitas Tingkat II (BMI ${bmiVal} kg/m² - BB ${bb} kg, TB ${tb} cm)`);
      adviceList.push(
        getAdvice(
          'SARAN-BMI-04',
          'Konsultasi dokter spesialis gizi klinis untuk program penurunan berat badan terukur secara komprehensif.'
        )
      );
    } else if (bmiVal >= 25.0) {
      bmiCategory = 'Obesitas Tingkat I';
      findings.push(`Obesitas Tingkat I (BMI ${bmiVal} kg/m² - BB ${bb} kg, TB ${tb} cm)`);
      adviceList.push(
        getAdvice(
          'SARAN-BMI-02',
          'Pola makan gizi seimbang dengan defisit kalori terukur dan olahraga aerobik rutin 150 menit/minggu.'
        )
      );
    } else if (bmiVal >= 23.0) {
      bmiCategory = 'Kelebihan Berat Badan (Overweight)';
      findings.push(`Kelebihan Berat Badan / Overweight (BMI ${bmiVal} kg/m² - BB ${bb} kg, TB ${tb} cm)`);
      adviceList.push(
        getAdvice(
          'SARAN-BMI-01',
          'Pola makan gizi seimbang dengan defisit kalori terukur dan olahraga aerobik minimal 150 menit/minggu.'
        )
      );
    } else if (bmiVal < 18.5 && bmiVal > 0) {
      bmiCategory = 'Berat Badan Kurang (Underweight)';
      findings.push(`Berat Badan Kurang / Underweight (BMI ${bmiVal} kg/m² - BB ${bb} kg, TB ${tb} cm)`);
      adviceList.push(
        getAdvice(
          'SARAN-BMI-03',
          'Tingkatkan asupan kalori dan protein berkualitas tinggi serta istirahat cukup.'
        )
      );
    }
  }

  // Mata / Refraksi & Visus
  const hasVisusOdAbnormal =
    (visusOd !== '' && visusOd !== '-' && visusOd !== '6/6') ||
    (visusOdGlass !== '' && visusOdGlass !== '-');
  const hasVisusOsAbnormal =
    (visusOs !== '' && visusOs !== '-' && visusOs !== '6/6') ||
    (visusOsGlass !== '' && visusOsGlass !== '-');
  const hasMyopiaKeyword =
    (fisikData?.kesimpulan && fisikData.kesimpulan.toLowerCase().includes('myopia')) ||
    (fisikData?.catatanKhusus && fisikData.catatanKhusus.toLowerCase().includes('myopia'));

  if (hasVisusOdAbnormal || hasVisusOsAbnormal || hasMyopiaKeyword) {
    if (hasVisusOdAbnormal && hasVisusOsAbnormal) {
      findings.push('Myopia mata kanan - kiri.');
    } else if (hasVisusOdAbnormal) {
      findings.push(`Myopia mata kanan. (Visus OD: ${visusOd})`);
    } else {
      findings.push(`Myopia mata kiri. (Visus OS: ${visusOs})`);
    }
    adviceList.push(
      getAdvice(
        'SARAN-EYE-01',
        'Koreksi penglihatan dengan kacamata minus atau silinder. Pengukuran lebih telit bisa dilakukan di toko optk atau dokter perusahaan/spesialis mata. Hindari melihat dengan akomodasi berlebih, karena dapat menimbulkan penambahan penurunan penglihatan.'
      )
    );
  }

  if (ishihara && ishihara !== 'Normal' && ishihara !== '-' && ishihara !== '') {
    findings.push(`Buta Warna (${ishihara})`);
    adviceList.push('Penyesuaian tugas kerja yang tidak memerlukan pembacaan kode warna kritis.');
  }

  // Abdomen (Saluran Cerna - NT Epigastrium dll)
  const abdLower = abdomenNotes.toLowerCase();
  const isAbdNormalOrNeg =
    abdLower.includes('nyeri tekan (-)') ||
    abdLower.includes('nyeri tekan (-/-)') ||
    abdLower.includes('nyeri tekan -/-') ||
    abdLower.includes('nyeri tekan: (-)') ||
    abdLower.includes('nyeri tekan: (-/-)') ||
    abdLower.includes('nyeri tekan: -') ||
    abdLower.includes('tidak ada nyeri tekan') ||
    abdLower.includes('nyeri tekan tidak ada') ||
    (abdLower.includes('supel') && !abdLower.includes('nyeri tekan (+)')) ||
    abdLower.includes('dalam batas normal') ||
    abdLower.includes('dbn');

  if (!isAbdNormalOrNeg) {
    if (
      abdLower.includes('nt epigastrium') ||
      abdLower.includes('nyeri tekan epigastrium') ||
      (abdLower.includes('epigastrium') && abdLower.includes('nyeri')) ||
      (abdLower.includes('nyeri tekan') && !abdLower.includes('tidak')) ||
      abdLower.includes('gastritis') ||
      abdLower.includes('dispepsia') ||
      abdLower.includes('maag')
    ) {
      findings.push('NT Epigastrium');
      adviceList.push(
        getAdvice(
          'SARAN-GI-01',
          'Kurangi konsumsi makanan/minuman yang menimbulkan gas dilambung sepert minuman ringan/minuman bersoda, kopi, sayur kol, cabe, makanan pedas/asam, serta terapkan pola makan sedikit-sering yaitu makan setdaknya setap 2 jam sekali dengan porsi kecil dengan menghindari jenis makanan/minuman tersebu'
        )
      );
    }
  }

  // Gigi & Mulut (Hanya abnormal jika ada karies/karang gigi nyata dan BUKAN kondisi normal/negatif)
  const gmLower = gigiMulutNotes.toLowerCase();
  const hasKaries =
    gmLower.includes('karies') &&
    !gmLower.includes('karies (-)') &&
    !gmLower.includes('karies (-/-)') &&
    !gmLower.includes('karies gigi (-)') &&
    !gmLower.includes('karies gigi (-/-)') &&
    !gmLower.includes('tidak ada karies') &&
    !gmLower.includes('bebas karies');
  const hasKarangGigi =
    gmLower.includes('karang gigi') &&
    !gmLower.includes('karang gigi minimal') &&
    !gmLower.includes('karang gigi (-)') &&
    !gmLower.includes('karang gigi (-/-)') &&
    !gmLower.includes('tidak ada karang gigi') &&
    !gmLower.includes('bebas karang gigi');
  const hasGangrenOrRadiks =
    gmLower.includes('gangren') || gmLower.includes('radiks');
  const hasLubang =
    gmLower.includes('lubang') &&
    !gmLower.includes('berlubang (-)') &&
    !gmLower.includes('lubang (-)') &&
    !gmLower.includes('lubang (-/-)') &&
    !gmLower.includes('tidak berlubang');

  if (hasKaries || hasKarangGigi || hasGangrenOrRadiks || hasLubang) {
    findings.push('Karies gigi & karang gigi');
    adviceList.push(
      getAdvice(
        'SARAN-DENTAL-01',
        'Pemeriksaan ke dokter gigi untuk penambalan karies gigi serta pembersihan karang gigi (scaling) secara berkala minimal 6 bulan sekali.'
      )
    );
  }

  // THT
  const thtLower = thtNotes.toLowerCase();
  const isSerumenAbnormal =
    thtLower.includes('serumen') &&
    !thtLower.includes('serumen (-)') &&
    !thtLower.includes('serumen (-/-)') &&
    !thtLower.includes('serumen -/-') &&
    !thtLower.includes('serumen: (-)') &&
    !thtLower.includes('serumen: (-/-)') &&
    !thtLower.includes('serumen: -/-') &&
    !thtLower.includes('serumen prop (-)') &&
    !thtLower.includes('tidak ada serumen') &&
    !thtLower.includes('tidak ada') &&
    !thtLower.includes('normal') &&
    !thtLower.includes('bersih');

  const isFaringAbnormal =
    (thtLower.includes('faringitis') ||
      (thtLower.includes('faring') && thtLower.includes('hiperemis'))) &&
    !thtLower.includes('tidak hiperemis') &&
    !thtLower.includes('faring tidak hiperemis') &&
    !thtLower.includes('hiperemis (-)') &&
    !thtLower.includes('hiperemis (-/-)') &&
    !thtLower.includes('tenang') &&
    !thtLower.includes('normal');

  if (isSerumenAbnormal) {
    findings.push('Serumen prop telinga');
    adviceList.push('Lakukan pembersihan serumen telinga di fasilitas kesehatan dan hindari penggunaan cotton bud berlebihan.');
  }
  if (isFaringAbnormal) {
    findings.push('Faringitis kronis / Hiperemis faring');
    adviceList.push('Hindari minuman dingin, makanan berminyak/pedas, rokok, dan cukup istirahat.');
  }

  // Paru Auskultasi
  const paruLower = paruNotes.toLowerCase();
  const isRhonkiAbnormal =
    (paruLower.includes('rhonki') || paruLower.includes('ronki')) &&
    !paruLower.includes('rhonki (-/-)') &&
    !paruLower.includes('ronki (-/-)') &&
    !paruLower.includes('rhonki -/-') &&
    !paruLower.includes('ronki -/-') &&
    !paruLower.includes('rhonki (-)') &&
    !paruLower.includes('ronki (-)') &&
    !paruLower.includes('tidak ada') &&
    !paruLower.includes('normal');

  const isWheezingAbnormal =
    paruLower.includes('wheezing') &&
    !paruLower.includes('wheezing (-/-)') &&
    !paruLower.includes('wheezing -/-') &&
    !paruLower.includes('wheezing (-)') &&
    !paruLower.includes('tidak ada') &&
    !paruLower.includes('normal');

  if (isRhonkiAbnormal) {
    findings.push('Suara napas tambahan (Rhonki)');
    adviceList.push(getAdvice('SARAN-PUL-01', 'Evaluasi dokter faskes untuk penanganan infeksi saluran pernapasan atau bronkospasme.'));
  }
  if (isWheezingAbnormal) {
    findings.push('Suara napas tambahan (Wheezing)');
    adviceList.push(getAdvice('SARAN-PUL-01', 'Evaluasi dokter faskes untuk penanganan bronkospasme atau asma kerja.'));
  }

  // Jantung Auskultasi
  const jtgLower = jantungNotes.toLowerCase();
  const isMurmurAbnormal =
    jtgLower.includes('murmur') &&
    !jtgLower.includes('murmur (-)') &&
    !jtgLower.includes('murmur (-/-)') &&
    !jtgLower.includes('murmur -/-') &&
    !jtgLower.includes('tidak ada murmur') &&
    !jtgLower.includes('tidak ada') &&
    !jtgLower.includes('normal');

  const isGallopAbnormal =
    jtgLower.includes('gallop') &&
    !jtgLower.includes('gallop (-)') &&
    !jtgLower.includes('gallop (-/-)') &&
    !jtgLower.includes('gallop -/-') &&
    !jtgLower.includes('tidak ada gallop') &&
    !jtgLower.includes('tidak ada') &&
    !jtgLower.includes('normal');

  if (isMurmurAbnormal || isGallopAbnormal) {
    findings.push('Bising Jantung (Murmur/Gallop)');
    adviceList.push('Konsultasi ke Dokter Spesialis Jantung (Sp.JP) untuk evaluasi katup jantung.');
  }

  // Tanda Vital Lain & Organ Fisik Spesifik
  const nadi = fisikData?.nadi ? Number(fisikData.nadi) : 0;
  if (nadi > 100) {
    findings.push(`Takikardia (Denyut Nadi: ${nadi} x/menit)`);
    adviceList.push('Evaluasi ritme jantung, hidrasi cukup, dan kurangi konsumsi kafein/stres.');
  } else if (nadi > 0 && nadi < 55) {
    findings.push(`Bradikardia Sinus (Denyut Nadi: ${nadi} x/menit)`);
  }

  const lingkarPerut = fisikData?.lingkarPerut ? Number(fisikData.lingkarPerut) : 0;
  if (lingkarPerut > 90) {
    findings.push(`Obesitas Sentral (Lingkar Perut: ${lingkarPerut} cm)`);
    adviceList.push('Pengurangan lingkar perut dengan defisit kalori dan latihan kardiovaskular teratur.');
  }

  // Konjungtiva Mata (Hanya abnormal jika 'Anemis' atau 'Hiperemis' dan BUKAN 'Normal (Tidak Anemis)')
  const konjRaw = String(fisikData?.konjungtiva || '').trim();
  const konjLower = konjRaw.toLowerCase();

  const isKonjNormalOrNegative =
    !konjLower ||
    konjLower.includes('tidak') ||
    konjLower.includes('normal') ||
    konjLower.includes('ananem') || // ananemis = tidak anemis
    konjLower.includes('non') ||
    konjLower.includes('tanpa') ||
    konjLower.includes('bebas') ||
    konjLower.includes('(-)') ||
    konjLower.includes('(-/-)') ||
    konjLower.includes('-/-') ||
    konjLower.includes('negatif') ||
    konjLower.includes('negative') ||
    konjLower.includes('tenang') ||
    konjLower.includes('dbn') ||
    konjLower.includes('dalam batas normal');

  const isKonjAnemis =
    !isKonjNormalOrNegative && konjLower.includes('anemis');

  const isKonjHiperemis =
    !isKonjNormalOrNegative &&
    (konjLower.includes('hiperemis') || konjLower.includes('konjungtivitis'));

  if (isKonjAnemis) {
    findings.push('Konjungtiva Anemis (Suspek Anemia Klinis)');
    adviceList.push('Konsumsi makanan tinggi zat besi dan evaluasi kadar hemoglobin darah.');
  } else if (isKonjHiperemis) {
    findings.push('Konjungtiva Hiperemis / Konjungtivitis');
    adviceList.push('Konsultasi dokter spesialis mata atau faskes untuk evaluasi konjungtivitis/iritasi mata.');
  }

  // Sklera Mata (Hanya abnormal jika 'Ikterik' atau 'Ikterus' dan BUKAN 'Normal (Tidak Ikterik)' / 'Tidak Ikterus' / 'Anikterik')
  const skleraRaw = String(fisikData?.sklera || '').trim();
  const skleraLower = skleraRaw.toLowerCase();

  const isSkleraNormalOrNegative =
    !skleraLower ||
    skleraLower.includes('tidak ikter') ||
    skleraLower.includes('tidak ikterus') ||
    skleraLower.includes('tidak kuning') ||
    skleraLower.includes('tidak') ||
    skleraLower.includes('normal') ||
    skleraLower.includes('anikter') || // istilah klinis 'anikterik' / 'anikterus' = normal / tidak ikterus
    skleraLower.includes('non') ||
    skleraLower.includes('tanpa') ||
    skleraLower.includes('bebas') ||
    skleraLower.includes('(-)') ||
    skleraLower.includes('(-/-)') ||
    skleraLower.includes('-/-') ||
    skleraLower.includes('negatif') ||
    skleraLower.includes('negative') ||
    skleraLower.includes('jernih') ||
    skleraLower.includes('tenang') ||
    skleraLower.includes('dbn') ||
    skleraLower.includes('dalam batas normal');

  const isSkleraAbnormal =
    !isSkleraNormalOrNegative &&
    (skleraLower.includes('ikter') || skleraLower.includes('ikterus') || skleraLower.includes('kuning'));

  if (isSkleraAbnormal) {
    findings.push('Sklera Ikterik / Ikterus (Suspek Kelainan Hepatobilier)');
    adviceList.push('Konsultasi dokter spesialis penyakit dalam untuk evaluasi hepar dan empedu.');
  }

  // Lensa Mata (Hanya jika katarak / keruh dan bukan jernih/normal)
  const lensaLower = (fisikData?.lensa || '').toLowerCase();
  if (
    lensaLower &&
    (lensaLower.includes('katarak') || lensaLower.includes('keruh')) &&
    !lensaLower.includes('jernih') &&
    !lensaLower.includes('normal') &&
    !lensaLower.includes('tidak') &&
    !lensaLower.includes('(-)') &&
    !lensaLower.includes('(-/-)')
  ) {
    findings.push(`Kekeruhan Lensa Mata (${fisikData.lensa})`);
    adviceList.push('Konsultasi dokter spesialis mata untuk evaluasi katarak.');
  }

  // Ekstremitas (Hanya abnormal jika ada edema/varises dan bukan (-))
  const ekstLower = (fisikData?.ekstremitas || '').toLowerCase();
  const hasEdema =
    ekstLower.includes('edema') &&
    !ekstLower.includes('edema (-)') &&
    !ekstLower.includes('edema (-/-)') &&
    !ekstLower.includes('edema -/-') &&
    !ekstLower.includes('edema: (-)') &&
    !ekstLower.includes('edema: (-/-)') &&
    !ekstLower.includes('tidak ada edema') &&
    !ekstLower.includes('tidak ada') &&
    !ekstLower.includes('normal');

  const hasVarises =
    ekstLower.includes('varises') &&
    !ekstLower.includes('varises (-)') &&
    !ekstLower.includes('varises (-/-)') &&
    !ekstLower.includes('varises -/-') &&
    !ekstLower.includes('varises: (-)') &&
    !ekstLower.includes('varises: (-/-)') &&
    !ekstLower.includes('tidak ada varises') &&
    !ekstLower.includes('tidak ada') &&
    !ekstLower.includes('normal');

  if (hasEdema || hasVarises) {
    findings.push(`Kelainan Ekstremitas (${fisikData?.ekstremitas})`);
  }

  // 2. EVALUASI LABORATORIUM
  if (labData?.items && Array.isArray(labData.items)) {
    labData.items.forEach((item: any) => {
      const autoStatus = evaluateLabItemStatus(item);
      let effectiveStatus = item.status || autoStatus;
      if (
        (item.id === 'bj' || (item.name && item.name.toLowerCase().includes('berat jenis'))) &&
        item.status === 'Tinggi' &&
        autoStatus === 'Normal'
      ) {
        effectiveStatus = 'Normal';
      }

      if (effectiveStatus !== 'Normal') {
        const id = (item.id || '').toLowerCase();
        const name = item.name || '';
        const val = item.value || '';
        const unit = item.unit || '';
        const status = effectiveStatus;

        if (id === 'kol_tot' || name.toLowerCase().includes('kolesterol total')) {
          findings.push(`Dislipidemia / Hiperkolesterolemia (Kolesterol Total: ${val} ${unit})`);
          adviceList.push(
            getAdvice(
              'SARAN-LIP-01',
              'Batasi asupan lemak jenuh dan kolesterol tinggi (gorengan, santan kental, jeroan, daging berlemak). Perbanyak makanan berserat (sayur, buah) dan lakukan olahraga aerobik rutin minimal 150 menit per minggu.'
            )
          );
        } else if (id === 'trigliserida' || name.toLowerCase().includes('trigliserida')) {
          findings.push(`Hipertrigliseridemia (Trigliserida: ${val} ${unit})`);
          adviceList.push(
            getAdvice(
              'SARAN-LIP-01',
              'Batasi konsumsi karbohidrat sederhana, gula murni, minuman manis, alkohol, dan makanan berbahan tepung tinggi.'
            )
          );
        } else if (id === 'ldl' || name.toLowerCase().includes('kolesterol ldl')) {
          findings.push(`Peningkatan Kolesterol LDL (${val} ${unit})`);
          adviceList.push(
            getAdvice(
              'SARAN-LIP-01',
              'Kurangi asupan lemak jenuh dan kolesterol jahat. Konsumsi makanan kaya asam lemak tak jenuh (omega-3) dan evaluasi profil lipid berkala.'
            )
          );
        } else if (id === 'hdl' || name.toLowerCase().includes('kolesterol hdl')) {
          findings.push(`Penurunan Kolesterol HDL (${val} ${unit})`);
          adviceList.push('Tingkatkan aktivitas fisik aerobik secara konsisten dan perbanyak asupan lemak sehat (minyak zaitun, alpukat, ikan).');
        } else if (id === 'asam_urat' || name.toLowerCase().includes('asam urat')) {
          findings.push(`Hiperurisemia (Asam Urat: ${val} ${unit})`);
          adviceList.push(
            getAdvice(
              'SARAN-URI-01',
              'Hindari konsumsi makanan tinggi purin (jeroan, emping melinjo, seafood, bebek, alkohol/tape) serta cukupi hidrasi air putih minimal 2.5 - 3 liter/hari.'
            )
          );
        } else if (id === 'gdp' || id === 'gds' || name.toLowerCase().includes('glukosa') || name.toLowerCase().includes('gula darah')) {
          const numGula = parseFloat(val);
          if (!isNaN(numGula) && numGula < 70) {
            findings.push(`Hipoglikemia (${name}: ${val} ${unit})`);
            adviceList.push('Pastikan keteraturan pola makan dan jadwal sarapan sebelum beraktivitas kerja.');
          } else {
            findings.push(`Hiperglikemia / Prediabetes (${name}: ${val} ${unit})`);
            adviceList.push(
              getAdvice(
                'SARAN-DM-01',
                'Batasi konsumsi gula murni, karbohidrat sederhana, makanan olahan manis. Lakukan pemantauan glukosa darah dan HbA1c secara berkala.'
              )
            );
          }
        } else if (id === 'sgot' || id === 'sgpt' || name.toLowerCase().includes('sgot') || name.toLowerCase().includes('sgpt') || name.toLowerCase().includes('ast') || name.toLowerCase().includes('alt')) {
          findings.push(`Peningkatan Enzim Transaminase Hati (${name}: ${val} ${unit})`);
          adviceList.push('Hindari konsumsi alkohol, jamu tanpa izin edar, dan obat-obatan hepatotoksik tanpa resep dokter. Istirahat cukup dan kontrol enzim hati 1-3 bulan ke depan.');
        } else if (id === 'bili_tot' || name.toLowerCase().includes('bilirubin')) {
          findings.push(`Hiperbilirubinemia (${name}: ${val} ${unit})`);
          adviceList.push('Konsultasi dokter spesialis penyakit dalam untuk evaluasi fungsi hepar dan traktus biliaris.');
        } else if (id === 'ureum' || id === 'kreatinin' || name.toLowerCase().includes('ureum') || name.toLowerCase().includes('kreatinin')) {
          findings.push(`Peningkatan ${name} (${val} ${unit} - Evaluasi Fungsi Ginjal)`);
          adviceList.push('Cukupi asupan air putih minimal 2.5 liter per hari, batasi konsumsi suplemen berlebih, dan evaluasi laju filtrasi glomerulus (eGFR).');
        } else if (id === 'hb' || name.toLowerCase().includes('hemoglobin')) {
          if (status === 'Rendah') {
            findings.push(`Anemia (Hemoglobin: ${val} ${unit})`);
            adviceList.push('Tingkatkan konsumsi makanan kaya zat besi (daging merah tanpa lemak, bayam, hati ayam), vitamin C, dan konsultasi dokter faskes untuk evaluasi suplemen zat besi.');
          } else {
            findings.push(`Polisitemia (Hemoglobin: ${val} ${unit})`);
            adviceList.push('Cukupi hidrasi cairan harian dan konsultasikan ke dokter faskes untuk evaluasi hematologi lanjutan.');
          }
        } else if (id === 'leuko' || name.toLowerCase().includes('leukosit')) {
          if (status === 'Tinggi') {
            findings.push(`Leukositosis (Leukosit: ${val} ${unit})`);
            adviceList.push('Evaluasi adanya fokus infeksi atau inflamasi (saluran napas, gigi, saluran kemih) bersama dokter pemeriksa.');
          } else {
            findings.push(`Leukopenia (Leukosit: ${val} ${unit})`);
            adviceList.push('Evaluasi daya tahan tubuh, istirahat cukup, dan hindari kontak dengan orang sakit.');
          }
        } else if (id === 'trombo' || name.toLowerCase().includes('trombosit')) {
          findings.push(`${status === 'Rendah' ? 'Trombositopenia' : 'Trombositosis'} (Trombosit: ${val} ${unit})`);
          adviceList.push('Evaluasi hematologi darah berkala ke fasilitas kesehatan.');
        } else if (id === 'ht' || name.toLowerCase().includes('hematokrit')) {
          findings.push(`${status === 'Rendah' ? 'Penurunan' : 'Peningkatan'} Hematokrit (Ht: ${val} ${unit})`);
        } else if (id === 'eri' || name.toLowerCase().includes('eritrosit')) {
          findings.push(`${status === 'Rendah' ? 'Penurunan' : 'Peningkatan'} Hitung Eritrosit (RBC: ${val} ${unit})`);
        } else if (id === 'led' || name.toLowerCase().includes('laju endap darah')) {
          findings.push(`Peningkatan Laju Endap Darah (LED: ${val} ${unit})`);
          adviceList.push('Evaluasi kemungkinan respon inflamasi sistemik atau infeksi bersama dokter.');
        } else if (id === 'u_protein') {
          findings.push(`Proteinuria (${val})`);
          adviceList.push('Cukupi hidrasi air putih 2.5 liter per hari, hindari konsumsi obat NSAID berlebih, dan evaluasi fungsi ginjal berkala.');
        } else if (id === 'u_glukosa') {
          findings.push(`Glukosuria (${val})`);
          adviceList.push('Pemeriksaan gula darah puasa, 2 jam PP, dan HbA1c untuk evaluasi metabolisme glukosa.');
        } else if (id === 'u_blood') {
          findings.push(`Hematuria Mikroskopis (Darah Samar Urine: ${val})`);
          adviceList.push('Cukupi hidrasi air putih, hindari menahan kencing, dan evaluasi saluran kemih.');
        } else if (id === 'u_sed_leuko' || id === 'u_sed_bakteri' || id === 'u_nitrit') {
          findings.push(`Leukosituria / Bakteriuria - Suspek ISK (${name}: ${val})`);
          adviceList.push('Cukupi hidrasi air putih minimal 2.5 liter per hari, jangan menahan buang air kecil, dan jaga kebersihan area genitalia.');
        } else if (id === 'u_sed_eri') {
          findings.push(`Hematuria Mikroskopis (${name}: ${val})`);
        } else if (id === 'u_sed_kristal') {
          findings.push(`Kristaluria (${val})`);
          adviceList.push('Tingkatkan asupan air putih minimal 3 liter per hari untuk mencegah pembentukan batu saluran kemih.');
        } else if (id.startsWith('narkoba_') || name.toLowerCase().includes('narkoba') || name.toLowerCase().includes('amphetamine') || name.toLowerCase().includes('thc')) {
          findings.push(`Skrining Narkoba Positif (${name}: ${val})`);
          adviceList.push('Diperlukan konfirmasi laboratorium rujukan lanjutan dan penanganan K3 perusahaan.');
        } else {
          findings.push(`${name} di luar batas normal (${val} ${unit} - ${status})`);
          adviceList.push(`Konsultasikan hasil pemeriksaan laboratorium ${name} (${val} ${unit}) dengan dokter pemeriksa untuk evaluasi klinis lanjutan.`);
        }
      }
    });

    if (
      labData.summary &&
      !labData.isAllNormal &&
      !findings.some((f) => f.includes('Kolesterol') || f.includes('Asam Urat') || f.includes('Laboratorium') || f.includes('Dislipidemia') || f.includes('Hemoglobin') || f.includes('Leukosit'))
    ) {
      findings.push(`Laboratorium: ${labData.summary}`);
    }
  }

  // 3. EVALUASI RONTGEN THORAX (Hanya temuan abnormal)
  if (rontgenData) {
    const isNormal = rontgenData.isOverallNormal === true;
    const rd = rontgenData.data || {};
    
    if (!isNormal) {
      if (rd.corStatus === 'Kardiomegali') {
        findings.push('Kardiomegali (Pembesaran Jantung pada Rontgen Thorax)');
        adviceList.push('Konsultasi ke Dokter Spesialis Jantung (Sp.JP) atau Spesialis Penyakit Dalam (Sp.PD) untuk evaluasi fungsi pompa jantung, echocardiografi, serta kontrol tekanan darah.');
      }
      if (rd.pulmoStatus === 'Infiltrat') {
        findings.push('Infiltrat Paru / Suspek KP (Rontgen Thorax)');
        adviceList.push(
          getAdvice(
            'SARAN-RAD-01',
            'Konsultasi ke Dokter Spesialis Paru (Sp.P) untuk pemeriksaan dahak (TCM/BTA), evaluasi klinis paru, serta foto rontgen thorax evaluasi berkala.'
          )
        );
      } else if (rd.pulmoStatus === 'Lainnya') {
        findings.push(`Kelainan Parenkim Paru (Rontgen Thorax: ${rd.pulmoDesc || 'Abnormal'})`);
        adviceList.push(getAdvice('SARAN-PUL-01', 'Konsultasi ke Dokter Spesialis Paru (Sp.P) untuk pemeriksaan paru lebih lanjut.'));
      }
      if (rd.diafragmaStatus === 'Sinus Tumpul' || rd.diafragmaStatus === 'Efusi Pleura') {
        findings.push(`Sinus Kostofrenikus Tumpul / ${rd.diafragmaStatus} (Rontgen Thorax)`);
        adviceList.push('Pemeriksaan lanjutan dokter spesialis paru untuk evaluasi efusi atau penebalan pleura.');
      }
      if (rd.skeletalStatus && rd.skeletalStatus !== 'Normal') {
        findings.push(`Kelainan Skeletal Thoraks (${rd.skeletalStatus}: ${rd.skeletalDesc || 'Abnormal'})`);
        adviceList.push('Perhatikan ergonomi postur kerja saat duduk dan mengangkat beban, serta konsultasi fisioterapi/orthopedi jika terdapat keluhan.');
      }
      // Jika ada kesan kustom yang abnormal dan belum tercover
      if (rontgenData.kesan && !rontgenData.kesan.toLowerCase().includes('dalam batas normal') && findings.filter(f => f.includes('Rontgen')).length === 0) {
        findings.push(`Rontgen Thorax: ${rontgenData.kesan}`);
      }
    }
  }

  // 4. EVALUASI EKG (Hanya temuan abnormal)
  if (ekgData) {
    const isNormal = ekgData.isOverallNormal === true;
    const diag = ekgData.diagnosis || '';
    if (!isNormal && diag && !diag.toLowerCase().includes('normal sinus') && diag !== 'Normal' && diag !== '-') {
      findings.push(`EKG 12-Lead: ${diag}`);
      if (diag.toLowerCase().includes('iskemik') || diag.toLowerCase().includes('elevasi') || diag.toLowerCase().includes('depresi')) {
        adviceList.push('Konsultasi segera dengan Dokter Spesialis Jantung & Pembuluh Darah (Sp.JP) untuk evaluasi kardiologi lanjutan.');
      } else {
        adviceList.push(
          getAdvice(
            'SARAN-EKG-01',
            'Konsultasi dan evaluasi lebih lanjut dengan Dokter Spesialis Jantung & Pembuluh Darah (Sp.JP). Hindari konsumsi kafein berlebih, rokok, stres, dan kelelahan fisik.'
          )
        );
      }
    }
  }

  // 5. EVALUASI AUDIOMETRI (Hanya temuan abnormal telinga kanan / kiri)
  if (audiometriData) {
    const diagKanan = audiometriData.diagKanan || '';
    const diagKiri = audiometriData.diagKiri || '';
    const kategoriHasil = audiometriData.kategoriHasil || '';

    const isKananNormal = !diagKanan || diagKanan.toLowerCase().includes('normal');
    const isKiriNormal = !diagKiri || diagKiri.toLowerCase().includes('normal');

    if (!isKananNormal && !isKiriNormal) {
      findings.push(`Audiometri: Gangguan Pendengaran Bilateral (Kanan: ${diagKanan} | Kiri: ${diagKiri})`);
      adviceList.push(
        getAdvice(
          'SARAN-ENT-01',
          'Wajib menggunakan Alat Pelindung Diri (APD) telinga (Ear Plug/Ear Muff) di tempat kerja dengan tingkat kebisingan > 85 dBA dan lakukan pemeriksaan audiometri evaluasi berkala setiap 6 bulan.'
        )
      );
    } else if (!isKananNormal) {
      findings.push(`Audiometri Telinga Kanan: ${diagKanan}`);
      adviceList.push(
        getAdvice(
          'SARAN-ENT-01',
          'Wajib menggunakan Alat Pelindung Diri (APD) telinga (Ear Plug/Ear Muff) di tempat kerja bising (> 85 dBA) dan lakukan pemeriksaan audiometri berkala setiap 6 bulan.'
        )
      );
    } else if (!isKiriNormal) {
      findings.push(`Audiometri Telinga Kiri: ${diagKiri}`);
      adviceList.push(
        getAdvice(
          'SARAN-ENT-01',
          'Wajib menggunakan Alat Pelindung Diri (APD) telinga (Ear Plug/Ear Muff) di tempat kerja bising (> 85 dBA) dan lakukan pemeriksaan audiometri berkala setiap 6 bulan.'
        )
      );
    } else if (kategoriHasil && !kategoriHasil.toLowerCase().includes('normal') && kategoriHasil !== '-') {
      findings.push(`Audiometri: ${kategoriHasil}`);
      adviceList.push(
        getAdvice(
          'SARAN-ENT-01',
          'Wajib menggunakan Alat Pelindung Diri (APD) telinga (Ear Plug/Ear Muff) di area kerja bising dan lakukan pemeriksaan audiometri berkala.'
        )
      );
    }
  }

  // 6. EVALUASI SPIROMETRI (Hanya temuan abnormal restriksi / obstruksi)
  if (spirometriData) {
    const isNormal = spirometriData.isNormal === true;
    const diag = spirometriData.diagnosis || spirometriData.kesimpulan || '';
    if (!isNormal && diag && !diag.toLowerCase().includes('normal') && diag !== '-') {
      findings.push(`Spirometri: ${diag}`);
      adviceList.push(
        getAdvice(
          'SARAN-PUL-01',
          'Hindari paparan debu, asap, dan uap kimia di tempat kerja. Wajib menggunakan masker respirator standar K3, hindari rokok, serta evaluasi klinis dengan Dokter Spesialis Paru (Sp.P).'
        )
      );
    }
  }

  // 7. EVALUASI TREADMILL (Hanya temuan abnormal / positif iskemik)
  if (treadmillData) {
    const kat = treadmillData.kategoriHasil || '';
    const kes = treadmillData.kesimpulan || '';
    const isNormal = kat.toLowerCase().includes('negatif') || kat.toLowerCase().includes('normal');

    if (!isNormal && (kat.toLowerCase().includes('positif') || kat.toLowerCase().includes('iskemik') || kat.toLowerCase().includes('submaksimal'))) {
      findings.push(`Treadmill Test: ${kat} (${kes || 'Respon Iskemik Positif'})`);
      adviceList.push('Konsultasi ke Dokter Spesialis Jantung & Pembuluh Darah (Sp.JP) untuk evaluasi iskemia miokard dan hindari beban aktivitas fisik berat.');
    }
  }

  // 8. EVALUASI USG ABDOMEN (Hanya temuan abnormal)
  if (usgData) {
    const isOverallNormal = usgData.isOverallNormal === true;
    const ud = usgData.data || {};
    const kesan = usgData.kesan || '';

    if (!isOverallNormal) {
      if (ud.heparStatus === 'Fatty Liver') {
        findings.push('Fatty Liver / Perlemakan Hati (USG Abdomen)');
        adviceList.push('Terapkan pola makan rendah lemak jenuh dan rendah kolesterol, batasi gorengan/santan, perbanyak serat, olahraga aerobik rutin, dan kontrol USG abdomen berkala.');
      } else if (ud.heparStatus && ud.heparStatus !== 'Normal') {
        findings.push(`Kelainan Hepar (USG Abdomen: ${ud.heparDesc || ud.heparStatus})`);
      }

      if (ud.vesicaFelleaStatus === 'Kolelitiasis') {
        findings.push('Kolelitiasis / Batu Kandung Empedu (USG Abdomen)');
        adviceList.push('Konsultasi ke Dokter Spesialis Bedah atau Spesialis Penyakit Dalam untuk evaluasi kolelitiasis dan hindari makanan berlemak tinggi.');
      } else if (ud.vesicaFelleaStatus === 'Kolesistitis') {
        findings.push('Kolesistitis / Radang Kandung Empedu (USG Abdomen)');
        adviceList.push('Konsultasi ke Dokter Spesialis Bedah/Penyakit Dalam untuk evaluasi radang kandung empedu.');
      }

      if (ud.renStatus === 'Nefrolitiasis') {
        findings.push('Nefrolitiasis / Batu Ginjal (USG Abdomen)');
        adviceList.push('Tingkatkan asupan air putih minimal 2.5 - 3 liter per hari, kurangi konsumsi garam berlebih, dan konsultasikan ke dokter spesialis urologi.');
      } else if (ud.renStatus === 'Kista/Massa') {
        findings.push('Kista / Massa Ren (USG Abdomen)');
        adviceList.push('Konsultasi dokter spesialis urologi untuk evaluasi USG ginjal berkala.');
      }

      if (ud.pankreasLienStatus && ud.pankreasLienStatus !== 'Normal') {
        findings.push(`Kelainan Pankreas/Lien (${ud.pankreasLienStatus}) (USG Abdomen)`);
      }

      if (ud.vesicaUrinariaStatus && ud.vesicaUrinariaStatus !== 'Normal') {
        findings.push(`Kelainan Vesica Urinaria (${ud.vesicaUrinariaStatus}) (USG Abdomen)`);
      }

      if (ud.reproduksiStatus && ud.reproduksiStatus !== 'Normal') {
        findings.push(`Kelainan Organ Reproduksi (${ud.reproduksiStatus}: ${ud.reproduksiDesc || 'Abnormal'}) (USG Abdomen)`);
        adviceList.push('Konsultasi ke dokter spesialis urologi (untuk pria) atau spesialis obstetri ginekologi (untuk wanita).');
      }

      // Jika ada kesan custom yang belum tercover
      if (kesan && !kesan.toLowerCase().includes('dalam batas normal') && findings.filter(f => f.includes('USG')).length === 0) {
        findings.push(`USG Abdomen: ${kesan}`);
        adviceList.push('Evaluasi temuan sonografis abdomen bersama dokter spesialis terkait.');
      }
    }
  }

  // Deduplikasi saran
  const uniqueAdvices = Array.from(new Set(adviceList.filter(Boolean)));
  const isAllNormal = findings.length === 0;

  let medResume = '';
  let doctorAdvice = '';
  let fitnessCriteria = 'Fit to Work (Sehat Bekerja)';
  let medCategory = 'Normal / Sehat';

  if (isAllNormal) {
    medResume = 'Pemeriksaan fisik umum, tanda vital, dan seluruh hasil pemeriksaan penunjang (Laboratorium, Rontgen Thorax, EKG, Audiometri, Spirometri, USG Abdomen, dan Treadmill) dalam batas normal (Fit to Work).';
    doctorAdvice = 'Pertahankan gaya hidup sehat, pola makan gizi seimbang, cukupi istirahat, olahraga teratur minimal 150 menit/minggu, dan patuhi prosedur keselamatan kerja (K3) serta pemakaian APD di lingkungan kerja.';
    fitnessCriteria = 'Fit to Work (Sehat Bekerja)';
    medCategory = 'Normal / Sehat';
  } else {
    // Format temuan bermasalah dengan penomoran rapi
    medResume = findings.map((f, idx) => `${idx + 1}. ${f}`).join('\n');
    
    // Tambahkan saran umum K3 di akhir anjuran dokter
    const finalAdvices = [...uniqueAdvices];
    finalAdvices.push('Patuhi Standar Operasional Prosedur (SOP) Keselamatan dan Kesehatan Kerja (K3) serta gunakan APD sesuai risiko area kerja.');
    doctorAdvice = finalAdvices.map((a, idx) => `${idx + 1}. ${a}`).join('\n\n');
    
    // Kriteria kelayakan kerja okupasi
    const hasSevereFinding =
      sistole >= 160 ||
      diastole >= 100 ||
      findings.some(
        (f) =>
          f.toLowerCase().includes('positif iskemik') ||
          f.toLowerCase().includes('infiltrat') ||
          f.toLowerCase().includes('suspek kp') ||
          f.toLowerCase().includes('elevasi') ||
          f.toLowerCase().includes('aritmia') ||
          f.toLowerCase().includes('narkoba')
      );

    if (hasSevereFinding) {
      fitnessCriteria = 'Temporary Unfit (Tidak Laik Sementara)';
      medCategory = 'Perlu Tindakan / Pengobatan Khusus';
    } else {
      fitnessCriteria = 'Fit with Restriction (Fit dengan Catatan)';
      medCategory = 'Perlu Evaluasi Ringan / Monitoring';
    }
  }

  return {
    medResume,
    doctorAdvice,
    fitnessCriteria,
    medCategory,
    findings,
    advices: uniqueAdvices,
    hasPhysicalData,
    isAllNormal,
    summaryStats: {
      tensi: sistole > 0 ? `${sistole}/${diastole} mmHg` : undefined,
      bmi: bmiVal > 0 ? bmiVal : undefined,
      bmiCategory: bmiVal > 0 ? bmiCategory : undefined,
      bb: bb > 0 ? bb : undefined,
      tb: tb > 0 ? tb : undefined,
      findingsCount: findings.length,
    },
  };
};

/**
 * Menyimpan hasil kalkulasi otomatis resume medis ke localStorage dan memancarkan event pembaruan
 */
export const saveAutoGeneratedResume = (
  patientMcuNo: string,
  customAdvices?: MedicalAdviceMaster[],
  extraOverrides?: {
    koordinatorDoctor?: string;
    okupasiDoctor?: string;
  }
) => {
  const generated = calculateMedicalResume(patientMcuNo, customAdvices);
  const existingRaw = localStorage.getItem(`simreg_resume_${patientMcuNo}`);
  let existing: any = {};
  if (existingRaw) {
    try {
      existing = JSON.parse(existingRaw);
    } catch (e) {}
  }

  const payload = {
    ...existing,
    fitnessCriteria: generated.fitnessCriteria,
    medCategory: generated.medCategory,
    medResume: generated.medResume,
    doctorAdvice: generated.doctorAdvice,
    koordinatorDoctor: extraOverrides?.koordinatorDoctor || existing.koordinatorDoctor || 'dr. Hendra Kurniawan, Sp.Ok',
    okupasiDoctor: extraOverrides?.okupasiDoctor || existing.okupasiDoctor || 'dr. Hendra Kurniawan, Sp.Ok',
    isAutoSynced: true,
    updatedAt: new Date().toISOString(),
  };

  try {
    localStorage.setItem(`simreg_resume_${patientMcuNo}`, JSON.stringify(payload));
  } catch (e) {}

  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent('simreg_resume_updated', {
        detail: { mcuNo: patientMcuNo, generated, payload },
      })
    );
  }

  return payload;
};
