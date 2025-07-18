import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get all projects for the user
    const { data: projects, error: projectsError } = await supabase
      .from('audit_projects')
      .select('id')
      .eq('user_id', user.id);

    if (projectsError) {
      return NextResponse.json({ error: projectsError.message }, { status: 500 });
    }

    if (!projects || projects.length === 0) {
      return NextResponse.json({ message: 'No projects found' });
    }

    let updatedCount = 0;
    const errors: string[] = [];

    // Recalculate count for each project
    for (const project of projects) {
      try {
        // Count pages that have been analyzed
        const { data: analyzedPages, error: countError } = await supabase
          .from('scraped_pages')
          .select('id')
          .eq('audit_project_id', project.id)
          .not('analysis_status', 'is', null)
          .neq('analysis_status', 'pending');

        if (countError) {
          errors.push(`Project ${project.id}: ${countError.message}`);
          continue;
        }

        const actualAnalyzedCount = analyzedPages?.length || 0;

        // Update the project with the correct count
        const { error: updateError } = await supabase
          .from('audit_projects')
          .update({ pages_analyzed: actualAnalyzedCount })
          .eq('id', project.id);

        if (updateError) {
          errors.push(`Project ${project.id}: ${updateError.message}`);
        } else {
          updatedCount++;
        }
      } catch (error) {
        errors.push(`Project ${project.id}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    return NextResponse.json({
      message: `Recalculated counts for ${updatedCount} projects`,
      updatedProjects: updatedCount,
      totalProjects: projects.length,
      errors: errors.length > 0 ? errors : undefined
    });

  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 