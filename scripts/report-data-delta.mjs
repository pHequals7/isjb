#!/usr/bin/env node

import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import path from "path";

function parseArgs(argv) {
  const args = {};
  for (let i = 2; i < argv.length; i++) {
    const token = argv[i];
    if (!token.startsWith("--")) continue;
    const key = token.slice(2);
    const next = argv[i + 1];
    if (!next || next.startsWith("--")) {
      args[key] = "true";
      continue;
    }
    args[key] = next;
    i += 1;
  }
  return args;
}

function toCount(value) {
  return Number.isFinite(value) ? Number(value) : 0;
}

function loadCompanies(rootDir, fundId) {
  const filePath = path.join(rootDir, `${fundId}.json`);
  if (!existsSync(filePath)) {
    throw new Error(`Missing data file: ${filePath}`);
  }

  const parsed = JSON.parse(readFileSync(filePath, "utf-8"));
  const companies = Array.isArray(parsed.companies) ? parsed.companies : [];
  return companies.map((company) => ({
    slug: company.slug,
    name: company.name || company.slug,
    activeJobCount: toCount(company.activeJobCount),
  }));
}

function summarizeFund(fundId, beforeCompanies, afterCompanies) {
  const beforeBySlug = new Map(beforeCompanies.map((c) => [c.slug, c]));
  const afterBySlug = new Map(afterCompanies.map((c) => [c.slug, c]));

  const beforeSlugs = new Set(beforeBySlug.keys());
  const afterSlugs = new Set(afterBySlug.keys());

  const added = [...afterSlugs]
    .filter((slug) => !beforeSlugs.has(slug))
    .sort((a, b) => a.localeCompare(b));
  const removed = [...beforeSlugs]
    .filter((slug) => !afterSlugs.has(slug))
    .sort((a, b) => a.localeCompare(b));

  const movers = [...afterSlugs]
    .filter((slug) => beforeSlugs.has(slug))
    .map((slug) => {
      const before = beforeBySlug.get(slug);
      const after = afterBySlug.get(slug);
      const delta = after.activeJobCount - before.activeJobCount;
      return {
        slug,
        name: after.name || before.name || slug,
        beforeJobs: before.activeJobCount,
        afterJobs: after.activeJobCount,
        delta,
      };
    })
    .filter((item) => item.delta !== 0)
    .sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta) || a.name.localeCompare(b.name));

  const beforeCompaniesCount = beforeCompanies.length;
  const afterCompaniesCount = afterCompanies.length;
  const beforeJobs = beforeCompanies.reduce((sum, c) => sum + c.activeJobCount, 0);
  const afterJobs = afterCompanies.reduce((sum, c) => sum + c.activeJobCount, 0);

  return {
    fundId,
    before: { companies: beforeCompaniesCount, jobs: beforeJobs },
    after: { companies: afterCompaniesCount, jobs: afterJobs },
    delta: {
      companies: afterCompaniesCount - beforeCompaniesCount,
      jobs: afterJobs - beforeJobs,
    },
    added,
    removed,
    movers,
    changed:
      beforeCompaniesCount !== afterCompaniesCount ||
      beforeJobs !== afterJobs ||
      added.length > 0 ||
      removed.length > 0 ||
      movers.length > 0,
  };
}

function signed(value) {
  return value >= 0 ? `+${value}` : `${value}`;
}

function renderMarkdown(report) {
  const lines = [];
  lines.push("# Data Refresh Delta Report");
  lines.push("");
  lines.push(`Generated: ${report.generatedAt}`);
  lines.push(`Monitored funds: ${report.funds.map((f) => `\`${f.fundId}\``).join(", ")}`);
  lines.push("");
  lines.push("## Summary");
  lines.push("");
  lines.push("| Fund | Companies (before -> after) | Jobs (before -> after) | Delta |");
  lines.push("| --- | --- | --- | --- |");
  for (const fund of report.funds) {
    lines.push(
      `| \`${fund.fundId}\` | ${fund.before.companies} -> ${fund.after.companies} | ${fund.before.jobs} -> ${fund.after.jobs} | companies ${signed(fund.delta.companies)}, jobs ${signed(fund.delta.jobs)} |`
    );
  }

  lines.push("");
  lines.push(
    `Totals: companies ${report.totals.before.companies} -> ${report.totals.after.companies} (${signed(
      report.totals.delta.companies
    )}), jobs ${report.totals.before.jobs} -> ${report.totals.after.jobs} (${signed(
      report.totals.delta.jobs
    )}).`
  );
  lines.push("");

  if (!report.hasChanges) {
    lines.push("No data changes detected.");
    lines.push("");
    return lines.join("\n");
  }

  lines.push("## Changes");
  lines.push("");

  for (const fund of report.funds.filter((f) => f.changed)) {
    lines.push(`### ${fund.fundId}`);
    lines.push("");

    if (fund.added.length > 0) {
      lines.push(`Added companies (${fund.added.length}): ${fund.added.map((slug) => `\`${slug}\``).join(", ")}`);
      lines.push("");
    }

    if (fund.removed.length > 0) {
      lines.push(
        `Removed companies (${fund.removed.length}): ${fund.removed
          .map((slug) => `\`${slug}\``)
          .join(", ")}`
      );
      lines.push("");
    }

    if (fund.movers.length > 0) {
      lines.push("Top job count movers:");
      lines.push("");
      lines.push("| Company | Slug | Before | After | Delta |");
      lines.push("| --- | --- | --- | --- | --- |");
      for (const mover of fund.movers.slice(0, 10)) {
        lines.push(
          `| ${mover.name} | \`${mover.slug}\` | ${mover.beforeJobs} | ${mover.afterJobs} | ${signed(
            mover.delta
          )} |`
        );
      }
      lines.push("");
    }
  }

  return lines.join("\n");
}

const args = parseArgs(process.argv);
const beforeDir = args["before-dir"];
const afterDir = args["after-dir"];
const outDir = args["out-dir"] || "artifacts";
const funds = (args.funds || "accel,gc,blume")
  .split(",")
  .map((f) => f.trim())
  .filter(Boolean);

if (!beforeDir || !afterDir) {
  console.error(
    "Usage: node scripts/report-data-delta.mjs --before-dir <path> --after-dir <path> [--funds accel,gc,blume] [--out-dir artifacts]"
  );
  process.exit(1);
}

if (funds.length === 0) {
  console.error("No funds specified. Pass --funds accel,gc,blume.");
  process.exit(1);
}

const fundReports = funds.map((fundId) =>
  summarizeFund(fundId, loadCompanies(beforeDir, fundId), loadCompanies(afterDir, fundId))
);

const totals = fundReports.reduce(
  (acc, fund) => {
    acc.before.companies += fund.before.companies;
    acc.before.jobs += fund.before.jobs;
    acc.after.companies += fund.after.companies;
    acc.after.jobs += fund.after.jobs;
    return acc;
  },
  {
    before: { companies: 0, jobs: 0 },
    after: { companies: 0, jobs: 0 },
  }
);
totals.delta = {
  companies: totals.after.companies - totals.before.companies,
  jobs: totals.after.jobs - totals.before.jobs,
};

const report = {
  generatedAt: new Date().toISOString(),
  funds: fundReports,
  totals,
  hasChanges: fundReports.some((f) => f.changed),
};

const markdown = renderMarkdown(report);
mkdirSync(outDir, { recursive: true });

const jsonPath = path.join(outDir, "data-delta.json");
const mdPath = path.join(outDir, "data-delta.md");

writeFileSync(jsonPath, JSON.stringify(report, null, 2));
writeFileSync(mdPath, markdown);

console.log(`Wrote ${jsonPath}`);
console.log(`Wrote ${mdPath}`);
