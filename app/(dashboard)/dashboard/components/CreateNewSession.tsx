"use client"
import { AuditSession } from "@/lib/types/database";
import { useRouter } from "next/navigation";
import React, { useEffect } from "react";
import { toast } from "react-toastify";
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '@/app/stores/store';
import { setInputUrl, setCrawlType, clearForm } from '@/app/stores/dashboardFormSlice';
import ServicesDropdown from "./ServicesDropdown";
import { SessionForm } from "@/components/audit/session-form";
import CustomInstructions from "./CustomInstructions";

interface RecentSessionsProps {
  sessions: AuditSession[];
}

export function CreateNewSession({ sessions }: RecentSessionsProps) {
  const router = useRouter();
  const dispatch = useDispatch();
  const { inputUrl, crawlType, selectedServices, companyDetails,instructions } = useSelector((state: RootState) => state.dashboardForm);
  
    useEffect(() => {
      console.log("**************selectedServices**************",selectedServices);
    }, [selectedServices]);

  const normalizeUrl = (url: string) => url.replace(/\/+$/, "").toLowerCase();

  const handleCreateSession = async () => {
    // Log companyDetails from Redux
    console.log('companyDetails:', companyDetails);
    const found = sessions.some(
      (session) => normalizeUrl(session.base_url) === normalizeUrl(inputUrl)
    );
    if (found) {
      toast.info("A URL is already present in the sessions.");
    } else {
      if (!inputUrl.trim()) {
        toast.error("Please enter a valid URL.");
        return;
      }
      try {
        const payload = {
          base_url: inputUrl.trim(),
          crawlType: crawlType,
          services: selectedServices,
          companyDetails: companyDetails,
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
          // Clear the form after successful creation
          dispatch(clearForm());
        } else {
          toast.error(data.error || "Failed to create session.");
        }
      } catch (error) {
        toast.error("Failed to create session.");
      }
    }
  };

  return (
    <div className="w-full max-w-4xl">
      <div className="flex flex-col gap-4 ">
        <div className="flex flex-col sm:flex-row gap-2 w-full">
          <input
            type="text"
            placeholder="Enter Page URL or domain"
            name="base url"
            id="base-url"
            className="border rounded-xl w-full px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
            value={inputUrl}
            onChange={(e) => dispatch(setInputUrl(e.target.value))}
          />
          <button
            className="border rounded-xl px-8 py-2 bg-primary text-white font-semibold hover:bg-primary/90 transition w-full sm:w-auto"
            onClick={handleCreateSession}
          >
            Search
          </button>
        </div>
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4 ml-0 sm:ml-2">
          <div className="flex gap-4">
            <label className="flex items-center gap-1 text-sm">
              <input
                type="radio"
                name="crawlType"
                value="full"
                checked={crawlType === "full"}
                onChange={() => dispatch(setCrawlType("full"))}
              />
              Full Website
            </label>
            <label className="flex items-center gap-1 text-sm">
              <input
                type="radio"
                name="crawlType"
                value="single"
                checked={crawlType === "single"}
                onChange={() => dispatch(setCrawlType("single"))}
              />
              Single Page
            </label>
          </div>
          {/* Services Dropdown */}
        </div>
          <div className="w-full ">
            <ServicesDropdown />
          </div>
            {selectedServices.includes('contact_details_consistency') && (
              <div className="contact_details_consistency">
                <SessionForm mode='create'/>
              </div>
            )}
            {selectedServices.includes('custom_instructions') && (
              <div className="custom_instructions">
                <CustomInstructions />
              </div>
            )}
      </div>
    </div>
  );
}
