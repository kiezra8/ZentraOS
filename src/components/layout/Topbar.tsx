import { Menu, Search, Wifi, WifiOff, RefreshCw } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/store/auth.store'
import { useSyncStore } from '@/store/sync.store'
import { useInstitutionStore } from '@/store/institution.store'
import { Avatar } from '@/components/ui/Avatar'
import { getConnectivityConfig } from '@/lib/utils'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'

interface TopbarProps {
  onMenuClick: () => void
  title?: string
}

export function Topbar({ onMenuClick, title }: TopbarProps) {
  const { user, logout } = useAuthStore()
  const { status, pendingCount } = useSyncStore()
  const { institution } = useInstitutionStore()
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const navigate = useNavigate()

  const connectivity = getConnectivityConfig(status)

  async function handleLogout() {
    await supabase.auth.signOut()
    logout()
    navigate('/login')
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`)
      setSearchQuery('')
    }
  }

  return (
    <header className="sticky top-0 z-10 bg-white border-b border-surface-100 h-16 flex items-center gap-3 px-4 md:px-6">
      {/* Mobile hamburger */}
      <button
        onClick={onMenuClick}
        className="lg:hidden btn btn-ghost btn-sm p-2 -ml-2"
        aria-label="Open menu"
      >
        <Menu className="w-5 h-5" />
      </button>

      {/* Page title (hidden on desktop, shown on mobile) */}
      {title && (
        <h1 className="text-base font-semibold text-surface-800 lg:hidden truncate">{title}</h1>
      )}

      {/* Search */}
      <form onSubmit={handleSearch} className="flex-1 max-w-md hidden md:flex">
        <div className="relative w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" />
          <input
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search students, staff, payments..."
            className="w-full input pl-9 py-2 text-sm"
            id="global-search"
          />
        </div>
      </form>

      <div className="ml-auto flex items-center gap-2">
        {/* Connectivity badge */}
        <div className={cn('badge text-xs gap-1.5 hidden sm:flex', connectivity.className)}>
          {status === 'syncing' ? (
            <RefreshCw className="w-3 h-3 animate-spin" />
          ) : status === 'offline' ? (
            <WifiOff className="w-3 h-3" />
          ) : (
            <Wifi className="w-3 h-3" />
          )}
          {connectivity.label}
          {pendingCount > 0 && status !== 'online' && (
            <span className="ml-0.5">({pendingCount})</span>
          )}
        </div>

        {/* Mobile search */}
        <button
          onClick={() => navigate('/search')}
          className="md:hidden btn btn-ghost btn-sm p-2"
          aria-label="Search"
        >
          <Search className="w-5 h-5" />
        </button>

        {/* User menu */}
        <div className="relative">
          <button
            onClick={() => setShowUserMenu(v => !v)}
            className="flex items-center gap-2 rounded-xl p-1.5 hover:bg-surface-100 transition-colors"
            id="user-menu-trigger"
            aria-haspopup="true"
            aria-expanded={showUserMenu}
          >
            <Avatar
              name={user?.profile.full_name ?? 'User'}
              src={user?.profile.avatar_url}
              size="sm"
            />
            <div className="hidden sm:block text-left">
              <div className="text-xs font-semibold text-surface-800 leading-tight max-w-[120px] truncate">
                {user?.profile.full_name}
              </div>
              <div className="text-xs text-surface-400 capitalize">
                {user?.role?.replace(/_/g, ' ')}
              </div>
            </div>
          </button>

          {showUserMenu && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setShowUserMenu(false)} />
              <div className="absolute right-0 top-full mt-2 w-52 bg-white rounded-xl shadow-modal border border-surface-100 py-1 z-20 animate-fade-in">
                <div className="px-4 py-3 border-b border-surface-100">
                  <div className="text-sm font-semibold text-surface-800">{user?.profile.full_name}</div>
                  <div className="text-xs text-surface-400">{user?.email}</div>
                </div>
                <button
                  onClick={() => { navigate('/settings/profile'); setShowUserMenu(false) }}
                  className="w-full text-left px-4 py-2.5 text-sm text-surface-700 hover:bg-surface-50 transition-colors"
                >
                  Profile & Settings
                </button>
                <div className="border-t border-surface-100 mt-1 pt-1">
                  <button
                    onClick={handleLogout}
                    className="w-full text-left px-4 py-2.5 text-sm text-danger-600 hover:bg-danger-50 transition-colors"
                  >
                    Sign out
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  )
}
