'use client';

import { useState, useMemo, useCallback, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useSearchParams, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  Globe,
  FileSearch,
  Settings,
  User,
  BarChart3,
  PenIcon,
  Menu,
  X,
  Crown,
  CreditCard,
  Shield,
  HelpCircle,
  ChevronDown,
  ChevronRight,
  Star,
  Zap
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { LogoutButton } from '@/components/logout-button';
import { SimpleThemeSwitcher } from '@/components/simple-theme-switcher';
import { AdminNavigation } from '@/components/admin-navigation';
import React from 'react';

interface SidebarLayoutProps {
  children: React.ReactNode;
}

export function SidebarLayout({ children }: SidebarLayoutProps) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [profileExpanded, setProfileExpanded] = useState(pathname.startsWith('/profile'));
  const [userPlan, setUserPlan] = useState<{
    name: string;
    status: string;
    queue_priority: number;
  } | null>(null);

  // Auto-expand profile section when on profile pages
  useEffect(() => {
    if (pathname.startsWith('/profile')) {
      setProfileExpanded(true);
    }
  }, [pathname]);

  // Fetch user plan data
  useEffect(() => {
    const fetchUserPlan = async () => {
      try {
        const response = await fetch('/api/profile/data');
        if (response.ok) {
          const data = await response.json();
          console.log('Profile data with plan:', data.profile);
          
          if (data.profile?.plans) {
            setUserPlan({
              name: data.profile.plans.name || 'Free Plan temp',
              status: data.profile.plan_status || 'free temp',
              queue_priority: data.profile.queue_priority || 3
            });
          } else {
            setUserPlan({
              name: 'Free Plan dummy',
              status: 'free',
              queue_priority: 3
            });
          }
        }
      } catch (error) {
        console.error('Error fetching user plan:', error);
        setUserPlan({
          name: 'Free Plan',
          status: 'free',
          queue_priority: 3
        });
      }
    };

    fetchUserPlan();
  }, []);

  // Memoize navigation items to prevent recreation on every render
  const navigation = useMemo(() => [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Projects', href: '/projects', icon: Globe },
    { name: 'Profile', href: '/profile', icon: User },
  ], []);

  // Memoize active state calculation
  const isActive = useCallback((href: string) => {
    if (href === '/dashboard') return pathname === '/dashboard';
    if (href === '/profile') return pathname.startsWith('/profile');
    return pathname.startsWith(href);
  }, [pathname]);

  // Memoize sidebar toggle handlers
  const toggleSidebar = useCallback(() => {
    setSidebarOpen(prev => !prev);
  }, []);

  const closeSidebar = useCallback(() => {
    setSidebarOpen(false);
  }, []);

  const toggleProfile = useCallback(() => {
    setProfileExpanded(prev => !prev);
  }, []);

  return (
    <div className="min-h-screen">
      {/* Mobile Navbar */}
      <MobileNavbar 
        sidebarOpen={sidebarOpen} 
        onToggleSidebar={toggleSidebar} 
      />

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div 
          className="lg:hidden fixed inset-0 z-40 bg-black/50"
          onClick={closeSidebar}
        />
      )}

      {/* Desktop Layout Container */}
      <div className="lg:flex lg:h-screen lg:overflow-hidden">
        {/* Sidebar */}
        <Sidebar 
          navigation={navigation}
          isActive={isActive}
          sidebarOpen={sidebarOpen}
          onCloseSidebar={closeSidebar}
          profileExpanded={profileExpanded}
          onToggleProfile={toggleProfile}
          userPlan={userPlan}
        />

        {/* Main Content */}
        <div className="flex-1 min-w-0 lg:overflow-y-auto">
          <main className="min-h-screen pt-16 lg:pt-0">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}

// Memoized Mobile Navbar Component
const MobileNavbar = React.memo(({ 
  sidebarOpen, 
  onToggleSidebar 
}: { 
  sidebarOpen: boolean; 
  onToggleSidebar: () => void; 
}) => {
  return (
    <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-white border-b">
      <div className="flex items-center justify-between px-4 py-3">
        {/* Logo and Brand */}
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-500 rounded-lg">
            <BarChart3 className="h-5 w-5 text-white" />
          </div>
          <h2 className="text-lg font-semibold">Web Audit</h2>
        </div>
        
        {/* Hamburger Menu */}
        <Button
          variant="ghost"
          size="sm"
          onClick={onToggleSidebar}
          className="p-2"
        >
          {sidebarOpen ? (
            <X className="h-5 w-5" />
          ) : (
            <Menu className="h-5 w-5" />
          )}
        </Button>
      </div>
    </div>
  );
});

MobileNavbar.displayName = 'MobileNavbar';

// Memoized Sidebar Component
const Sidebar = React.memo(({ 
  navigation, 
  isActive, 
  sidebarOpen, 
  onCloseSidebar,
  profileExpanded,
  onToggleProfile,
  userPlan
}: { 
  navigation: Array<{ name: string; href: string; icon: any }>;
  isActive: (href: string) => boolean;
  sidebarOpen: boolean;
  onCloseSidebar: () => void;
  profileExpanded: boolean;
  onToggleProfile: () => void;
  userPlan: {
    name: string;
    status: string;
    queue_priority: number;
  } | null;
}) => {
  const pathname = usePathname();
  const isProfileActive = pathname.startsWith('/profile');
  
  return (
    <div className={cn(
      "fixed inset-y-0 left-0 z-50 w-64 bg-white border-r transform transition-transform duration-300 ease-in-out lg:relative lg:translate-x-0 lg:flex-shrink-0 lg:top-0",
      sidebarOpen ? "translate-x-0" : "-translate-x-full"
    )}>
      <div className="flex flex-col h-full">
        {/* Desktop Logo/Brand Section */}
        <div className="hidden lg:flex h-16 items-center px-6 border-b flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500 rounded-lg">
              <BarChart3 className="h-5 w-5 text-white" />
            </div>
            <h2 className="text-xl font-semibold">Web Audit</h2>
          </div>
        </div>

        {/* Mobile Close Button */}
        <div className="lg:hidden flex items-center justify-between px-6 py-4 border-b flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500 rounded-lg">
              <BarChart3 className="h-5 w-5 text-white" />
            </div>
            <h2 className="text-lg font-semibold">Web Audit</h2>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onCloseSidebar}
            className="p-2"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-6 space-y-1">
          {navigation.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);
            
            // Special handling for Profile item to make it toggleable
            if (item.name === 'Profile') {
              return (
                <ProfileToggleItem
                  key={item.name}
                  item={item}
                  active={active}
                  expanded={profileExpanded}
                  onToggle={onToggleProfile}
                  onCloseSidebar={onCloseSidebar}
                />
              );
            }
            
            return (
              <NavigationItem 
                key={item.name}
                item={item}
                active={active}
                onCloseSidebar={onCloseSidebar}
              />
            );
          })}
          
          {/* Profile Subtabs - Only show when expanded */}
          {profileExpanded && (
            <div className="mt-2 ml-4 space-y-1">
              <ProfileSubtabs onCloseSidebar={onCloseSidebar} />
            </div>
          )}
          
          <AdminNavigation onCloseSidebar={onCloseSidebar} />
        </nav>

        {/* User Plan Indicator */}
        {userPlan && (
          <div className="px-4 py-3 border-t border-gray-200">
            <PlanIndicator userPlan={userPlan} />
          </div>
        )}

        {/* Bottom Section - Theme Switcher and Logout */}
        <div className="border-t p-4 flex-shrink-0">
          <div className="flex items-center justify-end">
            <SimpleThemeSwitcher />
            <LogoutButton />
          </div>
        </div>
      </div>
    </div>
  );
});

Sidebar.displayName = 'Sidebar';

// New Profile Toggle Item Component
const ProfileToggleItem = React.memo(({ 
  item, 
  active, 
  expanded, 
  onToggle, 
  onCloseSidebar 
}: { 
  item: { name: string; href: string; icon: any };
  active: boolean;
  expanded: boolean;
  onToggle: () => void;
  onCloseSidebar: () => void;
}) => {
  const Icon = item.icon;
  const router = useRouter();
  
  return (
    <div>
      <div
        className={cn(
          "group w-full flex items-center justify-between gap-3 px-3 py-3 rounded-lg text-sm font-medium transition-all duration-200 cursor-pointer",
          active
            ? "bg-blue-50 text-blue-600 border border-blue-200"
            : "hover:bg-gray-50 text-gray-600"
        )}
        onClick={() => {
          onCloseSidebar();
          // Toggle the profile section
          onToggle();
          // Navigate to profile page
          router.push(item.href);
        }}
      >
        <div className="flex items-center gap-3">
          <Icon
            className={cn(
              "h-5 w-5 flex-shrink-0",
              active
                ? "text-blue-600"
                : "text-gray-400 group-hover:text-gray-600"
            )}
          />
          <span>{item.name}</span>
        </div>
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onToggle();
          }}
          className="p-1 hover:bg-gray-100 rounded"
        >
          {expanded ? (
            <ChevronDown className="h-4 w-4 text-gray-400 group-hover:text-gray-600" />
          ) : (
            <ChevronRight className="h-4 w-4 text-gray-400 group-hover:text-gray-600" />
          )}
        </button>
      </div>
    </div>
  );
});

ProfileToggleItem.displayName = 'ProfileToggleItem';

// Memoized Profile Subtabs Component
const ProfileSubtabs = React.memo(({ 
  onCloseSidebar 
}: { 
  onCloseSidebar: () => void; 
}) => {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  
  const profileTabs = [
    { name: 'Profile', href: '/profile', icon: User, tab: 'profile' },
    { name: 'Plans', href: '/profile?tab=plans', icon: Crown, tab: 'plans' },
    { name: 'Billing', href: '/profile?tab=billing', icon: CreditCard, tab: 'billing' },
    { name: 'Security', href: '/profile?tab=security', icon: Shield, tab: 'security' },
    { name: 'Support', href: '/profile?tab=support', icon: HelpCircle, tab: 'support' },
  ];

  const isActive = (href: string) => {
    if (href === '/profile') {
      // Check if we're on the main profile page without any tab parameter
      return pathname === '/profile' && !searchParams.get('tab');
    }
    // For other tabs, check if the tab parameter matches
    const tab = href.split('=')[1];
    const currentTab = searchParams.get('tab');
    return pathname.startsWith('/profile') && currentTab === tab;
  };

  return (
    <>
      {profileTabs.map((tab) => {
        const Icon = tab.icon;
        const active = isActive(tab.href);
        return (
          <Link
            key={tab.name}
            href={tab.href}
            onClick={onCloseSidebar}
            className={cn(
              "group flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200",
              active
                ? "bg-blue-50 text-blue-600 border border-blue-200"
                : "hover:bg-gray-50 text-gray-600"
            )}
          >
            <Icon
              className={cn(
                "h-4 w-4 flex-shrink-0",
                active
                  ? "text-blue-600"
                  : "text-gray-400 group-hover:text-gray-600"
              )}
            />
            <span>{tab.name}</span>
          </Link>
        );
      })}
    </>
  );
});

ProfileSubtabs.displayName = 'ProfileSubtabs';

// Memoized Navigation Item Component
const NavigationItem = React.memo(({ 
  item, 
  active, 
  onCloseSidebar 
}: { 
  item: { name: string; href: string; icon: any };
  active: boolean;
  onCloseSidebar: () => void;
}) => {
  const Icon = item.icon;
  
  return (
    <Link
      href={item.href}
      onClick={onCloseSidebar}
      className={cn(
        "group flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium transition-all duration-200",
        active
          ? "bg-blue-50 text-blue-600 border border-blue-200"
          : "hover:bg-gray-50"
      )}
    >
      <Icon
        className={cn(
          "h-5 w-5 flex-shrink-0",
          active
            ? "text-blue-600"
            : "text-gray-400 group-hover:text-gray-600"
        )}
      />
      <span>{item.name}</span>
    </Link>
  );
});

NavigationItem.displayName = 'NavigationItem';

// Plan Indicator Component
const PlanIndicator = React.memo(({ 
  userPlan 
}: { 
  userPlan: {
    name: string;
    status: string;
    queue_priority: number;
  };
}) => {
  const getPlanIcon = (priority: number) => {
    if (priority === 1) return <Crown className="h-4 w-4" />;
    if (priority === 2) return <Star className="h-4 w-4" />;
    return <Zap className="h-4 w-4" />;
  };

  const getPlanColor = (status: string, priority: number) => {
    if (status === 'active') {
      if (priority === 1) return 'bg-purple-100 text-purple-800 border-purple-200';
      if (priority === 2) return 'bg-blue-100 text-blue-800 border-blue-200';
      return 'bg-green-100 text-green-800 border-green-200';
    }
    return 'bg-gray-100 text-gray-600 border-gray-200';
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active': return 'Active';
      case 'expired': return 'Expired';
      case 'cancelled': return 'Cancelled';
      default: return 'Free';
    }
  };

  return (
    <div className={cn(
      "flex items-center gap-3 px-3 py-2 rounded-lg border text-sm font-medium",
      getPlanColor(userPlan.status, userPlan.queue_priority)
    )}>
      <div className="flex-shrink-0">
        {getPlanIcon(userPlan.queue_priority)}
      </div>
      <div className="flex-1 min-w-0">
        <div className="font-medium truncate">{userPlan.name}</div>
        <div className="text-xs opacity-75">
          {getStatusText(userPlan.status)} • Priority {userPlan.queue_priority}
        </div>
      </div>
    </div>
  );
});

PlanIndicator.displayName = 'PlanIndicator'; 