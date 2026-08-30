#!/usr/bin/env node
/* ============================================================
   scripts/refresh.js
   ------------------------------------------------------------
   Rebuilds data.json. Run by .github/workflows/refresh.yml on a
   weekday cron; the workflow commits the result, the host
   redeploys, and the live page picks it up on its next poll.

   Every row comes from either the agent layer (scripts/sources.js,
   read live by an LLM) or the hand-maintained curated seed in
   data.js, which an agent source falls back to when it fails.

   Requires OPENAI_API_KEY for the agent layer. Locally:
     OPENAI_API_KEY=xxx node scripts/refresh.js
   In CI it comes from the repository secret of the same name.
   ============================================================ */

import fs from 'node:fs/promises';
import { fetchPage }       from './lib/fetch-page.js';
import { extractListings } from './lib/extract.js';
import { SOURCES as AGENT_SOURCES } from './sources.js';

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
      const { text, strategy } = await fetchPage(cfg.url, { browser: cfg.browser, engine: cfg.engine });
      const { rows, dropped } = await extractListings({
        text, exchange: cfg.exchange, url: cfg.url, hint: cfg.hint
      });
      if (dropped.length) console.error(`  ${cfg.exchange} dropped ${dropped.length}: ${dropped.slice(0,3).join('; ')}`);
      console.error(`  ${cfg.exchange} via ${strategy}, ${text.length} chars`);
      return rows;
    }
  };
}

const SOURCES = AGENT_SOURCES.filter(s => s.enabled !== false).map(agentSource);

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
