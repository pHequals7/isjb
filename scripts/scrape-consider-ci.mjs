#!/usr/bin/env node

import { writeFileSync } from "fs";
import { chromium } from "playwright";

const boards = [
  { id: "lightspeed", baseUrl: "https://jobs.lsvp.com" },
  { id: "peakxv", baseUrl: "https://careers.peakxv.com" },
  { id: "nexus", baseUrl: "https://jobs.nexusvp.com" },
  { id: "bessemer", baseUrl: "https://jobs.bvp.com" },
];

const SHOW_MORE_LABEL = "show more companies";

async function clickShowMore(page) {
  return page.evaluate((label) => {
    const target = label.toLowerCase();
    const candidates = Array.from(document.querySelectorAll("button, a, div, span"));
    const match = candidates.find((node) =>
      node.textContent?.trim().toLowerCase() === target
    );

    if (!match) return false;

    if (match instanceof HTMLElement) {
      match.scrollIntoView({ block: "center", behavior: "instant" });
      match.click();
      return true;
    }

    return false;
  }, SHOW_MORE_LABEL);
}

async function extractCompanies(page, baseUrl) {
  return page.evaluate((base) => {
    function normalizeSlug(href) {
      try {
        const path = new URL(href, window.location.origin).pathname;
        const match = path.match(/^\/jobs\/([^/?#]+)/);
        return match ? match[1] : "";
      } catch {
        return "";
      }
    }

    function bestNameFromCard(card, anchor, slug) {
      const img = card?.querySelector("img[alt]");
      const fromAlt = img?.getAttribute("alt")?.replace(/\s+logo$/i, "").trim();
      if (fromAlt) return fromAlt;

      const anchorText = anchor.textContent?.trim() || "";
      if (anchorText && !/^view\s+[\d,]+\s+open\s+jobs?/i.test(anchorText)) {
        return anchorText;
      }

      return slug;
    }

    function parseJobCount(cardText) {
      const match = cardText.match(/view\s+([\d,]+)\s+open\s+jobs?/i);
      if (!match) return 0;
      return Number.parseInt(match[1].replace(/,/g, ""), 10) || 0;
    }

    const anchors = Array.from(document.querySelectorAll('a[href*="/jobs/"]'));
    const bySlug = new Map();

    for (const anchor of anchors) {
      const slug = normalizeSlug(anchor.href);
      if (!slug || slug === "jobs") continue;

      const card = anchor.closest("article, li, section, div");
      const cardText = card?.textContent || anchor.textContent || "";
      const jobs = parseJobCount(cardText);
      const name = bestNameFromCard(card, anchor, slug);
      const logo = card?.querySelector("img")?.getAttribute("src") || "";

      const current = bySlug.get(slug);
      if (!current) {
        bySlug.set(slug, {
          name,
          slug,
          jobsBoardUrl: `${base}/jobs/${slug}`,
          activeJobCount: jobs,
          domain: "",
          logoUrl: logo,
          sectors: [],
        });
        continue;
      }

      if (!current.name || current.name === current.slug) {
        current.name = name;
      }
      if (!current.logoUrl && logo) {
        current.logoUrl = logo;
      }
      if (jobs > current.activeJobCount) {
        current.activeJobCount = jobs;
      }
    }

    return Array.from(bySlug.values()).sort((a, b) => {
      if (b.activeJobCount !== a.activeJobCount) {
        return b.activeJobCount - a.activeJobCount;
      }
      return a.name.localeCompare(b.name);
    });
  }, baseUrl);
}

async function scrapeBoard(browser, board) {
  const page = await browser.newPage({
    userAgent:
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
  });

  const url = `${board.baseUrl}/companies?officeLocations=India`;
  console.log(`\n=== ${board.id.toUpperCase()} ===`);
  console.log(`Opening ${url}`);

  await page.goto(url, { waitUntil: "domcontentloaded", timeout: 120000 });
  await page.waitForTimeout(2500);

  let iterations = 0;
  let stagnantRounds = 0;
  let previousCount = 0;

  while (iterations < 60 && stagnantRounds < 3) {
    const companies = await extractCompanies(page, board.baseUrl);
    const currentCount = companies.length;

    const clicked = await clickShowMore(page);
    if (!clicked) {
      break;
    }

    await page.waitForTimeout(1800);
    iterations += 1;

    if (currentCount <= previousCount) {
      stagnantRounds += 1;
    } else {
      stagnantRounds = 0;
      previousCount = currentCount;
    }

    console.log(`  Clicked show more (${iterations})`);
  }

  const companies = await extractCompanies(page, board.baseUrl);
  console.log(`  Extracted ${companies.length} companies`);

  const output = {
    board: board.id,
    url,
    companyNames: companies.map((c) => c.name),
    jobCounts: companies.map((c) => c.activeJobCount),
    slugs: companies.map((c) => c.slug),
    logoUrls: companies.map((c) => c.logoUrl),
    snapshotCompanyCount: companies.length,
    htmlSlugCount: companies.length,
    companies,
  };

  const outPath = `data/${board.id}-india-raw.json`;
  writeFileSync(outPath, JSON.stringify(output, null, 2));
  console.log(`  Saved ${outPath}`);

  await page.close();
}

const browser = await chromium.launch({ headless: true });

try {
  for (const board of boards) {
    await scrapeBoard(browser, board);
  }
} finally {
  await browser.close();
}

console.log("\nConsider scrape complete.");
