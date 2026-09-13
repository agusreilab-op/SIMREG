import React, { useState } from 'react';
import {
  Shield,
  ShieldCheck,
  UserCheck,
  UserX,
  Plus,
  Search,
  Edit2,
  Trash2,
  Lock,
  KeyRound,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertTriangle,
  Building2,
  Activity,
  Layers,
  Info,
  X,
  RefreshCw,
} from 'lucide-react';
import { UserAccount, UserSession, UserRole, Company } from '../types';
import { ConfirmDeleteModal } from './ConfirmDeleteModal';

interface PengaturanLoginAksesViewProps {
  userAccounts: UserAccount[];
  onUpdateUserAccounts: (accounts: UserAccount[]) => void;
  currentSession: UserSession | null;
  companies: Company[];
  onNotify: (msg: string) => void;
}

export const PengaturanLoginAksesView: React.FC<PengaturanLoginAksesViewProps> = ({
  userAccounts,
  onUpdateUserAccounts,
  currentSession,
  companies,
  onNotify,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterRole, setFilterRole] = useState<string>('ALL');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');

  // Modal State for Add / Edit User
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);

  // Form States
  const [formUsername, setFormUsername] = useState('');
  const [formPassword, setFormPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [formNamaLengkap, setFormNamaLengkap] = useState('');
  const [formRole, setFormRole] = useState<UserRole>('dokter_pemeriksa');
  const [formRoleLabel, setFormRoleLabel] = useState('Dokter Pemeriksa Klinis');
  const [formStatus, setFormStatus] = useState<'Aktif' | 'Nonaktif'>('Aktif');
  const [formHakAkses, setFormHakAkses] = useState<string[]>([
    'dashboard',
    'medical',
  ]);
  const [formDefaultPt, setFormDefaultPt] = useState<string>('ALL');
  const [formKeterangan, setFormKeterangan] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  // Security Gate: Administrator only
  const isAdmin = currentSession?.role === 'admin';

  if (!isAdmin) {
    return (
      <div className="p-8 bg-rose-50 border border-rose-200 rounded-3xl text-center max-w-2xl mx-auto my-12 shadow-sm">
        <div className="w-16 h-16 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto mb-4">
          <AlertTriangle className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-black text-rose-900 mb-2">
          Akses Dibatasi (Privilege Restricted)
        </h2>
        <p className="text-sm text-rose-700 leading-relaxed mb-4">
          Submenu <b>Pengaturan Login Akses</b> hanya dapat dilihat dan diakses oleh{' '}
          <b>Administrator SIMREG MCU</b>. Akun Anda saat ini (
          <span className="font-semibold">{currentSession?.roleLabel || 'Non-Admin'}</span>) tidak
          memiliki otorisasi untuk membuka konfigurasi ini.
        </p>
      </div>
    );
  }

  const roleOptions: { id: UserRole; label: string; defaultHak: string[] }[] = [
    {
      id: 'admin',
      label: 'Super Admin / Administrator',
      defaultHak: ['dashboard', 'registrasi', 'master', 'medical', 'laporan'],
    },
    {
      id: 'dokter_okupasi',
      label: 'Dokter Spesialis Okupasi (Sp.Ok)',
      defaultHak: ['dashboard', 'medical', 'laporan'],
    },
    {
      id: 'dokter_pemeriksa',
      label: 'Dokter Pemeriksa Klinis',
      defaultHak: ['dashboard', 'medical'],
    },
    {
      id: 'petugas_registrasi',
      label: 'Petugas Registrasi Onsite',
      defaultHak: ['dashboard', 'registrasi'],
    },
    {
      id: 'petugas_lab',
      label: 'Analis Laboratorium & Radiografer',
      defaultHak: ['dashboard', 'medical'],
    },
    {
      id: 'pic_perusahaan',
      label: 'PIC Perusahaan (Client HR/HSE)',
      defaultHak: ['dashboard', 'laporan'],
    },
  ];

  const availableModules: { id: string; label: string; desc: string }[] = [
    {
      id: 'dashboard',
      label: 'Dashboard Statistik',
      desc: 'Ringkasan peserta, progres MCU, grafik status',
    },
    {
      id: 'registrasi',
      label: 'Registrasi Pasien & Barcode',
      desc: 'Pendaftaran onsite, cetak stiker label thermal',
    },
    {
      id: 'medical',
      label: 'Medical Record (9 Submenu)',
      desc: 'Resume, Fisik, Lab, Rontgen, EKG, Audio, Spiro, Treadmill, USG',
    },
    {
      id: 'laporan',
      label: 'Cetak & Rekap Laporan',
      desc: 'Buku hasil MCU perorangan & rekap corporate',
    },
    {
      id: 'master',
      label: 'Master Data & Pengaturan',
      desc: 'Data PT, Dokter, Paket MCU, Format Label, Login Akses',
    },
  ];

  const handleOpenAddModal = () => {
    setEditingUserId(null);
    setFormUsername('');
    setFormPassword('');
    setShowPassword(false);
    setFormNamaLengkap('');
    setFormRole('dokter_pemeriksa');
    setFormRoleLabel('Dokter Pemeriksa Klinis');
    setFormStatus('Aktif');
    setFormHakAkses(['dashboard', 'medical']);
    setFormDefaultPt('ALL');
    setFormKeterangan('');
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (user: UserAccount) => {
    setEditingUserId(user.id);
    setFormUsername(user.username);
    setFormPassword(user.password);
    setShowPassword(false);
    setFormNamaLengkap(user.namaLengkap);
    setFormRole(user.role);
    setFormRoleLabel(user.roleLabel);
    setFormStatus(user.status);
    setFormHakAkses(user.hakAkses || ['dashboard']);
    setFormDefaultPt(user.defaultPt || 'ALL');
    setFormKeterangan(user.keterangan || '');
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleRoleSelectChange = (rId: UserRole) => {
    setFormRole(rId);
    const selected = roleOptions.find((r) => r.id === rId);
    if (selected) {
      setFormRoleLabel(selected.label);
      setFormHakAkses(selected.defaultHak);
    }
  };

  const toggleHakAkses = (modId: string) => {
    setFormHakAkses((prev) =>
      prev.includes(modId) ? prev.filter((x) => x !== modId) : [...prev, modId]
    );
  };

  const handleSaveUser = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const cleanUser = formUsername.trim().toLowerCase();
    const cleanPass = formPassword.trim();
    const cleanNama = formNamaLengkap.trim();

    if (!cleanUser) {
      setFormError('Username wajib diisi.');
      return;
    }
    if (!cleanPass) {
      setFormError('Kata sandi wajib diisi.');
      return;
    }
    if (!cleanNama) {
      setFormError('Nama lengkap pengguna wajib diisi.');
      return;
    }

    // Check duplicate username if adding or changing
    const isDuplicate = userAccounts.some(
      (u) =>
        u.username.toLowerCase() === cleanUser &&
        u.id !== editingUserId
    );
    if (isDuplicate) {
      setFormError(
        `Username "${cleanUser}" sudah digunakan oleh akun lain. Gunakan username unik.`
      );
      return;
    }

    if (editingUserId) {
      // Update existing
      const updated = userAccounts.map((u) => {
        if (u.id === editingUserId) {
          return {
            ...u,
            username: cleanUser,
            password: cleanPass,
            namaLengkap: cleanNama,
            role: formRole,
            roleLabel: formRoleLabel,
            status: formStatus,
            hakAkses: formHakAkses,
            defaultPt: formDefaultPt,
            keterangan: formKeterangan.trim(),
          };
        }
        return u;
      });
      onUpdateUserAccounts(updated);
      onNotify(`Akun pengguna "${cleanUser}" berhasil diperbarui.`);
    } else {
      // Create new
      const newUser: UserAccount = {
        id: `USR-${Date.now().toString().slice(-4)}`,
        username: cleanUser,
        password: cleanPass,
        namaLengkap: cleanNama,
        role: formRole,
        roleLabel: formRoleLabel,
        status: formStatus,
        hakAkses: formHakAkses,
        defaultPt: formDefaultPt,
        keterangan: formKeterangan.trim(),
        createdAt: new Date().toISOString().split('T')[0],
      };
      onUpdateUserAccounts([newUser, ...userAccounts]);
      onNotify(`Akun pengguna baru "${cleanUser}" berhasil dibuat.`);
    }

    setIsModalOpen(false);
  };

  const handleToggleStatus = (user: UserAccount) => {
    if (user.username === 'admin') {
      alert('Akun Administrator utama tidak dapat dinonaktifkan untuk menjaga keamanan sistem.');
      return;
    }
    const newStatus = user.status === 'Aktif' ? 'Nonaktif' : 'Aktif';
    const updated = userAccounts.map((u) =>
      u.id === user.id ? { ...u, status: newStatus } : u
    );
    onUpdateUserAccounts(updated);
    onNotify(
      `Status akun "${user.username}" diubah menjadi ${newStatus}.`
    );
  };

  // Delete modal state
  const [deleteModalState, setDeleteModalState] = useState<{
    isOpen: boolean;
    user: UserAccount | null;
  }>({
    isOpen: false,
    user: null,
  });

  const handleDeleteUser = (user: UserAccount) => {
    if (user.username === 'admin') {
      onNotify('Akun Administrator utama tidak dapat dihapus demi keamanan sistem.');
      return;
    }
    setDeleteModalState({
      isOpen: true,
      user,
    });
  };

  const handleConfirmDelete = () => {
    const user = deleteModalState.user;
    setDeleteModalState({ isOpen: false, user: null });
    if (!user) return;

    const updated = userAccounts.filter((u) => u.id !== user.id);
    onUpdateUserAccounts(updated);
    onNotify(`Akun "${user.username}" telah dihapus dari sistem.`);
  };

  // Filtered accounts
  const filteredUsers = userAccounts.filter((u) => {
    const q = searchQuery.toLowerCase();
    const matchSearch =
      u.username.toLowerCase().includes(q) ||
      u.namaLengkap.toLowerCase().includes(q) ||
      u.roleLabel.toLowerCase().includes(q) ||
      (u.defaultPt && u.defaultPt.toLowerCase().includes(q));

    const matchRole = filterRole === 'ALL' || u.role === filterRole;
    const matchStatus = filterStatus === 'ALL' || u.status === filterStatus;

    return matchSearch && matchRole && matchStatus;
  });

  return (
    <div className="space-y-6">
      {/* Top Banner Header */}
      <div className="bg-gradient-to-r from-slate-900 via-cyan-950 to-slate-900 rounded-3xl p-6 sm:p-7 text-white shadow-lg border border-cyan-900/40 relative overflow-hidden">
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-13 h-13 rounded-2xl bg-cyan-600/30 border border-cyan-400/30 flex items-center justify-center text-cyan-300 shadow-inner">
              <ShieldCheck className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight">
                  Pengaturan Login Akses
                </h2>
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-amber-400 text-amber-950 uppercase tracking-wider">
                  Khusus Admin
                </span>
              </div>
              <p className="text-xs sm:text-sm text-cyan-200 mt-1 max-w-2xl leading-relaxed">
                Pusat kendali hak akses pengguna, kata sandi, otorisasi peran (Role-Based
                Access Control), serta pembatasan penugasan modul MCU.
              </p>
            </div>
          </div>

          <button
            onClick={handleOpenAddModal}
            className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-cyan-600 hover:from-cyan-400 hover:to-cyan-500 text-white text-xs sm:text-sm font-bold shadow-md shadow-cyan-950/40 transition-all cursor-pointer shrink-0"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>Tambah Pengguna Baru</span>
          </button>
        </div>

        {/* Info Strip */}
        <div className="mt-5 pt-4 border-t border-cyan-800/40 flex flex-wrap items-center gap-6 text-xs text-cyan-200/90">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-cyan-400" />
            <span>
              Total Terdaftar: <b>{userAccounts.length} Akun</b>
            </span>
          </div>
          <div className="flex items-center gap-2">
            <UserCheck className="w-4 h-4 text-emerald-400" />
            <span>
              Akun Aktif:{' '}
              <b>{userAccounts.filter((u) => u.status === 'Aktif').length}</b>
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Lock className="w-4 h-4 text-amber-400" />
            <span>Kerahasiaan Data Medis &bull; Sesuai Regulasi Kemenkes RI</span>
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari username, nama, atau PT..."
            className="w-full pl-9 pr-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-800 focus:bg-white focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-all"
          />
        </div>

        <div className="flex items-center gap-2.5 w-full md:w-auto">
          <select
            value={filterRole}
            onChange={(e) => setFilterRole(e.target.value)}
            className="px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-700 focus:ring-2 focus:ring-cyan-500"
          >
            <option value="ALL">Semua Peran / Role</option>
            <option value="admin">Administrator</option>
            <option value="dokter_okupasi">Dokter Sp.Ok</option>
            <option value="dokter_pemeriksa">Dokter Pemeriksa</option>
            <option value="petugas_registrasi">Petugas Registrasi</option>
            <option value="petugas_lab">Petugas Lab</option>
            <option value="pic_perusahaan">PIC Perusahaan</option>
          </select>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-700 focus:ring-2 focus:ring-cyan-500"
          >
            <option value="ALL">Semua Status</option>
            <option value="Aktif">Aktif Saja</option>
            <option value="Nonaktif">Nonaktif Saja</option>
          </select>
        </div>
      </div>

      {/* Table of Users */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-700 uppercase tracking-wider">
              <tr>
                <th className="px-4 py-3.5">No / ID</th>
                <th className="px-4 py-3.5">Akun Pengguna</th>
                <th className="px-4 py-3.5">Peran (Role)</th>
                <th className="px-4 py-3.5">Hak Akses Modul</th>
                <th className="px-4 py-3.5">Lingkup PT</th>
                <th className="px-4 py-3.5">Status</th>
                <th className="px-4 py-3.5 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-slate-400 font-semibold">
                    Tidak ada akun pengguna yang sesuai dengan filter.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user, idx) => {
                  const isPrimaryAdmin = user.username === 'admin';
                  return (
                    <tr key={user.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-4 py-3.5 font-mono text-[11px] text-slate-400">
                        {idx + 1}. <span className="text-slate-600 font-bold">{user.id}</span>
                      </td>

                      <td className="px-4 py-3.5">
                        <div className="font-extrabold text-slate-900 text-[13px] flex items-center gap-1.5">
                          <span>{user.namaLengkap}</span>
                          {isPrimaryAdmin && (
                            <span className="px-1.5 py-0.5 rounded text-[9.5px] font-black bg-cyan-100 text-cyan-800 border border-cyan-200">
                              ROOT
                            </span>
                          )}
                        </div>
                        <div className="font-mono text-[11px] text-cyan-800 mt-0.5 flex items-center gap-1">
                          <span className="font-semibold">User:</span>
                          <span className="bg-slate-100 px-1.5 py-0.2 rounded font-bold text-slate-800">
                            {user.username}
                          </span>
                        </div>
                        {user.keterangan && (
                          <div className="text-[10.5px] text-slate-400 italic mt-0.5 max-w-xs truncate">
                            {user.keterangan}
                          </div>
                        )}
                      </td>

                      <td className="px-4 py-3.5">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold border ${
                            user.role === 'admin'
                              ? 'bg-purple-50 text-purple-700 border-purple-200'
                              : user.role === 'dokter_okupasi'
                              ? 'bg-cyan-50 text-cyan-800 border-cyan-200'
                              : user.role === 'dokter_pemeriksa'
                              ? 'bg-blue-50 text-blue-800 border-blue-200'
                              : user.role === 'petugas_registrasi'
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                              : user.role === 'petugas_lab'
                              ? 'bg-amber-50 text-amber-800 border-amber-200'
                              : 'bg-indigo-50 text-indigo-800 border-indigo-200'
                          }`}
                        >
                          {user.roleLabel}
                        </span>
                      </td>

                      <td className="px-4 py-3.5">
                        <div className="flex flex-wrap gap-1 max-w-xs">
                          {(user.hakAkses || ['dashboard']).map((mod) => (
                            <span
                              key={mod}
                              className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-700 border border-slate-200 uppercase"
                            >
                              {mod}
                            </span>
                          ))}
                        </div>
                      </td>

                      <td className="px-4 py-3.5 font-semibold text-slate-700">
                        {user.defaultPt === 'ALL' || !user.defaultPt ? (
                          <span className="text-slate-500 italic">Semua Perusahaan</span>
                        ) : (
                          <span className="text-cyan-900 font-bold">{user.defaultPt}</span>
                        )}
                      </td>

                      <td className="px-4 py-3.5">
                        <button
                          type="button"
                          disabled={isPrimaryAdmin}
                          onClick={() => handleToggleStatus(user)}
                          className={`inline-flex items-center gap-1 px-2.5 py-0.8 rounded-full text-[10.5px] font-bold transition-all ${
                            user.status === 'Aktif'
                              ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200 border border-emerald-200'
                              : 'bg-rose-100 text-rose-800 hover:bg-rose-200 border border-rose-200'
                          } ${isPrimaryAdmin ? 'cursor-not-allowed opacity-80' : 'cursor-pointer'}`}
                          title={isPrimaryAdmin ? 'Akun root tidak dapat dinonaktifkan' : 'Klik untuk ganti status'}
                        >
                          {user.status === 'Aktif' ? (
                            <>
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse"></span>
                              <span>Aktif</span>
                            </>
                          ) : (
                            <>
                              <span className="w-1.5 h-1.5 rounded-full bg-rose-600"></span>
                              <span>Nonaktif</span>
                            </>
                          )}
                        </button>
                      </td>

                      <td className="px-4 py-3.5 text-center">
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            onClick={() => handleOpenEditModal(user)}
                            className="p-1.5 rounded-lg text-slate-600 hover:text-cyan-700 hover:bg-cyan-50 border border-slate-200 transition-colors"
                            title="Edit Akun & Sandi"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>

                          {!isPrimaryAdmin && (
                            <button
                              onClick={() => handleDeleteUser(user)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 border border-slate-200 transition-colors"
                              title="Hapus Pengguna"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Role Access Matrix Guide */}
      <div className="p-5 rounded-2xl bg-gradient-to-br from-slate-50 to-cyan-50/30 border border-cyan-100 text-xs text-slate-700 space-y-3">
        <div className="font-bold text-slate-900 flex items-center gap-2 text-sm">
          <Info className="w-4 h-4 text-cyan-700" />
          Panduan Kebijakan Otorisasi &amp; Hak Akses Peran:
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-[11.5px]">
          <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-2xs">
            <span className="font-extrabold text-purple-700">Administrator:</span>
            <p className="text-slate-600 mt-1">
              Akses menyeluruh: Registrasi, Master Data, Pengaturan Login Akses, Medical Record, &amp; Cetak Laporan.
            </p>
          </div>
          <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-2xs">
            <span className="font-extrabold text-cyan-800">Dokter Sp.Ok:</span>
            <p className="text-slate-600 mt-1">
              Validasi Resume Klinis, Penentuan Status Kelaikan Kerja (Fit to Work), Konseling, dan Buku Hasil MCU.
            </p>
          </div>
          <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-2xs">
            <span className="font-extrabold text-blue-800">Dokter Pemeriksa:</span>
            <p className="text-slate-600 mt-1">
              Input pemeriksaan fisik head-to-toe, tanda vital, mata/visus, dan keluhan klinis peserta.
            </p>
          </div>
          <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-2xs">
            <span className="font-extrabold text-emerald-800">Petugas Registrasi:</span>
            <p className="text-slate-600 mt-1">
              Presensi kehadiran, input data demografis, penetapan paket, dan cetak label thermal tabung.
            </p>
          </div>
          <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-2xs">
            <span className="font-extrabold text-amber-800">Analis Lab &amp; Penunjang:</span>
            <p className="text-slate-600 mt-1">
              Input hasil hematologi, kimia darah, urinalisis, rontgen thorax, EKG, audiometri, dan treadmill.
            </p>
          </div>
          <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-2xs">
            <span className="font-extrabold text-indigo-800">PIC Perusahaan (Klien):</span>
            <p className="text-slate-600 mt-1">
              Melihat progres kedatangan peserta karyawan perusahaan tersebut dan mengunduh laporan rekapitulasi.
            </p>
          </div>
        </div>
      </div>

      {/* Modal Add / Edit User */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm overflow-y-auto">
          <div className="relative w-full max-w-lg my-8 bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-slate-900 to-cyan-950 p-5 text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-cyan-600/30 border border-cyan-400/30 flex items-center justify-center text-cyan-300">
                  <KeyRound className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold">
                    {editingUserId ? 'Edit Akun Pengguna' : 'Tambah Pengguna Baru'}
                  </h3>
                  <p className="text-[11px] text-cyan-200">
                    Konfigurasi kredensial login &amp; hak akses modul
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-lg text-white/70 hover:text-white hover:bg-white/10"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSaveUser} className="p-6 space-y-4">
              {formError && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
                  <span>{formError}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-[12px] font-bold text-slate-700 mb-1">
                    Username Login: <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formUsername}
                    onChange={(e) => setFormUsername(e.target.value)}
                    placeholder="contoh: dr.budi"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-800 focus:bg-white focus:ring-2 focus:ring-cyan-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[12px] font-bold text-slate-700 mb-1">
                    Kata Sandi (Password): <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={formPassword}
                      onChange={(e) => setFormPassword(e.target.value)}
                      placeholder="Masukkan kata sandi"
                      className="w-full pl-3 pr-8 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-800 focus:bg-white focus:ring-2 focus:ring-cyan-500"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-slate-400 hover:text-slate-600"
                    >
                      {showPassword ? (
                        <EyeOff className="w-3.5 h-3.5" />
                      ) : (
                        <Eye className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-[12px] font-bold text-slate-700 mb-1">
                  Nama Lengkap &amp; Gelar: <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={formNamaLengkap}
                  onChange={(e) => setFormNamaLengkap(e.target.value)}
                  placeholder="contoh: dr. Budi Setiawan, Sp.Rad"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-800 focus:bg-white focus:ring-2 focus:ring-cyan-500"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-[12px] font-bold text-slate-700 mb-1">
                    Peran / Role Pengguna:
                  </label>
                  <select
                    value={formRole}
                    onChange={(e) => handleRoleSelectChange(e.target.value as UserRole)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-cyan-500"
                  >
                    {roleOptions.map((opt) => (
                      <option key={opt.id} value={opt.id}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[12px] font-bold text-slate-700 mb-1">
                    Status Akun:
                  </label>
                  <select
                    value={formStatus}
                    onChange={(e) =>
                      setFormStatus(e.target.value as 'Aktif' | 'Nonaktif')
                    }
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-cyan-500"
                  >
                    <option value="Aktif">Aktif (Dapat Login)</option>
                    <option value="Nonaktif">Nonaktif (Dilarang Login)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[12px] font-bold text-slate-700 mb-1">
                  Penugasan Perusahaan Default (Scope):
                </label>
                <select
                  value={formDefaultPt}
                  onChange={(e) => setFormDefaultPt(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-cyan-500"
                >
                  <option value="ALL">🏢 Semua Perusahaan (Akses Global MCU)</option>
                  {companies.map((c) => (
                    <option key={c.id} value={c.nama}>
                      🏢 {c.nama} ({c.kode})
                    </option>
                  ))}
                </select>
              </div>

              {/* Checkboxes Hak Akses Modul */}
              <div>
                <label className="block text-[12px] font-bold text-slate-700 mb-1.5 flex items-center justify-between">
                  <span>Hak Akses Modul Sistem:</span>
                  <span className="text-[10px] text-cyan-700 font-normal">
                    Centang modul yang diizinkan
                  </span>
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 p-3 bg-slate-50 border border-slate-200 rounded-xl">
                  {availableModules.map((mod) => {
                    const isChecked = formHakAkses.includes(mod.id);
                    return (
                      <label
                        key={mod.id}
                        className={`flex items-start gap-2 p-2 rounded-lg cursor-pointer transition-all border ${
                          isChecked
                            ? 'bg-cyan-50/80 border-cyan-300 text-cyan-900 font-bold'
                            : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-100'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggleHakAkses(mod.id)}
                          className="mt-0.5 rounded text-cyan-600 focus:ring-cyan-500"
                        />
                        <div className="text-[11.5px] leading-snug">
                          <div>{mod.label}</div>
                          <div className="text-[10px] text-slate-400 font-normal">
                            {mod.desc}
                          </div>
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-[12px] font-bold text-slate-700 mb-1">
                  Catatan / Keterangan Penugasan:
                </label>
                <input
                  type="text"
                  value={formKeterangan}
                  onChange={(e) => setFormKeterangan(e.target.value)}
                  placeholder="contoh: Penanggung Jawab Pemeriksaan Lab Onsite"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-800 focus:bg-white focus:ring-2 focus:ring-cyan-500"
                />
              </div>

              {/* Action Buttons */}
              <div className="pt-2 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 text-xs font-bold hover:bg-slate-100 transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-cyan-700 hover:bg-cyan-800 text-white text-xs font-bold shadow-sm transition-all"
                >
                  {editingUserId ? 'Simpan Perubahan' : 'Simpan Akun Pengguna'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Confirm Delete Modal for User Account */}
      <ConfirmDeleteModal
        isOpen={deleteModalState.isOpen}
        title="Hapus Akun Pengguna"
        category="Manajemen Akun & Akses"
        itemName={deleteModalState.user ? `${deleteModalState.user.namaLengkap} (@${deleteModalState.user.username})` : ''}
        itemCode={deleteModalState.user ? `Role: ${deleteModalState.user.roleLabel} • PT: ${deleteModalState.user.defaultPt || 'Semua Perusahaan'}` : undefined}
        warningMessage={`Akun pengguna ini akan dihapus dari sistem login SIMREG. Pengguna tidak akan dapat mengakses sistem lagi.`}
        onClose={() => setDeleteModalState({ isOpen: false, user: null })}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
};
