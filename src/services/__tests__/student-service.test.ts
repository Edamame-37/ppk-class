/* eslint-disable import/first */
const mockAddDoc = jest.fn();
const mockDeleteDoc = jest.fn();

jest.mock('firebase/firestore', () => ({
  addDoc: (...args: unknown[]) => mockAddDoc(...args),
  collection: jest.fn(),
  deleteDoc: (...args: unknown[]) => mockDeleteDoc(...args),
  doc: jest.fn(),
  getDocs: jest.fn(),
  onSnapshot: jest.fn(),
  orderBy: jest.fn(),
  query: jest.fn(),
  serverTimestamp: jest.fn(),
  setDoc: jest.fn(),
}));
jest.mock('@/config/firebase', () => ({ firestoreDb: {} }));

import {
  addStudentToDatabase,
  deleteStudentFromDatabase,
} from '@/services/student-service';

describe('student-service writes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('does not report a local success when Firestore rejects a write', async () => {
    mockAddDoc.mockRejectedValueOnce({
      code: 'permission-denied',
      message: 'Missing or insufficient permissions',
    });

    await expect(
      addStudentToDatabase({ nama: 'Ayu', nim: '123', programStudi: 'Informatika' })
    ).rejects.toThrow('tidak tersimpan');
  });

  it('surfaces a failed Firestore deletion', async () => {
    mockDeleteDoc.mockRejectedValueOnce({ code: 'permission-denied' });
    await expect(deleteStudentFromDatabase('student-1')).rejects.toThrow('tidak dihapus');
  });
});
