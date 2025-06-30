import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { SessionManager } from "@/components/audit/session-manager";

export default async function SessionsPage() {
  const supabase = await createClient();

  const { data, error } = await supabase.auth.getUser();
  if (error || !data?.user) {
    redirect("/auth/login");
  }

  return <SessionManager />;
} 