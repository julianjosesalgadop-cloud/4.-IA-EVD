"use client";

import React, { useState, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import { Search } from "lucide-react";

interface Option {
  id: string;
  name: string;
}

interface SearchableSelectProps {
  options: Option[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyMessage?: string;
  disabled?: boolean;
  className?: string;
}

export function SearchableSelect({
  options,
  value,
  onChange,
  placeholder = "Seleccionar...",
  searchPlaceholder = "Buscar...",
  emptyMessage = "No se encontraron resultados",
  disabled = false,
  className,
}: SearchableSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selectedOption = options.find((opt) => opt.id === value);

  const filtered = options.filter((opt) =>
    (opt.name || "").toLowerCase().includes((search || "").toLowerCase())
  );

  return (
    <div className={cn("relative w-full", className)} ref={dropdownRef}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => {
          if (!disabled) {
            setIsOpen(!isOpen);
            setSearch("");
          }
        }}
        className={cn(
          "w-full h-10 rounded-lg border bg-background px-3 text-left text-sm flex items-center justify-between focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all",
          disabled ? "opacity-60 cursor-not-allowed bg-muted/30" : "hover:border-brand-300"
        )}
      >
        <span className={cn("truncate block mr-2", !selectedOption && "text-muted-foreground")}>
          {selectedOption ? selectedOption.name : placeholder}
        </span>
        <span className="text-[10px] text-muted-foreground/80 flex-shrink-0">▼</span>
      </button>

      {isOpen && (
        <div className="absolute z-50 w-full mt-1.5 rounded-xl border bg-card p-1.5 shadow-xl max-h-60 overflow-y-auto flex flex-col gap-1 animate-in fade-in-50 slide-in-from-top-1 duration-150">
          <div className="relative flex items-center">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={searchPlaceholder}
              className="w-full h-9 pl-8 pr-2.5 rounded-lg border bg-background text-xs focus:outline-none focus:ring-1 focus:ring-primary/40"
              autoFocus
            />
          </div>
          <div className="flex flex-col max-h-40 overflow-y-auto mt-1 divide-y divide-border/20">
            {filtered.length === 0 ? (
              <div className="px-2.5 py-3 text-xs text-center text-muted-foreground">
                {emptyMessage}
              </div>
            ) : (
              filtered.map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => {
                    onChange(opt.id);
                    setIsOpen(false);
                  }}
                  className={cn(
                    "w-full text-left px-2.5 py-2 text-xs transition-colors hover:bg-accent hover:text-accent-foreground rounded-lg font-medium",
                    opt.id === value ? "bg-primary/10 text-primary" : "text-foreground/90"
                  )}
                >
                  {opt.name}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
