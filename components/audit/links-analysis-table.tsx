'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { CheckCircle, XCircle, ExternalLink, CodeSquare, Link2, Globe, ChevronLeft, ChevronRight, Search, X, Filter } from 'lucide-react';
import { toast } from 'react-toastify';

interface LinkAnalysis {
  href: string;
  type: string;
  text?: string;
  page_url: string;
}

interface UniqueSourceData {
  href: string;
  type: string;
  text?: string;
  pageCount: number;
  pages: string[];
  isInternal: boolean;
  domain: string;
}

interface LinksAnalysisTableProps {
  links: LinkAnalysis[];
}

const ITEMS_PER_PAGE = 50; // Show only 50 items per page for better performance

export function LinksAnalysisTable({ links }: LinksAnalysisTableProps) {
  const [showAllLinksAnalysis, setShowAllLinksAnalysis] = useState(true);
  const [linkTypeFilter, setLinkTypeFilter] = useState<string>('unique');
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');

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

  // Helper function to filter links based on search term
  const filterLinksBySearch = (links: LinkAnalysis[], searchTerm: string) => {
    if (!searchTerm.trim()) return links;
    
    const searchLower = searchTerm.toLowerCase();
    return links.filter(link => {
      // Search in href (link URL)
      if (link.href.toLowerCase().includes(searchLower)) return true;
      
      // Search in anchor text
      if (link.text && link.text.toLowerCase().includes(searchLower)) return true;
      
      // Search in page URL
      if (link.page_url.toLowerCase().includes(searchLower)) return true;
      
      return false;
    });
  };

  // Helper function to get unique sources with page counts
  const getUniqueSources = (links: LinkAnalysis[]): UniqueSourceData[] => {
    const sourceMap = new Map<string, UniqueSourceData>();
    
    links.forEach(link => {
      const normalizedUrl = getNormalizedUrl(link.href);
      const isInternal = isInternalLink(link);
      const domain = getLinkDomain(link.href);
      
      if (sourceMap.has(normalizedUrl)) {
        const existing = sourceMap.get(normalizedUrl)!;
        if (!existing.pages.includes(link.page_url)) {
          existing.pages.push(link.page_url);
          existing.pageCount++;
        }
      } else {
        sourceMap.set(normalizedUrl, {
          href: link.href,
          type: link.type,
          text: link.text,
          pageCount: 1,
          pages: [link.page_url],
          isInternal,
          domain
        });
      }
    });
    
    return Array.from(sourceMap.values()).sort((a, b) => {
      // Sort by page count (descending), then by internal/external
      if (a.pageCount !== b.pageCount) {
        return b.pageCount - a.pageCount;
      }
      if (a.isInternal && !b.isInternal) return -1;
      if (!a.isInternal && b.isInternal) return 1;
      return 0;
    });
  };

  // Memoized processed links for better performance
  const processedLinks = useMemo(() => {
    let filteredLinks = links;
    
    // Apply type filter
    if (linkTypeFilter !== 'all' && linkTypeFilter !== 'unique') {
      filteredLinks = filteredLinks.filter(link => {
        if (linkTypeFilter === 'internal') {
          return isInternalLink(link);
        } else if (linkTypeFilter === 'external') {
          return !isInternalLink(link);
        }
        return true;
      });
    }
    
    // Apply search filter
    filteredLinks = filterLinksBySearch(filteredLinks, searchTerm);
    
    // If unique filter is active, return unique sources
    if (linkTypeFilter === 'unique') {
      return getUniqueSources(filteredLinks);
    }
    
    // Sort by type: internal first, then external
    return filteredLinks.sort((a, b) => {
      const aIsInternal = isInternalLink(a);
      const bIsInternal = isInternalLink(b);
      if (aIsInternal && !bIsInternal) return -1;
      if (!aIsInternal && bIsInternal) return 1;
      return 0;
    });
  }, [links, linkTypeFilter, searchTerm]);

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

  // Handle search term change
  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    setCurrentPage(1); // Reset to first page when searching
  };

  // Clear search
  const clearSearch = () => {
    setSearchTerm('');
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
    
    if (linkTypeFilter === 'unique') {
      const uniqueSources = getUniqueSources(links);
      const searchInfo = searchTerm ? ` (filtered by "${searchTerm}")` : '';
      return `${uniqueSources.length} unique sources${searchInfo}`;
    }
    
    // For regular links, filter the original links array
    const filteredOriginalLinks = links.filter(link => {
      if (linkTypeFilter === 'internal') {
        return isInternalLink(link);
      } else if (linkTypeFilter === 'external') {
        return !isInternalLink(link);
      }
      return true;
    });
    
    const internalCount = filteredOriginalLinks.filter(link => isInternalLink(link)).length;
    const externalCount = filteredOriginalLinks.filter(link => !isInternalLink(link)).length;
    
    const searchInfo = searchTerm ? ` (filtered by "${searchTerm}")` : '';
    return `${validLinksCount} valid links of ${totalCount} total (${internalCount} internal, ${externalCount} external)${searchInfo}`;
  };

  const copyAllLinkUrls = () => {
    const visibleLinks = currentPageLinks.map(link => 
      'href' in link ? link.href : (link as any).href
    );
    navigator.clipboard.writeText(visibleLinks.join('\n'));
    toast(`Copied ${visibleLinks.length} link URLs!`);
  };

  const copyAllPageUrls = () => {
    const visiblePageUrls = currentPageLinks.map(link => 
      'page_url' in link ? link.page_url : (link as any).pages.join('\n')
    );
    navigator.clipboard.writeText(visiblePageUrls.join('\n'));
    toast(`Copied ${visiblePageUrls.length} page URLs!`);
  };

  // Type guard to check if link is UniqueSourceData
  const isUniqueSourceData = (link: any): link is UniqueSourceData => {
    return 'pageCount' in link && 'pages' in link && 'isInternal' in link;
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
                <option value="unique">Unique Sources</option>
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
          {/* Search Bar */}
          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search by link URL, anchor text, or page URL..."
                value={searchTerm}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="pl-10 pr-10"
              />
              {searchTerm && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearSearch}
                  className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <div className="h-[600px] overflow-y-scroll border rounded-lg">
              <table className="min-w-full border text-xs">
                <thead className="bg-white dark:bg-gray-900 sticky top-0 z-10 border-b">
                  <tr>
                    <th className="p-2 border text-center">#</th>
                    <th className="p-2 border text-center">Type</th>
                    <th className="p-2 border">Anchor Text</th>
                    <th className="p-2 border">
                      <div className="flex items-center justify-center">
                        <span>Source</span>
                        <button
                          type="button"
                          className="ml-2 inline-flex items-center justify-center px-2 py-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-300 text-xs font-medium transition"
                          title="Copy all link URLs"
                          onClick={copyAllLinkUrls}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16h8M8 12h8m-7 8h6a2 2 0 002-2V6a2 2 0 00-2-2H8a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        </button>
                      </div>
                    </th>
                    <th className="p-2 border">Domain</th>
                    <th className="p-2 border">
                      <div className="flex items-center justify-center">
                        <span>{linkTypeFilter === 'unique' ? 'Pages Count' : 'Page URL'}</span>
                        <button
                          type="button"
                          className="ml-2 inline-flex items-center justify-center px-2 py-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-300 text-xs font-medium transition"
                          title="Copy all page URLs"
                          onClick={copyAllPageUrls}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16h8M8 12h8m-7 8h6a2 2 0 002-2V6a2 2 0 00-2-2H8a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        </button>
                      </div>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {currentPageLinks.map((link, idx) => {
                    const isUniqueMode = linkTypeFilter === 'unique';
                    
                    if (isUniqueMode && isUniqueSourceData(link)) {
                      // Handle unique source data
                      return (
                        <tr key={`${startIndex + idx}-${link.href}`} className="border-b hover:bg-muted/20">
                          <td className="p-2 border text-center">{startIndex + idx + 1}</td>
                          <td className="p-2 border text-center">
                            <div className="flex items-center justify-center gap-1">
                              {link.isInternal ? (
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
                            {link.domain}
                          </td>
                          <td className="p-2 border max-w-xs truncate">
                            <div className="text-center">
                              <span className="font-semibold text-blue-600">{link.pageCount}</span>
                              <span className="text-muted-foreground text-xs ml-1">pages</span>
                            </div>
                          </td>
                        </tr>
                      );
                    } else {
                      // Handle regular link data
                      const linkData = link as LinkAnalysis;
                      return (
                        <tr key={`${startIndex + idx}-${linkData.href}`} className="border-b hover:bg-muted/20">
                          <td className="p-2 border text-center">{startIndex + idx + 1}</td>
                          <td className="p-2 border text-center">
                            <div className="flex items-center justify-center gap-1">
                              {isInternalLink(linkData) ? (
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
                            {linkData.text ? (
                              <span className="break-words">{linkData.text}</span>
                            ) : (
                              <span className="text-muted-foreground">(none)</span>
                            )}
                          </td>
                          <td className="p-2 border max-w-xs truncate">
                            <a href={linkData.href} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline break-all">{linkData.href}</a>
                          </td>
                          <td className="p-2 border text-center text-xs font-mono">
                            {getLinkDomain(linkData.href)}
                          </td>
                          <td className="p-2 border max-w-xs truncate">
                            <a href={linkData.page_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline break-all">{linkData.page_url}</a>
                          </td>
                        </tr>
                      );
                    }
                  })}
                </tbody>
              </table>
            </div>
            
            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-4">
                <div className="text-sm text-muted-foreground">
                  Showing {startIndex + 1}-{Math.min(endIndex, processedLinks.length)} of {processedLinks.length} {linkTypeFilter === 'unique' ? 'unique sources' : 'links'}
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