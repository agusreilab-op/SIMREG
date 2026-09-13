/**
 * Utility to purge all dummy/sample data from LocalStorage and Cloud Firestore.
 */
import { clearAllDummyDataFromCloud } from '../lib/firebase';

export function purgeLocalDummyData(): { removedKeysCount: number } {
  const keysToRemove: string[] = [];
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key) continue;

      // 1. Exam results & resumes for dummy participants
      if (
        key.startsWith('simreg_fisik_') ||
        key.startsWith('simreg_lab_') ||
        key.startsWith('simreg_rontgen_') ||
        key.startsWith('simreg_ekg_') ||
        key.startsWith('simreg_audiometri_') ||
        key.startsWith('simreg_spirometri_') ||
        key.startsWith('simreg_treadmill_') ||
        key.startsWith('simreg_usg_') ||
        key.startsWith('simreg_resume_') ||
        key.startsWith('simreg_photo_')
      ) {
        if (
          key.includes('PAN-') ||
          key.includes('PAI-') ||
          key.includes('CPT-') ||
          key.includes('MCU-2025') ||
          key.includes('001') ||
          key.includes('002') ||
          key.includes('003') ||
          key.includes('004') ||
          key.includes('005')
        ) {
          keysToRemove.push(key);
        }
      }

      // 2. Active patient selector cache
      if (key === 'simreg_active_patient_mcu') {
        const val = localStorage.getItem(key);
        if (val && (val.includes('PAN-') || val.includes('PAI-') || val.includes('CPT-'))) {
          keysToRemove.push(key);
        }
      }

      // 3. Stale packages with dummy company names
      if (key === 'simreg_packages') {
        const val = localStorage.getItem(key);
        if (val && (val.includes('PAN-RO') || val.includes('PT. PANARUB') || val.includes('PAI-A'))) {
          keysToRemove.push(key);
        }
      }

      // 4. Stale companies with dummy company names
      if (key === 'simreg_companies') {
        const val = localStorage.getItem(key);
        if (val && (val.includes('PANARUB') || val.includes('Pratama Abadi') || val.includes('Contoh Perkasa'))) {
          keysToRemove.push(key);
        }
      }

      // 5. Stale examiner configs with dummy company names
      if (key === 'simreg_examiner_configs') {
        const val = localStorage.getItem(key);
        if (val && (val.includes('PANARUB') || val.includes('Pratama Abadi'))) {
          keysToRemove.push(key);
        }
      }
    }

    keysToRemove.forEach((k) => localStorage.removeItem(k));
  } catch (err) {
    console.error('Error during local dummy data purge:', err);
  }

  return { removedKeysCount: keysToRemove.length };
}

export async function purgeAllDataEverywhere(): Promise<{ success: boolean; message: string }> {
  try {
    // 1. Purge LocalStorage
    purgeLocalDummyData();

    // 2. Purge Firestore Cloud Data
    await clearAllDummyDataFromCloud();

    return {
      success: true,
      message: 'Semua data dami (peserta, hasil pemeriksaan, dan data sampel) berhasil dihapus bersih!',
    };
  } catch (error: any) {
    console.error('Error purging cloud dummy data:', error);
    return {
      success: false,
      message: error?.message || 'Gagal menghapus data dari Cloud Firestore.',
    };
  }
}
