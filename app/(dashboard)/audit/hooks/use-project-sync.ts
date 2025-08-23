import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useAppSelector, useAppDispatch } from '@/app/stores/hooks';
import { updateProjectData, setProjectStatus } from '@/app/stores/auditSlice';

export function useProjectSync() {
  const [isSyncing, setIsSyncing] = useState(false);
  const searchParams = useSearchParams();
  const dispatch = useAppDispatch();
  
  // Get the project ID from URL
  const projectId = searchParams.get('project');
  
  // Get the current project data from Redux
  const currentProject = useAppSelector((state) => 
    projectId ? state.audit.sessions[projectId]?.projectData : null
  );

  // Sync project data from server
  const syncProjectData = async () => {
    if (!projectId || isSyncing) return;

    setIsSyncing(true);
    
    try {
      const response = await fetch(`/api/audit-projects/${projectId}`);
      
      if (response.ok) {
        const data = await response.json();
        
        if (data.project) {
          // Update project data in Redux
          dispatch(updateProjectData({ 
            projectId, 
            projectData: data.project 
          }));
          
          // Update project status
          dispatch(setProjectStatus({ 
            projectId, 
            status: data.project.status || 'ready',
            isCrawling: data.project.status === 'crawling' || data.project.status === 'analyzing',
            currentAction: data.project.status === 'crawling' ? 'Crawling in progress...' : 
                          data.project.status === 'analyzing' ? 'Analysis in progress...' : 
                          'Project ready'
          }));
        }
      }
    } catch (error) {
      console.error('Failed to sync project data:', error);
    } finally {
      setIsSyncing(false);
    }
  };

  // Sync project data when component mounts or project ID changes
  useEffect(() => {
    if (projectId) {
      syncProjectData();
    }
  }, [projectId]);

  // Set up periodic sync for running projects
  useEffect(() => {
    if (!projectId || !currentProject) return;

    const isRunning = currentProject.status === 'crawling' || currentProject.status === 'analyzing';
    
    if (isRunning) {
      // Sync every 5 seconds for running projects
      const interval = setInterval(syncProjectData, 5000);
      return () => clearInterval(interval);
    }
  }, [projectId, currentProject?.status]);

  return {
    projectId,
    currentProject,
    isSyncing,
    syncProjectData,
  };
}
