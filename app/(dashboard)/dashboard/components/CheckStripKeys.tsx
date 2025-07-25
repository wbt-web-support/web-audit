"use client"
import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '@/app/stores/store';
import { setStripeKeyUrls } from '@/app/stores/dashboardFormSlice';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Plus, Trash2, Link2 } from 'lucide-react';

export default function CheckStripKeys() {
  const dispatch = useDispatch();
  const defaultStripeUrls = [
    '/wp-content/themes/kadence-child/client.js',
  ];
  const stripeKeyUrls = useSelector((state: RootState) => state.dashboardForm.stripeKeyUrls);
  const [newStripeUrl, setNewStripeUrl] = useState('');

  // Sync Redux state to local state if needed (optional)

  // Update Redux store when local changes
  const handleAddStripeUrl = () => {
    if (newStripeUrl.trim() && !stripeKeyUrls.includes(newStripeUrl.trim())) {
      dispatch(setStripeKeyUrls([...stripeKeyUrls, newStripeUrl.trim()]));
      setNewStripeUrl('');
    }
  };

  const handleDeleteStripeUrl = (url: string) => {
    dispatch(setStripeKeyUrls(stripeKeyUrls.filter(u => u !== url)));
  };

  const handleAddSuggested = (url: string) => {
    if (!stripeKeyUrls.includes(url)) {
      dispatch(setStripeKeyUrls([...stripeKeyUrls, url]));
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button type="button" variant="outline" className="w-full flex items-center justify-between text-left">
          <span>Check/Manage Stripe Key URLs</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-80">
        <DropdownMenuLabel className="mb-1 flex items-center gap-2"><Link2 className="h-4 w-4" />Stripe Key URL List</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {/* Suggested URLs Section */}
        <DropdownMenuLabel className="mb-1">Suggested URLs</DropdownMenuLabel>
        <div className="max-h-32 overflow-y-auto px-2 py-1">
          {defaultStripeUrls.filter(url => !stripeKeyUrls.includes(url)).length === 0 && (
            <div className="text-sm text-muted-foreground">All suggested URLs added.</div>
          )}
          {defaultStripeUrls.filter(url => !stripeKeyUrls.includes(url)).map((url) => (
            <div key={url} className="flex items-center gap-2 mb-1">
              <span className="truncate flex-1 max-w-xs text-sm">{url}</span>
              <Button
                type="button"
                size="icon"
                variant="outline"
                onClick={() => handleAddSuggested(url)}
                aria-label="Add suggested URL"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuLabel className="mb-1">Add / Delete Stripe Key URLs</DropdownMenuLabel>
        <div className="flex items-center gap-2 px-2 py-1">
          <input
            type="url"
            value={newStripeUrl}
            onChange={(e) => setNewStripeUrl(e.target.value)}
            placeholder="https://example.com/stripe-key"
            className="flex-1 rounded-md border border-input bg-transparent px-3 py-2 text-base shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring md:text-sm"
          />
          <Button
            type="button"
            size="icon"
            variant="outline"
            onClick={handleAddStripeUrl}
            aria-label="Add Stripe Key URL"
            disabled={!newStripeUrl.trim() || stripeKeyUrls.includes(newStripeUrl.trim())}
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
        <div className="max-h-32 overflow-y-auto px-2 py-1">
          {stripeKeyUrls.map((url) => (
            <div key={url} className="flex items-center gap-2 mb-1">
              <span className="truncate flex-1 max-w-xs text-sm">{url}</span>
              <Button
                type="button"
                size="icon"
                variant="destructive"
                onClick={() => handleDeleteStripeUrl(url)}
                aria-label="Delete Stripe Key URL"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
