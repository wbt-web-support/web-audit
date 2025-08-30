'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { HelpCircle } from 'lucide-react';

const helpItems = [
  {
    id: '1',
    question: 'How to create a new project?',
    answer: `Creating a new web audit project is simple and straightforward. Here's a step-by-step guide:

1. **Navigate to Projects**: Click on the "Projects" tab in your dashboard or use the "New Project" button.

2. **Enter Website URL**: In the project creation form, enter the complete URL of the website you want to audit (e.g., https://example.com).

3. **Configure Settings**: 
   - Choose your crawl depth (how many pages to analyze)
   - Select analysis options (SEO, Performance, Accessibility, etc.)
   - Set any custom parameters

4. **Start Audit**: Click "Create Project" to begin the audit process.

5. **Monitor Progress**: The system will automatically crawl your website and analyze each page. You can monitor the progress in real-time.

6. **Review Results**: Once complete, you'll receive a comprehensive report with detailed findings and recommendations.

**Pro Tips:**
- For better results, ensure your website is accessible and not blocking crawlers
- Larger websites may take longer to audit - be patient!
- You can pause and resume audits if needed
- Export results as PDF or CSV for sharing with your team`
  },
  {
    id: '2',
    question: 'Understanding audit results',
    answer: `Our web audit provides comprehensive analysis across multiple dimensions. Here's how to interpret your results:

**Overall Score**: This is your website's performance rating (0-100). Scores above 80 are excellent, 60-80 are good, and below 60 need improvement.

**Key Metrics Explained:**

1. **SEO Analysis**:
   - Meta tags optimization
   - Heading structure
   - Image alt text
   - Internal linking
   - Page load speed impact on SEO

2. **Performance Metrics**:
   - Page load time
   - Core Web Vitals (LCP, FID, CLS)
   - Resource optimization
   - Caching effectiveness

3. **Accessibility**:
   - WCAG compliance
   - Screen reader compatibility
   - Keyboard navigation
   - Color contrast ratios

4. **Technical Issues**:
   - Broken links
   - Missing alt attributes
   - Duplicate content
   - Mobile responsiveness

**Action Items**: Each issue comes with specific recommendations for improvement, prioritized by impact and effort required.

**Trends**: Compare results over time to track improvements and identify new issues.

**Export Options**: Download detailed reports in PDF or CSV format for team collaboration.`
  },
  {
    id: '3',
    question: 'Upgrading your plan',
    answer: `We offer flexible plans to meet your needs as your business grows. Here's everything you need to know about upgrading:

**Current Plans Available:**

**Free Plan** (Current):
- 5 projects per month
- 100 pages per project
- Basic analytics
- Email support

**Pro Plan** ($29/month):
- Unlimited projects
- 1,000 pages per project
- Advanced analytics & reporting
- Priority support
- Custom reports
- API access
- Team collaboration features

**Enterprise Plan** (Custom pricing):
- Everything in Pro
- Unlimited pages
- Dedicated support manager
- Custom integrations
- White-label options
- Advanced security features

**How to Upgrade:**

1. **From Dashboard**: Click "Upgrade Plan" in your dashboard
2. **Select Plan**: Choose the plan that best fits your needs
3. **Payment**: Enter your payment information securely
4. **Activation**: Your new features are available immediately

**Benefits of Upgrading:**
- No project limits for Pro and Enterprise
- Faster audit processing
- More detailed analysis
- Priority customer support
- Advanced export options
- Team management features

**Downgrading**: You can downgrade at any time, but you'll lose access to premium features at the end of your billing cycle.

**Need Help?**: Contact our sales team for custom enterprise solutions or questions about plan features.`
  }
];

export function QuickHelpAccordion() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <HelpCircle className="h-5 w-5" />
          Quick Help
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Accordion type="single" collapsible className="w-full">
          {helpItems.map((item) => (
            <AccordionItem key={item.id} value={item.id}>
              <AccordionTrigger className="text-left">
                {item.question}
              </AccordionTrigger>
              <AccordionContent>
                <div className="prose prose-sm max-w-none">
                  {item.answer.split('\n\n').map((paragraph, index) => (
                    <p key={index} className="mb-4 text-sm leading-relaxed">
                      {paragraph}
                    </p>
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </CardContent>
    </Card>
  );
}
