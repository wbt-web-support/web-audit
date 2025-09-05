import { useState, useEffect, useCallback } from 'react';
import { apiClient, type ProjectData, type ProjectResponse, type ProjectsListResponse } from '@/lib/api-client';
import { useAuthWithBackend } from './useAuthWithBackend';

interface UseProjectsReturn {
  projects: any[];
  loading: boolean;
  error: string | null;
  createProject: (projectData: ProjectData) => Promise<boolean>;
  updateProject: (projectId: string, updateData: any) => Promise<boolean>;
  deleteProject: (projectId: string) => Promise<boolean>;
  refreshProjects: () => Promise<void>;
  getProject: (projectId: string) => Promise<any>;
  startAudit: (projectId: string) => Promise<boolean>;
  getAuditResults: (projectId: string) => Promise<any>;
  getAuditStatus: (projectId: string) => Promise<any>;
}

export function useProjects(): UseProjectsReturn {
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const { user, isAuthenticated } = useAuthWithBackend();

  // Load projects when user is authenticated
  const loadProjects = useCallback(async () => {
    if (!isAuthenticated || !user) {
      setProjects([]);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response: ProjectsListResponse = await apiClient.getProjects();
      setProjects(response.projects || []);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load projects';
      
      // Check if it's a backend connection error
      if (errorMessage.includes('Not Found') || errorMessage.includes('Failed to fetch')) {
        setError('Backend server is not running. Please start your Fastify backend server.');
        console.error('Backend connection error:', err);
      } else {
        setError(errorMessage);
        console.error('Error loading projects:', err);
      }
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, user]);

  // Load projects on mount and when authentication state changes
  // useEffect(() => {
  //   loadProjects();
  // }, [loadProjects]);

  // Create a new project
  const createProject = useCallback(async (projectData: ProjectData): Promise<boolean> => {
    if (!isAuthenticated) {
      setError('Authentication required');
      return false;
    }

    setLoading(true);
    setError(null);

    try {
      // Check if backend is available first
      const connectionTest = await apiClient.testConnection();
      if (connectionTest.status === 'error') {
        setError('Backend server is not running. Please start your Fastify backend server.');
        return false;
      }
      const response: ProjectResponse = await apiClient.createProject(projectData);
      
      // Add the new project to the list
      setProjects(prev => [response.project, ...prev]);
      
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create project';
      
      // Check if it's a backend connection error
      if (errorMessage.includes('Not Found') || errorMessage.includes('Failed to fetch')) {
        setError('Backend server is not running. Please start your Fastify backend server.');
      } else {
        setError(errorMessage);
      }
      console.error('Error creating project:', err);
      return false;
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  // Update an existing project
  const updateProject = useCallback(async (projectId: string, updateData: any): Promise<boolean> => {
    if (!isAuthenticated) {
      setError('Authentication required');
      return false;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await apiClient.updateProject(projectId, updateData);
      
      // Update the project in the list
      setProjects(prev => prev.map(project => 
        project.id === projectId ? { ...project, ...response.project } : project
      ));
      
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update project';
      setError(errorMessage);
      console.error('Error updating project:', err);
      return false;
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  // Delete a project
  const deleteProject = useCallback(async (projectId: string): Promise<boolean> => {
    if (!isAuthenticated) {
      setError('Authentication required');
      return false;
    }

    setLoading(true);
    setError(null);

    try {
      await apiClient.deleteProject(projectId);
      
      // Remove the project from the list
      setProjects(prev => prev.filter(project => project.id !== projectId));
      
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete project';
      setError(errorMessage);
      console.error('Error deleting project:', err);
      return false;
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  // Get a specific project
  const getProject = useCallback(async (projectId: string): Promise<any> => {
    if (!isAuthenticated) {
      throw new Error('Authentication required');
    }

    try {
      return await apiClient.getProject(projectId);
    } catch (err) {
      console.error('Error getting project:', err);
      throw err;
    }
  }, [isAuthenticated]);

  // Start an audit for a project
  const startAudit = useCallback(async (projectId: string): Promise<boolean> => {
    if (!isAuthenticated) {
      setError('Authentication required');
      return false;
    }

    setLoading(true);
    setError(null);

    try {
      await apiClient.startAudit(projectId);
      
      // Update the project status in the list
      setProjects(prev => prev.map(project => 
        project.id === projectId ? { ...project, status: 'running' } : project
      ));
      
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to start audit';
      setError(errorMessage);
      console.error('Error starting audit:', err);
      return false;
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  // Get audit results for a project
  const getAuditResults = useCallback(async (projectId: string): Promise<any> => {
    if (!isAuthenticated) {
      throw new Error('Authentication required');
    }

    try {
      return await apiClient.getAuditResults(projectId);
    } catch (err) {
      console.error('Error getting audit results:', err);
      throw err;
    }
  }, [isAuthenticated]);

  // Get audit status for a project
  const getAuditStatus = useCallback(async (projectId: string): Promise<any> => {
    if (!isAuthenticated) {
      throw new Error('Authentication required');
    }

    try {
      return await apiClient.getAuditStatus(projectId);
    } catch (err) {
      console.error('Error getting audit status:', err);
      throw err;
    }
  }, [isAuthenticated]);

  // Refresh projects list
  const refreshProjects = useCallback(async (): Promise<void> => {
    await loadProjects();
  }, [loadProjects]);

  return {
    projects,
    loading,
    error,
    createProject,
    updateProject,
    deleteProject,
    refreshProjects,
    getProject,
    startAudit,
    getAuditResults,
    getAuditStatus
  };
}
