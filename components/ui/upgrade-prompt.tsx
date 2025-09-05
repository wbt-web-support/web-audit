import { useUser } from '@/lib/contexts/UserContext'
import { ArrowUp, Zap } from 'lucide-react'

interface UpgradePromptProps {
  feature?: string
  className?: string
}

export function UpgradePrompt({ feature = 'this feature', className = '' }: UpgradePromptProps) {
  const { user, tier, upgradePrompt } = useUser()

  if (!user || tier === 'ENTERPRISE') {
    return null
  }

  return (
    <div className={`bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-4 ${className}`}>
      <div className="flex items-center">
        <div className="flex-shrink-0">
          <Zap className="h-5 w-5 text-blue-500" />
        </div>
        <div className="ml-3 flex-1">
          <h3 className="text-sm font-medium text-blue-900">
            Unlock {feature}
          </h3>
          <p className="text-sm text-blue-700 mt-1">
            {tier === 'BASIC' 
              ? 'Upgrade to PRO or ENTERPRISE to access this feature and many more.'
              : 'Upgrade to ENTERPRISE for unlimited access to all features.'
            }
          </p>
        </div>
        <div className="ml-4">
          <button 
            onClick={upgradePrompt}
            className="inline-flex items-center px-3 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 transition-colors"
          >
            <ArrowUp className="h-4 w-4 mr-1" />
            Upgrade
          </button>
        </div>
      </div>
    </div>
  )
}
