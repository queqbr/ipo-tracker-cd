/* ============================================================
   lib/extract.js
   ------------------------------------------------------------
   Turns a page of listing announcements into rows matching the
   dashboard schema, using an LLM rather than CSS selectors.

   The reason is not novelty. These eleven exchanges publish in
   different layouts and four languages, and they redesign
   without notice. A selector-based scraper breaks silently on a
   class rename; a model reading the text does not care about
   markup at all.

   The model is instructed to omit anything it cannot find in
   the page. Every row is then validated here, and anything the
   model invented that fails the schema is dropped rather than
   published.

   Requires OPENAI_API_KEY.
   ============================================================ */

const API   = 'https://api.openai.com/v1/chat/completions';
const DEFAULT_MODEL = process.env.EXTRACT_MODEL || 'gpt-4o-mini';
const MAX_CHARS = 60000;          // trim very long pages before sending

const SECTORS = ['FinTech','Technology','AI Infrastructure','Semiconductors','Biotech','Healthcare',
                 'Energy','Metals & Mining','Consumer','Industrials','Real Estate','Telecom','Other'];
const STATUSES = ['Approved','Filed','Announced','Reported'];

const SYSTEM = `You extract upcoming IPO listings from stock exchange announcement pages.

Return ONLY a JSON object of the form {"listings": [...]}. No prose, no markdown fences, no explanation.

Each element of "listings" must have exactly these keys:
  company   string  issuer name, without the legal suffix (drop Inc, Ltd, S.A., Bhd, plc)
  ticker    string  ticker or listing code, or "N/A"
  listDate  string  expected first trading day as YYYY-MM-DD, or "N/A" if not stated
  dateNote  string  short phrase describing how firm the date is, e.g. "Exchange confirmed", "Subscription period stated", "Date not yet set"
  sector    string  one of: ${SECTORS.join(', ')}
  status    string  one of: ${STATUSES.join(', ')}
  valDisp   string  TOTAL expected valuation or deal size with its currency, e.g. "PLN 4.4bn" — never a per-share or per-unit price, or "N/A"
  valUsd    number  approximate USD equivalent of the TOTAL deal size in MILLIONS, or 0 when no total figure is given or computable
  pricePerShare  string  per-share/per-unit issue price with its currency, e.g. "RM 0.35", ONLY when the page gives this separately from a stated total (see rule 7) — else "N/A"
  sharesOffered  number  total number of shares/units in the offering that pricePerShare corresponds to, or 0 if pricePerShare is "N/A"
  desc      string  two or three sentences on what the company does and what the offering involves, drawn only from the page
  ceo       string  chief executive's full name if the page names one, else "N/A"
  cfo       string  chief financial officer's full name if the page names one, else "N/A"
  hq        string  headquarters city and country, or "N/A"
  bank      string  bookrunners or lead managers, comma separated, or "N/A"

Rules, in order of importance:
1. Never invent a value. If the page does not state something, use "N/A" (or 0 for valUsd). A page with no IPO announcements returns {"listings": []}.
2. Never invent an executive name. This matters more than any other field.
3. Only include equity IPOs of operating companies that have not yet listed. Skip completed listings, delistings, results announcements, bond issues, secondary placings, and ETFs/ETPs/index funds/other collective investment vehicles — this schema is for companies going public, not funds listing new units.
4. Map status honestly: "Approved" when the exchange or regulator has cleared it, "Filed" when a prospectus or application is lodged, "Announced" when the company has published an intention to float, "Reported" when the page is only reporting rumour.
5. Translate names and descriptions into English, but leave tickers and currency codes as published.
6. Dates must be YYYY-MM-DD. If the page gives only a month or quarter, use "N/A" and say so in dateNote.
7. valDisp/valUsd are the TOTAL size of the offering, never a per-share or per-unit price. If the page states a total directly, use it and leave pricePerShare/sharesOffered as "N/A"/0. If the page instead gives only a per-share price and a share-count column with no stated total, do NOT do the multiplication yourself — put the per-share price in pricePerShare (with its currency) and the total share count in sharesOffered, and leave valDisp as "N/A" and valUsd as 0; the total gets computed afterward from those two numbers, which is more reliable than arithmetic done inline. If neither a total nor both of price and share count are available, leave all four fields at their empty values — never put a per-share price in valDisp.
8. valDisp always includes its currency code or symbol, taken from the page (a column header stating the currency counts as stating it) — never a bare number with no unit.`;

function stripFences(s){
  return s.trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();
}

/* ------------------------------------------------------------
   Deterministic price-per-share x shares-offered -> total, done in
   code rather than trusting the model's arithmetic. Returns null if
   the inputs aren't usable, so the caller can fall back to N/A.
   ------------------------------------------------------------ */
function estimateFromPerShare(pricePerShare, sharesOffered){
  if (!pricePerShare || pricePerShare === 'N/A') return null;
  const shares = Number(sharesOffered);
  if (!Number.isFinite(shares) || shares <= 0) return null;

  const m = pricePerShare.match(/^([^\d]*)([\d,]+\.?\d*)/);
  if (!m) return null;
  const currency = m[1].trim();
  const price = parseFloat(m[2].replace(/,/g, ''));
  if (!currency || !Number.isFinite(price) || price <= 0) return null;

  const total = price * shares;
  const formatted = total >= 1e9 ? (total / 1e9).toFixed(2) + 'bn'
                   : total >= 1e6 ? (total / 1e6).toFixed(1) + 'm'
                   : total.toLocaleString('en-US');
  // Flagged as estimated rather than presented like a stated total — this
  // is price x shares computed here, not a figure the page itself gave.
  return `${currency} ${formatted} (est.)`;
}

/* ------------------------------------------------------------
   Row validation. Anything malformed is dropped with a reason
   rather than allowed into data.json.
   ------------------------------------------------------------ */
function coerce(row, exchange){
  const s = v => (typeof v === 'string' && v.trim()) ? v.trim() : 'N/A';

  if (!row || typeof row !== 'object') return { ok:false, why:'not an object' };
  const company = s(row.company);
  if (company === 'N/A' || company.length < 2) return { ok:false, why:'no company name' };
  // Backstop for rule 3 above: catch a fund slipping through despite the
  // system prompt, rather than relying on instruction-following alone.
  if (/\bETFs?\b|\bETPs?\b|exchange[- ]traded fund|index fund|unit trust/i.test(company))
    return { ok:false, why:'ETF/fund, not a company IPO' };

  const listDate = s(row.listDate);
  if (listDate !== 'N/A' && !/^\d{4}-\d{2}-\d{2}$/.test(listDate))
    return { ok:false, why:`bad listDate "${listDate}"` };

  let valUsd = Number(row.valUsd);
  if (!Number.isFinite(valUsd) || valUsd < 0) valUsd = 0;

  // Backstop for rule 8 above: a bare number with no currency code is
  // ambiguous at best. Also catches rule 7's failure mode where a per-share
  // price (e.g. "RM 0.35") got reported as the deal size — those are always
  // small, so anything under 1 in whatever unit is stated is far too small
  // to be a real total offering size and is more likely a per-share price.
  let valDisp = s(row.valDisp);
  if (valDisp !== 'N/A' && !/[a-zA-Z]/.test(valDisp)) valDisp = 'N/A';
  if (valDisp !== 'N/A'){
    // A bare decimal under 1 at the very end of the string (nothing after it
    // but whitespace, e.g. "RM 0.35" or "RM0.35") is a per-share price, not
    // a total — a real total always has a scale word/suffix after the number.
    const trailingNum = valDisp.replace(/,/g, '').match(/(\d+\.\d+)\s*$/);
    if (trailingNum && parseFloat(trailingNum[1]) < 1) valDisp = 'N/A';
  }
  // No stated total, but the model (per rule 7) may have separately given a
  // per-share price and the share count — compute the total from those
  // rather than leaving a knowable figure as N/A.
  if (valDisp === 'N/A'){
    const estimated = estimateFromPerShare(s(row.pricePerShare), row.sharesOffered);
    if (estimated) valDisp = estimated;
  }

  return { ok:true, row: {
    sourceType:'live',
    company,
    ticker:   s(row.ticker),
    exchange,
    listDate,
    dateNote: s(row.dateNote) === 'N/A' ? 'Per exchange announcement' : s(row.dateNote),
    sector:   SECTORS.includes(row.sector) ? row.sector : 'Other',
    status:   STATUSES.includes(row.status) ? row.status : 'Announced',
    valUsd,
    valDisp,
    desc:     s(row.desc),
    ceo:      s(row.ceo), ceoEmail:'N/A', ceoConf:null,
    cfo:      s(row.cfo), cfoEmail:'N/A', cfoConf:null,
    hq:       s(row.hq),
    bank:     s(row.bank)
  }};
}

/* ------------------------------------------------------------ */
export async function extractListings({ text, exchange, url, hint, model }){
  const key = process.env.OPENAI_API_KEY;
  if (!key) throw new Error('OPENAI_API_KEY not set');

  const body = text.length > MAX_CHARS ? text.slice(0, MAX_CHARS) : text;

  const prompt = `Exchange: ${exchange}\nSource page: ${url}\n`
    + (hint ? `Context for this page: ${hint}\n` : '')
    + `\nPage content follows.\n\n---\n${body}\n---\n\nReturn the JSON object.`;

  const res = await fetch(API, {
    method:'POST',
    headers:{
      'content-type':'application/json',
      'authorization': `Bearer ${key}`
    },
    body: JSON.stringify({
      model: model || DEFAULT_MODEL,
      // Some sources (TWSE's full listing table, for one) run to 30-40+ rows;
      // 8000 was tight enough to truncate the response mid-JSON on at least
      // one real run, which surfaces as "model did not return valid JSON"
      // with no way to tell truncation apart from a genuine formatting miss.
      max_tokens: 16000,
      temperature: 0,
      response_format: { type: 'json_object' },
      messages: [
        { role:'system', content: SYSTEM },
        { role:'user', content: prompt }
      ]
    })
  });

  if (!res.ok) throw new Error(`OpenAI ${res.status}: ${(await res.text()).slice(0,200)}`);

  const data = await res.json();
  const raw  = data.choices?.[0]?.message?.content || '';
  const finishReason = data.choices?.[0]?.finish_reason;

  let parsed;
  try { parsed = JSON.parse(stripFences(raw)); }
  catch { throw new Error(`model did not return valid JSON (finish_reason: ${finishReason}, ${raw.length} chars)`); }
  if (Array.isArray(parsed?.listings)) parsed = parsed.listings;
  if (!Array.isArray(parsed)) throw new Error('model did not return a listings array');

  const rows = [], dropped = [];
  for (const r of parsed){
    const c = coerce(r, exchange);
    c.ok ? rows.push(c.row) : dropped.push(`${r?.company || '?'}: ${c.why}`);
  }

  // Same issuer can appear twice on a page; keep the first mention.
  const seen = new Set();
  const unique = rows.filter(r => {
    const k = r.company.toLowerCase();
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });

  return { rows: unique, dropped };
}
