import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ProjectManager } from "@/components/audit/project-manager";

export default async function ProjectsPage() {
  const supabase = await createClient();

  const { data, error } = await supabase.auth.getUser();
  if (error || !data?.user) {
    redirect("/auth/login");
  }

  return <ProjectManager />;
} 