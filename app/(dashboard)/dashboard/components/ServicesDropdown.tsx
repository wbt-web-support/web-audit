"use client"
import React, { useRef, useEffect } from 'react'
import { ArrowUp, ArrowDown } from "lucide-react";
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '@/app/stores/store';
import { setSelectedServices } from '@/app/stores/dashboardFormSlice';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
} from '@/components/ui/dropdown-menu';
import { Label } from '@/components/ui/label';
import { Settings } from 'lucide-react';

const SERVICES = [
    { label: "Check Contact details Consistency", value: "contact_details_consistency" },
    { label: "Add custom instructions", value: "custom_instructions" },
  ];
  

/**
 * Dropdown for selecting additional audit services.
 * Fully supports dark/light mode and uses shared UI primitives.
 * Styled to match ProjectForm fields.
 */
export default function ServicesDropdown() {
  const dispatch = useDispatch();
  const selected = useSelector((state: RootState) => state.dashboardForm.selectedServices);

  const handleCheckbox = (value: string) => {
    let newSelected;
    if (selected.includes(value)) {
      newSelected = selected.filter((v) => v !== value);
    } else {
      newSelected = [...selected, value];
    }
    dispatch(setSelectedServices(newSelected));
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="outline"
          className="w-full flex items-center justify-between text-left"
        >
          <span>
            Other Services {selected.length > 0 ? `(${selected.length})` : ""}
          </span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-full">
        {SERVICES.map((service) => (
          <DropdownMenuCheckboxItem
            key={service.value}
            checked={selected.includes(service.value)}
            onCheckedChange={() => handleCheckbox(service.value)}
            className="flex items-center gap-2 cursor-pointer data-[state=checked]:text-blue-600 dark:data-[state=checked]:text-blue-400"
          >
            {service.label}
          </DropdownMenuCheckboxItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}