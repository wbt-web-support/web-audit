"use client";

import { useState, useEffect } from "react";
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
import { AuditProject, AuditProjectStatus } from "@/lib/types/database";
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
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import { useDispatch, useSelector } from "react-redux";
import {
  setCompanyDetails,
  setCrawlType,
  setInputUrl,
  setSelectedServices,
  setInstructions,
  clearForm,
  setUrls,
} from "@/app/stores/dashboardFormSlice";
import { RootState } from "@/app/stores/store";
import CustomInstructions from "@/app/(dashboard)/dashboard/components/CustomInstructions";
import ServicesDropdown from "@/app/(dashboard)/dashboard/components/ServicesDropdown";
import CustomUrls from "@/app/(dashboard)/dashboard/components/CustomUrls";
import CheckStripKeys from "@/app/(dashboard)/dashboard/components/CheckStripKeys";

interface ProjectFormProps {
  project?: AuditProject | null;
  mode: "create" | "edit";
  onSubmit?: (project: AuditProject) => void;
  projects?: AuditProject[]; // For create mode to check duplicates
}

export function ProjectForm({ project, mode, onSubmit, projects = [] }: ProjectFormProps) {
  const [loading, setLoading] = useState(false);
  const [projectUrl, setProjectUrl] = useState(project?.base_url || "");
  const [companyName, setCompanyName] = useState(project?.company_name || "");
  const [phoneNumber, setPhoneNumber] = useState(project?.phone_number || "");
  const [email, setEmail] = useState(project?.email || "");
  const [address, setAddress] = useState(project?.address || "");
  const [customInfo, setCustomInfo] = useState(project?.custom_info || "");
  const [crawlType, setCrawlTypeState] = useState<"full" | "single">(
    project?.crawl_type === "single" ? "single" : "full"
  );

  const [error, setError] = useState("");
  const router = useRouter();
  const normalizeUrl = (url: string) => url.replace(/\/+$/, "").toLowerCase();
  const dispatch = useDispatch();
  
  // Get Redux state for create mode
  const { inputUrl, selectedServices, instructions, urls, stripeKeyUrls } = useSelector((state: RootState) => state.dashboardForm);

  useEffect(() => {
    if (project) {
      setProjectUrl(project.base_url || "");
      setCompanyName(project.company_name || "");
      setPhoneNumber(project.phone_number || "");
      setEmail(project.email || "");
      setAddress(project.address || "");
      setCustomInfo(project.custom_info || "");
      setCrawlTypeState(project.crawl_type === "single" ? "single" : "full");
      
      // Load services from project data into Redux store
      if (project.services && project.services.length > 0) {
        dispatch(setSelectedServices(project.services));
      }
      
      // Load instructions from project data into Redux store
      if (project.instructions && project.instructions.length > 0) {
        dispatch(setInstructions(project.instructions));
      }

      // Load custom URLs from project data into Redux store
      if (Array.isArray(project.custom_urls) && project.custom_urls.length > 0) {
        dispatch(setUrls(project.custom_urls));
      } else {
        dispatch(setUrls([""]));
      }

      console.log("project**********", project);
    }
  }, [project, dispatch]);

  useEffect(() => {
    console.log("crawlType**********", crawlType);
    if (crawlType === 'single') {
      dispatch(setUrls(['']));
      // Deselect 'check_custom_urls' if selected
      if (selectedServices.includes('check_custom_urls')) {
        dispatch(setSelectedServices(selectedServices.filter(s => s !== 'check_custom_urls')));
      }
    }
  }, [crawlType, dispatch, selectedServices]);

  // Sync company details to Redux store
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

  // Sync URL to Redux for create mode
  useEffect(() => {
    if (mode === "create") {
      dispatch(setInputUrl(projectUrl));
    }
  }, [projectUrl, mode, dispatch]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (mode === "create") {
      await handleCreateProject();
    } else {
      await handleEditProject();
    }
  };

  const handleCreateProject = async () => {
    if (!projectUrl.trim()) {
      toast.error("Please enter a valid URL.");
      return;
    }

    setLoading(true);
    setError("");

    try {
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
        custom_urls: (Array.isArray(urls) && urls.filter(u => u && u.trim()).length > 0) ? urls.filter(u => u && u.trim()) : null,
        stripe_key_urls: (Array.isArray(stripeKeyUrls) && stripeKeyUrls.filter(u => u && u.trim()).length > 0) ? stripeKeyUrls.filter(u => u && u.trim()) : null,
      };
      console.log("payload:**************", payload);
      const response = await fetch("/api/audit-projects", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });
      console.log("response:**************", response);
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

  const handleEditProject = async () => {
    if (!projectUrl.trim()) return;

    setLoading(true);
    setError("");

    try {
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
        custom_urls: (Array.isArray(urls) && urls.filter(u => u && u.trim()).length > 0) ? urls.filter(u => u && u.trim()) : null,
        stripe_key_urls: (Array.isArray(stripeKeyUrls) && stripeKeyUrls.filter(u => u && u.trim()).length > 0) ? stripeKeyUrls.filter(u => u && u.trim()) : null,
      };
      
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

  const title = mode === "create" ? "Create New Audit Project" : "Edit Project";
  const description =
    mode === "create"
      ? "Enter website URL and company details to verify consistency across all pages"
      : "Update website URL and company information for verification";

  // Check if project is running and prevent editing
  const isProjectRunning = Boolean(
    project && (project.status === "crawling" || project.status === "analyzing")
  );

  return (
    <div className="w-full max-w-4xl">
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent>
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

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* URL Input - Always shown */}
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

            {/* Crawl Type Selection - Always shown */}
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

            {/* Services Dropdown - Show for both create and edit modes */}
            <div className="w-full">
              <ServicesDropdown />
            </div>

            {/* Custom Instructions - Show when custom_instructions service is selected */}
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
            {/* Stripe Key URLs are managed ONLY by CheckStripKeys and stored in stripeKeyUrls */}
            {selectedServices.includes('check_stripe_keys') && (
              <div className="check_stripe_keys">
              <CheckStripKeys />
              </div>
            )}

                 
            {/* Company Details Section - Only show when contact_details_consistency is selected */}
              {selectedServices.includes('contact_details_consistency') ? (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label
                        htmlFor="companyName"
                        className="flex items-center gap-2"
                      >
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

                    <div>
                      <Label
                        htmlFor="phoneNumber"
                        className="flex items-center gap-2"
                      >
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
              ) : null}

            {/* Custom URLs - Show when check_custom_urls service is selected */}
            {/* CustomUrls manages ONLY custom_urls (urls in Redux) */}
            {selectedServices.includes('check_custom_urls') && crawlType === 'full' && (
              <div className="custom_urls">
                <CustomUrls crawlType={crawlType} />
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row items-stretch gap-3 pt-4">
              <Button
                type="submit"
                disabled={loading || !projectUrl.trim() || isProjectRunning}
                className="w-full bg "
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

              {/* {mode === "edit" && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.push("/projects")}
                  disabled={loading}
                  className="w-full sm:w-auto"
                >
                  Cancel
                </Button>
              )} */}
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
