import { UserTier, getTierColor } from '@/lib/types/tier'

interface TierBadgeProps {
  tier: UserTier
  size?: 'sm' | 'md' | 'lg'
  showIcon?: boolean
}

export function TierBadge({ tier, size = 'md', showIcon = false }: TierBadgeProps) {
  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-0.5 text-sm',
    lg: 'px-3 py-1 text-base'
  }

  const iconSizes = {
    sm: 'h-3 w-3',
    md: 'h-4 w-4',
    lg: 'h-5 w-5'
  }

  const getTierIcon = (tier: UserTier) => {
    switch (tier) {
      case 'BASIC':
        return '⭐'
      case 'PRO':
        return '🚀'
      case 'ENTERPRISE':
        return '👑'
      default:
        return '⭐'
    }
  }

  return (
    <span className={`inline-flex items-center rounded-full font-medium ${getTierColor(tier)} ${sizeClasses[size]}`}>
      {showIcon && (
        <span className="mr-1" role="img" aria-label={`${tier} tier`}>
          {getTierIcon(tier)}
        </span>
      )}
      {tier}
    </span>
  )
}
