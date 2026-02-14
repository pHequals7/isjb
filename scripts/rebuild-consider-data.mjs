// Rebuild Consider data files from scraped India-filtered data
// Includes logo URLs and proper job counts
import { readFileSync, writeFileSync } from "fs";

const boards = [
  { id: "lightspeed", baseUrl: "https://jobs.lsvp.com" },
  { id: "peakxv", baseUrl: "https://careers.peakxv.com" },
  { id: "nexus", baseUrl: "https://jobs.nexusvp.com" },
];

// Non-Indian companies to exclude (US/global/SEA companies with India offices)
const nonIndianSlugs = new Set([
  // US companies
  "databricks", "stripe", "marvell-semiconductor", "rippling", "navan",
  "sailpoint", "bloomreach", "informatica",
  "brocade-communications-systems", "bridgetown-research",
  // Canada
  "arctic-wolf-networks",
  // Israel
  "aqua-security",
  // US (insurance)
  "nirvana-insurance",
  // US (semiconductors)
  "alif-semiconductor",
  // Singapore/SEA companies (PeakXV board)
  "carousell-group", "ula", "tinvio", "durianpay", "biofourmis",
  "tigerhall", "zilingo",
  // Bangladesh
  "shopup",
  // US (IoT)
  "sibros",
  // Nexus non-Indian
  "comet",
  // Normalyze - US cybersecurity
  "normalyze",
]);

function decodeHtmlEntities(str) {
  return str.replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"');
}

for (const board of boards) {
  console.log(`\n=== ${board.id.toUpperCase()} ===`);

  const raw = JSON.parse(readFileSync(`data/${board.id}-india-raw.json`, "utf-8"));

  const companies = [];
  for (let i = 0; i < raw.companyNames.length; i++) {
    const name = raw.companyNames[i];
    const slug = raw.slugs[i];
    const logoUrl = raw.logoUrls[i] ? decodeHtmlEntities(raw.logoUrls[i]) : "";
    const jobCount = raw.jobCounts[i] || 0;

    if (nonIndianSlugs.has(slug)) {
      console.log(`  EXCLUDED: ${name} (${slug}) - non-Indian`);
      continue;
    }

    // Extract domain from company name for Google Favicon fallback
    // We'll try to find the domain from the existing data files
    let domain = "";

    companies.push({
      name,
      slug,
      jobsBoardUrl: `${board.baseUrl}/jobs/${slug}`,
      activeJobCount: jobCount,
      domain,
      logoUrl,
    });
  }

  // Try to merge domains from existing data
  try {
    const existing = JSON.parse(readFileSync(`data/${board.id}.json`, "utf-8"));
    const domainMap = new Map();
    for (const c of existing.companies) {
      if (c.domain) domainMap.set(c.slug, c.domain);
    }
    for (const c of companies) {
      if (!c.domain && domainMap.has(c.slug)) {
        c.domain = domainMap.get(c.slug);
      }
    }
  } catch {}

  // Sort: companies with jobs first (descending), then alphabetical
  companies.sort((a, b) => {
    if (b.activeJobCount !== a.activeJobCount) return b.activeJobCount - a.activeJobCount;
    return a.name.localeCompare(b.name);
  });

  const output = { companies };
  writeFileSync(`data/${board.id}.json`, JSON.stringify(output, null, 2));
  console.log(`  Wrote ${companies.length} companies to data/${board.id}.json`);

  // Stats
  const withJobs = companies.filter(c => c.activeJobCount > 0).length;
  const withLogos = companies.filter(c => c.logoUrl).length;
  const totalJobs = companies.reduce((s, c) => s + c.activeJobCount, 0);
  console.log(`  ${withJobs} with active jobs, ${companies.length - withJobs} with 0 jobs`);
  console.log(`  ${withLogos} with logos`);
  console.log(`  ${totalJobs} total jobs`);
}

// Now update india-filter.json - since we've already filtered at data level,
// we can simplify the filter config
console.log("\n=== Updating india-filter.json ===");
const filterData = JSON.parse(readFileSync("data/india-filter.json", "utf-8"));

// Remove Consider fund filters since data is now pre-filtered
delete filterData.peakxv;
delete filterData.lightspeed;
delete filterData.nexus;

writeFileSync("data/india-filter.json", JSON.stringify(filterData, null, 2) + "\n");
console.log("  Removed Consider fund filters (data already filtered)");
console.log("  Remaining filters:", Object.keys(filterData).join(", "));
