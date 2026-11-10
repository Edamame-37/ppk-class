/**
 * @file student-service.ts
 * @description Real Cloud Firestore database service for the `students` collection (`ppk-class`).
 * Contains zero hardcoded student data. All operations read and write directly to Cloud Firestore:
 * - `subscribeToStudents`: Realtime listener using `onSnapshot(query(collection(firestoreDb, 'students'), orderBy('createdAt', 'desc')))`
 * - `addStudentToDatabase`: Inserts a new student document using `addDoc(collection(firestoreDb, 'students'), ...)`
 * - `deleteStudentFromDatabase`: Deletes a student document using `deleteDoc(doc(firestoreDb, 'students', id))`
 */

import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
} from 'firebase/firestore';

import { firestoreDb } from '@/config/firebase';
import { Student } from '@/constants/students';
import { saveStudentsData } from '@/utils/storage';

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

/**
 * Subscribes to the Cloud Firestore `students` collection in realtime (`onSnapshot`).
 * Automatically caches the latest snapshot to Local Storage (`AsyncStorage`) and invokes `onUpdate`.
 *
 * @param onUpdate - Callback invoked with the live array of `Student` documents from Firestore
 * @param onError - Optional callback invoked if Firestore reports a permission or network error
 * @returns Unsubscribe cleanup function to be called on component unmount
 */
export function subscribeToStudents(
  onUpdate: (students: Student[]) => void,
  onError?: (message: string) => void
): () => void {
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
    (error) => {
      console.error('Cloud Firestore onSnapshot error:', error);
      onError?.(error.message || 'Gagal memuat data mahasiswa dari Cloud Firestore.');
    }
  );

  return () => {
    unsubscribe();
  };
}

/**
 * Inserts a new student document directly into the Cloud Firestore `students` collection (`addDoc`).
 *
 * @param input - Student fields (`nama`, `nim`, `programStudi`)
 * @returns The newly created `Student` record with its Firestore document ID
 */
export async function addStudentToDatabase(input: StudentInput): Promise<Student> {
  const cleanNama = input.nama.trim();
  const cleanNim = input.nim.trim();
  const cleanProdi = input.programStudi.trim() || 'Informatika';

  if (!cleanNama || !cleanNim) {
    throw new Error('Nama dan NIM mahasiswa wajib diisi.');
  }

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
}

/**
 * Deletes a student document from the Cloud Firestore `students` collection (`deleteDoc`).
 *
 * @param studentId - Firestore document ID to delete
 */
export async function deleteStudentFromDatabase(studentId: string): Promise<void> {
  await deleteDoc(doc(firestoreDb, STUDENTS_COLLECTION, studentId));
}
