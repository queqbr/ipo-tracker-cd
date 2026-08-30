#!/usr/bin/env node
/* ============================================================
   scripts/refresh.js
   ------------------------------------------------------------
   Rebuilds data.json. Run by .github/workflows/refresh.yml on a
   weekday cron; the workflow commits the result, the host
   redeploys, and the live page picks it up on its next poll.

   Live source:  SEC EDGAR via API Ninjas (NASDAQ, NYSE, AMEX)
   Curated:      the eleven non-US exchanges held in data.js

   Requires IPO_API_KEY. Locally:
     IPO_API_KEY=xxx node scripts/refresh.js
   In CI it comes from the repository secret of the same name.
   ============================================================ */

import fs from 'node:fs/promises';
import { fetchPage }       from './lib/fetch-page.js';
import { extractListings } from './lib/extract.js';
import { SOURCES as AGENT_SOURCES } from './sources.js';

const API = 'https://api.api-ninjas.com/v1/ipocalendar';
const KEY = process.env.IPO_API_KEY;
const LOOKBACK_DAYS = 270;   // window of recent S-1 filings to treat as the live pipeline

/* ------------------------------------------------------------
   SIC code to the dashboard's sector taxonomy.
   Ranges checked in order, first match wins.
   ------------------------------------------------------------ */
const SIC_SECTOR = [
  [[2833, 2836], 'Biotech'],
  [[8731, 8734], 'Biotech'],
  [[3826, 3827], 'Biotech'],
  [[3674, 3674], 'Semiconductors'],
  [[3559, 3559], 'Semiconductors'],
  [[7370, 7379], 'Technology'],
  [[3570, 3579], 'Technology'],
  [[6021, 6221], 'FinTech'],
  [[6770, 6799], 'FinTech'],
  [[8000, 8093], 'Healthcare'],
  [[5122, 5122], 'Healthcare'],
  [[1311, 1389], 'Energy'],
  [[4911, 4939], 'Energy'],
  [[1000, 1099], 'Metals & Mining'],
  [[3310, 3399], 'Metals & Mining'],
  [[4812, 4899], 'Telecom'],
  [[6500, 6552], 'Real Estate'],
  [[2000, 2111], 'Consumer'],
  [[5200, 5990], 'Consumer'],
  [[3400, 3569], 'Industrials'],
  [[1600, 1799], 'Industrials'],
  [[4400, 4789], 'Industrials']
];

function sectorFor(sic, industry){
  const n = parseInt(sic, 10);
  if (!Number.isNaN(n)){
    for (const [[lo, hi], sector] of SIC_SECTOR){
      if (n >= lo && n <= hi) return sector;
    }
  }
  if (/blank[- ]check/i.test(industry || '')) return 'FinTech';
  return 'Other';
}

const STATUS = { filed:'Filed', amended:'Filed', priced:'Approved', listed:'Announced' };
const iso = d => d.toISOString().slice(0, 10);

/* ------------------------------------------------------------
   Adapter: SEC EDGAR. Returns rows in the shape data.js uses.
   ------------------------------------------------------------ */
async function fetchSecEdgar(){
  if (!KEY) throw new Error('IPO_API_KEY not set');

  // Companies in registration have no listing_date until pricing, so a
  // forward window on that field returns almost nothing. Filter on
  // filing_date instead and let listing_date be absent.
  const start = new Date(Date.now() - LOOKBACK_DAYS * 864e5);
  const url = API
    + `?date_start=${iso(start)}&date_end=${iso(new Date(Date.now() + 864e5))}`
    + '&date_field=filing_date'
    + '&status=filed,amended,priced'
    + '&deal_type=ipo,direct_listing'
    + '&limit=500';

  const res = await fetch(url, { headers: { 'X-Api-Key': KEY } });
  if (!res.ok) throw new Error(`API ${res.status}: ${(await res.text()).slice(0, 160)}`);

  const raw = await res.json();
  if (!Array.isArray(raw)) throw new Error('unexpected payload shape');

  return raw
    .filter(r => r.name && r.exchange)
    .map(r => ({
      sourceType:'live',
      company:  r.name.replace(/,?\s+(Inc|Corp|Corporation|Ltd|Limited|LLC|Co)\.?$/i, '').trim(),
      ticker:   r.ticker || 'N/A',
      exchange: r.exchange,
      listDate: r.listing_date || r.priced_date || 'N/A',
      dateNote: r.listing_date
        ? (r.listing_date_verified ? 'Exchange confirmed' : 'Derived from 424B filing')
        : 'Date not yet set',
      sector:   sectorFor(r.sic_code, r.industry),
      status:   STATUS[r.status] || 'Reported',

      // The free tier returns no deal size. Left unavailable rather than
      // estimated; the dashboard renders N/A and sorts these to the
      // bottom of the valuation column in either direction.
      valUsd: 0,
      valDisp:'N/A',

      desc: `SEC-registered offering on ${r.exchange}. `
          + `Industry: ${r.industry || 'not classified'}${r.sic_code ? ` (SIC ${r.sic_code})` : ''}. `
          + `Governing form ${r.form_type || 'S-1'}`
          + (r.filing_date ? `, first filed ${r.filing_date}` : '')
          + (r.priced_date ? `, priced ${r.priced_date}` : '')
          + `. Deal type ${r.deal_type || 'ipo'}. `
          + 'Officer detail sits in the prospectus rather than the EDGAR index and is populated by hand.',

      ceo:'N/A', ceoEmail:'N/A', ceoConf:null,
      cfo:'N/A', cfoEmail:'N/A', cfoConf:null,

      source: r.sec_filing_url || 'SEC EDGAR',
      hq:'N/A',
      bank:'N/A'
    }));
}

/* ------------------------------------------------------------
   Agent sources. Each fetches one exchange page and has an LLM
   read it rather than matching selectors, because these pages
   are published in four languages and redesign without notice.

   A source that fails leaves its curated rows in place, so a
   blocked exchange degrades to the hand-maintained data rather
   than vanishing from the table.
   ------------------------------------------------------------ */
function agentSource(cfg){
  return {
    name: `${cfg.exchange} (agent)`,
    exchanges: [cfg.exchange],
    async fetch(){
      const { text, strategy } = await fetchPage(cfg.url, { browser: cfg.browser });
      const { rows, dropped } = await extractListings({
        text, exchange: cfg.exchange, url: cfg.url, hint: cfg.hint
      });
      if (dropped.length) console.error(`  ${cfg.exchange} dropped ${dropped.length}: ${dropped.slice(0,3).join('; ')}`);
      console.error(`  ${cfg.exchange} via ${strategy}, ${text.length} chars`);
      return rows;
    }
  };
}

const SOURCES = [
  { name:'SEC EDGAR', exchanges:['NASDAQ','NYSE','AMEX'], fetch: fetchSecEdgar },
  ...AGENT_SOURCES.filter(s => s.enabled !== false).map(agentSource)
];

/* ------------------------------------------------------------
   Validation. A malformed payload is never published.
   ------------------------------------------------------------ */
const SHAPE = ['sourceType','company','ticker','exchange','listDate','dateNote','sector','status',
               'valUsd','valDisp','desc','ceo','ceoEmail','cfo','cfoEmail','source','hq','bank'];

function validate(rows){
  const errs = [];
  rows.forEach((r, i) => {
    SHAPE.forEach(k => { if (r[k] === undefined) errs.push(`row ${i} (${r.company}) missing ${k}`); });
    if (r.listDate !== 'N/A' && !/^\d{4}-\d{2}-\d{2}$/.test(r.listDate || ''))
      errs.push(`row ${i} (${r.company}) bad listDate`);
    if (typeof r.valUsd !== 'number')                  errs.push(`row ${i} (${r.company}) valUsd not numeric`);
  });
  return errs;
}

async function readSeed(){
  const src = await fs.readFile(new URL('../data.js', import.meta.url), 'utf8');
  const win = {};
  new Function('window', src)(win);
  return win.SEED.DATA;
}

async function main(){
  const seed = await readSeed();
  let rows = [...seed];
  const report = [];

  // Four at a time. Enough to keep the run short, gentle enough
  // that no single exchange sees a burst of requests.
  const CONCURRENCY = 4;
  const results = [];
  for (let i = 0; i < SOURCES.length; i += CONCURRENCY){
    const batch = SOURCES.slice(i, i + CONCURRENCY);
    results.push(...await Promise.all(batch.map(async s => {
      try {
        const fresh = await s.fetch();
        if (!fresh.length) throw new Error('source returned no rows');
        return { s, fresh };
      } catch (e){
        return { s, error: e.message };
      }
    })));
  }

  for (const { s, fresh, error } of results){
    if (error){
      report.push(`${s.name}: FAILED (${error}) — curated rows retained`);
      continue;
    }
    // Replace only this source's exchanges; everything else is untouched.
    rows = rows.filter(r => !s.exchanges.includes(r.exchange)).concat(fresh);
    report.push(`${s.name}: ${fresh.length} live rows`);
  }

  const errs = validate(rows);
  if (errs.length){
    console.error('Validation failed, nothing written:\n' + errs.slice(0, 20).join('\n'));
    process.exit(1);
  }

  if (rows.length < seed.length * 0.5){
    console.error(`Only ${rows.length} rows against a ${seed.length}-row seed. Refusing to publish.`);
    process.exit(1);
  }

  rows.sort((a, b) => {
    if (a.listDate === 'N/A') return 1;          // undated deals sit at the end
    if (b.listDate === 'N/A') return -1;
    return a.listDate.localeCompare(b.listDate);
  });

  const live = rows.filter(r => r.sourceType === 'live').length;

  await fs.writeFile(
    new URL('../data.json', import.meta.url),
    JSON.stringify({
      generated: new Date().toISOString(),
      counts: { total: rows.length, live, curated: rows.length - live },
      liveExchanges: SOURCES.flatMap(s => s.exchanges),
      listings: rows
    }, null, 2)
  );

  console.log(report.join('\n'));
  console.log(`Wrote ${rows.length} listings (${live} live, ${rows.length - live} curated).`);
}

main().catch(e => { console.error(e); process.exit(1); });
