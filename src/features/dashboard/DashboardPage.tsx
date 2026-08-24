import { useAuthStore } from '@/store/auth.store'
import { AdminDashboard } from './AdminDashboard'
import { TeacherDashboard } from './TeacherDashboard'
import { BursarDashboard } from './BursarDashboard'
import { ParentDashboard } from './ParentDashboard'
import { StudentDashboard } from './StudentDashboard'

export function DashboardPage() {
  const { user } = useAuthStore()
  const role = user?.role || 'school_admin'

  switch (role) {
    case 'teacher':
      return <TeacherDashboard />
    case 'bursar':
      return <BursarDashboard />
    case 'parent':
      return <ParentDashboard />
    case 'student':
      return <StudentDashboard />
    case 'super_admin':
    case 'school_admin':
    case 'head_teacher':
    case 'deputy_head':
    case 'registrar':
    default:
      return <AdminDashboard />
  }
}
