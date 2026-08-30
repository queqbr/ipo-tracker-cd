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
const MODEL = process.env.EXTRACT_MODEL || 'gpt-4o-mini';
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
  valDisp   string  expected valuation or deal size with its currency exactly as stated, e.g. "PLN 4.4bn", or "N/A"
  valUsd    number  approximate USD equivalent in MILLIONS, or 0 when no figure is given
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
6. Dates must be YYYY-MM-DD. If the page gives only a month or quarter, use "N/A" and say so in dateNote.`;

function stripFences(s){
  return s.trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();
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
    valDisp:  s(row.valDisp),
    desc:     s(row.desc),
    ceo:      s(row.ceo), ceoEmail:'N/A', ceoConf:null,
    cfo:      s(row.cfo), cfoEmail:'N/A', cfoConf:null,
    hq:       s(row.hq),
    bank:     s(row.bank)
  }};
}

/* ------------------------------------------------------------ */
export async function extractListings({ text, exchange, url, hint }){
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
      model: MODEL,
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
