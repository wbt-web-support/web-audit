'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, XCircle, ExternalLink, CodeSquare, Link2, Globe, ChevronLeft, ChevronRight } from 'lucide-react';
import { toast } from 'react-toastify';

interface LinkAnalysis {
  href: string;
  type: string;
  text?: string;
  page_url: string;
}

interface LinksAnalysisTableProps {
  links: LinkAnalysis[];
}

const ITEMS_PER_PAGE = 50; // Show only 50 items per page for better performance

export function LinksAnalysisTable({ links }: LinksAnalysisTableProps) {
  const [showAllLinksAnalysis, setShowAllLinksAnalysis] = useState(true);
  const [linkTypeFilter, setLinkTypeFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);

  // Helper function for normalized duplicate detection
  const getNormalizedUrl = (url: string) => {
    return url
      .split('?')[0] // Remove query parameters
      .split('#')[0] // Remove hash fragments
      .replace(/\/$/, '') // Remove trailing slash
      .toLowerCase();
  };

  // Helper function to detect if link is internal or external
  const isInternalLink = (link: LinkAnalysis) => {
    try {
      const hrefUrl = new URL(link.href);
      const pageUrl = new URL(link.page_url);
      return hrefUrl.hostname === pageUrl.hostname;
    } catch {
      // If URL parsing fails, assume external
      return false;
    }
  };

  // Helper function to get link domain
  const getLinkDomain = (url: string) => {
    try {
      return new URL(url).hostname;
    } catch {
      return 'invalid-url';
    }
  };

  // Memoized processed links for better performance
  const processedLinks = useMemo(() => {
    let filteredLinks = links;
    
    // Apply type filter
    if (linkTypeFilter !== 'all') {
      filteredLinks = filteredLinks.filter(link => {
        if (linkTypeFilter === 'internal') {
          return isInternalLink(link);
        } else if (linkTypeFilter === 'external') {
          return !isInternalLink(link);
        }
        return true;
      });
    }
    
    // Sort by type: internal first, then external
    return filteredLinks.sort((a, b) => {
      const aIsInternal = isInternalLink(a);
      const bIsInternal = isInternalLink(b);
      if (aIsInternal && !bIsInternal) return -1;
      if (!aIsInternal && bIsInternal) return 1;
      return 0;
    });
  }, [links, linkTypeFilter]);

  // Pagination logic
  const totalPages = Math.ceil(processedLinks.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const currentPageLinks = processedLinks.slice(startIndex, endIndex);

  // Reset to first page when filter changes
  const handleFilterChange = (newFilter: string) => {
    setLinkTypeFilter(newFilter);
    setCurrentPage(1);
  };

  // Get link count
  const getLinkCount = () => {
    const totalCount = links.length;
    const validLinksCount = links.filter(link => {
      if (!link.href || link.href === '#' || link.href === 'javascript:void(0)') {
        return false;
      }
      return true;
    }).length;
    
    const internalCount = processedLinks.filter(link => isInternalLink(link)).length;
    const externalCount = processedLinks.filter(link => !isInternalLink(link)).length;
    
    return `${validLinksCount} valid links of ${totalCount} total (${internalCount} internal, ${externalCount} external)`;
  };

  const copyAllLinkUrls = () => {
    const visibleLinks = currentPageLinks.map(link => link.href);
    navigator.clipboard.writeText(visibleLinks.join('\n'));
    toast(`Copied ${visibleLinks.length} link URLs!`);
  };

  const copyAllPageUrls = () => {
    const visiblePageUrls = currentPageLinks.map(link => link.page_url);
    navigator.clipboard.writeText(visiblePageUrls.join('\n'));
    toast(`Copied ${visiblePageUrls.length} page URLs!`);
  };

  return (
    <Card className="mb-6">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>All Links Analysis</CardTitle>
            <CardDescription>Summary of all internal and external links found during the crawl</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            {showAllLinksAnalysis && (
              <select
                value={linkTypeFilter}
                onChange={(e) => handleFilterChange(e.target.value)}
                className="px-3 py-1 text-sm border rounded-md bg-background"
              >
                <option value="all">All Types</option>
                <option value="internal">Internal Only</option>
                <option value="external">External Only</option>
              </select>
            )}
            {/* <Button
              variant="outline"
              size="sm"
              onClick={() => setShowAllLinksAnalysis(prev => !prev)}
            >
              {showAllLinksAnalysis ? 'Close' : 'Open'}
            </Button> */}
          </div>
        </div>
        <div className="mt-2 text-sm text-muted-foreground">
          {getLinkCount()}
        </div>
      </CardHeader>
      {showAllLinksAnalysis && (
        <CardContent>
          <div className="overflow-x-auto">
            <div className="h-[600px] overflow-y-scroll border rounded-lg">
              <table className="min-w-full border text-xs">
                <thead className="bg-white dark:bg-gray-900 sticky top-0 z-10 border-b">
                  <tr>
                    <th className="p-2 border text-center">#</th>
                    <th className="p-2 border text-center">Type</th>
                    <th className="p-2 border">Anchor Text</th>
                    <th className="p-2 border">
                      Href 
                      <button
                        type="button"
                        className="ml-2 inline-flex items-center px-2 py-1 rounded bg-blue-50 hover:bg-blue-100 dark:bg-blue-900 dark:hover:bg-blue-800 text-blue-600 dark:text-blue-300 text-xs font-medium border border-blue-200 dark:border-blue-800 transition"
                        title="Copy all link URLs"
                        onClick={copyAllLinkUrls}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16h8M8 12h8m-7 8h6a2 2 0 002-2V6a2 2 0 00-2-2H8a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        Copy All
                      </button>
                    </th>
                    <th className="p-2 border">Domain</th>
                    <th className="p-2 border">
                      Page URL
                      <button
                        type="button"
                        className="ml-2 inline-flex items-center px-2 py-1 rounded bg-blue-50 hover:bg-blue-100 dark:bg-blue-900 dark:hover:bg-blue-800 text-blue-600 dark:text-blue-300 text-xs font-medium border border-blue-200 dark:border-blue-800 transition"
                        title="Copy all page URLs"
                        onClick={copyAllPageUrls}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16h8M8 12h8m-7 8h6a2 2 0 002-2V6a2 2 0 00-2-2H8a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        Copy All
                      </button>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {currentPageLinks.map((link, idx) => (
                    <tr key={`${startIndex + idx}-${link.href}`} className="border-b hover:bg-muted/20">
                      <td className="p-2 border text-center">{startIndex + idx + 1}</td>
                      <td className="p-2 border text-center">
                        <div className="flex items-center justify-center gap-1">
                          {isInternalLink(link) ? (
                            <>
                              <Link2 className="h-3 w-3 text-green-600" />
                              <span className="text-green-600 font-medium">Internal</span>
                            </>
                          ) : (
                            <>
                              <Globe className="h-3 w-3 text-blue-600" />
                              <span className="text-blue-600 font-medium">External</span>
                            </>
                          )}
                        </div>
                      </td>
                      <td className="p-2 border max-w-xs">
                        {link.text ? (
                          <span className="break-words">{link.text}</span>
                        ) : (
                          <span className="text-muted-foreground">(none)</span>
                        )}
                      </td>
                      <td className="p-2 border max-w-xs truncate">
                        <a href={link.href} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline break-all">{link.href}</a>
                      </td>
                      <td className="p-2 border text-center text-xs font-mono">
                        {getLinkDomain(link.href)}
                      </td>
                      <td className="p-2 border max-w-xs truncate">
                        <a href={link.page_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline break-all">{link.page_url}</a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-4">
                <div className="text-sm text-muted-foreground">
                  Showing {startIndex + 1}-{Math.min(endIndex, processedLinks.length)} of {processedLinks.length} links
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Previous
                  </Button>
                  <span className="text-sm">
                    Page {currentPage} of {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                  >
                    Next
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      )}
    </Card>
  );
} 