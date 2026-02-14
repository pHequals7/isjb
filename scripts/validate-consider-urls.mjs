// Validate Consider company URLs by checking the <title> tag
// Valid pages: "Jobs at {company} | {Board Name}"
// Soft 404s: "Jobs at {Board Name} Companies | {Board Name}"
import { readFileSync } from "fs";

const UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36";

const boards = [
  { id: "peakxv", file: "data/peakxv.json", baseUrl: "https://careers.peakxv.com", boardName: "Peak XV" },
  { id: "lightspeed", file: "data/lightspeed.json", baseUrl: "https://jobs.lsvp.com", boardName: "Lightspeed" },
  { id: "nexus", file: "data/nexus.json", baseUrl: "https://jobs.nexusvp.com", boardName: "Nexus" },
];

const filterData = JSON.parse(readFileSync("data/india-filter.json", "utf-8"));

async function checkCompany(baseUrl, slug) {
  try {
    const res = await fetch(`${baseUrl}/jobs/${slug}`, {
      headers: { "User-Agent": UA },
    });
    const html = await res.text();

    // Extract title
    const titleMatch = html.match(/<title>([^<]+)<\/title>/);
    const title = titleMatch?.[1] || "";

    // Valid company pages have "Jobs at {companyName} |" in the title
    // 404 pages have "Jobs at {BoardName} Companies |" in the title
    const isGenericTitle = title.includes(" Companies |");
    const hasCompanyInTitle = title.startsWith("Jobs at ") && !isGenericTitle;

    return {
      is404: isGenericTitle,
      title,
      hasCompanyInTitle,
    };
  } catch (e) {
    return { is404: false, error: e.message, title: "" };
  }
}

// First verify our detection with known cases
console.log("=== Verification ===\n");
const verifyTests = [
  { base: "https://jobs.lsvp.com", slug: "apna", expect: "valid" },
  { base: "https://jobs.lsvp.com", slug: "sahaj-ai", expect: "404" },
  { base: "https://jobs.lsvp.com", slug: "totally-fake-xyz", expect: "404" },
  { base: "https://careers.peakxv.com", slug: "razorpay", expect: "valid" },
  { base: "https://careers.peakxv.com", slug: "totally-fake-xyz", expect: "404" },
  { base: "https://jobs.nexusvp.com", slug: "allo-health", expect: "valid" },
  { base: "https://jobs.nexusvp.com", slug: "totally-fake-xyz", expect: "404" },
];

let verifyOk = true;
for (const t of verifyTests) {
  const result = await checkCompany(t.base, t.slug);
  const detected = result.is404 ? "404" : "valid";
  const match = detected === t.expect ? "OK" : "MISMATCH";
  if (match !== "OK") verifyOk = false;
  console.log(`  ${match} | expected=${t.expect} detected=${detected} | ${t.slug} | title="${result.title}"`);
  await new Promise(r => setTimeout(r, 200));
}

if (!verifyOk) {
  console.log("\nVerification FAILED - detection method unreliable. Stopping.");
  process.exit(1);
}

console.log("\nVerification PASSED - proceeding with full check.\n");

// Now check all companies
for (const board of boards) {
  console.log(`\n=== ${board.id.toUpperCase()} ===`);
  const data = JSON.parse(readFileSync(board.file, "utf-8"));
  let companies = data.companies;

  // Apply India filters
  const filter = filterData[board.id];
  if (filter) {
    const slugSet = new Set(filter.slugs);
    if (filter.mode === "allowlist") {
      companies = companies.filter((c) => slugSet.has(c.slug));
    } else {
      companies = companies.filter((c) => !slugSet.has(c.slug));
    }
  }

  console.log(`Checking ${companies.length} companies...\n`);

  const broken = [];
  const valid = [];

  for (let i = 0; i < companies.length; i++) {
    const c = companies[i];
    const result = await checkCompany(board.baseUrl, c.slug);

    if (result.is404) {
      broken.push(c);
      console.log(`  BROKEN: ${c.name} (${c.slug})`);
    } else if (result.error) {
      console.log(`  ERROR:  ${c.name} (${c.slug}) - ${result.error}`);
    } else {
      valid.push(c);
    }

    // Rate limit: pause every 5 requests
    if (i % 5 === 4) await new Promise(r => setTimeout(r, 500));
  }

  console.log(`\n  Result: ${valid.length} OK, ${broken.length} BROKEN out of ${companies.length}`);
  if (broken.length > 0) {
    console.log(`  Broken slugs: ${JSON.stringify(broken.map(b => b.slug))}`);
  }
}
