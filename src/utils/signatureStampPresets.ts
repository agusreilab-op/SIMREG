/**
 * Preset and generator utilities for Digital Signatures (TTD) & Digital Rubber Stamps (Stempel)
 * specifically for Dokter Koordinator MCU & Klinik Penyelenggara.
 */

export interface StampOptions {
  clinicName?: string;
  doctorName?: string;
  roleTitle?: string;
  legalitas?: string;
  color?: string; // hex code, e.g. '#1E3A8A'
}

/**
 * Generate a high-resolution, transparent circular digital stamp SVG data URL
 */
export function generateDoctorStampSvg(options: StampOptions = {}): string {
  const clinic = (options.clinicName || 'KLINIK PENYELENGGARA MCU').toUpperCase();
  const doctor = (options.doctorName || 'KOORDINATOR MCU').toUpperCase();
  const role = (options.roleTitle || 'PENANGGUNG JAWAB K3').toUpperCase();
  const legalitas = (options.legalitas || 'PELAYANAN KESEHATAN KERJA').toUpperCase();
  const color = options.color || '#0E7490'; // Default medical cyan/blue

  const svgString = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="200" height="200">
    <defs>
      <!-- Circular text paths -->
      <path id="stampTopPath" d="M 28 100 A 72 72 0 0 1 172 100" fill="none"/>
      <path id="stampBottomPath" d="M 172 100 A 72 72 0 0 1 28 100" fill="none"/>
    </defs>
    
    <!-- Outer dashed border ring -->
    <circle cx="100" cy="100" r="94" fill="none" stroke="${color}" stroke-width="2.8" stroke-dasharray="8 4" stroke-opacity="0.9" />
    
    <!-- Inner solid border ring -->
    <circle cx="100" cy="100" r="86" fill="${color}" fill-opacity="0.04" stroke="${color}" stroke-width="2" stroke-opacity="0.95" />
    
    <!-- Innermost border ring -->
    <circle cx="100" cy="100" r="58" fill="none" stroke="${color}" stroke-width="1.5" stroke-opacity="0.8" />
    
    <!-- Top curved text -->
    <text fill="${color}" font-size="10" font-weight="900" font-family="'Arial', sans-serif" letter-spacing="1.2">
      <textPath href="#stampTopPath" startOffset="50%" text-anchor="middle">★ ${clinic.slice(0, 32)} ★</textPath>
    </text>
    
    <!-- Bottom curved text -->
    <text fill="${color}" font-size="8.5" font-weight="800" font-family="'Arial', sans-serif" letter-spacing="1.5">
      <textPath href="#stampBottomPath" startOffset="50%" text-anchor="middle">${legalitas.slice(0, 35)}</textPath>
    </text>
    
    <!-- Center Dividers -->
    <line x1="42" y1="84" x2="158" y2="84" stroke="${color}" stroke-width="1.8" stroke-opacity="0.85" />
    <line x1="42" y1="116" x2="158" y2="116" stroke="${color}" stroke-width="1.8" stroke-opacity="0.85" />
    
    <!-- Center Text: Doctor Name / Role -->
    <text x="100" y="99" fill="${color}" font-size="11" font-weight="900" font-family="'Arial', sans-serif" text-anchor="middle" letter-spacing="0.5">
      ${doctor.length > 20 ? doctor.slice(0, 18) + '..' : doctor}
    </text>
    <text x="100" y="111" fill="${color}" font-size="7.5" font-weight="800" font-family="'Arial', sans-serif" text-anchor="middle" letter-spacing="1">
      ${role}
    </text>
  </svg>`;

  return `data:image/svg+xml;utf8,${encodeURIComponent(svgString)}`;
}

/**
 * Generate a realistic doctor signature SVG data URL with customized ink color & style
 */
export function generateDoctorSignatureSvg(
  doctorName: string = 'dr. Koordinator',
  styleIndex: number = 0,
  color: string = '#1E3A8A'
): string {
  // 3 distinct realistic doctor handwriting script styles
  const pathVariants = [
    // Style 0: Smooth cursive loop with flourish underline
    `M 25 55 C 35 25, 45 15, 65 25 C 80 32, 55 68, 48 72 C 40 76, 75 35, 100 40 C 115 42, 90 70, 125 52 C 145 42, 165 35, 175 48 M 35 48 L 95 44 M 105 46 L 155 42 M 20 78 C 65 72, 110 74, 180 68`,
    // Style 1: Dynamic sharp medical stroke with double loop
    `M 20 62 C 30 18, 45 10, 58 35 C 65 52, 50 75, 42 70 C 35 65, 80 20, 110 28 C 130 35, 85 75, 130 55 C 150 45, 170 38, 185 45 M 28 50 Q 80 40, 135 46 M 25 82 Q 95 72, 178 76`,
    // Style 2: Elegant rhythmic signature
    `M 25 45 C 40 15, 55 18, 52 50 C 50 68, 38 78, 60 72 C 85 65, 95 32, 118 36 C 135 40, 100 75, 140 58 C 160 50, 175 42, 185 52 M 45 58 C 75 52, 105 54, 150 48 M 20 75 L 180 72`,
  ];

  const selectedPath = pathVariants[styleIndex % pathVariants.length];

  const svgString = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 90" width="200" height="90">
    <path d="${selectedPath}" stroke="${color}" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" fill="none" />
  </svg>`;

  return `data:image/svg+xml;utf8,${encodeURIComponent(svgString)}`;
}

/**
 * Standard Presets for Quick Selection
 */
export const SIGNATURE_PRESETS = [
  {
    id: 'sig_style_1',
    nama: 'Gaya Medis Cursive 1 (Biru Tua)',
    color: '#1E3A8A',
    styleIndex: 0,
  },
  {
    id: 'sig_style_2',
    nama: 'Gaya Sp.Ok Profesional (Navy)',
    color: '#172554',
    styleIndex: 1,
  },
  {
    id: 'sig_style_3',
    nama: 'Gaya TTD Cepat Ringkas (Hitam)',
    color: '#0F172A',
    styleIndex: 2,
  },
];

export const STAMP_PRESETS = [
  {
    id: 'stamp_cyan',
    nama: 'Cap Tosca Medis (Standar Faskes)',
    color: '#0E7490',
  },
  {
    id: 'stamp_blue',
    nama: 'Cap Biru Tua Dokumen Resmi',
    color: '#1E3A8A',
  },
  {
    id: 'stamp_purple',
    nama: 'Cap Ungu Basah Tradisional',
    color: '#6B21A8',
  },
  {
    id: 'stamp_red',
    nama: 'Cap Merah Pengesahan K3',
    color: '#991B1B',
  },
];
