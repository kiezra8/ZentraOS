import { createBrowserRouter, Navigate } from 'react-router-dom'
import { AppLayout } from '@/components/layout/AppLayout'
import { LoginPage } from '@/features/auth/LoginPage'
import { ResetPasswordPage } from '@/features/auth/ResetPasswordPage'
import { OnboardingWizard } from '@/features/onboarding/OnboardingWizard'
import { DashboardPage } from '@/features/dashboard/DashboardPage'
import { StudentsListPage } from '@/features/students/StudentsListPage'
import { ParentsListPage } from '@/features/parents/ParentsListPage'
import { StaffListPage } from '@/features/staff/StaffListPage'
import { ClassesListPage } from '@/features/classes/ClassesListPage'
import { SubjectsListPage } from '@/features/subjects/SubjectsListPage'
import { AcademicYearsPage } from '@/features/academic-years/AcademicYearsPage'
import { AttendancePage } from '@/features/attendance/AttendancePage'
import { ExamsPage } from '@/features/exams/ExamsPage'
import { FeesPage } from '@/features/fees/FeesPage'
import { ReportsPage } from '@/features/reports/ReportsPage'
import { AnnouncementsPage } from '@/features/announcements/AnnouncementsPage'
import { AuditLogsPage } from '@/features/audit/AuditLogsPage'
import { SettingsPage } from '@/features/settings/SettingsPage'
import { SearchPage } from '@/features/search/SearchPage'
import { useAuthStore } from '@/store/auth.store'

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuthStore()
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }
  return <>{children}</>
}

export const router = createBrowserRouter([
  {
    path: '/login',
    element: <LoginPage />,
  },
  {
    path: '/reset-password',
    element: <ResetPasswordPage />,
  },
  {
    path: '/onboarding',
    element: <OnboardingWizard />,
  },
  {
    path: '/',
    element: (
      <ProtectedRoute>
        <AppLayout />
      </ProtectedRoute>
    ),
    children: [
      {
        index: true,
        element: <Navigate to="/dashboard" replace />,
      },
      {
        path: 'dashboard',
        element: <DashboardPage />,
      },
      {
        path: 'students',
        element: <StudentsListPage />,
      },
      {
        path: 'parents',
        element: <ParentsListPage />,
      },
      {
        path: 'staff',
        element: <StaffListPage />,
      },
      {
        path: 'classes',
        element: <ClassesListPage />,
      },
      {
        path: 'subjects',
        element: <SubjectsListPage />,
      },
      {
        path: 'academic-years',
        element: <AcademicYearsPage />,
      },
      {
        path: 'attendance',
        element: <AttendancePage />,
      },
      {
        path: 'exams',
        element: <ExamsPage />,
      },
      {
        path: 'fees',
        element: <FeesPage />,
      },
      {
        path: 'reports',
        element: <ReportsPage />,
      },
      {
        path: 'announcements',
        element: <AnnouncementsPage />,
      },
      {
        path: 'audit',
        element: <AuditLogsPage />,
      },
      {
        path: 'settings',
        element: <SettingsPage />,
      },
      {
        path: 'settings/profile',
        element: <SettingsPage />,
      },
      {
        path: 'search',
        element: <SearchPage />,
      },
    ],
  },
  {
    path: '*',
    element: <Navigate to="/login" replace />,
  },
])
