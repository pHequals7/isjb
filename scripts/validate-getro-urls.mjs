// Validate Getro-sourced company URLs (Accel, GC)
// These use getro.com boards which return proper HTTP status codes
import { readFileSync } from "fs";

const UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36";

const boards = [
  { id: "accel", file: "data/accel.json" },
  { id: "gc", file: "data/gc.json" },
];

for (const board of boards) {
  const data = JSON.parse(readFileSync(board.file, "utf-8"));
  console.log(`\n=== ${board.id.toUpperCase()} (${data.companies.length} companies) ===`);

  const broken = [];
  for (let i = 0; i < data.companies.length; i++) {
    const c = data.companies[i];
    try {
      const res = await fetch(c.jobsBoardUrl, {
        headers: { "User-Agent": UA },
        redirect: "follow",
      });
      if (res.status >= 400) {
        broken.push({ ...c, status: res.status });
        console.log(`  ${res.status}: ${c.name} (${c.slug}) -> ${c.jobsBoardUrl}`);
      }
    } catch (e) {
      broken.push({ ...c, error: e.message });
      console.log(`  ERROR: ${c.name} - ${e.message}`);
    }

    if (i % 10 === 9) await new Promise(r => setTimeout(r, 500));
  }

  console.log(`  Result: ${data.companies.length - broken.length} OK, ${broken.length} BROKEN`);
}
