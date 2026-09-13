import React, { useState, useMemo } from 'react';

export interface AudiogramDataRecord {
  kananAC?: Record<string, number | undefined>;
  kananBC?: Record<string, number | undefined>;
  kiriAC?: Record<string, number | undefined>;
  kiriBC?: Record<string, number | undefined>;
}

export interface AudiogramVisualChartProps {
  data?: AudiogramDataRecord;
  diagKanan?: string;
  diagKiri?: string;
  kesimpulan?: string;
  patientInfo?: {
    nama?: string;
    mcuNo?: string;
    pt?: string;
    tglMcu?: string;
  };
  showHeaderBanner?: boolean;
  interactive?: boolean;
  compact?: boolean;
}

// 8 Frekuensi Standar persis sesuai lampiran dokumen:
// 250, 500, 1.000, 2.000, 3.000, 4.000, 6.000, 8.000 Hz
export const AUDIOGRAM_DISPLAY_FREQS = [
  { key: '250', label: '250' },
  { key: '500', label: '500' },
  { key: '1000', label: '1.000' },
  { key: '2000', label: '2.000' },
  { key: '3000', label: '3.000' },
  { key: '4000', label: '4.000' },
  { key: '6000', label: '6.000' },
  { key: '8000', label: '8.000' },
] as const;

// Range Intensitas dB HL persis sesuai lampiran: -10 s/d 140 dB
export const AUDIOGRAM_DB_TICKS = [
  -10, 0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100, 110, 120, 130, 140,
] as const;

/**
 * Mengambil nilai ambang pendengaran (dB HL) secara presisi dari input tabel dokter.
 * Jika frekuensi oktaf/inter-oktaf tertentu tidak diisi secara manual, dilakukan
 * interpolasi cerdas terhadap data yang diinputkan agar grafik tetap kontinu dan realistis.
 */
function getFrequencyValue(
  channelData: Record<string, number | undefined> | undefined,
  freqKey: string,
  baselineFallback: number
): number {
  if (!channelData) return baselineFallback;

  const raw = channelData[freqKey];
  // 1. Jika pengguna telah mengisi nilai (termasuk 0 atau nilai negatif), gunakan langsung
  if (raw !== undefined && raw !== null && raw !== ('' as any) && !isNaN(Number(raw))) {
    return Number(raw);
  }

  // 2. Interpolasi cerdas dari frekuensi terdekat yang sudah diinputkan oleh dokter
  if (freqKey === '250') {
    const f500 = channelData['500'];
    if (f500 !== undefined && f500 !== null && f500 !== ('' as any) && !isNaN(Number(f500))) {
      return Number(f500);
    }
  } else if (freqKey === '3000') {
    const f2000 = channelData['2000'];
    const f4000 = channelData['4000'];
    const n2000 = f2000 !== undefined && f2000 !== null && f2000 !== ('' as any) && !isNaN(Number(f2000)) ? Number(f2000) : null;
    const n4000 = f4000 !== undefined && f4000 !== null && f4000 !== ('' as any) && !isNaN(Number(f4000)) ? Number(f4000) : null;
    if (n2000 !== null && n4000 !== null) return Math.round((n2000 + n4000) / 2);
    if (n2000 !== null) return n2000;
    if (n4000 !== null) return n4000;
  } else if (freqKey === '6000') {
    const f4000 = channelData['4000'];
    const f8000 = channelData['8000'];
    const n4000 = f4000 !== undefined && f4000 !== null && f4000 !== ('' as any) && !isNaN(Number(f4000)) ? Number(f4000) : null;
    const n8000 = f8000 !== undefined && f8000 !== null && f8000 !== ('' as any) && !isNaN(Number(f8000)) ? Number(f8000) : null;
    if (n4000 !== null && n8000 !== null) return Math.round((n4000 + n8000) / 2);
    if (n4000 !== null) return n4000;
    if (n8000 !== null) return n8000;
  } else if (freqKey === '8000') {
    const f6000 = channelData['6000'];
    const f4000 = channelData['4000'];
    if (f6000 !== undefined && f6000 !== null && f6000 !== ('' as any) && !isNaN(Number(f6000))) return Number(f6000);
    if (f4000 !== undefined && f4000 !== null && f4000 !== ('' as any) && !isNaN(Number(f4000))) return Number(f4000);
  }

  // 3. Jika ada nilai lain yang diinputkan dalam channel ini, gunakan rata-ratanya agar kurva konsisten
  const validVals = Object.values(channelData)
    .filter((v) => v !== undefined && v !== null && v !== ('' as any) && !isNaN(Number(v)))
    .map(Number);

  if (validVals.length > 0) {
    const avg = validVals.reduce((a, b) => a + b, 0) / validVals.length;
    return Math.round(avg);
  }

  return baselineFallback;
}

function evaluateHearingDiagnosis(
  acPoints: number[],
  bcPoints: number[]
): string {
  // acPoints urutan: 250 (idx 0), 500 (idx 1), 1000 (idx 2), 2000 (idx 3), 3000 (idx 4), 4000 (idx 5), 6000 (idx 6), 8000 (idx 7)
  const whoAC = (acPoints[1] + acPoints[2] + acPoints[3] + acPoints[5]) / 4;
  const whoBC = (bcPoints[1] + bcPoints[2] + bcPoints[3] + bcPoints[5]) / 4;
  const abg = Math.round((whoAC - whoBC) * 10) / 10;

  // Cek nada tinggi (4000 Hz, 6000 Hz) khas bising okupasi
  const highDrop = Math.max(acPoints[4] || 0, acPoints[5] || 0, acPoints[6] || 0);

  if (whoAC <= 25 && whoBC <= 25) {
    if (highDrop > 30) {
      return 'Tuli Sensorineural Frekuensi Tinggi (Suspek NIHL)';
    }
    return 'Pendengaran dalam batas normal';
  }

  let derajat = 'Derajat Ringan';
  if (whoAC > 90) derajat = 'Derajat Sangat Berat';
  else if (whoAC > 70) derajat = 'Derajat Berat';
  else if (whoAC > 55) derajat = 'Derajat Sedang-Berat';
  else if (whoAC > 40) derajat = 'Derajat Sedang';

  if (whoBC <= 25 && abg > 10) {
    return `Tuli Konduktif ${derajat}`;
  } else if (whoBC > 25 && abg <= 10) {
    return `Tuli Sensorineural ${derajat}`;
  } else if (whoBC > 25 && abg > 10) {
    return `Tuli Campuran ${derajat}`;
  }

  return abg > 10 ? `Tuli Konduktif ${derajat}` : `Tuli Sensorineural ${derajat}`;
}

function formatDiagText(diag?: string): string {
  if (!diag || diag.trim() === '') return '';
  const lower = diag.toLowerCase().trim();
  if (lower.includes('normal') && !lower.includes('tuli')) {
    return 'Pendengaran dalam batas normal';
  }
  return diag;
}

export const AudiogramVisualChart: React.FC<AudiogramVisualChartProps> = ({
  data,
  diagKanan,
  diagKiri,
  kesimpulan,
  showHeaderBanner = true,
  interactive = true,
}) => {
  const [hoveredPoint, setHoveredPoint] = useState<{
    ear: 'kanan' | 'kiri';
    type: 'AC' | 'BC';
    freq: string;
    db: number;
    x: number;
    y: number;
  } | null>(null);

  // Baseline normal hearing (AC: 15-20 dB, BC: 10-15 dB) jika belum ada input sama sekali
  const baselineKananAC = 20;
  const baselineKananBC = 15;
  const baselineKiriAC = 15;
  const baselineKiriBC = 10;

  // Kumpulkan array 8 data titik untuk Kanan & Kiri secara dinamis dari data input tabel
  const kananACPoints = AUDIOGRAM_DISPLAY_FREQS.map((f) =>
    getFrequencyValue(data?.kananAC, f.key, baselineKananAC)
  );
  const kananBCPoints = AUDIOGRAM_DISPLAY_FREQS.map((f) =>
    getFrequencyValue(data?.kananBC, f.key, baselineKananBC)
  );

  const kiriACPoints = AUDIOGRAM_DISPLAY_FREQS.map((f) =>
    getFrequencyValue(data?.kiriAC, f.key, baselineKiriAC)
  );
  const kiriBCPoints = AUDIOGRAM_DISPLAY_FREQS.map((f) =>
    getFrequencyValue(data?.kiriBC, f.key, baselineKiriBC)
  );

  // Perhitungan Rata-rata 8 Frekuensi persis sesuai tabel pada gambar (misal 20.00 dan 15.00)
  const avgKananAC =
    kananACPoints.reduce((acc, v) => acc + v, 0) / kananACPoints.length;
  const avgKananBC =
    kananBCPoints.reduce((acc, v) => acc + v, 0) / kananBCPoints.length;

  const avgKiriAC =
    kiriACPoints.reduce((acc, v) => acc + v, 0) / kiriACPoints.length;
  const avgKiriBC =
    kiriBCPoints.reduce((acc, v) => acc + v, 0) / kiriBCPoints.length;

  const finalDiagKanan = useMemo(() => {
    const formatted = formatDiagText(diagKanan);
    if (formatted) return formatted;
    return evaluateHearingDiagnosis(kananACPoints, kananBCPoints);
  }, [diagKanan, kananACPoints, kananBCPoints]);

  const finalDiagKiri = useMemo(() => {
    const formatted = formatDiagText(diagKiri);
    if (formatted) return formatted;
    return evaluateHearingDiagnosis(kiriACPoints, kiriBCPoints);
  }, [diagKiri, kiriACPoints, kiriBCPoints]);

  // Dimensi SVG
  const svgWidth = 330;
  const svgHeight = 350;
  const marginLeft = 38;
  const marginRight = 16;
  const marginTop = 26;
  const marginBottom = 18;

  const plotWidth = svgWidth - marginLeft - marginRight; // 276
  const plotHeight = svgHeight - marginTop - marginBottom; // 306

  // Konversi frekuensi index (0..7) ke X koordinat
  const getX = (index: number) => {
    return marginLeft + (index / (AUDIOGRAM_DISPLAY_FREQS.length - 1)) * plotWidth;
  };

  // Konversi dB (-10 .. 140) ke Y koordinat (skala terbalik: -10 di atas, 140 di bawah)
  const getY = (db: number) => {
    const clamped = Math.max(-10, Math.min(140, db));
    const ratio = (clamped - -10) / (140 - -10); // 150 dB total range
    return marginTop + ratio * plotHeight;
  };

  // Format angka rata-rata dengan 2 desimal
  const formatAvg = (val: number) => val.toFixed(2);

  return (
    <div className="w-full font-sans text-slate-800 select-none">
      {/* 1. HEADER BANNER KOTAK ABU-ABU PERSIS SEPERTI GAMBAR CONTOH */}
      {showHeaderBanner && (
        <div className="mb-3 text-center">
          <div className="border border-slate-700 bg-slate-200/95 py-1 px-3 text-[12px] font-bold text-slate-900 tracking-wider uppercase shadow-2xs">
            HASIL PEMERIKSAAN AUDIOMETRI
          </div>
          <div className="border-x border-b border-slate-700 bg-slate-100/95 py-0.5 px-3 text-[10px] font-semibold text-slate-700 tracking-wide uppercase">
            KETERANGAN
          </div>
        </div>
      )}

      {/* 2. DUA GRAFIK BERDAMPINGAN: TELINGA KANAN & TELINGA KIRI */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4 print:grid-cols-2">
        {/* ============================================================== */}
        {/* PANEL TELINGA KANAN (MERAH)                                     */}
        {/* ============================================================== */}
        <div className="flex flex-col border border-slate-700 bg-white p-1.5 shadow-xs">
          {/* Header Bar Telinga Kanan */}
          <div className="bg-slate-200 border border-slate-400 py-1 text-center font-bold text-[11px] text-slate-800 uppercase tracking-wide mb-1 flex items-center justify-center gap-2">
            <span>TELINGA KANAN</span>
            <span className="text-[9.5px] text-red-700 font-mono">(AC: ● / BC: ✚)</span>
          </div>

          {/* SVG Grafik Telinga Kanan */}
          <div className="relative w-full overflow-hidden bg-white">
            <svg
              viewBox={`0 0 ${svgWidth} ${svgHeight}`}
              className="w-full h-auto block"
              style={{ maxHeight: '350px' }}
            >
              {/* Area Normal (0 - 25 dB HL) - Modern Shading Lembut */}
              <rect
                x={marginLeft}
                y={getY(0)}
                width={plotWidth}
                height={getY(25) - getY(0)}
                fill="#f1f5f9"
                opacity="0.75"
              />

              {/* Garis Batas Ambang Normal 25 dB (Dashed) */}
              <line
                x1={marginLeft}
                y1={getY(25)}
                x2={marginLeft + plotWidth}
                y2={getY(25)}
                stroke="#94a3b8"
                strokeWidth={0.8}
                strokeDasharray="3 2"
              />

              {/* Garis Kisi Horizontal (dB Ticks) */}
              {AUDIOGRAM_DB_TICKS.map((db) => {
                const y = getY(db);
                const isZero = db === 0;
                return (
                  <g key={`kanan-grid-y-${db}`}>
                    <line
                      x1={marginLeft}
                      y1={y}
                      x2={marginLeft + plotWidth}
                      y2={y}
                      stroke={isZero ? '#0f172a' : '#cbd5e1'}
                      strokeWidth={isZero ? 1.5 : 0.75}
                    />
                    {/* Label Sumbu Y (dB HL) */}
                    <text
                      x={marginLeft - 5}
                      y={y + 3.5}
                      textAnchor="end"
                      fontSize="9"
                      fontFamily="Arial, sans-serif"
                      fill="#334155"
                      fontWeight={isZero ? 'bold' : 'normal'}
                    >
                      {db}
                    </text>
                  </g>
                );
              })}

              {/* Garis Kisi Vertikal (Frekuensi) */}
              {AUDIOGRAM_DISPLAY_FREQS.map((freq, idx) => {
                const x = getX(idx);
                const isInterOctave = freq.key === '3000' || freq.key === '6000';
                return (
                  <g key={`kanan-grid-x-${freq.key}`}>
                    <line
                      x1={x}
                      y1={marginTop}
                      x2={x}
                      y2={marginTop + plotHeight}
                      stroke="#cbd5e1"
                      strokeWidth={0.75}
                      strokeDasharray={isInterOctave ? '3 2' : undefined}
                    />
                    {/* Label Frekuensi di Atas Sumbu */}
                    <text
                      x={x}
                      y={marginTop - 8}
                      textAnchor="middle"
                      fontSize="9"
                      fontFamily="Arial, sans-serif"
                      fontWeight="bold"
                      fill="#1e293b"
                    >
                      {freq.label}
                    </text>
                  </g>
                );
              })}

              {/* Bingkai Luar Kotak Plot */}
              <rect
                x={marginLeft}
                y={marginTop}
                width={plotWidth}
                height={plotHeight}
                fill="none"
                stroke="#334155"
                strokeWidth={1.2}
              />

              {/* 1. Garis Penghubung BC Kanan (Merah Putus-putus) */}
              <polyline
                fill="none"
                stroke="#dc2626"
                strokeWidth={1.75}
                strokeDasharray="4 3"
                strokeLinecap="round"
                strokeLinejoin="round"
                points={kananBCPoints
                  .map((val, idx) => `${getX(idx)},${getY(val)}`)
                  .join(' ')}
              />

              {/* 2. Garis Penghubung AC Kanan (Merah Solid) */}
              <polyline
                fill="none"
                stroke="#dc2626"
                strokeWidth={2.2}
                strokeLinecap="round"
                strokeLinejoin="round"
                points={kananACPoints
                  .map((val, idx) => `${getX(idx)},${getY(val)}`)
                  .join(' ')}
              />

              {/* 3. Simbol Titik BC Kanan: Cross / Palang Merah ✚ (Bone Conduction) */}
              {kananBCPoints.map((val, idx) => {
                const cx = getX(idx);
                const cy = getY(val);
                const arm = 4.5;
                return (
                  <g
                    key={`kanan-bc-${idx}`}
                    className="cursor-pointer"
                    onMouseEnter={() =>
                      interactive &&
                      setHoveredPoint({
                        ear: 'kanan',
                        type: 'BC',
                        freq: AUDIOGRAM_DISPLAY_FREQS[idx].label,
                        db: val,
                        x: cx,
                        y: cy,
                      })
                    }
                    onMouseLeave={() => interactive && setHoveredPoint(null)}
                  >
                    <circle cx={cx} cy={cy} r={8} fill="transparent" />
                    <line
                      x1={cx - arm}
                      y1={cy}
                      x2={cx + arm}
                      y2={cy}
                      stroke="#991b1b"
                      strokeWidth={2.5}
                      strokeLinecap="round"
                    />
                    <line
                      x1={cx}
                      y1={cy - arm}
                      x2={cx}
                      y2={cy + arm}
                      stroke="#991b1b"
                      strokeWidth={2.5}
                      strokeLinecap="round"
                    />
                  </g>
                );
              })}

              {/* 4. Simbol Titik AC Kanan: Lingkaran Merah Solid ● (Air Conduction) */}
              {kananACPoints.map((val, idx) => {
                const cx = getX(idx);
                const cy = getY(val);
                return (
                  <g
                    key={`kanan-ac-${idx}`}
                    className="cursor-pointer"
                    onMouseEnter={() =>
                      interactive &&
                      setHoveredPoint({
                        ear: 'kanan',
                        type: 'AC',
                        freq: AUDIOGRAM_DISPLAY_FREQS[idx].label,
                        db: val,
                        x: cx,
                        y: cy,
                      })
                    }
                    onMouseLeave={() => interactive && setHoveredPoint(null)}
                  >
                    <circle cx={cx} cy={cy} r={8} fill="transparent" />
                    <circle
                      cx={cx}
                      cy={cy}
                      r={4.5}
                      fill="#dc2626"
                      stroke="#991b1b"
                      strokeWidth={1.5}
                    />
                  </g>
                );
              })}
            </svg>
          </div>

          {/* TABEL DATA TELINGA KANAN PERSIS SEPERTI GAMBAR */}
          <div className="mt-1 overflow-x-auto">
            <table className="w-full border-collapse border border-slate-700 text-[9px] text-center font-mono">
              <thead>
                <tr className="bg-slate-100 text-slate-900 font-bold">
                  <th className="border border-slate-600 px-1 py-1 text-left font-sans text-[8.5px]">
                    FREKUENSI
                  </th>
                  {AUDIOGRAM_DISPLAY_FREQS.map((f) => (
                    <th key={`kanan-th-${f.key}`} className="border border-slate-600 px-0.5 py-1">
                      {f.key}
                    </th>
                  ))}
                  <th className="border border-slate-600 px-1 py-1 bg-slate-200 text-[8.5px]">
                    Rata2
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr className="bg-white">
                  <td className="border border-slate-600 px-1 py-0.5 text-left font-sans font-bold text-red-700 bg-red-50/40">
                    AC - Kanan
                  </td>
                  {kananACPoints.map((val, idx) => (
                    <td key={`kanan-td-ac-${idx}`} className="border border-slate-600 px-0.5 py-0.5 font-bold">
                      {val}
                    </td>
                  ))}
                  <td className="border border-slate-600 px-1 py-0.5 font-black bg-red-50 text-red-900">
                    {formatAvg(avgKananAC)}
                  </td>
                </tr>
                <tr className="bg-slate-50/60">
                  <td className="border border-slate-600 px-1 py-0.5 text-left font-sans font-bold text-slate-700">
                    BC - Kanan
                  </td>
                  {kananBCPoints.map((val, idx) => (
                    <td key={`kanan-td-bc-${idx}`} className="border border-slate-600 px-0.5 py-0.5 text-slate-700 font-semibold">
                      {val}
                    </td>
                  ))}
                  <td className="border border-slate-600 px-1 py-0.5 font-black bg-slate-200 text-slate-800">
                    {formatAvg(avgKananBC)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* ============================================================== */}
        {/* PANEL TELINGA KIRI (BIRU)                                       */}
        {/* ============================================================== */}
        <div className="flex flex-col border border-slate-700 bg-white p-1.5 shadow-xs">
          {/* Header Bar Telinga Kiri */}
          <div className="bg-slate-200 border border-slate-400 py-1 text-center font-bold text-[11px] text-slate-800 uppercase tracking-wide mb-1 flex items-center justify-center gap-2">
            <span>TELINGA KIRI</span>
            <span className="text-[9.5px] text-blue-700 font-mono">(AC: ◆ / BC: ▲)</span>
          </div>

          {/* SVG Grafik Telinga Kiri */}
          <div className="relative w-full overflow-hidden bg-white">
            <svg
              viewBox={`0 0 ${svgWidth} ${svgHeight}`}
              className="w-full h-auto block"
              style={{ maxHeight: '350px' }}
            >
              {/* Area Normal (0 - 25 dB HL) */}
              <rect
                x={marginLeft}
                y={getY(0)}
                width={plotWidth}
                height={getY(25) - getY(0)}
                fill="#f1f5f9"
                opacity="0.75"
              />

              {/* Garis Batas Ambang Normal 25 dB (Dashed) */}
              <line
                x1={marginLeft}
                y1={getY(25)}
                x2={marginLeft + plotWidth}
                y2={getY(25)}
                stroke="#94a3b8"
                strokeWidth={0.8}
                strokeDasharray="3 2"
              />

              {/* Garis Kisi Horizontal (dB Ticks) */}
              {AUDIOGRAM_DB_TICKS.map((db) => {
                const y = getY(db);
                const isZero = db === 0;
                return (
                  <g key={`kiri-grid-y-${db}`}>
                    <line
                      x1={marginLeft}
                      y1={y}
                      x2={marginLeft + plotWidth}
                      y2={y}
                      stroke={isZero ? '#0f172a' : '#cbd5e1'}
                      strokeWidth={isZero ? 1.5 : 0.75}
                    />
                    {/* Label Sumbu Y (dB HL) */}
                    <text
                      x={marginLeft - 5}
                      y={y + 3.5}
                      textAnchor="end"
                      fontSize="9"
                      fontFamily="Arial, sans-serif"
                      fill="#334155"
                      fontWeight={isZero ? 'bold' : 'normal'}
                    >
                      {db}
                    </text>
                  </g>
                );
              })}

              {/* Garis Kisi Vertikal (Frekuensi) */}
              {AUDIOGRAM_DISPLAY_FREQS.map((freq, idx) => {
                const x = getX(idx);
                const isInterOctave = freq.key === '3000' || freq.key === '6000';
                return (
                  <g key={`kiri-grid-x-${freq.key}`}>
                    <line
                      x1={x}
                      y1={marginTop}
                      x2={x}
                      y2={marginTop + plotHeight}
                      stroke="#cbd5e1"
                      strokeWidth={0.75}
                      strokeDasharray={isInterOctave ? '3 2' : undefined}
                    />
                    {/* Label Frekuensi di Atas Sumbu */}
                    <text
                      x={x}
                      y={marginTop - 8}
                      textAnchor="middle"
                      fontSize="9"
                      fontFamily="Arial, sans-serif"
                      fontWeight="bold"
                      fill="#1e293b"
                    >
                      {freq.label}
                    </text>
                  </g>
                );
              })}

              {/* Bingkai Luar Kotak Plot */}
              <rect
                x={marginLeft}
                y={marginTop}
                width={plotWidth}
                height={plotHeight}
                fill="none"
                stroke="#334155"
                strokeWidth={1.2}
              />

              {/* 1. Garis Penghubung BC Kiri (Biru Putus-putus) */}
              <polyline
                fill="none"
                stroke="#2563eb"
                strokeWidth={1.75}
                strokeDasharray="4 3"
                strokeLinecap="round"
                strokeLinejoin="round"
                points={kiriBCPoints
                  .map((val, idx) => `${getX(idx)},${getY(val)}`)
                  .join(' ')}
              />

              {/* 2. Garis Penghubung AC Kiri (Biru Solid) */}
              <polyline
                fill="none"
                stroke="#2563eb"
                strokeWidth={2.2}
                strokeLinecap="round"
                strokeLinejoin="round"
                points={kiriACPoints
                  .map((val, idx) => `${getX(idx)},${getY(val)}`)
                  .join(' ')}
              />

              {/* 3. Simbol Titik BC Kiri: Segitiga Biru Solid ▲ (Bone Conduction) */}
              {kiriBCPoints.map((val, idx) => {
                const cx = getX(idx);
                const cy = getY(val);
                const size = 5;
                const points = `${cx},${cy - size} ${cx + size},${cy + size * 0.85} ${cx - size},${cy + size * 0.85}`;
                return (
                  <g
                    key={`kiri-bc-${idx}`}
                    className="cursor-pointer"
                    onMouseEnter={() =>
                      interactive &&
                      setHoveredPoint({
                        ear: 'kiri',
                        type: 'BC',
                        freq: AUDIOGRAM_DISPLAY_FREQS[idx].label,
                        db: val,
                        x: cx,
                        y: cy,
                      })
                    }
                    onMouseLeave={() => interactive && setHoveredPoint(null)}
                  >
                    <circle cx={cx} cy={cy} r={8} fill="transparent" />
                    <polygon
                      points={points}
                      fill="#1d4ed8"
                      stroke="#1e3a8a"
                      strokeWidth={1.2}
                    />
                  </g>
                );
              })}

              {/* 4. Simbol Titik AC Kiri: Wajik Biru Solid ◆ (Air Conduction) */}
              {kiriACPoints.map((val, idx) => {
                const cx = getX(idx);
                const cy = getY(val);
                const d = 5.2;
                const diamondPoints = `${cx},${cy - d} ${cx + d},${cy} ${cx},${cy + d} ${cx - d},${cy}`;
                return (
                  <g
                    key={`kiri-ac-${idx}`}
                    className="cursor-pointer"
                    onMouseEnter={() =>
                      interactive &&
                      setHoveredPoint({
                        ear: 'kiri',
                        type: 'AC',
                        freq: AUDIOGRAM_DISPLAY_FREQS[idx].label,
                        db: val,
                        x: cx,
                        y: cy,
                      })
                    }
                    onMouseLeave={() => interactive && setHoveredPoint(null)}
                  >
                    <circle cx={cx} cy={cy} r={8} fill="transparent" />
                    <polygon
                      points={diamondPoints}
                      fill="#2563eb"
                      stroke="#1d4ed8"
                      strokeWidth={1.5}
                    />
                  </g>
                );
              })}
            </svg>
          </div>

          {/* TABEL DATA TELINGA KIRI PERSIS SEPERTI GAMBAR */}
          <div className="mt-1 overflow-x-auto">
            <table className="w-full border-collapse border border-slate-700 text-[9px] text-center font-mono">
              <thead>
                <tr className="bg-slate-100 text-slate-900 font-bold">
                  <th className="border border-slate-600 px-1 py-1 text-left font-sans text-[8.5px]">
                    FREKUENSI
                  </th>
                  {AUDIOGRAM_DISPLAY_FREQS.map((f) => (
                    <th key={`kiri-th-${f.key}`} className="border border-slate-600 px-0.5 py-1">
                      {f.key}
                    </th>
                  ))}
                  <th className="border border-slate-600 px-1 py-1 bg-slate-200 text-[8.5px]">
                    Rata2
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr className="bg-white">
                  <td className="border border-slate-600 px-1 py-0.5 text-left font-sans font-bold text-blue-700 bg-blue-50/40">
                    AC - Kiri
                  </td>
                  {kiriACPoints.map((val, idx) => (
                    <td key={`kiri-td-ac-${idx}`} className="border border-slate-600 px-0.5 py-0.5 font-bold">
                      {val}
                    </td>
                  ))}
                  <td className="border border-slate-600 px-1 py-0.5 font-black bg-blue-50 text-blue-900">
                    {formatAvg(avgKiriAC)}
                  </td>
                </tr>
                <tr className="bg-slate-50/60">
                  <td className="border border-slate-600 px-1 py-0.5 text-left font-sans font-bold text-slate-700">
                    BC - Kiri
                  </td>
                  {kiriBCPoints.map((val, idx) => (
                    <td key={`kiri-td-bc-${idx}`} className="border border-slate-600 px-0.5 py-0.5 text-slate-700 font-semibold">
                      {val}
                    </td>
                  ))}
                  <td className="border border-slate-600 px-1 py-0.5 font-black bg-slate-200 text-slate-800">
                    {formatAvg(avgKiriBC)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* 3. BAGIAN BAWAH: KESIMPULAN (KIRI) DAN TABEL LEGENDA SIMBOL (KANAN) */}
      <div className="mt-3 grid grid-cols-1 md:grid-cols-12 gap-3 items-start print:grid-cols-12">
        {/* KESIMPULAN PERSIS SEPERTI GAMBAR CONTOH */}
        <div className="md:col-span-8 print:col-span-8 space-y-1 text-[11px] leading-relaxed">
          <div className="font-bold text-slate-900 italic underline">
            Kesimpulan :
          </div>
          <div className="space-y-0.5 pl-2">
            <div className="flex items-start gap-2">
              <span className="font-bold w-24 text-slate-900 shrink-0">Telinga Kanan</span>
              <span>:</span>
              <span className="text-slate-800 font-semibold">
                ~ {finalDiagKanan}
              </span>
            </div>
            <div className="flex items-start gap-2">
              <span className="font-bold w-24 text-slate-900 shrink-0">Telinga Kiri</span>
              <span>:</span>
              <span className="text-slate-800 font-semibold">
                ~ {finalDiagKiri}
              </span>
            </div>
            {kesimpulan && (
              <div className="text-[10px] text-slate-600 italic mt-1 pt-1 border-t border-slate-200">
                Catatan Tambahan: {kesimpulan}
              </div>
            )}
          </div>
        </div>

        {/* TABEL LEGENDA SIMBOL AUDIOGRAM PERSIS SEPERTI GAMBAR CONTOH */}
        <div className="md:col-span-4 print:col-span-4 flex flex-col items-end">
          <table className="border-collapse border border-slate-700 text-[9.5px] text-center w-full max-w-[190px]">
            <thead>
              <tr className="bg-slate-100 font-bold text-slate-800">
                <th className="border border-slate-600 px-1.5 py-0.5"></th>
                <th className="border border-slate-600 px-1.5 py-0.5 text-red-700 font-extrabold">
                  Kanan<br />(Merah)
                </th>
                <th className="border border-slate-600 px-1.5 py-0.5 text-blue-700 font-extrabold">
                  Kiri<br />(Biru)
                </th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="border border-slate-600 px-1.5 py-0.5 font-bold bg-slate-50">
                  AC
                </td>
                <td className="border border-slate-600 px-1.5 py-0.5 text-red-600 font-bold text-[14px] leading-none">
                  ●
                </td>
                <td className="border border-slate-600 px-1.5 py-0.5 text-blue-600 font-bold text-[14px] leading-none">
                  ◆
                </td>
              </tr>
              <tr>
                <td className="border border-slate-600 px-1.5 py-0.5 font-bold bg-slate-50">
                  BC
                </td>
                <td className="border border-slate-600 px-1.5 py-0.5 text-red-600 font-black text-[14px] leading-none">
                  ✚
                </td>
                <td className="border border-slate-600 px-1.5 py-0.5 text-blue-600 font-black text-[13px] leading-none">
                  ▲
                </td>
              </tr>
            </tbody>
          </table>
          <div className="text-[8.5px] text-slate-600 mt-1 font-mono text-right leading-tight max-w-[190px]">
            AC = Air Conduction<br />
            BC = Bone Conduction
          </div>
        </div>
      </div>

      {/* Floating Tooltip jika interaktif */}
      {interactive && hoveredPoint && (
        <div className="fixed z-50 pointer-events-none px-2 py-1 bg-slate-900/90 text-white rounded text-[10px] font-mono shadow-md backdrop-blur-xs">
          Telinga {hoveredPoint.ear === 'kanan' ? 'Kanan' : 'Kiri'} ({hoveredPoint.type}) • {hoveredPoint.freq} Hz: <b>{hoveredPoint.db} dB HL</b>
        </div>
      )}
    </div>
  );
};
