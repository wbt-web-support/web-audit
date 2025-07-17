"use client"
import React, { useRef, useEffect } from 'react'
import { ArrowUp, ArrowDown } from "lucide-react";
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '@/app/stores/store';
import { setSelectedServices } from '@/app/stores/dashboardFormSlice';

const SERVICES = [
    { label: "Check Contact details Consistency", value: "contact_details_consistency" },
    { label: "Add custom instructions", value: "custom_instructions" },
  ];
  

export default  function ServicesDropdown() {
    const [open, setOpen] = React.useState(false);
    const dispatch = useDispatch();
    const selected = useSelector((state: RootState) => state.dashboardForm.selectedServices);
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
      if (!open) return;
      const handleClickOutside = (event: MouseEvent) => {
        if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
          setOpen(false);
        }
      };
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }, [open]);

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
      <div className="relative  w-full" ref={dropdownRef}>
        <button
          type="button"
          className="border rounded-xl px-4 py-2 w-full text-left bg-white flex items-center justify-between relative"
          onClick={() => setOpen((o) => !o)}
        >
          <span>
          Other Services {selected.length > 0 ? `(${selected.length})` : ""}
          </span>
          <span className="ml-2 absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
            {open ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />}
          </span>
        </button>
        {open && (
          <div className="absolute z-10 mt-2 w-full bg-white border rounded-xl shadow-lg p-2">
            {SERVICES.map((service) => (
              <label key={service.value} className="flex items-center gap-2 py-1 px-2 hover:bg-gray-100 rounded cursor-pointer">
                <input
                  type="checkbox"
                  checked={selected.includes(service.value)}
                  onChange={() => handleCheckbox(service.value)}
                />
                {service.label}
              </label>
            ))}
          </div>
        )}
      </div>
    );
  }