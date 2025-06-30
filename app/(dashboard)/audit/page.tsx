import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AuditMain } from "@/components/audit/audit-main";

export default async function AuditPage() {
  const supabase = await createClient();

  const { data, error } = await supabase.auth.getUser();
  if (error || !data?.user) {
    redirect("/auth/login");
  }

  return <AuditMain />;
} 