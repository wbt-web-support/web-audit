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
        dispatch(clearForm());
      } else {
        toast.error(data.error || "Failed to create project.");
      }
    } catch (error) {
      toast.error("Failed to create project.");
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
        setError(data.error || "Failed to update project");
      }
    } catch (error) {
      setError("Failed to update project");
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
    <div className="w-full max-w-4xl">
      <Card>
        {/* Header Section */}
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
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
                className="mt-1"
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
                      className="mt-1"
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
                      className="mt-1"
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
                      className="mt-1"
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
                      className="mt-1"
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
                    className="mt-1"
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
                className="w-full bg"
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : mode === "create" ? (
                  <Search className="h-4 w-4 mr-2" />
                ) : (
                  <Save className="h-4 w-4 mr-2" />
                )}
                {mode === "create" ? "Search" : "Save Changes"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
