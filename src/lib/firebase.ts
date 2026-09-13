import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import {
  initializeFirestore,
  getFirestore,
  doc,
  getDocFromServer,
  getDocs,
  collection,
  onSnapshot,
  setDoc,
  deleteDoc,
  writeBatch,
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import { AttendanceRecord, MCUPackage, Company, Doctor } from '../types';

// 1. Initialize Firebase App and Firestore instance
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
export const db = (() => {
  try {
    return initializeFirestore(
      app,
      {
        experimentalForceLongPolling: true,
      },
      firebaseConfig.firestoreDatabaseId
    );
  } catch {
    return getFirestore(app, firebaseConfig.firestoreDatabaseId);
  }
})();
export const auth = getAuth(app);

// 2. Strict Error Handling
export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null
) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo:
        auth.currentUser?.providerData?.map((provider) => ({
          providerId: provider.providerId,
          email: provider.email,
        })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  return errInfo;
}

// 3. Test Connection
export async function testConnection(): Promise<boolean> {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    return true;
  } catch (error) {
    if (
      error instanceof Error &&
      (error.message.includes('the client is offline') ||
        (error as any).code === 'unavailable')
    ) {
      console.warn('Firebase client is currently offline or reconnecting.');
      return false;
    }
    // Any response from server or permissions confirms reachability
    return true;
  }
}

// 4. Sanitize ID for Firestore document path
function sanitizeDocId(id: string | number): string {
  return String(id).replace(/[\/\s#?\[\]]/g, '_');
}

// Helper to remove undefined values before Firestore write
function cleanPayload<T extends Record<string, any>>(obj: T): Record<string, any> {
  const res: Record<string, any> = {};
  Object.keys(obj).forEach((key) => {
    const val = obj[key];
    if (val !== undefined) {
      if (val !== null && typeof val === 'object' && !Array.isArray(val)) {
        res[key] = cleanPayload(val);
      } else {
        res[key] = val;
      }
    }
  });
  return res;
}

// 5. Participants (Registrasi & Kehadiran MCU)
export function subscribeParticipants(
  onData: (data: AttendanceRecord[]) => void,
  onError?: (err: any) => void
) {
  const path = 'participants';
  return onSnapshot(
    collection(db, path),
    (snapshot) => {
      const records: AttendanceRecord[] = [];
      snapshot.forEach((d) => {
        records.push(d.data() as AttendanceRecord);
      });
      // Sort by record number or mcuNo
      records.sort((a, b) => (b.no || 0) - (a.no || 0));
      onData(records);
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, path);
      if (onError) onError(error);
    }
  );
}

export async function saveParticipantToCloud(participant: AttendanceRecord): Promise<void> {
  const docId = sanitizeDocId(participant.mcuNo || participant.no || Date.now());
  const path = `participants/${docId}`;
  try {
    const payload = cleanPayload({
      ...participant,
      updatedAt: new Date().toISOString(),
    });
    await setDoc(doc(db, 'participants', docId), payload, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
    throw error;
  }
}

export async function bulkSaveParticipantsToCloud(
  participants: AttendanceRecord[]
): Promise<void> {
  if (!participants || participants.length === 0) return;
  const path = 'participants';
  try {
    // Firestore batch supports up to 500 operations
    const chunks = [];
    for (let i = 0; i < participants.length; i += 400) {
      chunks.push(participants.slice(i, i + 400));
    }

    for (const chunk of chunks) {
      const batch = writeBatch(db);
      for (const p of chunk) {
        const docId = sanitizeDocId(p.mcuNo || p.no || Math.random().toString(36).substring(7));
        const ref = doc(db, 'participants', docId);
        batch.set(
          ref,
          cleanPayload({
            ...p,
            updatedAt: new Date().toISOString(),
          }),
          { merge: true }
        );
      }
      await batch.commit();
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
    throw error;
  }
}

export async function deleteParticipantFromCloud(mcuNo: string): Promise<void> {
  const docId = sanitizeDocId(mcuNo);
  const path = `participants/${docId}`;
  try {
    await deleteDoc(doc(db, 'participants', docId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
    throw error;
  }
}

// 6. Packages (Paket MCU & Label Stiker)
export function subscribePackages(
  onData: (data: MCUPackage[]) => void,
  onError?: (err: any) => void
) {
  const path = 'packages';
  return onSnapshot(
    collection(db, path),
    (snapshot) => {
      const pkgs: MCUPackage[] = [];
      snapshot.forEach((d) => {
        pkgs.push(d.data() as MCUPackage);
      });
      pkgs.sort((a, b) => Number(a.id || 0) - Number(b.id || 0));
      onData(pkgs);
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, path);
      if (onError) onError(error);
    }
  );
}

export async function savePackageToCloud(pkg: MCUPackage): Promise<void> {
  const docId = sanitizeDocId(pkg.id || pkg.kode);
  const path = `packages/${docId}`;
  try {
    const payload = cleanPayload({
      ...pkg,
      updatedAt: new Date().toISOString(),
    });
    await setDoc(doc(db, 'packages', docId), payload, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
    throw error;
  }
}

export async function deletePackageFromCloud(id: number | string): Promise<void> {
  const docId = sanitizeDocId(id);
  const path = `packages/${docId}`;
  try {
    await deleteDoc(doc(db, 'packages', docId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
    throw error;
  }
}

// 7. Companies
export function subscribeCompanies(
  onData: (data: Company[]) => void,
  onError?: (err: any) => void
) {
  const path = 'companies';
  return onSnapshot(
    collection(db, path),
    (snapshot) => {
      const items: Company[] = [];
      snapshot.forEach((d) => {
        items.push(d.data() as Company);
      });
      items.sort((a, b) => Number(a.id || 0) - Number(b.id || 0));
      onData(items);
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, path);
      if (onError) onError(error);
    }
  );
}

export async function saveCompanyToCloud(company: Company): Promise<void> {
  const docId = sanitizeDocId(company.id || company.kode || company.nama);
  const path = `companies/${docId}`;
  try {
    await setDoc(doc(db, 'companies', docId), cleanPayload(company), { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
    throw error;
  }
}

export async function deleteCompanyFromCloud(id: number | string): Promise<void> {
  const docId = sanitizeDocId(id);
  const path = `companies/${docId}`;
  try {
    await deleteDoc(doc(db, 'companies', docId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
    throw error;
  }
}

// 8. Doctors
export function subscribeDoctors(
  onData: (data: Doctor[]) => void,
  onError?: (err: any) => void
) {
  const path = 'doctors';
  return onSnapshot(
    collection(db, path),
    (snapshot) => {
      const items: Doctor[] = [];
      snapshot.forEach((d) => {
        items.push(d.data() as Doctor);
      });
      items.sort((a, b) => Number(a.id || 0) - Number(b.id || 0));
      onData(items);
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, path);
      if (onError) onError(error);
    }
  );
}

export async function saveDoctorToCloud(doctor: Doctor): Promise<void> {
  const docId = sanitizeDocId(doctor.id || doctor.kode || doctor.nama);
  const path = `doctors/${docId}`;
  try {
    await setDoc(doc(db, 'doctors', docId), cleanPayload(doctor), { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
    throw error;
  }
}

export async function deleteDoctorFromCloud(id: number | string): Promise<void> {
  const docId = sanitizeDocId(id);
  const path = `doctors/${docId}`;
  try {
    await deleteDoc(doc(db, 'doctors', docId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
    throw error;
  }
}

// 9. Exam Settings & Master Params (Physical, Lab, Templates, Clinic, Examiner Configs)
export function subscribeExamSetting(
  settingId: string,
  onData: (data: any) => void,
  onError?: (err: any) => void
) {
  const path = `exam_settings/${settingId}`;
  return onSnapshot(
    doc(db, 'exam_settings', settingId),
    (snapshot) => {
      if (snapshot.exists()) {
        onData(snapshot.data()?.value);
      }
    },
    (error) => {
      handleFirestoreError(error, OperationType.GET, path);
      if (onError) onError(error);
    }
  );
}

export async function saveExamSettingToCloud(settingId: string, value: any): Promise<void> {
  const path = `exam_settings/${settingId}`;
  try {
    await setDoc(
      doc(db, 'exam_settings', settingId),
      cleanPayload({
        id: settingId,
        value,
        updatedAt: new Date().toISOString(),
      }),
      { merge: true }
    );
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
    throw error;
  }
}

// 10. Real-time Examination Results (Lab, Fisik, Rontgen, EKG, Audiometri, Spirometri, USG, Treadmill, Resume)
export async function saveExamResultToCloud(
  mcuNo: string,
  modality: string,
  data: any
): Promise<void> {
  const docId = sanitizeDocId(`${mcuNo}_${modality}`);
  const path = `exam_results/${docId}`;
  try {
    const payload = cleanPayload({
      id: docId,
      mcuNo,
      modality,
      data,
      updatedAt: new Date().toISOString(),
    });
    await setDoc(doc(db, 'exam_results', docId), payload, { merge: true });

    // Also update locally
    try {
      localStorage.setItem(`simreg_${modality}_${mcuNo}`, JSON.stringify(data));
      window.dispatchEvent(
        new CustomEvent('simreg_exam_updated', {
          detail: { mcuNo, modality, data },
        })
      );
    } catch {}
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
    throw error;
  }
}

export function subscribeAllExamResults(
  onUpdate: (item: { mcuNo: string; modality: string; data: any }) => void
) {
  const path = 'exam_results';
  return onSnapshot(
    collection(db, path),
    (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        if (change.type === 'added' || change.type === 'modified') {
          const d = change.doc.data();
          if (d.mcuNo && d.modality && d.data) {
            // Save to local storage for instant offline access
            try {
              localStorage.setItem(`simreg_${d.modality}_${d.mcuNo}`, JSON.stringify(d.data));
              window.dispatchEvent(
                new CustomEvent('simreg_exam_updated', {
                  detail: { mcuNo: d.mcuNo, modality: d.modality, data: d.data },
                })
              );
            } catch {}
            onUpdate({ mcuNo: d.mcuNo, modality: d.modality, data: d.data });
          }
        }
      });
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, path);
    }
  );
}

// 11. Purge all dummy data from Cloud Firestore
export async function clearAllDummyDataFromCloud(): Promise<void> {
  // 1. Delete all participants
  const partSnap = await getDocs(collection(db, 'participants'));
  if (!partSnap.empty) {
    const batch1 = writeBatch(db);
    partSnap.forEach((d) => batch1.delete(d.ref));
    await batch1.commit();
  }

  // 2. Delete all exam results
  const examSnap = await getDocs(collection(db, 'exam_results'));
  if (!examSnap.empty) {
    const batch2 = writeBatch(db);
    examSnap.forEach((d) => batch2.delete(d.ref));
    await batch2.commit();
  }

  // 3. Delete dummy companies if any
  const compSnap = await getDocs(collection(db, 'companies'));
  if (!compSnap.empty) {
    const batch3 = writeBatch(db);
    compSnap.forEach((d) => {
      const data = d.data();
      if (
        ['PAN', 'PAI', 'SMS', 'CPT'].includes(data.kode) ||
        data.nama?.includes('PANARUB') ||
        data.nama?.includes('Contoh')
      ) {
        batch3.delete(d.ref);
      }
    });
    await batch3.commit();
  }

  // 4. Delete dummy packages if any
  const pkgSnap = await getDocs(collection(db, 'packages'));
  if (!pkgSnap.empty) {
    const batch4 = writeBatch(db);
    pkgSnap.forEach((d) => {
      const data = d.data();
      if (['PAN-RO', 'PAI-A', 'PAN-STD', 'PAN-EXEC'].includes(data.kode)) {
        batch4.delete(d.ref);
      }
    });
    await batch4.commit();
  }
}

