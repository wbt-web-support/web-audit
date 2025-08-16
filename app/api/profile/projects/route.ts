import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const supabase = await createClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch user's audit projects
    const { data: projects, error: projectsError } = await supabase
      .from('audit_projects')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (projectsError) {
      console.error('Projects fetch error:', projectsError);
      return NextResponse.json({ error: 'Failed to fetch projects' }, { status: 500 });
    }

    return NextResponse.json(projects || []);

  } catch (error) {
    console.error('Profile projects API error:', error);
    return NextResponse.json({ error: 'Failed to fetch projects' }, { status: 500 });
  }
}
