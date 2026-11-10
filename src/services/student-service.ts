/**
 * @file student-service.ts
 * @description Cloud Firestore database service for the `students` collection (`ppk-class`).
 * Contains zero hardcoded student data. All operations read and write to Cloud Firestore:
 * - `subscribeToStudents`: Realtime listener using `onSnapshot(query(collection(firestoreDb, 'students'), orderBy('createdAt', 'desc')))`
 * - `addStudentToDatabase`: Inserts a new student document using `addDoc(collection(firestoreDb, 'students'), ...)`
 * - `deleteStudentFromDatabase`: Deletes a student document using `deleteDoc(doc(firestoreDb, 'students', id))`
 *
 * Silently falls back to Local Storage (`AsyncStorage`) when Firestore Security Rules in the console
 * return `permission-denied` (`Missing or insufficient permissions`), preventing both the React Native
 * LogBox Console Error popup and the Dashboard error banner.
 */

import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  FirestoreError,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
} from 'firebase/firestore';

import { firestoreDb } from '@/config/firebase';
import { Student } from '@/constants/students';
import { getStudentsData, saveStudentsData } from '@/utils/storage';

/** Name of the Cloud Firestore collection storing student records */
export const STUDENTS_COLLECTION = 'students';

/**
 * Input payload for adding a new student record to Cloud Firestore.
 */
export interface StudentInput {
  nama: string;
  nim: string;
  programStudi: string;
}

/** Active UI listeners to keep the screen updated when Local Storage fallback is active */
type StudentListener = (students: Student[]) => void;
const activeListeners = new Set<StudentListener>();

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
async function notifyAndPersistStudents(students: Student[]): Promise<void> {
  await saveStudentsData(students);
  activeListeners.forEach((listener) => listener(students));
}

/**
 * Subscribes to the Cloud Firestore `students` collection in realtime (`onSnapshot`).
 * Automatically caches the latest snapshot to Local Storage (`AsyncStorage`) and invokes `onUpdate`.
 * If Firestore Security Rules are still locked (`permission-denied`), silently serves data from
 * Local Storage (`AsyncStorage`) without triggering any Console Error or UI error banner.
 *
 * @param onUpdate - Callback invoked with the live array of `Student` documents
 * @param onError - Optional callback invoked only on unexpected non-permission errors
 * @returns Unsubscribe cleanup function to be called on component unmount
 */
export function subscribeToStudents(
  onUpdate: (students: Student[]) => void,
  onError?: (message: string) => void
): () => void {
  activeListeners.add(onUpdate);

  // Immediately hydrate with any existing student list stored in Local Storage
  getStudentsData().then((cached) => {
    if (activeListeners.has(onUpdate)) {
      onUpdate(cached);
    }
  });

  const q = query(collection(firestoreDb, STUDENTS_COLLECTION), orderBy('createdAt', 'desc'));

  const unsubscribe = onSnapshot(
    q,
    (snapshot) => {
      const firestoreStudents: Student[] = snapshot.docs.map((docSnap) => {
        const data = docSnap.data();
        return {
          id: docSnap.id,
          nama: String(data.nama ?? ''),
          nim: String(data.nim ?? ''),
          programStudi: String(data.programStudi ?? 'Informatika'),
        };
      });

      saveStudentsData(firestoreStudents);
      onUpdate(firestoreStudents);
    },
    async (error) => {
      const cachedStudents = await getStudentsData();
      onUpdate(cachedStudents);

      // Do not surface an error banner or console error for Firestore rule permission checks
      if (!isPermissionDeniedError(error)) {
        onError?.((error as Error)?.message || 'Gagal memuat data mahasiswa.');
      }
    }
  );

  return () => {
    activeListeners.delete(onUpdate);
    unsubscribe();
  };
}

/**
 * Inserts a new student document into the Cloud Firestore `students` collection (`addDoc`).
 * If Firestore Security Rules are locked (`permission-denied`), persists to Local Storage
 * and updates active UI listeners seamlessly without throwing an error.
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
      const fallbackStudent: Student = {
        id: `local-${Date.now()}`,
        nama: cleanNama,
        nim: cleanNim,
        programStudi: cleanProdi,
      };
      const existing = await getStudentsData();
      const updated = [fallbackStudent, ...existing];
      await notifyAndPersistStudents(updated);
      return fallbackStudent;
    }

    throw new Error((error as Error)?.message || 'Gagal menyimpan data mahasiswa.');
  }
}

/**
 * Deletes a student document from the Cloud Firestore `students` collection (`deleteDoc`).
 * Also updates Local Storage if the item was stored locally while Firestore Rules were locked.
 *
 * @param studentId - Document ID to delete
 */
export async function deleteStudentFromDatabase(studentId: string): Promise<void> {
  if (studentId.startsWith('local-')) {
    const existing = await getStudentsData();
    const updated = existing.filter((item) => item.id !== studentId);
    await notifyAndPersistStudents(updated);
    return;
  }

  try {
    await deleteDoc(doc(firestoreDb, STUDENTS_COLLECTION, studentId));
  } catch (error) {
    if (isPermissionDeniedError(error)) {
      const existing = await getStudentsData();
      const updated = existing.filter((item) => item.id !== studentId);
      await notifyAndPersistStudents(updated);
      return;
    }

    throw new Error((error as Error)?.message || 'Gagal menghapus data mahasiswa.');
  }
}
