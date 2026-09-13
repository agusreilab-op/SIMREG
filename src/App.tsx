import React, { useState, useMemo, useEffect } from 'react';
import {
  Page,
  Company,
  Doctor,
  AttendanceRecord,
  ClinicInfo,
  MCUPackage,
  ThermalLabelConfig,
  CompanyExaminerConfig,
  UserSession,
  UserAccount,
  UserRole,
  PhysicalExamParam,
  LabExamParam,
  MedicalAdviceMaster,
  MCUTemplateMaster,
} from './types';
import { generateAutoMrNumber } from './utils/mrNumber';
import {
  initialCompanies,
  initialDoctors,
  initialAttendance,
  initialClinic,
  initialExams,
  initialPackages,
  defaultThermalConfig,
  initialExaminerConfigs,
  initialUserAccounts,
  initialPhysicalExamParams,
  initialLabExamParams,
  initialMedicalAdvices,
  initialMCUTemplates,
} from './data/initialData';
import {
  testConnection,
  subscribeParticipants,
  subscribePackages,
  subscribeCompanies,
  subscribeDoctors,
  subscribeExamSetting,
  subscribeAllExamResults,
  saveParticipantToCloud,
  bulkSaveParticipantsToCloud,
  savePackageToCloud,
  saveCompanyToCloud,
  saveDoctorToCloud,
  saveExamSettingToCloud,
  deleteCompanyFromCloud,
  deleteDoctorFromCloud,
  deletePackageFromCloud,
} from './lib/firebase';
import { Sidebar } from './components/Sidebar';
import { TopNavbar } from './components/TopNavbar';
import { DashboardView } from './components/DashboardView';
import { RegistrasiView, RegistrasiTab } from './components/RegistrasiView';
import { MasterView, MasterSubAction } from './components/MasterView';
import { MedicalRecordView } from './components/MedicalRecordView';
import { LaporanView, LaporanSubAction } from './components/LaporanView';
import { LoginModal } from './components/LoginModal';
import { Toast } from './components/Toast';
import { purgeLocalDummyData, purgeAllDataEverywhere } from './utils/dummyDataPurge';

// Helper to get initial page from URL path
function getInitialPage(): Page {
  try {
    const path = window.location.pathname.replace(/^\/+/, '').toLowerCase();
    if (path.startsWith('registrasi') || path.startsWith('pendaftaran')) return 'registrasi';
    if (path.startsWith('master') || path.startsWith('admin')) return 'master';
    if (path.startsWith('medical') || path.startsWith('rekam-medis')) return 'medical';
    if (path.startsWith('laporan') || path.startsWith('report')) return 'laporan';
  } catch {}
  return 'dashboard';
}

// Helper to get stored session from sessionStorage
function getInitialSession(): UserSession | null {
  try {
    const saved = sessionStorage.getItem('simreg_session');
    if (saved) return JSON.parse(saved);

    const savedUser = sessionStorage.getItem('simreg_user');
    if (savedUser) {
      const u = JSON.parse(savedUser);
      const selPt = sessionStorage.getItem('simreg_selected_pt') || 'ALL';
      const selPeriode = sessionStorage.getItem('simreg_selected_periode') || 'ALL';
      let userRole: UserRole = 'admin';
      const rName = (u.role?.role_name || '').toLowerCase();
      if (rName.includes('dokter')) userRole = 'dokter_okupasi';
      else if (rName.includes('resepsionis')) userRole = 'petugas_registrasi';

      return {
        username: u.username || 'admin',
        namaLengkap: u.username || u.name || 'Pengguna SIMREG',
        role: userRole,
        roleLabel: u.role?.role_name || 'Admin',
        selectedPt: selPt,
        selectedPeriode: selPeriode === 'ALL' ? '' : selPeriode,
        hakAkses: ['dashboard', 'registrasi', 'master', 'medical', 'laporan'],
        loginTime: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
      };
    }
  } catch (e) {
    console.error(e);
  }
  // Default session with full access so the application opens directly with all data loaded
  return {
    username: 'superadmin',
    namaLengkap: 'dr. Super Admin Sp.Ok',
    role: 'admin',
    roleLabel: 'Super Admin (Akses Penuh)',
    selectedPt: 'ALL',
    selectedPeriode: 'ALL',
    hakAkses: ['dashboard', 'registrasi', 'master', 'medical', 'laporan'],
    loginTime: '08:00 WIB',
  };
}

export default function App() {
  const [currentPage, setCurrentPage] = useState<Page>(getInitialPage);
  const [companies, setCompanies] = useState<Company[]>(initialCompanies);
  const [doctors, setDoctors] = useState<Doctor[]>(initialDoctors);
  const [attendanceList, setAttendanceList] =
    useState<AttendanceRecord[]>(initialAttendance);
  const [clinic, setClinic] = useState<ClinicInfo>(() => {
    try {
      const saved = localStorage.getItem('simreg_clinic_info');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.nama && parsed.nama.toUpperCase().includes('OZA')) {
          return initialClinic;
        }
        return { ...initialClinic, ...parsed };
      }
    } catch {}
    return initialClinic;
  });
  const [exams, setExams] = useState<string[]>(initialExams);
  const [packages, setPackages] = useState<MCUPackage[]>(() => {
    try {
      const saved = localStorage.getItem('simreg_packages');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return initialPackages;
  });
  const [thermalConfig, setThermalConfig] =
    useState<ThermalLabelConfig>(defaultThermalConfig);
  const [examinerConfigs, setExaminerConfigs] =
    useState<CompanyExaminerConfig[]>(() => {
      try {
        const saved = localStorage.getItem('simreg_examiner_configs');
        if (saved) return JSON.parse(saved);
      } catch {}
      return initialExaminerConfigs;
    });
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // User Session & Login Modal (Login dapat diakses kapan saja dari TopNavbar / Sidebar)
  const [session, setSession] = useState<UserSession | null>(getInitialSession);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState<boolean>(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState<boolean>(false);
  const [masterSubAction, setMasterSubAction] = useState<MasterSubAction>('menu');
  const [registrasiTab, setRegistrasiTab] = useState<RegistrasiTab>('form');
  const [medicalActiveAction, setMedicalActiveAction] = useState<string | null>(null);
  const [laporanSubAction, setLaporanSubAction] = useState<LaporanSubAction>('menu');
  const [userAccounts, setUserAccounts] = useState<UserAccount[]>(() => {
    try {
      const saved = localStorage.getItem('simreg_user_accounts');
      if (saved) return JSON.parse(saved);
    } catch {
      // fallback
    }
    return initialUserAccounts;
  });

  const [isCloudConnected, setIsCloudConnected] = useState<boolean>(true);

  // --- Real-time Firebase Synchronization & Subscriptions ---
  useEffect(() => {
    // Purge any stale local dummy data on startup
    purgeLocalDummyData();

    testConnection()
      .then((connected) => setIsCloudConnected(connected))
      .catch(() => setIsCloudConnected(false));

    // 1. Subscribe to Participants (Registrasi MCU)
    const unsubParticipants = subscribeParticipants((remoteList) => {
      setAttendanceList(remoteList || []);
    });

    // 2. Subscribe to Packages (Paket MCU & Stiker)
    const unsubPackages = subscribePackages((remotePackages) => {
      if (remotePackages && remotePackages.length > 0) {
        // Filter out stale dummy packages
        const cleanPackages = remotePackages.filter(
          (p) => !['PAN-RO', 'PAI-A', 'PAN-STD', 'PAN-EXEC'].includes(p.kode)
        );
        if (cleanPackages.length > 0) {
          setPackages(cleanPackages);
          try {
            localStorage.setItem('simreg_packages', JSON.stringify(cleanPackages));
            window.dispatchEvent(new Event('simreg_packages_updated'));
          } catch {}
          return;
        }
      }
      setPackages(initialPackages);
    });

    // 3. Subscribe to Companies
    const unsubCompanies = subscribeCompanies((remoteCompanies) => {
      // Filter out stale dummy companies
      const cleanCompanies = (remoteCompanies || []).filter(
        (c) =>
          !['PAN', 'PAI', 'SMS', 'CPT'].includes(c.kode) &&
          !c.nama?.toUpperCase().includes('PANARUB') &&
          !c.nama?.toUpperCase().includes('PRATAMA ABADI')
      );
      setCompanies(cleanCompanies);
    });

    // 4. Subscribe to Doctors
    const unsubDoctors = subscribeDoctors((remoteDoctors) => {
      if (remoteDoctors && remoteDoctors.length > 0) {
        setDoctors(remoteDoctors);
      } else {
        initialDoctors.forEach((d) => saveDoctorToCloud(d).catch(console.error));
      }
    });

    // 5. Subscribe to Physical Exam Parameters
    const unsubPhysical = subscribeExamSetting('physical_params', (val) => {
      if (Array.isArray(val) && val.length > 0) {
        setPhysicalParams(val);
        try {
          localStorage.setItem('simreg_physical_params', JSON.stringify(val));
        } catch {}
      }
    });

    // 6. Subscribe to Lab Exam Parameters
    const unsubLab = subscribeExamSetting('lab_params', (val) => {
      if (Array.isArray(val) && val.length > 0) {
        setLabParams(val);
        try {
          localStorage.setItem('simreg_lab_params', JSON.stringify(val));
        } catch {}
      }
    });

    // 7. Subscribe to Medical Advices
    const unsubAdvices = subscribeExamSetting('medical_advices', (val) => {
      if (Array.isArray(val) && val.length > 0) {
        setMedicalAdvices(val);
        try {
          localStorage.setItem('simreg_medical_advices', JSON.stringify(val));
        } catch {}
      }
    });

    // 8. Subscribe to Clinic Info
    const unsubClinic = subscribeExamSetting('clinic_info', (val) => {
      if (val && typeof val === 'object') {
        setClinic((prev) => ({ ...prev, ...val }));
        try {
          localStorage.setItem('simreg_clinic_info', JSON.stringify(val));
        } catch {}
      }
    });

    // 9. Subscribe to Examiner Configs
    const unsubExaminers = subscribeExamSetting('examiner_configs', (val) => {
      if (Array.isArray(val) && val.length > 0) {
        setExaminerConfigs(val);
        try {
          localStorage.setItem('simreg_examiner_configs', JSON.stringify(val));
        } catch {}
      }
    });

    // 10. Subscribe to Real-time Modality Exam Results
    const unsubResults = subscribeAllExamResults((result) => {
      console.log(`[Firestore Realtime] Incoming update for ${result.mcuNo} [${result.modality}]`);
    });

    return () => {
      unsubParticipants();
      unsubPackages();
      unsubCompanies();
      unsubDoctors();
      unsubPhysical();
      unsubLab();
      unsubAdvices();
      unsubClinic();
      unsubExaminers();
      unsubResults();
    };
  }, []);

  // Master Data Pengaturan State
  const [selectedPackageCode, setSelectedPackageCode] = useState<string>('ALL');

  const [physicalParams, setPhysicalParams] = useState<PhysicalExamParam[]>(() => {
    try {
      const saved = localStorage.getItem('simreg_physical_params');
      if (saved) return JSON.parse(saved);
    } catch {}
    return initialPhysicalExamParams;
  });

  const [labParams, setLabParams] = useState<LabExamParam[]>(() => {
    try {
      const saved = localStorage.getItem('simreg_lab_params');
      if (saved) return JSON.parse(saved);
    } catch {}
    return initialLabExamParams;
  });

  const [medicalAdvices, setMedicalAdvices] = useState<MedicalAdviceMaster[]>(() => {
    try {
      const saved = localStorage.getItem('simreg_medical_advices');
      if (saved) return JSON.parse(saved);
    } catch {}
    return initialMedicalAdvices;
  });

  const [mcuTemplates, setMCUTemplates] = useState<MCUTemplateMaster[]>(() => {
    try {
      const saved = localStorage.getItem('simreg_mcu_templates');
      if (saved) return JSON.parse(saved);
    } catch {}
    return initialMCUTemplates;
  });

  const handleUpdatePackages = (newPackages: MCUPackage[]) => {
    // Detect and delete removed packages from Firestore
    const newIds = new Set(newPackages.map((p) => p.id));
    packages.forEach((pkg) => {
      if (!newIds.has(pkg.id)) {
        deletePackageFromCloud(pkg.id).catch(console.error);
      }
    });
    setPackages(newPackages);
    try {
      localStorage.setItem('simreg_packages', JSON.stringify(newPackages));
      window.dispatchEvent(new Event('simreg_packages_updated'));
    } catch {}
    newPackages.forEach((pkg) => {
      savePackageToCloud(pkg).catch(console.error);
    });
  };

  const handleUpdatePhysicalParams = (newParams: PhysicalExamParam[]) => {
    setPhysicalParams(newParams);
    try {
      localStorage.setItem('simreg_physical_params', JSON.stringify(newParams));
    } catch {}
    saveExamSettingToCloud('physical_params', newParams).catch(console.error);
  };

  const handleUpdateLabParams = (newParams: LabExamParam[]) => {
    setLabParams(newParams);
    try {
      localStorage.setItem('simreg_lab_params', JSON.stringify(newParams));
    } catch {}
    saveExamSettingToCloud('lab_params', newParams).catch(console.error);
  };

  const handleUpdateMedicalAdvices = (newAdvices: MedicalAdviceMaster[]) => {
    setMedicalAdvices(newAdvices);
    try {
      localStorage.setItem('simreg_medical_advices', JSON.stringify(newAdvices));
    } catch {}
    saveExamSettingToCloud('medical_advices', newAdvices).catch(console.error);
  };

  const handleUpdateMCUTemplates = (newTemplates: MCUTemplateMaster[]) => {
    setMCUTemplates(newTemplates);
    try {
      localStorage.setItem('simreg_mcu_templates', JSON.stringify(newTemplates));
    } catch {}
    saveExamSettingToCloud('mcu_templates', newTemplates).catch(console.error);
  };

  const handleUpdateClinic = (newClinic: ClinicInfo) => {
    setClinic(newClinic);
    try {
      localStorage.setItem('simreg_clinic_info', JSON.stringify(newClinic));
    } catch {}
    saveExamSettingToCloud('clinic_info', newClinic).catch(console.error);
  };

  const handleUpdateExaminerConfigs = (newConfigs: CompanyExaminerConfig[]) => {
    setExaminerConfigs(newConfigs);
    try {
      localStorage.setItem('simreg_examiner_configs', JSON.stringify(newConfigs));
    } catch {}
    saveExamSettingToCloud('examiner_configs', newConfigs).catch(console.error);
  };

  const handleUpdateUserAccounts = (newAccounts: UserAccount[]) => {
    setUserAccounts(newAccounts);
    try {
      localStorage.setItem('simreg_user_accounts', JSON.stringify(newAccounts));
    } catch {
      // fallback
    }
    saveExamSettingToCloud('user_accounts', newAccounts).catch(console.error);
  };

  const showNotification = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((prev) => (prev === msg ? null : prev));
    }, 3500);
  };

  const handleLogin = (newSession: UserSession) => {
    setSession(newSession);
    setIsLoginModalOpen(false);

    try {
      sessionStorage.setItem('simreg_session', JSON.stringify(newSession));
    } catch {}

    const ptInfo =
      newSession.selectedPt === 'ALL' || !newSession.selectedPt
        ? 'Semua Perusahaan'
        : newSession.selectedPt;

    const periodeInfo =
      !newSession.selectedPeriode || newSession.selectedPeriode === 'ALL'
        ? 'Semua Periode (Terbuka Penuh)'
        : `Periode: ${newSession.selectedPeriode}`;

    showNotification(
      `Selamat datang, ${newSession.namaLengkap}! Hak Akses: [${newSession.roleLabel}]. Lingkup: ${ptInfo} (${periodeInfo}).`
    );
  };

  const handleUpdateSession = (newSession: UserSession) => {
    setSession(newSession);
    try {
      sessionStorage.setItem('simreg_session', JSON.stringify(newSession));
    } catch {}
    const ptInfo =
      newSession.selectedPt === 'ALL' || !newSession.selectedPt
        ? 'Semua Perusahaan'
        : newSession.selectedPt;
    const periodeInfo =
      !newSession.selectedPeriode || newSession.selectedPeriode === 'ALL'
        ? 'Semua Periode (Terbuka Penuh)'
        : `Periode: ${newSession.selectedPeriode}`;
    showNotification(`⚡ Lingkup MCU berhasil diubah ke: ${ptInfo} (${periodeInfo})`);
  };

  const handleLogout = () => {
    setSession(null);
    setIsLoginModalOpen(true);
    try {
      sessionStorage.removeItem('simreg_session');
      sessionStorage.removeItem('simreg_user');
      sessionStorage.removeItem('simreg_token');
      sessionStorage.removeItem('simreg_jwt_token');
      sessionStorage.removeItem('simreg_role');
      sessionStorage.removeItem('simreg_user_role');
      sessionStorage.removeItem('simreg_user_profile');
    } catch {}
    showNotification('Sesi berhasil ditutup. Silakan login kembali.');
  };

  // Filter attendanceList based on selected PT and Periode
  // "jika tidak di pilih periode maka semua periode mcu pt. tersebut akan terbuka"
  const activeAttendanceList = useMemo(() => {
    if (!session) return attendanceList;

    return attendanceList.filter((record) => {
      // 1. PT filter
      if (session.selectedPt && session.selectedPt !== 'ALL') {
        const ptMatches =
          record.pt.trim().toLowerCase() === session.selectedPt.trim().toLowerCase();
        if (!ptMatches) return false;
      }

      // 2. Periode filter: jika tidak dipilih ('ALL' / kosong), seluruh periode akan terbuka!
      if (
        session.selectedPeriode &&
        session.selectedPeriode !== 'ALL' &&
        session.selectedPeriode.trim() !== ''
      ) {
        if (!record.tglMcu.includes(session.selectedPeriode)) {
          return false;
        }
      }

      return true;
    });
  }, [attendanceList, session]);

  const handleSavePatient = (patient: AttendanceRecord) => {
    setAttendanceList((prev) => {
      const existsIndex = prev.findIndex((p) => p.mcuNo === patient.mcuNo);
      if (existsIndex >= 0) {
        const next = [...prev];
        next[existsIndex] = patient;
        return next;
      } else {
        return [patient, ...prev];
      }
    });
    // Real-time Cloud Save
    saveParticipantToCloud(patient).catch(console.error);
  };

  const handleBulkAddPatients = (patients: AttendanceRecord[]) => {
    setAttendanceList((prev) => [...patients, ...prev]);
    // Real-time Cloud Bulk Save
    bulkSaveParticipantsToCloud(patients).catch(console.error);
  };

  const handleAddPatient = (patient: Partial<AttendanceRecord>) => {
    const defaultPt =
      session?.selectedPt && session.selectedPt !== 'ALL'
        ? session.selectedPt
        : companies[0]?.nama || 'Umum';

    const defaultTglMcu =
      session?.selectedPeriode && session.selectedPeriode !== 'ALL'
        ? session.selectedPeriode
        : new Date().toISOString().split('T')[0];

    const record: AttendanceRecord = {
      no: attendanceList.length + 1,
      mcuNo:
        patient.mcuNo ||
        generateAutoMrNumber(
          patient.pt || defaultPt,
          patient.tglMcu || defaultTglMcu,
          attendanceList,
          companies
        ),
      nama: patient.nama || 'Pasien Baru',
      jk: patient.jk || 'Pria',
      tglLahir: patient.tglLahir || '01/01/1990',
      pt: patient.pt || defaultPt,
      dept: patient.dept || 'Umum',
      paket: patient.paket || packages[0]?.kode || 'PAKET-BASIC',
      tglMcu: patient.tglMcu || defaultTglMcu,
      status: patient.status || 'Hadir',
      jam:
        patient.jam ||
        new Date().toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
        }),
    };
    handleSavePatient(record);
  };

  const handleToggleAttendance = (mcuNo: string) => {
    setAttendanceList((prev) => {
      const next = prev.map((item) =>
        item.mcuNo === mcuNo
          ? {
              ...item,
              status: item.status === 'Hadir' ? 'Belum Hadir' : 'Hadir',
              jam:
                item.status === 'Hadir'
                  ? '-'
                  : new Date().toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    }),
            }
          : item
      );
      const changed = next.find((p) => p.mcuNo === mcuNo);
      if (changed) {
        saveParticipantToCloud(changed).catch(console.error);
      }
      return next;
    });
  };

  const handleAddExamType = (examName: string) => {
    if (!exams.includes(examName)) {
      setExams((prev) => [...prev, examName]);
    }
  };

  const handleUpdateCompanies = (newCompanies: Company[]) => {
    // Detect and delete removed companies from Firestore
    const newIds = new Set(newCompanies.map((c) => c.id));
    companies.forEach((comp) => {
      if (!newIds.has(comp.id)) {
        deleteCompanyFromCloud(comp.id).catch(console.error);
      }
    });
    setCompanies(newCompanies);
    try {
      localStorage.setItem('simreg_companies', JSON.stringify(newCompanies));
    } catch {}
    newCompanies.forEach((comp) => {
      saveCompanyToCloud(comp).catch(console.error);
    });
  };

  const handleUpdateDoctors = (newDoctors: Doctor[]) => {
    // Detect and delete removed doctors from Firestore
    const newIds = new Set(newDoctors.map((d) => d.id));
    doctors.forEach((doc) => {
      if (!newIds.has(doc.id)) {
        deleteDoctorFromCloud(doc.id).catch(console.error);
      }
    });
    setDoctors(newDoctors);
    try {
      localStorage.setItem('simreg_doctors', JSON.stringify(newDoctors));
    } catch {}
    newDoctors.forEach((doc) => {
      saveDoctorToCloud(doc).catch(console.error);
    });
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#0F172A] flex">
      {/* Sidebar Navigation */}
      <Sidebar
        currentPage={currentPage}
        onSelectPage={(page) => setCurrentPage(page)}
        session={session}
        onOpenSessionModal={() => setIsLoginModalOpen(true)}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed((prev) => !prev)}
        isMobileOpen={isMobileSidebarOpen}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
        masterSubAction={masterSubAction}
        onSelectMasterSubAction={setMasterSubAction}
        registrasiTab={registrasiTab}
        onSelectRegistrasiTab={setRegistrasiTab}
        medicalActiveAction={medicalActiveAction}
        onSelectMedicalAction={setMedicalActiveAction}
        laporanSubAction={laporanSubAction}
        onSelectLaporanSubAction={setLaporanSubAction}
        attendanceCount={activeAttendanceList.length}
        companyCount={companies.length}
        doctorCount={doctors.length}
        packageCount={packages.length}
      />

      {/* Main Content Area */}
      <div
        className={`flex-1 min-h-screen flex flex-col transition-all duration-300 ${
          isSidebarCollapsed ? 'lg:ml-[76px]' : 'lg:ml-[260px]'
        } ml-0`}
      >
        <TopNavbar
          currentPage={currentPage}
          onSelectPage={(page) => setCurrentPage(page)}
          attendanceList={activeAttendanceList}
          companies={companies}
          session={session}
          onUpdateSession={handleUpdateSession}
          onOpenSessionModal={() => setIsLoginModalOpen(true)}
          onLogout={handleLogout}
          onToggleMobileSidebar={() => setIsMobileSidebarOpen((prev) => !prev)}
          onSelectPatient={() => setCurrentPage('medical')}
          onOpenThermalModal={() => setCurrentPage('registrasi')}
          selectedPackageCode={selectedPackageCode}
          onSelectPackageCode={setSelectedPackageCode}
          packages={packages}
          isCloudConnected={isCloudConnected}
        />

        <main className="w-full mx-auto flex-1 transition-all p-2 sm:p-3 md:p-3.5 max-w-[1750px]">
          {currentPage === 'dashboard' && (
            <DashboardView
              onNavigate={(page) => setCurrentPage(page)}
              patientCount={activeAttendanceList.length}
              mcuCount={activeAttendanceList.filter((p) => p.status === 'Hadir').length}
              completedCount={activeAttendanceList.filter((p) => p.sudahMcu || p.status === 'Hadir').length}
              followUpCount={activeAttendanceList.filter((p) => p.status === 'Belum Hadir').length}
              attendanceList={activeAttendanceList}
              onToggleAttendance={handleToggleAttendance}
              onSelectPatient={(mcuNo) => {
                try {
                  localStorage.setItem('simreg_active_patient_mcu', mcuNo);
                } catch {}
              }}
            />
          )}

          {currentPage === 'registrasi' && (
            <RegistrasiView
              companies={companies}
              attendanceList={activeAttendanceList}
              packages={packages}
              clinic={clinic}
              labelConfig={thermalConfig}
              onUpdateLabelConfig={setThermalConfig}
              onAddPatient={handleAddPatient}
              onSavePatient={handleSavePatient}
              onBulkAddPatients={handleBulkAddPatients}
              onToggleAttendance={handleToggleAttendance}
              onNotify={showNotification}
              initialTab={registrasiTab}
              onTabChange={setRegistrasiTab}
            />
          )}

          {currentPage === 'master' && (
            <MasterView
              companies={companies}
              doctors={doctors}
              clinic={clinic}
              exams={exams}
              packages={packages}
              labelConfig={thermalConfig}
              examinerConfigs={examinerConfigs}
              session={session}
              userAccounts={userAccounts}
              physicalParams={physicalParams}
              labParams={labParams}
              medicalAdvices={medicalAdvices}
              mcuTemplates={mcuTemplates}
              selectedPackageCode={selectedPackageCode}
              onSelectPackageCode={setSelectedPackageCode}
              onUpdatePackages={handleUpdatePackages}
              onUpdateLabelConfig={setThermalConfig}
              onUpdateCompanies={handleUpdateCompanies}
              onUpdateDoctors={handleUpdateDoctors}
              onUpdateClinic={handleUpdateClinic}
              onUpdateExaminerConfigs={handleUpdateExaminerConfigs}
              onUpdateUserAccounts={handleUpdateUserAccounts}
              onUpdatePhysicalParams={handleUpdatePhysicalParams}
              onUpdateLabParams={handleUpdateLabParams}
              onUpdateMedicalAdvices={handleUpdateMedicalAdvices}
              onUpdateMCUTemplates={handleUpdateMCUTemplates}
              onAddExamType={handleAddExamType}
              onNotify={showNotification}
              subAction={masterSubAction}
              onSelectSubAction={setMasterSubAction}
            />
          )}

          {currentPage === 'medical' && (
            <MedicalRecordView
              attendanceList={activeAttendanceList}
              exams={exams}
              examinerConfigs={examinerConfigs}
              doctors={doctors}
              medicalAdvices={medicalAdvices}
              onUpdateMedicalAdvices={handleUpdateMedicalAdvices}
              onNotify={showNotification}
              clinic={clinic}
              packages={packages}
              initialAction={medicalActiveAction}
              onSelectAction={setMedicalActiveAction}
            />
          )}

          {currentPage === 'laporan' && (
            <LaporanView
              companies={companies}
              attendanceList={activeAttendanceList}
              clinic={clinic}
              packages={packages}
              examinerConfigs={examinerConfigs}
              doctors={doctors}
              physicalParams={physicalParams}
              labParams={labParams}
              onNotify={showNotification}
              initialSubAction={laporanSubAction}
              onSelectSubAction={setLaporanSubAction}
            />
          )}
        </main>
      </div>

      {/* Login & Hak Akses Modal (Tampil Diawal Buka Web & Dapat Dibuka Kembali Kapan Saja) */}
      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={session ? () => setIsLoginModalOpen(false) : undefined}
        onLogin={handleLogin}
        companies={companies}
        attendanceList={attendanceList}
        currentSession={session}
        userAccounts={userAccounts}
      />

      {/* Notification Toast */}
      <Toast message={toastMessage} onClose={() => setToastMessage(null)} />
    </div>
  );
}


