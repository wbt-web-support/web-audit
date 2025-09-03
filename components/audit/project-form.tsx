"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-toastify";

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

// ============================================================================
// INTERFACES
// ============================================================================

interface ProjectFormProps {
  project?: AuditProject | null;
  mode: "create" | "edit";
  onSubmit?: (project: AuditProject) => void;
  projects?: AuditProject[]; // For create mode to check duplicates
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

export function ProjectForm({ project, mode, onSubmit, projects = [] }: ProjectFormProps) {
  // ============================================================================
  // STATE MANAGEMENT
  // ============================================================================
  
  // Loading and error states
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  
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

    setLoading(true);
    setError("");

    try {
      // Prepare payload
      const payload = {
        base_url: projectUrl.trim(),
        crawlType: crawlType,
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
          : null,
        stripe_key_urls: (Array.isArray(stripeKeyUrls) && stripeKeyUrls.filter(u => u && u.trim()).length > 0) 
          ? stripeKeyUrls.filter(u => u && u.trim()) 
          : null,
      };
     
      // API call
      const response = await fetch("/api/audit-projects", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });
      
      const data = await response.json();
      
      if (response.ok) {
        router.push(`/audit?project=${data.project.id}`);
        toast.success("Project created successfully!");
        
        // Show user tier information if available
        if (data.userTier) {
          toast.info(`Current tier: ${data.userTier} - ${data.rateLimitInfo?.remaining || 0} requests remaining`);
        }
        
        dispatch(clearForm());
      } else {
        // Handle specific error codes with enhanced user feedback
        let errorMessage = data.error || "Failed to create project.";
        let shouldRedirect = false;
        
        switch (data.code) {
          case 'RATE_LIMIT_EXCEEDED':
            errorMessage = `Rate limit exceeded. Please try again in ${data.retryAfter || 60} seconds.`;
            break;
          case 'BURST_LIMIT_EXCEEDED':
            errorMessage = `Too many requests too quickly. Please slow down and try again in ${data.retryAfter || 10} seconds.`;
            break;
          case 'DUPLICATE_URL':
            errorMessage = `A project with this URL already exists.`;
            if (data.projectId) {
              errorMessage += ` Project ID: ${data.projectId}`;
            }
            break;
          case 'VALIDATION_ERROR':
            errorMessage = `Validation failed: ${data.details?.join(', ') || 'Invalid data provided'}`;
            break;
          case 'TOO_MANY_PROJECTS':
            errorMessage = `Project limit reached for your tier (${data.userTier}). Current: ${data.currentCount}, Max: ${data.maxAllowed}`;
            break;
          case 'AUTH_REQUIRED':
            errorMessage = "Please log in to create a project.";
            shouldRedirect = true;
            router.push('/auth/login');
            break;
          case 'DB_CONNECTION_ERROR':
            errorMessage = "Database connection failed. Please try again.";
            break;
          case 'DB_TIMEOUT':
            errorMessage = "Database operation timed out. Please try again.";
            break;
          case 'REQUEST_TIMEOUT':
            errorMessage = "Request timed out. Please try again.";
            break;
          case 'DATA_TOO_LARGE':
            errorMessage = "Request data is too large. Please reduce the amount of data.";
            break;
          case 'PAYLOAD_TOO_LARGE':
            errorMessage = "Request payload is too large. Please reduce the amount of data.";
            break;
          default:
            errorMessage = data.error || "Failed to create project.";
        }
        
        toast.error(errorMessage);
        setError(errorMessage);
        
        // Show user tier information in error cases
        if (data.userTier && data.limits) {
          console.log(`User tier: ${data.userTier}`, data.limits);
        }
      }
    } catch (error) {
      console.error('Create project error:', error);
      toast.error("Network error. Please check your connection and try again.");
      setError("Network error occurred");
    } finally {
      setLoading(false);
    }
  };

  /**
   * Edit existing audit project
   * Validates input and sends PUT request to API
   */
  const handleEditProject = async () => {
    if (!projectUrl.trim()) return;

    setLoading(true);
    setError("");

    try {
      // Prepare payload
      const payload = {
        base_url: projectUrl.trim(),
        company_name: companyName.trim() || null,
        phone_number: phoneNumber.trim() || null,
        email: email.trim() || null,
        address: address.trim() || null,
        custom_info: customInfo.trim() || null,
        crawlType: crawlType,
        services: selectedServices,
        instructions: instructions,
        custom_urls: (Array.isArray(urls) && urls.filter(u => u && u.trim()).length > 0) 
          ? urls.filter(u => u && u.trim()) 
          : null,
        stripe_key_urls: (Array.isArray(stripeKeyUrls) && stripeKeyUrls.filter(u => u && u.trim()).length > 0) 
          ? stripeKeyUrls.filter(u => u && u.trim()) 
          : null,
      };
      
      // API call
      const response = await fetch(`/api/audit-projects/${project?.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });
    
      const data = await response.json();
      
      if (response.ok) {
        if (onSubmit && data.project) {
          onSubmit(data.project);
        } else {
          // Update local state to reflect saved project values
          setProjectUrl(data.project.base_url || "");
          setCompanyName(data.project.company_name || "");
          setPhoneNumber(data.project.phone_number || "");
          setEmail(data.project.email || "");
          setAddress(data.project.address || "");
          setCustomInfo(data.project.custom_info || "");
          setCrawlTypeState(data.project.crawl_type === "single" ? "single" : "full");
          router.push(`/audit?project=${data.project.id}`);
          toast.success("Project updated successfully!");
        }
      } else {
        // Handle specific error codes for edit with enhanced feedback
        let errorMessage = data.error || "Failed to update project.";
        let shouldRedirect = false;
        
        switch (data.code) {
          case 'RATE_LIMIT_EXCEEDED':
            errorMessage = `Rate limit exceeded. Please try again in ${data.retryAfter || 60} seconds.`;
            break;
          case 'BURST_LIMIT_EXCEEDED':
            errorMessage = `Too many requests too quickly. Please slow down and try again in ${data.retryAfter || 10} seconds.`;
            break;
          case 'VALIDATION_ERROR':
            errorMessage = `Validation failed: ${data.details?.join(', ') || 'Invalid data provided'}`;
            break;
          case 'AUTH_REQUIRED':
            errorMessage = "Please log in to update the project.";
            shouldRedirect = true;
            router.push('/auth/login');
            break;
          case 'DB_CONNECTION_ERROR':
            errorMessage = "Database connection failed. Please try again.";
            break;
          case 'DB_TIMEOUT':
            errorMessage = "Database operation timed out. Please try again.";
            break;
          case 'REQUEST_TIMEOUT':
            errorMessage = "Request timed out. Please try again.";
            break;
          case 'DATA_TOO_LARGE':
            errorMessage = "Request data is too large. Please reduce the amount of data.";
            break;
          default:
            errorMessage = data.error || "Failed to update project.";
        }
        
        setError(errorMessage);
        toast.error(errorMessage);
        
        // Show user tier information in error cases
        if (data.userTier && data.limits) {
          console.log(`User tier: ${data.userTier}`, data.limits);
        }
      }
    } catch (error) {
      console.error('Edit project error:', error);
      setError("Network error occurred");
      toast.error("Network error. Please check your connection and try again.");
    } finally {
      setLoading(false);
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
    <Card className="h-full">
      {/* Header Section */}
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
            <Plus className="h-4 w-4 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <CardTitle>{title}</CardTitle>
            <CardDescription>{description}</CardDescription>
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

          {error && (
            <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3 mb-4">
              <div className="flex items-center gap-2 text-destructive">
                <span>{error}</span>
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
                {mode === "edit" ? (
                  <CustomInstructions
                    projectInstructions={project?.instructions || []}
                    loading={loading}
                    isProjectRunning={isProjectRunning}
                  />
                ) : (
                  <CustomInstructions />
                )}
              </div>
            )}

            {/* Stripe Key URLs - Conditional based on service selection */}
            {selectedServices.includes('check_stripe_keys') && (
              <div className="check_stripe_keys">
                <CheckStripKeys />
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
  );
}
