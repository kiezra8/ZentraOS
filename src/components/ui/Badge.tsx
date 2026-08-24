import { cn } from '@/lib/utils'

interface BadgeProps {
  children: React.ReactNode
  variant?: 'primary' | 'success' | 'warning' | 'danger' | 'surface' | 'accent' | 'purple' | 'blue'
  className?: string
  dot?: boolean
}

export function Badge({ children, variant = 'surface', className, dot }: BadgeProps) {
  return (
    <span className={cn('badge', `badge-${variant}`, className)}>
      {dot && (
        <span
          className={cn('w-1.5 h-1.5 rounded-full', {
            'bg-primary-600': variant === 'primary',
            'bg-success-600': variant === 'success',
            'bg-warning-600': variant === 'warning',
            'bg-danger-600': variant === 'danger',
            'bg-surface-500': variant === 'surface',
            'bg-accent-600': variant === 'accent',
          })}
        />
      )}
      {children}
    </span>
  )
}
