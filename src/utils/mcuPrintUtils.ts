import * as htmlToImage from 'html-to-image';
import jsPDF from 'jspdf';
import { AttendanceRecord, ClinicInfo } from '../types';

/**
 * Utility to generate crystal-clear, high-resolution A4 PDF for patient MCU booklet
 * using html-to-image (modern SVG foreignObject engine, fully compatible with Tailwind v4 OKLCH colors)
 * and jsPDF.
 */

export interface McuPdfProgressCallback {
  (percent: number, status: string): void;
}

/**
 * Directly downloads the MCU booklet as a formatted A4 PDF file.
 */
export async function downloadMcuBookletPdf(
  patient: AttendanceRecord,
  sheets: HTMLElement[],
  onProgress?: McuPdfProgressCallback
): Promise<boolean> {
  if (!sheets || sheets.length === 0) {
    throw new Error('Tidak ada lembar halaman MCU yang ditemukan.');
  }

  const cleanNama = (patient.nama || 'Peserta').replace(/[^a-zA-Z0-9_-]/g, '_');
  const docTitle = `Buku_MCU_${patient.mcuNo || '001'}_${cleanNama}`;

  onProgress?.(10, 'Menyiapkan berkas dokumen A4...');

  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
    compress: true,
  });

  const pageWidth = 210; // A4 standard width in mm
  const pageHeight = 297; // A4 standard height in mm

  for (let i = 0; i < sheets.length; i++) {
    const currentSheet = sheets[i];
    const pct = Math.round(15 + ((i + 1) / sheets.length) * 75);
    onProgress?.(pct, `Merender lembar ${i + 1} dari ${sheets.length}...`);

    // Use html-to-image with higher pixelRatio for crystal-clear text & vectors
    const imgData = await htmlToImage.toJpeg(currentSheet, {
      quality: 0.98,
      pixelRatio: 2.0,
      backgroundColor: '#ffffff',
      skipFonts: true, // Prevents CORS or external font issues
      filter: (node: Node) => {
        if (node instanceof HTMLElement) {
          if (node.classList.contains('print:hidden') || node.classList.contains('no-print')) {
            return false;
          }
        }
        return true;
      },
    });

    if (i > 0) {
      pdf.addPage('a4', 'portrait');
    }

    const sheetWidth = currentSheet.offsetWidth || 794;
    const sheetHeight = currentSheet.offsetHeight || 1123;
    const imgHeight = (sheetHeight * pageWidth) / sheetWidth;

    // Maintain consistent top header alignment across all pages (no jumping headers)
    if (imgHeight <= pageHeight) {
      // If height is close to standard A4 (within 20mm), stretch neatly to full A4 page height
      // so header is at top and footer stays pinned at bottom
      if (imgHeight >= pageHeight - 25) {
        pdf.addImage(imgData, 'JPEG', 0, 0, pageWidth, pageHeight, undefined, 'FAST');
      } else {
        // Keep top-aligned at Y=0 so header doesn't jump down on shorter sheets
        pdf.addImage(imgData, 'JPEG', 0, 0, pageWidth, imgHeight, undefined, 'FAST');
      }
    } else {
      const fitScale = pageHeight / imgHeight;
      const fitWidth = pageWidth * fitScale;
      const offsetX = Math.max(0, (pageWidth - fitWidth) / 2);
      pdf.addImage(imgData, 'JPEG', offsetX, 0, fitWidth, pageHeight, undefined, 'FAST');
    }
  }


  onProgress?.(95, 'Menyimpan berkas PDF...');
  pdf.save(`${docTitle}.pdf`);
  onProgress?.(100, 'Selesai!');

  return true;
}

/**
 * Opens a dedicated top-level printing window formatted for A4 portrait.
 * Completely immune to iframe sandbox restrictions and modal overlays.
 */
export function openMcuPrintWindow(
  patient: AttendanceRecord,
  clinic: ClinicInfo | undefined,
  htmlContent: string
): Window | null {
  const cleanNama = (patient.nama || 'Peserta').replace(/[^a-zA-Z0-9_-]/g, '_');
  const docTitle = `Buku_MCU_${patient.mcuNo || '001'}_${cleanNama}`;

  // Try to open a clean new top-level tab
  const printWin = window.open('', '_blank');
  if (!printWin) {
    return null;
  }

  // Extract all existing stylesheets and style tags
  const styles = Array.from(document.querySelectorAll('link[rel="stylesheet"], style'))
    .map((el) => el.outerHTML)
    .join('\n');

  const customPrintCss = `
    @page {
      size: A4 portrait;
      margin: 8mm 10mm;
    }
    *, *::before, *::after {
      box-sizing: border-box;
    }
    html, body {
      margin: 0 !important;
      padding: 0 !important;
      background: #ffffff !important;
      color: #000000 !important;
      font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    .print\\:hidden, .no-print {
      display: none !important;
    }
    .print-banner {
      display: block;
      background: #0f172a;
      color: #f8fafc;
      padding: 12px 20px;
      font-family: system-ui, sans-serif;
      border-bottom: 2px solid #38bdf8;
      text-align: center;
      font-size: 13px;
    }
    @media print {
      .print-banner {
        display: none !important;
      }
    }
    #print-wrapper {
      width: 100%;
      max-width: 210mm;
      margin: 0 auto;
      padding: 0;
      background: #ffffff;
    }
    .oza-page-sheet {
      page-break-after: always !important;
      break-after: page !important;
      page-break-inside: avoid !important;
      break-inside: avoid !important;
      width: 100% !important;
      max-width: 210mm !important;
      min-height: 275mm !important;
      height: auto !important;
      box-sizing: border-box !important;
      padding: 6mm 4mm !important;
      margin: 0 auto 20px auto !important;
      border: 1px solid #e2e8f0 !important;
      border-radius: 4px !important;
      background: #ffffff !important;
      box-shadow: none !important;
    }
    .oza-page-sheet:last-child {
      page-break-after: auto !important;
      break-after: auto !important;
      margin-bottom: 0 !important;
    }
    @media print {
      body {
        background: #ffffff !important;
      }
      .oza-page-sheet {
        border: none !important;
        padding: 2mm 0 !important;
        margin: 0 auto !important;
        box-shadow: none !important;
      }
    }
  `;

  printWin.document.open();
  printWin.document.write(`<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${docTitle}</title>
  ${styles}
  <style>${customPrintCss}</style>
</head>
<body>
  <div class="print-banner">
    <div style="font-weight: 800; font-size: 14px; margin-bottom: 4px;">
      🖨️ Pratinjau Siap Cetak Buku Hasil MCU (${clinic?.nama || 'Klinik Medika'})
    </div>
    <div style="font-size: 12px; color: #cbd5e1;">
      Peserta: <b>${patient.nama}</b> (${patient.mcuNo}) • Format Dokumen A4 Portrait.
    </div>
    <div style="margin-top: 8px;">
      <button onclick="window.print()" style="background: #38bdf8; color: #0f172a; border: none; padding: 6px 18px; font-weight: bold; border-radius: 6px; cursor: pointer; font-size: 12px; margin-right: 8px;">
        Cetak Sekarang / Simpan PDF
      </button>
      <button onclick="window.close()" style="background: #334155; color: #ffffff; border: none; padding: 6px 14px; border-radius: 6px; cursor: pointer; font-size: 12px;">
        Tutup Jendela
      </button>
    </div>
  </div>
  <div id="print-wrapper">
    ${htmlContent}
  </div>
  <script>
    // Automatically trigger print dialog once document resources are loaded
    window.addEventListener('load', function() {
      setTimeout(function() {
        window.focus();
        window.print();
      }, 500);
    });
  </script>
</body>
</html>`);
  printWin.document.close();

  return printWin;
}
