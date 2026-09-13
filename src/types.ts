export type Page = 'dashboard' | 'registrasi' | 'master' | 'medical' | 'laporan';

export type UserRole =
  | 'admin'
  | 'dokter_okupasi'
  | 'dokter_pemeriksa'
  | 'petugas_registrasi'
  | 'petugas_lab'
  | 'pic_perusahaan';

export interface UserSession {
  username: string;
  namaLengkap: string;
  role: UserRole;
  roleLabel: string;
  selectedPt: string; // 'ALL' or specific company name
  selectedPeriode: string; // 'ALL' or specific MCU period/date (if empty or 'ALL', all periods for that PT are opened)
  loginTime: string;
  hakAkses?: string[];
}

export interface UserAccount {
  id: string;
  username: string;
  password: string;
  namaLengkap: string;
  role: UserRole;
  roleLabel: string;
  status: 'Aktif' | 'Nonaktif';
  hakAkses: string[]; // e.g. ['dashboard', 'registrasi', 'master', 'medical', 'laporan']
  defaultPt?: string; // 'ALL' or specific company name
  keterangan?: string;
  lastLogin?: string;
  createdAt?: string;
}

export interface Company {
  id: number;
  kode: string;
  nama: string;
  alamat: string;
  telp: string;
  email: string;
  pic: string;
  picJabatan?: string;
  picTelp?: string;
}

export interface Doctor {
  id: number;
  kode: string;
  nama: string;
  spesialis: string;
  str: string;
  sip: string;
  telp: string;
  alamat: string;
}

export interface CompanyExaminerConfig {
  id: number;
  companyId?: number;
  companyName: string; // contoh: 'PT. PANARUB INDUSTRY', 'PT. A'
  koordinatorMcu: string; // Koordinator MCU : dokter A
  koordinatorMcuDocId?: number;
  koordinatorTtdUrl?: string; // Tanda tangan digital dokter koordinator MCU
  koordinatorStempelUrl?: string; // Stempel digital dokter koordinator MCU
  pemeriksaFisik: string; // pemeriksa fisik : dokter B
  pemeriksaFisikDocId?: number;
  dokterRadiologi: string; // dokter Radiologi : dokter C
  dokterRadiologiDocId?: number;
  dokterPatologiKlinik: string; // dokter Patologi Klinik: dokter D
  dokterPatologiKlinikDocId?: number;
  dokterSpesialisTht: string; // dokter spesialis tht: dokter E
  dokterSpesialisThtDocId?: number;
  dokterSpesialisParu: string; // dokter spesialis paru: dokter F
  dokterSpesialisParuDocId?: number;
  dokterSpesialisOkupasi: string; // dokter spesialis Okupasi: dokter G
  dokterSpesialisOkupasiDocId?: number;
  keterangan?: string;
  lokasiMcu?: string;
  tglTugas?: string;
}

export interface AttendanceRecord {
  id?: number;
  no: number;
  mcuNo: string;
  nama: string;
  jk: 'Pria' | 'Wanita';
  tglLahir: string;
  pt: string;
  kodePt?: string;
  wilayah?: string;
  dept: string;
  bagian?: string;
  jabatan?: string;
  nik?: string;
  noAskes?: string;
  alamat?: string;
  alamatPeserta?: string;
  telp?: string;
  paket: string;
  kodePaket?: string;
  keteranganPaket?: string;
  pemeriksaanTambahan?: string;
  keteranganMcu?: string;
  tidakPuasa?: boolean;
  sudahMcu?: boolean;
  tglMcu: string;
  tglInput?: string;
  status: 'Hadir' | 'Belum Hadir';
  jam: string;
  photoUrl?: string;
  usia?: string;
}

export interface ClinicInfo {
  nama: string;
  legalitas: string;
  alamat: string;
  kota: string;
  provinsi: string;
  kodePos: string;
  telp: string;
  telepon?: string;
  email: string;
  web: string;
  website?: string;
  penanggungJawab: string;
  izinOperasional: string;
  dokterPJ: string;
  logoUrl?: string;
  tagline?: string;
}

export interface PackageLabelItem {
  id: string;
  nama: string;
  kode: string;
  keterangan?: string;
  defaultQty?: number;
  sourceExam?: string;
}

export interface MCUPackage {
  id: number;
  kode: string;
  nama: string;
  perusahaan: string;
  exams: string[];
  pemeriksaan?: string[];
  keterangan?: string;
  labelCount: number;
  labels: PackageLabelItem[];
}

export type ThermalPreset =
  | '50x30'
  | '40x30'
  | '40x20'
  | '60x40'
  | '70x35'
  | '80x50'
  | 'custom';

export type ThermalFontFamily = 'sans' | 'mono' | 'condensed' | 'serif';
export type ThermalFontSize = 'extra-compact' | 'compact' | 'normal' | 'large' | 'extra-large';
export type ThermalFontWeight = 'normal' | 'bold' | 'extra-bold';

export interface ThermalLabelConfig {
  widthMm: number;
  heightMm: number;
  preset: ThermalPreset;
  showClinicHeader: boolean;
  showPt: boolean;
  showDept: boolean;
  showDob: boolean;
  showPackage: boolean;
  showBarcode: boolean;
  barcodeType: 'barcode' | 'qr';
  fontFamily?: ThermalFontFamily;
  fontSize: ThermalFontSize;
  fontWeight?: ThermalFontWeight;
  copiesPerLabel: number;
  // Minimal mandatory elements requested:
  showNik?: boolean;
  showMcuNo?: boolean;
  showName?: boolean;
}

export type PhysicalParamCategory =
  | 'Tanda Vital'
  | 'Antropometri'
  | 'Mata & Penglihatan'
  | 'Kepala & Leher'
  | 'THT'
  | 'Gigi & Mulut'
  | 'Thorax & Jantung'
  | 'Paru-paru'
  | 'Abdomen'
  | 'Ekstremitas & Kulit'
  | 'Neurologis & Refleks';

export interface PhysicalExamParam {
  id: string;
  kode: string;
  nama: string;
  kategori: PhysicalParamCategory;
  tipeInput: 'number' | 'text' | 'select' | 'checkbox';
  nilaiNormal: string;
  satuan?: string;
  pilihanOpsi?: string[];
  keterangan?: string;
  paketCodes?: string[];
  isActive: boolean;
}

export type LabParamCategory =
  | 'Hematologi'
  | 'Kimia Darah'
  | 'Urinalisis'
  | 'Skrining Narkoba'
  | 'Imunologi & Serologi'
  | 'Feses Lengkap';

export interface LabExamParam {
  id: string;
  kode: string;
  nama: string;
  kategori: LabParamCategory;
  subKategori?: string;
  nilaiRujukanPria: string;
  nilaiRujukanWanita: string;
  satuan: string;
  metodeTes?: string;
  keterangan?: string;
  paketCodes?: string[];
  isActive: boolean;
}

export type AdviceCategory =
  | 'Kardiovaskular & Hipertensi'
  | 'Profil Lipid & Kolesterol'
  | 'Diabetes & Metabolik'
  | 'Asam Urat & Ginjal'
  | 'Visus & Mata'
  | 'Audiometri & Kebisingan'
  | 'Spirometri & Fungsi Paru'
  | 'Ergonomi & Muskuloskeletal'
  | 'Gaya Hidup & Pola Makan'
  | 'K3 & APD Lapangan';

export interface MedicalAdviceMaster {
  id: string;
  kode: string;
  kategori: AdviceCategory;
  judulMasalah: string;
  saranMedis: string;
  tindakanLanjutan: string;
  tingkatUrgensi: 'Rutin' | 'Perhatian' | 'Rujukan Segera';
  isActive: boolean;
}

export interface MCUTemplateMaster {
  id: string;
  kode: string;
  namaTemplate: string;
  kategoriPekerjaan: string;
  daftarPemeriksaan: string[];
  syaratPuasa: string;
  kesimpulanDefault: string;
  saranDefault: string;
  keterangan?: string;
  isActive: boolean;
}

export type DiagnosticModality = 'rontgen' | 'ekg' | 'audio' | 'spiro' | 'penunjang';

export interface DiagnosticExamParam {
  id: string;
  kode: string;
  nama: string;
  modalitas: DiagnosticModality;
  kategori: string;
  tipeInput: 'number' | 'text' | 'select' | 'checkbox';
  nilaiNormal: string;
  satuan?: string;
  pilihanOpsi?: string[];
  keterangan?: string;
  paketCodes?: string[];
  isActive: boolean;
}

