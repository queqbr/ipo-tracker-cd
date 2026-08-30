# Global IPO Tracker

A screening tool for upcoming IPOs across eleven exchanges: London, Warsaw, Dubai, Riyadh, Johannesburg, São Paulo, Singapore, Taipei, Bangkok, Kuala Lumpur and Frankfurt.

## Stack

Vanilla JavaScript, no framework, no build step, no server. Archivo and JetBrains Mono load from Google Fonts, and the page degrades to system fonts without them.

The choice was deliberate. A screening tool with no dependency tree has nothing to break between now and whenever the link is opened, and it deploys to any static host in under a minute.

```
index.html                     markup
styles.css                     design tokens and layout
data.js                        curated dataset, 33 listings
data.json                      served payload, regenerated on a schedule
app.js                         filter, sort, render, refresh
scripts/refresh.js             runs the agent layer, merges with curated rows
scripts/sources.js             one entry per exchange: URL, hint, browser/engine flags
scripts/lib/fetch-page.js      fetches a page and reduces it to model-readable text
scripts/lib/extract.js         has an LLM read the text against the row schema
scripts/probe.js               dry-run reachability check per source
.github/workflows/refresh.yml  weekday cron
```

## Deploy

**Vercel** — `vercel --prod` from this directory, or drag the folder into the dashboard.

**Netlify** — drag the folder onto app.netlify.com/drop.

**GitHub Pages** — push to a repo, then Settings → Pages → deploy from branch root.

Nothing to configure. `index.html` is the entire application.

Local preview: `python3 -m http.server 8000`, then open `http://localhost:8000`.

## Using it

**Search** matches on company name and ticker.

**Filters** cover exchange, sector and filing status. The listing calendar across the top of the header doubles as a date filter: each column is a month, each pip is one listing coloured by region, and clicking a column narrows the table to that month. Clicking it again releases the filter.

**Sorting** works on every column. Company, exchange, date, sector, valuation, CEO and CFO all sort ascending and descending. Valuation sorts on a USD-normalised key rather than on the displayed local-currency string, so PLN, SAR and BRL figures rank correctly against each other. Rows with no disclosed executive sort to the bottom in either direction rather than clustering at the top of an A-Z.

**Expanding a row** opens the full business description, transaction detail, and the contact block with copy buttons on each address.

**The watchlist** saves to browser storage. The star toggles a company in or out, and the toolbar button filters to saved names.

**Export CSV** writes whatever is currently on screen, filters included, with all twenty fields and a UTF-8 BOM so Excel opens accented characters correctly.

**Refresh** happens on its own. The page polls `data.json` every five minutes and again whenever a backgrounded tab returns to the foreground, re-rendering only when the payload has actually changed so filters and open rows survive the update. The toolbar shows the last sync time, and the button forces a check. A failed poll keeps the last good payload rather than emptying the table.

## Data

Two layers, and every row says which it belongs to. Both cover the same eleven exchanges — the split is about how fresh a row is, not which market it's on.

**Live** — read directly off each exchange's own site by an LLM (the agent layer, below) on the weekday cron, no CSS selectors involved.

**Curated** — the hand-maintained fallback in `data.js`. Whenever an exchange's live source fails for a given run, that exchange's rows stay on whatever was last curated or last successfully scraped, rather than the row disappearing from the table.

Filter to Live feed only or Curated only in the toolbar to see the split.

Every row, live or curated, carries a `status` field distinguishing what has been filed from what has only been reported:

| Status | Meaning |
|---|---|
| `Approved` | Exchange or regulator has cleared the listing |
| `Filed` | Prospectus or application lodged |
| `Announced` | Company has published an intention to float |
| `Reported` | Press reporting only, no filing |

Filtering to Filed and Approved gives the near-certain calendar. Reported is the pipeline.

**The agent layer.** None of these eleven exchanges publishes a free structured IPO calendar, several release announcements only as HTML/PDF and not in English, and the pages redesign without notice — a CSS-selector scraper breaks silently on a class rename, while a model reading the text does not care about markup. `scripts/lib/fetch-page.js` retrieves each page, escalating through a plain request, a reader proxy that renders JavaScript, and a headless browser (Chromium by default; some sources need Firefox or WebKit specifically, since a handful of Akamai/Cloudflare-fronted sites fingerprint and block headless Chromium alone). `scripts/lib/extract.js` hands the text to OpenAI's API with the row schema and instructions never to invent a value. Every returned row is validated here, so anything malformed is dropped rather than published.

As of 2026-08-30, 10 of the 11 exchanges have a working live source (LSE, WSE, XETRA, DFM, TWSE, SET, TADAWUL, SGX, KLSE, and B3 via CVM's public offering-registration registry rather than B3 itself, which has no free calendar of its own). JSE is the one exception: its official feed is a licensed product behind authentication, and a third-party workaround was tried and ruled out (Cloudflare's reputation-based blocking escalates to a flat deny after a few automated requests, with no challenge widget to solve around). A paid enterprise data subscription looks like the only real fix for JSE; it stays on the curated layer.

**How the refresh works.** `scripts/refresh.js` reads `scripts/sources.js`, fetches and extracts each enabled exchange, merges the result with the curated seed in `data.js` and writes `data.json`. `.github/workflows/refresh.yml` runs it at 06:00 UTC on weekdays and commits only when something changed. The commit triggers a redeploy and the live page picks it up on its next poll.

**Check what is reachable first:**

```
npm run probe                    # all sources
USE_BROWSER=1 npm run probe      # include headless Chromium
npm run probe LSE WSE            # a subset
```

Several exchanges block datacenter IPs or render their calendar client-side, so expect some to fail. Set `browser:true` on those in `scripts/sources.js` (and `engine:'firefox'`/`'webkit'` if Chromium specifically gets blocked), or `enabled:false` to leave an exchange on the curated layer.

**Keys and URLs.** `OPENAI_API_KEY` for extraction. Source URLs aren't committed to this file — this is a public repo, and a couple of them are workarounds (an undocumented data endpoint, a specific query against a regulator's search form) rather than the exchange's own published page, so they live in `SOURCE_URLS_JSON` instead: a JSON object of `{ EXCHANGE_CODE: url }`, one entry per exchange in `scripts/sources.js`. A url containing the literal string `{{YEAR}}` has that substituted with the current year at load time (used by B3's CVM query).

Both go in repository secrets under Settings → Secrets and variables → Actions. Locally, copy `.env.local.example` to `.env.local` (gitignored) and fill in real values — `npm run refresh` / `npm run probe` load it automatically via Node's `--env-file-if-exists`.

Without `OPENAI_API_KEY` or a given exchange's URL, that agent source can't run; it fails and the exchange falls back to its curated rows.

**Safety rails.** Sources run four at a time. A failing source keeps its curated rows rather than dropping an exchange from the table. A payload failing schema validation exits non-zero. And a run producing fewer than half the seed row count refuses to publish, so a bad night cannot quietly empty the dashboard.

**Adding another exchange.** Append an entry to `scripts/sources.js` with an exchange code, a URL and a one-line hint. Nothing else changes.

**Offline fallback.** Opened from the file system, the app skips the fetch and reads the seed array in `data.js` directly, so double-clicking `index.html` still works.

**Executive contacts.** Names come from the prospectus or the company's own disclosures. Email addresses are pattern-inferred from the verified corporate domain and carry an `inferred` flag until confirmed. Where a filing does not disclose a CFO, the field shows N/A and the drawer offers the investor relations mailbox as a routing fallback. No individual is named who is not named in a source.

**Missing data.** Unavailable fields render as N/A in a muted style. The row still sorts, filters and exports normally.

## Adding a listing

Append an object to the `DATA` array in `data.js` with `sourceType:'curated'`. Every field is required; use the string `'N/A'` for anything unavailable and the dashboard will render it muted and keep the row sortable. `valUsd` is a numeric USD sort key in millions, `valDisp` is the local-currency string that renders. If the company is new, add its domain to `DOMAINS` so the IR fallback route resolves.
