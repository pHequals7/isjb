"use client";

import { useRef, useEffect } from "react";
import { Search, X } from "lucide-react";

interface SectorInfo {
  name: string;
  count: number;
}

interface SearchFilterBarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  sectors: SectorInfo[];
  activeSectors: Set<string>;
  onToggleSector: (sector: string) => void;
  onClearAll: () => void;
}

export function SearchFilterBar({
  searchQuery,
  onSearchChange,
  sectors,
  activeSectors,
  onToggleSector,
  onClearAll,
}: SearchFilterBarProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const hasActiveFilters = searchQuery.length > 0 || activeSectors.size > 0;

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "/" && !e.ctrlKey && !e.metaKey) {
        const tag = (e.target as HTMLElement).tagName;
        if (tag !== "INPUT" && tag !== "TEXTAREA") {
          e.preventDefault();
          inputRef.current?.focus();
        }
      }
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <div className="border-b bg-card">
      <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
        {/* Search input */}
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            ref={inputRef}
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search companies..."
            className="h-10 w-full rounded-lg border border-input bg-background pl-10 pr-10 text-sm shadow-xs outline-none transition-[color,box-shadow] placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]"
          />
          {searchQuery && (
            <button
              onClick={() => onSearchChange("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              aria-label="Clear search"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Sector pills */}
        <div className="mt-3 flex flex-wrap items-center gap-2">
          {sectors.map((sector) => {
            const isActive = activeSectors.has(sector.name);
            return (
              <button
                key={sector.name}
                onClick={() => onToggleSector(sector.name)}
                className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium transition-all duration-150 ${
                  isActive
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground"
                }`}
              >
                {sector.name}
                <span
                  className={`font-mono text-[10px] ${
                    isActive
                      ? "text-primary-foreground/70"
                      : "text-muted-foreground/60"
                  }`}
                >
                  {sector.count}
                </span>
              </button>
            );
          })}
          {hasActiveFilters && (
            <button
              onClick={onClearAll}
              className="ml-1 text-xs font-medium text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
            >
              Clear all
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
