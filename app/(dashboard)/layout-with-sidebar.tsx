'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Globe,
  FileSearch,
  Settings,
  User,
  BarChart3,
  PenIcon
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { LogoutButton } from '@/components/logout-button';
import { ThemeSwitcher } from '@/components/theme-switcher';

interface SidebarLayoutProps {
  children: React.ReactNode;
}

export function SidebarLayout({ children }: SidebarLayoutProps) {
  const pathname = usePathname();

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Projects', href: '/projects', icon: Globe },
    { name: 'Profile', href: '/profile', icon: User },
  ];

  const isActive = (href: string) => {
    if (href === '/dashboard') return pathname === '/dashboard';
    return pathname.startsWith(href);
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar - always open, wide on desktop, icons only on mobile */}
      <div
        className={cn(
          "flex flex-col bg-card border-r border-border transition-all duration-300",
          "w-16 lg:min-w-44 fixed inset-y-0 left-0 z-30"
        )}
      >
        <div className="flex h-16 items-center justify-center lg:justify-between px-2 lg:px-4 border-b border-border">
          <h2 className="hidden lg:block text-xl font-semibold text-foreground">Web Audit</h2>
          <span className="block lg:hidden text-lg font-bold text-foreground">WA</span>
        </div>
        <nav className="flex-1 space-y-1 px-1 lg:px-2 py-4 ">
          {navigation.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "group flex items-center rounded-md px-0 lg:px-2 py-2 text-sm font-medium transition-colors justify-center lg:justify-start",
                  isActive(item.href)
                    ? "bg-primary/10 text-primary"
                    : "text-foreground hover:bg-muted hover:text-foreground"
                )}
                title={item.name}
              >
                <Icon
                  className={cn(
                    "flex-shrink-0 h-5 w-5",
                    isActive(item.href)
                      ? "text-primary"
                      : "text-muted-foreground group-hover:text-foreground",
                    " lg:mr-3"
                  )}
                />
                <span className="hidden lg:inline">{item.name}</span>
              </Link>
            );
          })}
        </nav>
        <div className="border-t border-border p-4  lg:p-4 ">
          <div className={cn(
            "flex items-center gap-2 justify-center lg:justify-start"
          )}>
            {/* <User className="h-5 w-5 text-muted-foreground" /> */}
            {/* <span className="hidden lg:inline text-sm font-medium text-foreground">Account</span> */}
            <div className= "  lg:bg-transparent lg:ml-auto flex flex-col lg:flex-row items-center gap-2">
              <ThemeSwitcher />
              <LogoutButton />
            </div>
          </div>
        </div>
      </div>
      {/* Main content */}
      <div className={cn(
        "flex-1 transition-all duration-300",
        "ml-16 lg:ml-44"
      )}>
        <main className="min-h-screen">
          {children}
        </main>
      </div>
    </div>
  );
} 