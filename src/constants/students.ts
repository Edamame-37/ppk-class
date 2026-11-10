/**
 * @file students.ts
 * @description Hardcoded student dataset and TypeScript interfaces for the PPK Class Dashboard.
 * No server-side or API calls are made here; this provides static data for initial UI rendering.
 */

/**
 * Represents a single student record displayed on the dashboard.
 */
export interface Student {
  /** Unique identifier for rendering list keys */
  id: string;
  /** Full name of the student (Nama Mahasiswa) */
  nama: string;
  /** Student identification number (Nomor Induk Mahasiswa / NIM) */
  nim: string;
  /** Study program or major (Program Studi) */
  programStudi: string;
}

/**
 * Hardcoded list of 5 students containing Nama, NIM, and Program Studi.
 */
export const STUDENTS_DATA: readonly Student[] = [
  {
    id: 'mhs-1',
    nama: 'Ahmad Fauzan Pratama',
    nim: '220101001',
    programStudi: 'Teknik Informatika',
  },
  {
    id: 'mhs-2',
    nama: 'Siti Aisyah Putri',
    nim: '220102014',
    programStudi: 'Sistem Informasi',
  },
  {
    id: 'mhs-3',
    nama: 'Budi Santoso Wijaya',
    nim: '220101028',
    programStudi: 'Teknik Informatika',
  },
  {
    id: 'mhs-4',
    nama: 'Nabila Rahmawati',
    nim: '220103009',
    programStudi: 'Teknologi Informasi',
  },
  {
    id: 'mhs-5',
    nama: 'Dimas Aditya Saputra',
    nim: '220102033',
    programStudi: 'Sistem Informasi',
  },
];
