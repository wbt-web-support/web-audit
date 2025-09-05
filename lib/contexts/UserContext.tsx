import React, { createContext, useContext, ReactNode, useState, useEffect } from 'react'
import { useAuthWithBackend } from '@/lib/hooks/useAuthWithBackend'
import { useProjects } from '@/lib/hooks/useProjects'
import { UserTier, TIER_CONFIG, hasRequiredTier, getTierOrder } from '@/lib/types/tier'

interface User {
  id: string
  email: string
  name?: string
  tier: UserTier
  subscription_status: string
  created_at?: string
  updated_at?: string
}

interface Project {
  id: string
  user_id: string
  base_url: string
  crawl_type: string
  status: string
  created_at: string
  updated_at: string
}

interface UserContextType {
  user: User | null
  tier: UserTier
  tierLimits: typeof TIER_CONFIG[UserTier]
  projects: Project[]
  loading: boolean
  isAtLimit: (resource: 'projects') => boolean
  canCreateProject: () => boolean
  getRemainingProjects: () => number
  getProjectUsagePercentage: () => number
  hasRequiredTier: (requiredTier: UserTier) => boolean
  upgradePrompt: () => void
  refreshUserData: () => Promise<void>
}

const UserContext = createContext<UserContextType | undefined>(undefined)

interface UserProviderProps {
  children: ReactNode
}

export function UserProvider({ children }: UserProviderProps) {
  const { user: authUser, userTier, loading: authLoading, refreshUserInfo } = useAuthWithBackend()
  const { projects, loading: projectsLoading, refreshProjects } = useProjects()
  const [showUpgradeModal, setShowUpgradeModal] = useState(false)

  // Determine user tier (default to BASIC if not set)
  const tier: UserTier = (userTier as UserTier) || 'BASIC'
  const tierLimits = TIER_CONFIG[tier]

  // Create user object with tier information
  const user: User | null = authUser ? {
    id: authUser.id,
    email: authUser.email || '',
    name: authUser.user_metadata?.name || authUser.user_metadata?.full_name,
    tier,
    subscription_status: 'active', // This should come from your backend
    created_at: authUser.created_at,
    updated_at: authUser.updated_at
  } : null

  const loading = authLoading || projectsLoading

  // Check if user is at limit for a specific resource
  const isAtLimit = (resource: 'projects'): boolean => {
    if (!user) return false
    
    switch (resource) {
      case 'projects':
        return projects.length >= tierLimits.maxProjects
      default:
        return false
    }
  }

  // Check if user can create a new project
  const canCreateProject = (): boolean => {
    return !isAtLimit('projects')
  }

  // Get remaining projects count
  const getRemainingProjects = (): number => {
    if (!user) return 0
    return Math.max(0, tierLimits.maxProjects - projects.length)
  }

  // Get project usage percentage
  const getProjectUsagePercentage = (): number => {
    if (!user || tierLimits.maxProjects === 0) return 0
    return Math.min(100, (projects.length / tierLimits.maxProjects) * 100)
  }

  // Check if user has required tier
  const hasRequiredTierLevel = (requiredTier: UserTier): boolean => {
    return hasRequiredTier(tier, requiredTier)
  }

  // Show upgrade prompt
  const upgradePrompt = (): void => {
    setShowUpgradeModal(true)
  }

  // Refresh user data
  const refreshUserData = async (): Promise<void> => {
    await Promise.all([
      refreshUserInfo(),
      refreshProjects()
    ])
  }

  // Auto-refresh user data when auth state changes
  useEffect(() => {
    if (authUser) {
      refreshUserData()
    }
  }, [authUser?.id])

  const value: UserContextType = {
    user,
    tier,
    tierLimits,
    projects,
    loading,
    isAtLimit,
    canCreateProject,
    getRemainingProjects,
    getProjectUsagePercentage,
    hasRequiredTier: hasRequiredTierLevel,
    upgradePrompt,
    refreshUserData
  }

  return (
    <UserContext.Provider value={value}>
      {children}
      {/* Upgrade Modal */}
      {showUpgradeModal && (
        <UpgradeModal 
          isOpen={showUpgradeModal} 
          onClose={() => setShowUpgradeModal(false)}
          currentTier={tier}
        />
      )}
    </UserContext.Provider>
  )
}

export function useUser(): UserContextType {
  const context = useContext(UserContext)
  if (!context) {
    throw new Error('useUser must be used within UserProvider')
  }
  return context
}

// Simple Upgrade Modal Component
interface UpgradeModalProps {
  isOpen: boolean
  onClose: () => void
  currentTier: UserTier
}

function UpgradeModal({ isOpen, onClose, currentTier }: UpgradeModalProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">Upgrade Your Plan</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl"
          >
            ×
          </button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {Object.entries(TIER_CONFIG).map(([tierName, config]) => {
            const tier = tierName as UserTier
            const isCurrentTier = currentTier === tier
            const isUpgrade = getTierOrder(tier) > getTierOrder(currentTier)
            
            return (
              <div 
                key={tier}
                className={`border rounded-lg p-6 ${
                  isCurrentTier 
                    ? 'border-blue-500 bg-blue-50' 
                    : isUpgrade
                    ? 'border-green-500 bg-green-50'
                    : 'border-gray-200'
                }`}
              >
                <div className="text-center">
                  <h3 className="text-xl font-semibold mb-2">{tier}</h3>
                  <div className="text-3xl font-bold mb-2">
                    ${config.price}
                    {config.price > 0 && <span className="text-sm font-normal">/mo</span>}
                  </div>
                  <p className="text-sm text-gray-600 mb-4">{config.description}</p>
                </div>
                
                <ul className="space-y-2 mb-6">
                  <li className="flex items-center">
                    <span className="text-green-500 mr-2">✓</span>
                    <span className="text-sm">{config.maxProjects} projects</span>
                  </li>
                  {config.features.map(feature => (
                    <li key={feature} className="flex items-center">
                      <span className="text-green-500 mr-2">✓</span>
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>
                
                {isCurrentTier ? (
                  <div className="text-center">
                    <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">
                      Current Plan
                    </span>
                  </div>
                ) : (
                  <button 
                    className={`w-full py-2 px-4 rounded font-medium ${
                      isUpgrade
                        ? 'bg-green-600 text-white hover:bg-green-700'
                        : 'bg-gray-300 text-gray-700 cursor-not-allowed'
                    }`}
                    disabled={!isUpgrade}
                  >
                    {isUpgrade ? 'Upgrade' : 'Downgrade'}
                  </button>
                )}
              </div>
            )
          })}
        </div>
        
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            Need a custom plan? <a href="/contact" className="text-blue-600 hover:underline">Contact us</a>
          </p>
        </div>
      </div>
    </div>
  )
}
