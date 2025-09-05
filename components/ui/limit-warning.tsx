import { AlertTriangle, ArrowUp } from 'lucide-react'
import { useUser } from '@/lib/contexts/UserContext'

interface LimitWarningProps {
  resource: 'projects'
  className?: string
}

export function LimitWarning({ resource, className = '' }: LimitWarningProps) {
  const { user, tierLimits, isAtLimit, getRemainingProjects, upgradePrompt } = useUser()

  if (!user || !isAtLimit(resource)) {
    return null
  }

  const remaining = getRemainingProjects()

  return (
    <div className={`bg-yellow-50 border border-yellow-200 rounded-lg p-4 ${className}`}>
      <div className="flex items-start">
        <AlertTriangle className="h-5 w-5 text-yellow-400 mt-0.5 flex-shrink-0" />
        <div className="ml-3 flex-1">
          <h3 className="text-sm font-medium text-yellow-800">
            {remaining === 0 ? 'Limit Reached' : 'Approaching Limit'}
          </h3>
          <p className="text-sm text-yellow-700 mt-1">
            {remaining === 0 ? (
              <>
                You've reached your {user.tier} tier limit of {tierLimits.maxProjects} projects.
                <button 
                  onClick={upgradePrompt}
                  className="ml-2 inline-flex items-center text-yellow-800 underline hover:text-yellow-900 font-medium"
                >
                  <ArrowUp className="h-4 w-4 mr-1" />
                  Upgrade to create more projects
                </button>
              </>
            ) : (
              <>
                You have {remaining} project{remaining === 1 ? '' : 's'} remaining in your {user.tier} tier.
                <button 
                  onClick={upgradePrompt}
                  className="ml-2 text-yellow-800 underline hover:text-yellow-900"
                >
                  Upgrade for more projects
                </button>
              </>
            )}
          </p>
        </div>
      </div>
    </div>
  )
}
