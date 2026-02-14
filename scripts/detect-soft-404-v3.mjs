// Compare HTML content between valid and invalid Consider company pages
const UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36";

async function fetchHTML(url) {
  const res = await fetch(url, { headers: { "User-Agent": UA } });
  return await res.text();
}

// Approach 1: Check if the board's parent slug can be found in HTML
console.log("=== Checking board HTML for parent slug / board config ===\n");

const boards = [
  { id: "peakxv", url: "https://careers.peakxv.com" },
  { id: "lightspeed", url: "https://jobs.lsvp.com" },
];

for (const board of boards) {
  const html = await fetchHTML(board.url);

  // Look for board configuration in script tags
  const scriptMatches = [...html.matchAll(/<script[^>]*>([\s\S]*?)<\/script>/g)];
  for (const m of scriptMatches) {
    const content = m[1].trim();
    if (content.length > 50 && content.length < 5000 && !content.includes("gtag")) {
      console.log(`${board.id} script (${content.length} chars):`);
      console.log(content.slice(0, 500));
      console.log("---");
    }
  }

  // Look for board slug in meta tags or data attributes
  const boardSlug = html.match(/boardSlug['":\s]+['"]([^'"]+)['"]/);
  const parentSlug = html.match(/parentSlug['":\s]+['"]([^'"]+)['"]/);
  const orgSlug = html.match(/orgSlug['":\s]+['"]([^'"]+)['"]/);
  const boardId = html.match(/boardId['":\s]+['"]([^'"]+)['"]/);

  console.log(`${board.id}: boardSlug=${boardSlug?.[1]}, parentSlug=${parentSlug?.[1]}, orgSlug=${orgSlug?.[1]}, boardId=${boardId?.[1]}\n`);
}

// Approach 2: Detailed HTML diff between valid and 404
console.log("\n=== Detailed HTML comparison ===\n");

const validHTML = await fetchHTML("https://jobs.lsvp.com/jobs/apna");
const invalidHTML = await fetchHTML("https://jobs.lsvp.com/jobs/sahaj-ai");

// Split into lines and find differences
const validLines = validHTML.split("\n");
const invalidLines = invalidHTML.split("\n");

console.log(`Valid page: ${validLines.length} lines, ${validHTML.length} chars`);
console.log(`Invalid page: ${invalidLines.length} lines, ${invalidHTML.length} chars`);
console.log();

// Find lines that differ
const maxLen = Math.max(validLines.length, invalidLines.length);
for (let i = 0; i < maxLen; i++) {
  if (validLines[i] !== invalidLines[i]) {
    console.log(`Line ${i + 1} differs:`);
    console.log(`  VALID:   ${(validLines[i] || "").slice(0, 200)}`);
    console.log(`  INVALID: ${(invalidLines[i] || "").slice(0, 200)}`);
  }
}

// Approach 3: Check the Consider API with parent filter
console.log("\n\n=== Testing Consider API with parent/board filters ===\n");

const filterTests = [
  { query: { parent: "lightspeed" } },
  { query: { parent: "lsvp" } },
  { query: { parent: "lightspeed-venture-partners" } },
  { query: { boards: ["lsvp"] } },
  { query: { board: "lsvp" } },
];

for (const test of filterTests) {
  const res = await fetch("https://jobs.lsvp.com/api-boards/search-companies", {
    method: "POST",
    headers: { "Content-Type": "application/json", "User-Agent": UA },
    body: JSON.stringify({ query: test.query, page: 1, per_page: 3 }),
  });
  const data = await res.json();
  const count = data.totalCount || data.total || "?";
  const first = data.companies?.[0];
  console.log(`query=${JSON.stringify(test.query)} -> total=${count}, first=${first?.slug} (parents=${JSON.stringify(first?.parentSlugs)})`);
}
