/* ============================================================
   lib/fetch-page.js
   ------------------------------------------------------------
   Retrieves a listing page and reduces it to text an LLM can
   read. Three fetch strategies, tried in order:

     1. plain     — a normal GET with browser headers
     2. jina      — r.jina.ai reader proxy, which renders JS and
                    egresses from a different IP than the runner
     3. browser   — local Playwright, for pages that need a real
                    browser. Off by default; set USE_BROWSER=1.
                    Defaults to Chromium; some sites fingerprint and
                    block headless Chromium specifically while
                    letting Firefox or WebKit through, selectable
                    per-source via engine:'firefox'|'webkit'.

   Most exchange sites block datacenter IPs or render their
   calendar client-side, so a single strategy will not cover
   eleven of them. The order above escalates only as needed.
   ============================================================ */

const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 '
         + '(KHTML, like Gecko) Chrome/124.0 Safari/537.36';

const HEADERS = {
  'User-Agent': UA,
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
  'Accept-Language': 'en-GB,en;q=0.9',
  'Cache-Control': 'no-cache'
};

const sleep = ms => new Promise(r => setTimeout(r, ms));

async function withRetry(fn, attempts = 3){
  let last;
  for (let i = 0; i < attempts; i++){
    try { return await fn(); }
    catch (e){
      last = e;
      if (i < attempts - 1) await sleep(1200 * (i + 1));   // linear backoff
    }
  }
  throw last;
}

async function plain(url){
  const res = await fetch(url, { headers: HEADERS, redirect: 'follow' });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.text();
}

/* Reader proxy. Returns rendered text rather than raw HTML, which
   also handles client-side calendars. No key needed at low volume. */
async function viaJina(url){
  const res = await fetch('https://r.jina.ai/' + url, {
    headers: { 'User-Agent': UA, 'Accept': 'text/plain' }
  });
  if (!res.ok) throw new Error(`reader HTTP ${res.status}`);
  const text = await res.text();
  if (text.trim().length < 200) throw new Error('reader returned an empty page');
  return text;
}

/* Playwright, only when explicitly enabled. Install with:
     npm i -D playwright && npx playwright install chromium firefox webkit

   Some sites (Akamai/Cloudflare-fronted ones observed so far: SGX,
   TADAWUL, KLSE) fingerprint and block headless Chromium specifically
   while letting Firefox or WebKit through cleanly. Default stays
   chromium; set engine:'firefox' (or 'webkit') per-source in
   sources.js for ones that need it. */
async function viaBrowser(url, engine = 'chromium'){
  const playwright = await import('playwright');
  const launcher = playwright[engine];
  if (!launcher) throw new Error(`unknown engine "${engine}"`);
  const browser = await launcher.launch();
  try {
    // Each engine's own default UA is left alone for firefox/webkit — pairing
    // a spoofed Chrome UA with a non-Chrome TLS/JS fingerprint reads as more
    // suspicious than either alone, and it's the fingerprint, not the UA
    // string, that gets these past the block in the first place.
    const page = await browser.newPage(engine === 'chromium' ? { userAgent: UA, locale: 'en-GB' } : { locale: 'en-GB' });
    await page.goto(url, { waitUntil: 'networkidle', timeout: 45000 });

    // Some pages (SET's IPO cards, observed) only populate on-scroll via an
    // intersection observer rather than on load. Scrolling costs a few
    // seconds and is a no-op on pages that don't need it, so it runs always.
    await page.evaluate(async () => {
      for (let i = 0; i < 10; i++){
        window.scrollBy(0, 800);
        await new Promise(r => setTimeout(r, 300));
      }
    });
    await page.waitForTimeout(1500);

    return await page.content();
  } finally {
    await browser.close();
  }
}

/* ------------------------------------------------------------
   Strip markup down to readable text. Tables survive as pipe-
   delimited rows so the model can still see column structure.
   ------------------------------------------------------------ */
export function toText(html){
  if (!/<[a-z][\s\S]*>/i.test(html)) return html;          // already text

  return html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, ' ')
    .replace(/<!--[\s\S]*?-->/g, ' ')
    .replace(/<\/(td|th)>\s*/gi, ' | ')
    .replace(/<\/(tr|p|div|li|h[1-6])>/gi, '\n')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&#39;|&apos;/g, "'").replace(/&quot;/g, '"')
    .split('\n').map(l => l.replace(/[ \t|]+/g, m => m.includes('|') ? ' | ' : ' ').trim())
    .filter(l => l.length > 1)
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

/* ------------------------------------------------------------
   Public entry point. Returns { text, strategy }.
   ------------------------------------------------------------ */
export async function fetchPage(url, opts = {}){
  // A source marked browser:true skips straight to the headless browser
  // rather than joining the escalation below — some pages return a
  // full-length nav shell on a plain fetch that clears the 300-char bar
  // without containing any real content, which would otherwise strand
  // the source on garbage.
  const browser = () => viaBrowser(url, opts.engine);
  const strategies = opts.browser
    ? [['browser', browser]]
    : [
        ['plain',   () => plain(url)],
        ['reader',  () => viaJina(url)],
        ...(process.env.USE_BROWSER === '1' ? [['browser', browser]] : [])
      ];

  const failures = [];
  for (const [name, fn] of strategies){
    try {
      const raw  = await withRetry(() => fn(), name === 'plain' ? 2 : 1);
      const text = toText(raw);
      if (text.length < 300) throw new Error(`only ${text.length} chars of text`);
      return { text, strategy: name };
    } catch (e){
      failures.push(`${name}: ${e.message}`);
    }
  }
  throw new Error(`all strategies failed — ${failures.join('; ')}`);
}
