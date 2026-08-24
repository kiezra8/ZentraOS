import { cn } from '@/lib/utils'
import { Loader2 } from 'lucide-react'

// ---- Card --------------------------------
interface CardProps {
  children: React.ReactNode
  className?: string
  onClick?: () => void
}

export function Card({ children, className, onClick }: CardProps) {
  return (
    <div
      className={cn('card', onClick && 'cursor-pointer hover:shadow-card-hover transition-shadow', className)}
      onClick={onClick}
    >
      {children}
    </div>
  )
}

// ---- Stat Card ---------------------------
interface StatCardProps {
  title: string
  value: string | number
  subtitle?: string
  icon: React.ReactNode
  iconBg?: string
  trend?: { value: number; label: string; positive?: boolean }
  className?: string
}

export function StatCard({ title, value, subtitle, icon, iconBg = 'bg-primary-100 text-primary-600', trend, className }: StatCardProps) {
  return (
    <div className={cn('stat-card', className)}>
      <div className={cn('stat-icon', iconBg)}>
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-surface-500 font-medium">{title}</p>
        <p className="text-2xl font-bold text-surface-900 mt-0.5">{value}</p>
        {subtitle && <p className="text-xs text-surface-400 mt-0.5">{subtitle}</p>}
        {trend && (
          <div className={cn('flex items-center gap-1 mt-1.5 text-xs font-medium', trend.positive ? 'text-success-600' : 'text-danger-600')}>
            <span>{trend.positive ? '↑' : '↓'} {Math.abs(trend.value)}%</span>
            <span className="text-surface-400 font-normal">{trend.label}</span>
          </div>
        )}
      </div>
    </div>
  )
}

// ---- Section Header ----------------------
interface SectionHeaderProps {
  title: string
  subtitle?: string
  action?: React.ReactNode
  className?: string
}

export function SectionHeader({ title, subtitle, action, className }: SectionHeaderProps) {
  return (
    <div className={cn('page-header', className)}>
      <div>
        <h1 className="page-title">{title}</h1>
        {subtitle && <p className="page-subtitle">{subtitle}</p>}
      </div>
      {action && <div className="flex items-center gap-2 mt-3 sm:mt-0">{action}</div>}
    </div>
  )
}

// ---- Skeleton ----------------------------
interface SkeletonProps {
  className?: string
  rows?: number
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn('animate-pulse bg-surface-200 rounded-lg', className)} />
}

export function SkeletonCard({ rows = 3 }: SkeletonProps) {
  return (
    <div className="card space-y-3">
      <Skeleton className="h-5 w-1/3" />
      {Array.from({ length: rows }).map((_, i) => (
        <Skeleton key={i} className={cn('h-4', i === rows - 1 ? 'w-2/3' : 'w-full')} />
      ))}
    </div>
  )
}

export function SkeletonTable({ rows = 5, cols = 4 }: { rows?: number; cols?: number }) {
  return (
    <div className="table-container bg-white">
      <table className="table">
        <thead>
          <tr>
            {Array.from({ length: cols }).map((_, i) => (
              <th key={i}><Skeleton className="h-3 w-16" /></th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: rows }).map((_, i) => (
            <tr key={i}>
              {Array.from({ length: cols }).map((_, j) => (
                <td key={j}><Skeleton className="h-4 w-full max-w-[120px]" /></td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// ---- Empty State -------------------------
interface EmptyStateProps {
  icon?: React.ReactNode
  title: string
  description?: string
  action?: React.ReactNode
  className?: string
}

export function EmptyState({ icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center py-16 text-center px-4', className)}>
      {icon && (
        <div className="w-14 h-14 bg-surface-100 rounded-2xl flex items-center justify-center text-surface-400 mb-4">
          {icon}
        </div>
      )}
      <h3 className="text-base font-semibold text-surface-700">{title}</h3>
      {description && <p className="text-sm text-surface-400 mt-1 max-w-xs">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}

// ---- Error State -------------------------
interface ErrorStateProps {
  title?: string
  message: string
  onRetry?: () => void
}

export function ErrorState({ title = 'Something went wrong', message, onRetry }: ErrorStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center px-4">
      <div className="w-14 h-14 bg-danger-100 rounded-2xl flex items-center justify-center text-danger-500 mb-4 text-2xl">
        ⚠
      </div>
      <h3 className="text-base font-semibold text-surface-700">{title}</h3>
      <p className="text-sm text-surface-400 mt-1 max-w-xs">{message}</p>
      {onRetry && (
        <button onClick={onRetry} className="mt-4 btn-md btn-outline">
          Try again
        </button>
      )}
    </div>
  )
}

// ---- Loading Overlay ---------------------
export function LoadingSpinner({ className }: { className?: string }) {
  return (
    <div className={cn('flex items-center justify-center py-12', className)}>
      <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
    </div>
  )
}

// ---- Divider -----------------------------
export function Divider({ className }: { className?: string }) {
  return <div className={cn('divider', className)} />
}
