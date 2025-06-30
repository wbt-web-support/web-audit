import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PageDetailSimple } from "@/components/audit/page-detail-simple";

interface PageDetailPageProps {
  params: {
    pageId: string;
  };
}

export default async function PageDetailPage({ params }: PageDetailPageProps) {
  const supabase = await createClient();

  const { data, error } = await supabase.auth.getUser();
  if (error || !data?.user) {
    redirect("/auth/login");
  }

  return <PageDetailSimple pageId={params.pageId} />;
} 