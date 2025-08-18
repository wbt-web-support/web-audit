"use client"
import React from 'react'
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '@/app/stores/store';
import { setSelectedServices } from '@/app/stores/dashboardFormSlice';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { toast } from 'react-toastify';

const SERVICES = [
    { label: "Brand Consistency", value: "contact_details_consistency" },
    { label: "Hidden Urls", value: "check_custom_urls" },
    { label: "Stripe Keys Check", value: "check_stripe_keys" },
    // { label: "Add Custom Instructions", value: "custom_instructions" },
];

/**
 * Simple list of checkboxes for selecting additional audit services.
 * Fully supports dark/light mode and uses shared UI primitives.
 * Styled to match ProjectForm fields.
 */
export default function ServicesDropdown() {
  const dispatch = useDispatch();
  const selected = useSelector((state: RootState) => state.dashboardForm.selectedServices);
  const crawlType = useSelector((state: RootState) => state.dashboardForm.crawlType);

  const handleCheckbox = (value: string, checked: boolean) => {
    if (!checked) {
      // Deselecting, always allowed
      const newSelected = selected.filter((v) => v !== value);
      dispatch(setSelectedServices(newSelected));
      return;
    }
    // If user tries to select 'check_custom_urls' and crawlType is not 'full', show toast and block
    if (value === 'check_custom_urls' && crawlType !== 'full') {
      toast.info("Custom URLs can only be added when 'Full Website' crawl type is selected.");
      return;
    }
    // Otherwise, allow selection
    const newSelected = [...selected, value];
    dispatch(setSelectedServices(newSelected));
  };

  return (
    <div className="space-y-3">
      <Label className="text-sm font-medium">Other Services</Label>
      <div className="space-y-2">
        {SERVICES.map((service) => (
          <div key={service.value} className="flex items-center space-x-2">
            <Checkbox
              id={service.value}
              checked={selected.includes(service.value)}
              onCheckedChange={(checked) => handleCheckbox(service.value, checked as boolean)}
            />
            <Label
              htmlFor={service.value}
              className="text-sm font-normal cursor-pointer"
            >
              {service.label}
            </Label>
          </div>
        ))}
      </div>
    </div>
  );
}