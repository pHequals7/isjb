import type { Company } from "@/lib/types";

interface TopStats {
  totalCompanies: number;
  totalJobs: number;
  freshJobs: number;
}

function normalizeDomain(domain?: string): string {
  if (!domain) return "";
  return domain.trim().toLowerCase().replace(/^www\./, "");
}

function jobCount(company: Company): number {
  return Number.isFinite(company.activeJobCount) ? Number(company.activeJobCount) : 0;
}

/**
 * Computes top-banner stats using unique-company dedupe by domain.
 *
 * Rules:
 * - Non-empty normalized domains are deduped.
 * - Empty domains are never deduped and are counted as standalone entries.
 * - For deduped groups, the company entry with the highest activeJobCount wins.
 */
export function computeUniqueTopStats(companies: Company[]): TopStats {
  const byDomain = new Map<string, Company>();
  const noDomain: Company[] = [];

  for (const company of companies) {
    const domainKey = normalizeDomain(company.domain);
    if (!domainKey) {
      noDomain.push(company);
      continue;
    }

    const existing = byDomain.get(domainKey);
    if (!existing || jobCount(company) > jobCount(existing)) {
      byDomain.set(domainKey, company);
    }
  }

  const selected = [...byDomain.values(), ...noDomain];
  const totalCompanies = selected.length;
  const totalJobs = selected.reduce((sum, company) => sum + jobCount(company), 0);
  const freshJobs = selected
    .filter((company) => !company.isStale)
    .reduce((sum, company) => sum + jobCount(company), 0);

  return { totalCompanies, totalJobs, freshJobs };
}
