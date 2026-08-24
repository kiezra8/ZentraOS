import { cn } from '@/lib/utils'
import { getInitials } from '@/lib/utils'

interface AvatarProps {
  src?: string | null
  name: string
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  className?: string
}

const sizeConfig: Record<string, { outer: string; text: string }> = {
  xs: { outer: 'w-6 h-6',  text: 'text-[10px]' },
  sm: { outer: 'w-8 h-8',  text: 'text-xs' },
  md: { outer: 'w-10 h-10', text: 'text-sm' },
  lg: { outer: 'w-12 h-12', text: 'text-base' },
  xl: { outer: 'w-16 h-16', text: 'text-xl' },
}

// Deterministic color based on name
function getAvatarColor(name: string): string {
  const colors = [
    'bg-primary-500', 'bg-accent-500', 'bg-purple-500',
    'bg-blue-500', 'bg-pink-500', 'bg-orange-500',
    'bg-teal-500', 'bg-indigo-500',
  ]
  let hash = 0
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash)
  }
  return colors[Math.abs(hash) % colors.length]
}

export function Avatar({ src, name, size = 'md', className }: AvatarProps) {
  const config = sizeConfig[size]
  const initials = getInitials(name)
  const bgColor = getAvatarColor(name)

  return (
    <div
      className={cn(
        'rounded-full flex-shrink-0 overflow-hidden flex items-center justify-center',
        config.outer,
        !src && bgColor,
        className
      )}
    >
      {src ? (
        <img src={src} alt={name} className="w-full h-full object-cover" />
      ) : (
        <span className={cn('font-semibold text-white select-none', config.text)}>
          {initials}
        </span>
      )}
    </div>
  )
}
