'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  Globe, 
  FileSearch, 
  Settings, 
  Menu,
  X,
  ChevronLeft,
  LogOut,
  User,
  BarChart3
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { LogoutButton } from '@/components/logout-button';
import { ThemeSwitcher } from '@/components/theme-switcher';

interface SidebarLayoutProps {
  children: React.ReactNode;
}

export function SidebarLayout({ children }: SidebarLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Audit Sessions', href: '/sessions', icon: Globe },
    { name: 'Audit Analysis', href: '/audit', icon: FileSearch },
    { name: 'Reports', href: '/reports', icon: BarChart3 },
    { name: 'Settings', href: '/settings', icon: Settings },
  ];

  const isActive = (href: string) => {
    if (href === '/dashboard') return pathname === '/dashboard';
    return pathname.startsWith(href);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile menu button */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <Button
          variant="outline"
          size="icon"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>
      </div>

      {/* Sidebar for desktop */}
      <div className={cn(
        "hidden lg:fixed lg:inset-y-0 lg:flex lg:flex-col transition-all duration-300",
        sidebarOpen ? "lg:w-64" : "lg:w-20"
      )}>
        <div className="flex flex-1 flex-col bg-card border-r border-border">
          <div className="flex h-16 items-center justify-between px-4 border-b border-border">
            {sidebarOpen && (
              <h2 className="text-xl font-semibold text-foreground">Web Audit</h2>
            )}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="ml-auto"
            >
              <ChevronLeft className={cn(
                "h-5 w-5 transition-transform",
                !sidebarOpen && "rotate-180"
              )} />
            </Button>
          </div>

          <nav className="flex-1 space-y-1 px-2 py-4">
            {navigation.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    "group flex items-center rounded-md px-2 py-2 text-sm font-medium transition-colors",
                    isActive(item.href)
                      ? "bg-primary/10 text-primary"
                      : "text-foreground hover:bg-muted hover:text-foreground",
                    !sidebarOpen && "justify-center"
                  )}
                  title={!sidebarOpen ? item.name : undefined}
                >
                  <Icon className={cn(
                    "flex-shrink-0 h-5 w-5",
                    isActive(item.href) ? "text-primary" : "text-muted-foreground group-hover:text-foreground",
                    sidebarOpen && "mr-3"
                  )} />
                  {sidebarOpen && item.name}
                </Link>
              );
            })}
          </nav>

          <div className="border-t border-border p-4">
            <div className={cn(
              "flex items-center gap-2",
              !sidebarOpen && "justify-center"
            )}>
              {!sidebarOpen ? (
                <>
                  <ThemeSwitcher />
                  <LogoutButton />
                </>
              ) : (
                <>
                  <User className="h-5 w-5 text-muted-foreground" />
                  <span className="text-sm font-medium text-foreground">Account</span>
                  <div className="ml-auto flex items-center gap-2">
                    <ThemeSwitcher />
                    <LogoutButton />
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Mobile sidebar */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="fixed inset-0 bg-background/80 backdrop-blur-sm" onClick={() => setMobileMenuOpen(false)} />
          <div className="fixed inset-y-0 left-0 flex w-64 flex-col bg-card border-r border-border">
            <div className="flex h-16 items-center justify-between px-4 border-b border-border">
              <h2 className="text-xl font-semibold text-foreground">Web Audit</h2>
            </div>
            <nav className="flex-1 space-y-1 px-2 py-4">
              {navigation.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={cn(
                      "group flex items-center rounded-md px-2 py-2 text-sm font-medium transition-colors",
                      isActive(item.href)
                        ? "bg-primary/10 text-primary"
                        : "text-foreground hover:bg-muted hover:text-foreground"
                    )}
                  >
                    <Icon className={cn(
                      "mr-3 h-5 w-5",
                      isActive(item.href) ? "text-primary" : "text-muted-foreground group-hover:text-foreground"
                    )} />
                    {item.name}
                  </Link>
                );
              })}
            </nav>
          </div>
        </div>
      )}

      {/* Main content */}
      <div className={cn(
        "transition-all duration-300",
        sidebarOpen ? "lg:pl-64" : "lg:pl-20"
      )}>
        <main className="min-h-screen">
          {children}
        </main>
      </div>
    </div>
  );
} 