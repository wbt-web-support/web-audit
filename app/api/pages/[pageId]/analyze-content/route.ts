import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function POST(
  request: Request,
  { params }: { params: Promise<{ pageId: string }> }
) {
  try {
    const supabase = await createClient();
    const url = new URL(request.url);
    const forceRefresh = url.searchParams.get('refresh') === 'true';
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { pageId } = await params;

    // Get the specific page
    const { data: page, error: pageError } = await supabase
      .from('scraped_pages')
      .select('*')
      .eq('id', pageId)
      .single();

    if (pageError || !page) {
      return NextResponse.json({ error: 'Page not found' }, { status: 404 });
    }

    // Verify page belongs to user's session
    const { data: session, error: sessionError } = await supabase
      .from('audit_sessions')
      .select('user_id')
      .eq('id', page.audit_session_id)
      .eq('user_id', user.id)
      .single();

    if (sessionError || !session) {
      return NextResponse.json({ error: 'Unauthorized access to page' }, { status: 403 });
    }

    // Check for cached analysis result (unless force refresh is requested)
    if (!forceRefresh) {
      const { data: cachedResult, error: cacheError } = await supabase
        .from('audit_results')
        .select('grammar_analysis, created_at')
        .eq('scraped_page_id', pageId)
        .maybeSingle();

      if (!cacheError && cachedResult && cachedResult.grammar_analysis) {
        // Return cached result
        console.log('Returning cached content analysis for page:', pageId);
        return NextResponse.json({
          ...cachedResult.grammar_analysis,
          cached: true,
          cached_at: cachedResult.created_at
        });
      }
    } else {
      console.log('Force refresh requested for page:', pageId);
    }

    const content = page.content || '';
    
    if (!content.trim()) {
      const emptyAnalysis = {
        wordCount: 0,
        sentenceCount: 0,
        avgSentenceLength: 0,
        readabilityScore: 0,
        estimatedReadingTime: 0,
        grammarErrors: [],
        spellingErrors: [],
        issues: ['No content available for analysis'],
        suggestions: ['Add meaningful content to the page'],
        tone: 'neutral',
        complexWords: 0,
        vocabularyRichness: 0,
        overallScore: 0
      };

      // Upsert the analysis result (single entry per page)
      await upsertAnalysisResult(supabase, pageId, page.title, 'grammar_analysis', emptyAnalysis, 0);

      return NextResponse.json(emptyAnalysis);
    }

    // Analyze with Gemini
    console.log('Calling Gemini API for content analysis of page:', pageId);
    const analysis = await analyzeContentWithGemini(content);
    
    // Upsert the analysis result (single entry per page)
    await upsertAnalysisResult(supabase, pageId, page.title, 'grammar_analysis', analysis, analysis.overallScore);

    console.log('Cached content analysis result for page:', pageId);
    
    return NextResponse.json(analysis);
  } catch (error) {
    console.error('Content analysis error:', error);
    return NextResponse.json(
      { error: 'Failed to analyze content' },
      { status: 500 }
    );
  }
}

async function upsertAnalysisResult(
  supabase: any, 
  pageId: string, 
  pageName: string | null, 
  analysisType: string, 
  analysisData: any, 
  score: number
) {
  const status = score >= 80 ? 'pass' : score >= 60 ? 'warning' : 'fail';
  
  // Create the update object dynamically
  const updateData: any = {
    page_name: pageName,
    overall_score: score,
    overall_status: status,
    updated_at: new Date().toISOString()
  };
  
  // Set the specific analysis field
  updateData[analysisType] = analysisData;

  // Upsert: Insert if doesn't exist, update if exists
  const { error } = await supabase
    .from('audit_results')
    .upsert({
      scraped_page_id: pageId,
      ...updateData
    }, {
      onConflict: 'scraped_page_id'
    });

  if (error) {
    console.error('Error upserting analysis result:', error);
    throw error;
  }
}

async function analyzeContentWithGemini(content: string) {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const prompt = `
Analyze the following website content for grammar, spelling, and content quality. You MUST strictly follow UK English conventions and flag any US English spellings as grammar errors.

Content to analyze:
"${content}"

Return a JSON object with this exact structure:
{
  "wordCount": number,
  "sentenceCount": number,
  "readabilityScore": number (1-100, where 100 is easiest to read),
  "grammarErrors": [
    {
      "text": "exact text that contains the error",
      "suggestion": "corrected version",
      "type": "grammar|punctuation|structure|US English",
      "explanation": "detailed explanation of why this is incorrect and what rule it violates"
    }
  ],
  "spellingErrors": [
    {
      "text": "misspelled word",
      "suggestion": "correct UK English spelling",
      "position": "context where the error appears"
    }
  ],
  "issues": [
    "detailed description of content issues with specific recommendations for improvement"
  ],
  "suggestions": [
    "specific actionable suggestions for content improvement"
  ],
  "tone": "professional|casual|formal|conversational|academic|marketing",
  "overallScore": number (1-100),
  "contentQuality": number (1-100),
  "estimatedReadingTime": number (in minutes, rounded up)
}

CRITICAL REQUIREMENTS:
1. UK English ONLY - flag ALL US spellings as "US English" type grammar errors:
   - color → colour, center → centre, organize → organise, realize → realise
   - license → licence (noun), defense → defence, gray → grey
   - traveled → travelled, canceled → cancelled, fulfill → fulfil
   
2. Provide detailed explanations for each error:
   - Grammar: Explain the grammatical rule being violated
   - Punctuation: Explain the punctuation rule and correct usage
   - Structure: Explain why the sentence structure is problematic
   - US English: Explain this is US spelling and provide UK equivalent
   
3. For spelling errors, provide context about where the error appears

4. Content issues should be specific and actionable:
   - "The introduction lacks a clear hook to engage readers"
   - "This paragraph contains too many complex sentences that hurt readability"
   - "The conclusion doesn't summarize the main points effectively"
   
5. Make suggestions concrete and implementable:
   - "Break the 45-word sentence in paragraph 2 into two shorter sentences"
   - "Add transition words between paragraphs 3 and 4 to improve flow"
   - "Replace jargon terms with simpler alternatives for broader accessibility"

Focus on being helpful and educational. Each error should teach the user something about proper UK English and good writing practices.`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    // Clean up response and parse JSON
    const cleanedText = text.replace(/```json\n?|\n?```/g, '').trim();
    
    try {
      const analysis = JSON.parse(cleanedText);
      
      // Validate required fields and provide defaults
      return {
        wordCount: Math.max(0, analysis.wordCount || 0),
        sentenceCount: Math.max(0, analysis.sentenceCount || 0),
        readabilityScore: Math.min(100, Math.max(0, analysis.readabilityScore || 0)),
        estimatedReadingTime: Math.max(1, analysis.estimatedReadingTime || 1),
        grammarErrors: Array.isArray(analysis.grammarErrors) ? analysis.grammarErrors : [],
        spellingErrors: Array.isArray(analysis.spellingErrors) ? analysis.spellingErrors : [],
        issues: Array.isArray(analysis.issues) ? analysis.issues : [],
        suggestions: Array.isArray(analysis.suggestions) ? analysis.suggestions : [],
        tone: analysis.tone || 'neutral',
        overallScore: Math.min(100, Math.max(0, analysis.overallScore || 0)),
        contentQuality: Math.min(100, Math.max(0, analysis.contentQuality || 0)),
      };
    } catch (parseError) {
      console.error('Failed to parse Gemini response:', cleanedText);
      throw new Error('Invalid response format from Gemini');
    }
    
  } catch (error) {
    console.error('Gemini API error:', error);
    throw new Error('Failed to analyze content with Gemini');
  }
} 