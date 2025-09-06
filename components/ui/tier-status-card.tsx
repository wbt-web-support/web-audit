import { useUser } from '@/lib/contexts/UserContext'
import { TierBadge } from './tier-badge'
import { UsageBar } from './usage-bar'
import { ArrowUp } from 'lucide-react'
import { UserTier } from '@/lib/types/tier'

interface ProjectLimits {
  tenantInfo: {
    tier: string;
    subscriptionStatus: string;
  };
  limits: {
    maxProjects: number;
    maxAuditsPerDay: number;
    maxConcurrentAudits: number;
  };
  usage: {
    projects: {
      current: number;
      max: number;
      remaining: number;
    };
    audits: {
      today: number;
      maxPerDay: number;
      remaining: number;
    };
  };
}

interface TierStatusCardProps {
  projectLimits: ProjectLimits;
  loading?: boolean;
}

export function TierStatusCard({ projectLimits, loading = false }: TierStatusCardProps) {
  const { upgradePrompt } = useUser()

  if (!projectLimits) return null

  // Use project limits data from v2 API
  const currentProjects = projectLimits.usage.projects.current
  const maxProjects = projectLimits.limits.maxProjects
  const usagePercentage = maxProjects > 0 ? Math.min(100, (currentProjects / maxProjects) * 100) : 0
  const tier = projectLimits.tenantInfo.tier as UserTier
  
  // Define features based on tier
  const getFeaturesForTier = (tier: string) => {
    switch (tier) {
      case 'BASIC':
        return ['Basic Audit', 'Standard Reports', 'Email Support'];
      case 'PRO':
        return ['Basic Audit', 'Advanced Analytics', 'Priority Support', 'Custom Instructions', 'API Access'];
      case 'ENTERPRISE':
        return ['All Features', 'Custom Integrations', 'Dedicated Support', 'Custom Limits', 'White-label', 'API Access'];
      default:
        return ['Basic Audit', 'Standard Reports', 'Email Support'];
    }
  };
  
  const features = getFeaturesForTier(tier)

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div  className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Current Plan</h2>
          <div className="flex items-center mt-2 space-x-3">
            <TierBadge tier={tier} size="md" showIcon />
            <span className="text-sm text-gray-600">
              {currentProjects} / {maxProjects} projects used
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
        current={currentProjects}
        max={maxProjects}
        tier={tier}
        label="Project Usage"
        showPercentage
        showNumbers
      />
      
      <div className="mt-4 pt-4 border-t border-gray-200">
        <h3 className="text-sm font-medium text-gray-900 mb-3">Plan Limits</h3>
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="text-center">
            <div className="text-lg font-semibold text-gray-900">{projectLimits.usage.audits.today}</div>
            <div className="text-xs text-gray-500">Audits Today</div>
            <div className="text-xs text-gray-400">/ {projectLimits.limits.maxAuditsPerDay} max</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-semibold text-gray-900">{projectLimits.limits.maxConcurrentAudits}</div>
            <div className="text-xs text-gray-500">Concurrent Audits</div>
            <div className="text-xs text-gray-400">max allowed</div>
          </div>
        </div>
        
        <h3 className="text-sm font-medium text-gray-900 mb-2">Plan Features</h3>
        <div className="flex flex-wrap gap-2">
          {features.slice(0, 3).map((feature, index) => (
            <span 
              key={index}
              className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800"
            >
              ✓ {feature}
            </span>
          ))}
          {features.length > 3 && (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
              +{features.length - 3} more
            </span>
          )}
        </div>
      </div>
    </div>
  )
}
