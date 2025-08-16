import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { id } = await params;

    // Validate user authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Parse request body
    const body = await request.json();
    const { page_id } = body;

    if (!page_id) {
      return NextResponse.json({ error: "Page ID is required" }, { status: 400 });
    }

    // Verify project ownership and existence
    const { data: project, error: projectError } = await supabase
      .from("audit_projects")
      .select("*")
      .eq("id", id)
      .eq("user_id", user.id)
      .single();

    if (projectError || !project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    // Update page status to stopped
    const { error: updateError } = await supabase
      .from("scraped_pages")
      .update({ 
        analysis_status: "stopped",
        error_message: "Analysis was stopped by user"
      })
      .eq("id", page_id)
      .eq("audit_project_id", id);

    if (updateError) {
      console.error("Error stopping analysis:", updateError);
      return NextResponse.json({ error: "Failed to stop analysis" }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      message: "Analysis stopped successfully" 
    });

  } catch (error) {
    console.error("Stop analysis API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
