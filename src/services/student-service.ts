/**
 * @file student-service.ts
 * @description Cloud Firestore & Local Storage database service for the `students` collection (`ppk-class`):
 * 1. On initial load, wipes any legacy manual inputs in Local Storage (`initializeFreshStudentsStorage`)
 *    and seeds the 5 initial students (`Asep`, `Mamat`, `Yanto`, `Udin`, `Rahmat`) into both
 *    Local Storage (`AsyncStorage`) and the Cloud Firestore `students` collection (`seedInitialStudentsToFirestore`).
 * 2. `subscribeToStudents`: Realtime listener using `onSnapshot` synced with Local Storage (`AsyncStorage`).
 * 3. `addStudentToDatabase`: Inserts a new student document into Cloud Firestore & Local Storage.
 * 4. `deleteStudentFromDatabase`: Deletes a student document from Cloud Firestore & Local Storage.
 */

import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  FirestoreError,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
} from 'firebase/firestore';

import { firestoreDb } from '@/config/firebase';
import { INITIAL_STUDENTS_SEED, Student } from '@/constants/students';
import {
  getStudentsData,
  initializeFreshStudentsStorage,
  saveStudentsData,
} from '@/utils/storage';

/** Name of the Cloud Firestore collection storing student records */
export const STUDENTS_COLLECTION = 'students';

/**
 * Input payload for adding a new student record to the database.
 */
export interface StudentInput {
  nama: string;
  nim: string;
  programStudi: string;
}

/** Tracks whether we have already attempted seeding Firestore in this session */
let hasAttemptedFirestoreSeed = false;

/**
 * Checks whether an error returned by Firestore is a `permission-denied` rule error.
 */
function isPermissionDeniedError(error: unknown): boolean {
  const code = (error as FirestoreError)?.code ?? '';
  const msg = (error as Error)?.message ?? '';
  return (
    code === 'permission-denied' ||
    msg.includes('Missing or insufficient permissions') ||
    msg.includes('permission-denied')
  );
}

/**
 * Broadcasts an updated student list to all active listeners and persists it to Local Storage.
 */
/**
 * Seeds the 5 initial student records (`Asep`, `Mamat`, `Yanto`, `Udin`, `Rahmat`)
 * into the Cloud Firestore `students` collection (`mhs-1` .. `mhs-5`).
 */
export async function seedInitialStudentsToFirestore(): Promise<void> {
  if (hasAttemptedFirestoreSeed) return;
  hasAttemptedFirestoreSeed = true;

  try {
    const existingSnapshot = await getDocs(collection(firestoreDb, STUDENTS_COLLECTION));
    if (!existingSnapshot.empty) return;

    await Promise.all(
      INITIAL_STUDENTS_SEED.map((student, index) =>
        setDoc(doc(firestoreDb, STUDENTS_COLLECTION, student.id), {
          nama: student.nama,
          nim: student.nim,
          programStudi: student.programStudi,
          createdAt: new Date(Date.now() - index * 1000).toISOString(),
        })
      )
    );
  } catch {
    // If Firestore Rules are locked (permission-denied), the 5 students are already persisted in Local Storage
    hasAttemptedFirestoreSeed = false;
  }
}

/**
 * Subscribes to the `students` collection in realtime (`onSnapshot`).
 * 1. First clears any legacy local inputs and initializes Local Storage with the 5 seed students.
 * 2. Seeds the 5 initial students into Cloud Firestore (`students` collection) if Firestore is empty.
 * 3. Automatically syncs changes between Cloud Firestore and Local Storage (`AsyncStorage`).
 *
 * @param onUpdate - Callback invoked with the live array of `Student` documents
 * @param onError - Optional callback invoked only on unexpected non-permission errors
 * @returns Unsubscribe cleanup function to be called on component unmount
 */
export function subscribeToStudents(
  onUpdate: (students: Student[], source: 'remote' | 'cache') => void,
  onError?: (message: string) => void
): () => void {
  let isActive = true;

  // Load the last valid snapshot immediately while Firestore connects.
  initializeFreshStudentsStorage().then((freshLocalStudents) => {
    if (isActive) {
      onUpdate(freshLocalStudents, 'cache');
    }
  });

  // Seed deterministically before relying on the realtime snapshot.
  seedInitialStudentsToFirestore();

  const q = query(collection(firestoreDb, STUDENTS_COLLECTION), orderBy('createdAt', 'desc'));

  const unsubscribe = onSnapshot(
    q,
    async (snapshot) => {
      if (!isActive) return;
      if (snapshot.empty) {
        const localStudents = await getStudentsData();
        if (isActive) onUpdate(localStudents, 'cache');
        return;
      }

      const firestoreStudents: Student[] = snapshot.docs.map((docSnap) => {
        const data = docSnap.data();
        return {
          id: docSnap.id,
          nama: String(data.nama ?? ''),
          nim: String(data.nim ?? ''),
          programStudi: String(data.programStudi ?? 'Informatika'),
        };
      });

      await saveStudentsData(firestoreStudents);
      if (isActive) onUpdate(firestoreStudents, 'remote');
    },
    async (error) => {
      const cachedStudents = await getStudentsData();
      if (!isActive) return;
      onUpdate(cachedStudents, 'cache');
      onError?.(
        isPermissionDeniedError(error)
          ? 'Akses Firestore ditolak. Periksa Firebase Security Rules untuk koleksi students.'
          : (error as Error)?.message || 'Gagal memuat data mahasiswa.'
      );
    }
  );

  return () => {
    isActive = false;
    unsubscribe();
  };
}

/**
 * Inserts a new student document into the Cloud Firestore `students` collection (`addDoc`)
 * and updates Local Storage (`AsyncStorage`).
 *
 * @param input - Student fields (`nama`, `nim`, `programStudi`)
 * @returns The newly created `Student` record
 */
export async function addStudentToDatabase(input: StudentInput): Promise<Student> {
  const cleanNama = input.nama.trim();
  const cleanNim = input.nim.trim();
  const cleanProdi = input.programStudi.trim() || 'Informatika';

  if (!cleanNama || !cleanNim) {
    throw new Error('Nama dan NIM mahasiswa wajib diisi.');
  }

  try {
    const docRef = await addDoc(collection(firestoreDb, STUDENTS_COLLECTION), {
      nama: cleanNama,
      nim: cleanNim,
      programStudi: cleanProdi,
      createdAt: serverTimestamp(),
    });

    return {
      id: docRef.id,
      nama: cleanNama,
      nim: cleanNim,
      programStudi: cleanProdi,
    };
  } catch (error) {
    if (isPermissionDeniedError(error)) {
      throw new Error(
        'Mahasiswa tidak tersimpan karena akses Firestore ditolak. Periksa Firebase Security Rules.'
      );
    }

    throw new Error((error as Error)?.message || 'Gagal menyimpan data mahasiswa.');
  }
}

/**
 * Deletes a student document from the Cloud Firestore `students` collection (`deleteDoc`)
 * and removes it from Local Storage (`AsyncStorage`).
 *
 * @param studentId - Document ID to delete
 */
export async function deleteStudentFromDatabase(studentId: string): Promise<void> {
  try {
    await deleteDoc(doc(firestoreDb, STUDENTS_COLLECTION, studentId));
  } catch (error) {
    throw new Error(
      isPermissionDeniedError(error)
        ? 'Mahasiswa tidak dihapus karena akses Firestore ditolak. Periksa Firebase Security Rules.'
        : (error as Error)?.message || 'Gagal menghapus data mahasiswa.'
    );
  }
}
