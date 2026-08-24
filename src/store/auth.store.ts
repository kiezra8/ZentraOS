import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { AuthUser, UserRole } from '@/types'

interface AuthState {
  user: AuthUser | null
  isLoading: boolean
  isAuthenticated: boolean
  setUser: (user: AuthUser | null) => void
  setLoading: (loading: boolean) => void
  logout: () => void
  // Permission helper
  hasRole: (roles: UserRole | UserRole[]) => boolean
  can: (permission: string) => boolean
}

// Role permission map
const ROLE_PERMISSIONS: Record<string, string[]> = {
  super_admin: ['*'],
  school_admin: [
    'students.*', 'parents.*', 'staff.*', 'classes.*', 'subjects.*',
    'attendance.*', 'exams.*', 'fees.*', 'reports.*', 'settings.*',
    'audit.*', 'users.*',
  ],
  head_teacher: [
    'students.view', 'students.edit',
    'staff.view', 'classes.*', 'subjects.*',
    'attendance.*', 'exams.*', 'reports.*',
  ],
  deputy_head: [
    'students.view', 'students.edit', 'staff.view',
    'classes.*', 'attendance.*', 'exams.*', 'reports.view',
  ],
  registrar: [
    'students.*', 'parents.*', 'classes.*', 'subjects.*',
    'attendance.*', 'exams.*', 'reports.*',
  ],
  teacher: [
    'students.view', 'attendance.mark', 'attendance.view',
    'exams.view', 'exams.enter_marks',
    'classes.view', 'subjects.view',
  ],
  bursar: [
    'fees.*', 'payments.*', 'reports.fees',
    'students.view',
  ],
  nurse: ['health.*', 'students.view'],
  librarian: ['library.*', 'students.view', 'staff.view'],
  storekeeper: ['inventory.*'],
  parent: ['parent_portal.*'],
  student: ['student_portal.*'],
}

function checkPermission(role: string, permission: string): boolean {
  const permissions = ROLE_PERMISSIONS[role] ?? []
  if (permissions.includes('*')) return true
  if (permissions.includes(permission)) return true

  // Wildcard matching e.g. 'students.*' matches 'students.view'
  const [permNs, permAction] = permission.split('.')
  return permissions.some(p => {
    const [ns, action] = p.split('.')
    return ns === permNs && (action === '*' || action === permAction)
  })
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isLoading: true,
      isAuthenticated: false,

      setUser: (user) => set({ user, isAuthenticated: !!user, isLoading: false }),
      setLoading: (isLoading) => set({ isLoading }),
      logout: () => set({ user: null, isAuthenticated: false }),

      hasRole: (roles) => {
        const role = get().user?.role
        if (!role) return false
        if (Array.isArray(roles)) return roles.includes(role)
        return role === roles
      },

      can: (permission) => {
        const role = get().user?.role
        if (!role) return false
        return checkPermission(role, permission)
      },
    }),
    {
      name: 'zentraos-auth',
      partialize: (state) => ({ user: state.user, isAuthenticated: state.isAuthenticated }),
    }
  )
)
