/* ============================================================
   sources.js
   ------------------------------------------------------------
   One entry per exchange. Each is a page the agent fetches and
   reads; no selectors, so a redesign does not break anything.

   URLs are a starting point, not verified working endpoints.
   Several of these exchanges block datacenter traffic or render
   their calendar client-side. Run:

     node scripts/probe.js

   to see which respond, then adjust the url or set browser:true
   on the ones that need a real browser.

   Set enabled:false to leave an exchange on the curated layer.
   ============================================================ */

export const SOURCES = [
  {
    exchange:'LSE',
    enabled:true,
    url:'https://www.londonstockexchange.com/news?tab=news-explorer&headlinetype=Intention%20to%20Float',
    hint:'RNS news explorer filtered to Intention to Float announcements. Each result is one issuer.'
  },
  {
    exchange:'WSE',
    enabled:true,
    url:'https://www.gpw.pl/ipo',
    hint:'Warsaw Stock Exchange IPO page. Published in Polish; translate company descriptions into English.'
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
    url:'https://www.dfm.ae/en/the-exchange/news-disclosures/company-announcements',
    hint:'Dubai Financial Market company announcements. Look for listing approvals and offering periods.'
  },
  {
    exchange:'TADAWUL',
    enabled:true,
    url:'https://www.saudiexchange.sa/wps/portal/saudiexchange/newsandreports/issuer-news',
    hint:'Saudi Exchange issuer news. CMA approval notices and book-building announcements are the relevant items.',
    browser:true
  },
  {
    exchange:'JSE',
    enabled:true,
    url:'https://clientportal.jse.co.za/communication/sens',
    hint:'JSE SENS announcements. Filter mentally for listing particulars and pre-listing statements.',
    browser:true
  },
  {
    exchange:'B3',
    enabled:true,
    url:'https://www.b3.com.br/en_us/products-and-services/solutions-for-issuers/ipos-and-follow-ons/',
    hint:'B3 public offerings. Published in Portuguese on the pt_br mirror; ofertas em andamento are the live deals.'
  },
  {
    exchange:'SGX',
    enabled:true,
    url:'https://www.sgx.com/securities/company-announcements',
    hint:'SGX company announcements. Offer documents and preliminary prospectuses signal upcoming listings.'
  },
  {
    exchange:'TWSE',
    enabled:true,
    url:'https://www.twse.com.tw/en/listed/listed/newListing.html',
    hint:'TWSE new listings. Published in Traditional Chinese on the zh mirror; translate to English.'
  },
  {
    exchange:'SET',
    enabled:true,
    url:'https://www.set.or.th/en/listing/ipo/upcoming-ipo',
    hint:'Stock Exchange of Thailand upcoming IPOs. Subscription period and offer price range are usually given.'
  },
  {
    exchange:'KLSE',
    enabled:true,
    url:'https://www.bursamalaysia.com/listing/listing_resources/ipo/ipo_summary',
    hint:'Bursa Malaysia IPO summary. Distinguish Main Market from ACE Market admissions.'
  }
];
