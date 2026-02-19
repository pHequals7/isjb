# Indian Startup Jobs Board (ISJB)

![ISJB banner](public/og-image.png)

A curated jobs board for India-focused startups backed by top venture funds.

ISJB aggregates portfolio company listings from multiple VC job boards into a single, fast, searchable interface so candidates do not need to check each fund site one by one.

## Why ISJB

- Centralized discovery for startup roles across major India-focused funds.
- Cleaner filtering by sector and company search.
- Regular data refreshes to reduce stale listings.
- Open-source workflow so anyone can improve coverage and quality.

## Current Coverage

ISJB currently tracks companies from these funds:

- PeakXV Partners
- Accel
- Lightspeed
- Nexus Venture Partners
- General Catalyst
- Blume Ventures
- Bessemer Venture Partners

Data is sourced from public portfolio job boards powered by Getro or Consider.

## Features

- Fund-wise sections with sticky navigation.
- Search by company name.
- Sector filters with counts.
- Freshness indicators (`latestJobDate`-based staleness logic).
- SEO-ready metadata, OG image, sitemap, and robots config.

## Project Structure

```text
src/
  app/                App router pages, metadata, global styles
  components/         UI sections and cards
  config/             VC fund config
  lib/                Types + data loading/filter logic

data/
  *.json              Fund data, filters, sector maps, overrides

scripts/
  fetch-getro.mjs         Getro refresh pipeline
  fetch-job-dates.mjs     latestJobDate enrichment (Getro funds)
  normalize-sectors.mjs   Sector normalization
  report-data-delta.mjs   Before/after change report
  refresh-getro-ci.mjs    CI refresh orchestration

docs/
  data-refresh-sop.md
```

## Getting Started

### Prerequisites

- Node.js 20+
- npm

### Install

```bash
npm ci
```

### Run locally

```bash
npm run dev
```

Open `http://localhost:3000`.

### Build

```bash
npm run build
```

## Data Refresh

### Automated (GitHub Actions)

Workflow: `.github/workflows/data-refresh.yml`

- Runs weekly: Monday 06:00 UTC.
- Supports manual dispatch from the Actions tab.
- Refreshes Getro funds (`accel`, `gc`, `blume`) in CI.
- Creates/updates a PR when tracked data changes.
- Attaches a delta report with company/job count diffs.

### Manual refresh (local)

Getro refresh path:

```bash
node scripts/refresh-getro-ci.mjs
```

Full refresh SOP (including Consider pipeline and caveats):

- See `docs/data-refresh-sop.md`

## Contributing

Contributions are welcome and encouraged.

### Quick contribution flow

1. Fork the repo.
2. Create a feature branch.
3. Make focused changes.
4. Run checks locally with `npm run build`.
5. Open a PR with a clear summary and screenshots for UI updates.

### High-impact areas

- Improve fund coverage and onboarding scripts.
- Reduce stale listings and improve refresh speed.
- Improve logo quality and company metadata consistency.
- Improve filtering UX and mobile usability.
- Add tests around data transformation and validation scripts.

### Data quality notes

- `data/india-filter.json` is used to exclude non-Indian/global edge cases.
- `data/indian-origin-override.json` allows vetted Indian-origin companies.
- Sector normalization is handled via `data/sector-map.json`.

## Roadmap

- CI-native automation for all Consider-based funds.
- Better persistence for manual overrides during refreshes.
- Shareable filter URLs and richer job freshness signals.

## Acknowledgements

Built with open startup ecosystem data and community feedback.

If this project helps you, star the repo and contribute improvements.
