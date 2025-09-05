import { UserTier } from '@/lib/types/tier'

interface UsageBarProps {
  current: number
  max: number
  tier: UserTier
  label?: string
  showPercentage?: boolean
  showNumbers?: boolean
}

export function UsageBar({ 
  current, 
  max, 
  tier, 
  label = 'Usage',
  showPercentage = true,
  showNumbers = true
}: UsageBarProps) {
  const percentage = max > 0 ? Math.min(100, (current / max) * 100) : 0
  
  const getBarColor = (percentage: number, tier: UserTier) => {
    if (percentage >= 90) return 'bg-red-500'
    if (percentage >= 75) return 'bg-yellow-500'
    if (percentage >= 50) return 'bg-blue-500'
    return 'bg-green-500'
  }

  const getTextColor = (percentage: number) => {
    if (percentage >= 90) return 'text-red-600'
    if (percentage >= 75) return 'text-yellow-600'
    if (percentage >= 50) return 'text-blue-600'
    return 'text-green-600'
  }

  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-2">
        <span className="text-sm font-medium text-gray-700">{label}</span>
        <div className="flex items-center space-x-2">
          {showNumbers && (
            <span className="text-sm text-gray-600">
              {current} / {max}
            </span>
          )}
          {showPercentage && (
            <span className={`text-sm font-medium ${getTextColor(percentage)}`}>
              {Math.round(percentage)}%
            </span>
          )}
        </div>
      </div>
      
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div 
          className={`h-2 rounded-full transition-all duration-300 ${getBarColor(percentage, tier)}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
      
      {percentage >= 90 && (
        <p className="text-xs text-red-600 mt-1">
          ⚠️ Approaching limit
        </p>
      )}
    </div>
  )
}
