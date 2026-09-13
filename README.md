# SIMREG Medical Check Up (MCU) & Rekam Medis Okupasi

Sistem Informasi Manajemen Registrasi Medical Check Up (MCU), Rekam Medis Diagnostik, Cetak Label Stiker Thermal Barcode, dan Rekapitulasi Laporan Kesehatan Kerja berbasis Cloud.

---

## 🚀 Fitur Utama

1. **Dashboard Eksekutif MCU**:
   - Monitoring jumlah peserta terdaftar, kehadiran real-time, status sudah diperiksa vs belum diperiksa.
   - Grafik kehadiran per jam dan distribusi pemeriksaan per rekanan perusahaan.

2. **Registrasi & Manajemen Peserta**:
   - Registrasi mandiri perorangan dengan generator Nomor Rekam Medis (MR/MCU) otomatis.
   - Fitur **Impor Massal (Mass Import)** melalui file Excel (`.xlsx`) dan CSV dengan validasi format.
   - Cetak barcode stiker thermal kontinu & per tabung spesimen (EDTA, Serum, Urine, Rontgen, dll).
   - Pengambilan foto profil peserta via webcam kamera langsung.

3. **Rekam Medis Diagnostik Multi-Modalitas**:
   - Pemeriksaan Fisik & Tanda Vital (Tekanan Darah, Nadi, BMI, Visus, Buta Warna).
   - Laboratorium (Hematologi Lengkap, Urine Lengkap, Kimia Darah, Profil Lipid, Fungsi Hati, Fungsi Ginjal).
   - Radiologi (Thorax PA dengan integrasi viewer foto rontgen DICOM/JPG).
   - EKG 12-Lead, Audiometri (Grafik Audiogram interaktif), Spirometri, USG Abdomen, dan Treadmill Test.
   - Resume Medis & Kesimpulan Kelaikan Kerja (Fit to Work, Fit with Restriction, Unfit, Temporary Unfit).
   - Otomatisasi saran medis & rekomendasi dokter spesialis okupasi.

4. **Master Data & Pengaturan**:
   - Master Rekanan Perusahaan (Kode PT, Alamat, PIC, Tarif, Modalisasi).
   - Master Dokter Pemeriksa & Penanggung Jawab Medis (SIP & Tanda Tangan Digital).
   - Master Paket MCU (Kombinasi jenis pemeriksaan per paket).
   - Pengaturan Ukuran & Layout Label Thermal Stiker.
   - Pengaturan Hak Akses Login Per Pengguna.
   - Pembersihan dan reset data dami (One-click Purge).

5. **Laporan & Rekapitulasi**:
   - Rekapitulasi Kehadiran & Status Pemeriksaan harian/periode.
   - Ekspor data ke format Excel (`.xlsx`) dan PDF Booklet MCU siap cetak.

---

## 🛠️ Tech Stack

- **Framework**: React 19, TypeScript
- **Bundler & Dev Server**: Vite 6
- **Styling**: Tailwind CSS 4
- **Database & Cloud Sync**: Firebase Cloud Firestore
- **Icons**: Lucide React
- **PDF & Export**: jsPDF, html2canvas, XLSX

---

## 💻 Panduan Menjalankan Secara Lokal (Local Development)

### 1. Prasyarat
- Node.js versi 18 atau 20+
- Git

### 2. Instalasi
```bash
# Clone repositori
git clone <URL_REPOSITORI_ANDA>

# Masuk ke direktori
cd <NAMA_FOLDER>

# Install seluruh dependensi
npm install
```

### 3. Menjalankan Server Dev
```bash
npm run dev
```
Aplikasi akan aktif di `http://localhost:3000` (atau port yang ditentukan Vite).

---

## 📦 Build untuk Produksi

Untuk menghasilkan file statis siap deploy:
```bash
npm run build
```
File output akan dihasilkan di direktori `dist/`.

---

## 🌐 Panduan Deploy ke Netlify

Aplikasi ini telah dilengkapi dengan konfigurasi otomatis `netlify.toml` dan `public/_redirects` untuk penanganan routing Single Page Application (SPA).

### Cara 1: Menghubungkan Repositori GitHub ke Netlify (Paling Disarankan)
1. Buka [Netlify Dashboard](https://app.netlify.com/).
2. Klik tombol **"Add new site"** -> **"Import an existing project"**.
3. Pilih **GitHub** dan pilih repositori proyek ini.
4. Netlify akan mendeteksi file `netlify.toml` secara otomatis:
   - **Build command**: `npm run build`
   - **Publish directory**: `dist`
5. Klik **"Deploy site"**. Dalam 1-2 menit, website Anda sudah aktif secara online.

### Cara 2: Deploy Menggunakan Netlify CLI
```bash
# Install Netlify CLI (jika belum ada)
npm install -g netlify-cli

# Build proyek
npm run build

# Deploy ke Netlify
netlify deploy --prod --dir=dist
```

---

## 🔒 Konfigurasi Firebase Firestore

File konfigurasi koneksi Firebase berada di file `firebase-applet-config.json` pada root direktori:
- Data peserta dan hasil pemeriksaan tersimpan aman di **Google Cloud Firestore**.
- Jika Anda mengaktifkan fitur autentikasi Google Sign-In pada domain publik Netlify Anda, tambahkan domain Netlify Anda (contoh: `app-anda.netlify.app`) pada menu:
  **Firebase Console** -> **Authentication** -> **Settings** -> **Authorized domains**.

---

## 📄 Lisensi
Hak Cipta © SIMREG Medical Check Up. Seluruh hak cipta dilindungi undang-undang.
