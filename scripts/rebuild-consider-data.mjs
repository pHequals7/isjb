// Rebuild Consider data files from scraped India-filtered data
// Includes logo URLs and proper job counts
import { readFileSync, writeFileSync } from "fs";

const boards = [
  { id: "lightspeed", baseUrl: "https://jobs.lsvp.com" },
  { id: "peakxv", baseUrl: "https://careers.peakxv.com" },
  { id: "nexus", baseUrl: "https://jobs.nexusvp.com" },
  { id: "bessemer", baseUrl: "https://jobs.bvp.com" },
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

function loadRawCompanies(raw) {
  // New CI scraper writes normalized `companies`; keep legacy fallback for existing raw format.
  if (Array.isArray(raw.companies)) {
    return raw.companies.map((c) => ({
      name: c.name,
      slug: c.slug,
      activeJobCount: c.activeJobCount || 0,
      logoUrl: c.logoUrl ? decodeHtmlEntities(c.logoUrl) : "",
    }));
  }

  const companies = [];
  for (let i = 0; i < (raw.companyNames || []).length; i++) {
    companies.push({
      name: raw.companyNames[i],
      slug: raw.slugs?.[i],
      activeJobCount: raw.jobCounts?.[i] || 0,
      logoUrl: raw.logoUrls?.[i] ? decodeHtmlEntities(raw.logoUrls[i]) : "",
    });
  }
  return companies;
}

for (const board of boards) {
  console.log(`\n=== ${board.id.toUpperCase()} ===`);

  const raw = JSON.parse(readFileSync(`data/${board.id}-india-raw.json`, "utf-8"));
  const rawCompanies = loadRawCompanies(raw);

  const companies = [];
  for (const rawCompany of rawCompanies) {
    const name = rawCompany.name;
    const slug = rawCompany.slug;
    const logoUrl = rawCompany.logoUrl;
    const jobCount = rawCompany.activeJobCount;

    if (!slug || !name) continue;

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
      sectors: [],
    });
  }

  // Try to merge stable fields from existing data.
  try {
    const existing = JSON.parse(readFileSync(`data/${board.id}.json`, "utf-8"));
    const companyMap = new Map();
    for (const c of existing.companies) {
      companyMap.set(c.slug, c);
    }
    for (const c of companies) {
      const prev = companyMap.get(c.slug);
      if (!prev) continue;

      if (!c.domain && prev.domain) {
        c.domain = prev.domain;
      }
      if ((!c.logoUrl || c.logoUrl.length === 0) && prev.logoUrl) {
        c.logoUrl = prev.logoUrl;
      }
      if (Array.isArray(prev.sectors) && prev.sectors.length > 0) {
        c.sectors = prev.sectors;
      }
      if (prev.latestJobDate) {
        c.latestJobDate = prev.latestJobDate;
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
