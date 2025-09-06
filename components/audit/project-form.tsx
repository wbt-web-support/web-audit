"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-toastify";
import { useProjects } from "@/lib/hooks/useProjects";
import { useUser } from "@/lib/contexts/UserContext";
import { apiClient } from "@/lib/api-client";

// UI Components
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

// Icons
import {
  Loader2,
  Save,
  Building,
  Phone,
  Mail,
  MapPin,
  FileText,
  Globe,
  Plus,
  Trash2,
  Search,
  CheckCircle,
  Clock,
} from "lucide-react";

// Types and Interfaces
import { AuditProject, AuditProjectStatus } from "@/lib/types/database";
import { RootState } from "@/app/stores/store";

// Redux Actions
import {
  setCompanyDetails,
  setCrawlType,
  setInputUrl,
  setSelectedServices,
  setInstructions,
  clearForm,
  setUrls,
} from "@/app/stores/dashboardFormSlice";

// Custom Components
import CustomInstructions from "@/app/(dashboard)/dashboard/components/CustomInstructions";
import ServicesDropdown from "@/app/(dashboard)/dashboard/components/ServicesDropdown";
import CustomUrls from "@/app/(dashboard)/dashboard/components/CustomUrls";
import CheckStripKeys from "@/app/(dashboard)/dashboard/components/CheckStripKeys";

// Tier Components
import { TierStatusCard } from "@/components/ui/tier-status-card";
import { LimitWarning } from "@/components/ui/limit-warning";
import { UpgradePrompt } from "@/components/ui/upgrade-prompt";
import { RouteProtection } from "@/components/auth/route-protection";

// ============================================================================
// INTERFACES
// ============================================================================

interface ProjectFormProps {
  project?: AuditProject | null;
  mode: "create" | "edit";
  onSubmit?: (project: AuditProject) => void;
  projects?: AuditProject[]; // For create mode to check duplicates
  // Callback for when a new project is created (for dashboard updates)
  onProjectCreated?: (project: AuditProject) => void;
}

interface CompanyDetails {
  companyName: string;
  phoneNumber: string;
  email: string;
  address: string;
  customInfo: string;
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function ProjectForm({ project, mode, onSubmit, projects = [], onProjectCreated }: ProjectFormProps) {
  // ============================================================================
  // STATE MANAGEMENT
  // ============================================================================
  
  // Use the new projects hook
  const { createProject, updateProject, getProject, loading, error } = useProjects();
  
  // Use tier system
  const { user, tier, canCreateProject, getRemainingProjects } = useUser();
  
  // Local error state for form-specific errors
  const [formError, setFormError] = useState("");
  
  // Project limits state
  const [projectLimits, setProjectLimits] = useState<{
    tenantInfo: {
      tier: string;
      subscriptionStatus: string;
    };
    limits: {
      maxProjects: number;
      maxAuditsPerDay: number;
      maxConcurrentAudits: number;
    };
    usage: {
      projects: {
        current: number;
        max: number;
        remaining: number;
      };
      audits: {
        today: number;
        maxPerDay: number;
        remaining: number;
      };
    };
  } | null>(null);
  const [limitsLoading, setLimitsLoading] = useState(false);
  
  // Form field states
  const [projectUrl, setProjectUrl] = useState(project?.base_url || "");
  const [companyName, setCompanyName] = useState(project?.company_name || "");
  const [phoneNumber, setPhoneNumber] = useState(project?.phone_number || "");
  const [email, setEmail] = useState(project?.email || "");
  const [address, setAddress] = useState(project?.address || "");
  const [customInfo, setCustomInfo] = useState(project?.custom_info || "");
  const [crawlType, setCrawlTypeState] = useState<"full" | "single">(
    project?.crawl_type === "single" ? "single" : "full"
  );

  // ============================================================================
  // HOOKS AND UTILITIES
  // ============================================================================
  
  const router = useRouter();
  const dispatch = useDispatch();
  
  // Redux state selectors
  const { 
    inputUrl, 
    selectedServices, 
    instructions, 
    urls, 
    stripeKeyUrls 
  } = useSelector((state: RootState) => state.dashboardForm);

  // URL normalization utility
  const normalizeUrl = (url: string) => url.replace(/\/+$/, "").toLowerCase();

  // Fetch project limits from projects/limits API
  const fetchProjectLimits = async () => {
    if (mode !== "create") return; // Only fetch for create mode
    
    // Safety check - ensure we have required data
    if (!user) {
      console.warn('No user available for fetching project limits');
      return;
    }
    
    setLimitsLoading(true);
    try {
      const response = await apiClient.getProjectLimits();
      console.log('Project limits API response:', response);
      
      if (response.success && response.data) {
        // Safely access nested properties with fallbacks
        const tenantInfo = response.data.tenantInfo || {};
        const limits = response.data.limits || {};
        const usage = response.data.usage || {};
        const projectsUsage = usage.projects || {};
        const auditsUsage = usage.audits || {};
        
        setProjectLimits({
          tenantInfo: {
            tier: tenantInfo.tier || (tier && typeof tier === 'string' ? tier : 'BASIC'),
            subscriptionStatus: tenantInfo.subscriptionStatus || 'active',
          },
          limits: {
            maxProjects: limits.maxProjects || 5,
            maxAuditsPerDay: limits.maxAuditsPerDay || 10,
            maxConcurrentAudits: limits.maxConcurrentAudits || 2,
          },
          usage: {
            projects: {
              current: projectsUsage.current || (Array.isArray(projects) ? projects.length : 0),
              max: projectsUsage.max || limits.maxProjects || 5,
              remaining: projectsUsage.remaining || Math.max(0, (limits.maxProjects || 5) - (projectsUsage.current || (Array.isArray(projects) ? projects.length : 0))),
            },
            audits: {
              today: auditsUsage.today || 0,
              maxPerDay: auditsUsage.maxPerDay || limits.maxAuditsPerDay || 10,
              remaining: auditsUsage.remaining || (limits.maxAuditsPerDay || 10),
            },
          },
        });
      } else {
        console.warn('API response not successful or missing data:', response);
        throw new Error('Invalid API response');
      }
    } catch (error) {
      console.error('Failed to fetch project limits:', error);
      // Fallback to basic limits if API fails
      setProjectLimits({
        tenantInfo: {
          tier: (tier && typeof tier === 'string') ? tier : 'BASIC',
          subscriptionStatus: 'active',
        },
        limits: {
          maxProjects: 5, // Default BASIC tier
          maxAuditsPerDay: 10,
          maxConcurrentAudits: 2,
        },
        usage: {
          projects: {
            current: Array.isArray(projects) ? projects.length : 0,
            max: 5,
            remaining: Math.max(0, 5 - (Array.isArray(projects) ? projects.length : 0)),
          },
          audits: {
            today: 0,
            maxPerDay: 10,
            remaining: 10,
          },
        },
      });
    } finally {
      setLimitsLoading(false);
    }
  };

  // ============================================================================
  // EFFECTS
  // ============================================================================

  /**
   * Initialize form with project data when editing
   * Loads all project data into local state and Redux store
   */
  useEffect(() => {
    if (project) {
      // Set local form state
      setProjectUrl(project.base_url || "");
      setCompanyName(project.company_name || "");
      setPhoneNumber(project.phone_number || "");
      setEmail(project.email || "");
      setAddress(project.address || "");
      setCustomInfo(project.custom_info || "");
      setCrawlTypeState(project.crawl_type === "single" ? "single" : "full");
      
      // Load services into Redux store
      if (project.services && project.services.length > 0) {
        dispatch(setSelectedServices(project.services));
      }
      
      // Load instructions into Redux store
      if (project.instructions && project.instructions.length > 0) {
        dispatch(setInstructions(project.instructions));
      }

      // Load custom URLs into Redux store
      if (Array.isArray(project.custom_urls) && project.custom_urls.length > 0) {
        dispatch(setUrls(project.custom_urls));
      } else {
        dispatch(setUrls([""]));
      }
    }
  }, [project, dispatch]);

  /**
   * Fetch project limits for create mode
   */
  useEffect(() => {
    if (mode === "create" && user) {
      fetchProjectLimits();
    }
  }, [mode, user]);

  /**
   * Handle crawl type changes
   * - For single page crawl: Reset URLs and deselect custom URLs service
   * - For full crawl: Allow custom URLs service
   */
  useEffect(() => {
    if (crawlType === 'single') {
      dispatch(setUrls(['']));
      // Deselect 'check_custom_urls' if selected for single page crawl
      if (selectedServices.includes('check_custom_urls')) {
        dispatch(setSelectedServices(selectedServices.filter(s => s !== 'check_custom_urls')));
      }
    }
  }, [crawlType, dispatch, selectedServices]);

  /**
   * Sync company details to Redux store
   * Updates Redux whenever company details change
   */
  useEffect(() => {
    dispatch(
      setCompanyDetails({
        companyName,
        phoneNumber,
        email,
        address,
        customInfo,
      })
    );
  }, [companyName, phoneNumber, email, address, customInfo, dispatch]);

  /**
   * Sync URL to Redux for create mode
   * Only syncs in create mode to avoid conflicts with edit mode
   */
  useEffect(() => {
    if (mode === "create") {
      dispatch(setInputUrl(projectUrl));
    }
  }, [projectUrl, mode, dispatch]);

  // ============================================================================
  // EVENT HANDLERS
  // ============================================================================

  /**
   * Main form submission handler
   * Routes to appropriate handler based on mode
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (mode === "create") {
      await handleCreateProject();
    } else {
      await handleEditProject();
    }
  };

  /**
   * Create new audit project
   * Validates input and sends POST request to API
   */
  const handleCreateProject = async () => {
    // Validation
    if (!projectUrl.trim()) {
      toast.error("Please enter a valid URL.");
      return;
    }

    // Note: Project limits are now validated server-side only
    // Client-side validation removed for security and maintainability

    setFormError("");

    try {
      // Prepare payload
      const projectData = {
        base_url: projectUrl.trim(),
        crawl_type: crawlType,
        services: selectedServices,
        companyDetails: {
          companyName,
          phoneNumber,
          email,
          address,
          customInfo,
        },
        instructions: instructions,
        custom_urls: (Array.isArray(urls) && urls.filter(u => u && u.trim()).length > 0) 
          ? urls.filter(u => u && u.trim()) 
          : undefined,
        stripe_key_urls: (Array.isArray(stripeKeyUrls) && stripeKeyUrls.filter(u => u && u.trim()).length > 0) 
          ? stripeKeyUrls.filter(u => u && u.trim()) 
          : undefined,
      };
     
      // Use the new API client
      const success = await createProject(projectData);
      console.log('Project creation result:', success);
      if (success) {
        // Call the onProjectCreated callback if provided
        if (onProjectCreated) {
          // Create a mock project object for the callback
          const createdProject: AuditProject = {
            id: Date.now().toString(), // Generate a temporary ID
            base_url: projectUrl.trim(),
            company_name: companyName.trim() || null,
            phone_number: phoneNumber.trim() || null,
            email: email.trim() || null,
            address: address.trim() || null,
            custom_info: customInfo.trim() || null,
            crawl_type: crawlType,
            services: selectedServices,
            instructions: instructions,
            custom_urls: (Array.isArray(urls) && urls.filter(u => u && u.trim()).length > 0) 
              ? urls.filter(u => u && u.trim()) 
              : null,
            status: 'pending' as AuditProjectStatus,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            user_id: user?.id || '',
            total_pages: 0,
            pages_analyzed: 0,
            pages_crawled: 0,
            completed_at: null,
            error_message: null,
            custom_urls_analysis: undefined,
            all_image_analysis: undefined,
            all_links_analysis: undefined
          };
          onProjectCreated(createdProject);
        }
        
        router.push(`/audit?project=${projectUrl.trim()}`);
        toast.success("Project created successfully!");
        dispatch(clearForm());
      } else {
        // Handle error from the hook
        const errorMessage = error || "Failed to create project.";
        console.log('ProjectForm received error:', errorMessage);
        
        // Show different toast styles based on error type
        if (errorMessage.includes('already have a project') || errorMessage.includes('A project with this URL already exists')) {
          toast.warning("You already have a project with this URL");
        } else if (errorMessage.includes('Project limit exceeded')) {
          // Show project limit error with warning style for better UX
          toast.warning(errorMessage, {
            autoClose: 6000, // Show longer for important message
            hideProgressBar: false,
          });
        } else {
          toast.error(errorMessage);
        }
        
        setFormError(errorMessage);
      }
    } catch (err) {
      console.error('Create project error:', err);
      const errorMessage = "Network error. Please check your connection and try again.";
      toast.error(errorMessage);
      setFormError(errorMessage);
    }
  };

  /**
   * Edit existing audit project
   * Validates input and sends PUT request to API
   */
  const handleEditProject = async () => {
    if (!projectUrl.trim() || !project?.id) return;

    setFormError("");

    try {
      // Prepare payload
      const updateData = {
        base_url: projectUrl.trim(),
        company_name: companyName.trim() || null,
        phone_number: phoneNumber.trim() || null,
        email: email.trim() || null,
        address: address.trim() || null,
        custom_info: customInfo.trim() || null,
        crawl_type: crawlType,
        services: selectedServices,
        instructions: instructions,
        custom_urls: (Array.isArray(urls) && urls.filter(u => u && u.trim()).length > 0) 
          ? urls.filter(u => u && u.trim()) 
          : undefined,
        stripe_key_urls: (Array.isArray(stripeKeyUrls) && stripeKeyUrls.filter(u => u && u.trim()).length > 0) 
          ? stripeKeyUrls.filter(u => u && u.trim()) 
          : undefined,
      };
      
      // Use the new API client
      const success = await updateProject(project.id, updateData);
      
      if (success) {
        if (onSubmit) {
          // Get the updated project data
          const updatedProject = await getProject(project.id);
          onSubmit(updatedProject);
        } else {
          // Update local state to reflect saved project values
          setProjectUrl(updateData.base_url);
          setCompanyName(updateData.company_name || "");
          setPhoneNumber(updateData.phone_number || "");
          setEmail(updateData.email || "");
          setAddress(updateData.address || "");
          setCustomInfo(updateData.custom_info || "");
          setCrawlTypeState(updateData.crawl_type === "single" ? "single" : "full");
          router.push(`/audit?project=${project.id}`);
        }
        toast.success("Project updated successfully!");
      } else {
        // Handle error from the hook
        const errorMessage = error || "Failed to update project.";
        toast.error(errorMessage);
        setFormError(errorMessage);
      }
    } catch (err) {
      console.error('Edit project error:', err);
      const errorMessage = "Network error. Please check your connection and try again.";
      toast.error(errorMessage);
      setFormError(errorMessage);
    }
  };

  // ============================================================================
  // COMPUTED VALUES
  // ============================================================================

  const title = mode === "create" ? "Create New Audit Project" : "Edit Project";
  const description = mode === "create"
    ? "Enter website URL and company details to verify consistency across all pages"
    : "Update website URL and company information for verification";

  // Check if project is running and prevent editing
  const isProjectRunning = Boolean(
    project && (project.status === "crawling" || project.status === "analyzing")
  );

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <div className="space-y-6">
      {/* Tier Status Card - Only show in create mode */}
      {mode === "create" && projectLimits && (
        <TierStatusCard 
          projectLimits={projectLimits}
          loading={limitsLoading}
        />
      )}

      {/* Limit Warning - Only show in create mode */}
      {mode === "create" && projectLimits && (
        <LimitWarning 
          resource="projects" 
          projectLimits={projectLimits}
          loading={limitsLoading}
        />
      )}

      <Card className="h-full">
        {/* Header Section */}
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
              <Plus className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <CardTitle>{title}</CardTitle>
              <CardDescription>
                {mode === "create" 
                  ? `${description} (${getRemainingProjects()} projects remaining in your ${tier} tier)`
                  : description
                }
              </CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {/* Status Messages */}
          {isProjectRunning && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-4">
              <div className="flex items-center gap-2 text-amber-700">
                <span>
                  This project is currently {project?.status}. You cannot edit
                  it while it's running.
                </span>
              </div>
            </div>
          )}

          {(error || formError) && (
            <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3 mb-4">
              <div className="flex items-center gap-2 text-destructive">
                <span>{formError || error}</span>
              </div>
            </div>
          )}

          {/* Main Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* ========================================
                BASIC PROJECT INFORMATION
            ========================================= */}
            
            {/* Website URL Input */}
            <div>
              <Label htmlFor="url" className="flex items-center gap-2">
                <Globe className="h-4 w-4" />
                Website URL *
              </Label>
              <Input
                id="url"
                type="url"
                placeholder="https://example.com"
                value={projectUrl}
                onChange={(e) => setProjectUrl(e.target.value)}
                disabled={loading || isProjectRunning}
                required
                className="form-input mt-1"
              />
            </div>

            {/* Crawl Type Selection */}
            <div>
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4 ml-0 sm:ml-2">
                <div className="flex gap-4">
                  <label className="flex items-center gap-1 text-sm">
                    <input
                      type="radio"
                      name="crawlType"
                      value="full"
                      checked={crawlType === "full"}
                      onChange={() => {
                        setCrawlTypeState("full");
                        dispatch(setCrawlType("full"));
                      }}
                    />
                    Full Website
                  </label>
                  <label className="flex items-center gap-1 text-sm">
                    <input
                      type="radio"
                      name="crawlType"
                      value="single"
                      checked={crawlType === "single"}
                      onChange={() => {
                        setCrawlTypeState("single");
                        dispatch(setCrawlType("single"));
                      }}
                    />
                    Single Page
                  </label>
                </div>
              </div>
            </div>

            {/* ========================================
                SERVICES CONFIGURATION
            ========================================= */}
            
            {/* Services Dropdown */}
            <div className="w-full">
              <ServicesDropdown />
            </div>

            {/* Custom Instructions - Conditional based on service selection */}
            {selectedServices.includes('custom_instructions') && (
              <div className="custom_instructions">
                <RouteProtection requiredTier="PRO">
                  {mode === "edit" ? (
                    <CustomInstructions
                      projectInstructions={project?.instructions || []}
                      loading={loading}
                      isProjectRunning={isProjectRunning}
                    />
                  ) : (
                    <CustomInstructions />
                  )}
                </RouteProtection>
              </div>
            )}

            {/* Stripe Key URLs - Conditional based on service selection */}
            {selectedServices.includes('check_stripe_keys') && (
              <div className="check_stripe_keys">
                <RouteProtection requiredTier="ENTERPRISE">
                  <CheckStripKeys />
                </RouteProtection>
              </div>
            )}

            {/* ========================================
                COMPANY DETAILS SECTION
            ========================================= */}
            
            {/* Company Details - Only show when contact_details_consistency is selected */}
            {selectedServices.includes('contact_details_consistency') && (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Company Name */}
                  <div>
                    <Label htmlFor="companyName" className="flex items-center gap-2">
                      <Building className="h-4 w-4" />
                      Company Name
                    </Label>
                    <Input
                      id="companyName"
                      type="text"
                      placeholder="Acme Corporation"
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      disabled={loading || isProjectRunning}
                      className="form-input mt-1"
                    />
                  </div>

                  {/* Phone Number */}
                  <div>
                    <Label htmlFor="phoneNumber" className="flex items-center gap-2">
                      <Phone className="h-4 w-4" />
                      Phone Number
                    </Label>
                    <Input
                      id="phoneNumber"
                      type="tel"
                      placeholder="+1 (555) 123-4567"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      disabled={loading || isProjectRunning}
                      className="form-input mt-1"
                    />
                  </div>

                  {/* Email Address */}
                  <div>
                    <Label htmlFor="email" className="flex items-center gap-2">
                      <Mail className="h-4 w-4" />
                      Email Address
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="contact@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      disabled={loading || isProjectRunning}
                      className="form-input mt-1"
                    />
                  </div>

                  {/* Address */}
                  <div>
                    <Label htmlFor="address" className="flex items-center gap-2">
                      <MapPin className="h-4 w-4" />
                      Address
                    </Label>
                    <Input
                      id="address"
                      type="text"
                      placeholder="123 Main St, City, State 12345"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      disabled={loading || isProjectRunning}
                      className="form-input mt-1"
                    />
                  </div>
                </div>

                {/* Additional Information */}
                <div>
                  <Label htmlFor="customInfo" className="flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Additional Information
                  </Label>
                  <Input
                    id="customInfo"
                    type="text"
                    placeholder="Any other information to verify (hours, services, etc.)"
                    value={customInfo}
                    onChange={(e) => setCustomInfo(e.target.value)}
                    disabled={loading || isProjectRunning}
                    className="form-input mt-1"
                  />
                </div>
              </>
            )}

            {/* ========================================
                CUSTOM URLS SECTION
            ========================================= */}
            
            {/* Custom URLs - Only show for full crawl with custom URLs service */}
            {selectedServices.includes('check_custom_urls') && crawlType === 'full' && (
              <div className="custom_urls">
                <CustomUrls crawlType={crawlType} />
              </div>
            )}

            {/* ========================================
                ACTION BUTTONS
            ========================================= */}
            
            <div className="flex flex-col sm:flex-row items-stretch gap-3 pt-4">
              <Button
                type="submit"
                disabled={loading || !projectUrl.trim() || isProjectRunning}
                className="btn-primary w-full"
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : mode === "create" ? (
                  <Search className="h-4 w-4 mr-2" />
                ) : (
                  <Save className="h-4 w-4 mr-2" />
                )}
                {mode === "create" ? "Start Audit" : "Save Changes"}
              </Button>
            </div>

            {/* ========================================
                FEATURES SECTION
            ========================================= */}
            
            <div className="border-t border-slate-200 dark:border-slate-700 pt-6 mt-6">
              <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-4 flex items-center gap-2">
                <div className="p-1 bg-emerald-100 dark:bg-emerald-900/20 rounded">
                  <CheckCircle className="h-3 w-3 text-emerald-600 dark:text-emerald-400" />
                </div>
                What You'll Get
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="flex items-start gap-2">
                  <div className="w-2 h-2 bg-emerald-500 rounded-full mt-2 flex-shrink-0"></div>
                  <span className="text-xs text-slate-600 dark:text-slate-400">Comprehensive page analysis</span>
                </div>
                <div className="flex items-start gap-2">
                  <div className="w-2 h-2 bg-emerald-500 rounded-full mt-2 flex-shrink-0"></div>
                  <span className="text-xs text-slate-600 dark:text-slate-400">Consistency verification</span>
                </div>
                <div className="flex items-start gap-2">
                  <div className="w-2 h-2 bg-emerald-500 rounded-full mt-2 flex-shrink-0"></div>
                  <span className="text-xs text-slate-600 dark:text-slate-400">SEO optimization insights</span>
                </div>
                <div className="flex items-start gap-2">
                  <div className="w-2 h-2 bg-emerald-500 rounded-full mt-2 flex-shrink-0"></div>
                  <span className="text-xs text-slate-600 dark:text-slate-400">Performance metrics</span>
                </div>
                <div className="flex items-start gap-2">
                  <div className="w-2 h-2 bg-emerald-500 rounded-full mt-2 flex-shrink-0"></div>
                  <span className="text-xs text-slate-600 dark:text-slate-400">Mobile responsiveness check</span>
                </div>
                <div className="flex items-start gap-2">
                  <div className="w-2 h-2 bg-emerald-500 rounded-full mt-2 flex-shrink-0"></div>
                  <span className="text-xs text-slate-600 dark:text-slate-400">Accessibility compliance</span>
                </div>
              </div>
            </div>

           
          </form>
        </CardContent>
      </Card>

      {/* Upgrade Prompts for Lower Tiers - Only show in create mode */}
      {mode === "create" && tier === "BASIC" && (
        <UpgradePrompt feature="advanced audit options and custom instructions" />
      )}
      
      {mode === "create" && tier === "PRO" && (
        <UpgradePrompt feature="enterprise features like Stripe key auditing" />
      )}
    </div>
  );
}
