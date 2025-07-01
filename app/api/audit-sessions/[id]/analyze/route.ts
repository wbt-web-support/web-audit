import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { WebScraper } from '@/lib/services/web-scraper';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

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

    const body = await request.json();
    const { 
      page_ids, 
      analyze_all = false,
      analysis_types = ['grammar', 'seo'], // Default to both
      use_cache = true, // Default to use cache
      background = null, // Auto-determine based on page count
      force_refresh = false // Force refresh cached results
    } = body;

    // Verify the session belongs to the user
    const { data: session, error: sessionError } = await supabase
      .from('audit_sessions')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (sessionError || !session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    // Get pages to analyze
    let query = supabase
      .from('scraped_pages')
      .select('*')
      .eq('audit_session_id', id);

    if (!analyze_all && page_ids && page_ids.length > 0) {
      query = query.in('id', page_ids);
    }

    const { data: pages, error: pagesError } = await query;

    if (pagesError) {
      return NextResponse.json({ error: pagesError.message }, { status: 500 });
    }

    if (!pages || pages.length === 0) {
      return NextResponse.json({ error: 'No pages to analyze' }, { status: 400 });
    }

    // Auto-determine background processing (single page = immediate, multiple = background)
    const shouldRunInBackground = background !== null ? background : pages.length > 1;

    if (shouldRunInBackground) {
      // Allow analysis when session has completed crawling
      if (session.status !== 'analyzing' && session.status !== 'completed' && session.pages_crawled === 0) {
        return NextResponse.json(
          { error: 'Session must have crawled pages before analysis' },
          { status: 400 }
        );
    }

    // Update session status to analyzing
    await supabase
      .from('audit_sessions')
      .update({ status: 'analyzing' })
        .eq('id', id);

    // Start analysis in background
      analyzePages(id, pages, analysis_types, use_cache, force_refresh);

    return NextResponse.json({ 
      message: 'Analysis started',
        pages_to_analyze: pages.length,
        background: true
      });
    } else {
      // Single page - return immediate results
      const page = pages[0];
      const results = await performSinglePageAnalysis(
        supabase, 
        page, 
        session, 
        analysis_types, 
        use_cache, 
        force_refresh
      );
      
      return NextResponse.json({
        ...results,
        background: false
      });
    }
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

async function performSinglePageAnalysis(
  supabase: any, 
  page: any, 
  session: any, 
  analysisTypes: string[], 
  useCache: boolean, 
  forceRefresh: boolean
) {
  try {
    // Mark page as analyzing
    await supabase
      .from('scraped_pages')
      .update({ analysis_status: 'analyzing' })
      .eq('id', page.id);

    // Re-scrape the page to get the latest content
    console.log(`🔄 Re-scraping page for latest content: ${page.url}`);
    try {
      const scraper = new WebScraper(page.url, {
        maxPages: 1,
        timeout: 30000,
        userAgent: 'WebAuditBot/1.0 (Analysis)',
      });
      
      const freshPageData = await scraper.scrapePage(page.url);
      
      // Update the page with fresh content
      const { error: updateError } = await supabase
        .from('scraped_pages')
        .update({
          title: freshPageData.title || page.title,
          content: freshPageData.content || page.content,
          html: freshPageData.html || page.html,
          status_code: freshPageData.statusCode || page.status_code,
          scraped_at: new Date().toISOString(),
        })
        .eq('id', page.id);

      if (updateError) {
        console.error('Failed to update page with fresh content:', updateError);
        // Continue with existing content if update fails
      } else {
        console.log(`✅ Updated page ${page.id} with fresh content`);
        // Update local page object for analysis
        page = {
          ...page,
          title: freshPageData.title || page.title,
          content: freshPageData.content || page.content,
          html: freshPageData.html || page.html,
          status_code: freshPageData.statusCode || page.status_code,
          scraped_at: new Date().toISOString(),
        };
      }
    } catch (scrapeError) {
      console.warn(`⚠️ Failed to re-scrape page ${page.url}, using existing content:`, scrapeError);
      // Continue with existing content if re-scraping fails
    }

    let grammarAnalysis = null;
    let seoAnalysis = null;
    let cached = false;
    let cachedAt = null;

    // Check for cached results first (unless force refresh)
    if (useCache && !forceRefresh) {
      const { data: cachedResult, error: cacheError } = await supabase
        .from('audit_results')
        .select('grammar_analysis, seo_analysis, created_at')
        .eq('scraped_page_id', page.id)
        .maybeSingle();

      if (!cacheError && cachedResult) {
        if (analysisTypes.includes('grammar') && cachedResult.grammar_analysis) {
          grammarAnalysis = cachedResult.grammar_analysis;
          cached = true;
          cachedAt = cachedResult.created_at;
        }
        if (analysisTypes.includes('seo') && cachedResult.seo_analysis) {
          seoAnalysis = cachedResult.seo_analysis;
          cached = true;
          cachedAt = cachedResult.created_at;
        }
      }
    }

    // Perform missing analyses with fresh content
    if (analysisTypes.includes('grammar') && !grammarAnalysis) {
      console.log(`Running fresh grammar analysis for page ${page.id}`);
      grammarAnalysis = await analyzeContentWithGemini(page.content || '', session);
    }

    if (analysisTypes.includes('seo') && !seoAnalysis) {
      console.log(`Running fresh SEO analysis for page ${page.id}`);
      seoAnalysis = await analyzeSEO(page.html || '', page.url, page.title, page.status_code);
    }

    // Calculate combined score if both analyses are requested
    let overallScore = 0;
    if (grammarAnalysis && seoAnalysis) {
      overallScore = Math.round((grammarAnalysis.overallScore * 0.6) + (seoAnalysis.overallScore * 0.4));
    } else if (grammarAnalysis) {
      overallScore = grammarAnalysis.overallScore;
    } else if (seoAnalysis) {
      overallScore = seoAnalysis.overallScore;
    }

    // Save results to cache
    await upsertAnalysisResult(supabase, page, grammarAnalysis, seoAnalysis, overallScore);

    // Mark page as completed
    await supabase
      .from('scraped_pages')
      .update({ analysis_status: 'completed' })
      .eq('id', page.id);

    // Return appropriate response based on what was requested
    if (analysisTypes.includes('grammar') && analysisTypes.includes('seo')) {
      return {
        grammar_analysis: grammarAnalysis,
        seo_analysis: seoAnalysis,
        overall_score: overallScore,
        company_information: grammarAnalysis?.companyInformation || null,
        cached,
        cached_at: cachedAt,
        freshly_scraped: true
      };
    } else if (analysisTypes.includes('grammar')) {
      return {
        ...grammarAnalysis,
        company_information: grammarAnalysis?.companyInformation || null,
        cached,
        cached_at: cachedAt,
        freshly_scraped: true
      };
    } else if (analysisTypes.includes('seo')) {
      return {
        ...seoAnalysis,
        company_information: null, // SEO analysis doesn't include company info
        cached,
        cached_at: cachedAt,
        freshly_scraped: true
      };
    }

    return { error: 'No valid analysis types specified' };
  } catch (error) {
    console.error(`Single page analysis failed for page ${page.id}:`, error);
    
    // Mark page as failed
    await supabase
      .from('scraped_pages')
      .update({ analysis_status: 'failed' })
      .eq('id', page.id);
    
    throw error;
  }
}

async function upsertAnalysisResult(supabase: any, page: any, grammarAnalysis: any, seoAnalysis: any, overallScore: number) {
  const status = overallScore >= 80 ? 'pass' : overallScore >= 60 ? 'warning' : 'fail';
  
  const updateData: any = {
    scraped_page_id: page.id,
    page_name: page.title || page.url,
    overall_score: overallScore,
    overall_status: status,
    updated_at: new Date().toISOString()
  };
  
  if (grammarAnalysis) {
    updateData.grammar_analysis = grammarAnalysis;
    
    // Extract company information if available
    if (grammarAnalysis.companyInformation) {
      updateData.company_information_analysis = grammarAnalysis.companyInformation;
      console.log(`Saving company information analysis for page ${page.id}: score ${grammarAnalysis.companyInformation.companyInfoScore}`);
    }
  }
  
  if (seoAnalysis) {
    updateData.seo_analysis = seoAnalysis;
  }

  const { error } = await supabase
    .from('audit_results')
    .upsert(updateData, { 
      onConflict: 'scraped_page_id',
      ignoreDuplicates: false 
    });

  if (error) {
    console.error(`Failed to save analysis results for page ${page.id}:`, error);
    throw error;
  }
}

async function analyzePages(sessionId: string, pages: any[], analysisTypes: string[], useCache: boolean, forceRefresh: boolean) {
  const supabase = await createClient();
  
  // Configure rolling batch processing
  const MAX_CONCURRENT = 5; // Maximum number of pages analyzing simultaneously
  
  try {
    let analyzedCount = 0;
    let failedCount = 0;
    const failedPages: Array<{id: string, error: string}> = [];

    // Get session data for company information verification
    const { data: session, error: sessionError } = await supabase
      .from('audit_sessions')
      .select('*')
      .eq('id', sessionId)
      .single();

    if (sessionError || !session) {
      throw new Error('Failed to get session data for analysis');
    }

    console.log(`🚀 Starting rolling batch analysis for ${pages.length} pages with max ${MAX_CONCURRENT} concurrent`);

    // Create a queue of pages to process
    const pageQueue = [...pages];
    const activePromises = new Map<string, Promise<any>>();

    // Function to start analysis for a single page
    const startPageAnalysis = async (page: any) => {
      try {
        console.log(`  ⚡ Starting analysis for page ${page.id}: ${page.title || page.url} (${analyzedCount + failedCount + 1}/${pages.length})`);
        await performSinglePageAnalysis(supabase, page, session, analysisTypes, useCache, forceRefresh);
        return { success: true, pageId: page.id };
      } catch (error: any) {
        console.error(`  ❌ Failed to analyze page ${page.id}:`, error.message);
        
        // Mark the page as failed but continue with others
        await supabase
          .from('scraped_pages')
          .update({ analysis_status: 'failed' })
          .eq('id', page.id);
        
        return { 
          success: false, 
          pageId: page.id, 
          error: error.message || 'Unknown error' 
        };
      }
    };

    // Function to check if analysis should stop
    const shouldStop = async () => {
      const { data: currentSession } = await supabase
        .from('audit_sessions')
        .select('status')
        .eq('id', sessionId)
        .single();
      return currentSession?.status === 'failed';
    };

    // Start initial batch of analyses
    while (pageQueue.length > 0 && activePromises.size < MAX_CONCURRENT) {
      if (await shouldStop()) {
        throw new Error('Analysis stopped by user');
      }

      const page = pageQueue.shift()!;
      const promise = startPageAnalysis(page);
      activePromises.set(page.id, promise);
    }

    // Process remaining pages as soon as slots become available
    while (activePromises.size > 0) {
      if (await shouldStop()) {
        throw new Error('Analysis stopped by user');
      }
      
      // Wait for at least one analysis to complete
      const completedPromise = await Promise.race(Array.from(activePromises.values()));
      
      // Find which promise completed and remove it
      let completedPageId = '';
      for (const [pageId, promise] of activePromises.entries()) {
        if (promise === completedPromise) {
          completedPageId = pageId;
          activePromises.delete(pageId);
          break;
        }
      }
      
      // Process the result
      try {
        const result = await completedPromise;
        
        if (result.success) {
      analyzedCount++;
          console.log(`  ✅ Completed analysis for page ${result.pageId} (${analyzedCount + failedCount}/${pages.length})`);
        } else {
          failedCount++;
          failedPages.push({ id: result.pageId, error: result.error || 'Unknown error' });
          console.log(`  ❌ Failed analysis for page ${result.pageId} (${analyzedCount + failedCount}/${pages.length})`);
        }
      
        // Update progress in database
      await supabase
        .from('audit_sessions')
        .update({ pages_analyzed: analyzedCount })
        .eq('id', sessionId);

      } catch (error: any) {
        failedCount++;
        console.error(`  ❌ Unexpected error for page ${completedPageId}:`, error.message);
      }

      // Start analysis for next page if available
      if (pageQueue.length > 0 && activePromises.size < MAX_CONCURRENT) {
        const nextPage = pageQueue.shift()!;
        const nextPromise = startPageAnalysis(nextPage);
        activePromises.set(nextPage.id, nextPromise);
        
        console.log(`  🎯 Started next page analysis (${activePromises.size}/${MAX_CONCURRENT} slots used, ${pageQueue.length} remaining)`);
      }
    }

    // Determine final status based on results
    let finalStatus = 'completed';
    let errorMessage = null;
    
    if (analyzedCount === 0) {
      finalStatus = 'failed';
      errorMessage = 'All pages failed to analyze';
    } else if (failedCount > 0) {
      finalStatus = 'completed';
      errorMessage = `Analysis completed with ${failedCount} failures`;
    }

    // Update session status to completed
    await supabase
      .from('audit_sessions')
      .update({
        status: finalStatus,
        pages_analyzed: analyzedCount,
        completed_at: new Date().toISOString(),
        error_message: errorMessage
      })
      .eq('id', sessionId);

    console.log(`🎉 Rolling batch analysis completed for session ${sessionId}`);
    console.log(`   Total analyzed: ${analyzedCount}/${pages.length}`);
    console.log(`   Max concurrent maintained: ${MAX_CONCURRENT} pages`);
    if (failedCount > 0) {
      console.log(`   Failed pages: ${failedCount}`);
      failedPages.forEach(fp => {
        console.log(`     - Page ${fp.id}: ${fp.error}`);
      });
    }

  } catch (error: any) {
    console.error('Rolling batch analysis failed:', error);
    
    // Check if it was stopped by user
    const { data: currentSession } = await supabase
      .from('audit_sessions')
      .select('status')
      .eq('id', sessionId)
      .single();

    if (currentSession?.status !== 'failed') {
      // Update session status to failed only if not already set to failed (stopped)
      await supabase
        .from('audit_sessions')
        .update({
          status: 'failed',
          error_message: error.message || 'Analysis failed',
        })
        .eq('id', sessionId);
    }
  }
}

async function analyzeContentWithGemini(content: string, session?: any) {
  try {
    if (!content.trim()) {
      return {
        wordCount: 0,
        sentenceCount: 0,
        readabilityScore: 0,
        estimatedReadingTime: 0,
        grammarErrors: [],
        spellingErrors: [],
        issues: ['No content available for analysis'],
        suggestions: ['Add meaningful content to the page'],
        tone: 'neutral',
        overallScore: 0,
        contentQuality: 0,
      };
    }

    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    // Build comprehensive company information verification section
    let expectedCompanyInfo = '';
    let hasCompanyInfo = false;
    
    if (session && (session.company_name || session.phone_number || session.email || session.address || session.custom_info)) {
      hasCompanyInfo = true;
      expectedCompanyInfo = `

COMPREHENSIVE COMPANY INFORMATION VERIFICATION:
This website should contain accurate and consistent company information. Please verify the following expected details against the website content:

Expected Company Information:`;
      
      if (session.company_name) {
        expectedCompanyInfo += `\n- Company/Business Name: "${session.company_name}"`;
        expectedCompanyInfo += `\n  → Check if this exact name appears prominently (header, footer, about page, contact page)`;
        expectedCompanyInfo += `\n  → Flag any variations, misspellings, or inconsistencies`;
      }
      
      if (session.phone_number) {
        expectedCompanyInfo += `\n- Phone Number: "${session.phone_number}"`;
        expectedCompanyInfo += `\n  → Check if this number appears correctly formatted`;
        expectedCompanyInfo += `\n  → Flag any different numbers or formatting inconsistencies`;
      }
      
      if (session.email) {
        expectedCompanyInfo += `\n- Email Address: "${session.email}"`;
        expectedCompanyInfo += `\n  → Check if this email appears and is properly formatted`;
        expectedCompanyInfo += `\n  → Flag any different email addresses`;
      }
      
      if (session.address) {
        expectedCompanyInfo += `\n- Physical Address: "${session.address}"`;
        expectedCompanyInfo += `\n  → Check if this address appears consistently`;
        expectedCompanyInfo += `\n  → Flag any variations or incomplete address information`;
      }
      
      if (session.custom_info) {
        expectedCompanyInfo += `\n- Additional Business Info: "${session.custom_info}"`;
        expectedCompanyInfo += `\n  → Check if this information is accurately represented`;
      }
      
      expectedCompanyInfo += `

COMPANY INFORMATION ANALYSIS REQUIREMENTS:
1. MISSING INFORMATION: If any expected company details are completely missing from the page content, add specific issues like:
   - "Missing company name '${session.company_name || '[Company Name]'}' - not found on this page"
   - "Missing contact phone number '${session.phone_number || '[Phone]'}' - should be visible for customer contact"
   - "Missing email address '${session.email || '[Email]'}' - important for customer communication"
   - "Missing physical address '${session.address || '[Address]'}' - essential for business credibility"

2. INCONSISTENT INFORMATION: If company information appears but differs from expected, add issues like:
   - "Company name inconsistency: found '[found name]' but expected '${session.company_name || '[Expected]'}'"
   - "Phone number mismatch: found '[found number]' but expected '${session.phone_number || '[Expected]'}'"
   - "Email inconsistency: found '[found email]' but expected '${session.email || '[Expected]'}'"
   - "Address discrepancy: found '[found address]' but expected '${session.address || '[Expected]'}'"

3. FORMATTING ISSUES: Check for proper formatting and professional presentation:
   - Phone numbers should be properly formatted (e.g., +44 123 456 7890 or (01234) 567890)
   - Email addresses should be clickable links where appropriate
   - Addresses should be complete and properly formatted
   - Company names should be consistently styled

4. PLACEMENT RECOMMENDATIONS: Add suggestions for better company information placement:
   - "Add company name to page header for better brand visibility"
   - "Include contact information in footer for easy access"
   - "Add contact phone number to contact page"
   - "Display business address prominently for local SEO"

5. CREDIBILITY IMPROVEMENTS: Suggest ways to enhance business credibility:
   - "Add company registration number or VAT number for transparency"
   - "Include business hours information"
   - "Add multiple contact methods for customer convenience"
   - "Consider adding company logo alongside name for brand recognition"

This company information verification should impact the overall content quality score significantly, as accurate business information is crucial for user trust and SEO.`;
    }

    const prompt = `
Analyze the following website content for grammar, spelling, and content quality. You MUST strictly follow UK English conventions and flag any US English spellings as grammar errors.

Content to analyze:
"${content}"${expectedCompanyInfo}

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
  "companyInformation": {
    "hasExpectedInfo": boolean,
    "companyInfoScore": number (1-100),
    "foundInformation": {
      "companyName": "name found on page or null",
      "phoneNumber": "phone found on page or null", 
      "email": "email found on page or null",
      "address": "address found on page or null",
      "customInfo": "custom info found or null"
    },
    "issues": [
      "specific company information issues"
    ],
    "suggestions": [
      "specific company information suggestions"
    ],
    "complianceStatus": {
      "companyName": "missing|correct|incorrect|partial",
      "phoneNumber": "missing|correct|incorrect|partial",
      "email": "missing|correct|incorrect|partial", 
      "address": "missing|correct|incorrect|partial",
      "customInfo": "missing|correct|incorrect|partial"
    }
  },
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

${hasCompanyInfo ? `
6. COMPANY INFORMATION ANALYSIS (CRITICAL):
   - Set "hasExpectedInfo" to true since company information was provided for verification
   - Carefully extract any company information found on the page into "foundInformation"
   - Compare found information with expected information and set appropriate "complianceStatus"
   - Calculate "companyInfoScore" based on completeness and accuracy (0-100):
     * 100: All expected information present and correct
     * 80-99: Most information present with minor issues
     * 60-79: Some information present but incomplete or inconsistent  
     * 40-59: Limited information present with major issues
     * 20-39: Very little correct company information
     * 0-19: No expected company information found
   - Include detailed company-specific issues in "companyInformation.issues"
   - Provide actionable company information suggestions in "companyInformation.suggestions"
   - Company information score should significantly impact the overall content score
` : `
6. COMPANY INFORMATION ANALYSIS:
   - Set "hasExpectedInfo" to false since no company information was provided for verification
   - Set "companyInfoScore" to 100 (N/A - no expected information to verify)
   - Leave "foundInformation" fields as null
   - Set all "complianceStatus" fields to "correct" (N/A)
   - Keep "issues" and "suggestions" arrays empty
`}

Focus on being helpful and educational. Each error should teach the user something about proper UK English and good writing practices. Company information accuracy is crucial for business credibility and local SEO.`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    // Clean up response and parse JSON
    const cleanedText = text.replace(/```json\n?|\n?```/g, '').trim();
    
    try {
      const analysis = JSON.parse(cleanedText);
      
      // Validate required fields and provide defaults
      const result = {
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
        companyInformation: {
          hasExpectedInfo: hasCompanyInfo,
          companyInfoScore: 100,
          foundInformation: {
            companyName: null,
            phoneNumber: null,
            email: null,
            address: null,
            customInfo: null
          },
          issues: [],
          suggestions: [],
          complianceStatus: {
            companyName: 'correct',
            phoneNumber: 'correct',
            email: 'correct',
            address: 'correct',
            customInfo: 'correct'
          }
        }
      };

      // If company information was expected, validate and use AI analysis
      if (hasCompanyInfo && analysis.companyInformation) {
        const companyInfo = analysis.companyInformation;
        result.companyInformation = {
          hasExpectedInfo: hasCompanyInfo,
          companyInfoScore: Math.min(100, Math.max(0, companyInfo.companyInfoScore || 0)),
          foundInformation: {
            companyName: companyInfo.foundInformation?.companyName || null,
            phoneNumber: companyInfo.foundInformation?.phoneNumber || null,
            email: companyInfo.foundInformation?.email || null,
            address: companyInfo.foundInformation?.address || null,
            customInfo: companyInfo.foundInformation?.customInfo || null
          },
          issues: Array.isArray(companyInfo.issues) ? companyInfo.issues : [],
          suggestions: Array.isArray(companyInfo.suggestions) ? companyInfo.suggestions : [],
          complianceStatus: {
            companyName: companyInfo.complianceStatus?.companyName || 'missing',
            phoneNumber: companyInfo.complianceStatus?.phoneNumber || 'missing',
            email: companyInfo.complianceStatus?.email || 'missing',
            address: companyInfo.complianceStatus?.address || 'missing',
            customInfo: companyInfo.complianceStatus?.customInfo || 'missing'
          }
        };

        // Adjust overall score based on company information score if it's significantly lower
        if (result.companyInformation.companyInfoScore < 70) {
          const penalty = (70 - result.companyInformation.companyInfoScore) * 0.2; // Up to 14 point penalty
          result.overallScore = Math.max(0, result.overallScore - penalty);
          console.log(`Applied company info penalty: -${penalty.toFixed(1)} points for score ${result.companyInformation.companyInfoScore}`);
        }
      }

      return result;
    } catch (parseError) {
      console.error('Failed to parse Gemini response:', cleanedText);
      throw new Error('Invalid response format from Gemini');
    }
    
  } catch (error) {
    console.error('Gemini API error:', error);
    throw new Error('Failed to analyze content with Gemini');
  }
}

async function analyzeSEO(html: string, url: string, pageTitle: string | null, statusCode: number | null) {
  // Meta tags analysis  
  const cleanTitle = extractTitle(html) || pageTitle;
  const metaTags = {
    title: cleanTitle,
    description: extractMetaContent(html, 'description'),
    keywords: extractMetaContent(html, 'keywords'),
    robots: extractMetaContent(html, 'robots'),
    canonical: extractLinkHref(html, 'canonical'),
    ogTitle: extractMetaProperty(html, 'og:title'),
    ogDescription: extractMetaProperty(html, 'og:description'),
    viewport: extractMetaContent(html, 'viewport'),
  };

  // Heading structure analysis  
  const headingStructure = analyzeHeadings(html);

  // Robots check
  const robotsCheck = {
    robotsTxt: false, // Would need separate request
    robotsMeta: metaTags.robots,
    indexable: !metaTags.robots?.includes('noindex'),
  };

  // Links analysis
  const linksCheck = analyzeLinks(html, url);

  // Redirect check
  const redirectCheck = {
    hasRedirect: statusCode !== 200,
    finalUrl: url,
    redirectChain: [], // Would need to track during crawling
  };

  // HTTPS check
  const httpsCheck = {
    isHttps: url.startsWith('https://'),
    hasSecurityHeaders: false, // Would need response headers
  };

  // Calculate overall SEO score
  let score = 0;
  const issues = [];
  const recommendations = [];

  // Title tag scoring (20 points)
  if (metaTags.title) {
    if (metaTags.title.length >= 30 && metaTags.title.length <= 60) {
      score += 20;
    } else if (metaTags.title.length > 0) {
      score += 10;
      issues.push(`Title tag length is ${metaTags.title.length} characters (optimal: 30-60)`);
      recommendations.push('Optimize title tag length to 30-60 characters');
    }
  } else {
    issues.push('Missing title tag');
    recommendations.push('Add a descriptive title tag');
  }

  // Description meta tag scoring (15 points)
  if (metaTags.description) {
    if (metaTags.description.length >= 120 && metaTags.description.length <= 160) {
      score += 15;
    } else if (metaTags.description.length > 0) {
      score += 8;
      issues.push(`Meta description length is ${metaTags.description.length} characters (optimal: 120-160)`);
      recommendations.push('Optimize meta description length to 120-160 characters');
    }
  } else {
    issues.push('Missing meta description');
    recommendations.push('Add a compelling meta description');
  }

  // H1 tag scoring (15 points)
  if (headingStructure.hasProperStructure) {
    score += 15;
  } else if (headingStructure.h1Count === 0) {
    issues.push('Missing H1 tag');
    recommendations.push('Add exactly one H1 tag to the page');
  } else if (headingStructure.h1Count > 1) {
    score += 8;
    issues.push(`Multiple H1 tags found (${headingStructure.h1Count})`);
    recommendations.push('Use only one H1 tag per page');
  }

  // Heading hierarchy scoring (10 points)
  if (headingStructure.allHeadings.length > 1) {
    score += 10;
  } else {
    issues.push('Poor heading structure');
    recommendations.push('Use proper heading hierarchy (H1 > H2 > H3...)');
  }

  // HTTPS scoring (10 points)
  if (httpsCheck.isHttps) {
    score += 10;
  } else {
    issues.push('Page not served over HTTPS');
    recommendations.push('Implement HTTPS for better security and SEO');
  }

  // Indexability scoring (10 points)
  if (robotsCheck.indexable) {
    score += 10;
  } else {
    issues.push('Page is not indexable (noindex directive found)');
    recommendations.push('Remove noindex directive if page should be indexed');
  }

  // Canonical URL scoring (5 points)
  if (metaTags.canonical) {
    score += 5;
  } else {
    issues.push('Missing canonical URL');
    recommendations.push('Add canonical URL to prevent duplicate content issues');
  }

  // Viewport meta tag scoring (5 points)
  if (metaTags.viewport) {
    score += 5;
  } else {
    issues.push('Missing viewport meta tag');
    recommendations.push('Add viewport meta tag for mobile responsiveness');
  }

  // Links scoring (5 points)
  if (linksCheck.totalLinks > 0) {
    score += 5;
  } else {
    issues.push('No links found on the page');
    recommendations.push('Add relevant internal and external links');
  }

  // Open Graph scoring (5 points)
  if (metaTags.ogTitle && metaTags.ogDescription) {
    score += 5;
  } else {
    issues.push('Missing Open Graph tags');
    recommendations.push('Add Open Graph tags for better social media sharing');
  }

  return {
    metaTags,
    headingStructure,
    robotsCheck,
    linksCheck,
    redirectCheck,
    httpsCheck,
    overallScore: Math.min(100, score),
    issues,
    recommendations
  };
}

function extractTitle(html: string): string | null {
  // Try to extract clean title from <title> tag
  const titleMatch = html.match(/<title[^>]*>(.*?)<\/title>/i);
  if (titleMatch && titleMatch[1]) {
    let title = titleMatch[1].trim();
    
    // Clean up common unwanted text patterns
    title = title
      .replace(/\s*\|\s*.*?(Menu|Navigation|Nav).*$/i, '') // Remove menu-related suffixes
      .replace(/\s*\|\s*.*?(Toggle|Expand|Dropdown).*$/i, '') // Remove toggle-related suffixes
      .replace(/\s*\|\s*.*?(Facebook|Twitter|Instagram|LinkedIn|Social).*$/i, '') // Remove social media suffixes
      .replace(/\s*-\s*.*?(Menu|Navigation|Nav).*$/i, '') // Remove menu with dash separator
      .replace(/ExpandToggle.*$/i, '') // Remove specific "ExpandToggle" text
      .replace(/MenuExpand.*$/i, '') // Remove specific "MenuExpand" text
      .replace(/Facebook$/i, '') // Remove trailing "Facebook"
      .trim();
    
    return title || null;
  }
  return null;
}

function extractMetaContent(html: string, name: string): string | null {
  const regex = new RegExp(`<meta[^>]*name=["']${name}["'][^>]*content=["']([^"']*?)["']`, 'i');
  const match = html.match(regex);
  return match ? match[1] : null;
}

function extractMetaProperty(html: string, property: string): string | null {
  const regex = new RegExp(`<meta[^>]*property=["']${property}["'][^>]*content=["']([^"']*?)["']`, 'i');
  const match = html.match(regex);
  return match ? match[1] : null;
}

function extractLinkHref(html: string, rel: string): string | null {
  const regex = new RegExp(`<link[^>]*rel=["']${rel}["'][^>]*href=["']([^"']*?)["']`, 'i');
  const match = html.match(regex);
  return match ? match[1] : null;
}

function analyzeHeadings(html: string) {
  const h1Matches = html.match(/<h1[^>]*>(.*?)<\/h1>/gi) || [];
  const allHeadingMatches = html.match(/<h[1-6][^>]*>(.*?)<\/h[1-6]>/gi) || [];
  
  const h1Text = h1Matches.map(match => match.replace(/<[^>]*>/g, '').trim());
  
  const allHeadings = allHeadingMatches.map(match => {
    const level = parseInt(match.match(/<h(\d)/)?.[1] || '1');
    const text = match.replace(/<[^>]*>/g, '').trim();
    return { level, text };
  });

  return {
    h1Count: h1Matches.length,
    h1Text,
    hasProperStructure: h1Matches.length === 1,
    allHeadings,
  };
}

function analyzeLinks(html: string, baseUrl: string) {
  const linkMatches = html.match(/<a[^>]*href=["']([^"']*?)["'][^>]*>/gi) || [];
  const links = linkMatches.map(match => {
    const href = match.match(/href=["']([^"']*?)["']/)?.[1] || '';
    return href;
  }).filter(href => href && !href.startsWith('#'));

  const totalLinks = links.length;
  const externalLinks = links.filter(link => 
    link.startsWith('http') && !link.includes(new URL(baseUrl).hostname)
  ).length;
  const internalLinks = totalLinks - externalLinks;

  return {
    totalLinks,
    internalLinks,
    externalLinks,
    brokenLinks: [], // Would need to check each link
  };
} 