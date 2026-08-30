/* ============================================================
   sources.js
   ------------------------------------------------------------
   One entry per exchange. Each is a page the agent fetches and
   reads; no selectors, so a redesign does not break anything.

   URLs are deliberately not committed to this file — this is a
   public repo, and some of these are workarounds (an undocumented
   data endpoint, a specific query against a regulator's search
   form) rather than the exchange's own published feed page. They
   live in the SOURCE_URLS_JSON environment variable / GitHub
   secret instead: a JSON object of { EXCHANGE_CODE: url }. Locally,
   put it in .env.local (see .env.local.example) and run via
   `npm run refresh` / `npm run probe`, which load it automatically.
   A url containing the literal string {{YEAR}} has that replaced
   with the current year at load time, for sources like B3 that
   need to query the current year rather than a value that goes
   stale.

   Verified against live sites on 2026-08-30, including forcing
   headless-browser strategies to check pages that pass a plain
   fetch with a nav shell but no real content, and trying Firefox
   and WebKit engines against sites that block headless Chromium
   specifically (see the TADAWUL/SGX/KLSE note below). Run:

     node scripts/probe.js
     USE_BROWSER=1 node scripts/probe.js

   to re-check. Set enabled:false to leave an exchange on the
   curated layer.
   ============================================================ */

const URLS = JSON.parse(process.env.SOURCE_URLS_JSON || '{}');
const urlFor = code => (URLS[code] || '').replace('{{YEAR}}', new Date().getFullYear());

export const SOURCES = [
  {
    exchange:'LSE',
    enabled:true,
    url:urlFor('LSE'),
    hint:'Upcoming issues table (company, market, expected size, price range, expected first date of trading) followed by a Recent issues table.',
    browser:true   // plain fetch returns almost nothing; real table only renders client-side
  },
  {
    exchange:'WSE',
    enabled:true,
    url:urlFor('WSE'),
    hint:'Debuts in [year] table: company, introduction date, issuing price, offering value. Published in Polish; translate company descriptions into English.',
    browser:true   // plain/reader both blocked; browser confirmed real per-company rows
  },
  {
    exchange:'XETRA',
    enabled:true,
    url:urlFor('XETRA'),
    hint:'Deutsche Börse new issues. May list both Xetra and Scale segment admissions.'
  },
  {
    exchange:'DFM',
    enabled:true,
    url:urlFor('DFM'),
    hint:'Latest Market Announcements area. The default view is filtered to today only, so most runs will legitimately see zero disclosures — that is expected, not a broken source.',
    browser:true
  },
  {
    exchange:'TWSE',
    enabled:true,
    url:urlFor('TWSE'),
    hint:'Plain HTML table: code, company, application date, capital amount, listing-review dates, listing date, underwriter, underwriting price. A row with NO listing date yet is the upcoming/pending case; a row with a listing date already in the past has already listed and should be skipped.'
  },
  {
    exchange:'SET',
    enabled:true,
    url:urlFor('SET'),
    hint:'Per-company cards (below a status-count summary table): company, business description, status, par value, IPO price, number of IPO shares, IPO period, first trading day, financial advisor. Only populates after scrolling, which the browser strategy now always does.',
    browser:true
  },

  /* --------------------------------------------------------------
     TADAWUL, SGX and KLSE front Akamai/Cloudflare, which blocked
     headless Chromium outright. TADAWUL/SGX also blocked Firefox
     and WebKit after the first request in same-session repeated
     testing here (looked like first-request leniency, not a real
     bypass); KLSE passed cleanly with Firefox in isolation (2/2, a
     rich real IPO Summary table) but timed out once during a full
     source sweep — a milder, less consistent failure than the other
     two's outright block page. All three left enabled per explicit
     call: a scheduled cron makes exactly one request per source per
     day from a fresh runner IP — not the repeated-request pattern
     that triggered the failures in testing — and a blocked or timed-
     out run just falls back to curated rows for that exchange, so
     the downside is bounded. Worth revisiting if the cron shows
     persistent failures.
     -------------------------------------------------------------- */
  {
    exchange:'TADAWUL',
    enabled:true,
    url:urlFor('TADAWUL'),
    hint:'Upcoming IPOs module with a Results count and per-listing cards: market, offering size, offering price, offering/closing dates. May include ETF admissions alongside equity IPOs.',
    browser:true,
    engine:'firefox'
  },
  {
    exchange:'SGX',
    enabled:true,
    url:urlFor('SGX'),
    hint:'General company announcements feed (date, issuer, security, title, category), not filtered to IPOs specifically — look for listing-related titles (offer documents, preliminary prospectuses, admission notices) among routine disclosures.',
    browser:true,
    engine:'firefox'
  },
  {
    exchange:'KLSE',
    enabled:true,
    url:urlFor('KLSE'),
    hint:'IPO Summary table (company, offer period, issue price, shares, market — Main/ACE/LEAP, listing date), newest first, ~20 rows per page with only the first page fetched. Spans past and upcoming listings; skip rows whose listing date has already passed. No total deal size is stated directly: the "No of Shares" column breaks into three sub-columns — Public Issue, Offer For Sale, Private Placement (a "-" means that tranche is not part of this IPO, treat it as 0) — all offered at the single stated issue price. sharesOffered MUST be Public Issue + Offer For Sale + Private Placement ADDED TOGETHER for EVERY row with this table shape, never Public Issue alone — Public Issue by itself is only the new-capital portion, not the total IPO size, and this applies identically to every company in the table, not just one of them. Generic worked example (not a real company, just showing the arithmetic): if a row shows Public Issue 10,000,000, Offer For Sale 4,000,000, Private Placement 6,000,000, then sharesOffered = 20,000,000 — the sum of all three — not 10,000,000.',
    browser:true,
    engine:'firefox',
    // gpt-4o-mini was inconsistent on this specific table's arithmetic — verified
    // across repeated test runs applying the sum-three-tranches rule correctly to
    // some rows and not others, or not at all, with no prompt wording that fixed
    // it reliably. Scoped to just this source rather than raising EXTRACT_MODEL
    // globally, since every other source has extracted correctly with the default.
    model:'gpt-4o'
  },

  /* --------------------------------------------------------------
     Everything below stayed on the curated layer after verification
     on 2026-08-30. Re-check periodically.
     -------------------------------------------------------------- */
  {
    exchange:'JSE',
    enabled:false,
    url:urlFor('JSE'),
    // Short, public-facing reason — shown on the live site. Keep this
    // separate from `hint` below, which is internal engineering notes
    // for future debugging and not meant for an end-user audience.
    note:'Requires a paid enterprise data subscription — no free public feed exists.',
    hint:'Page loads and the mechanism works, but the default filter is "today only" with no discovered URL parameter to widen the date range, so every run would legitimately return zero rows. A third-party workaround (a SENS mirror on a financial news site) was tried on 2026-08-30 and ruled out: Cloudflare escalated from a JS challenge to a flat "blocked" response after a handful of automated requests, with no interactive widget ever rendered to solve — reputation/rate-based blocking, not a fingerprint check like the Akamai sites below, so a browser-engine swap doesn\'t help and it would likely fail the same way on a cron. No free path found as of 2026-08-30 — the JSE\'s own RNS/SENS feed is a licensed product behind authentication (see README), same conclusion as the original assessment. A paid enterprise data subscription looks like the only real fix.'
  },

  /* --------------------------------------------------------------
     B3 has no free structured IPO calendar of its own, but CVM (the
     Brazilian securities regulator) runs a public registry search
     for equity ("ACOES") offering registrations — both pending
     ("under review") and granted — which is exactly the IPO
     pipeline. The stored URL contains {{YEAR}}, substituted above,
     so it always checks the current year rather than a value that
     goes stale. Verified 2026-08-30: the query mechanism is correct
     (a parallel check against 2021/2022 returned real, known IPOs —
     Raízen, ClearSale, Oncoclínicas, etc.), and as of that date
     there is genuinely nothing pending and nothing granted in 2026
     — B3's last equity registration grant was June 2022. An empty
     result is a real ~277-char page, under fetchPage's 300-char
     floor, so it will show up in refresh logs as a "failure" even
     though the request succeeded and the source is working exactly
     as intended — refresh.js already falls back to curated rows on
     zero extracted rows regardless, so the end behavior is correct
     either way, just the log line undersells it.
     -------------------------------------------------------------- */
  {
    exchange:'B3',
    enabled:true,
    url:urlFor('B3'),
    hint:'CVM registry search results table: REGISTRO (registration number/link), TIPO DE EMISSÃO (security type — already filtered to ACOES/shares), NOME DA EMISSORA (issuer name). No date column here; treat any row present as a current-year pending or granted equity registration.'
  }
];
