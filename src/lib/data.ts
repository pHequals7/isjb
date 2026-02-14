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

export function loadVCFunds(): VCFund[] {
  // Load India filter rules for Consider-sourced funds
  const filterPath = path.join(process.cwd(), "data", "india-filter.json");
  const indiaFilter: IndiaFilter = fs.existsSync(filterPath)
    ? JSON.parse(fs.readFileSync(filterPath, "utf-8"))
    : {};

  return vcFundsConfig
    .map((config) => {
      const filePath = path.join(process.cwd(), "data", `${config.id}.json`);
      if (!fs.existsSync(filePath)) return null;

      const raw = fs.readFileSync(filePath, "utf-8");
      const data: VCDataFile = JSON.parse(raw);

      let companies = data.companies;

      // Apply India filter for Getro-sourced funds
      const filter = indiaFilter[config.id];
      if (filter) {
        const slugSet = new Set(filter.slugs);
        if (filter.mode === "allowlist") {
          companies = companies.filter((c) => slugSet.has(c.slug));
        } else {
          companies = companies.filter((c) => !slugSet.has(c.slug));
        }
      }

      // Only include companies with active job openings
      companies = companies.filter((c) => (c.activeJobCount ?? 0) > 0);

      return {
        ...config,
        companies,
        totalCompanies: companies.length,
        totalJobs: companies.reduce(
          (sum, c) => sum + (c.activeJobCount ?? 0),
          0
        ),
      };
    })
    .filter((f): f is VCFund => f !== null);
}
