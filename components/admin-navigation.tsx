'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Settings } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AdminNavigationProps {
  onCloseSidebar: () => void;
}

export function AdminNavigation({ onCloseSidebar }: AdminNavigationProps) {
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const pathname = usePathname();

  useEffect(() => {
    checkAdminStatus();
  }, []);

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

  return (
    <Link
      href="/admin"
      onClick={onCloseSidebar}
      className={cn(
        "group flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium transition-all duration-200",
        isActive
          ? "bg-blue-50 text-blue-600 border border-blue-200"
          : "hover:bg-gray-50"
      )}
    >
      <Settings
        className={cn(
          "h-5 w-5 flex-shrink-0",
          isActive
            ? "text-blue-600"
            : "text-gray-400 group-hover:text-gray-600"
        )}
      />
      <span>Admin</span>
    </Link>
  );
}
