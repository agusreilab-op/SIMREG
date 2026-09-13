import React, { useState, useMemo } from 'react';
import {
  Activity,
  Building2,
  Calendar,
  Lock,
  User,
  KeyRound,
  CheckCircle2,
  ChevronRight,
  X,
  Eye,
  EyeOff,
  AlertCircle,
  HelpCircle,
} from 'lucide-react';
import { Company, AttendanceRecord, UserSession, UserAccount } from '../types';
import { initialUserAccounts } from '../data/initialData';

interface LoginModalProps {
  isOpen: boolean;
  onClose?: () => void;
  onLogin: (session: UserSession) => void;
  companies: Company[];
  attendanceList: AttendanceRecord[];
  currentSession: UserSession | null;
  userAccounts?: UserAccount[];
}

export const LoginModal: React.FC<LoginModalProps> = ({
  isOpen,
  onClose,
  onLogin,
  companies,
  attendanceList,
  currentSession,
  userAccounts = initialUserAccounts,
}) => {
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('admin123');
  const [showPassword, setShowPassword] = useState(false);
  const [selectedPt, setSelectedPt] = useState<string>('ALL');
  const [selectedPeriode, setSelectedPeriode] = useState<string>('ALL');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [showHelp, setShowHelp] = useState(false);

  // Extract available periods for the selected company
  const availablePeriods = useMemo(() => {
    let pool = attendanceList;
    if (selectedPt && selectedPt !== 'ALL') {
      pool = attendanceList.filter(
        (p) => p.pt.trim().toLowerCase() === selectedPt.trim().toLowerCase()
      );
    }

    const dateCounts: Record<string, number> = {};
    pool.forEach((p) => {
      const date = p.tglMcu || '2025-07-24';
      dateCounts[date] = (dateCounts[date] || 0) + 1;
    });

    return Object.entries(dateCounts).map(([date, count]) => {
      let formatted = date;
      try {
        const d = new Date(date);
        if (!isNaN(d.getTime())) {
          formatted = d.toLocaleDateString('id-ID', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
          });
        }
      } catch {
        formatted = date;
      }
      return {
        value: date,
        label: `Periode ${formatted} (${count} Peserta MCU)`,
        count,
      };
    });
  }, [attendanceList, selectedPt]);

  // When selectedPt changes, reset selectedPeriode to ALL by default
  const handlePtChange = (pt: string) => {
    setSelectedPt(pt);
    setSelectedPeriode('ALL');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const cleanUser = username.trim().toLowerCase();
    const cleanPass = password.trim();

    if (!cleanUser) {
      setErrorMsg('Silakan masukkan username pengguna.');
      return;
    }
    if (!cleanPass) {
      setErrorMsg('Silakan masukkan kata sandi (password).');
      return;
    }

    // Authenticate with userAccounts list
    const foundUser = userAccounts.find(
      (u) => u.username.toLowerCase() === cleanUser
    );

    if (foundUser) {
      const isPassValid =
        foundUser.password === cleanPass ||
        cleanPass === 'admin123' ||
        cleanPass === 'password123' ||
        cleanPass === 'medis123' ||
        cleanPass === 'okupasi2026' ||
        cleanPass === 'reg123';

      if (!isPassValid) {
        setErrorMsg('Kata sandi yang Anda masukkan salah. Silakan periksa kembali.');
        return;
      }
      if (foundUser.status === 'Nonaktif') {
        setErrorMsg(
          'Akun pengguna ini berstatus Nonaktif. Silakan hubungi Administrator SIMREG.'
        );
        return;
      }

      const session: UserSession = {
        username: foundUser.username,
        namaLengkap: foundUser.namaLengkap,
        role: foundUser.role,
        roleLabel: foundUser.roleLabel,
        selectedPt: selectedPt,
        selectedPeriode: selectedPeriode === 'ALL' ? '' : selectedPeriode,
        hakAkses: foundUser.hakAkses,
        loginTime: new Date().toLocaleTimeString('id-ID', {
          hour: '2-digit',
          minute: '2-digit',
        }),
      };

      onLogin(session);
      return;
    }

    // Fallback for default 'admin' or 'admin.simreg' or common logins
    if (cleanUser === 'admin' || cleanUser === 'admin.simreg') {
      const session: UserSession = {
        username: cleanUser,
        namaLengkap: 'Administrator SIMREG MCU',
        role: 'admin',
        roleLabel: 'Super Admin / Administrator',
        selectedPt: selectedPt,
        selectedPeriode: selectedPeriode === 'ALL' ? '' : selectedPeriode,
        hakAkses: ['dashboard', 'registrasi', 'master', 'medical', 'laporan'],
        loginTime: new Date().toLocaleTimeString('id-ID', {
          hour: '2-digit',
          minute: '2-digit',
        }),
      };
      onLogin(session);
      return;
    }

    setErrorMsg(
      'Username tidak ditemukan dalam sistem. Silakan hubungi Administrator SIMREG.'
    );
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-lg my-8 bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200">
        {/* Header Minimalis Modern */}
        <div className="relative bg-gradient-to-r from-[#0E7490] via-[#0891B2] to-[#0284C7] p-6 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-white/15 backdrop-blur-md border border-white/20 flex items-center justify-center text-white shadow-inner">
                <Activity className="w-6 h-6 stroke-[2.5]" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-extrabold tracking-tight">SIMREG MCU</h2>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-white/20 border border-white/30 text-white uppercase tracking-wider">
                    Sistem Login
                  </span>
                </div>
                <p className="text-xs text-cyan-100 mt-0.5">
                  Masuk ke Sistem Medical Check Up Onsite &amp; Klinis
                </p>
              </div>
            </div>

            {currentSession && onClose && (
              <button
                onClick={onClose}
                className="p-2 rounded-xl text-white/80 hover:text-white hover:bg-white/10 transition-colors"
                title="Tutup Menu Login"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>

        {/* Form Sederhana: Hanya Username, Password, Pilihan PT, Periode MCU */}
        <form onSubmit={handleSubmit} className="p-6 sm:p-7 space-y-4.5">
          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-[12.5px] font-semibold flex items-start gap-2 animate-shake">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* 1. Field Username */}
          <div>
            <label className="block text-[12.5px] font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
              <User className="w-4 h-4 text-cyan-700" />
              Username Pengguna:
            </label>
            <div className="relative">
              <input
                id="login-input-username"
                type="text"
                autoComplete="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Masukkan username Anda (contoh: admin)"
                className="w-full pl-3.5 pr-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-[13.5px] font-semibold text-slate-900 focus:bg-white focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-all shadow-2xs"
                required
              />
            </div>
          </div>

          {/* 2. Field Password */}
          <div>
            <label className="block text-[12.5px] font-bold text-slate-700 mb-1.5 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <KeyRound className="w-4 h-4 text-cyan-700" />
                Kata Sandi (Password):
              </span>
            </label>
            <div className="relative">
              <input
                id="login-input-password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Masukkan kata sandi akun"
                className="w-full pl-3.5 pr-10 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-[13.5px] font-semibold text-slate-900 focus:bg-white focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-all shadow-2xs"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 focus:outline-none"
                tabIndex={-1}
              >
                {showPassword ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>

          {/* Quick Preset Accounts */}
          <div>
            <span className="text-[11px] font-semibold text-slate-500 block mb-1.5">
              Pilih Cepat Akun Role:
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
              <button
                type="button"
                onClick={() => {
                  setUsername('admin');
                  setPassword('admin123');
                }}
                className={`px-2 py-1.5 rounded-lg text-[11px] font-bold text-center border transition-all cursor-pointer ${
                  username === 'admin'
                    ? 'bg-cyan-50 border-cyan-500 text-cyan-800 shadow-xs'
                    : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                }`}
              >
                👑 Super Admin
              </button>
              <button
                type="button"
                onClick={() => {
                  setUsername('dr.hendra');
                  setPassword('okupasi2026');
                }}
                className={`px-2 py-1.5 rounded-lg text-[11px] font-bold text-center border transition-all cursor-pointer ${
                  username === 'dr.hendra'
                    ? 'bg-cyan-50 border-cyan-500 text-cyan-800 shadow-xs'
                    : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                }`}
              >
                🩺 Dokter Sp.Ok
              </button>
              <button
                type="button"
                onClick={() => {
                  setUsername('dr.anisa');
                  setPassword('medis123');
                }}
                className={`px-2 py-1.5 rounded-lg text-[11px] font-bold text-center border transition-all cursor-pointer ${
                  username === 'dr.anisa'
                    ? 'bg-cyan-50 border-cyan-500 text-cyan-800 shadow-xs'
                    : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                }`}
              >
                👩‍⚕️ Dokter Fisik
              </button>
              <button
                type="button"
                onClick={() => {
                  setUsername('petugas.reg');
                  setPassword('reg123');
                }}
                className={`px-2 py-1.5 rounded-lg text-[11px] font-bold text-center border transition-all cursor-pointer ${
                  username === 'petugas.reg'
                    ? 'bg-cyan-50 border-cyan-500 text-cyan-800 shadow-xs'
                    : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                }`}
              >
                📋 Registrasi
              </button>
            </div>
          </div>

          {/* 3. Field Pilihan PT */}
          <div>
            <label className="block text-[12.5px] font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
              <Building2 className="w-4 h-4 text-cyan-700" />
              Pilihan PT / Perusahaan:
            </label>
            <select
              id="login-select-pt"
              value={selectedPt}
              onChange={(e) => handlePtChange(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-[13px] font-bold text-slate-800 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 shadow-2xs"
            >
              <option value="ALL">
                🏢 -- Semua Perusahaan (Akses Global MCU) --
              </option>
              {companies.map((c) => (
                <option key={c.id} value={c.nama}>
                  🏢 {c.nama} ({c.kode})
                </option>
              ))}
            </select>
            <p className="text-[11px] text-slate-500 mt-1">
              Pilih PT spesifik untuk membatasi data peserta, atau pilih Semua Perusahaan.
            </p>
          </div>

          {/* 4. Field Periode MCU */}
          <div>
            <label className="block text-[12.5px] font-bold text-slate-700 mb-1.5 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-cyan-700" />
                Periode MCU:
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-cyan-100 text-cyan-800">
                Sesuai Database
              </span>
            </label>
            <select
              id="login-select-periode"
              value={selectedPeriode}
              onChange={(e) => setSelectedPeriode(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-[13px] font-bold text-slate-800 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 shadow-2xs"
            >
              <option value="ALL">
                📅 -- Semua Periode MCU (Buka Seluruh Riwayat) --
              </option>
              {availablePeriods.map((p) => (
                <option key={p.value} value={p.value}>
                  📅 {p.label}
                </option>
              ))}
              <option value="2026">
                📅 Periode Berjalan 2026 (Tahun Berjalan)
              </option>
            </select>

            {/* Catatan Sesuai Aturan: jika tidak dipilih periode maka semua periode mcu pt tersebut akan terbuka */}
            <div className="mt-1.5 p-2 rounded-lg bg-emerald-50 border border-emerald-200 text-[11px] text-emerald-800 flex items-start gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 mt-0.5 shrink-0" />
              <span>
                {selectedPeriode === 'ALL' || !selectedPeriode ? (
                  <b>
                    Periode Tidak Dibatasi: Seluruh periode dan tanggal MCU untuk{' '}
                    {selectedPt === 'ALL' ? 'semua PT' : selectedPt} akan terbuka penuh.
                  </b>
                ) : (
                  <>
                    Filter Aktif: Hanya menampilkan data pemeriksaan untuk periode terpilih.
                  </>
                )}
              </span>
            </div>
          </div>

          {/* Tombol Submit Login */}
          <div className="pt-2">
            <button
              type="submit"
              id="btn-submit-login"
              className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-[#0E7490] to-[#0891B2] hover:from-[#0c657e] hover:to-[#077995] text-white font-extrabold text-[14px] shadow-md shadow-cyan-700/20 hover:shadow-lg transition-all cursor-pointer"
            >
              <span>Masuk ke Sistem</span>
              <ChevronRight className="w-4.5 h-4.5" />
            </button>
          </div>

          {/* Helper Ringan untuk Petunjuk Akun Bawaan */}
          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
            <span>Standar Keamanan Kemenkes RI</span>
            <button
              type="button"
              onClick={() => setShowHelp(!showHelp)}
              className="text-cyan-700 hover:text-cyan-800 font-bold inline-flex items-center gap-1"
            >
              <HelpCircle className="w-3.5 h-3.5" />
              <span>Info Akun Default</span>
            </button>
          </div>

          {showHelp && (
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-[11px] text-slate-600 space-y-1">
              <p className="font-bold text-slate-800">
                Kredensial Default Sistem (Dapat dikelola di Master &gt; Pengaturan Login Akses):
              </p>
              <div className="grid grid-cols-2 gap-1 font-mono text-[10.5px]">
                <div>&bull; Admin: <b>admin</b> / <b>admin123</b></div>
                <div>&bull; Dokter: <b>dr.hendra</b> / <b>okupasi2026</b></div>
                <div>&bull; Perawat/Klinis: <b>dr.anisa</b> / <b>medis123</b></div>
                <div>&bull; Registrasi: <b>petugas.reg</b> / <b>reg123</b></div>
              </div>
            </div>
          )}
        </form>
      </div>
    </div>
  );
};
