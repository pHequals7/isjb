"use client";

import { useState, useMemo, useCallback, useRef, useEffect } from "react";
import { Header } from "@/components/header";
import { StatsBanner } from "@/components/stats-banner";
import { VCNavBar } from "@/components/vc-nav-bar";
import { VCFundSection } from "@/components/vc-fund-section";
import { SearchFilterBar } from "@/components/search-filter-bar";
import { Footer } from "@/components/footer";
import { Separator } from "@/components/ui/separator";
import type { VCFund } from "@/lib/types";

interface JobBoardProps {
  funds: VCFund[];
}

export function JobBoard({ funds }: JobBoardProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeSectors, setActiveSectors] = useState<Set<string>>(new Set());
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const [debouncedQuery, setDebouncedQuery] = useState("");

  // Debounce search input
  const handleSearchChange = useCallback((query: string) => {
    setSearchQuery(query);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => setDebouncedQuery(query), 150);
  }, []);

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  // Compute global sector list from all companies (sorted by frequency)
  const allSectors = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const fund of funds) {
      for (const company of fund.companies) {
        for (const sector of company.sectors ?? []) {
          counts[sector] = (counts[sector] || 0) + 1;
        }
      }
    }
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .map(([name, count]) => ({ name, count }));
  }, [funds]);

  // Filter funds based on search + sector filters
  const filteredFunds = useMemo(() => {
    const query = debouncedQuery.toLowerCase();

    return funds
      .map((fund) => {
        let companies = fund.companies;

        if (query) {
          companies = companies.filter((c) =>
            c.name.toLowerCase().includes(query)
          );
        }

        if (activeSectors.size > 0) {
          companies = companies.filter((c) =>
            c.sectors?.some((s) => activeSectors.has(s))
          );
        }

        return {
          ...fund,
          companies,
          totalCompanies: companies.length,
          totalJobs: companies.reduce(
            (sum, c) => sum + (c.activeJobCount ?? 0),
            0
          ),
        };
      })
      .filter((fund) => fund.totalCompanies > 0);
  }, [funds, debouncedQuery, activeSectors]);

  const totalCompanies = filteredFunds.reduce(
    (s, f) => s + f.totalCompanies,
    0
  );
  const totalJobs = filteredFunds.reduce((s, f) => s + f.totalJobs, 0);

  const navItems = funds.map((f) => ({
    id: f.id,
    name: f.name,
    logoPath: f.logoPath,
    logoDark: f.logoDark,
    logoScale: f.logoScale,
  }));

  const toggleSector = useCallback((sector: string) => {
    setActiveSectors((prev) => {
      const next = new Set(prev);
      if (next.has(sector)) {
        next.delete(sector);
      } else {
        next.add(sector);
      }
      return next;
    });
  }, []);

  const clearAll = useCallback(() => {
    setSearchQuery("");
    setDebouncedQuery("");
    setActiveSectors(new Set());
    if (debounceRef.current) clearTimeout(debounceRef.current);
  }, []);

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <StatsBanner
        totalVCs={funds.length}
        totalCompanies={totalCompanies}
        totalJobs={totalJobs}
      />
      <SearchFilterBar
        searchQuery={searchQuery}
        onSearchChange={handleSearchChange}
        sectors={allSectors}
        activeSectors={activeSectors}
        onToggleSector={toggleSector}
        onClearAll={clearAll}
      />
      <VCNavBar funds={navItems} />
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 sm:px-6 lg:px-8">
        {filteredFunds.length === 0 ? (
          <div className="py-20 text-center">
            <p className="text-lg font-medium text-muted-foreground">
              No companies match your filters.
            </p>
            <button
              onClick={clearAll}
              className="mt-3 text-sm font-medium text-primary underline-offset-2 hover:underline"
            >
              Clear all filters
            </button>
          </div>
        ) : (
          filteredFunds.map((fund, i) => (
            <div key={fund.id}>
              <VCFundSection fund={fund} />
              {i < filteredFunds.length - 1 && <Separator />}
            </div>
          ))
        )}
      </main>
      <Footer />
    </div>
  );
}
