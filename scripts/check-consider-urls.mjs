// Check Consider-sourced URLs for soft 404s
// The /api-boards/company-info/{slug} endpoint returns "boards-404" in HTML for missing companies
import { readFileSync } from "fs";

const filterData = JSON.parse(readFileSync("data/india-filter.json", "utf-8"));

const funds = [
  { id: "peakxv", file: "data/peakxv.json", baseUrl: "https://careers.peakxv.com" },
  { id: "lightspeed", file: "data/lightspeed.json", baseUrl: "https://jobs.lsvp.com" },
  { id: "nexus", file: "data/nexus.json", baseUrl: "https://jobs.nexusvp.com" },
];

async function checkCompany(baseUrl, slug) {
  try {
    const res = await fetch(`${baseUrl}/api-boards/company-info/${slug}`, {
      headers: { "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36" },
    });
    const html = await res.text();
    const is404 = html.includes("boards-404");
    return { is404 };
  } catch (e) {
    return { is404: false, error: e.message };
  }
}

for (const fund of funds) {
  console.log(`\n=== ${fund.id.toUpperCase()} ===`);
  const data = JSON.parse(readFileSync(fund.file, "utf-8"));
  let companies = data.companies;

  const filter = filterData[fund.id];
  if (filter) {
    const slugSet = new Set(filter.slugs);
    if (filter.mode === "allowlist") {
      companies = companies.filter((c) => slugSet.has(c.slug));
    } else {
      companies = companies.filter((c) => !slugSet.has(c.slug));
    }
  }

  console.log(`Checking ${companies.length} companies...`);

  const broken = [];
  // Sequential with small delay to avoid rate limiting
  for (let i = 0; i < companies.length; i++) {
    const c = companies[i];
    const result = await checkCompany(fund.baseUrl, c.slug);
    if (result.is404) {
      broken.push(c);
      console.log(`  BROKEN: ${c.name} (${c.slug}) -> ${fund.baseUrl}/jobs/${c.slug}`);
    }
    // Small delay every 5 requests
    if (i % 5 === 4) await new Promise((r) => setTimeout(r, 500));
  }

  console.log(`  Result: ${companies.length - broken.length} OK, ${broken.length} BROKEN`);
}
