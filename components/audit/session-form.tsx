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
import { AuditSession, AuditSessionStatus } from "@/lib/types/database";
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
} from "@/app/stores/dashboardFormSlice";
import { RootState } from "@/app/stores/store";
import CustomInstructions from "@/app/(dashboard)/dashboard/components/CustomInstructions";
import ServicesDropdown from "@/app/(dashboard)/dashboard/components/ServicesDropdown";

interface SessionFormProps {
  session?: AuditSession | null;
  mode: "create" | "edit";
  onSubmit?: (session: AuditSession) => void;
  sessions?: AuditSession[]; // For create mode to check duplicates
}

export function SessionForm({ session, mode, onSubmit, sessions = [] }: SessionFormProps) {
  const [loading, setLoading] = useState(false);
  const [sessionUrl, setSessionUrl] = useState(session?.base_url || "");
  const [companyName, setCompanyName] = useState(session?.company_name || "");
  const [phoneNumber, setPhoneNumber] = useState(session?.phone_number || "");
  const [email, setEmail] = useState(session?.email || "");
  const [address, setAddress] = useState(session?.address || "");
  const [customInfo, setCustomInfo] = useState(session?.custom_info || "");
  const [crawlType, setCrawlTypeState] = useState<"full" | "single">(
    session?.crawl_type === "single" ? "single" : "full"
  );

  const [error, setError] = useState("");
  const router = useRouter();
  const normalizeUrl = (url: string) => url.replace(/\/+$/, "").toLowerCase();
  const dispatch = useDispatch();
  
  // Get Redux state for create mode
  const { inputUrl, selectedServices, instructions } = useSelector((state: RootState) => state.dashboardForm);

  useEffect(() => {
    if (session) {
      setSessionUrl(session.base_url || "");
      setCompanyName(session.company_name || "");
      setPhoneNumber(session.phone_number || "");
      setEmail(session.email || "");
      setAddress(session.address || "");
      setCustomInfo(session.custom_info || "");
      setCrawlTypeState(session.crawl_type === "single" ? "single" : "full");
      
      // Load services from session data into Redux store
      if (session.services && session.services.length > 0) {
        dispatch(setSelectedServices(session.services));
      }
      
      // Load instructions from session data into Redux store
      if (session.instructions && session.instructions.length > 0) {
        dispatch(setInstructions(session.instructions));
      }
      
      console.log("session**********", session);
    }
  }, [session, dispatch]);

  useEffect(() => {
    console.log("crawlType**********", crawlType);
  }, [crawlType]);

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
      dispatch(setInputUrl(sessionUrl));
    }
  }, [sessionUrl, mode, dispatch]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (mode === "create") {
      await handleCreateSession();
    } else {
      await handleEditSession();
    }
  };

  const handleCreateSession = async () => {
    if (!sessionUrl.trim()) {
      toast.error("Please enter a valid URL.");
      return;
    }

    // Check for duplicate URLs
    const found = sessions.some(
      (session) => normalizeUrl(session.base_url) === normalizeUrl(sessionUrl)
    );
    if (found) {
      toast.info("A URL is already present in the sessions.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const payload = {
        base_url: sessionUrl.trim(),
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
      };

      const response = await fetch("/api/audit-sessions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      if (response.ok) {
        router.push(`/audit?session=${data.session.id}`);
        toast.success("Session created successfully!");
        dispatch(clearForm());
      } else {
        toast.error(data.error || "Failed to create session.");
      }
    } catch (error) {
      toast.error("Failed to create session.");
    } finally {
      setLoading(false);
    }
  };

  const handleEditSession = async () => {
    if (!sessionUrl.trim()) return;

    setLoading(true);
    setError("");

    try {
      const payload = {
        base_url: sessionUrl.trim(),
        company_name: companyName.trim() || null,
        phone_number: phoneNumber.trim() || null,
        email: email.trim() || null,
        address: address.trim() || null,
        custom_info: customInfo.trim() || null,
        crawlType: crawlType,
        services: selectedServices,
        instructions: instructions,
      };

      const response = await fetch(`/api/audit-sessions/${session?.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      if (response.ok) {
        if (onSubmit && data.session) {
          onSubmit(data.session);
        } else {
          // Update local state to reflect saved session values
          setSessionUrl(data.session.base_url || "");
          setCompanyName(data.session.company_name || "");
          setPhoneNumber(data.session.phone_number || "");
          setEmail(data.session.email || "");
          setAddress(data.session.address || "");
          setCustomInfo(data.session.custom_info || "");
          setCrawlTypeState(data.session.crawl_type === "single" ? "single" : "full");
          router.push(`/audit?session=${data.session.id}`);
          toast.success("Session updated successfully!");
        }
      } else {
        setError(data.error || "Failed to update session");
      }
    } catch (error) {
      setError("Failed to update session");
    } finally {
      setLoading(false);
    }
  };

  const title = mode === "create" ? "Create New Audit Session" : "Edit Project";
  const description =
    mode === "create"
      ? "Enter website URL and company details to verify consistency across all pages"
      : "Update website URL and company information for verification";

  // Check if session is running and prevent editing
  const isSessionRunning = Boolean(
    session && (session.status === "crawling" || session.status === "analyzing")
  );

  return (
    <div className="w-full max-w-4xl">
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent>
          {isSessionRunning && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-4">
              <div className="flex items-center gap-2 text-amber-700">
                <span>
                  This session is currently {session?.status}. You cannot edit
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
                value={sessionUrl}
                onChange={(e) => setSessionUrl(e.target.value)}
                disabled={loading || isSessionRunning}
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
                    sessionInstructions={session?.instructions || []}
                    loading={loading}
                    isSessionRunning={isSessionRunning}
                  />
                ) : (
                  <CustomInstructions />
                )}
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
                      disabled={loading || isSessionRunning}
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
                      disabled={loading || isSessionRunning}
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
                      disabled={loading || isSessionRunning}
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
                      disabled={loading || isSessionRunning}
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
                    disabled={loading || isSessionRunning}
                    className="mt-1"
                  />
                </div>
              </>
            ) : null}

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row items-stretch gap-3 pt-4">
              <Button
                type="submit"
                disabled={loading || !sessionUrl.trim() || isSessionRunning}
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

              {mode === "edit" && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.push("/sessions")}
                  disabled={loading}
                  className="w-full sm:w-auto"
                >
                  Cancel
                </Button>
              )}
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
