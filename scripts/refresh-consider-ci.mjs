#!/usr/bin/env node

import { spawnSync } from "child_process";

const steps = [
  {
    label: "Scrape Consider boards (peakxv, lightspeed, nexus, bessemer)",
    args: ["scripts/scrape-consider-ci.mjs"],
  },
  {
    label: "Rebuild Consider data files",
    args: ["scripts/rebuild-consider-data.mjs"],
  },
  {
    label: "Assign sectors for Consider funds",
    args: ["scripts/assign-consider-sectors.mjs"],
  },
  {
    label: "Normalize sectors for Consider funds",
    args: ["scripts/normalize-sectors.mjs", "--funds", "peakxv,lightspeed,nexus,bessemer"],
  },
];

function runStep(step) {
  console.log(`\n=== ${step.label} ===`);
  const result = spawnSync(process.execPath, step.args, {
    stdio: "inherit",
  });

  if (result.status !== 0) {
    console.error(`Step failed: ${step.label}`);
    process.exit(result.status ?? 1);
  }
}

for (const step of steps) {
  runStep(step);
}

console.log("\nConsider refresh complete.");
