// Check if Consider URLs are soft 404s by examining the SSR HTML
// Consider renders 404 client-side, but we can check the hydration route data

const urls = [
  { name: "apna (should work)", url: "https://jobs.lsvp.com/jobs/apna" },
  { name: "sahaj-ai (suspected 404)", url: "https://jobs.lsvp.com/jobs/sahaj-ai" },
];

for (const { name, url } of urls) {
  const res = await fetch(url, {
    headers: { "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)" },
  });
  const html = await res.text();

  // Check for boards-404 class in SSR HTML
  const has404Class = html.includes("boards-404");

  // Extract hydration data
  const match = html.match(/__staticRouterHydrationData = JSON\.parse\("(.+?)"\)/);
  let hydrationData = null;
  if (match) {
    try {
      const decoded = match[1].replace(/\\"/g, '"').replace(/\\\\/g, "\\");
      hydrationData = JSON.parse(decoded);
    } catch {
      // ignore parse errors
    }
  }

  // Check if the page has actual company content (job listings, company name, etc.)
  const hasCompanyContent = html.includes("company-header") || html.includes("job-list");

  // Check the loaderData for 404 indicators
  const loaderKeys = hydrationData ? Object.keys(hydrationData.loaderData || {}) : [];
  const errors = hydrationData?.errors;

  console.log(`\n=== ${name} ===`);
  console.log(`  HTTP Status: ${res.status}`);
  console.log(`  has boards-404 class: ${has404Class}`);
  console.log(`  hydration loaderData keys: ${JSON.stringify(loaderKeys)}`);
  console.log(`  hydration errors: ${JSON.stringify(errors)}`);
  console.log(`  HTML length: ${html.length}`);

  // Count unique identifiers in the HTML
  const companyNameInHTML = html.toLowerCase().includes(name.split(" ")[0].toLowerCase());
  console.log(`  Company name in HTML: ${companyNameInHTML}`);
}
