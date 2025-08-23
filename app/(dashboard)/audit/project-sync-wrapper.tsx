'use client';

import { useProjectSync } from './hooks/use-project-sync';

interface ProjectSyncWrapperProps {
  children: React.ReactNode;
}

export function ProjectSyncWrapper({ children }: ProjectSyncWrapperProps) {
  // Use the project sync hook to keep project state updated
  const { projectId, currentProject, isSyncing } = useProjectSync();

  // This component doesn't render anything special, it just ensures the hook runs
  // to keep the project state synchronized with the server
  
  return <>{children}</>;
}
