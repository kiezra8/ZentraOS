import { NavLink, useLocation } from 'react-router-dom'
import {
  LayoutDashboard, Users, UserCheck, GraduationCap, CalendarDays,
  ClipboardList, BookOpen, CreditCard, BarChart3, Settings,
  ChevronLeft, ChevronRight, Building2, Shield, BookMarked,
  Stethoscope, Package, Bell, FileText, X
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/store/auth.store'
import { useInstitutionStore } from '@/store/institution.store'
import { Avatar } from '@/components/ui/Avatar'

interface NavItem {
  label: string
  to: string
  icon: React.ComponentType<{ className?: string }>
  permission?: string
  badge?: string | number
}

interface NavSection {
  label: string
  items: NavItem[]
}

const NAV_SECTIONS: NavSection[] = [
  {
    label: 'Overview',
    items: [
      { label: 'Dashboard', to: '/dashboard', icon: LayoutDashboard },
    ],
  },
  {
    label: 'People',
    items: [
      { label: 'Students', to: '/students', icon: GraduationCap, permission: 'students.view' },
      { label: 'Parents', to: '/parents', icon: Users, permission: 'students.view' },
      { label: 'Staff', to: '/staff', icon: UserCheck, permission: 'staff.view' },
    ],
  },
  {
    label: 'Academics',
    items: [
      { label: 'Classes', to: '/classes', icon: BookMarked, permission: 'classes.view' },
      { label: 'Subjects', to: '/subjects', icon: BookOpen, permission: 'subjects.view' },
      { label: 'Academic Years', to: '/academic-years', icon: CalendarDays, permission: 'classes.view' },
      { label: 'Attendance', to: '/attendance', icon: ClipboardList, permission: 'attendance.view' },
      { label: 'Exams & Results', to: '/exams', icon: FileText, permission: 'exams.view' },
    ],
  },
  {
    label: 'Finance',
    items: [
      { label: 'Fees & Payments', to: '/fees', icon: CreditCard, permission: 'fees.view' },
    ],
  },
  {
    label: 'Reports',
    items: [
      { label: 'Reports', to: '/reports', icon: BarChart3, permission: 'reports.view' },
    ],
  },
  {
    label: 'System',
    items: [
      { label: 'Announcements', to: '/announcements', icon: Bell },
      { label: 'Audit Logs', to: '/audit', icon: Shield, permission: 'audit.*' },
      { label: 'Settings', to: '/settings', icon: Settings, permission: 'settings.*' },
    ],
  },
]

interface SidebarProps {
  isOpen: boolean
  isCollapsed: boolean
  onClose: () => void
  onToggleCollapse: () => void
}

export function Sidebar({ isOpen, isCollapsed, onClose, onToggleCollapse }: SidebarProps) {
  const { user, can } = useAuthStore()
  const { institution } = useInstitutionStore()

  const filteredSections = NAV_SECTIONS.map(section => ({
    ...section,
    items: section.items.filter(item => !item.permission || can(item.permission)),
  })).filter(section => section.items.length > 0)

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-20 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside className={cn('layout-sidebar', isOpen && 'layout-sidebar-open', isCollapsed && 'lg:w-[72px]')}>
        {/* Logo / School name */}
        <div className={cn(
          'flex items-center gap-3 px-4 py-5 border-b border-surface-700',
          isCollapsed && 'lg:justify-center lg:px-2'
        )}>
          <div className="flex-shrink-0 w-9 h-9 bg-primary-600 rounded-xl flex items-center justify-center">
            <Building2 className="w-5 h-5 text-white" />
          </div>
          {!isCollapsed && (
            <div className="min-w-0 flex-1">
              <div className="text-base font-bold text-white leading-tight truncate">
                {institution?.name ?? 'ZentraOS'}
              </div>
              <div className="text-xs text-surface-400 capitalize truncate">
                {institution?.type ?? 'School Management'}
              </div>
            </div>
          )}
          {/* Mobile close */}
          <button onClick={onClose} className="lg:hidden ml-auto text-surface-400 hover:text-white p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto no-scrollbar py-3 px-2">
          {filteredSections.map(section => (
            <div key={section.label} className="mb-4">
              {!isCollapsed && (
                <div className="section-label px-2 mb-1">{section.label}</div>
              )}
              {section.items.map(item => (
                <SideNavItem
                  key={item.to}
                  item={item}
                  isCollapsed={isCollapsed}
                  onClick={onClose}
                />
              ))}
            </div>
          ))}
        </nav>

        {/* User info */}
        <div className={cn(
          'border-t border-surface-700 p-3 flex items-center gap-3',
          isCollapsed && 'lg:justify-center'
        )}>
          <Avatar name={user?.profile.full_name ?? 'User'} src={user?.profile.avatar_url} size="sm" />
          {!isCollapsed && (
            <div className="min-w-0 flex-1">
              <div className="text-sm font-medium text-white truncate">
                {user?.profile.full_name}
              </div>
              <div className="text-xs text-surface-400 capitalize">
                {user?.role?.replace('_', ' ')}
              </div>
            </div>
          )}
          {/* Collapse toggle — desktop only */}
          <button
            onClick={onToggleCollapse}
            className="hidden lg:flex flex-shrink-0 p-1.5 rounded-lg text-surface-400 hover:text-white hover:bg-surface-700 transition-colors"
            title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>
      </aside>
    </>
  )
}

function SideNavItem({
  item,
  isCollapsed,
  onClick,
}: {
  item: NavItem
  isCollapsed: boolean
  onClick: () => void
}) {
  const Icon = item.icon
  return (
    <NavLink
      to={item.to}
      onClick={onClick}
      title={isCollapsed ? item.label : undefined}
      className={({ isActive }) =>
        cn('nav-item', isCollapsed && 'lg:justify-center lg:px-2',
          isActive ? 'nav-item-active' : 'nav-item-inactive')
      }
    >
      <Icon className="w-5 h-5 flex-shrink-0" />
      {!isCollapsed && <span className="truncate">{item.label}</span>}
      {!isCollapsed && item.badge !== undefined && (
        <span className="ml-auto badge badge-danger text-xs">{item.badge}</span>
      )}
    </NavLink>
  )
}
