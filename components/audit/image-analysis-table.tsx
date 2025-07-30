'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { CheckCircle, XCircle, ExternalLink, CodeSquare, ChevronLeft, ChevronRight, X, Search } from 'lucide-react';
import { toast } from 'react-toastify';

interface ImageAnalysis {
  src: string;
  alt?: string;
  size?: number | null;
  format?: string;
  is_small?: boolean | null;
  page_url: string;
}

interface ImageAnalysisTableProps {
  images: ImageAnalysis[];
}

// Image Preview Modal Component
interface ImagePreviewModalProps {
  image: ImageAnalysis | null;
  isOpen: boolean;
  onClose: () => void;
}

function ImagePreviewModal({ image, isOpen, onClose }: ImagePreviewModalProps) {
  if (!isOpen || !image) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-900 rounded-lg max-w-6xl w-full max-h-[95vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold">Image Preview</h3>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="h-8 w-8 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
        
        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(95vh-120px)]">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Image Preview */}
            <div className="space-y-4">
              <h4 className="font-medium text-sm text-gray-600 dark:text-gray-400">Image Preview</h4>
              <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-gray-50 dark:bg-gray-800">
                <img
                  src={image.src}
                  alt={image.alt || 'Image preview'}
                  className="max-w-full h-auto max-h-[500px] object-contain mx-auto"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                    const errorDiv = document.createElement('div');
                    errorDiv.className = 'text-center text-red-500 p-4';
                    errorDiv.textContent = 'Failed to load image';
                    target.parentNode?.appendChild(errorDiv);
                  }}
                />
              </div>
            </div>
            
            {/* Image Details */}
            <div className="space-y-4">
              <h4 className="font-medium text-sm text-gray-600 dark:text-gray-400">Image Details</h4>
              <div className="space-y-3">
                {/* Alt Text */}
                <div>
                  <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                    Alt Text
                  </label>
                  <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded border text-sm">
                    {image.alt ? (
                      <span className="text-gray-900 dark:text-gray-100">{image.alt}</span>
                    ) : (
                      <span className="text-red-500 italic">Missing alt text</span>
                    )}
                  </div>
                </div>
                
                {/* Image URL */}
                <div>
                  <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                    Image URL
                  </label>
                  <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded border">
                    <a 
                      href={image.src} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-blue-600 dark:text-blue-400 hover:underline break-all text-sm"
                    >
                      {image.src}
                    </a>
                  </div>
                </div>
                
                {/* Page URL */}
                <div>
                  <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                    Page URL
                  </label>
                  <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded border">
                    <a 
                      href={image.page_url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-blue-600 dark:text-blue-400 hover:underline break-all text-sm"
                    >
                      {image.page_url}
                    </a>
                  </div>
                </div>
                
                {/* Image Size */}
                <div>
                  <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                    File Size
                  </label>
                  <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded border text-sm">
                    {image.size ? (
                      <span className="text-gray-900 dark:text-gray-100">
                        {(image.size / 1024).toFixed(1)} KB
                      </span>
                    ) : (
                      <span className="text-gray-500 italic">Unknown</span>
                    )}
                  </div>
                </div>
                
                {/* Image Format */}
                <div>
                  <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                    Format
                  </label>
                  <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded border text-sm">
                    <span className="text-gray-900 dark:text-gray-100 font-mono">
                      {image.format || 'Unknown'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Footer */}
        <div className="flex items-center justify-end gap-2 p-4 border-t border-gray-200 dark:border-gray-700">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
          <Button 
            onClick={() => {
              navigator.clipboard.writeText(image.src);
              toast('Image URL copied to clipboard!');
            }}
          >
            Copy URL
          </Button>
        </div>
      </div>
    </div>
  );
}

const ITEMS_PER_PAGE = 50; // Show only 50 items per page for better performance

export function ImageAnalysisTable({ images }: ImageAnalysisTableProps) {
  const [showAllImageAnalysis, setShowAllImageAnalysis] = useState(true);
  const [imageFilterMode, setImageFilterMode] = useState<'filtered' | 'all' | 'duplicates'>('filtered');
  const [imageFormatFilter, setImageFormatFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedImage, setSelectedImage] = useState<ImageAnalysis | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Helper function for normalized duplicate detection
  const getNormalizedUrl = (url: string) => {
    return url
      .split('?')[0] // Remove query parameters
      .split('#')[0] // Remove hash fragments
      .replace(/\/$/, '') // Remove trailing slash
      .replace(/-\d+x\d+\.(jpg|jpeg|png|webp|gif|svg)$/i, '.$1') // Remove dimension suffixes like -300x203.jpg
      .replace(/-\d+x\d+$/i, '') // Remove dimension suffixes without extension
      .toLowerCase();
  };

  // Helper function to extract base filename from URL
  const getBaseFilename = (url: string) => {
    try {
      // Remove CDN prefixes and get just the filename
      const urlObj = new URL(url);
      const pathname = urlObj.pathname;
      
      // Extract filename from path
      const filename = pathname.split('/').pop() || '';
      
      // Remove common CDN prefixes and get the original filename
      // Handle cases like: cdn-ildalmd.nitrocdn.com/.../tmtboilers.co.uk/wp-content/uploads/filename.jpg
      if (filename.includes('wp-content/uploads/')) {
        const uploadsIndex = pathname.indexOf('wp-content/uploads/');
        if (uploadsIndex !== -1) {
          return pathname.substring(uploadsIndex + 'wp-content/uploads/'.length);
        }
      }
      
      return filename;
    } catch {
      // Fallback to simple filename extraction
      return url.split('/').pop() || '';
    }
  };

  // Helper function to create a content-based fingerprint for duplicate detection
  const getImageFingerprint = (img: ImageAnalysis) => {
    const size = img.size || 0;
    const format = detectImageFormat(img);
    const baseFilename = getBaseFilename(img.src);
    
    // Create a fingerprint based on size, format, and base filename
    // This helps identify images that are the same but have different CDN paths
    return `${size}-${format}-${baseFilename}`;
  };

  // Helper function to create a more sophisticated fingerprint for CDN variations
  const getAdvancedFingerprint = (img: ImageAnalysis) => {
    const size = img.size || 0;
    const format = detectImageFormat(img);
    const baseFilename = getBaseFilename(img.src);
    
    // For images with same size and format, create a similarity score
    // based on filename similarity
    return {
      size,
      format,
      baseFilename,
      similarityKey: `${size}-${format}-${baseFilename.split('-')[0]}` // Use first part of filename
    };
  };

  // Helper function for format detection
  const detectImageFormat = (img: ImageAnalysis) => {
    const format = (img.format || '').toLowerCase();
    const src = img.src || '';
    
    // Simple format detection rules
    if (src.startsWith('data:') || 
        format.startsWith('data') || 
        format.length > 5) {
      return 'svg';
    }
    
    return format;
  };

  // Memoized processed images for better performance
  const processedImages = useMemo(() => {
    let filteredImages = images;
    
    // Apply data URL filtering based on mode
    if (imageFilterMode === 'filtered') {
      const seen = new Set();
      const seenNormalized = new Set();
      const seenFingerprints = new Set();
      const seenSimilarityKeys = new Set();
      
      filteredImages = images.filter(img => {
        // Skip data URLs and empty placeholders
        if (img.src.startsWith('data:') || 
            img.src.includes('nitro-empty-id') ||
            img.src.includes('empty') ||
            img.src.includes('placeholder')) {
          return false;
        }
        
        // Create normalized URL for better duplicate detection
        const normalizedUrl = getNormalizedUrl(img.src);
        const fingerprint = getImageFingerprint(img);
        const advancedFingerprint = getAdvancedFingerprint(img);
        
        // Skip duplicates based on normalized URL, content fingerprint, or similarity key
        if (seen.has(img.src) || 
            seenNormalized.has(normalizedUrl) || 
            seenFingerprints.has(fingerprint) ||
            seenSimilarityKeys.has(advancedFingerprint.similarityKey)) {
          return false;
        }
        
        seen.add(img.src);
        seenNormalized.add(normalizedUrl);
        seenFingerprints.add(fingerprint);
        seenSimilarityKeys.add(advancedFingerprint.similarityKey);
        return true;
      });
    } else {
      // Show all images (including data URLs and duplicates)
      filteredImages = images;
    }
    
    // Apply format filter
    if (imageFormatFilter !== 'all') {
      filteredImages = filteredImages.filter(img => {
        const detectedFormat = detectImageFormat(img);
        return detectedFormat === imageFormatFilter.toLowerCase();
      });
    }

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filteredImages = filteredImages.filter(img => {
        return (
          img.src.toLowerCase().includes(query) ||
          (img.alt && img.alt.toLowerCase().includes(query)) ||
          img.page_url.toLowerCase().includes(query)
        );
      });
      
      // Sort search results with priority for exact page URL matches
      return filteredImages.sort((a, b) => {
        const aPageUrl = a.page_url.toLowerCase();
        const bPageUrl = b.page_url.toLowerCase();
        const aSrc = a.src.toLowerCase();
        const bSrc = b.src.toLowerCase();
        const aAlt = (a.alt || '').toLowerCase();
        const bAlt = (b.alt || '').toLowerCase();
        
        // Priority 1: Exact page URL matches (highest priority)
        const aExactPageMatch = aPageUrl === query;
        const bExactPageMatch = bPageUrl === query;
        if (aExactPageMatch && !bExactPageMatch) return -1;
        if (!aExactPageMatch && bExactPageMatch) return 1;
        
        // Priority 2: Page URL starts with query
        const aPageStartsWith = aPageUrl.startsWith(query);
        const bPageStartsWith = bPageUrl.startsWith(query);
        if (aPageStartsWith && !bPageStartsWith) return -1;
        if (!aPageStartsWith && bPageStartsWith) return 1;
        
        // Priority 3: Page URL contains query
        const aPageContains = aPageUrl.includes(query);
        const bPageContains = bPageUrl.includes(query);
        if (aPageContains && !bPageContains) return -1;
        if (!aPageContains && bPageContains) return 1;
        
        // Priority 4: Exact image URL matches
        const aExactSrcMatch = aSrc === query;
        const bExactSrcMatch = bSrc === query;
        if (aExactSrcMatch && !bExactSrcMatch) return -1;
        if (!aExactSrcMatch && bExactSrcMatch) return 1;
        
        // Priority 5: Image URL starts with query
        const aSrcStartsWith = aSrc.startsWith(query);
        const bSrcStartsWith = bSrc.startsWith(query);
        if (aSrcStartsWith && !bSrcStartsWith) return -1;
        if (!aSrcStartsWith && bSrcStartsWith) return 1;
        
        // Priority 6: Alt text contains query
        const aAltContains = aAlt.includes(query);
        const bAltContains = bAlt.includes(query);
        if (aAltContains && !bAltContains) return -1;
        if (!aAltContains && bAltContains) return 1;
        
        // Priority 7: Default format-based sorting
        const formatOrder = { 'jpg': 1, 'jpeg': 1, 'webp': 2, 'png': 3, 'svg': 4 };
        const aFormat = detectImageFormat(a);
        const bFormat = detectImageFormat(b);
        const aOrder = formatOrder[aFormat as keyof typeof formatOrder] || 5;
        const bOrder = formatOrder[bFormat as keyof typeof formatOrder] || 5;
        return aOrder - bOrder;
      });
    }
    
    // Sort by format: JPG, WebP, PNG, SVG, then others (when no search query)
    const formatOrder = { 'jpg': 1, 'jpeg': 1, 'webp': 2, 'png': 3, 'svg': 4 };
    return filteredImages.sort((a, b) => {
      const aFormat = detectImageFormat(a);
      const bFormat = detectImageFormat(b);
      const aOrder = formatOrder[aFormat as keyof typeof formatOrder] || 5;
      const bOrder = formatOrder[bFormat as keyof typeof formatOrder] || 5;
      return aOrder - bOrder;
    });
  }, [images, imageFilterMode, imageFormatFilter, searchQuery]);

  // Pagination logic
  const totalPages = Math.ceil(processedImages.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const currentPageImages = processedImages.slice(startIndex, endIndex);

  // Reset to first page when filter changes
  const handleFilterChange = (newFilter: string) => {
    setImageFormatFilter(newFilter);
    setCurrentPage(1);
  };

  const handleFilterModeChange = (newMode: 'filtered' | 'all') => {
    setImageFilterMode(newMode);
    setCurrentPage(1);
  };

  const handleSearchChange = (query: string) => {
    setSearchQuery(query);
    setCurrentPage(1);
  };

  // Get image count
  const getImageCount = () => {
    if (imageFilterMode === 'all') {
      // Count all images (including duplicates and data URLs)
      const totalCount = images.length;
      const validImagesCount = images.filter(img => {
        if (img.src.startsWith('data:') || 
            img.src.includes('nitro-empty-id') ||
            img.src.includes('empty') ||
            img.src.includes('placeholder')) {
          return false;
        }
        return true;
      }).length;
      return `${validImagesCount} valid images of ${totalCount} total (excluding data URLs)`;
    } else {
      // Count unique filtered images
      const seen = new Set();
      const seenNormalized = new Set();
      const seenFingerprints = new Set();
      const seenSimilarityKeys = new Set();
      const uniqueCount = images.filter(img => {
        // Skip data URLs and empty placeholders
        if (img.src.startsWith('data:') || 
            img.src.includes('nitro-empty-id') ||
            img.src.includes('empty') ||
            img.src.includes('placeholder')) {
          return false;
        }
        
        // Create normalized URL for better duplicate detection
        const normalizedUrl = getNormalizedUrl(img.src);
        const fingerprint = getImageFingerprint(img);
        const advancedFingerprint = getAdvancedFingerprint(img);
        
        // Skip duplicates based on normalized URL, content fingerprint, or similarity key
        if (seen.has(img.src) || 
            seenNormalized.has(normalizedUrl) || 
            seenFingerprints.has(fingerprint) ||
            seenSimilarityKeys.has(advancedFingerprint.similarityKey)) {
          return false;
        }
        
        seen.add(img.src);
        seenNormalized.add(normalizedUrl);
        seenFingerprints.add(fingerprint);
        seenSimilarityKeys.add(advancedFingerprint.similarityKey);
        return true;
      }).length;
      return `${uniqueCount} unique images (no duplicates)`;
    }
  };

  const copyAllImageUrls = () => {
    const visibleImages = currentPageImages.map(img => img.src);
    navigator.clipboard.writeText(visibleImages.join('\n'));
    toast(`Copied ${visibleImages.length} image URLs!`);
  };

  const copyAllPageUrls = () => {
    const visiblePageUrls = currentPageImages.map(img => img.page_url);
    navigator.clipboard.writeText(visiblePageUrls.join('\n'));
    toast(`Copied ${visiblePageUrls.length} page URLs!`);
  };

  return (
    <Card className="mb-6">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>All Image Analysis</CardTitle>
            <CardDescription>Summary of all images found during the crawl</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            {showAllImageAnalysis && (
              <>
                <div className="flex items-center gap-2">
                  <Button
                    variant={imageFilterMode === 'filtered' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => handleFilterModeChange('filtered')}
                  >
                    Filtered
                  </Button>
                  <Button
                    variant={imageFilterMode === 'all' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => handleFilterModeChange('all')}
                  >
                    Show All
                  </Button>
                </div>
                <select
                  value={imageFormatFilter}
                  onChange={(e) => handleFilterChange(e.target.value)}
                  className="px-3 py-1 text-sm border rounded-md bg-background"
                >
                  <option value="all">All Formats</option>
                  <option value="jpg">JPG</option>
                  <option value="jpeg">JPEG</option>
                  <option value="png">PNG</option>
                  <option value="webp">WebP</option>
                  <option value="svg">SVG</option>
                  <option value="gif">GIF</option>
                  <option value="ico">ICO</option>
                </select>
              </>
            )}
            {/* <Button
              variant="outline"
              size="sm"
              onClick={() => setShowAllImageAnalysis(prev => !prev)}
            >
             {showAllImageAnalysis ? 'Close' : 'Open'} 
            </Button> */}
          </div>
        </div>
        <div className="mt-2 text-sm text-muted-foreground">
          {getImageCount()}
        </div>
      </CardHeader>
      {showAllImageAnalysis && (
        <CardContent>
          {/* Search Input */}
          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                type="text"
                placeholder="Search by image URL, alt text, or page URL..."
                value={searchQuery}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="pl-10"
              />
              {searchQuery && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleSearchChange('')}
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
            {searchQuery && (
              <div className="mt-2 text-sm text-muted-foreground">
                Found {processedImages.length} images matching "{searchQuery}"
                {processedImages.length > 0 && (
                  <span className="ml-2 text-xs">
                    (searches image URLs, alt text, and page URLs)
                  </span>
                )}
              </div>
            )}
          </div>
          
          <div className="overflow-x-auto">
            <div className="h-[600px] overflow-y-scroll border rounded-lg">
              <table className="min-w-full border text-xs">
                <thead className="bg-white dark:bg-gray-900 sticky top-0 z-10 border-b">
                  <tr>
                    <th className="p-2 border text-center">#</th>
                    <th className="p-2 border">Preview</th>
                    <th className="p-2 border">Alt</th>
                                         <th className="p-2 border">
                       <div className="flex items-center justify-center">
                         <span>Source</span>
                         <button
                           type="button"
                           className="ml-2 inline-flex items-center justify-center px-2 py-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-300 text-xs font-medium transition"
                           title="Copy all image URLs"
                           onClick={copyAllImageUrls}
                         >
                           <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16h8M8 12h8m-7 8h6a2 2 0 002-2V6a2 2 0 00-2-2H8a2 2 0 00-2 2v12a2 2 0 002 2z" />
                           </svg>
                         </button>
                       </div>
                     </th>
                  
                                         <th className="p-2 border">
                       <div className="flex items-center justify-center">
                         <span>Page URL</span>
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
                    <th className="p-2 border">Size (KB)</th>
                    <th className="p-2 border text-center w-[10%]">Format</th>
                  </tr>
                </thead>
                <tbody>
                  {currentPageImages.map((img, idx) => (
                    <tr key={`${startIndex + idx}-${img.src}`} className="border-b hover:bg-muted/20">
                      <td className="p-2 border text-center">{startIndex + idx + 1}</td>
                      <td className="p-2 border text-center">
                        <div
                          className="inline-block cursor-pointer hover:opacity-80 transition-opacity"
                          onClick={() => {
                            setSelectedImage(img);
                            setIsModalOpen(true);
                          }}
                          title="Click to preview image"
                        >
                          <img
                            src={img.src}
                            alt={img.alt || 'image'}
                            style={{ maxWidth: 48, maxHeight: 48, objectFit: 'contain', borderRadius: 4 }}
                            loading="lazy"
                            className="border border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600"
                          />
                        </div>
                      </td>
                      <td className="p-2 border">{img.alt || <span className="text-muted-foreground">(none)</span>}</td>
                      <td className="p-2 border max-w-xs truncate">
                        <a href={img.src} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline break-all">{img.src}</a>
                      </td>
                    
                      <td className="p-2 border max-w-xs truncate">
                        <a href={img.page_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline break-all">{img.page_url}</a>
                      </td>
                      <td className="p-2 border text-center">{img.size ? (img.size / 1024).toFixed(1) : '—'}</td>
                      <td className="p-2 border text-center text-xs font-mono w-[10%]">{detectImageFormat(img) || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-4">
                <div className="text-sm text-muted-foreground">
                  Showing {startIndex + 1}-{Math.min(endIndex, processedImages.length)} of {processedImages.length} images
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
      <ImagePreviewModal
        image={selectedImage}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </Card>
  );
} 