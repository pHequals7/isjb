# Data Refresh SOP

Standard operating procedure for refreshing company and job data across all 5 VC funds. Run monthly or as needed.

---

## Architecture Overview

```
Data Sources                  Scripts                         Output
─────────────                 ───────                         ──────
Getro API (Accel, GC)    →   fetch-getro.mjs              →  data/accel.json
                                                              data/gc.json

Consider Boards           →   scrape-consider-india.mjs    →  data/{id}-india-raw.json
(PeakXV, Lightspeed,         rebuild-consider-data.mjs    →  data/peakxv.json
 Nexus)                                                       data/lightspeed.json
                                                              data/nexus.json

All data files            →   assign-consider-sectors.mjs  →  (sectors added to Consider files)
                              normalize-sectors.mjs        →  (sectors normalized across all files)

All data files            →   validate-getro-urls.mjs      →  Console report
                              validate-consider-urls.mjs   →  Console report
```

## Prerequisites

| Tool | Required For | Install |
|------|-------------|---------|
| Node.js 18+ | All scripts | `brew install node` |
| `agent-browser` CLI | Consider scraping only | See compound-engineering docs |

## Step-by-Step Refresh

### Step 1: Fetch Getro data (Accel & General Catalyst)

```bash
node scripts/fetch-getro.mjs
```

**What it does:**
- Calls `api.getro.com/api/v2/collections/{id}/search/companies` for Accel (collection 8672) and GC (collection 222)
- Paginates through all companies (12 per page)
- Filters to India-only companies using location data + `data/indian-origin-override.json` allowlist
- Extracts: name, slug, jobsBoardUrl, activeJobCount, domain, logoUrl, sectors (from `industry_tags`)
- Writes to `data/accel.json` and `data/gc.json`

**Expected output:**
```
accel: 566 total, ~77 Indian with jobs
gc: 501 total, ~19 Indian with jobs
```

**No external auth needed** — the Getro API is public.

---

### Step 2: Scrape Consider boards (PeakXV, Lightspeed, Nexus)

```bash
node scripts/scrape-consider-india.mjs
```

**What it does:**
- Uses `agent-browser` to open each board's `/companies?officeLocations=India` page
- Clicks "Show more companies" repeatedly until all are loaded (up to 20 attempts)
- Extracts company names, job counts, slugs, and logo URLs from page HTML
- Saves raw data to `data/{id}-india-raw.json` (intermediate files)

**Requires:** `agent-browser` CLI tool must be installed and available in PATH.

**If agent-browser is unavailable:** Skip this step. The existing data files will be stale but functional. Consider data can also be manually updated by visiting the board URLs and cross-referencing.

---

### Step 3: Rebuild Consider data from raw scrapes

```bash
node scripts/rebuild-consider-data.mjs
```

**What it does:**
- Reads `data/{id}-india-raw.json` files from Step 2
- Filters out non-Indian companies using a hardcoded exclusion list (US/SEA companies with India offices like Databricks, Stripe, Rippling, etc.)
- Merges domain data from existing data files (for Google Favicon fallback)
- Sorts by job count (descending), then alphabetically
- Writes clean data to `data/peakxv.json`, `data/lightspeed.json`, `data/nexus.json`

**Important:** If new non-Indian companies appear in scrapes, add their slugs to the `nonIndianSlugs` set in this script.

---

### Step 4: Assign sectors to Consider companies

```bash
node scripts/assign-consider-sectors.mjs
```

**What it does:**
- Reads each Consider data file and assigns `sectors` arrays from a hardcoded mapping in the script
- Every Consider company slug must have a mapping entry

**When new companies appear:** After a re-scrape, new companies won't have sector assignments. You'll see them listed as "Missing" in the output. Add entries to the `sectorAssignments` object in the script before proceeding.

---

### Step 5: Normalize sector names

```bash
node scripts/normalize-sectors.mjs
```

**What it does:**
- Reads `data/sector-map.json` which maps ~195 raw sector/industry names to 16 canonical categories
- Applies normalization across ALL 5 data files (Getro + Consider)
- Reports any unmapped sector names

**If unmapped sectors appear:** Add them to `data/sector-map.json` with the appropriate canonical category, then re-run this script.

**Canonical sectors (16):** SaaS, FinTech, E-Commerce & D2C, Consumer Services, HealthTech, AI & Data, EdTech, Media & Entertainment, Manufacturing & Hardware, FoodTech, Logistics, Real Estate, CleanTech & Energy, Cybersecurity, Travel & Hospitality, AgriTech

---

### Step 6: Validate URLs

```bash
node scripts/validate-getro-urls.mjs
node scripts/validate-consider-urls.mjs
```

**Getro validation:** Checks HTTP status codes for each company URL. Getro returns proper 404s for removed companies. Sequential with rate limiting.

**Consider validation:** Detects soft 404s by checking page `<title>` tags.
- Valid: `"Jobs at {CompanyName} | {Board}"`
- Soft 404: `"Jobs at {Board} Companies | {Board}"`

**If companies fail validation:** Add their slugs to `data/india-filter.json` (denylist mode for Getro funds) or to the `nonIndianSlugs` set in `rebuild-consider-data.mjs` (for Consider funds).

---

### Step 7: Build and verify

```bash
npm run build
npm run dev  # Visual check
```

Verify:
- [ ] Stats banner shows correct totals
- [ ] All fund sections render with correct company counts
- [ ] Sector filter pills appear with reasonable counts
- [ ] Search works across all funds
- [ ] No broken logos or missing companies

---

## Quick Refresh (Getro only, ~2 minutes)

If you only need to update Accel and GC job counts (no Consider re-scrape):

```bash
node scripts/fetch-getro.mjs
node scripts/normalize-sectors.mjs
npm run build
```

## Full Refresh (~10 minutes)

```bash
# 1. Fetch/scrape all data
node scripts/fetch-getro.mjs
node scripts/scrape-consider-india.mjs
node scripts/rebuild-consider-data.mjs

# 2. Assign and normalize sectors
node scripts/assign-consider-sectors.mjs
node scripts/normalize-sectors.mjs

# 3. Validate
node scripts/validate-getro-urls.mjs
node scripts/validate-consider-urls.mjs

# 4. Build
npm run build
```

---

## Configuration Files

### `data/india-filter.json`

Denylist of non-Indian company slugs for Getro-sourced funds. Companies here are excluded from Accel/GC data at load time (`src/lib/data.ts`).

```json
{
  "accel": { "mode": "denylist", "slugs": ["atlassian", "stripe", ...] },
  "gc": { "mode": "denylist", "slugs": [...] }
}
```

### `data/indian-origin-override.json`

Allowlist of Indian-origin companies that should always be included even if their HQ location doesn't say "India" (e.g., Freshworks is HQ'd in San Mateo but is Indian-origin).

```json
{
  "slugs": ["freshworks", "postman", "browserstack", ...]
}
```

### `data/sector-map.json`

Maps raw sector/industry names (from Getro `industry_tags` and manual Consider assignments) to 16 canonical sector categories. Used by `normalize-sectors.mjs`.

---

## Troubleshooting

### New company appears with no sector assignment
Add it to the `sectorAssignments` object in `scripts/assign-consider-sectors.mjs`, then re-run steps 4-5.

### New raw sector name from Getro is unmapped
Add a mapping in `data/sector-map.json`, then re-run step 5.

### Company shows up that shouldn't be there (non-Indian)
- For Getro funds: add slug to `data/india-filter.json` under the appropriate fund
- For Consider funds: add slug to `nonIndianSlugs` in `scripts/rebuild-consider-data.mjs`, then re-run step 3+

### Consider scraping fails / agent-browser not available
The scrape step is the only one requiring `agent-browser`. All other steps work with just Node.js. You can skip the Consider scrape and keep existing data files — they'll just have stale job counts.

### Getro API returns empty results
The API is unauthenticated. Check if the collection IDs have changed by visiting `jobs.accel.com` or `jobs.generalcatalyst.com` and inspecting network requests.

---

## Adding a New VC Fund

Reproducible checklist for onboarding a new fund. ~15 minutes for Getro funds, ~30 minutes for Consider boards.

### Step 1: Identify the platform

Visit the fund's job board URL. Determine if it uses **Getro** or **Consider**:

| Indicator | Getro | Consider |
|-----------|-------|----------|
| "Powered by" footer | Getro | Ashby / Consider |
| JS/CSS CDN | `cdn.getro.com` | `consider.com` |
| URL pattern | `jobs.{fund}.com/companies` | `careers.{fund}.com/companies` |
| API domain | `api.getro.com` | `consider.com` |

### Step 2: Find the collection/board ID

**For Getro funds:**

```bash
# Fetch the page with a browser user agent and extract __NEXT_DATA__
curl -sL "https://jobs.{fund}.com/companies" \
  -H "User-Agent: Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36" \
  | grep -oE '__NEXT_DATA__.*?</script>' \
  | python3 -c "
import sys, json, re
text = sys.stdin.read()
m = re.search(r'__NEXT_DATA__[^{]*({.*})', text)
if m:
    d = json.loads(m.group(1))
    print('Network ID:', d['props']['pageProps']['network']['id'])
    print('Name:', d['props']['pageProps']['network']['name'])
"
```

The **network ID** doubles as the **collection ID** for the search API. Verify it works:

```bash
curl -s "https://api.getro.com/api/v2/collections/{COLLECTION_ID}/search/companies" \
  -X POST -H "Content-Type: application/json" -H "Accept: application/json" \
  -d '{"hitsPerPage":1,"page":0,"query":"","filters":{"page":0}}' | python3 -m json.tool
```

**For Consider boards:**

The board ID is in the URL path. E.g., `careers.peakxv.com` → check network requests for the Consider API board slug.

### Step 3: Probe the data

```bash
# Fetch all companies and check India presence
curl -s "https://api.getro.com/api/v2/collections/{ID}/search/companies" \
  -X POST -H "Content-Type: application/json" -H "Accept: application/json" \
  -d '{"hitsPerPage":100,"page":0,"query":"","filters":{"page":0}}' | python3 -c "
import sys, json
d = json.load(sys.stdin)
companies = d['results']['companies']
print(f'Total companies: {len(companies)}')
india = [c for c in companies if any('India' in str(l) for l in c.get('locations', []))]
print(f'India companies: {len(india)} ({sum(1 for c in india if c[\"active_jobs_count\"] > 0)} with active jobs)')
for c in sorted(india, key=lambda x: x['name']):
    print(f'  {c[\"name\"]} | jobs: {c[\"active_jobs_count\"]} | sectors: {c.get(\"industry_tags\", [])}')
"
```

### Step 4: Get the fund logo

```bash
# Check the fund's main website for a logo
curl -sL "https://{fund}.vc" -H "User-Agent: Mozilla/5.0 ..." \
  | grep -oE 'src="[^"]*logo[^"]*"'

# Download to public/logos/vc/
curl -sL "{logo_url}" -o public/logos/vc/{fund_id}.{ext}
```

**Logo notes:**
- If the logo has white text (reversed/dark-bg variant), set `logoDark: true` in config
- `logoDark: true` applies `brightness-0` filter on light backgrounds
- The ticker always applies `brightness-0 invert` so all logos render white

### Step 5: Add config entry

**File: `src/config/vc-funds.ts`**

```ts
{
  id: "{fund_id}",              // Used for data file name and DOM IDs
  name: "{Fund Display Name}",
  logoPath: "/logos/vc/{fund_id}.{ext}",
  jobsBoardBaseUrl: "https://jobs.{fund}.com",
  platform: "getro",            // or "consider"
  color: "#hexcolor",           // Brand color for UI accents
  logoDark: true,               // Optional: set if logo is white/light
},
```

### Step 6: Add to fetch script

**For Getro funds** — add to `configs` array in `scripts/fetch-getro.mjs`:

```js
{ id: "{fund_id}", collectionId: "{COLLECTION_ID}", baseUrl: "https://jobs.{fund}.com" },
```

**For Consider funds** — add to `boards` array in `scripts/scrape-consider-india.mjs`.

### Step 7: Add to normalize script

**File: `scripts/normalize-sectors.mjs`** — add `"{fund_id}"` to the `files` array.

### Step 8: Run the data pipeline

```bash
# Fetch data
node scripts/fetch-getro.mjs          # For Getro funds
# OR
node scripts/scrape-consider-india.mjs # For Consider funds
node scripts/rebuild-consider-data.mjs

# Normalize sectors
node scripts/normalize-sectors.mjs

# Check for unmapped sectors — add any to data/sector-map.json
# Check for empty sectors — manually assign in the data file

# Build and verify
npm run build
npm run dev
```

### Step 9: Manual sector assignments

After fetching, check the data file for companies with empty `sectors: []`. Look up each company's domain and assign the appropriate canonical sector. The 16 canonical sectors are:

```
SaaS, FinTech, E-Commerce & D2C, Consumer Services, HealthTech,
AI & Data, EdTech, Media & Entertainment, Manufacturing & Hardware,
FoodTech, Logistics, Real Estate, CleanTech & Energy, Cybersecurity,
Travel & Hospitality, AgriTech
```

### Step 10: Update OG image (optional)

If you want the fund name in the social preview, update `public/og-image.svg` to include the new fund name in the VC list, then regenerate the PNG:

```bash
npx sharp-cli -i public/og-image.svg -o public/og-image.png
```

### Example: Blume Ventures (Getro)

This is exactly how Blume was onboarded:

1. **Platform**: Getro (confirmed by `cdn.getro.com` assets in page source)
2. **Collection ID**: `32333` (from `__NEXT_DATA__.props.pageProps.network.id`)
3. **Probe**: 18 total companies, 14 India-based, 7 with active jobs
4. **Logo**: `https://cdn.blume.vc/blume/assets/images/logo-blume-reversed.svg` → `public/logos/vc/blume.svg` (white text, so `logoDark: true`)
5. **Config**: Added to `vc-funds.ts` with `color: "#14305A"`
6. **Fetch**: Added `{ id: "blume", collectionId: "32333", baseUrl: "https://jobs.blume.vc" }` to `fetch-getro.mjs`
7. **Normalize**: Added `"blume"` to files array, added `"Electrical/Electronic Manufacturing"` mapping
8. **Manual sectors**: Ati Motors → Manufacturing & Hardware, SiftHub → AI & Data, slice → FinTech, Optimized Electrotech → Manufacturing & Hardware
