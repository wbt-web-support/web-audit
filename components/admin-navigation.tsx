'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { 
  Settings, 
  ChevronDown, 
  ChevronRight,
  BarChart3,
  Users,
  Globe,
  TrendingUp,
  CreditCard,
  DollarSign,
  Bell,
  Ticket
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface AdminNavigationProps {
  onCloseSidebar: () => void;
}

export function AdminNavigation({ onCloseSidebar }: AdminNavigationProps) {
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isExpanded, setIsExpanded] = useState(false);
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    checkAdminStatus();
  }, []);

  // Auto-expand admin section when on admin pages
  useEffect(() => {
    if (pathname.startsWith('/admin')) {
      setIsExpanded(true);
    }
  }, [pathname]);

  const checkAdminStatus = async () => {
    try {
      const response = await fetch('/api/profile');
      if (response.ok) {
        const profile = await response.json();
        setIsAdmin(profile.role === 'admin');
      }
    } catch (error) {
      console.error('Error checking admin status:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !isAdmin) {
    return null;
  }

  const isActive = pathname.startsWith('/admin');
  const currentTab = searchParams.get('tab') || 'overview';
  
  const isOverview = currentTab === 'overview';
  const isUsers = currentTab === 'users';
  const isProjects = currentTab === 'projects';
  const isAnalytics = currentTab === 'analytics';
  const isSubscriptions = currentTab === 'subscriptions';
  const isRevenue = currentTab === 'revenue';
  const isAlerts = currentTab === 'alerts';
  const isSupport = currentTab === 'support';

  const adminTabs = [
    { name: 'Overview', href: '/admin', icon: BarChart3, isActive: isOverview },
    { name: 'Users', href: '/admin?tab=users', icon: Users, isActive: isUsers },
    { name: 'Projects', href: '/admin?tab=projects', icon: Globe, isActive: isProjects },
    { name: 'Analytics', href: '/admin?tab=analytics', icon: TrendingUp, isActive: isAnalytics },
    { name: 'Subscriptions', href: '/admin?tab=subscriptions', icon: CreditCard, isActive: isSubscriptions },
    { name: 'Revenue', href: '/admin?tab=revenue', icon: DollarSign, isActive: isRevenue },
    { name: 'Alerts', href: '/admin?tab=alerts', icon: Bell, isActive: isAlerts },
    { name: 'Support', href: '/admin?tab=support', icon: Ticket, isActive: isSupport },
  ];

  return (
    <div className="space-y-1">
      {/* Main Admin Section Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className={cn(
          "group flex items-center justify-between w-full px-3 py-3 rounded-lg text-sm font-medium transition-all duration-200",
          isActive
            ? "bg-blue-50 text-blue-600 border border-blue-200"
            : "hover:bg-gray-50"
        )}
      >
        <div className="flex items-center gap-3">
          <Settings
            className={cn(
              "h-5 w-5 flex-shrink-0",
              isActive
                ? "text-blue-600"
                : "text-gray-400 group-hover:text-gray-600"
            )}
          />
          <span>Admin</span>
        </div>
        {isExpanded ? (
          <ChevronDown className="h-4 w-4 text-gray-400" />
        ) : (
          <ChevronRight className="h-4 w-4 text-gray-400" />
        )}
      </button>

      {/* Admin Sub-tabs */}
      {isExpanded && (
        <div className="ml-6 space-y-1">
          {adminTabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <Link
                key={tab.name}
                href={tab.href}
                onClick={onCloseSidebar}
                className={cn(
                  "group flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200",
                  tab.isActive
                    ? "bg-blue-100 text-blue-700 border-l-2 border-blue-500"
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                )}
              >
                <Icon
                  className={cn(
                    "h-4 w-4 flex-shrink-0",
                    tab.isActive
                      ? "text-blue-700"
                      : "text-gray-400 group-hover:text-gray-600"
                  )}
                />
                <span>{tab.name}</span>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
