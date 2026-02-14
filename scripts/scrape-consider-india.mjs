// Scrape Consider boards' India-filtered company pages using agent-browser
// URL pattern: {baseUrl}/companies?officeLocations=India
import { execSync } from "child_process";
import { writeFileSync, readFileSync } from "fs";

const boards = [
  { id: "lightspeed", baseUrl: "https://jobs.lsvp.com" },
  { id: "peakxv", baseUrl: "https://careers.peakxv.com" },
  { id: "nexus", baseUrl: "https://jobs.nexusvp.com" },
];

function run(cmd) {
  try {
    return execSync(cmd, { encoding: "utf-8", timeout: 30000 }).trim();
  } catch (e) {
    return e.stdout?.trim() || e.message;
  }
}

for (const board of boards) {
  console.log(`\n=== ${board.id.toUpperCase()} ===`);
  const url = `${board.baseUrl}/companies?officeLocations=India`;

  // Navigate and wait
  run(`agent-browser open "${url}"`);
  run(`agent-browser wait 3000`);

  // Click "Show more companies" until all are loaded
  let attempts = 0;
  while (attempts < 20) {
    const snapshot = run(`agent-browser snapshot -i`);
    if (!snapshot.includes("Show more companies")) break;
    run(`agent-browser find text "Show more companies" click`);
    run(`agent-browser wait 2000`);
    attempts++;
    console.log(`  Loaded more... (attempt ${attempts})`);
  }

  // Now get the full page snapshot to extract company data
  const fullSnapshot = run(`agent-browser snapshot -c`);

  // Extract company names and job counts from snapshot
  // Pattern: company cards have "XYZ logo" and "View N open jobs"
  const logoPattern = /link "(.+?) logo"/g;
  const jobPattern = /link "View ([\d,]+) open jobs?"/g;

  const companies = [];
  const logos = [...fullSnapshot.matchAll(logoPattern)].map((m) => m[1]);
  const jobs = [...fullSnapshot.matchAll(jobPattern)].map((m) =>
    parseInt(m[1].replace(/,/g, ""))
  );

  console.log(`  Found ${logos.length} companies in snapshot`);

  // Get each company's URL from the page
  // The snapshot includes links to company pages
  // Let me get the HTML source to extract slugs and logo URLs
  const pageSource = run(`agent-browser get html "body"`);

  // Parse company cards from HTML
  // Company cards have links to /jobs/{slug} and img tags with logo URLs
  const cardPattern =
    /href="\/jobs\/([^"]+)"[^>]*>[\s\S]*?<img[^>]*src="([^"]*)"[^>]*>/g;
  let match;
  const slugLogoMap = new Map();
  const htmlStr = pageSource;

  // Better approach: extract from company card anchors
  // Each company card links to /jobs/{slug} and has an img with the logo
  const companyLinks = [
    ...htmlStr.matchAll(/href="\/jobs\/([^"#]+?)(?:#[^"]*)?"/g),
  ];
  const uniqueSlugs = [...new Set(companyLinks.map((m) => m[1]))];

  // Extract logo URLs (CloudFront CDN images)
  const imgPattern =
    /src="(https:\/\/[^"]*(?:cloudfront|consider|cdn)[^"]*)"[^>]*>/gi;
  const imgUrls = [...htmlStr.matchAll(imgPattern)].map((m) => m[1]);

  console.log(`  Found ${uniqueSlugs.length} unique slugs from HTML`);
  console.log(`  Found ${imgUrls.length} logo image URLs`);
  console.log(`  First 5 slugs: ${uniqueSlugs.slice(0, 5).join(", ")}`);

  // Save raw data for further processing
  writeFileSync(
    `data/${board.id}-india-raw.json`,
    JSON.stringify(
      {
        board: board.id,
        url,
        companyNames: logos,
        jobCounts: jobs,
        slugs: uniqueSlugs,
        logoUrls: imgUrls,
        snapshotCompanyCount: logos.length,
        htmlSlugCount: uniqueSlugs.length,
      },
      null,
      2
    )
  );
  console.log(`  Saved raw data to data/${board.id}-india-raw.json`);
}

run(`agent-browser close`);
console.log("\nDone. Now run the processing script to update data files.");
