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
  internshipOnly: boolean;
  onToggleInternship: () => void;
  internshipCompanyCount: number;
}

export function SearchFilterBar({
  searchQuery,
  onSearchChange,
  sectors,
  activeSectors,
  onToggleSector,
  onClearAll,
  internshipOnly,
  onToggleInternship,
  internshipCompanyCount,
}: SearchFilterBarProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const hasActiveFilters = searchQuery.length > 0 || activeSectors.size > 0 || internshipOnly;

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
      <div className="mx-auto max-w-7xl px-4 py-5 sm:px-6 sm:py-6 lg:px-8">
        {/* Search input */}
        <div className="relative">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
          <input
            ref={inputRef}
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search companies..."
            className="h-12 w-full rounded-lg border border-input bg-background pl-12 pr-12 text-base shadow-xs outline-none transition-[color,box-shadow] placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]"
          />
          {searchQuery && (
            <button
              onClick={() => onSearchChange("")}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              aria-label="Clear search"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Internship toggle — filters to companies with internship roles (Getro-based funds only) */}
        <div className="mt-4 flex items-center gap-3">
          <button
            onClick={onToggleInternship}
            className={`inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-sm font-medium transition-all duration-150 ${
              internshipOnly
                ? "bg-primary text-primary-foreground shadow-sm"
                : "bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground"
            }`}
          >
            <span className="text-base" aria-hidden="true">🎓</span>
            Internships only
            <span
              className={`font-mono text-xs ${
                internshipOnly
                  ? "text-primary-foreground/70"
                  : "text-muted-foreground/60"
              }`}
            >
              {internshipCompanyCount}
            </span>
          </button>
        </div>

        {/* Sector pills */}
        <div className="mt-3 flex flex-wrap items-center gap-2.5">
          {sectors.map((sector) => {
            const isActive = activeSectors.has(sector.name);
            return (
              <button
                key={sector.name}
                onClick={() => onToggleSector(sector.name)}
                className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-sm font-medium transition-all duration-150 ${
                  isActive
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground"
                }`}
              >
                {sector.name}
                <span
                  className={`font-mono text-xs ${
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
              className="ml-1 text-sm font-medium text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
            >
              Clear all
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
