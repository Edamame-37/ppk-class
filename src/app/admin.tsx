import { AdminPasswordSetup } from '@/components/admin-password-setup';
import { StudentDashboard } from '@/components/student-dashboard';

export default function SuperAdminDashboardScreen() {
  return (
    <StudentDashboard
      title="Dashboard Super Admin"
      headerAccessory={<AdminPasswordSetup />}
    />
  );
}
