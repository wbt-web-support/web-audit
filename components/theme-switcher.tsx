"use client";

import { Moon, Sun, Palette } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useEffect, useState, useCallback } from "react";

export function ThemeSwitcher() {
  const { setTheme, theme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [currentScheme, setCurrentScheme] = useState('blue');

  // Memoize the color scheme change function
  const changeColorScheme = useCallback((scheme: string) => {
    try {
      const root = document.documentElement;
      
      switch (scheme) {
        case 'blue':
          root.style.setProperty('--color-primary-500', 'hsl(215, 100%, 50%)');
          root.style.setProperty('--color-primary-600', 'hsl(215, 100%, 45%)');
          root.style.setProperty('--color-secondary-500', 'hsl(220, 100%, 50%)');
          root.style.setProperty('--color-secondary-600', 'hsl(220, 100%, 45%)');
          break;
        case 'green':
          root.style.setProperty('--color-primary-500', 'hsl(142, 76%, 50%)');
          root.style.setProperty('--color-primary-600', 'hsl(142, 76%, 45%)');
          root.style.setProperty('--color-secondary-500', 'hsl(160, 84%, 39%)');
          root.style.setProperty('--color-secondary-600', 'hsl(160, 84%, 34%)');
          break;
        case 'purple':
          root.style.setProperty('--color-primary-500', 'hsl(262, 83%, 58%)');
          root.style.setProperty('--color-primary-600', 'hsl(262, 83%, 53%)');
          root.style.setProperty('--color-secondary-500', 'hsl(280, 65%, 60%)');
          root.style.setProperty('--color-secondary-600', 'hsl(280, 65%, 55%)');
          break;
        case 'orange':
          root.style.setProperty('--color-primary-500', 'hsl(25, 95%, 53%)');
          root.style.setProperty('--color-primary-600', 'hsl(25, 95%, 48%)');
          root.style.setProperty('--color-secondary-500', 'hsl(43, 74%, 66%)');
          root.style.setProperty('--color-secondary-600', 'hsl(43, 74%, 61%)');
          break;
        case 'red':
          root.style.setProperty('--color-primary-500', 'hsl(0, 84%, 60%)');
          root.style.setProperty('--color-primary-600', 'hsl(0, 84%, 55%)');
          root.style.setProperty('--color-secondary-500', 'hsl(15, 100%, 50%)');
          root.style.setProperty('--color-secondary-600', 'hsl(15, 100%, 45%)');
          break;
        default:
          root.style.setProperty('--color-primary-500', 'hsl(215, 100%, 50%)');
          root.style.setProperty('--color-primary-600', 'hsl(215, 100%, 45%)');
          root.style.setProperty('--color-secondary-500', 'hsl(220, 100%, 50%)');
          root.style.setProperty('--color-secondary-600', 'hsl(220, 100%, 45%)');
      }
      
      // Store the color scheme preference
      if (typeof window !== 'undefined') {
        localStorage.setItem('colorScheme', scheme);
      }
      
      setCurrentScheme(scheme);
    } catch (error) {
      console.error('Error changing color scheme:', error);
    }
  }, []);

  // Handle color scheme change
  const handleColorSchemeChange = useCallback((scheme: string) => {
    changeColorScheme(scheme);
  }, [changeColorScheme]);

  // Set mounted state
  useEffect(() => {
    setMounted(true);
  }, []);

  // Load saved color scheme on mount (only once)
  useEffect(() => {
    if (!mounted) return;
    
    try {
      if (typeof window !== 'undefined') {
        const savedScheme = localStorage.getItem('colorScheme');
        if (savedScheme && savedScheme !== currentScheme) {
          changeColorScheme(savedScheme);
        }
      }
    } catch (error) {
      console.error('Error loading saved color scheme:', error);
    }
  }, [mounted, currentScheme, changeColorScheme]);

  if (!mounted) {
    return null;
  }

  return (
    <div className="flex items-center gap-2">
      {/* Color Scheme Switcher */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" className="h-9 w-9 p-0">
            <Palette className="h-4 w-4" />
            <span className="sr-only">Change color scheme</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => handleColorSchemeChange('blue')}>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-blue-500"></div>
              <span>Blue</span>
            </div>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleColorSchemeChange('green')}>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-green-500"></div>
              <span>Green</span>
            </div>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleColorSchemeChange('purple')}>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-purple-500"></div>
              <span>Purple</span>
            </div>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleColorSchemeChange('orange')}>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-orange-500"></div>
              <span>Orange</span>
            </div>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleColorSchemeChange('red')}>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-red-500"></div>
              <span>Red</span>
            </div>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Dark/Light Mode Switcher */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" className="h-9 w-9 p-0">
            <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
            <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
            <span className="sr-only">Toggle theme</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => setTheme("light")}>
            <Sun className="mr-2 h-4 w-4" />
            <span>Light</span>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setTheme("dark")}>
            <Moon className="mr-2 h-4 w-4" />
            <span>Dark</span>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setTheme("system")}>
            <span>System</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
