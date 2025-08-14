import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const { pageIds } = await request.json();
    
    if (!pageIds || !Array.isArray(pageIds) || pageIds.length === 0) {
      return NextResponse.json(
        { error: 'Invalid pageIds provided' },
        { status: 400 }
      );
    }

    const supabase = createClient();
    
    // Fetch all page statuses in a single query
    const { data: pages, error } = await supabase
      .from('scraped_pages')
      .select(`
        id,
        analysis_status,
        results,
        error_message,
        updated_at
      `)
      .in('id', pageIds);

    if (error) {
      console.error('Error fetching batch page statuses:', error);
      return NextResponse.json(
        { error: 'Failed to fetch page statuses' },
        { status: 500 }
      );
    }

    // Transform the data to match the expected PageStatus interface
    const pageStatuses = pages.map(page => ({
      pageId: page.id,
      status: page.analysis_status || 'pending',
      hasResults: page.results && Object.keys(page.results).length > 0,
      error: page.error_message || undefined,
      lastChecked: Date.now()
    }));

    // Add any missing pageIds as 'error' status
    const foundPageIds = new Set(pages.map(p => p.id));
    const missingPageIds = pageIds.filter(id => !foundPageIds.has(id));
    
    missingPageIds.forEach(pageId => {
      pageStatuses.push({
        pageId,
        status: 'error' as const,
        hasResults: false,
        error: 'Page not found',
        lastChecked: Date.now()
      });
    });

    return NextResponse.json(pageStatuses);
  } catch (error) {
    console.error('Batch status API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
