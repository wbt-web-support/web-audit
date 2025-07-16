import { AuditSession } from "@/lib/types/database";
import { useRouter } from "next/navigation";
import React, { useState } from "react";
import { toast } from "react-toastify";
import ServicesDropdown from "./ServicesDropdown";

interface RecentSessionsProps {
  sessions: AuditSession[];
}




export function CreateNewSession({ sessions }: RecentSessionsProps) {
  const [inputUrl, setInputUrl] = useState("");
  const [crawlType, setCrawlType] = useState<"full" | "single">("full");
  const router = useRouter();
  const normalizeUrl = (url: string) => url.replace(/\/+$/, "").toLowerCase();

  const handleCreateSession = async () => {
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
          // Optionally, you can clear the input or refresh the session list here
          setInputUrl("");
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
            onChange={(e) => setInputUrl(e.target.value)}
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
                onChange={() => setCrawlType("full")}
              />
              Full Website
            </label>
            <label className="flex items-center gap-1 text-sm">
              <input
                type="radio"
                name="crawlType"
                value="single"
                checked={crawlType === "single"}
                onChange={() => setCrawlType("single")}
              />
              Single Page
            </label>
          </div>
          {/* Services Dropdown */}
        </div>
          <div className="w-full ">
            <ServicesDropdown />
          </div>
      </div>
    </div>
  );
}
