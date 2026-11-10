/**
 * @file student-service.ts
 * @description Database service for the `students` collection/table implementing Week 10 Slide 19:
 * - Realtime Cloud Firestore listener (`onSnapshot(query(collection(db, 'students'), orderBy('createdAt', 'desc')))`)
 * - Adding student records to Cloud Firestore (`addDoc(collection(db, 'students'), { ...input, createdAt: serverTimestamp() })`)
 * - Automatic initial seeding of the 5 students (Asep, Mamat, Yanto, Udin, Rahmat) into the database
 * - Offline-first synchronization with Local Storage (`AsyncStorage`) so data is always available
 */

import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  writeBatch,
} from 'firebase/firestore';

import { firestoreDb, isFirebaseConfigured } from '@/config/firebase';
import { STUDENTS_DATA, Student } from '@/constants/students';
import { getStudentsData, resetStudentsData, saveStudentsData } from '@/utils/storage';

/** Name of the Cloud Firestore collection / table storing student data */
export const STUDENTS_COLLECTION = 'students';

/**
 * Input payload for adding a new student record into the database.
 */
export interface StudentInput {
  nama: string;
  nim: string;
  programStudi: string;
}

/**
 * Internal listener set for notifying the UI when operating in offline/local-first mode.
 */
const localListeners = new Set<(students: Student[]) => void>();

function notifyLocalListeners(students: Student[]) {
  localListeners.forEach((listener) => listener(students));
}

/**
 * Seeds the Cloud Firestore `students` collection with the 5 initial student records
 * if the collection is currently empty.
 */
async function ensureFirestoreSeeded(): Promise<void> {
  if (!isFirebaseConfigured || !firestoreDb) return;

  try {
    const colRef = collection(firestoreDb, STUDENTS_COLLECTION);
    const snapshot = await getDocs(colRef);

    if (snapshot.empty) {
      const batch = writeBatch(firestoreDb);
      STUDENTS_DATA.forEach((student, idx) => {
        const newDocRef = doc(colRef, student.id);
        batch.set(newDocRef, {
          nama: student.nama,
          nim: student.nim,
          programStudi: student.programStudi,
          createdAt: Date.now() - idx * 1000,
        });
      });
      await batch.commit();
    }
  } catch (error) {
    console.warn('Firestore seed check skipped (using local storage cache):', error);
  }
}

/**
 * Subscribes to the `students` database table/collection in realtime (Week 10 Slide 19).
 * Immediately hydrates from Local Storage cache for instant UI rendering, and if Cloud Firestore
 * is configured, attaches an `onSnapshot` realtime listener that keeps UI and Local Storage in sync.
 *
 * @param onUpdate - Callback invoked whenever the student list in the database changes
 * @returns Unsubscribe cleanup function to be called on component unmount
 */
export function subscribeToStudents(onUpdate: (students: Student[]) => void): () => void {
  let active = true;

  // 1. Immediately hydrate from Local Storage cache for instant offline-first UI
  getStudentsData().then((cached) => {
    if (active) {
      onUpdate(cached);
    }
  });

  // Register local listener so local writes also update the UI immediately
  localListeners.add(onUpdate);

  // 2. If Cloud Firestore is configured, attach the realtime `onSnapshot` listener (Week 10 Slide 19)
  let firestoreUnsubscribe: (() => void) | null = null;

  if (isFirebaseConfigured && firestoreDb) {
    const db = firestoreDb;
    ensureFirestoreSeeded().then(() => {
      if (!active) return;

      const q = query(collection(db, STUDENTS_COLLECTION), orderBy('createdAt', 'desc'));
      firestoreUnsubscribe = onSnapshot(
        q,
        (snapshot) => {
          if (!active) return;
          const remoteStudents: Student[] = snapshot.docs.map((docSnap) => {
            const data = docSnap.data();
            return {
              id: docSnap.id,
              nama: String(data.nama ?? ''),
              nim: String(data.nim ?? ''),
              programStudi: String(data.programStudi ?? 'Informatika'),
            };
          });

          if (remoteStudents.length > 0) {
            saveStudentsData(remoteStudents);
            onUpdate(remoteStudents);
          }
        },
        (error) => {
          console.warn('Firestore realtime listener fallback to local cache:', error);
        }
      );
    });
  }

  // Cleanup function for useEffect unmount (Week 9 Slide 14 & Week 10 Slide 19)
  return () => {
    active = false;
    localListeners.delete(onUpdate);
    if (firestoreUnsubscribe) {
      firestoreUnsubscribe();
    }
  };
}

/**
 * Inserts a new student record into the Cloud Firestore `students` collection (`addDoc`)
 * and updates the Local Storage cache (Week 10 Slide 19).
 *
 * @param input - Student fields (`nama`, `nim`, `programStudi`)
 * @returns The newly created `Student` record
 */
export async function addStudentToDatabase(input: StudentInput): Promise<Student> {
  const newStudent: Student = {
    id: `mhs-${Date.now()}`,
    nama: input.nama.trim(),
    nim: input.nim.trim(),
    programStudi: input.programStudi.trim() || 'Informatika',
  };

  // Update local storage cache immediately (offline-first instant UI)
  const current = await getStudentsData();
  const updated = [...current, newStudent];
  await saveStudentsData(updated);
  notifyLocalListeners(updated);

  // Persist to Cloud Firestore `students` collection if Firebase is configured (Week 10 Slide 19)
  if (isFirebaseConfigured && firestoreDb) {
    try {
      await addDoc(collection(firestoreDb, STUDENTS_COLLECTION), {
        nama: newStudent.nama,
        nim: newStudent.nim,
        programStudi: newStudent.programStudi,
        createdAt: serverTimestamp(),
      });
    } catch (error) {
      console.warn('Saved student locally; Firestore sync pending:', error);
    }
  }

  return newStudent;
}

/**
 * Resets the student database table back to the 5 default students (Asep, Mamat, Yanto, Udin, Rahmat).
 */
export async function resetStudentsInDatabase(): Promise<Student[]> {
  const initial = await resetStudentsData();
  notifyLocalListeners(initial);

  if (isFirebaseConfigured && firestoreDb) {
    try {
      const colRef = collection(firestoreDb, STUDENTS_COLLECTION);
      const snapshot = await getDocs(colRef);
      const deletePromises = snapshot.docs.map((d) => deleteDoc(doc(firestoreDb!, STUDENTS_COLLECTION, d.id)));
      await Promise.all(deletePromises);
      await ensureFirestoreSeeded();
    } catch (error) {
      console.warn('Local student list reset; Firestore reset skipped:', error);
    }
  }

  return initial;
}

