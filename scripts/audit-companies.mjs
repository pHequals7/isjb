#!/usr/bin/env node

/**
 * Audit script: flags companies that may not be Indian-origin.
 *
 * Cross-references all 6 data files against:
 *   - indian-origin-override.json  (already vetted → skip)
 *   - india-filter.json denylists  (already excluded → skip)
 *   - defunct-companies.json       (already filtered → skip)
 *
 * Flags remaining companies whose domain is not .in or whose name
 * suggests a non-Indian origin.
 *
 * Usage: node scripts/audit-companies.mjs
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dataDir = path.join(__dirname, "..", "data");

const funds = ["accel", "gc", "blume", "peakxv", "lightspeed", "nexus"];

// Load override allowlist
const overrides = JSON.parse(
  fs.readFileSync(path.join(dataDir, "indian-origin-override.json"), "utf-8")
);
const overrideSet = new Set(overrides.slugs);

// Load india-filter denylists
const indiaFilter = JSON.parse(
  fs.readFileSync(path.join(dataDir, "india-filter.json"), "utf-8")
);
const deniedSlugs = new Set();
for (const [, filter] of Object.entries(indiaFilter)) {
  if (filter.mode === "denylist") {
    for (const slug of filter.slugs) deniedSlugs.add(slug);
  }
}

// Load defunct
const defunct = JSON.parse(
  fs.readFileSync(path.join(dataDir, "defunct-companies.json"), "utf-8")
);
const defunctSet = new Set(defunct.companies.map((c) => c.slug));

// Non-Indian domain TLDs / patterns
const indianDomainPatterns = [".in", ".co.in", ".org.in", ".net.in"];

function isLikelyIndianDomain(domain) {
  if (!domain) return null; // unknown
  return indianDomainPatterns.some((p) => domain.endsWith(p));
}

// Non-Indian name patterns (rough heuristic)
const nonIndianNamePatterns = [
  /^thought/i, /^crowd/i, /^new relic/i, /^stripe/i, /^atlassian/i,
];

const flagged = [];
const seen = new Set();

for (const fundId of funds) {
  const filePath = path.join(dataDir, `${fundId}.json`);
  if (!fs.existsSync(filePath)) continue;

  const data = JSON.parse(fs.readFileSync(filePath, "utf-8"));

  for (const company of data.companies) {
    const { slug, name, domain, activeJobCount } = company;

    // Skip if already handled
    if (overrideSet.has(slug)) continue;
    if (deniedSlugs.has(slug)) continue;
    if (defunctSet.has(slug)) continue;
    if (seen.has(slug)) continue;
    seen.add(slug);

    const isIndianDomain = isLikelyIndianDomain(domain);
    const nameMatch = nonIndianNamePatterns.some((p) => p.test(name));

    // Flag if domain is clearly not .in OR name matches non-Indian patterns
    // Also flag if domain is unknown (null) for manual review
    if (isIndianDomain === false || nameMatch || !domain) {
      flagged.push({
        slug,
        name,
        domain: domain || "(none)",
        fund: fundId,
        activeJobCount: activeJobCount ?? 0,
        reason: [
          isIndianDomain === false && "non-.in domain",
          nameMatch && "name pattern suggests non-Indian",
          !domain && "no domain listed",
        ]
          .filter(Boolean)
          .join("; "),
      });
    }
  }
}

// Sort by fund, then name
flagged.sort((a, b) => a.fund.localeCompare(b.fund) || a.name.localeCompare(b.name));

const report = {
  generatedAt: new Date().toISOString(),
  totalFlagged: flagged.length,
  companies: flagged,
};

const outPath = path.join(dataDir, "audit-report.json");
fs.writeFileSync(outPath, JSON.stringify(report, null, 2));

console.log(`Audit complete. ${flagged.length} companies flagged.`);
console.log(`Report written to: ${outPath}`);
console.log();

// Print summary
for (const fund of funds) {
  const fundCompanies = flagged.filter((c) => c.fund === fund);
  if (fundCompanies.length > 0) {
    console.log(`\n=== ${fund.toUpperCase()} (${fundCompanies.length} flagged) ===`);
    for (const c of fundCompanies) {
      console.log(`  ${c.name} (${c.slug}) — ${c.domain} — jobs: ${c.activeJobCount} — ${c.reason}`);
    }
  }
}
