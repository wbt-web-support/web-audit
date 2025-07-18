import axios from 'axios';

// Environment variable for API key

export interface PageSpeedAnalysis {
  url: string;
  strategy: string;
  timestamp: string;
  
  // Performance Data
  performance: {
    score: number;
    metrics: {
      firstContentfulPaint: number;
      largestContentfulPaint: number;
      firstInputDelay: number;
      cumulativeLayoutShift: number;
      speedIndex: number;
      totalBlockingTime: number;
      timeToInteractive: number;
    };
    coreWebVitals: {
      LCP: { value: number; rating: string };
      FID: { value: number; rating: string };
      CLS: { value: number; rating: string };
    };
    opportunities: Array<{
      title: string;
      description: string;
      savings: number;
      impact: string;
    }>;
  };
  
  // Accessibility Data
  accessibility: {
    score: number;
    passedAudits: number;
    failedAudits: number;
    issues: Array<{
      title: string;
      description: string;
      severity: string;
      impact: string;
      elements?: number;
    }>;
    recommendations: Array<{
      title: string;
      description: string;
      priority: string;
    }>;
  };
  
  // Overall Summary
  summary: {
    overallGrade: string;
    primaryIssues: string[];
    quickWins: string[];
  };
}

export async function analyzePerformanceAndAccessibility(
  url: string
): Promise<PageSpeedAnalysis | { error: string }> {
    const PAGESPEED_API_KEY = process.env.PAGESPEED_API_KEY;
  if (!PAGESPEED_API_KEY) {
    throw new Error("Google PageSpeed Insights API key not set in env");
  }

  // Always use 'mobile' strategy
  const strategy = "mobile";
  const apiUrl = `https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=${encodeURIComponent(url)}&strategy=${strategy}&category=performance&category=accessibility&key=${PAGESPEED_API_KEY}`;
  
  try {
    const response = await axios.get(apiUrl);
    const data = response.data;
    const audits = data.lighthouseResult.audits;
    const categories = data.lighthouseResult.categories;

    // Helper function to get Core Web Vitals rating
    const getCWVRating = (value: number, metric: string): string => {
      if (metric === 'LCP') {
        return value <= 2500 ? 'good' : value <= 4000 ? 'needs-improvement' : 'poor';
      }
      if (metric === 'FID') {
        return value <= 100 ? 'good' : value <= 300 ? 'needs-improvement' : 'poor';
      }
      if (metric === 'CLS') {
        return value <= 0.1 ? 'good' : value <= 0.25 ? 'needs-improvement' : 'poor';
      }
      return 'unknown';
    };

    // Extract Performance Data
    const performanceScore = Math.round(categories.performance.score * 100);
    const performanceMetrics = {
      firstContentfulPaint: Math.round(audits['first-contentful-paint']?.numericValue || 0),
      largestContentfulPaint: Math.round(audits['largest-contentful-paint']?.numericValue || 0),
      firstInputDelay: Math.round(audits['first-input-delay']?.numericValue || 0),
      cumulativeLayoutShift: Math.round((audits['cumulative-layout-shift']?.numericValue || 0) * 1000) / 1000,
      speedIndex: Math.round(audits['speed-index']?.numericValue || 0),
      totalBlockingTime: Math.round(audits['total-blocking-time']?.numericValue || 0),
      timeToInteractive: Math.round(audits['interactive']?.numericValue || 0)
    };

    // Core Web Vitals with ratings
    const coreWebVitals = {
      LCP: { 
        value: performanceMetrics.largestContentfulPaint, 
        rating: getCWVRating(performanceMetrics.largestContentfulPaint, 'LCP') 
      },
      FID: { 
        value: performanceMetrics.firstInputDelay, 
        rating: getCWVRating(performanceMetrics.firstInputDelay, 'FID') 
      },
      CLS: { 
        value: performanceMetrics.cumulativeLayoutShift, 
        rating: getCWVRating(performanceMetrics.cumulativeLayoutShift, 'CLS') 
      }
    };

    // Performance Opportunities
    const opportunities = Object.values(audits)
      .filter((audit: any) => audit.details?.type === 'opportunity' && audit.numericValue > 0)
      .map((audit: any) => ({
        title: audit.title,
        description: audit.description,
        savings: Math.round(audit.numericValue),
        impact: audit.numericValue > 1000 ? 'high' : audit.numericValue > 500 ? 'medium' : 'low'
      }))
      .sort((a, b) => b.savings - a.savings)
      .slice(0, 5);

    // Extract Accessibility Data
    const accessibilityScore = Math.round(categories.accessibility.score * 100);
    const accessibilityAudits = categories.accessibility.auditRefs;
    
    let passedAudits = 0;
    let failedAudits = 0;
    const accessibilityIssues: any[] = [];
    const accessibilityRecommendations: any[] = [];

    accessibilityAudits.forEach((auditRef: any) => {
      const audit = audits[auditRef.id];
      if (audit) {
        if (audit.score === 1) {
          passedAudits++;
        } else if (audit.score === 0) {
          failedAudits++;
          
          // Determine severity based on impact
          const severity = auditRef.weight >= 7 ? 'critical' : 
                          auditRef.weight >= 3 ? 'serious' : 'moderate';
          
          accessibilityIssues.push({
            title: audit.title,
            description: audit.description,
            severity,
            impact: audit.details?.items?.length ? `${audit.details.items.length} elements` : 'Multiple elements',
            elements: audit.details?.items?.length || 0
          });

          // Add to recommendations if it's a high-impact issue
          if (auditRef.weight >= 3) {
            accessibilityRecommendations.push({
              title: audit.title,
              description: audit.description,
              priority: severity === 'critical' ? 'high' : 'medium'
            });
          }
        }
      }
    });

    // Sort issues by severity
    accessibilityIssues.sort((a, b) => {
      const severityOrder = { critical: 3, serious: 2, moderate: 1 };
      return severityOrder[b.severity as keyof typeof severityOrder] - severityOrder[a.severity as keyof typeof severityOrder];
    });

    // Generate Summary
    const overallGrade = performanceScore >= 90 && accessibilityScore >= 90 ? 'A' :
                        performanceScore >= 70 && accessibilityScore >= 70 ? 'B' :
                        performanceScore >= 50 && accessibilityScore >= 50 ? 'C' : 'D';

    const primaryIssues: string[] = [];
    if (performanceScore < 50) primaryIssues.push('Poor performance score');
    if (accessibilityScore < 50) primaryIssues.push('Poor accessibility score');
    if (coreWebVitals.LCP.rating === 'poor') primaryIssues.push('Large Contentful Paint too slow');
    if (coreWebVitals.CLS.rating === 'poor') primaryIssues.push('Layout shifts affecting user experience');
    if (failedAudits > 5) primaryIssues.push('Multiple accessibility violations');

    const quickWins: string[] = [];
    if (opportunities.length > 0) quickWins.push(opportunities[0].title);
    if (accessibilityIssues.some(issue => issue.severity === 'moderate')) {
      quickWins.push('Fix moderate accessibility issues');
    }
    if (performanceMetrics.totalBlockingTime > 300) quickWins.push('Reduce JavaScript execution time');

    return {
      url: data.id,
      strategy,
      timestamp: new Date().toISOString(),
      
      performance: {
        score: performanceScore,
        metrics: performanceMetrics,
        coreWebVitals,
        opportunities
      },
      
      accessibility: {
        score: accessibilityScore,
        passedAudits,
        failedAudits,
        issues: accessibilityIssues.slice(0, 10), // Top 10 issues
        recommendations: accessibilityRecommendations.slice(0, 5) // Top 5 recommendations
      },
      
      summary: {
        overallGrade,
        primaryIssues,
        quickWins
      }
    };

  } catch (error) {
    console.error("PageSpeed Insights API error:", error);
    return { error: "Failed to fetch PageSpeed Insights data" };
  }
}

// Usage example with result logging
export async function runAnalysis(url: string) {
  const result = await analyzePerformanceAndAccessibility(url);
  
  if ('error' in result) {
    console.error('Analysis failed:', result.error);
    return;
  }

  console.log(`\n=== Analysis Results for ${result.url} ===`);
  console.log(`Overall Grade: ${result.summary.overallGrade}`);
  console.log(`Performance Score: ${result.performance.score}/100`);
  console.log(`Accessibility Score: ${result.accessibility.score}/100`);
  
  console.log(`\n--- Core Web Vitals ---`);
  console.log(`LCP: ${result.performance.coreWebVitals.LCP.value}ms (${result.performance.coreWebVitals.LCP.rating})`);
  console.log(`FID: ${result.performance.coreWebVitals.FID.value}ms (${result.performance.coreWebVitals.FID.rating})`);
  console.log(`CLS: ${result.performance.coreWebVitals.CLS.value} (${result.performance.coreWebVitals.CLS.rating})`);
  
  console.log(`\n--- Top Issues ---`);
  result.summary.primaryIssues.forEach((issue, i) => console.log(`${i + 1}. ${issue}`));
  
  console.log(`\n--- Quick Wins ---`);
  result.summary.quickWins.forEach((win, i) => console.log(`${i + 1}. ${win}`));
  
  console.log(`\n--- Accessibility Issues ---`);
  result.accessibility.issues.slice(0, 3).forEach((issue, i) => {
    console.log(`${i + 1}. [${issue.severity.toUpperCase()}] ${issue.title}`);
  });
}