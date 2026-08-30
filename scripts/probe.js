#!/usr/bin/env node
/* ============================================================
   scripts/probe.js
   ------------------------------------------------------------
   Tries every source and reports which respond, by what
   strategy, and how much text came back. Run this before
   wiring anything up — it tells you which exchanges block
   datacenter traffic and which need a real browser.

     node scripts/probe.js
     USE_BROWSER=1 node scripts/probe.js       # include Playwright
     node scripts/probe.js LSE WSE             # a subset
   ============================================================ */

import { fetchPage } from './lib/fetch-page.js';
import { SOURCES }   from './sources.js';

const only = process.argv.slice(2).map(s => s.toUpperCase());
const list = only.length ? SOURCES.filter(s => only.includes(s.exchange)) : SOURCES;

const pad = (s, n) => String(s).padEnd(n);
console.log(pad('EXCHANGE', 10) + pad('RESULT', 12) + pad('CHARS', 9) + 'DETAIL');
console.log('-'.repeat(96));

let ok = 0;
for (const s of list){
  try {
    const { text, strategy } = await fetchPage(s.url, { browser: s.browser });
    ok++;
    const preview = text.slice(0, 60).replace(/\s+/g, ' ');
    console.log(pad(s.exchange, 10) + pad(strategy, 12) + pad(text.length, 9) + preview);
  } catch (e){
    console.log(pad(s.exchange, 10) + pad('BLOCKED', 12) + pad('—', 9) + e.message.slice(0, 70));
  }
}
console.log('-'.repeat(96));
console.log(`${ok}/${list.length} reachable.`);
if (ok < list.length && process.env.USE_BROWSER !== '1'){
  console.log('Retry the failures with USE_BROWSER=1 after: npm i -D playwright && npx playwright install chromium');
}
