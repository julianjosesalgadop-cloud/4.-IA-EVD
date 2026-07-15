"use client";

import React, { useState, useEffect, useRef } from "react";
import { Check, ChevronDown, Search, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface Option {
  id: string;
  name: string;
}

interface MultiSelectSearchProps {
  options: Option[];
  selectedValues: string[];
  onChange: (values: string[]) => void;
  placeholder: string;
  searchPlaceholder?: string;
  label?: string;
}

export default function MultiSelectSearch({
  options,
  selectedValues,
  onChange,
  placeholder,
  searchPlaceholder = "Buscar...",
  label
}: MultiSelectSearchProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredOptions = options.filter(option =>
    (option.name || "").toLowerCase().includes(searchTerm.toLowerCase())
  );

  const toggleOption = (optionName: string) => {
    const isSelected = selectedValues.includes(optionName);
    if (isSelected) {
      onChange(selectedValues.filter(val => val !== optionName));
    } else {
      onChange([...selectedValues, optionName]);
    }
  };

  const clearSelection = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange([]);
  };

  return (
    <div ref={containerRef} className="relative w-full space-y-1">
      {label && <label className="text-[10px] font-bold text-muted-foreground uppercase">{label}</label>}
      <div
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "flex min-h-[38px] w-full items-center justify-between rounded-xl border bg-background px-3 py-1.5 text-xs shadow-sm cursor-pointer focus-within:ring-2 focus-within:ring-primary/20",
          isOpen && "border-primary/50"
        )}
      >
        <div className="flex flex-wrap gap-1 items-center max-w-[90%] select-none">
          {selectedValues.length === 0 ? (
            <span className="text-muted-foreground truncate">{placeholder}</span>
          ) : (
            selectedValues.map(val => (
              <span
                key={val}
                className="flex items-center gap-1 rounded-lg bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary border border-primary/20"
                onClick={(e) => {
                  e.stopPropagation();
                  toggleOption(val);
                }}
              >
                {val}
                <X className="h-2.5 w-2.5 hover:text-primary-700 transition-colors" />
              </span>
            ))
          )}
        </div>
        <div className="flex items-center gap-1.5 flex-shrink-0">
          {selectedValues.length > 0 && (
            <X
              onClick={clearSelection}
              className="h-3 w-3 text-muted-foreground hover:text-foreground cursor-pointer transition-colors"
            />
          )}
          <ChevronDown className={cn("h-4 w-4 text-muted-foreground transition-transform duration-200", isOpen && "rotate-180")} />
        </div>
      </div>

      {isOpen && (
        <div className="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-xl border bg-popover p-2 text-popover-foreground shadow-lg animate-in fade-in-50 slide-in-from-top-1">
          <div className="relative mb-2 flex items-center border-b pb-2">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <input
              type="text"
              placeholder={searchPlaceholder}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onClick={(e) => e.stopPropagation()}
              className="w-full h-8 pl-8 pr-3 text-xs bg-background rounded-lg border-0 outline-none focus:ring-1 focus:ring-primary/20"
            />
          </div>
          <div className="space-y-0.5">
            {filteredOptions.length === 0 ? (
              <div className="py-2 text-center text-xs text-muted-foreground">
                No se encontraron opciones.
              </div>
            ) : (
              filteredOptions.map(option => {
                const isSelected = selectedValues.includes(option.name);
                return (
                  <div
                    key={option.id}
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleOption(option.name);
                    }}
                    className={cn(
                      "flex items-center justify-between rounded-lg px-2 py-1.5 text-xs cursor-pointer hover:bg-accent hover:text-accent-foreground transition-colors select-none",
                      isSelected && "bg-accent/50 font-medium"
                    )}
                  >
                    <span className="truncate pr-4">{option.name}</span>
                    <div className={cn(
                      "flex h-4 w-4 items-center justify-center rounded border border-input transition-all",
                      isSelected ? "bg-primary border-primary text-primary-foreground" : "bg-background"
                    )}>
                      {isSelected && <Check className="h-3 w-3 stroke-[3]" />}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
