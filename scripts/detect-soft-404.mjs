// Detect Consider soft 404s by examining hydration route data and trying alternative API endpoints
const UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36";

async function fetchHTML(url) {
  const res = await fetch(url, { headers: { "User-Agent": UA } });
  return { status: res.status, html: await res.text() };
}

async function checkSlug(baseUrl, slug) {
  const { status, html } = await fetchHTML(`${baseUrl}/jobs/${slug}`);

  // Extract hydration data
  const match = html.match(/__staticRouterHydrationData\s*=\s*JSON\.parse\("(.+?)"\)/);
  let loaderKeys = [];
  let errors = null;
  if (match) {
    try {
      const decoded = match[1].replace(/\\"/g, '"').replace(/\\\\/g, "\\");
      const data = JSON.parse(decoded);
      loaderKeys = Object.keys(data.loaderData || {});
      errors = data.errors;
    } catch {}
  }

  // Check for serverInitialData (alternative hydration format)
  const serverMatch = html.match(/serverInitialData\s*=\s*(\{.+?\});/s);
  let serverData = null;
  if (serverMatch) {
    try { serverData = JSON.parse(serverMatch[1]); } catch {}
  }

  return { status, loaderKeys, errors, serverData, htmlLen: html.length };
}

// Also try API endpoints that might return company-specific data
async function checkAPI(baseUrl, slug) {
  const endpoints = [
    `/api-boards/company/${slug}`,
    `/api-boards/companies/${slug}`,
    `/api-boards/jobs?company=${slug}`,
    `/api-boards/search-jobs?company_slug=${slug}`,
  ];

  const results = {};
  for (const ep of endpoints) {
    try {
      const res = await fetch(`${baseUrl}${ep}`, {
        headers: { "User-Agent": UA, "Accept": "application/json" },
      });
      const text = await res.text();
      let isJSON = false;
      try { JSON.parse(text); isJSON = true; } catch {}
      results[ep] = { status: res.status, isJSON, len: text.length, snippet: text.slice(0, 200) };
    } catch (e) {
      results[ep] = { error: e.message };
    }
  }
  return results;
}

console.log("=== HYDRATION DATA TEST ===\n");

// Test known-good and known-bad slugs
const tests = [
  { base: "https://jobs.lsvp.com", slug: "apna", expect: "valid" },
  { base: "https://jobs.lsvp.com", slug: "sahaj-ai", expect: "404" },
  { base: "https://jobs.lsvp.com", slug: "totally-fake-xyz", expect: "404" },
  { base: "https://careers.peakxv.com", slug: "razorpay", expect: "valid" },
  { base: "https://careers.peakxv.com", slug: "totally-fake-xyz", expect: "404" },
];

for (const t of tests) {
  const result = await checkSlug(t.base, t.slug);
  console.log(`${t.expect.padEnd(5)} | ${t.slug.padEnd(25)} | loaderKeys: ${JSON.stringify(result.loaderKeys)} | errors: ${JSON.stringify(result.errors)} | htmlLen: ${result.htmlLen}`);
}

console.log("\n=== API ENDPOINT DISCOVERY ===\n");

// Try API endpoints for a known-good company
const apiResults = await checkAPI("https://jobs.lsvp.com", "apna");
for (const [ep, r] of Object.entries(apiResults)) {
  console.log(`${ep}: status=${r.status}, isJSON=${r.isJSON}, len=${r.len}`);
  if (r.snippet) console.log(`  snippet: ${r.snippet.slice(0, 150)}`);
}

console.log("\n--- Same endpoints for known-bad slug ---\n");
const apiResults404 = await checkAPI("https://jobs.lsvp.com", "sahaj-ai");
for (const [ep, r] of Object.entries(apiResults404)) {
  console.log(`${ep}: status=${r.status}, isJSON=${r.isJSON}, len=${r.len}`);
  if (r.snippet) console.log(`  snippet: ${r.snippet.slice(0, 150)}`);
}
