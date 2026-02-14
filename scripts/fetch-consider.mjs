// Add logoUrl field to existing Consider data files
// Uses Google Favicons API URLs as logo source (free, no expiry, no API key needed)
import { writeFileSync, readFileSync } from "fs";
import { join } from "path";

const configs = [
  { id: "peakxv", baseUrl: "https://careers.peakxv.com" },
  { id: "lightspeed", baseUrl: "https://jobs.lsvp.com" },
  { id: "nexus", baseUrl: "https://jobs.nexusvp.com" },
];

for (const config of configs) {
  console.log(`Processing ${config.id}...`);

  const dataPath = join(process.cwd(), "data", `${config.id}.json`);
  const existing = JSON.parse(readFileSync(dataPath, "utf-8"));

  for (const company of existing.companies) {
    // For Consider companies, we don't have direct logo URLs from the API
    // The component will use Google Favicons fallback via domain
    company.logoUrl = "";
  }

  existing.meta.lastUpdated = new Date().toISOString().split("T")[0];
  writeFileSync(dataPath, JSON.stringify(existing, null, 2));
  console.log(`  Updated ${existing.companies.length} companies in ${dataPath}`);
}
