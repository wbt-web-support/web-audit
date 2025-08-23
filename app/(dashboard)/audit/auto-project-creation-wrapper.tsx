'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAppSelector, useAppDispatch } from '@/app/stores/hooks';
import { clearWebsiteUrl } from '@/app/stores/homeSlice';
import { initializeSession, setActiveProject, setProjectStatus, updateProjectData } from '@/app/stores/auditSlice';
import { toast } from 'react-toastify';

interface AutoProjectCreationWrapperProps {
  children: React.ReactNode;
}

export function AutoProjectCreationWrapper({ children }: AutoProjectCreationWrapperProps) {
  const [isCreating, setIsCreating] = useState(false);
  const [hasAttempted, setHasAttempted] = useState(false);
  const router = useRouter();
  const dispatch = useAppDispatch();
  
  // Get the stored website URL from Redux
  const websiteUrl = useAppSelector((state) => state.home.websiteUrl);

  useEffect(() => {
    // Only run once after component mounts and if we haven't attempted yet
    if (websiteUrl && !hasAttempted && !isCreating) {
      console.log('Auto-project creation triggered for URL:', websiteUrl);
      setHasAttempted(true);
      handleAutoProjectCreation();
    }
  }, [websiteUrl, hasAttempted, isCreating]);

  const handleAutoProjectCreation = async () => {
    if (!websiteUrl || isCreating) return;

    console.log('Starting auto-project creation for:', websiteUrl);
    setIsCreating(true);
    
    try {
      // Prepare the project payload
      const payload = {
        base_url: websiteUrl.trim(),
        crawlType: "full", // Always set to full crawl as requested
        services: [
          'check_custom_urls',
          'contact_details_consistency',
          'custom_instructions'
        ], // Default services
        companyDetails: {
          companyName: "",
          phoneNumber: "",
          email: "",
          address: "",
          customInfo: "",
        },
        instructions: [],
        custom_urls: null,
        stripe_key_urls: null,
      };

      console.log('Project payload:', payload);

      // Create the project via API
      const response = await fetch("/api/audit-projects", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (response.ok) {
        // Clear the stored URL from Redux
        dispatch(clearWebsiteUrl());
        
        // Initialize the audit session in Redux for the new project
        dispatch(initializeSession({ 
          projectId: data.project.id, 
          baseUrl: data.project.base_url 
        }));
        
        // Set this as the active project
        dispatch(setActiveProject({ projectId: data.project.id }));
        
        // Set the project status to show it's ready/running
        dispatch(setProjectStatus({ 
          projectId: data.project.id, 
          status: data.project.status || 'ready',
          isCrawling: false,
          currentAction: 'Project created successfully'
        }));
        
        // Store the full project data in Redux
        dispatch(updateProjectData({ 
          projectId: data.project.id, 
          projectData: data.project 
        }));
        
        // Show success message
        toast.success(`Project created successfully for ${websiteUrl}!`);
        
        // Redirect to the specific project page
        router.push(`/audit?project=${data.project.id}`);
      } else {
        throw new Error(data.error || "Failed to create project");
      }
    } catch (error) {
      console.error('Auto project creation failed:', error);
      toast.error("Failed to automatically create project. Please create it manually.");
      
      // Clear the stored URL even on failure to prevent infinite retries
      dispatch(clearWebsiteUrl());
    } finally {
      setIsCreating(false);
    }
  };

  // Show loading state while creating project
  if (isCreating) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center py-8 max-w-md mx-auto">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-6"></div>
          <h2 className="text-xl font-semibold mb-2 text-slate-900">Creating Your Project</h2>
          <p className="mb-6 text-slate-600">
            Setting up audit project for {websiteUrl}...
          </p>
          <div className="text-sm text-slate-500">
            This will only take a moment
          </div>
        </div>
      </div>
    );
  }

  // Render children normally if no auto-project creation is needed
  return <>{children}</>;
}
