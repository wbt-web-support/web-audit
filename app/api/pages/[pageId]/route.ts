import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ pageId: string }> }
) {
  try {
    const supabase = await createClient();
    const { pageId } = await params;
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get the specific page
    const { data: page, error: pageError } = await supabase
      .from('scraped_pages')
      .select(`
        *,
        audit_projects!inner(
          user_id
        )
      `)
      .eq('id', pageId)
      .eq('audit_projects.user_id', user.id)
      .single();

    if (pageError || !page) {
      return NextResponse.json({ error: 'Page not found' }, { status: 404 });
    }

    console.log('🔍 DEBUG: Page data from DB:', {
      id: page.id,
      analysis_status: page.analysis_status,
      title: page.title,
      all_fields: Object.keys(page)
    });

    // Get analysis results for this page
    const { data: results, error: resultsError } = await supabase
      .from('audit_results')
      .select('*')
      .eq('scraped_page_id', pageId)
      .maybeSingle();

    // Get project info
    const { data: project, error: projectError } = await supabase
      .from('audit_projects')
      .select('*')
      .eq('id', page.audit_project_id)
      .single();

    return NextResponse.json({ 
      page,
      results: results || null,
      project: project || null
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ pageId: string }> }
) {
  try {
    const supabase = await createClient();
    const { pageId } = await params;
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { analysis_status } = body;

    if (!analysis_status || !['pending', 'analyzing', 'completed', 'failed'].includes(analysis_status)) {
      return NextResponse.json({ error: 'Invalid analysis_status value' }, { status: 400 });
    }

    // Verify the page belongs to the user
    const { data: page, error: pageError } = await supabase
      .from('scraped_pages')
      .select(`
        *,
        audit_projects!inner(
          user_id
        )
      `)
      .eq('id', pageId)
      .eq('audit_projects.user_id', user.id)
      .single();

    if (pageError || !page) {
      return NextResponse.json({ error: 'Page not found' }, { status: 404 });
    }

    // Update the analysis status
    const { error: updateError } = await supabase
      .from('scraped_pages')
      .update({ 
        analysis_status
      })
      .eq('id', pageId);

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    return NextResponse.json({ 
      message: 'Page analysis status updated successfully',
      pageId,
      analysis_status 
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ pageId: string }> }
) {
  try {
    const supabase = await createClient();
    const { pageId } = await params;
    
    console.log('DELETE API: Starting deletion for page:', pageId);
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      console.error('DELETE API: Auth error:', authError);
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('DELETE API: User authenticated:', user.id);

    // Verify the page belongs to the user
    const { data: page, error: pageError } = await supabase
      .from('scraped_pages')
      .select(`
        *,
        audit_projects!inner(
          user_id
        )
      `)
      .eq('id', pageId)
      .eq('audit_projects.user_id', user.id)
      .single();

    if (pageError || !page) {
      console.error('DELETE API: Page not found or unauthorized:', pageError);
      return NextResponse.json({ error: 'Page not found' }, { status: 404 });
    }

    console.log('DELETE API: Page found and authorized:', {
      pageId: page.id,
      title: page.title,
      projectId: page.audit_project_id
    });

    // Delete analysis results first (due to foreign key constraints)
    console.log('DELETE API: Deleting analysis results...');
    const { error: resultsDeleteError } = await supabase
      .from('audit_results')
      .delete()
      .eq('scraped_page_id', pageId);

    if (resultsDeleteError) {
      console.error('DELETE API: Failed to delete analysis results:', resultsDeleteError);
      // Continue anyway - analysis results might not exist
    } else {
      console.log('DELETE API: Analysis results deleted successfully');
    }

    // Delete the page
    console.log('DELETE API: Deleting page...');
    const { data: deleteData, error: deleteError, count } = await supabase
      .from('scraped_pages')
      .delete()
      .eq('id', pageId)
      .select();

    if (deleteError) {
      console.error('DELETE API: Failed to delete page:', deleteError);
      return NextResponse.json({ error: deleteError.message }, { status: 500 });
    }

    console.log('DELETE API: Page deletion result:', { deleteData, count });

    if (!deleteData || deleteData.length === 0) {
      console.error('DELETE API: No rows were deleted - possible RLS issue');
      return NextResponse.json({ error: 'Page could not be deleted - possibly due to permissions' }, { status: 500 });
    }

    // Update project pages count
    console.log('DELETE API: Updating project page count...');
    const { data: projectPages, error: projectPagesError } = await supabase
      .from('scraped_pages')
      .select('id')
      .eq('audit_project_id', page.audit_project_id);

    if (projectPagesError) {
      console.error('DELETE API: Error counting remaining pages:', projectPagesError);
    } else {
      const { error: updateError } = await supabase
        .from('audit_projects')
        .update({ 
          pages_crawled: projectPages?.length || 0,
          updated_at: new Date().toISOString()
        })
        .eq('id', page.audit_project_id);

      if (updateError) {
        console.error('DELETE API: Error updating project count:', updateError);
      } else {
        console.log('DELETE API: Project updated with new page count:', projectPages?.length || 0);
      }
    }

    console.log('DELETE API: Page deletion completed successfully');
    return NextResponse.json({ 
      message: 'Page deleted successfully',
      deletedPageId: pageId,
      deletedData: deleteData[0] 
    });
  } catch (error) {
    console.error('DELETE API: Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
} 