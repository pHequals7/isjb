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
 * Usage: node scripts/fetch-job-dates.mjs [--fund accel|gc|blume]
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

// Fetch pages in parallel batches for speed
async function fetchLatestJobDates(collectionId, targetSlugs) {
  const latestBySlug = new Map();
  const remaining = new Set(targetSlugs);
  let totalFetched = 0;

  // First, get total count
  const first = await fetchJobsPage(collectionId, 0);
  const totalCount = first.results?.count || 0;
  const firstJobs = first.results?.jobs || [];
  for (const job of firstJobs) {
    const slug = job.organization?.slug;
    if (slug && remaining.has(slug)) {
      latestBySlug.set(slug, new Date(job.created_at * 1000).toISOString().split("T")[0]);
      remaining.delete(slug);
    }
  }
  totalFetched += firstJobs.length;

  const totalPages = Math.ceil(totalCount / 20);
  const BATCH_SIZE = 10; // concurrent requests

  for (let batchStart = 1; batchStart < totalPages && remaining.size > 0; batchStart += BATCH_SIZE) {
    const batchEnd = Math.min(batchStart + BATCH_SIZE, totalPages);
    const promises = [];
    for (let p = batchStart; p < batchEnd; p++) {
      promises.push(fetchJobsPage(collectionId, p));
    }

    const results = await Promise.allSettled(promises);
    for (const result of results) {
      if (result.status !== "fulfilled") continue;
      const jobs = result.value.results?.jobs || [];
      for (const job of jobs) {
        const slug = job.organization?.slug;
        if (slug && remaining.has(slug)) {
          latestBySlug.set(slug, new Date(job.created_at * 1000).toISOString().split("T")[0]);
          remaining.delete(slug);
        }
      }
      totalFetched += jobs.length;
    }

    process.stdout.write(
      `  Pages ${batchStart}-${batchEnd}: ${totalFetched}/${totalCount} jobs, ${latestBySlug.size} found, ${remaining.size} remaining\r`
    );

    await sleep(100); // Brief pause between batches to be polite
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

    // Check if data already has latestJobDate from a prior run
    const alreadyDated = data.companies.filter((c) => c.latestJobDate).length;
    if (alreadyDated > 0) {
      console.log(`  ${alreadyDated}/${data.companies.length} already have dates, skipping`);
      continue;
    }

    const targetSlugs = data.companies.map((c) => c.slug);
    console.log(`  ${targetSlugs.length} companies to find dates for`);

    const latestDates = await fetchLatestJobDates(fund.collectionId, targetSlugs);

    let updated = 0;
    for (const company of data.companies) {
      const date = latestDates.get(company.slug);
      if (date) {
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
