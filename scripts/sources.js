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

  /* --------------------------------------------------------------
     Everything below stayed on the curated layer after verification
     on 2026-08-30. Re-check periodically.
     -------------------------------------------------------------- */
  {
    exchange:'TADAWUL',
    enabled:false,
    url:'https://www.saudiexchange.sa/wps/portal/saudiexchange/listing/ipos',
    hint:'Akamai blocks headless Chromium outright. Firefox/WebKit passed ONCE with a real Upcoming IPOs table, then reverted to the login/captcha gate on every request after (3/3) — looks like first-request leniency on a fresh session rather than a real bypass. Not safe to rely on without confirming a durable path through.'
  },
  {
    exchange:'SGX',
    enabled:false,
    url:'https://www.sgx.com/stock-exchange/company-announcements',
    hint:'Akamai blocks headless Chromium outright. Firefox passed ONCE with a real Company Announcements table, then reverted to the "unsupported browser" page on every request after (2/2). Same first-request-leniency pattern as TADAWUL — not reliable.'
  },
  {
    exchange:'KLSE',
    enabled:false,
    url:'https://www.bursamalaysia.com/listing/listing_resources/ipo/ipo_summary',
    hint:'Cloudflare blocks plain requests (403). Firefox gets a real, rich IPO Summary table when run in isolation, but times out inconsistently (Cloudflare challenge?) when run as part of a full source sweep — not reliable enough yet to enable unattended. Worth retrying with a longer goto timeout.'
  },
  {
    exchange:'JSE',
    enabled:false,
    url:'https://clientportal.jse.co.za/communication/sens-announcements',
    hint:'Page loads and the mechanism works, but the default filter is "today only" with no discovered URL parameter to widen the date range, so every run would legitimately return zero rows.'
  },
  {
    exchange:'B3',
    enabled:false,
    url:null,
    hint:'No verified free public upcoming-IPO or new-listing feed found as of 2026-08-30; tested official pages returned effectively empty content.'
  },
  {
    exchange:'SET',
    enabled:false,
    url:'https://www.set.or.th/en/listing/ipo/upcoming-ipo/set',
    hint:'Page loads a status summary table (counts of Effective/Approved/Submitted) but no per-company rows; those load behind a tab click this scraper does not perform.'
  }
];
