/**
 * @file students.ts
 * @description TypeScript interface representing a student document stored in the
 * Cloud Firestore `students` collection. Contains no hardcoded data.
 */

/**
 * Represents a single student record stored in Cloud Firestore (`students` collection).
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
