// Fetch all companies from a Getro job board API
// Filters to India-only companies and extracts logo URLs
import { writeFileSync, readFileSync } from "fs";
import { join } from "path";

const configs = [
  { id: "accel", collectionId: "8672", baseUrl: "https://jobs.accel.com" },
  { id: "gc", collectionId: "222", baseUrl: "https://jobs.generalcatalyst.com" },
  { id: "blume", collectionId: "32333", baseUrl: "https://jobs.blume.vc" },
];

// Load Indian-origin override list
const overridePath = join(process.cwd(), "data", "indian-origin-override.json");
const overrides = JSON.parse(readFileSync(overridePath, "utf-8"));
const overrideSlugs = new Set(overrides.slugs);

// Load per-fund India filters (denylist/allowlist)
const filterPath = join(process.cwd(), "data", "india-filter.json");
const indiaFilters = JSON.parse(readFileSync(filterPath, "utf-8"));

function isIndianCompany(company) {
  // Check if any location contains "India"
  const locations = company.locations || [];
  if (locations.some((loc) => typeof loc === "string" && loc.includes("India"))) {
    return true;
  }
  // Also check location objects (Getro sometimes returns objects with country field)
  if (locations.some((loc) => typeof loc === "object" && loc?.country === "India")) {
    return true;
  }
  // Check override list
  if (overrideSlugs.has(company.slug)) {
    return true;
  }
  return false;
}

function passesFundFilter(company, fundId) {
  const filter = indiaFilters[fundId];
  if (!filter) return true;

  const slugs = new Set(filter.slugs || []);
  if (filter.mode === "allowlist") {
    return slugs.has(company.slug);
  }
  if (filter.mode === "denylist") {
    return !slugs.has(company.slug);
  }
  return true;
}

async function fetchAllCompanies(collectionId) {
  const all = [];
  let page = 0;
  const hitsPerPage = 12;

  while (true) {
    const res = await fetch(
      `https://api.getro.com/api/v2/collections/${collectionId}/search/companies`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          hitsPerPage,
          page,
          query: "",
          filters: { page },
        }),
      }
    );
    const d = await res.json();
    if (!d.results?.companies?.length) break;
    all.push(...d.results.companies);
    if (all.length >= d.results.count) break;
    page++;
  }
  return all;
}

// Fetch internship job counts per company slug using Getro's seniority filter.
// This is Getro-specific — the Consider platform does not expose a seniority field.
// Note: Getro API caps at 20 jobs/page regardless of hitsPerPage requested.
async function fetchInternshipCountsBySlug(collectionId) {
  const counts = {};
  let page = 0;
  let totalFetched = 0;

  while (true) {
    const res = await fetch(
      `https://api.getro.com/api/v2/collections/${collectionId}/search/jobs`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          hitsPerPage: 20,
          page,
          filters: { seniority: ["internship"] },
        }),
      }
    );
    const d = await res.json();
    const jobs = d.results?.jobs || [];
    if (jobs.length === 0) break;
    for (const job of jobs) {
      const slug = job.organization?.slug;
      if (slug) counts[slug] = (counts[slug] || 0) + 1;
    }
    totalFetched += jobs.length;
    if (totalFetched >= (d.results?.count || 0)) break;
    page++;
  }
  return counts;
}

for (const config of configs) {
  console.log(`Fetching ${config.id} (collection ${config.collectionId})...`);
  const companies = await fetchAllCompanies(config.collectionId);

  console.log(`  Fetching internship data...`);
  const internshipCounts = await fetchInternshipCountsBySlug(config.collectionId);
  const internTotal = Object.values(internshipCounts).reduce((s, n) => s + n, 0);
  console.log(`  Found ${internTotal} internship jobs across ${Object.keys(internshipCounts).length} companies`);

  // Log first company to inspect available fields
  if (companies.length > 0) {
    console.log(`  Sample fields: ${Object.keys(companies[0]).join(", ")}`);
    console.log(`  Sample locations: ${JSON.stringify(companies[0].locations)}`);
    console.log(`  Sample logo_url: ${companies[0].logo_url}`);
  }

  const filtered = companies
    .filter((c) => isIndianCompany(c))
    .filter((c) => passesFundFilter(c, config.id));

  const withJobs = filtered
    .map((c) => ({
      name: c.name,
      slug: c.slug,
      jobsBoardUrl: `${config.baseUrl}/companies/${c.slug}#content`,
      activeJobCount: c.active_jobs_count,
      domain: c.domain || "",
      logoUrl: c.logo_url || "",
      sectors: c.industry_tags || [],
      hasInternships: (internshipCounts[c.slug] || 0) > 0,
      internshipCount: internshipCounts[c.slug] || 0,
    }))
    .sort((a, b) => a.name.localeCompare(b.name));

  const data = {
    meta: {
      lastUpdated: new Date().toISOString().split("T")[0],
      totalCompanies: withJobs.length,
      source: config.baseUrl,
    },
    companies: withJobs,
  };

  const outPath = join(process.cwd(), "data", `${config.id}.json`);
  writeFileSync(outPath, JSON.stringify(data, null, 2));
  console.log(
    `  ${config.id}: ${companies.length} total, ${withJobs.length} after India + fund filters, saved to ${outPath}`
  );
}
