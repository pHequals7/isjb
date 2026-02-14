// Fetch all companies from a Getro job board API
// Filters to India-only companies and extracts logo URLs
import { writeFileSync, readFileSync } from "fs";
import { join } from "path";

const configs = [
  { id: "accel", collectionId: "8672", baseUrl: "https://jobs.accel.com" },
  { id: "gc", collectionId: "222", baseUrl: "https://jobs.generalcatalyst.com" },
];

// Load Indian-origin override list
const overridePath = join(process.cwd(), "data", "indian-origin-override.json");
const overrides = JSON.parse(readFileSync(overridePath, "utf-8"));
const overrideSlugs = new Set(overrides.slugs);

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

for (const config of configs) {
  console.log(`Fetching ${config.id} (collection ${config.collectionId})...`);
  const companies = await fetchAllCompanies(config.collectionId);

  // Log first company to inspect available fields
  if (companies.length > 0) {
    console.log(`  Sample fields: ${Object.keys(companies[0]).join(", ")}`);
    console.log(`  Sample locations: ${JSON.stringify(companies[0].locations)}`);
    console.log(`  Sample logo_url: ${companies[0].logo_url}`);
  }

  const withJobs = companies
    .filter((c) => c.active_jobs_count > 0)
    .filter((c) => isIndianCompany(c))
    .map((c) => ({
      name: c.name,
      slug: c.slug,
      jobsBoardUrl: `${config.baseUrl}/companies/${c.slug}#content`,
      activeJobCount: c.active_jobs_count,
      domain: c.domain || "",
      logoUrl: c.logo_url || "",
      sectors: c.industry_tags || [],
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
    `  ${config.id}: ${companies.length} total, ${withJobs.length} Indian with jobs, saved to ${outPath}`
  );
}
