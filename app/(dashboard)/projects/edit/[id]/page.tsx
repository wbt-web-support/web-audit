import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ProjectForm } from "@/components/audit/project-form";

interface EditProjectPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditProjectPage({ params }: EditProjectPageProps) {
  const supabase = await createClient();
  const { id } = await params;

  const { data, error } = await supabase.auth.getUser();
  if (error || !data?.user) {
    redirect("/auth/login");
  }

  // Fetch the project data
  const { data: project, error: projectError } = await supabase
    .from('audit_projects')
    .select('*')
    .eq('id', id)
    .eq('user_id', data.user.id)
    .single();

  if (projectError || !project) {
    redirect("/projects?error=project-not-found");
  }

  return <ProjectForm mode="edit" project={project} />;
} 