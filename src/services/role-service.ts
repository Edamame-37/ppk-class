import type { User } from 'firebase/auth';

import type { UserRole } from '@/utils/storage';

const SUPER_ADMIN_EMAIL = 'asephijau12@gmail.com';

export function isSuperAdminEmail(email: string | null | undefined): boolean {
  return email?.trim().toLowerCase() === SUPER_ADMIN_EMAIL;
}

export async function syncAndReadUserRole(user: User): Promise<UserRole> {
  return isSuperAdminEmail(user.email) ? 'super_admin' : 'user';
}
