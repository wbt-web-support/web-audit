export type UserTier = 'BASIC' | 'PRO' | 'ENTERPRISE'

export interface TierLimits {
  maxProjects: number
  features: string[]
  priority: 'low' | 'medium' | 'high'
  price: number
  description: string
}

export const TIER_CONFIG: Record<UserTier, TierLimits> = {
  BASIC: {
    maxProjects: 5,
    features: ['Basic Audit', 'Standard Reports', 'Email Support'],
    priority: 'low',
    price: 0,
    description: 'Perfect for getting started with web audits'
  },
  PRO: {
    maxProjects: 50,
    features: ['Basic Audit', 'Standard Reports', 'Advanced Analytics', 'Priority Support', 'Custom Instructions'],
    priority: 'medium',
    price: 29,
    description: 'Ideal for growing businesses and agencies'
  },
  ENTERPRISE: {
    maxProjects: 500,
    features: ['All Features', 'Custom Integrations', 'Dedicated Support', 'Custom Limits', 'API Access', 'White-label'],
    priority: 'high',
    price: 99,
    description: 'For large organizations with advanced needs'
  }
}

export const getTierOrder = (tier: UserTier): number => {
  const order = { BASIC: 1, PRO: 2, ENTERPRISE: 3 }
  return order[tier]
}

export const hasRequiredTier = (userTier: UserTier, requiredTier: UserTier): boolean => {
  return getTierOrder(userTier) >= getTierOrder(requiredTier)
}

export const getTierColor = (tier: UserTier): string => {
  const colors = {
    BASIC: 'bg-gray-100 text-gray-800 border-gray-200',
    PRO: 'bg-blue-100 text-blue-800 border-blue-200',
    ENTERPRISE: 'bg-purple-100 text-purple-800 border-purple-200'
  }
  return colors[tier]
}

export const getTierBadgeColor = (tier: UserTier): string => {
  const colors = {
    BASIC: 'bg-gray-500',
    PRO: 'bg-blue-500',
    ENTERPRISE: 'bg-purple-500'
  }
  return colors[tier]
}
