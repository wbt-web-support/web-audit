import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    console.log('Stop process request received');
    const supabase = await createClient();
    const { id } = await params;
    
    console.log(`Attempting to stop project: ${id}`);
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      console.error('Stop process - Authentication failed:', authError);
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log(`User ${user.id} attempting to stop project ${id}`);

    // Get audit project
    const { data: project, error: projectError } = await supabase
      .from('audit_projects')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (projectError || !project) {
      console.error('Stop process - Project not found:', projectError);
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    console.log(`Project status: ${project.status}`);

    // Check if project can be stopped
    if (!['crawling', 'analyzing'].includes(project.status)) {
      console.log(`Project ${id} is not running (status: ${project.status})`);
      return NextResponse.json(
        { error: `Project is not running (current status: ${project.status})` },
        { status: 400 }
      );
    }

    // Stop the process by updating status to failed
    const { error: updateError } = await supabase
      .from('audit_projects')
      .update({
        status: 'failed',
        error_message: `${project.status} stopped by user at ${new Date().toISOString()}`,
        updated_at: new Date().toISOString()
      })
      .eq('id', id);

    if (updateError) {
      console.error('Stop process - Database update failed:', updateError);
      return NextResponse.json(
        { error: 'Failed to update project status' },
        { status: 500 }
      );
    }

    console.log(`Project ${id} stopped successfully (was ${project.status})`);
    
    return NextResponse.json({ 
      message: `${project.status} stopped successfully`,
      previous_status: project.status,
      stopped_at: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Stop process - Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error while stopping process' },
      { status: 500 }
    );
  }
} 