# ISJB v2 Session Log — 2026-02-14

## Project

Indian Startup Jobs Board (ISJB) — Next.js 16.1.6, React 19, Tailwind CSS v4, shadcn/ui, TypeScript.
Aggregates job listings from 5 VC fund portfolio job boards into a single page.

## Data Sources

| Fund | Platform | API | Data File |
|------|----------|-----|-----------|
| PeakXV Partners | Consider | `careers.peakxv.com` | `data/peakxv.json` |
| Accel | Getro | `api.getro.com/api/v2/collections/accel/search/companies` | `data/accel.json` |
| Lightspeed | Consider | `jobs.lsvp.com` | `data/lightspeed.json` |
| Nexus VP | Consider | `jobs.nexusvp.com` | `data/nexus.json` |
| General Catalyst | Getro | `api.getro.com/api/v2/collections/general-catalyst/search/companies` | `data/gc.json` |

## What Was Done

### 1. India Filtering

**Problem**: Accel (404 companies), GC (365), Lightspeed (60) are global funds — data included worldwide companies.

**Getro funds (Accel, GC)**: Updated `scripts/fetch-getro.mjs` to filter by `locations` field containing "India" + `data/indian-origin-override.json` (60 slugs for Indian-origin companies HQ'd abroad like Freshworks, Postman). Accel: 404→73. GC: 365→15.

**Consider funds (PeakXV, Lightspeed, Nexus)**: Consider's `search-companies` API ignores all filter params — always returns all 34,760 global companies. Used `agent-browser` to scrape `{baseUrl}/companies?officeLocations=India` which applies client-side India location filter. Then excluded non-Indian companies (US/SEA companies with India offices) via denylist in rebuild script.

**Runtime filtering**: `data/india-filter.json` contains denylists for Accel (4 slugs) and GC (4 slugs). Applied in `src/lib/data.ts` at load time. Consider data is pre-filtered at scrape time.

### 2. Company Logos

**Getro funds**: `logo_url` field extracted from API → Getro CDN URLs (`cdn.getro.com`). 100% coverage.

**Consider funds**: Logo URLs scraped from board pages via `agent-browser` → CloudFront CDN URLs (`dzh2zima160vx.cloudfront.net`). 100% coverage.

**Fallback chain** in `company-card.tsx`: `logoUrl` → Google Favicons API (`google.com/s2/favicons?domain={domain}&sz=128`) → letter avatar.

### 3. Soft 404 Detection

**Problem**: Consider boards are React SPAs — return HTTP 200 for all URLs including nonexistent companies. 404 is rendered client-side only.

**Solution found**: `<title>` tag differs:
- Valid: `Jobs at {companyName} | {BoardName}`
- Soft 404: `Jobs at {BoardName} Companies | {BoardName}`

Script: `scripts/validate-consider-urls.mjs`. Detected and removed 15 broken URLs (1 PeakXV, 11 Lightspeed, 3 Nexus).

**Other approaches tried and failed**:
- HTTP status code: always 200
- `boards-404` CSS class in `/jobs/{slug}` HTML: never present (client-side only)
- `/api-boards/company-info/{slug}`: returns `boards-404` for ALL slugs including valid ones
- Hydration route data (`__staticRouterHydrationData`): identical for valid and invalid pages
- Consider API `search` parameter: doesn't support exact slug lookup

### 4. Zero-Job Filtering

Companies with `activeJobCount === 0` filtered out in `src/lib/data.ts`. Dropped 79 companies.

### 5. Frontend Design Polish

- **Font**: Geist Sans applied via `font-sans` on body with OpenType features `ss01, ss02, cv01`
- **Color**: Warm off-white background `oklch(0.988 0.002 90)`, deep navy foreground `oklch(0.16 0.01 260)`
- **Header**: Large title (60px desktop), editorial kicker with wide tracking, generous padding
- **Stats**: Geist Mono numbers at 48-60px, uppercase labels
- **Company cards**: Vertical layout, 56px logos centered, 5-col grid, subtle shadow with lift-on-hover
- **Nav bar**: Sticky, frosted glass backdrop-blur, rounded-lg pills, IntersectionObserver active state
- **Sections**: VC logo + vertical divider + stats, "View all →" link

## Final Numbers

| Fund | Companies | Logos | Jobs |
|------|-----------|-------|------|
| PeakXV | 69 | 69 | 1,935 |
| Accel | 73 | 73 | 1,365 |
| Lightspeed | 43 | 43 | 1,191 |
| Nexus | 42 | 42 | 604 |
| GC | 15 | 15 | 186 |
| **Total** | **242** | **242** | **5,281** |

## Key Files

```
src/
  app/
    layout.tsx          — Geist font import, CSS variables
    globals.css         — Color palette, font config, smooth scroll
    page.tsx            — Main page: loads funds, renders sections
  lib/
    data.ts             — Data loading + India filter + zero-job filter
    types.ts            — Company interface (includes logoUrl)
  config/
    vc-funds.ts         — Fund configs (id, name, logoPath, baseUrl)
  components/
    header.tsx          — Dark header with title + subtitle
    stats-banner.tsx    — 3-stat grid (VCs, Companies, Jobs)
    vc-nav-bar.tsx      — Sticky nav, IntersectionObserver, scroll-to
    vc-fund-section.tsx — Section per fund with logo + company grid
    company-card.tsx    — Card with logo fallback chain
    footer.tsx          — Simple footer

data/
  peakxv.json           — 112 companies (69 after zero-job filter)
  accel.json            — 77 companies (73 after denylist)
  lightspeed.json       — 65 companies (43 after zero-job filter)
  nexus.json            — 56 companies (42 after zero-job filter)
  gc.json               — 19 companies (15 after denylist)
  india-filter.json     — Denylists for Accel (4) and GC (4)
  indian-origin-override.json — 60 slugs always included in Getro fetches

scripts/
  fetch-getro.mjs       — Fetch Accel/GC from Getro API with India filter
  scrape-consider-india.mjs — Scrape Consider boards with agent-browser
  rebuild-consider-data.mjs — Build Consider JSON from scraped data
  validate-consider-urls.mjs — Soft 404 detection via <title> tag
  validate-new-data.mjs — Validate all URLs post-rebuild
  check-consider-urls.mjs — Earlier URL checker (superseded)
  check-hydration.mjs   — Hydration data debugger (superseded)
  detect-soft-404*.mjs  — Soft 404 investigation scripts (superseded)
  fetch-consider*.mjs   — Earlier Consider fetchers (superseded)
```

## Consider API Notes

- `POST {baseUrl}/api-boards/search-companies` — returns ALL 34,760 companies globally regardless of board or filters
- Query must be `{ query: {} }` (object, not string — 422 otherwise)
- Supports `page` and `per_page` pagination
- Ignores `parent`, `boards`, `locations`, `country`, `search` params
- Companies have `parentSlugs`, `numJobs`, `logos.manual.src` fields
- Board filtering is client-side only via `fixedBoard` in `serverInitialData`
- Location/stage filtering is client-side only via URL params
- Correct URL for India-filtered companies view: `{baseUrl}/companies?officeLocations=India`

## Getro API Notes

- `POST api.getro.com/api/v2/collections/{slug}/search/companies`
- Returns `locations` (array of objects with `country` field), `logo_url`, `name`, `slug`, `domain`
- Supports pagination with `page` and `per_page`
- Filtering by location works server-side
