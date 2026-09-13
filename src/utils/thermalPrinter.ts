import { AttendanceRecord, ClinicInfo, ThermalLabelConfig } from '../types';
import { generateCode128SvgString, generateQrCodeSvgString } from './barcode';

export interface LabelItemData {
  index: number;
  total: number;
  labelTitle: string; // e.g. "TABUNG DARAH EDTA"
  labelCode: string; // e.g. "EDTA"
  patient: AttendanceRecord;
  quantity?: number; // Specific number of copies for THIS label (e.g. Registrasi=2, RO=1)
  copyIndex?: number; // 1, 2, ...
  copyTotal?: number; // 2, ...
}

/**
 * Builds the HTML content for a single thermal label
 */
export function renderSingleLabelHtml(
  item: LabelItemData,
  clinic: ClinicInfo,
  config: ThermalLabelConfig
): string {
  const p = item.patient;
  const barcodeSvg =
    config.barcodeType === 'qr'
      ? generateQrCodeSvgString(p.mcuNo, Math.min(config.heightMm * 1.6, 52))
      : generateCode128SvgString(p.mcuNo, {
          height: config.heightMm <= 25 ? 18 : config.heightMm <= 30 ? 24 : 28,
          barWidth: config.widthMm <= 40 ? 1.1 : 1.4,
          includeText: true,
        });

  // Font family determination
  const fontFamilyCss =
    config.fontFamily === 'mono'
      ? `'Courier New', Courier, 'Lucida Console', Monaco, monospace`
      : config.fontFamily === 'condensed'
      ? `'Arial Narrow', 'Franklin Gothic Medium', 'Roboto Condensed', sans-serif`
      : config.fontFamily === 'serif'
      ? `Georgia, 'Times New Roman', Times, serif`
      : `-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif`;

  // Font weight
  const baseWeight =
    config.fontWeight === 'extra-bold' ? 900 : config.fontWeight === 'normal' ? 600 : 800;

  // Scale multiplier for fontSize
  const sizeMultiplier =
    config.fontSize === 'extra-compact'
      ? 0.8
      : config.fontSize === 'compact'
      ? 0.9
      : config.fontSize === 'large'
      ? 1.15
      : config.fontSize === 'extra-large'
      ? 1.3
      : 1.0; // normal

  const isSmall = config.heightMm <= 25 || config.widthMm <= 40;
  const isCompact = config.preset === '50x30' || config.preset === '40x30';

  const baseTitle = isSmall ? 7.5 : isCompact ? 8.5 : 9.5;
  const baseName = isSmall ? 10.5 : isCompact ? 12 : 13.5;
  const baseInfo = isSmall ? 7 : isCompact ? 8 : 9;
  const baseTag = isSmall ? 7.5 : isCompact ? 8.5 : 9.5;

  const titleFontSize = `${(baseTitle * sizeMultiplier).toFixed(1)}px`;
  const nameFontSize = `${(baseName * sizeMultiplier).toFixed(1)}px`;
  const infoFontSize = `${(baseInfo * sizeMultiplier).toFixed(1)}px`;
  const tagFontSize = `${(baseTag * sizeMultiplier).toFixed(1)}px`;

  // Data requested by user: nama, nik, no. mcu, kode paket, kode pt, dan nama label di bagian bawah
  const mcuNoText = p.mcuNo || '000';
  const namaText = p.nama || 'NAMA PESERTA';
  const nikText = p.nik || '-';
  const kodePaketText = p.kodePaket || p.paket || 'MCU';
  const kodePtText = p.kodePt || p.pt || 'PT -';
  const labelBottomText = (item.labelTitle || item.labelCode || 'REGISTRASI').toUpperCase();

  return `
    <div class="thermal-label-page" style="
      width: ${config.widthMm}mm;
      height: ${config.heightMm}mm;
      max-width: ${config.widthMm}mm;
      max-height: ${config.heightMm}mm;
      padding: 1.2mm 1.8mm;
      box-sizing: border-box;
      page-break-after: always;
      break-after: page;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      overflow: hidden;
      font-family: ${fontFamilyCss};
      color: #000;
      background: #fff;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    ">
      <!-- Top Row: Kode PT & Kode Paket (Nama Klinik Dibuang Sesuai Permintaan) -->
      <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 0.6pt solid #000; padding-bottom: 0.5mm; line-height: 1.1;">
        <!-- KODE PT -->
        <div style="font-size: ${titleFontSize}; font-weight: ${baseWeight}; text-transform: uppercase; letter-spacing: 0.1px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 60%;">
          ${kodePtText}
        </div>
        <!-- KODE PAKET & LEMBAR -->
        <div style="display: flex; align-items: center; gap: 3px; white-space: nowrap;">
          <span style="font-size: ${titleFontSize}; font-weight: 900; font-family: monospace; border: 1pt solid #000; padding: 0.5px 3px; border-radius: 2px;">
            ${kodePaketText}
          </span>
          ${
            item.copyTotal && item.copyTotal > 1
              ? `<span style="font-size: ${tagFontSize}; font-weight: 900; background: #000; color: #fff; padding: 0.5px 2px; border-radius: 2px;">Lbr ${item.copyIndex}/${item.copyTotal}</span>`
              : `<span style="font-size: ${tagFontSize}; font-weight: 800; font-family: monospace;">${item.index}/${item.total}</span>`
          }
        </div>
      </div>

      <!-- Main Body: Nama Karyawan, No. MCU, NIK -->
      <div style="margin: 0.5mm 0; line-height: 1.15;">
        <div style="display: flex; justify-content: space-between; align-items: baseline; gap: 4px;">
          <!-- NAMA -->
          <div style="font-size: ${nameFontSize}; font-weight: ${baseWeight}; text-transform: uppercase; letter-spacing: -0.1px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; flex: 1;">
            ${namaText}
          </div>
          <!-- NO. MCU -->
          <div style="font-size: ${nameFontSize}; font-weight: 900; font-family: monospace; color: #000; white-space: nowrap;">
            #${mcuNoText}
          </div>
        </div>

        <!-- NIK -->
        <div style="display: flex; justify-content: space-between; align-items: center; font-size: ${infoFontSize}; font-weight: 700; color: #000; margin-top: 0.3mm;">
          <span>NIK: <b>${nikText}</b></span>
          <span>${p.jk === 'Wanita' ? 'P' : 'L'} ${p.tglLahir ? `• ${p.tglLahir}` : ''}</span>
        </div>
      </div>

      <!-- Barcode / QR Area -->
      ${
        config.showBarcode
          ? `<div style="display: flex; justify-content: center; align-items: center; margin: 0.2mm 0; max-height: ${config.heightMm <= 25 ? '16px' : '24px'}; overflow: hidden;">
              ${barcodeSvg}
            </div>`
          : ''
      }

      <!-- Bottom Row: NAMA LABEL DI BAGIAN BAWAH (contoh: REGISTRASI, LAB HEMA, dsb.) -->
      <div style="border-top: 0.6pt solid #000; padding-top: 0.5mm; display: flex; justify-content: space-between; align-items: center; line-height: 1;">
        <div style="font-size: ${tagFontSize}; font-weight: 900; background: #000; color: #fff; padding: 1.5px 4px; border-radius: 2px; text-transform: uppercase; letter-spacing: 0.3px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 75%;">
          ▶ ${labelBottomText}
        </div>
        <div style="font-size: ${infoFontSize}; font-weight: 700; text-align: right; white-space: nowrap;">
          ${p.tglMcu || new Date().toISOString().split('T')[0]}
        </div>
      </div>
    </div>
  `;
}

/**
 * Builds the complete standalone HTML document for printing thermal labels
 */
export function buildThermalDocumentHtml(
  items: LabelItemData[],
  clinic: ClinicInfo,
  config: ThermalLabelConfig
): string {
  let labelsHtml = '';

  const safeItems = items && items.length > 0 ? items : [
    {
      index: 1,
      total: 1,
      labelTitle: 'UJI CETAK THERMAL',
      labelCode: 'TEST',
      patient: {
        no: 1,
        id: 1,
        mcuNo: '001',
        nik: '3271018900010002',
        nama: 'TEST PARTICIPANT THERMAL',
        pt: 'PT. SAMPLE PERUSAHAAN',
        dept: 'PRODUKSI',
        bagian: 'OPERATOR',
        jabatan: 'OPERATOR',
        tglLahir: '1992-05-15',
        jk: 'Pria',
        paket: 'STANDARD',
        kodePaket: 'STD',
        keteranganPaket: 'Uji Cetak Printer Thermal',
        tglMcu: new Date().toISOString().split('T')[0],
        jam: '08:00:00',
        tglInput: new Date().toISOString().split('T')[0],
        status: 'Hadir',
      },
      quantity: 1,
    } as LabelItemData
  ];

  safeItems.forEach((item) => {
    // Use per-label quantity if defined, otherwise fallback to copiesPerLabel
    const count =
      item.quantity && item.quantity > 0 ? item.quantity : Math.max(1, config.copiesPerLabel || 1);
    for (let c = 0; c < count; c++) {
      const itemWithCopy: LabelItemData = {
        ...item,
        copyIndex: c + 1,
        copyTotal: count,
      };
      labelsHtml += renderSingleLabelHtml(itemWithCopy, clinic, config);
    }
  });

  return `<!DOCTYPE html>
<html lang="id">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Cetak Label Thermal MCU - ${safeItems[0]?.patient?.mcuNo || 'Label'}</title>
    <style>
      @page {
        size: ${config.widthMm}mm ${config.heightMm}mm;
        margin: 0mm !important;
      }
      *, *:before, *:after {
        box-sizing: border-box;
        margin: 0;
        padding: 0;
      }
      html, body {
        margin: 0 !important;
        padding: 0 !important;
        background: #fff;
        color: #000;
        width: ${config.widthMm}mm;
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }
      .thermal-label-page {
        width: ${config.widthMm}mm !important;
        height: ${config.heightMm}mm !important;
        page-break-after: always !important;
        break-after: page !important;
        page-break-inside: avoid !important;
        break-inside: avoid !important;
        overflow: hidden !important;
        display: flex !important;
        flex-direction: column !important;
        justify-content: space-between !important;
        box-sizing: border-box !important;
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
      }
      @media screen {
        body {
          background: #0f172a;
          color: #f8fafc;
          padding: 24px 16px;
          display: flex;
          flex-direction: column;
          gap: 16px;
          align-items: center;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          min-height: 100vh;
        }
        .print-control-bar {
          position: sticky;
          top: 10px;
          z-index: 100;
          background: #0e7490;
          color: #ffffff;
          padding: 12px 20px;
          border-radius: 14px;
          display: flex;
          flex-wrap: wrap;
          gap: 12px;
          align-items: center;
          justify-content: space-between;
          max-width: 520px;
          width: 100%;
          box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.4);
          border: 1px solid rgba(255, 255, 255, 0.2);
        }
        .print-btn-primary {
          background: #ffffff;
          color: #0e7490;
          border: none;
          font-weight: 800;
          padding: 8px 18px;
          border-radius: 8px;
          cursor: pointer;
          font-size: 13px;
          display: inline-flex;
          align-items: center;
          gap: 6px;
          transition: transform 0.1s, background 0.15s;
        }
        .print-btn-primary:hover {
          background: #ecfeff;
          transform: translateY(-1px);
        }
        .print-btn-secondary {
          background: rgba(255, 255, 255, 0.15);
          color: #ffffff;
          border: 1px solid rgba(255, 255, 255, 0.3);
          font-weight: 600;
          padding: 8px 14px;
          border-radius: 8px;
          cursor: pointer;
          font-size: 12.5px;
        }
        .print-btn-secondary:hover {
          background: rgba(255, 255, 255, 0.25);
        }
        .thermal-label-page {
          border: 2px dashed #38bdf8;
          box-shadow: 0 8px 20px rgba(0, 0, 0, 0.35);
          border-radius: 4px;
          background: #ffffff !important;
        }
      }
      @media print {
        .no-print, .print-control-bar {
          display: none !important;
        }
      }
    </style>
  </head>
  <body>
    <div class="print-control-bar no-print">
      <div>
        <div style="font-weight: 800; font-size: 14px;">🖨️ Dialog Printer Thermal (${config.widthMm} x ${config.heightMm} mm)</div>
        <div style="font-size: 11.5px; opacity: 0.9;">Total ${safeItems.reduce((acc, curr) => acc + (curr.quantity || 1), 0)} lembar stiker siap dicetak</div>
      </div>
      <div style="display: flex; gap: 8px; align-items: center;">
        <button class="print-btn-primary" onclick="window.print()">
          <span>🖨️ Cetak Sekarang</span>
        </button>
        <button class="print-btn-secondary" onclick="window.close()">
          Tutup
        </button>
      </div>
    </div>
    ${labelsHtml}
    <script>
      // Auto-trigger browser print dialog with slight delay for font/barcode rendering
      window.addEventListener('load', function() {
        setTimeout(function() {
          try {
            window.focus();
            window.print();
          } catch (e) {
            console.warn('Auto print failed, click button manually', e);
          }
        }, 350);
      });
    </script>
  </body>
</html>`;
}

/**
 * Opens a dedicated standalone browser window/tab for thermal printing
 * (Bypasses iframe sandboxes, popups, and nested frame restrictions)
 */
export function openThermalPrintTab(
  items: LabelItemData[],
  clinic: ClinicInfo,
  config: ThermalLabelConfig
): boolean {
  try {
    const fullHtml = buildThermalDocumentHtml(items, clinic, config);
    const win = window.open('', '_blank', 'width=540,height=680,menubar=no,toolbar=no,location=no,status=no');
    if (win) {
      win.document.open();
      win.document.write(fullHtml);
      win.document.close();
      win.focus();
      return true;
    }
  } catch (err) {
    console.warn('Failed to open thermal print window:', err);
  }
  return false;
}

/**
 * Triggers printing to thermal printer.
 * Uses document-level @media print injection (the most robust browser standard),
 * with off-screen iframe and popup window fallbacks.
 */
export function executeThermalPrint(
  items: LabelItemData[],
  clinic: ClinicInfo,
  config: ThermalLabelConfig
): Promise<boolean> {
  return new Promise((resolve) => {
    const safeItems = items && items.length > 0 ? items : [
      {
        index: 1,
        total: 1,
        labelTitle: 'UJI CETAK THERMAL',
        labelCode: 'TEST',
        patient: {
          no: 1,
          id: 1,
          mcuNo: '001',
          nik: '3271018900010002',
          nama: 'TEST PARTICIPANT THERMAL',
          pt: 'PT. SAMPLE PERUSAHAAN',
          dept: 'PRODUKSI',
          bagian: 'OPERATOR',
          jabatan: 'OPERATOR',
          tglLahir: '1992-05-15',
          jk: 'Pria',
          paket: 'STANDARD',
          kodePaket: 'STD',
          keteranganPaket: 'Uji Cetak Printer Thermal',
          tglMcu: new Date().toISOString().split('T')[0],
          jam: '08:00:00',
          tglInput: new Date().toISOString().split('T')[0],
          status: 'Hadir',
        },
        quantity: 1,
      } as LabelItemData
    ];

    // Generate HTML for each label
    let labelsHtml = '';
    safeItems.forEach((item) => {
      const count =
        item.quantity && item.quantity > 0 ? item.quantity : Math.max(1, config.copiesPerLabel || 1);
      for (let c = 0; c < count; c++) {
        const itemWithCopy: LabelItemData = {
          ...item,
          copyIndex: c + 1,
          copyTotal: count,
        };
        labelsHtml += renderSingleLabelHtml(itemWithCopy, clinic, config);
      }
    });

    // Method 1: Inject document-level @media print styles & container
    // This is the cleanest, most reliable print approach in standard browsers
    const containerId = 'simreg-thermal-print-container';
    const styleId = 'simreg-thermal-print-styles';

    // Remove any previous print container/style
    document.getElementById(containerId)?.remove();
    document.getElementById(styleId)?.remove();

    const styleEl = document.createElement('style');
    styleEl.id = styleId;
    styleEl.textContent = `
      @media print {
        /* Hide everything on the page except the thermal container */
        body > *:not(#${containerId}) {
          display: none !important;
        }
        html, body {
          width: ${config.widthMm}mm !important;
          height: ${config.heightMm}mm !important;
          margin: 0 !important;
          padding: 0 !important;
          background: #fff !important;
          color: #000 !important;
          overflow: visible !important;
        }
        #${containerId} {
          display: block !important;
          position: absolute !important;
          left: 0 !important;
          top: 0 !important;
          width: ${config.widthMm}mm !important;
          margin: 0 !important;
          padding: 0 !important;
          background: #fff !important;
          z-index: 9999999 !important;
        }
        .thermal-label-page {
          width: ${config.widthMm}mm !important;
          height: ${config.heightMm}mm !important;
          page-break-after: always !important;
          break-after: page !important;
          page-break-inside: avoid !important;
          break-inside: avoid !important;
          overflow: hidden !important;
          display: flex !important;
          flex-direction: column !important;
          justify-content: space-between !important;
          box-sizing: border-box !important;
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
        }
        @page {
          size: ${config.widthMm}mm ${config.heightMm}mm;
          margin: 0mm !important;
        }
      }
      @media screen {
        #${containerId} {
          display: none !important;
        }
      }
    `;
    document.head.appendChild(styleEl);

    const containerEl = document.createElement('div');
    containerEl.id = containerId;
    containerEl.innerHTML = labelsHtml;
    document.body.appendChild(containerEl);

    let printSucceeded = false;

    const cleanup = () => {
      containerEl.remove();
      styleEl.remove();
    };

    window.addEventListener('afterprint', cleanup, { once: true });
    setTimeout(cleanup, 12000);

    // Give browser 50ms to ensure the SVG barcode and DOM are layout-ready
    setTimeout(() => {
      try {
        window.focus();
        window.print();
        printSucceeded = true;
        resolve(true);
      } catch (err) {
        console.warn('Direct window.print() failed, falling back to off-screen frame or window:', err);
        // Fallback: try dedicated tab
        openThermalPrintTab(safeItems, clinic, config);
        cleanup();
        resolve(false);
      }
    }, 60);
  });
}
