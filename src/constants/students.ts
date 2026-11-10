/**
 * @file students.ts
 * @description TypeScript interface and initial 5-student seed dataset for the
 * Cloud Firestore `students` collection and Local Storage (`AsyncStorage`).
 */

/**
 * Represents a single student record stored in Cloud Firestore (`students` collection)
 * and persisted in Local Storage (`AsyncStorage`).
 */
export interface Student {
  /** Firestore document ID */
  id: string;
  /** Name of the student (Nama Mahasiswa) */
  nama: string;
  /** Student identification number (Nomor Induk Mahasiswa / NIM) */
  nim: string;
  /** Study program or major (Program Studi) */
  programStudi: string;
}

/**
 * Initial 5 students to be seeded into the database (`students` collection)
 * and synced into Local Storage after clearing any previous manual test inputs.
 */
export const INITIAL_STUDENTS_SEED: readonly Student[] = [
  {
    id: 'mhs-1',
    nama: 'Asep',
    nim: '24060124120014',
    programStudi: 'Informatika',
  },
  {
    id: 'mhs-2',
    nama: 'Mamat',
    nim: '24060124130058',
    programStudi: 'Informatika',
  },
  {
    id: 'mhs-3',
    nama: 'Yanto',
    nim: '24060124140112',
    programStudi: 'Informatika',
  },
  {
    id: 'mhs-4',
    nama: 'Udin',
    nim: '24060124120037',
    programStudi: 'Informatika',
  },
  {
    id: 'mhs-5',
    nama: 'Rahmat',
    nim: '24060124140145',
    programStudi: 'Informatika',
  },
];
