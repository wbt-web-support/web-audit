import React, { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '@/app/stores/store';
import { setUrls } from '@/app/stores/dashboardFormSlice';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Link2, Plus, Trash2 } from 'lucide-react';
import { toast } from 'react-toastify';

interface CustomUrlsProps {
  crawlType: 'full' | 'single';
}

export default function CustomUrls({ crawlType }: CustomUrlsProps) {
  const urls = useSelector((state: RootState) => state.dashboardForm.urls);
  const dispatch = useDispatch();

  // Initialize with one empty URL if the array is empty
  useEffect(() => {
    if (urls.length === 0) {
      dispatch(setUrls(['']));
    }
  }, [urls.length, dispatch]);

  const handleUrlChange = (idx: number, value: string) => {
    const updated = urls.map((url, i) => (i === idx ? value : url));
    dispatch(setUrls(updated));
  };

  const handleAddUrl = () => {
    if (crawlType !== 'full') {
      toast.info("Custom URLs can only be added when 'Full Website' crawl type is selected.");
      return;
    }
    dispatch(setUrls([...urls, '']));
  };

  const handleRemoveUrl = (idx: number) => {
    const updated = urls.filter((_, i) => i !== idx);
    dispatch(setUrls(updated.length > 0 ? updated : ['']));
  };

  return (
    <div>
      <Label className="flex items-center gap-2 mb-1">
        <Link2 className="h-4 w-4" />
        Custom URLs
      </Label>
      <p className="text-sm text-muted-foreground mb-2">
        Enter one or more URLs to audit. Each URL will be checked individually.
      </p>
      {crawlType === 'full' ? (
        <div className="space-y-3">
          {urls.map((url, idx) => (
            <div key={idx} className="flex items-center gap-2">
              <input
                type="url"
                value={url}
                onChange={(e) => handleUrlChange(idx, e.target.value)}
                placeholder={`https://example.com/page${idx + 1}`}
                className="flex-1 rounded-md border border-input bg-transparent px-3 py-2 text-base shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 md:text-sm"
                disabled={false}
              />
              <Button
                type="button"
                size="icon"
                variant="outline"
                onClick={handleAddUrl}
                aria-label="Add URL"
                disabled={false}
              >
                <Plus className="h-4 w-4" />
              </Button>
              {urls.length > 1 && (
                <Button
                  type="button"
                  size="icon"
                  variant="destructive"
                  onClick={() => handleRemoveUrl(idx)}
                  aria-label="Remove URL"
                  disabled={false}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}
