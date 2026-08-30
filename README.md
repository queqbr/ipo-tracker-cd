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
scripts/refresh.js             pulls SEC EDGAR, merges with curated rows
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

Two layers, and every row says which it belongs to.

**Live** — NASDAQ, NYSE and AMEX, pulled from SEC EDGAR through the API Ninjas IPO endpoint. These refresh on the cron without anyone touching them.

**Curated** — the eleven non-US exchanges. None of them publishes a free structured IPO calendar. Warsaw, Dubai, Riyadh, Johannesburg, São Paulo, Bangkok and Bursa release announcements as HTML and PDF, several not in English, and the LSE's RNS Data Feed is a licensed product behind authentication. These rows are maintained by hand and marked as such rather than dressed up as a feed.

Filter to Live feed only or Curated only in the toolbar to see the split.

The curated layer is built from exchange announcements, regulator approvals and reported intentions to float, current to late August 2026. Each row carries a `status` field distinguishing what has been filed from what has only been reported:

| Status | Meaning |
|---|---|
| `Approved` | Exchange or regulator has cleared the listing |
| `Filed` | Prospectus or application lodged |
| `Announced` | Company has published an intention to float |
| `Reported` | Press reporting only, no filing |

Filtering to Filed and Approved gives the near-certain calendar. Reported is the pipeline.

**How the refresh works.** `scripts/refresh.js` pulls the next 180 days of filed, amended and priced US offerings, maps SIC codes onto the dashboard's sector taxonomy, merges the result with the curated rows and writes `data.json`. `.github/workflows/refresh.yml` runs it at 06:00 UTC on weekdays and commits only when something changed. The commit triggers a redeploy and the live page picks it up on its next poll.

Two guardrails. A source that throws leaves its previous rows in place rather than dropping an exchange from the table, and a payload failing schema validation exits non-zero without writing anything.

**Setup.** Get a free key at api-ninjas.com/register, then add it as a repository secret named `IPO_API_KEY` under Settings → Secrets and variables → Actions. Locally:

```
IPO_API_KEY=your_key npm run refresh
```

Without the key the script still runs, logs the failure and writes the curated rows on their own. Note the free tier is non-commercial.

**The agent layer.** The eleven non-US exchanges are read by an LLM rather than by CSS selectors. `scripts/lib/fetch-page.js` retrieves the page, escalating through a plain request, a reader proxy that renders JavaScript, and headless Chromium. `scripts/lib/extract.js` hands the text to OpenAI's API with the row schema and instructions never to invent a value. Every returned row is validated here, so anything malformed is dropped rather than published.

Selectors were the wrong tool for these sources. The pages are published in four languages and redesign without notice, and a class rename breaks a selector silently while a model reading the text does not care about markup.

**Check what is reachable first:**

```
npm run probe                    # all sources
USE_BROWSER=1 npm run probe      # include headless Chromium
npm run probe LSE WSE            # a subset
```

Several exchanges block datacenter IPs or render their calendar client-side, so expect some to fail. Set `browser:true` on those in `scripts/sources.js`, or `enabled:false` to leave an exchange on the curated layer. The URLs in that file are starting points and have not been verified from this machine.

**Keys.** `OPENAI_API_KEY` for extraction, `IPO_API_KEY` for the SEC source. Both go in repository secrets under the same names.

**Safety rails.** Sources run four at a time. A failing source keeps its curated rows rather than dropping an exchange from the table. A payload failing schema validation exits non-zero. And a run producing fewer than half the seed row count refuses to publish, so a bad night cannot quietly empty the dashboard.

**Adding another exchange.** Append an entry to `scripts/sources.js` with an exchange code, a URL and a one-line hint. Nothing else changes.

**Offline fallback.** Opened from the file system, the app skips the fetch and reads the seed array in `data.js` directly, so double-clicking `index.html` still works.

**Deal size on live rows.** The free EDGAR tier returns no offer size, so `valUsd` is left at zero and renders as N/A. The valuation column sorts those to the bottom in either direction rather than treating an unknown as a small number.

**Executive contacts.** Names come from the prospectus or the company's own disclosures. Email addresses are pattern-inferred from the verified corporate domain and carry an `inferred` flag until confirmed. Where a filing does not disclose a CFO, the field shows N/A and the drawer offers the investor relations mailbox as a routing fallback. No individual is named who is not named in a source.

**Missing data.** Unavailable fields render as N/A in a muted style. The row still sorts, filters and exports normally.

## Adding a listing

Append an object to the `DATA` array in `data.js` with `sourceType:'curated'`. Every field is required; use the string `'N/A'` for anything unavailable and the dashboard will render it muted and keep the row sortable. `valUsd` is a numeric USD sort key in millions, `valDisp` is the local-currency string that renders. If the company is new, add its domain to `DOMAINS` so the IR fallback route resolves.
