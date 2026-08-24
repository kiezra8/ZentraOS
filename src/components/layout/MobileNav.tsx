import { NavLink } from 'react-router-dom'
import { LayoutDashboard, GraduationCap, ClipboardList, CreditCard, BarChart3 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/store/auth.store'

const MOBILE_NAV_ITEMS = [
  { label: 'Home', to: '/dashboard', icon: LayoutDashboard },
  { label: 'Students', to: '/students', icon: GraduationCap, permission: 'students.view' },
  { label: 'Attendance', to: '/attendance', icon: ClipboardList, permission: 'attendance.view' },
  { label: 'Fees', to: '/fees', icon: CreditCard, permission: 'fees.view' },
  { label: 'Reports', to: '/reports', icon: BarChart3, permission: 'reports.view' },
]

export function MobileNav() {
  const { can } = useAuthStore()
  const visibleItems = MOBILE_NAV_ITEMS.filter(item => !item.permission || can(item.permission))

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 h-16 bg-white border-t border-surface-100 flex lg:hidden z-20"
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 0)' }}
    >
      {visibleItems.slice(0, 5).map(item => {
        const Icon = item.icon
        return (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              cn(
                'flex-1 flex flex-col items-center justify-center gap-0.5 text-xs font-medium transition-colors',
                isActive ? 'text-primary-600' : 'text-surface-400'
              )
            }
          >
            {({ isActive }) => (
              <>
                <div className={cn('w-8 h-8 flex items-center justify-center rounded-xl transition-all', isActive && 'bg-primary-100')}>
                  <Icon className="w-5 h-5" />
                </div>
                <span>{item.label}</span>
              </>
            )}
          </NavLink>
        )
      })}
    </nav>
  )
}
