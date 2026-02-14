// Quick validation of new Consider company URLs
import { readFileSync } from "fs";
const UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36";

const boards = [
  { id: "lightspeed", baseUrl: "https://jobs.lsvp.com" },
  { id: "peakxv", baseUrl: "https://careers.peakxv.com" },
  { id: "nexus", baseUrl: "https://jobs.nexusvp.com" },
];

for (const board of boards) {
  const data = JSON.parse(readFileSync(`data/${board.id}.json`, "utf-8"));
  console.log(`\n=== ${board.id.toUpperCase()} (${data.companies.length}) ===`);

  const broken = [];
  for (let i = 0; i < data.companies.length; i++) {
    const c = data.companies[i];
    try {
      const res = await fetch(`${board.baseUrl}/jobs/${c.slug}`, {
        headers: { "User-Agent": UA },
      });
      const html = await res.text();
      const titleMatch = html.match(/<title>([^<]+)<\/title>/);
      const title = titleMatch?.[1] || "";
      if (title.includes(" Companies |")) {
        broken.push(c.slug);
        console.log(`  BROKEN: ${c.name} (${c.slug})`);
      }
    } catch (e) {
      console.log(`  ERROR: ${c.name} - ${e.message}`);
    }
    if (i % 5 === 4) await new Promise(r => setTimeout(r, 500));
  }

  console.log(`  ${data.companies.length - broken.length} OK, ${broken.length} BROKEN`);
  if (broken.length > 0) console.log(`  Broken: ${JSON.stringify(broken)}`);
}
