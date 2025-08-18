import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, XCircle, CodeSquare, ExternalLink } from 'lucide-react';
import { toast } from 'react-toastify';

interface CustomUrl {
  pageLink: string;
  isPresent: boolean;
}

interface CustomUrlsCardProps {
  customUrls: CustomUrl[];
}

export function CustomUrlsCard({ customUrls }: CustomUrlsCardProps) {
  const foundCount = customUrls.filter(u => u.isPresent).length;

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle>Custom URLs</CardTitle>
        <CardDescription>Tracked URLs and their presence in the crawl</CardDescription>
        <div className="mt-2 text-sm text-muted-foreground">
          {foundCount} / {customUrls.length} URLs found
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          {customUrls.map((item, idx) => (
            <div
              key={idx}
              className="relative rounded-xl border bg-gradient-to-br from-white to-gray-50 dark:from-gray-900 dark:to-gray-800 shadow-sm p-3 sm:p-4 flex flex-col gap-2 hover:shadow-lg transition-shadow group"
            >
              <div className="flex items-center gap-2 mb-1">
                {item.isPresent ? (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-200">
                    <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 mr-1 text-emerald-500" />
                    <span className="hidden sm:inline">Present</span>
                    <span className="sm:hidden">✓</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-200">
                    <XCircle className="h-3 w-3 sm:h-4 sm:w-4 mr-1 text-red-500" />
                    <span className="hidden sm:inline">Missing</span>
                    <span className="sm:hidden">✗</span>
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs sm:text-sm font-mono text-blue-700 dark:text-blue-300 break-all" title={item.pageLink}>
                  {item.pageLink}
                </span>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <button
                    className="p-1 rounded hover:bg-blue-100 dark:hover:bg-blue-900 transition"
                    title="Copy URL"
                    onClick={() => {
                      navigator.clipboard.writeText(item.pageLink);
                      toast('Copied URL!');
                    }}
                  >
                    <CodeSquare className="h-3 w-3 sm:h-4 sm:w-4 text-blue-400 group-hover:text-blue-600" />
                  </button>
                  <a 
                    href={item.pageLink} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800 transition" 
                    title="Open URL"
                  >
                    <ExternalLink className="h-3 w-3 sm:h-4 sm:w-4 text-gray-400 group-hover:text-blue-500" />
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
