'use client';

import { useState, useCallback, memo } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Globe,
  FileSearch,
  Settings,
  User,
  BarChart3,
  PenIcon,
  Menu,
  X
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { LogoutButton } from '@/components/logout-button';
import { TrialInitializer } from '@/components/trial-initializer';

interface SidebarLayoutProps {
  children: React.ReactNode;
}

// Memoized navigation items to prevent unnecessary re-renders
const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Projects', href: '/projects', icon: Globe },
  { name: 'Profile', href: '/profile', icon: User },
];

// Memoized navigation item component
const NavigationItem = memo(({ item, isActive, onClose }: { 
  item: typeof navigation[0], 
  isActive: boolean, 
  onClose: () => void 
}) => {
  const Icon = item.icon;
  return (
    <Link
      href={item.href}
      onClick={onClose}
      className={cn(
        "group flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium transition-all duration-200",
        isActive
          ? "bg-blue-50 text-blue-600 border border-blue-200"
          : "hover:bg-gray-50"
      )}
    >
      <Icon
        className={cn(
          "h-5 w-5 flex-shrink-0",
          isActive
            ? "text-blue-600"
            : "text-gray-400 group-hover:text-gray-600"
        )}
      />
      <span>{item.name}</span>
    </Link>
  );
});

NavigationItem.displayName = 'NavigationItem';

// Memoized mobile navbar component
const MobileNavbar = memo(({ onToggle, sidebarOpen }: { 
  onToggle: () => void, 
  sidebarOpen: boolean 
}) => (
  <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-white border-b">
    <div className="flex items-center justify-between px-4 py-3">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-blue-500 rounded-lg">
          <BarChart3 className="h-5 w-5 text-white" />
        </div>
        <h2 className="text-lg font-semibold">Web Audit</h2>
      </div>
      
      <Button
        variant="ghost"
        size="sm"
        onClick={onToggle}
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
));

MobileNavbar.displayName = 'MobileNavbar';

// Memoized sidebar component
const Sidebar = memo(({ 
  sidebarOpen, 
  onClose, 
  isActive 
}: { 
  sidebarOpen: boolean, 
  onClose: () => void, 
  isActive: (href: string) => boolean 
}) => (
  <div className={cn(
    "fixed inset-y-0 left-0 z-50 w-64 bg-white border-r transform transition-transform duration-300 ease-in-out lg:relative lg:translate-x-0 lg:flex-shrink-0 lg:sticky lg:top-0",
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
          onClick={onClose}
          className="p-2"
        >
          <X className="h-5 w-5" />
        </Button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-6 space-y-1">
        {navigation.map((item) => (
          <NavigationItem
            key={item.name}
            item={item}
            isActive={isActive(item.href)}
            onClose={onClose}
          />
        ))}
      </nav>

      {/* Bottom Section - Logout */}
      <div className="border-t p-4 flex-shrink-0">
        <div className="flex items-center justify-center">
          <LogoutButton />
        </div>
      </div>
    </div>
  </div>
));

Sidebar.displayName = 'Sidebar';

export function SidebarLayout({ children }: SidebarLayoutProps) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const isActive = useCallback((href: string) => {
    if (href === '/dashboard') return pathname === '/dashboard';
    return pathname.startsWith(href);
  }, [pathname]);

  const toggleSidebar = useCallback(() => {
    setSidebarOpen(prev => !prev);
  }, []);

  const closeSidebar = useCallback(() => {
    setSidebarOpen(false);
  }, []);

  return (
    <TrialInitializer>
      <div className="min-h-screen">
        {/* Mobile Navbar */}
        <MobileNavbar onToggle={toggleSidebar} sidebarOpen={sidebarOpen} />

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
            sidebarOpen={sidebarOpen} 
            onClose={closeSidebar} 
            isActive={isActive} 
          />

          {/* Main Content */}
          <div className="flex-1 min-w-0 lg:overflow-y-auto">
            <main className="min-h-screen pt-16 lg:pt-0">
              {children}
            </main>
          </div>
        </div>
      </div>
    </TrialInitializer>
  );
} 