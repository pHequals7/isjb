#!/usr/bin/env node

/**
 * Fetch latest job posting dates for companies in Getro-sourced funds.
 * Writes `latestJobDate` (YYYY-MM-DD) into each company object in the data JSON files.
 *
 * Getro API returns exactly 20 jobs per page regardless of hitsPerPage param.
 * Jobs are returned sorted by created_at desc.
 *
 * For Consider-sourced funds (peakxv, lightspeed, nexus), the API doesn't expose
 * individual job dates, so we skip them.
 *
 * Usage: node scripts/fetch-job-dates.mjs [--fund accel|gc|blume] [--force]
 */

import { readFileSync, writeFileSync } from "fs";
import { join } from "path";

const dataDir = join(process.cwd(), "data");

const getroFunds = [
  { id: "accel", collectionId: "8672" },
  { id: "gc", collectionId: "222" },
  { id: "blume", collectionId: "32333" },
];

// Parse --fund flag
const fundArg = process.argv.find((a, i) => process.argv[i - 1] === "--fund");
const forceRefresh = process.argv.includes("--force");
const fundsToProcess = fundArg
  ? getroFunds.filter((f) => f.id === fundArg)
  : getroFunds;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function fetchJobsPage(collectionId, page) {
  const res = await fetch(
    `https://api.getro.com/api/v2/collections/${collectionId}/search/jobs`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({ hitsPerPage: 20, page, filters: {} }),
    }
  );
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

async function fetchLatestJobDates(collectionId, targetSlugs) {
  if (targetSlugs.length === 0) {
    return new Map();
  }

  const latestBySlug = new Map();
  const remaining = new Set(targetSlugs);
  let page = 0;
  let totalFetched = 0;
  let totalCount = 0;

  while (remaining.size > 0) {
    const payload = await fetchJobsPage(collectionId, page);
    const jobs = payload.results?.jobs || [];
    totalCount = payload.results?.count || 0;

    if (jobs.length === 0) {
      break;
    }

    for (const job of jobs) {
      const slug = job.organization?.slug;
      if (slug && remaining.has(slug)) {
        latestBySlug.set(
          slug,
          new Date(job.created_at * 1000).toISOString().split("T")[0]
        );
        remaining.delete(slug);
      }
    }

    totalFetched += jobs.length;
    process.stdout.write(
      `  Page ${page}: ${totalFetched}/${totalCount} jobs, ${latestBySlug.size} found, ${remaining.size} remaining\r`
    );

    if (totalFetched >= totalCount) {
      break;
    }

    page += 1;
    await sleep(100);
  }

  console.log(
    `\n  Done: ${latestBySlug.size} companies dated, ${remaining.size} not found in jobs`
  );
  return latestBySlug;
}

for (const fund of fundsToProcess) {
  console.log(`\n=== ${fund.id.toUpperCase()} ===`);

  try {
    const filePath = join(dataDir, `${fund.id}.json`);
    const data = JSON.parse(readFileSync(filePath, "utf-8"));

    const targetCompanies = forceRefresh
      ? data.companies
      : data.companies.filter((c) => !c.latestJobDate);
    const targetSlugs = targetCompanies.map((c) => c.slug);
    if (targetSlugs.length === 0) {
      console.log("  All companies already have latestJobDate, skipping");
      continue;
    }
    console.log(
      `  ${targetSlugs.length}/${data.companies.length} companies to fetch dates for`
    );

    const latestDates = await fetchLatestJobDates(fund.collectionId, targetSlugs);

    let updated = 0;
    for (const company of data.companies) {
      const date = latestDates.get(company.slug);
      if (date && company.latestJobDate !== date) {
        company.latestJobDate = date;
        updated++;
      }
    }

    writeFileSync(filePath, JSON.stringify(data, null, 2));
    console.log(`  Updated ${updated}/${data.companies.length} companies with latestJobDate`);
  } catch (err) {
    console.error(`  Error fetching ${fund.id}: ${err.message}`);
  }
}

console.log("\nDone. Run `npm run build` to verify.");
