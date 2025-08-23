'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { ProjectCard } from './recent-projects';
import type { AuditProject } from '@/lib/types/database';

interface VirtualProjectListProps {
  projects: AuditProject[];
  itemHeight?: number;
  containerHeight?: number;
  overscan?: number;
}

export function VirtualProjectList({ 
  projects, 
  itemHeight = 120, 
  containerHeight = 500,
  overscan = 3 
}: VirtualProjectListProps) {
  const [scrollTop, setScrollTop] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  // Calculate visible range
  const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
  const endIndex = Math.min(
    projects.length - 1,
    Math.floor((scrollTop + containerHeight) / itemHeight) + overscan
  );

  // Get visible items
  const visibleItems = projects.slice(startIndex, endIndex + 1);

  // Calculate total height and offset
  const totalHeight = projects.length * itemHeight;
  const offsetY = startIndex * itemHeight;

  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
  }, []);

  // Reset scroll position when projects change
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = 0;
      setScrollTop(0);
    }
  }, [projects.length]);

  if (projects.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-slate-500">No projects found</p>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="overflow-y-auto scrollbar-thin scrollbar-thumb-slate-300 dark:scrollbar-thumb-slate-600 scrollbar-track-transparent"
      style={{ height: containerHeight }}
      onScroll={handleScroll}
    >
      <div style={{ height: totalHeight, position: 'relative' }}>
        <div style={{ transform: `translateY(${offsetY}px)` }}>
          {visibleItems.map((project, index) => (
            <div key={project.id} style={{ height: itemHeight }}>
              <ProjectCard project={project} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
