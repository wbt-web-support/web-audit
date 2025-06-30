'use client';

import { useRouter } from 'next/navigation';
import { Button } from './button';
import { cn } from '@/lib/utils';

interface NavButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  href: string;
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
  size?: "default" | "sm" | "lg" | "icon";
  children: React.ReactNode;
}

export function NavButton({ 
  href, 
  variant = "default", 
  size = "default", 
  children, 
  className, 
  ...props 
}: NavButtonProps) {
  const router = useRouter();

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    router.push(href);
  };

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleClick}
      className={cn(className)}
      {...props}
    >
      {children}
    </Button>
  );
} 