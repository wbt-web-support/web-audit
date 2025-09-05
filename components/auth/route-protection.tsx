import { ReactNode } from 'react'
import { useUser } from '@/lib/contexts/UserContext'
import { UserTier, hasRequiredTier } from '@/lib/types/tier'
import { UpgradePrompt } from '@/components/ui/upgrade-prompt'

interface RouteProtectionProps {
  children: ReactNode
  requiredTier: UserTier
  fallback?: ReactNode
}

export function RouteProtection({ children, requiredTier, fallback }: RouteProtectionProps) {
  const { user, tier, loading } = useUser()

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="text-center py-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Authentication Required</h2>
        <p className="text-gray-600">Please sign in to access this feature.</p>
      </div>
    )
  }

  if (!hasRequiredTier(tier, requiredTier)) {
    if (fallback) {
      return <>{fallback}</>
    }

    return (
      <div className="text-center py-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          {requiredTier} Tier Required
        </h2>
        <p className="text-gray-600 mb-4">
          This feature requires a {requiredTier} tier subscription.
        </p>
        <UpgradePrompt feature={`${requiredTier} tier features`} />
      </div>
    )
  }

  return <>{children}</>
}

interface UpgradeRequiredProps {
  requiredTier: UserTier
  feature?: string
}

export function UpgradeRequired({ requiredTier, feature }: UpgradeRequiredProps) {
  return (
    <div className="text-center py-12">
      <div className="max-w-md mx-auto">
        <div className="mb-6">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-blue-100 mb-4">
            <svg className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            {requiredTier} Tier Required
          </h2>
          <p className="text-gray-600">
            {feature 
              ? `This feature requires a ${requiredTier} tier subscription.`
              : `You need a ${requiredTier} tier subscription to access this content.`
            }
          </p>
        </div>
        
        <UpgradePrompt feature={feature || `${requiredTier} tier features`} />
        
        <div className="mt-6">
          <a 
            href="/pricing" 
            className="text-blue-600 hover:text-blue-800 text-sm font-medium"
          >
            View all pricing plans →
          </a>
        </div>
      </div>
    </div>
  )
}

// Higher-order component for route protection
export function withTierCheck(requiredTier: UserTier) {
  return function <P extends object>(WrappedComponent: React.ComponentType<P>) {
    return function TierProtectedComponent(props: P) {
      return (
        <RouteProtection requiredTier={requiredTier}>
          <WrappedComponent {...props} />
        </RouteProtection>
      )
    }
  }
}

// Hook for tier-based conditional rendering
export function useTierCheck(requiredTier: UserTier) {
  const { user, tier, loading } = useUser()
  
  return {
    hasAccess: user && hasRequiredTier(tier, requiredTier),
    isLoading: loading,
    user,
    tier
  }
}
