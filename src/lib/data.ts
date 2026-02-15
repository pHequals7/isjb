import fs from "fs";
import path from "path";
import { vcFundsConfig } from "@/config/vc-funds";
import type { VCDataFile, VCFund } from "@/lib/types";

interface IndiaFilter {
  [fundId: string]: {
    mode: "allowlist" | "denylist";
    slugs: string[];
  };
}

interface DefunctEntry {
  slug: string;
  reason: string;
}

interface PubliclyListedEntry {
  slug: string;
  exchange: string;
  ticker: string;
}

export function loadVCFunds(): VCFund[] {
  const dataDir = path.join(process.cwd(), "data");

  // Load India filter rules
  const filterPath = path.join(dataDir, "india-filter.json");
  const indiaFilter: IndiaFilter = fs.existsSync(filterPath)
    ? JSON.parse(fs.readFileSync(filterPath, "utf-8"))
    : {};

  // Load defunct companies list
  const defunctPath = path.join(dataDir, "defunct-companies.json");
  const defunctData: { companies: DefunctEntry[] } = fs.existsSync(defunctPath)
    ? JSON.parse(fs.readFileSync(defunctPath, "utf-8"))
    : { companies: [] };
  const defunctSlugs = new Set(defunctData.companies.map((c) => c.slug));

  // Load publicly listed companies
  const listedPath = path.join(dataDir, "publicly-listed.json");
  const listedData: { companies: PubliclyListedEntry[] } = fs.existsSync(
    listedPath
  )
    ? JSON.parse(fs.readFileSync(listedPath, "utf-8"))
    : { companies: [] };
  const listedSlugs = new Set(listedData.companies.map((c) => c.slug));

  // Staleness threshold: 30 days ago
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const staleThreshold = thirtyDaysAgo.toISOString().split("T")[0];

  return vcFundsConfig
    .map((config) => {
      const filePath = path.join(dataDir, `${config.id}.json`);
      if (!fs.existsSync(filePath)) return null;

      const raw = fs.readFileSync(filePath, "utf-8");
      const data: VCDataFile = JSON.parse(raw);

      let companies = data.companies;

      // Apply India filter
      const filter = indiaFilter[config.id];
      if (filter) {
        const slugSet = new Set(filter.slugs);
        if (filter.mode === "allowlist") {
          companies = companies.filter((c) => slugSet.has(c.slug));
        } else {
          companies = companies.filter((c) => !slugSet.has(c.slug));
        }
      }

      // Remove defunct companies
      companies = companies.filter((c) => !defunctSlugs.has(c.slug));

      // Only include companies with active job openings
      companies = companies.filter((c) => (c.activeJobCount ?? 0) > 0);

      // Enrich with publicly listed flag and staleness
      companies = companies.map((c) => ({
        ...c,
        isPubliclyListed: listedSlugs.has(c.slug),
        isStale: c.latestJobDate ? c.latestJobDate < staleThreshold : false,
      }));

      // Sort: fresh companies first, then by job count descending
      companies.sort((a, b) => {
        if (a.isStale !== b.isStale) return a.isStale ? 1 : -1;
        return (b.activeJobCount ?? 0) - (a.activeJobCount ?? 0);
      });

      return {
        ...config,
        companies,
        totalCompanies: companies.length,
        totalJobs: companies.reduce(
          (sum, c) => sum + (c.activeJobCount ?? 0),
          0
        ),
        freshJobs: companies
          .filter((c) => !c.isStale)
          .reduce((sum, c) => sum + (c.activeJobCount ?? 0), 0),
      };
    })
    .filter((f): f is VCFund => f !== null);
}
