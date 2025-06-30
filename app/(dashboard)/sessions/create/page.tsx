import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { SessionForm } from "@/components/audit/session-form";

export default async function CreateSessionPage() {
  const supabase = await createClient();

  const { data, error } = await supabase.auth.getUser();
  if (error || !data?.user) {
    redirect("/auth/login");
  }

  return <SessionForm mode="create" />;
} 