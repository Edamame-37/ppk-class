import AsyncStorage from '@react-native-async-storage/async-storage';

import {
  getStudentsData,
  getUserSession,
  saveStudentsData,
  saveUserSession,
  STORAGE_KEYS,
} from '@/utils/storage';

describe('storage', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
  });

  it('persists valid student records', async () => {
    const students = [
      { id: '1', nama: 'Ayu', nim: '123', programStudi: 'Informatika' },
    ];
    await saveStudentsData(students);
    await expect(getStudentsData()).resolves.toEqual(students);
  });

  it('filters malformed records from the cache', async () => {
    await AsyncStorage.setItem(
      STORAGE_KEYS.STUDENTS_LIST,
      JSON.stringify([{ id: '1', nama: 'Ayu' }])
    );
    await expect(getStudentsData()).resolves.toEqual([]);
  });

  it('stores session metadata without an ID token', async () => {
    await saveUserSession({
      uid: 'uid-1',
      email: 'user@example.com',
      loginMethod: 'email',
      providers: ['password'],
      role: 'user',
      rememberMe: true,
      loggedInAt: '2026-11-17T00:00:00.000Z',
    });
    const session = await getUserSession();
    expect(session).toMatchObject({ uid: 'uid-1', rememberMe: true });
    expect(session).not.toHaveProperty('token');
    expect(session).not.toHaveProperty('password');
  });
});
