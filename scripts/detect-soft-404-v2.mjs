// Approach: Use the Consider search-companies API to check if slugs exist
// If a company slug doesn't appear in search results, its page is a soft 404
const UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36";

const boards = [
  { id: "peakxv", baseUrl: "https://careers.peakxv.com" },
  { id: "lightspeed", baseUrl: "https://jobs.lsvp.com" },
  { id: "nexus", baseUrl: "https://jobs.nexusvp.com" },
];

// Fetch ALL companies from a Consider board's search API
async function fetchAllCompanies(baseUrl) {
  const allCompanies = new Map();
  let page = 1;
  const perPage = 100;

  while (true) {
    const res = await fetch(`${baseUrl}/api-boards/search-companies`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "User-Agent": UA,
      },
      body: JSON.stringify({
        query: {},
        page,
        per_page: perPage,
      }),
    });

    if (!res.ok) {
      console.error(`  API error: ${res.status} on page ${page}`);
      break;
    }

    const data = await res.json();
    const companies = data.companies || [];
    if (companies.length === 0) break;

    for (const c of companies) {
      allCompanies.set(c.slug, {
        name: c.name,
        numJobs: c.numJobs || 0,
        parentSlugs: c.parentSlugs || [],
      });
    }

    console.log(`  Fetched page ${page}: ${companies.length} companies (total so far: ${allCompanies.size})`);

    if (companies.length < perPage) break;
    page++;

    // Rate limit
    if (page % 3 === 0) await new Promise(r => setTimeout(r, 500));
  }

  return allCompanies;
}

// The search-companies API returns ALL companies globally.
// But companies have parentSlugs indicating which board they belong to.
// Let's first fetch a sample and check the parentSlugs field.

console.log("=== Testing parentSlugs approach ===\n");

// Fetch first page from each board to see parentSlugs
for (const board of boards) {
  const res = await fetch(`${board.baseUrl}/api-boards/search-companies`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "User-Agent": UA },
    body: JSON.stringify({ query: {}, page: 1, per_page: 5 }),
  });

  const data = await res.json();
  const companies = data.companies || [];

  console.log(`${board.id} (${board.baseUrl}):`);
  console.log(`  Total results: ${data.totalCount || data.total || "unknown"}`);
  for (const c of companies.slice(0, 3)) {
    console.log(`  - ${c.slug}: parentSlugs=${JSON.stringify(c.parentSlugs)}, numJobs=${c.numJobs}`);
  }
  console.log();
}

// Now: Fetch ALL companies from one board's API and build a slug set
// Then check our data files against it
import { readFileSync } from "fs";

console.log("=== Building global company slug index ===\n");

// Fetch enough pages to get a comprehensive index
// The API returns all ~34K companies regardless of board, so we can check any slug
const res = await fetch("https://careers.peakxv.com/api-boards/search-companies", {
  method: "POST",
  headers: { "Content-Type": "application/json", "User-Agent": UA },
  body: JSON.stringify({ query: {}, page: 1, per_page: 5 }),
});
const firstPage = await res.json();
const totalCount = firstPage.totalCount || firstPage.total;
console.log(`Total companies in Consider database: ${totalCount}`);

// Instead of fetching all 34K, let's check specific slugs
// We can search by name/slug using the query parameter
console.log("\n=== Testing slug-specific search ===\n");

async function searchBySlug(baseUrl, slug) {
  // Try searching with the slug as a text query
  const res = await fetch(`${baseUrl}/api-boards/search-companies`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "User-Agent": UA },
    body: JSON.stringify({ query: { search: slug }, page: 1, per_page: 10 }),
  });
  const data = await res.json();
  const match = (data.companies || []).find(c => c.slug === slug);
  return { found: !!match, totalResults: data.companies?.length || 0, match };
}

// Test with known-good and known-bad
const testCases = [
  { base: "https://jobs.lsvp.com", slug: "apna", expect: "valid" },
  { base: "https://jobs.lsvp.com", slug: "sahaj-ai", expect: "404" },
  { base: "https://jobs.lsvp.com", slug: "totally-fake-xyz", expect: "404" },
  { base: "https://careers.peakxv.com", slug: "razorpay", expect: "valid" },
  { base: "https://careers.peakxv.com", slug: "cred-2", expect: "valid" },
];

for (const t of testCases) {
  const result = await searchBySlug(t.base, t.slug);
  const status = result.found ? "FOUND" : "NOT FOUND";
  const parentInfo = result.match ? `, parents: ${JSON.stringify(result.match.parentSlugs)}` : "";
  console.log(`${t.expect.padEnd(5)} | ${t.slug.padEnd(25)} | ${status} (${result.totalResults} results${parentInfo})`);
  await new Promise(r => setTimeout(r, 300));
}
