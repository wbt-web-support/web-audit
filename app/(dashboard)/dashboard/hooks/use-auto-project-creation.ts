import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAppSelector, useAppDispatch } from '@/app/stores/hooks';
import { clearWebsiteUrl } from '@/app/stores/homeSlice';
import { toast } from 'react-toastify';

interface UseAutoProjectCreationProps {
  onProjectCreated?: (projectId: string) => void;
}

export function useAutoProjectCreation({ onProjectCreated }: UseAutoProjectCreationProps = {}) {
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
         
         // Show success message
         toast.success(`Project created successfully for ${websiteUrl}!`);
         
         // Call the callback if provided
         if (onProjectCreated && data.project?.id) {
           onProjectCreated(data.project.id);
         }
         
         // Redirect directly to the audit page (skip dashboard)
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

  return {
    websiteUrl,
    isCreating,
    hasAttempted,
    handleAutoProjectCreation,
  };
}
