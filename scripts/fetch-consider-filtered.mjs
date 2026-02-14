// Fetch Consider companies using location=India filter
// Testing if the search-companies API supports the same filters as the UI
const UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36";

const boards = [
  { id: "peakxv", baseUrl: "https://careers.peakxv.com" },
  { id: "lightspeed", baseUrl: "https://jobs.lsvp.com" },
  { id: "nexus", baseUrl: "https://jobs.nexusvp.com" },
];

// Try various filter parameter formats
const filterTests = [
  { locations: ["India"] },
  { locations: "India" },
  { location: "India" },
  { location: ["India"] },
  { filters: { locations: ["India"] } },
  { country: "India" },
  { countries: ["India"] },
];

console.log("=== Testing API filter parameters ===\n");

for (const filter of filterTests) {
  const body = { query: {}, page: 1, per_page: 5, ...filter };
  const res = await fetch(`${boards[0].baseUrl}/api-boards/search-companies`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "User-Agent": UA },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  const total = data.totalCount || data.total || "?";
  const first = data.companies?.[0];
  console.log(`${JSON.stringify(filter).padEnd(50)} -> total=${total}, first=${first?.slug}`);
}

// Also try putting filters inside the query object
console.log("\n=== Filters inside query object ===\n");

const queryFilters = [
  { query: { locations: ["India"] } },
  { query: { location: "India" } },
  { query: { filters: { locations: ["India"] } } },
  { query: { country: "India" } },
];

for (const body of queryFilters) {
  const fullBody = { ...body, page: 1, per_page: 5 };
  const res = await fetch(`${boards[0].baseUrl}/api-boards/search-companies`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "User-Agent": UA },
    body: JSON.stringify(fullBody),
  });
  const data = await res.json();
  const total = data.totalCount || data.total || "?";
  const first = data.companies?.[0];
  console.log(`${JSON.stringify(body).padEnd(60)} -> total=${total}, first=${first?.slug}`);
}

// Try the URL-based approach - fetch the filtered page HTML and look for API calls
console.log("\n=== Checking filtered page for embedded data ===\n");

const filteredUrl = "https://jobs.lsvp.com/jobs?locations=India&stages=Seed&stages=Series+A&stages=Growth+%28Series+B+or+later%29";
const res = await fetch(filteredUrl, { headers: { "User-Agent": UA } });
const html = await res.text();
console.log(`Filtered page HTML length: ${html.length}`);

// Check for any embedded company data or API config
const scriptMatches = [...html.matchAll(/<script[^>]*>([\s\S]*?)<\/script>/g)];
for (const m of scriptMatches) {
  const content = m[1].trim();
  if (content.length > 50 && content.length < 10000 && !content.includes("gtm.start")) {
    console.log(`\nScript tag (${content.length} chars):`);
    console.log(content.slice(0, 500));
  }
}

// Try search-jobs endpoint instead
console.log("\n=== Testing search-jobs API ===\n");

const jobsEndpoints = [
  { path: "/api-boards/search-jobs", body: { query: {}, page: 1, per_page: 5 } },
  { path: "/api-boards/search-jobs", body: { query: { locations: ["India"] }, page: 1, per_page: 5 } },
  { path: "/api-boards/search-jobs", body: { locations: ["India"], page: 1, per_page: 5 } },
];

for (const ep of jobsEndpoints) {
  try {
    const res = await fetch(`${boards[0].baseUrl}${ep.path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "User-Agent": UA },
      body: JSON.stringify(ep.body),
    });
    const text = await res.text();
    let data;
    try { data = JSON.parse(text); } catch { data = null; }
    if (data) {
      console.log(`POST ${ep.path} ${JSON.stringify(ep.body)}`);
      console.log(`  -> status=${res.status}, keys=${Object.keys(data)}, total=${data.totalCount || data.total || "?"}`);
      if (data.jobs?.[0]) {
        console.log(`  -> first job: ${data.jobs[0].title} at ${data.jobs[0].companyName || data.jobs[0].company_name || "?"}`);
      }
    } else {
      console.log(`POST ${ep.path} -> status=${res.status}, not JSON (${text.length} chars)`);
    }
  } catch (e) {
    console.log(`POST ${ep.path} -> error: ${e.message}`);
  }
}
