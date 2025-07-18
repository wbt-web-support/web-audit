import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { id } = await params;
    
    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError || !userData?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: project, error } = await supabase
      .from('audit_projects')
      .select('*')
      .eq('id', id)
      .eq('user_id', userData.user.id)
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    // Calculate the actual pages_analyzed count dynamically
    const { data: analyzedPages, error: countError } = await supabase
      .from('scraped_pages')
      .select('id')
      .eq('audit_project_id', id)
      .not('analysis_status', 'is', null)
      .neq('analysis_status', 'pending');

    if (!countError && analyzedPages) {
      const actualAnalyzedCount = analyzedPages.length;
      
      // Update the project with the correct count if it's different
      if (project.pages_analyzed !== actualAnalyzedCount) {
        await supabase
          .from('audit_projects')
          .update({ pages_analyzed: actualAnalyzedCount })
          .eq('id', id);
        
        project.pages_analyzed = actualAnalyzedCount;
      }
    }

    return NextResponse.json({ project }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(
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

    const body = await request.json();
    const { 
      base_url, 
      company_name, 
      phone_number, 
      email, 
      address, 
      custom_info,
      instructions,
      crawlType,
      services,
    } = body;

    if (!base_url) {
      return NextResponse.json(
        { error: 'base_url is required' },
        { status: 400 }
      );
    }

    // Validate URL
    try {
      new URL(base_url);
    } catch {
      return NextResponse.json(
        { error: 'Invalid URL format' },
        { status: 400 }
      );
    }

    // First check if project exists and get its status
    const { data: existingProject, error: fetchError } = await supabase
      .from('audit_projects')
      .select('status')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (fetchError || !existingProject) {
      console.error('Fetch error:', fetchError);
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    // Prevent editing if project is running
    if (existingProject.status === 'crawling' || existingProject.status === 'analyzing') {
      return NextResponse.json(
        { error: 'Cannot edit project while it is running' },
        { status: 400 }
      );
    }

    // Update project (only if it belongs to the user)
    const updateData: any = {
      base_url,
      updated_at: new Date().toISOString(),
      company_name: company_name || null,
      phone_number: phone_number || null,
      email: email || null,
      address: address || null,
      custom_info: custom_info || null,
      instructions: instructions || null,
      crawl_type: crawlType || null,
      services: services || null,
    };

    const { data: project, error } = await supabase
      .from('audit_projects')
      .update(updateData)
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error) {
      console.error('Update error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    if (project.status !== 'pending') {
      // Set project status to 'pending' after update
      const { data: updatedProject, error: statusError } = await supabase
        .from('audit_projects')
        .update({ status: 'pending' })
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .single();
      if (!statusError && updatedProject) {
        project.status = updatedProject.status;
      } else if (statusError) {
        console.error('Error setting project status to pending:', statusError);
      }
    }

    console.log('Project updated successfully:', project.id);

    // Fetch all scraped_pages for this project
    const { data: pages, error: pagesError } = await supabase
      .from('scraped_pages')
      .select('id')
      .eq('audit_project_id', id);

    if (pagesError) {
      console.error('Error fetching scraped pages:', pagesError);
    } else if (pages && pages.length > 0) {
      const pageIds = pages.map((p: { id: string }) => p.id);
      // 2. Delete all audit_results for these page ids
      const { error: deleteError } = await supabase
        .from('audit_results')
        .delete()
        .in('scraped_page_id', pageIds);
      if (deleteError) {
        console.error('Error deleting audit results:', deleteError);
        // Not a fatal error, continue
      }
      // 3. Delete all scraped_pages for this project
      const { error: deletePagesError } = await supabase
        .from('scraped_pages')
        .delete()
        .in('id', pageIds);
      if (deletePagesError) {
        console.error('Error deleting scraped pages:', deletePagesError);
        // Not a fatal error, continue
      }
    }

    return NextResponse.json({ project });
  } catch (error) {
    console.error('PUT route error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function DELETE(
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

    const { error } = await supabase
      .from('audit_projects')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ message: 'Project deleted successfully' });
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 