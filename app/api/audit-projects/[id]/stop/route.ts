import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { id } = await params;
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get audit project
    const { data: project, error: projectError } = await supabase
      .from('audit_projects')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (projectError || !project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    // Check if project can be stopped
    if (!['crawling', 'analyzing'].includes(project.status)) {
      return NextResponse.json(
        { error: 'Project is not running' },
        { status: 400 }
      );
    }

    // Stop the process by updating status to failed
    await supabase
      .from('audit_projects')
      .update({
        status: 'failed',
        error_message: `${project.status} stopped by user`,
      })
      .eq('id', id);

    return NextResponse.json({ 
      message: `${project.status} stopped successfully` 
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 