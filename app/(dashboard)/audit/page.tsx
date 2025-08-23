import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AuditMain } from "@/components/audit/audit-main";
import { AutoProjectCreationWrapper } from "./auto-project-creation-wrapper";
import { ProjectSyncWrapper } from "./project-sync-wrapper";

export default async function AuditPage() {
  const supabase = await createClient();

  const { data, error } = await supabase.auth.getUser();
  if (error || !data?.user) {
    redirect("/auth/login");
  }

  return (
    <AutoProjectCreationWrapper>
      <ProjectSyncWrapper>
        <AuditMain />
      </ProjectSyncWrapper>
    </AutoProjectCreationWrapper>
  );
} 