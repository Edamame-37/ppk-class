import type { User } from 'firebase/auth';

import { syncAndReadUserRole } from '@/services/role-service';

function createUser(email: string | null, emailVerified: boolean): User {
  return { email, emailVerified } as User;
}

describe('syncAndReadUserRole', () => {
  it('assigns Super Admin to the configured email for every provider state', async () => {
    await expect(
      syncAndReadUserRole(createUser('ASEPHIJAU12@gmail.com', true))
    ).resolves.toBe('super_admin');
    await expect(
      syncAndReadUserRole(createUser('asephijau12@gmail.com', false))
    ).resolves.toBe('super_admin');
  });

  it('keeps different emails as regular users', async () => {
    await expect(
      syncAndReadUserRole(createUser('student@example.com', true))
    ).resolves.toBe('user');
  });
});
