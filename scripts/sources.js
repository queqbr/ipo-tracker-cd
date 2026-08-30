/* ============================================================
   sources.js
   ------------------------------------------------------------
   One entry per exchange. Each is a page the agent fetches and
   reads; no selectors, so a redesign does not break anything.

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

export const SOURCES = [
  {
    exchange:'LSE',
    enabled:true,
    url:'https://www.londonstockexchange.com/live-markets/new-issues',
    hint:'Upcoming issues table (company, market, expected size, price range, expected first date of trading) followed by a Recent issues table.',
    browser:true   // plain fetch returns almost nothing; real table only renders client-side
  },
  {
    exchange:'WSE',
    enabled:true,
    url:'https://www.gpw.pl/new-listings',
    hint:'Debuts in [year] table: company, introduction date, issuing price, offering value. Published in Polish; translate company descriptions into English.',
    browser:true   // plain/reader both blocked; browser confirmed real per-company rows
  },
  {
    exchange:'XETRA',
    enabled:true,
    url:'https://www.deutsche-boerse-cash-market.com/dbcm-en/primary-market/being-public/new-issues',
    hint:'Deutsche Börse new issues. May list both Xetra and Scale segment admissions.'
  },
  {
    exchange:'DFM',
    enabled:true,
    url:'https://www.dfm.ae/the-exchange/news-disclosures/market-announcements',
    hint:'Latest Market Announcements area. The default view is filtered to today only, so most runs will legitimately see zero disclosures — that is expected, not a broken source.',
    browser:true
  },
  {
    exchange:'TWSE',
    enabled:true,
    url:'https://www.twse.com.tw/rwd/en/company/newlisting?response=html',
    hint:'Plain HTML table: code, company, application date, capital amount, listing-review dates, listing date, underwriter, underwriting price. A row with NO listing date yet is the upcoming/pending case; a row with a listing date already in the past has already listed and should be skipped.'
  },
  {
    exchange:'SET',
    enabled:true,
    url:'https://www.set.or.th/en/listing/ipo/upcoming-ipo/set',
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
    url:'https://www.saudiexchange.sa/wps/portal/saudiexchange/listing/ipos',
    hint:'Upcoming IPOs module with a Results count and per-listing cards: market, offering size, offering price, offering/closing dates. May include ETF admissions alongside equity IPOs.',
    browser:true,
    engine:'firefox'
  },
  {
    exchange:'SGX',
    enabled:true,
    url:'https://www.sgx.com/stock-exchange/company-announcements',
    hint:'General company announcements feed (date, issuer, security, title, category), not filtered to IPOs specifically — look for listing-related titles (offer documents, preliminary prospectuses, admission notices) among routine disclosures.',
    browser:true,
    engine:'firefox'
  },
  {
    exchange:'KLSE',
    enabled:true,
    url:'https://www.bursamalaysia.com/listing/listing_resources/ipo/ipo_summary',
    hint:'IPO Summary table (company, offer period, issue price, shares, market — Main/ACE/LEAP, listing date), newest first, ~20 rows per page with only the first page fetched. Spans past and upcoming listings; skip rows whose listing date has already passed.',
    browser:true,
    engine:'firefox'
  },

  /* --------------------------------------------------------------
     Everything below stayed on the curated layer after verification
     on 2026-08-30. Re-check periodically.
     -------------------------------------------------------------- */
  {
    exchange:'JSE',
    enabled:false,
    url:'https://clientportal.jse.co.za/communication/sens-announcements',
    hint:'Page loads and the mechanism works, but the default filter is "today only" with no discovered URL parameter to widen the date range, so every run would legitimately return zero rows. A third-party workaround (moneyweb.co.za/tools-and-data/moneyweb-sens/) was tried on 2026-08-30 and ruled out: Cloudflare escalated from a JS challenge to a flat "blocked" response after a handful of automated requests, with no interactive widget ever rendered to solve — reputation/rate-based blocking, not a fingerprint check like the Akamai sites below, so a browser-engine swap doesn\'t help and it would likely fail the same way on a cron. No free path found as of 2026-08-30 — the JSE\'s own RNS/SENS feed is a licensed product behind authentication (see README), same conclusion as the original assessment. A paid enterprise data subscription looks like the only real fix.'
  },

  /* --------------------------------------------------------------
     B3 has no free structured IPO calendar of its own, but CVM (the
     Brazilian securities regulator) runs a public registry search
     for equity ("ACOES") offering registrations — both pending
     ("under review") and granted — which is exactly the IPO
     pipeline. Queried with the year computed at run time so it
     always checks the current year rather than a value that goes
     stale. Verified 2026-08-30: the query mechanism is correct (a
     parallel check against 2021/2022 returned real, known IPOs —
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
    url:`https://sistemas.cvm.gov.br/port/registro/RegistroResp99.asp?TipoEmis=ACOES&EmpEmis=&hd1=1&hd2=2&ckbtpcons1=1&ckbtpcons2=2&Ano=${new Date().getFullYear()}&NumReg=`,
    hint:'CVM registry search results table: REGISTRO (registration number/link), TIPO DE EMISSÃO (security type — already filtered to ACOES/shares), NOME DA EMISSORA (issuer name). No date column here; treat any row present as a current-year pending or granted equity registration.'
  }
];
