/**
 * @file students.ts
 * @description Hardcoded student dataset and TypeScript interfaces for the PPK Class Dashboard.
 * Contains 5 student records (Asep, Mamat, Yanto, Udin, Rahmat) all in the Informatika study program,
 * with NIM format `240601241<2|3|4>0<3 digits>`.
 */

/**
 * Represents a single student record displayed on the dashboard.
 */
export interface Student {
  /** Unique identifier for rendering list keys */
  id: string;
  /** Name of the student (Nama Mahasiswa) */
  nama: string;
  /** Student identification number (Nomor Induk Mahasiswa / NIM) */
  nim: string;
  /** Study program or major (Program Studi) */
  programStudi: string;
}

/**
 * Hardcoded list of 5 students containing Nama, NIM (`240601241<2|3|4>0<3 digits>`), and Program Studi (`Informatika`).
 */
export const STUDENTS_DATA: readonly Student[] = [
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
