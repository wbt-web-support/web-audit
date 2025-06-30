import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { SessionForm } from "@/components/audit/session-form";

interface EditSessionPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditSessionPage({ params }: EditSessionPageProps) {
  const supabase = await createClient();
  const { id } = await params;

  const { data, error } = await supabase.auth.getUser();
  if (error || !data?.user) {
    redirect("/auth/login");
  }

  // Fetch the session data
  const { data: session, error: sessionError } = await supabase
    .from('audit_sessions')
    .select('*')
    .eq('id', id)
    .eq('user_id', data.user.id)
    .single();

  if (sessionError || !session) {
    redirect("/sessions?error=session-not-found");
  }

  return <SessionForm mode="edit" session={session} />;
} 