import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import { AttendanceRecord, ClinicInfo, Company } from '../types';

export interface ReportFilterOptions {
  companyName: string;
  department: string;
  startDate: string;
  endDate: string;
}

/**
 * Exports participants filtered by company, dept, and date to a formatted Excel file (.xlsx)
 */
export const exportCorporateMcuToExcel = (
  participants: AttendanceRecord[],
  clinic: ClinicInfo,
  options: ReportFilterOptions
) => {
  const filtered = participants.filter((p) => {
    const matchPt = options.companyName === 'SEMUA' || p.pt === options.companyName;
    const matchDept = options.department === 'SEMUA' || p.bagian === options.department || p.dept === options.department;
    return matchPt && matchDept;
  });

  const sheetData = filtered.map((p, idx) => ({
    'No': idx + 1,
    'No. MCU': p.mcuNo,
    'NIK / NRP': p.nik || '-',
    'Nama Peserta': p.nama,
    'Jenis Kelamin': p.jk === 'Pria' ? 'Laki-laki' : 'Perempuan',
    'Tanggal Lahir': p.tglLahir || '-',
    'Perusahaan': p.pt,
    'Departemen / Divisi': p.bagian || p.dept || '-',
    'Paket MCU': p.paket || 'Standar',
    'Tanggal MCU': p.tglMcu,
    'Kehadiran': p.status,
  }));

  const worksheet = XLSX.utils.json_to_sheet(sheetData);

  // Set column widths
  worksheet['!cols'] = [
    { wch: 5 },  // No
    { wch: 16 }, // No. MCU
    { wch: 14 }, // NIK
    { wch: 26 }, // Nama
    { wch: 14 }, // Gender
    { wch: 14 }, // Tgl Lahir
    { wch: 24 }, // Perusahaan
    { wch: 18 }, // Dept
    { wch: 16 }, // Paket
    { wch: 14 }, // Tgl MCU
    { wch: 18 }, // Status Fit
    { wch: 30 }, // Catatan
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Rekapitulasi MCU');

  const cleanPt = options.companyName.replace(/[^a-zA-Z0-9_-]/g, '_');
  const filename = `Rekapitulasi_MCU_${cleanPt}_${options.startDate || '2025'}.xlsx`;
  XLSX.writeFile(workbook, filename);
};

/**
 * Generates and downloads a corporate summary PDF report using jsPDF
 */
export const exportCorporateMcuToPdf = (
  participants: AttendanceRecord[],
  clinic: ClinicInfo,
  options: ReportFilterOptions
) => {
  const filtered = participants.filter((p) => {
    const matchPt = options.companyName === 'SEMUA' || p.pt === options.companyName;
    const matchDept = options.department === 'SEMUA' || p.bagian === options.department || p.dept === options.department;
    return matchPt && matchDept;
  });

  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = 297;
  const pageHeight = 210;
  const margin = 12;

  // Header Banner
  doc.setFillColor(14, 116, 144); // #0E7490
  doc.rect(margin, margin, pageWidth - margin * 2, 22, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text(clinic.nama.toUpperCase(), margin + 5, margin + 8);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(
    `${clinic.alamat} | Telp: ${clinic.telp} | Email: ${clinic.email || '-'}`,
    margin + 5,
    margin + 14
  );
  doc.text(`No. Izin Operasional Klinik: ${clinic.izinOperasional || '-'}`, margin + 5, margin + 19);

  // Document Title
  doc.setTextColor(15, 23, 42);
  doc.setFontSize(13);
  doc.setFont('helvetica', 'bold');
  doc.text('LAPORAN REKAPITULASI HASIL MEDICAL CHECK UP (MCU) KORPORASI', margin, margin + 30);

  // Subtitle / Filters
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  doc.text(
    `Perusahaan: ${options.companyName} | Departemen: ${options.department} | Periode: ${options.startDate} s/d ${options.endDate} | Total Peserta: ${filtered.length} Orang`,
    margin,
    margin + 36
  );

  // Table Headers Function
  const renderTableHeader = (yPos: number) => {
    doc.setFillColor(226, 232, 240); // Slate 200
    doc.rect(margin, yPos, pageWidth - margin * 2, 7.5, 'F');
    doc.setDrawColor(148, 163, 184); // Slate 400
    doc.rect(margin, yPos, pageWidth - margin * 2, 7.5, 'S');

    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);

    let curX = margin;
    colNames.forEach((name, i) => {
      doc.text(name, curX + 2, yPos + 5.2);
      if (i > 0) {
        doc.line(curX, yPos, curX, yPos + 7.5);
      }
      curX += colWidths[i];
    });
  };

  const tableY = margin + 42;
  const colWidths = [10, 32, 28, 50, 16, 30, 32, 28, 47];
  const colNames = [
    'No',
    'No. MCU',
    'NIK',
    'Nama Peserta',
    'L/P',
    'Departemen',
    'Paket MCU',
    'Status Kebugaran',
    'Rekomendasi / Catatan Medis',
  ];

  renderTableHeader(tableY);

  // Table Rows
  let curY = tableY + 7.5;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);

  filtered.forEach((p, idx) => {
    if (curY > pageHeight - 24) {
      doc.addPage('a4', 'landscape');
      renderTableHeader(margin + 10);
      curY = margin + 17.5;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
    }

    if (idx % 2 === 1) {
      doc.setFillColor(248, 250, 252);
      doc.rect(margin, curY, pageWidth - margin * 2, 6.8, 'F');
    }

    doc.setDrawColor(226, 232, 240);
    doc.line(margin, curY + 6.8, pageWidth - margin, curY + 6.8);

    doc.setTextColor(15, 23, 42);
    let x = margin;
    const rowValues = [
      String(idx + 1),
      p.mcuNo,
      p.nik || '-',
      p.nama.length > 26 ? p.nama.substring(0, 26) + '...' : p.nama,
      p.jk === 'Pria' ? 'L' : 'P',
      (p.bagian || p.dept || '-').substring(0, 18),
      (p.paket || 'Standar').substring(0, 18),
      p.status === 'Hadir' ? 'Selesai MCU' : 'Belum Hadir',
      p.keteranganMcu || '-',
    ];

    rowValues.forEach((val, i) => {
      doc.text(val, x + 2, curY + 4.8);
      x += colWidths[i];
    });

    curY += 6.8;
  });

  // Outer border around the table
  doc.setDrawColor(148, 163, 184);
  doc.rect(margin, tableY, pageWidth - margin * 2, curY - tableY, 'S');

  // Footer Signatures
  curY += 6;
  if (curY > pageHeight - 38) {
    doc.addPage('a4', 'landscape');
    curY = margin + 12;
  }

  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(30, 41, 59);
  const sigX = pageWidth - margin - 65;
  doc.text(`${clinic.kota || 'Jakarta'}, ${new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}`, sigX, curY);
  doc.text('Dokter Penanggung Jawab MCU,', sigX, curY + 4.5);
  doc.text(`(${clinic.dokterPJ || clinic.penanggungJawab || 'dr. Penanggung Jawab MCU'})`, sigX, curY + 20);
  doc.setFont('helvetica', 'normal');
  doc.text(`Klinik ${clinic.nama}`, sigX, curY + 24);

  // Add Page Numbers
  const totalPages = doc.getNumberOfPages();
  for (let pNum = 1; pNum <= totalPages; pNum++) {
    doc.setPage(pNum);
    doc.setFontSize(7.5);
    doc.setTextColor(100, 116, 139);
    doc.text(
      `Halaman ${pNum} dari ${totalPages} | SIM-MCU Clinical Reporting System`,
      margin,
      pageHeight - 6
    );
  }

  const cleanPt = options.companyName.replace(/[^a-zA-Z0-9_-]/g, '_');
  const filename = `Laporan_Rekapitulasi_MCU_${cleanPt}.pdf`;
  doc.save(filename);
};

