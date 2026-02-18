// Normalize sector names across all data files using sector-map.json
import { readFileSync, writeFileSync } from "fs";

const sectorMap = JSON.parse(readFileSync("data/sector-map.json", "utf-8"));
delete sectorMap._comment;

const defaultFiles = [
  "accel",
  "gc",
  "peakxv",
  "lightspeed",
  "nexus",
  "blume",
  "bessemer",
];
const fundsArg = process.argv.find((arg, idx) => process.argv[idx - 1] === "--funds");
const files = fundsArg
  ? fundsArg
      .split(",")
      .map((f) => f.trim())
      .filter(Boolean)
  : defaultFiles;

if (files.length === 0) {
  console.error("No funds provided. Use --funds accel,gc,blume or omit for all.");
  process.exit(1);
}

const unmapped = new Set();

for (const f of files) {
  const path = `data/${f}.json`;
  const data = JSON.parse(readFileSync(path, "utf-8"));

  for (const company of data.companies) {
    if (!company.sectors || company.sectors.length === 0) continue;

    const normalized = new Set();
    for (const raw of company.sectors) {
      const mapped = sectorMap[raw];
      if (mapped) {
        normalized.add(mapped);
      } else {
        unmapped.add(raw);
      }
    }
    company.sectors = [...normalized].sort();
  }

  writeFileSync(path, JSON.stringify(data, null, 2));
  console.log(`Normalized ${f}.json`);
}

if (unmapped.size > 0) {
  console.log("\nUnmapped sectors (not in sector-map.json):");
  for (const s of [...unmapped].sort()) {
    console.log(`  - ${s}`);
  }
}

// Print sector distribution
const sectorCounts = {};
for (const f of files) {
  const data = JSON.parse(readFileSync(`data/${f}.json`, "utf-8"));
  for (const c of data.companies) {
    for (const s of c.sectors || []) {
      sectorCounts[s] = (sectorCounts[s] || 0) + 1;
    }
  }
}
console.log("\nNormalized sector distribution:");
const sorted = Object.entries(sectorCounts).sort((a, b) => b[1] - a[1]);
for (const [name, count] of sorted) {
  console.log(`  ${count.toString().padStart(3)} | ${name}`);
}
