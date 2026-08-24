import { useState, useEffect } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { Topbar } from './Topbar'
import { MobileNav } from './MobileNav'
import { useSyncStore } from '@/store/sync.store'

const PAGE_TITLES: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/students': 'Student Management',
  '/parents': 'Parents & Guardians',
  '/staff': 'Teachers & Staff',
  '/classes': 'Classes & Streams',
  '/subjects': 'Subjects & Curriculum',
  '/academic-years': 'Academic Calendar',
  '/attendance': 'Attendance Register',
  '/exams': 'Examinations & Marks',
  '/fees': 'Bursar & Accounts Department',
  '/reports': 'Institutional Reports',
  '/announcements': 'School Announcements',
  '/audit': 'System Audit Trail',
  '/settings': 'Institution Settings',
  '/settings/profile': 'Profile & Preferences',
  '/search': 'Global Search',
}

export function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const location = useLocation()
  const { setStatus } = useSyncStore()

  // Track online/offline browser state
  useEffect(() => {
    const handleOnline = () => setStatus('online')
    const handleOffline = () => setStatus('offline')

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [setStatus])

  // Get current page title
  const currentTitle = PAGE_TITLES[location.pathname] || 'ZentraOS'

  return (
    <div className="min-h-screen bg-surface-50">
      {/* Sidebar */}
      <Sidebar
        isOpen={sidebarOpen}
        isCollapsed={sidebarCollapsed}
        onClose={() => setSidebarOpen(false)}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
      />

      {/* Main container */}
      <div
        className="layout-main transition-all duration-300 flex flex-col min-h-screen"
        style={{
          marginLeft: typeof window !== 'undefined' && window.innerWidth >= 1024
            ? sidebarCollapsed ? '72px' : '260px'
            : '0'
        }}
      >
        <Topbar
          onMenuClick={() => setSidebarOpen(true)}
          title={currentTitle}
        />

        <main className="flex-1 p-4 md:p-6 max-w-7xl w-full mx-auto pb-24 lg:pb-8">
          <Outlet />
        </main>

        <MobileNav />
      </div>
    </div>
  )
}
