import { useUser } from '@/lib/contexts/UserContext'
import { TierBadge } from './tier-badge'
import { UsageBar } from './usage-bar'
import { ArrowUp } from 'lucide-react'

export function TierStatusCard() {
  const { user, tier, tierLimits, projects, getProjectUsagePercentage, upgradePrompt } = useUser()

  if (!user) return null

  const usagePercentage = getProjectUsagePercentage()

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Current Plan</h2>
          <div className="flex items-center mt-2 space-x-3">
            <TierBadge tier={tier} size="md" showIcon />
            <span className="text-sm text-gray-600">
              {projects.length} / {tierLimits.maxProjects} projects used
            </span>
          </div>
        </div>
        <button 
          onClick={upgradePrompt}
          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 transition-colors"
        >
          <ArrowUp className="h-4 w-4 mr-2" />
          Upgrade Plan
        </button>
      </div>
      
      <UsageBar
        current={projects.length}
        max={tierLimits.maxProjects}
        tier={tier}
        label="Project Usage"
        showPercentage
        showNumbers
      />
      
      <div className="mt-4 pt-4 border-t border-gray-200">
        <h3 className="text-sm font-medium text-gray-900 mb-2">Plan Features</h3>
        <div className="flex flex-wrap gap-2">
          {tierLimits.features.slice(0, 3).map((feature, index) => (
            <span 
              key={index}
              className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800"
            >
              ✓ {feature}
            </span>
          ))}
          {tierLimits.features.length > 3 && (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
              +{tierLimits.features.length - 3} more
            </span>
          )}
        </div>
      </div>
    </div>
  )
}
