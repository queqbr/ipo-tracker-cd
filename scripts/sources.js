/* ============================================================
   sources.js
   ------------------------------------------------------------
   One entry per exchange. Each is a page the agent fetches and
   reads; no selectors, so a redesign does not break anything.

   Verified against live sites on 2026-08-30, including forcing
   the headless-Chromium strategy to check pages that pass a
   plain fetch with a nav shell but no real content. Run:

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

  /* --------------------------------------------------------------
     Everything below stayed on the curated layer after verification
     on 2026-08-30 — either hard-blocked at the edge (Akamai/
     Cloudflare Access Denied, even under headless Chromium with a
     real browser UA) or the real listing data only appears after a
     UI interaction (clicking Query, switching a tab) that this
     scraper does not perform. Re-check periodically; a site fix or
     an interaction-capable fetch step could re-enable these.
     -------------------------------------------------------------- */
  {
    exchange:'TADAWUL',
    enabled:false,
    url:'https://www.saudiexchange.sa/wps/portal/saudiexchange/listing/ipos',
    hint:'Akamai returns Access Denied to both plain and headless-browser requests. No working access path found as of 2026-08-30.'
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
    exchange:'SGX',
    enabled:false,
    url:'https://www.sgx.com/securities/company-announcements',
    hint:'Akamai returns Access Denied to both plain and headless-browser requests.'
  },
  {
    exchange:'TWSE',
    enabled:false,
    url:'https://www.twse.com.tw/en/listed/listed/new-listing.html',
    hint:'Page loads but only the Year/Type filter form is present; the results table is populated by clicking Query, which this scraper does not do.'
  },
  {
    exchange:'SET',
    enabled:false,
    url:'https://www.set.or.th/en/listing/ipo/upcoming-ipo/set',
    hint:'Page loads a status summary table (counts of Effective/Approved/Submitted) but no per-company rows; those load behind a tab click this scraper does not perform.'
  },
  {
    exchange:'KLSE',
    enabled:false,
    url:'https://www.bursamalaysia.com/listing/listing_resources/ipo/ipo_summary',
    hint:'Cloudflare challenge blocks plain requests (403) and times out headless Chromium entirely.'
  }
];
