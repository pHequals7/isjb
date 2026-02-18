#!/usr/bin/env node

import { spawnSync } from "child_process";

const steps = [
  {
    label: "Fetch Getro funds (accel, gc, blume)",
    args: ["scripts/fetch-getro.mjs"],
  },
  {
    label: "Refresh latest job dates for Getro funds",
    args: ["scripts/fetch-job-dates.mjs", "--force"],
  },
  {
    label: "Normalize sectors for Getro funds",
    args: ["scripts/normalize-sectors.mjs", "--funds", "accel,gc,blume"],
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

console.log("\nRefresh complete.");
