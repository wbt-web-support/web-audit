import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string; pageId: string }> }
) {
  try {
    const supabase = await createClient();
    const { id, pageId } = await params;
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

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

    // Get the specific page
    const { data: page, error: pageError } = await supabase
      .from('scraped_pages')
      .select('*')
      .eq('id', pageId)
      .eq('audit_session_id', id)
      .single();

    if (pageError || !page) {
      return NextResponse.json({ error: 'Page not found' }, { status: 404 });
    }

    // Delete existing results for this page
    await supabase
      .from('audit_results')
      .delete()
      .eq('scraped_page_id', pageId);

    // Start re-analysis in background
    reanalyzePage(page);

    return NextResponse.json({ 
      message: 'Page re-analysis started',
      page_id: pageId 
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

async function reanalyzePage(page: any) {
  const supabase = await createClient();
  
  try {
    // Enhanced analysis - more detailed than basic analysis
    const results = await performDetailedAnalysis(page);
    
    // Save analysis results
    for (const result of results) {
      await supabase
        .from('audit_results')
        .insert({
          scraped_page_id: page.id,
          audit_type: result.type,
          status: result.status,
          score: result.score,
          details: result.details,
        });
    }
  } catch (error) {
    console.error('Re-analysis failed:', error);
  }
}

async function performDetailedAnalysis(page: any) {
  const results = [];
  
  // Enhanced SEO Analysis
  const seoAnalysis = performEnhancedSEO(page);
  results.push(seoAnalysis);

  // Enhanced Grammar Analysis
  const grammarAnalysis = performEnhancedGrammar(page);
  results.push(grammarAnalysis);

  // Enhanced Performance Analysis
  const performanceAnalysis = performEnhancedPerformance(page);
  results.push(performanceAnalysis);

  // Content Structure Analysis
  const contentAnalysis = performContentAnalysis(page);
  results.push(contentAnalysis);

  // Accessibility Analysis
  const accessibilityAnalysis = performAccessibilityAnalysis(page);
  results.push(accessibilityAnalysis);

  return results;
}

function performEnhancedSEO(page: any) {
  let score = 0;
  const issues = [];
  const recommendations = [];
  
  // Title analysis
  const hasTitle = !!page.title;
  const titleLength = page.title?.length || 0;
  
  if (hasTitle) {
    score += 20;
    if (titleLength >= 30 && titleLength <= 60) {
      score += 15;
    } else if (titleLength < 30) {
      issues.push('Title is too short (under 30 characters)');
      recommendations.push('Expand title to 30-60 characters for better SEO');
    } else if (titleLength > 60) {
      issues.push('Title is too long (over 60 characters)');
      recommendations.push('Shorten title to under 60 characters to prevent truncation');
    }
  } else {
    issues.push('Missing page title');
    recommendations.push('Add a descriptive title tag to improve SEO');
  }

  // Content analysis
  const contentLength = page.content?.length || 0;
  if (contentLength > 300) {
    score += 25;
  } else if (contentLength > 100) {
    score += 15;
    issues.push('Content is quite short');
    recommendations.push('Add more valuable content (aim for 300+ characters)');
  } else {
    issues.push('Very little content found');
    recommendations.push('Add substantial content to improve SEO value');
  }

  // Word count analysis
  const wordCount = page.content ? page.content.split(/\s+/).length : 0;
  if (wordCount > 300) {
    score += 15;
  } else if (wordCount > 100) {
    score += 10;
  } else {
    issues.push('Low word count');
    recommendations.push('Aim for at least 300 words for better SEO');
  }

  // Meta description check (basic)
  if (contentLength > 150) {
    score += 10;
  }

  // Headings structure (basic check)
  const hasHeadings = page.content && /^#|<h[1-6]/.test(page.content);
  if (hasHeadings) {
    score += 15;
  } else {
    issues.push('No clear heading structure found');
    recommendations.push('Use proper heading tags (H1, H2, etc.) to structure content');
  }

  return {
    type: 'seo',
    status: score > 70 ? 'pass' : score > 40 ? 'warning' : 'fail',
    score: Math.min(score, 100),
    details: {
      hasTitle,
      titleLength,
      contentLength,
      wordCount,
      issues,
      recommendations,
      breakdown: {
        title: hasTitle ? (titleLength >= 30 && titleLength <= 60 ? 35 : 20) : 0,
        content: contentLength > 300 ? 25 : contentLength > 100 ? 15 : 0,
        wordCount: wordCount > 300 ? 15 : wordCount > 100 ? 10 : 0,
        structure: hasHeadings ? 15 : 0,
        meta: contentLength > 150 ? 10 : 0
      }
    }
  };
}

function performEnhancedGrammar(page: any) {
  let score = 50; // Base score
  const issues = [];
  const recommendations = [];
  
  const content = page.content || '';
  const contentLength = content.length;
  
  // Content length scoring
  if (contentLength > 1000) score += 20;
  else if (contentLength > 500) score += 15;
  else if (contentLength > 100) score += 10;
  else {
    issues.push('Very short content');
    recommendations.push('Add more content for better analysis');
  }

  // Sentence structure analysis (basic)
  const sentences = content.split(/[.!?]+/).filter((s: string) => s.trim().length > 10);
  const avgSentenceLength = sentences.length > 0 ? 
    sentences.reduce((sum: number, s: string) => sum + s.length, 0) / sentences.length : 0;
  
  if (avgSentenceLength > 20 && avgSentenceLength < 150) {
    score += 15;
  } else if (avgSentenceLength > 150) {
    issues.push('Sentences may be too long');
    recommendations.push('Consider breaking long sentences for better readability');
  }

  // Paragraph structure
  const paragraphs = content.split(/\n\s*\n/).filter((p: string) => p.trim().length > 50);
  if (paragraphs.length > 1) {
    score += 10;
  } else {
    issues.push('Content lacks paragraph structure');
    recommendations.push('Break content into paragraphs for better readability');
  }

  // Reading time calculation
  const wordsPerMinute = 200;
  const wordCount = content.split(/\s+/).length;
  const estimatedReadingTime = Math.ceil(wordCount / wordsPerMinute);

  // Readability indicators
  const complexWords = content.split(/\s+/).filter((word: string) => word.length > 7).length;
  const readabilityScore = Math.max(0, 100 - (complexWords / wordCount) * 50);

  if (readabilityScore > 60) {
    score += 15;
  } else {
    issues.push('Content may be difficult to read');
    recommendations.push('Simplify language and use shorter words where possible');
  }

  return {
    type: 'grammar',
    status: score > 80 ? 'pass' : score > 60 ? 'warning' : 'fail',
    score: Math.min(score, 100),
    details: {
      contentLength,
      wordCount,
      sentenceCount: sentences.length,
      paragraphCount: paragraphs.length,
      avgSentenceLength: Math.round(avgSentenceLength),
      estimatedReadingTime,
      readabilityScore: Math.round(readabilityScore),
      issues,
      recommendations
    }
  };
}

function performEnhancedPerformance(page: any) {
  let score = 0;
  const issues = [];
  const recommendations = [];
  
  // Status code analysis
  const statusCode = page.status_code || 0;
  if (statusCode === 200) {
    score += 40;
  } else if (statusCode >= 200 && statusCode < 300) {
    score += 30;
  } else if (statusCode >= 300 && statusCode < 400) {
    score += 20;
    issues.push(`Redirect status: ${statusCode}`);
    recommendations.push('Consider if redirects are necessary');
  } else if (statusCode >= 400) {
    issues.push(`Error status: ${statusCode}`);
    recommendations.push('Fix server errors or broken links');
  } else {
    issues.push('No response or connection error');
    recommendations.push('Check if the page is accessible');
  }

  // Error handling
  if (!page.error_message) {
    score += 30;
  } else {
    issues.push(`Error: ${page.error_message}`);
    recommendations.push('Resolve page loading errors');
  }

  // Content size analysis
  const htmlSize = page.html?.length || 0;
  const contentSize = page.content?.length || 0;
  
  if (htmlSize > 0) {
    score += 15;
    if (htmlSize < 100000) { // Less than 100KB is good
      score += 10;
    } else {
      issues.push('Large HTML size');
      recommendations.push('Optimize HTML size for faster loading');
    }
  }

  // Content to HTML ratio
  if (htmlSize > 0 && contentSize > 0) {
    const ratio = contentSize / htmlSize;
    if (ratio > 0.1) { // Good content to code ratio
      score += 5;
    } else {
      issues.push('Low content to HTML ratio');
      recommendations.push('Increase meaningful content or reduce HTML overhead');
    }
  }

  return {
    type: 'performance',
    status: score > 80 ? 'pass' : score > 60 ? 'warning' : 'fail',
    score: Math.min(score, 100),
    details: {
      statusCode,
      hasError: !!page.error_message,
      errorMessage: page.error_message,
      htmlSize,
      contentSize,
      contentToHtmlRatio: htmlSize > 0 ? Math.round((contentSize / htmlSize) * 100) / 100 : 0,
      issues,
      recommendations
    }
  };
}

function performContentAnalysis(page: any) {
  let score = 0;
  const issues = [];
  const recommendations = [];
  
  const content = page.content || '';
  const title = page.title || '';
  
  // Content quality indicators
  const wordCount = content.split(/\s+/).filter((word: string) => word.length > 0).length;
  const uniqueWords = new Set(content.toLowerCase().split(/\s+/)).size;
  const vocabularyRichness = wordCount > 0 ? uniqueWords / wordCount : 0;
  
  if (vocabularyRichness > 0.5) {
    score += 25;
  } else if (vocabularyRichness > 0.3) {
    score += 15;
    issues.push('Limited vocabulary diversity');
    recommendations.push('Use more varied vocabulary to enhance content richness');
  } else {
    issues.push('Very repetitive content');
    recommendations.push('Diversify vocabulary and avoid excessive repetition');
  }

  // Title-content alignment
  if (title && content) {
    const titleWords = title.toLowerCase().split(/\s+/);
    const contentLower = content.toLowerCase();
    const titleWordsInContent = titleWords.filter((word: string) => 
      word.length > 3 && contentLower.includes(word)
    ).length;
    
    const alignment = titleWords.length > 0 ? titleWordsInContent / titleWords.length : 0;
    
    if (alignment > 0.5) {
      score += 25;
    } else if (alignment > 0.25) {
      score += 15;
      issues.push('Weak title-content alignment');
      recommendations.push('Ensure content relates more closely to the page title');
    } else {
      issues.push('Poor title-content alignment');
      recommendations.push('Make sure content supports and expands on the page title');
    }
  }

  // Content structure
  const hasLists = /•|[-*]|\d+\.|<li>|<ol>|<ul>/.test(content);
  const hasEmphasis = /<strong>|<b>|<em>|<i>|\*\*|\*/.test(content);
  
  if (hasLists) score += 15;
  else {
    recommendations.push('Consider using lists to organize information');
  }
  
  if (hasEmphasis) score += 10;
  else {
    recommendations.push('Use emphasis (bold, italics) to highlight important points');
  }

  // Content freshness indicators
  const datePattern = /\b(20[0-2]\d|19[0-9]\d)\b/;
  const hasDateReferences = datePattern.test(content);
  
  if (hasDateReferences) {
    score += 15;
  }

  // Call-to-action indicators
  const ctaPattern = /(click|contact|call|buy|subscribe|download|learn more|get started)/i;
  const hasCallToAction = ctaPattern.test(content);
  
  if (hasCallToAction) {
    score += 10;
  } else {
    recommendations.push('Consider adding clear calls-to-action to guide users');
  }

  return {
    type: 'context',
    status: score > 70 ? 'pass' : score > 50 ? 'warning' : 'fail',
    score: Math.min(score, 100),
    details: {
      wordCount,
      uniqueWords,
      vocabularyRichness: Math.round(vocabularyRichness * 100) / 100,
      hasLists,
      hasEmphasis,
      hasDateReferences,
      hasCallToAction,
      issues,
      recommendations
    }
  };
}

function performAccessibilityAnalysis(page: any) {
  let score = 50; // Base score
  const issues = [];
  const recommendations = [];
  
  const html = page.html || '';
  const content = page.content || '';
  
  // Image accessibility
  const imgTags = (html.match(/<img[^>]*>/gi) || []).length;
  const imgsWithAlt = (html.match(/<img[^>]*alt\s*=\s*["'][^"']+["'][^>]*>/gi) || []).length;
  
  if (imgTags > 0) {
    const altRatio = imgsWithAlt / imgTags;
    if (altRatio === 1) {
      score += 20;
    } else if (altRatio > 0.5) {
      score += 10;
      issues.push('Some images missing alt text');
      recommendations.push('Add descriptive alt text to all images');
    } else {
      issues.push('Most images missing alt text');
      recommendations.push('Add alt text to all images for accessibility');
    }
  } else {
    score += 10; // No images is not an issue
  }

  // Heading structure
  const h1Count = (html.match(/<h1[^>]*>/gi) || []).length;
  const headingTags = (html.match(/<h[1-6][^>]*>/gi) || []).length;
  
  if (h1Count === 1) {
    score += 15;
  } else if (h1Count === 0) {
    issues.push('Missing H1 heading');
    recommendations.push('Add exactly one H1 heading per page');
  } else {
    issues.push('Multiple H1 headings found');
    recommendations.push('Use only one H1 heading per page');
  }

  if (headingTags > 1) {
    score += 10;
  } else {
    issues.push('Poor heading structure');
    recommendations.push('Use proper heading hierarchy (H1, H2, H3, etc.)');
  }

  // Link accessibility
  const linkTags = (html.match(/<a[^>]*href[^>]*>/gi) || []).length;
  const linksWithText = (html.match(/<a[^>]*href[^>]*>[^<]+<\/a>/gi) || []).length;
  
  if (linkTags > 0) {
    const linkTextRatio = linksWithText / linkTags;
    if (linkTextRatio > 0.8) {
      score += 15;
    } else {
      issues.push('Some links may lack descriptive text');
      recommendations.push('Ensure all links have meaningful, descriptive text');
    }
  }

  // Content readability
  if (content.length > 0) {
    const avgWordLength = content.split(/\s+/).reduce((sum: number, word: string) => sum + word.length, 0) / content.split(/\s+/).length;
    if (avgWordLength < 6) {
      score += 10;
    } else {
      issues.push('Complex language detected');
      recommendations.push('Use simpler language for better accessibility');
    }
  }

  return {
    type: 'accessibility',
    status: score > 80 ? 'pass' : score > 60 ? 'warning' : 'fail',
    score: Math.min(score, 100),
    details: {
      imageCount: imgTags,
      imagesWithAlt: imgsWithAlt,
      h1Count,
      totalHeadings: headingTags,
      linkCount: linkTags,
      linksWithText,
      issues,
      recommendations
    }
  };
} 