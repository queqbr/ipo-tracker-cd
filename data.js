/* ============================================================
   data.js — seed listing dataset
   ------------------------------------------------------------
   This file is the swappable layer. app.js prefers data.json
   when the page is served over http; this array is the offline
   fallback so the dashboard still opens from the file system.

   valUsd is a USD-normalised sort key in millions.
   valDisp is the local-currency figure that renders.
   ============================================================ */

window.SEED = {
// Static mirror of what data.json's liveExchanges/curatedOnly report live —
// only used for the offline (file://) fallback, so it won't self-update;
// keep in sync with scripts/sources.js by hand if that ever drifts.
LIVE_EXCHANGES: ['LSE','WSE','XETRA','DFM','TWSE','SET','TADAWUL','SGX','KLSE','B3'],
CURATED_ONLY: [
  { exchange:'JSE', note:'Requires a paid enterprise data subscription — no free public feed exists.' }
],
REGION: {
  LSE:'eu', WSE:'eu', XETRA:'eu',
  DFM:'mena', TADAWUL:'mena',
  JSE:'afr', B3:'afr',
  SGX:'apac', TWSE:'apac', SET:'apac', KLSE:'apac'
},
EXCHANGE_NAME: {
  LSE:'London', WSE:'Warsaw', XETRA:'Frankfurt', DFM:'Dubai', TADAWUL:'Riyadh',
  JSE:'Johannesburg', B3:'São Paulo', SGX:'Singapore', TWSE:'Taipei',
  SET:'Bangkok', KLSE:'Kuala Lumpur'
},
DATA: [
  // ---------------- LONDON ----------------
  { sourceType:'curated', company:'Ebury Partners', ticker:'EBUR', exchange:'LSE', listDate:'2026-10-14', dateNote:'Confirmed window',
    sector:'FinTech', status:'Filed', valUsd:2600, valDisp:'£2.0bn', pricePerShare:'N/A', sharesOffered:0,
    desc:'Cross-border payments and FX risk management for small and mid-sized corporates, operating across more than 25 countries. Santander holds a controlling stake and is expected to retain a majority position post-listing. Revenue is driven by FX spread on client flow rather than by interest income.',
    ceo:'Juan Lobato', ceoEmail:'juan.lobato@ebury.com', ceoConf:'inferred',
    cfo:'Diego Ballon Ossio', cfoEmail:'diego.ballonossio@ebury.com', cfoConf:'inferred',
    hq:'London, UK', bank:'Goldman Sachs, Santander' },

  { sourceType:'curated', company:'Monzo Bank', ticker:'MNZO', exchange:'LSE', listDate:'2027-02-01', dateNote:'H1 2027 guided',
    sector:'FinTech', status:'Reported', valUsd:7500, valDisp:'£5.9bn', pricePerShare:'N/A', sharesOffered:0,
    desc:'UK digital bank with roughly 12 million retail customers and a growing business banking book. Reached full-year statutory profitability in FY2025, with lending and interchange now the dominant revenue lines. A dual UK-US listing has been reported but not confirmed.',
    ceo:'TS Anil', ceoEmail:'ts.anil@monzo.com', ceoConf:'inferred',
    cfo:'Tom Oldham', cfoEmail:'tom.oldham@monzo.com', cfoConf:'inferred',
    hq:'London, UK', bank:'N/A' },

  { sourceType:'curated', company:'OakNorth Holdings', ticker:'OAKN', exchange:'LSE', listDate:'2027-03-15', dateNote:'Indicative',
    sector:'FinTech', status:'Reported', valUsd:3400, valDisp:'$3.4bn', pricePerShare:'N/A', sharesOffered:0,
    desc:'Profitable SME lender underwriting mid-market credit through a proprietary analytics platform, with a growing US loan book. Consistently profitable since 2017, which distinguishes it from most UK neobank listing candidates.',
    ceo:'Rishi Khosla', ceoEmail:'rishi.khosla@oaknorth.com', ceoConf:'inferred',
    cfo:'N/A', cfoEmail:'N/A', cfoConf:null,
    hq:'London, UK', bank:'N/A' },

  { sourceType:'curated', company:'Zilch Technology', ticker:'ZLCH', exchange:'LSE', listDate:'2027-01-20', dateNote:'Indicative',
    sector:'FinTech', status:'Reported', valUsd:2000, valDisp:'$2.0bn', pricePerShare:'N/A', sharesOffered:0,
    desc:'Ad-subsidised buy-now-pay-later platform monetising through commerce advertising rather than merchant discount alone. Management has signalled a preference for a London listing over New York.',
    ceo:'Philip Belamant', ceoEmail:'philip.belamant@zilch.com', ceoConf:'inferred',
    cfo:'N/A', cfoEmail:'N/A', cfoConf:null,
    hq:'London, UK', bank:'N/A' },

  { sourceType:'curated', company:'Vantage Data Centres EMEA', ticker:'VDCE', exchange:'LSE', listDate:'2027-04-12', dateNote:'Indicative',
    sector:'AI Infrastructure', status:'Reported', valUsd:9000, valDisp:'$9.0bn', pricePerShare:'N/A', sharesOffered:0,
    desc:'Hyperscale data centre platform across Western Europe with contracted capacity let to cloud and AI tenants on long-dated leases. Capital intensity and tenant concentration are the two lines an equity investor underwrites first.',
    ceo:'N/A', ceoEmail:'N/A', ceoConf:null,
    cfo:'N/A', cfoEmail:'N/A', cfoConf:null,
    hq:'London, UK', bank:'N/A' },

  // ---------------- WARSAW ----------------
  { sourceType:'curated', company:'Canpack Group', ticker:'CNPK', exchange:'WSE', listDate:'2026-11-18', dateNote:'Q4 2026 window',
    sector:'Industrials', status:'Announced', valUsd:4100, valDisp:'PLN 16.4bn', pricePerShare:'N/A', sharesOffered:0,
    desc:'Beverage can manufacturer supplying brewers and soft drink bottlers across Europe, the Americas and North Africa. Earnings track aluminium input costs and canned beverage volumes, with recent capacity additions in Brazil and the US.',
    ceo:'N/A', ceoEmail:'N/A', ceoConf:null,
    cfo:'N/A', cfoEmail:'N/A', cfoConf:null,
    hq:'Kraków, Poland', bank:'N/A' },

  { sourceType:'curated', company:'Velvet Care', ticker:'VLVT', exchange:'WSE', listDate:'2026-10-28', dateNote:'Q4 2026 window',
    sector:'Consumer', status:'Filed', valUsd:1100, valDisp:'PLN 4.4bn', pricePerShare:'N/A', sharesOffered:0,
    desc:'Central European tissue and hygiene paper producer owned by Partners Group, selling private label and branded product into Polish and neighbouring grocery channels. Pulp pricing is the principal margin variable.',
    ceo:'Artur Pielak', ceoEmail:'artur.pielak@velvetcare.pl', ceoConf:'inferred',
    cfo:'N/A', cfoEmail:'N/A', cfoConf:null,
    hq:'Kluczy, Poland', bank:'N/A' },

  { sourceType:'curated', company:'Empik Group', ticker:'EMPK', exchange:'WSE', listDate:'2027-05-10', dateNote:'Indicative',
    sector:'Consumer', status:'Reported', valUsd:900, valDisp:'PLN 3.6bn', pricePerShare:'N/A', sharesOffered:0,
    desc:'Polish media and lifestyle retailer combining a store estate with a marketplace platform. A previous listing attempt was withdrawn on valuation, and the current process is at an early stage.',
    ceo:'N/A', ceoEmail:'N/A', ceoConf:null,
    cfo:'N/A', cfoEmail:'N/A', cfoConf:null,
    hq:'Warsaw, Poland', bank:'N/A' },

  // ---------------- DUBAI ----------------
  { sourceType:'curated', company:'Dubizzle Group', ticker:'DUBZ', exchange:'DFM', listDate:'2026-10-06', dateNote:'Confirmed window',
    sector:'Technology', status:'Approved', valUsd:5000, valDisp:'$5.0bn', pricePerShare:'N/A', sharesOffered:0,
    desc:'Classifieds and marketplace operator across the Gulf, with property, motors and jobs verticals in the UAE, Egypt and Pakistan. Revenue is subscription and listing-fee based, giving it recurring characteristics unusual for a regional consumer internet asset.',
    ceo:'Haider Ali Khan', ceoEmail:'haider.khan@dubizzle.com', ceoConf:'inferred',
    cfo:'N/A', cfoEmail:'N/A', cfoConf:null,
    hq:'Dubai, UAE', bank:'Emirates NBD Capital, Goldman Sachs' },

  { sourceType:'curated', company:'Alef Group', ticker:'ALEF', exchange:'DFM', listDate:'2026-12-09', dateNote:'Q4 2026 window',
    sector:'Real Estate', status:'Announced', valUsd:2700, valDisp:'AED 9.9bn', pricePerShare:'N/A', sharesOffered:0,
    desc:'Sharjah master developer with a residential and mixed-use pipeline concentrated in Al Mamsha and Hayyan. Cash flows are tied to off-plan sales velocity and the UAE population growth that has underpinned the current cycle.',
    ceo:'Issa Ataya', ceoEmail:'issa.ataya@alefgroup.ae', ceoConf:'inferred',
    cfo:'N/A', cfoEmail:'N/A', cfoConf:null,
    hq:'Sharjah, UAE', bank:'N/A' },

  { sourceType:'curated', company:'Gulf Data Hub', ticker:'GDHB', exchange:'DFM', listDate:'2027-02-24', dateNote:'Indicative',
    sector:'AI Infrastructure', status:'Reported', valUsd:3200, valDisp:'$3.2bn', pricePerShare:'N/A', sharesOffered:0,
    desc:'Regional colocation and data centre operator expanding capacity across the UAE and Saudi Arabia to serve sovereign cloud and AI workloads. Growth is contracted but requires sustained capital deployment ahead of revenue.',
    ceo:'N/A', ceoEmail:'N/A', ceoConf:null,
    cfo:'N/A', cfoEmail:'N/A', cfoConf:null,
    hq:'Dubai, UAE', bank:'N/A' },

  // ---------------- RIYADH ----------------
  { sourceType:'curated', company:'Tabby', ticker:'TABY', exchange:'TADAWUL', listDate:'2026-11-25', dateNote:'Q4 2026 window',
    sector:'FinTech', status:'Filed', valUsd:3300, valDisp:'$3.3bn', pricePerShare:'N/A', sharesOffered:0,
    desc:'Gulf buy-now-pay-later and consumer payments platform, redomiciled to Saudi Arabia ahead of listing. Holds a Saudi payments licence and has extended into card issuance and everyday spending, moving the revenue mix away from pure merchant fees.',
    ceo:'Hosam Arab', ceoEmail:'hosam.arab@tabby.ai', ceoConf:'inferred',
    cfo:'N/A', cfoEmail:'N/A', cfoConf:null,
    hq:'Riyadh, Saudi Arabia', bank:'HSBC Saudi Arabia, J.P. Morgan' },

  { sourceType:'curated', company:'Ejada Systems', ticker:'EJDA', exchange:'TADAWUL', listDate:'2026-12-15', dateNote:'Q4 2026 window',
    sector:'Technology', status:'Approved', valUsd:2400, valDisp:'SAR 9.0bn', pricePerShare:'N/A', sharesOffered:0,
    desc:'IT services and systems integration business owned by stc, serving Saudi banking and government clients. Backlog is long-dated and concentrated among a small number of institutional buyers.',
    ceo:'N/A', ceoEmail:'N/A', ceoConf:null,
    cfo:'N/A', cfoEmail:'N/A', cfoConf:null,
    hq:'Riyadh, Saudi Arabia', bank:'SNB Capital' },

  { sourceType:'curated', company:'Saudi Global Ports', ticker:'SGPT', exchange:'TADAWUL', listDate:'2027-03-02', dateNote:'Indicative',
    sector:'Industrials', status:'Reported', valUsd:2900, valDisp:'SAR 10.9bn', pricePerShare:'N/A', sharesOffered:0,
    desc:'Container terminal operator holding the concession for King Abdulaziz Port in Dammam. Throughput tracks Saudi import volumes and the industrial buildout under Vision 2030.',
    ceo:'N/A', ceoEmail:'N/A', ceoConf:null,
    cfo:'N/A', cfoEmail:'N/A', cfoConf:null,
    hq:'Dammam, Saudi Arabia', bank:'N/A' },

  { sourceType:'curated', company:'Nupco', ticker:'NUPC', exchange:'TADAWUL', listDate:'2027-05-18', dateNote:'Indicative',
    sector:'Healthcare', status:'Reported', valUsd:4500, valDisp:'SAR 16.9bn', pricePerShare:'N/A', sharesOffered:0,
    desc:'National unified procurement company for medical supplies and pharmaceuticals, held by the Public Investment Fund. A listing would be a further step in the PIF programme of partial privatisations.',
    ceo:'N/A', ceoEmail:'N/A', ceoConf:null,
    cfo:'N/A', cfoEmail:'N/A', cfoConf:null,
    hq:'Riyadh, Saudi Arabia', bank:'N/A' },

  // ---------------- JOHANNESBURG ----------------
  { sourceType:'curated', company:'Coca-Cola Beverages Africa', ticker:'CCBA', exchange:'JSE', listDate:'2027-04-20', dateNote:'Indicative',
    sector:'Consumer', status:'Reported', valUsd:8000, valDisp:'$8.0bn', pricePerShare:'N/A', sharesOffered:0,
    desc:'Largest bottler on the African continent, operating across 14 markets with South Africa, Kenya, Ethiopia and Nigeria as the principal volume contributors. A dual JSE and offshore listing has been under consideration since 2021, with timing contingent on rand stability.',
    ceo:'Sunil Gupta', ceoEmail:'sunil.gupta@ccbagroup.com', ceoConf:'inferred',
    cfo:'N/A', cfoEmail:'N/A', cfoConf:null,
    hq:'Johannesburg, South Africa', bank:'N/A' },

  { sourceType:'curated', company:'Tyme Group', ticker:'TYME', exchange:'JSE', listDate:'2027-06-08', dateNote:'Indicative',
    sector:'FinTech', status:'Reported', valUsd:1500, valDisp:'$1.5bn', pricePerShare:'N/A', sharesOffered:0,
    desc:'Digital banking group operating TymeBank in South Africa and GoTyme in the Philippines, built on a kiosk-led acquisition model in low-income retail channels. Management has pointed to a 2028 listing, with an earlier JSE step possible.',
    ceo:'Coenraad Jonker', ceoEmail:'coenraad.jonker@tymebank.co.za', ceoConf:'inferred',
    cfo:'N/A', cfoEmail:'N/A', cfoConf:null,
    hq:'Johannesburg, South Africa', bank:'N/A' },

  { sourceType:'curated', company:'Kropz Elandsfontein', ticker:'KRPZ', exchange:'JSE', listDate:'2026-11-05', dateNote:'Q4 2026 window',
    sector:'Metals & Mining', status:'Announced', valUsd:420, valDisp:'ZAR 7.6bn', pricePerShare:'N/A', sharesOffered:0,
    desc:'Phosphate producer operating the Elandsfontein mine in the Western Cape, with output sold into African and European fertiliser markets. Earnings are levered to phosphate rock pricing and to a ramp that has repeatedly slipped.',
    ceo:'N/A', ceoEmail:'N/A', ceoConf:null,
    cfo:'N/A', cfoEmail:'N/A', cfoConf:null,
    hq:'Cape Town, South Africa', bank:'N/A' },

  // ---------------- SÃO PAULO ----------------
  { sourceType:'curated', company:'CSN Mineração', ticker:'CMIN3', exchange:'B3', listDate:'2027-03-23', dateNote:'Rate-path dependent',
    sector:'Metals & Mining', status:'Reported', valUsd:6200, valDisp:'BRL 33.5bn', pricePerShare:'N/A', sharesOffered:0,
    desc:'Iron ore producer operating the Casa de Pedra complex in Minas Gerais with integrated rail and port logistics. A follow-on has been repeatedly deferred; issuance across B3 remains constrained by the domestic policy rate.',
    ceo:'N/A', ceoEmail:'N/A', ceoConf:null,
    cfo:'N/A', cfoEmail:'N/A', cfoConf:null,
    hq:'São Paulo, Brazil', bank:'N/A' },

  { sourceType:'curated', company:'Vero Internet', ticker:'VERO3', exchange:'B3', listDate:'2027-05-05', dateNote:'Indicative',
    sector:'Telecom', status:'Reported', valUsd:1100, valDisp:'BRL 5.9bn', pricePerShare:'N/A', sharesOffered:0,
    desc:'Regional fibre broadband operator consolidating internet service providers across southern and central Brazil. A listing has been contingent on a lower Selic and a reopening of the domestic equity window.',
    ceo:'N/A', ceoEmail:'N/A', ceoConf:null,
    cfo:'N/A', cfoEmail:'N/A', cfoConf:null,
    hq:'Curitiba, Brazil', bank:'N/A' },

  // ---------------- SINGAPORE ----------------
  { sourceType:'curated', company:'Foundation Healthcare Holdings', ticker:'FHH', exchange:'SGX', listDate:'2026-09-24', dateNote:'Confirmed window',
    sector:'Healthcare', status:'Filed', valUsd:340, valDisp:'S$450m', pricePerShare:'N/A', sharesOffered:0,
    desc:'Operator of specialist medical clinics and day surgery centres in Singapore and Malaysia, with a physician partnership model that ties clinician retention to equity. Growth is acquisitive and margin depends on clinic utilisation.',
    ceo:'N/A', ceoEmail:'N/A', ceoConf:null,
    cfo:'N/A', cfoEmail:'N/A', cfoConf:null,
    hq:'Singapore', bank:'N/A' },

  { sourceType:'curated', company:'Sea Forrest Marine', ticker:'SFM', exchange:'SGX', listDate:'2026-12-02', dateNote:'Q4 2026 window',
    sector:'Energy', status:'Announced', valUsd:210, valDisp:'S$280m', pricePerShare:'N/A', sharesOffered:0,
    desc:'Marine electrification and energy systems supplier retrofitting harbour craft and offshore vessels to hybrid and full-electric propulsion. Order book is supported by Singapore port decarbonisation mandates.',
    ceo:'N/A', ceoEmail:'N/A', ceoConf:null,
    cfo:'N/A', cfoEmail:'N/A', cfoConf:null,
    hq:'Singapore', bank:'N/A' },

  { sourceType:'curated', company:'Keppel DC REIT II', ticker:'KDC2', exchange:'SGX', listDate:'2027-01-27', dateNote:'Indicative',
    sector:'AI Infrastructure', status:'Reported', valUsd:1800, valDisp:'S$2.4bn', pricePerShare:'N/A', sharesOffered:0,
    desc:'Proposed data centre trust holding Asian colocation assets sponsored into a listed vehicle. Distribution yield and the sponsor pipeline are the two variables that determine pricing for this structure.',
    ceo:'N/A', ceoEmail:'N/A', ceoConf:null,
    cfo:'N/A', cfoEmail:'N/A', cfoConf:null,
    hq:'Singapore', bank:'N/A' },

  // ---------------- TAIPEI ----------------
  { sourceType:'curated', company:'Hanpin Electron', ticker:'6873', exchange:'TWSE', listDate:'2026-10-21', dateNote:'Q4 2026 window',
    sector:'Semiconductors', status:'Approved', valUsd:780, valDisp:'TWD 25.0bn', pricePerShare:'N/A', sharesOffered:0,
    desc:'Advanced probe card and test interface supplier serving foundry and OSAT customers in Taiwan. Demand is levered to leading-edge test intensity, which rises with each node transition.',
    ceo:'N/A', ceoEmail:'N/A', ceoConf:null,
    cfo:'N/A', cfoEmail:'N/A', cfoConf:null,
    hq:'Hsinchu, Taiwan', bank:'N/A' },

  { sourceType:'curated', company:'Formosa Thermal Systems', ticker:'6941', exchange:'TWSE', listDate:'2027-02-10', dateNote:'Indicative',
    sector:'AI Infrastructure', status:'Announced', valUsd:1250, valDisp:'TWD 40.1bn', pricePerShare:'N/A', sharesOffered:0,
    desc:'Liquid cooling and thermal management supplier for AI server racks, shipping to Taiwanese ODM assemblers. Revenue concentration among two customers is the principal disclosed risk.',
    ceo:'N/A', ceoEmail:'N/A', ceoConf:null,
    cfo:'N/A', cfoEmail:'N/A', cfoConf:null,
    hq:'Taoyuan, Taiwan', bank:'N/A' },

  // ---------------- BANGKOK ----------------
  { sourceType:'curated', company:'SCG Cleanergy', ticker:'SCGC', exchange:'SET', listDate:'2026-11-11', dateNote:'Q4 2026 window',
    sector:'Energy', status:'Filed', valUsd:1400, valDisp:'THB 49.0bn', pricePerShare:'N/A', sharesOffered:0,
    desc:'Renewable power arm of Siam Cement Group, developing solar rooftop, floating solar and wind capacity with corporate offtake across Thailand and Vietnam. Contracted PPAs give the revenue base a utility profile.',
    ceo:'N/A', ceoEmail:'N/A', ceoConf:null,
    cfo:'N/A', cfoEmail:'N/A', cfoConf:null,
    hq:'Bangkok, Thailand', bank:'N/A' },

  { sourceType:'curated', company:'Bangkok Genomics', ticker:'BKGN', exchange:'SET', listDate:'2027-04-06', dateNote:'Indicative',
    sector:'Biotech', status:'Reported', valUsd:260, valDisp:'THB 9.1bn', pricePerShare:'N/A', sharesOffered:0,
    desc:'Clinical genomics and diagnostics laboratory network serving Thai private hospitals, with an oncology screening product in regulatory review. Reimbursement coverage is the gating factor on volume growth.',
    ceo:'N/A', ceoEmail:'N/A', ceoConf:null,
    cfo:'N/A', cfoEmail:'N/A', cfoConf:null,
    hq:'Bangkok, Thailand', bank:'N/A' },

  // ---------------- KUALA LUMPUR ----------------
  { sourceType:'curated', company:'Sunway Healthcare Group', ticker:'SWHG', exchange:'KLSE', listDate:'2026-10-30', dateNote:'Confirmed window',
    sector:'Healthcare', status:'Approved', valUsd:4000, valDisp:'MYR 18.9bn', pricePerShare:'N/A', sharesOffered:0,
    desc:'Private hospital group operating tertiary facilities across the Klang Valley and Penang, with a bed expansion programme funded partly by the offering. GIC and Sighthound hold pre-IPO stakes.',
    ceo:'N/A', ceoEmail:'N/A', ceoConf:null,
    cfo:'N/A', cfoEmail:'N/A', cfoConf:null,
    hq:'Selangor, Malaysia', bank:'CIMB, Maybank' },

  { sourceType:'curated', company:'Loob Holding', ticker:'LOOB', exchange:'KLSE', listDate:'2026-12-18', dateNote:'Q4 2026 window',
    sector:'Consumer', status:'Filed', valUsd:520, valDisp:'MYR 2.5bn', pricePerShare:'N/A', sharesOffered:0,
    desc:'Operator of the Tealive beverage chain with more than 900 outlets across Malaysia and a franchised presence in Southeast Asia. Same-store sales and franchise fee income drive the earnings base.',
    ceo:'Bryan Loo', ceoEmail:'bryan.loo@tealive.com.my', ceoConf:'inferred',
    cfo:'N/A', cfoEmail:'N/A', cfoConf:null,
    hq:'Kuala Lumpur, Malaysia', bank:'N/A' },

  // ---------------- FRANKFURT ----------------
  { sourceType:'curated', company:'Brainlab', ticker:'BLAB', exchange:'XETRA', listDate:'2026-09-30', dateNote:'Confirmed window',
    sector:'Healthcare', status:'Filed', valUsd:2100, valDisp:'€1.9bn', pricePerShare:'N/A', sharesOffered:0,
    desc:'Surgical navigation and radiotherapy software business selling image-guided systems into hospitals worldwide. A 2025 listing attempt was pulled on market conditions rather than on the underlying book.',
    ceo:'Stefan Vilsmeier', ceoEmail:'stefan.vilsmeier@brainlab.com', ceoConf:'inferred',
    cfo:'N/A', cfoEmail:'N/A', cfoConf:null,
    hq:'Munich, Germany', bank:'J.P. Morgan, Deutsche Bank' },

  { sourceType:'curated', company:'Stada Arzneimittel', ticker:'STAD', exchange:'XETRA', listDate:'2026-11-04', dateNote:'Q4 2026 window',
    sector:'Healthcare', status:'Announced', valUsd:11500, valDisp:'€10.5bn', pricePerShare:'N/A', sharesOffered:0,
    desc:'Generics and consumer healthcare manufacturer owned by Bain Capital and Cinven, with a European generics book and a growing specialty biosimilars pipeline. A listing has been prepared and postponed more than once since 2024.',
    ceo:'Peter Goldschmidt', ceoEmail:'peter.goldschmidt@stada.de', ceoConf:'inferred',
    cfo:'N/A', cfoEmail:'N/A', cfoConf:null,
    hq:'Bad Vilbel, Germany', bank:'N/A' },

  { sourceType:'curated', company:'Flix SE', ticker:'FLIX', exchange:'XETRA', listDate:'2027-03-09', dateNote:'Indicative',
    sector:'Consumer', status:'Reported', valUsd:4300, valDisp:'€3.9bn', pricePerShare:'N/A', sharesOffered:0,
    desc:'Long-distance bus and rail operator running an asset-light network across Europe, North America and Latin America under the FlixBus and FlixTrain brands. Capacity is contracted from third-party operators, which keeps fixed costs low and margins exposed to load factor.',
    ceo:'André Schwämmlein', ceoEmail:'andre.schwaemmlein@flixbus.com', ceoConf:'inferred',
    cfo:'N/A', cfoEmail:'N/A', cfoConf:null,
    hq:'Munich, Germany', bank:'N/A' },

  { sourceType:'curated', company:'Ionos Renewables', ticker:'IONR', exchange:'XETRA', listDate:'2027-01-13', dateNote:'Indicative',
    sector:'Energy', status:'Reported', valUsd:2600, valDisp:'€2.4bn', pricePerShare:'N/A', sharesOffered:0,
    desc:'Utility-scale wind and battery storage developer with a German and Nordic pipeline contracted to industrial offtakers. Grid connection queues rather than capital availability are the binding constraint on delivery.',
    ceo:'N/A', ceoEmail:'N/A', ceoConf:null,
    cfo:'N/A', cfoEmail:'N/A', cfoConf:null,
    hq:'Hamburg, Germany', bank:'N/A' }
],
DOMAINS: {
  'Ebury Partners':'ebury.com', 'Monzo Bank':'monzo.com', 'OakNorth Holdings':'oaknorth.com',
  'Zilch Technology':'zilch.com', 'Vantage Data Centres EMEA':'vantage-dc.com',
  'Canpack Group':'canpack.com', 'Velvet Care':'velvetcare.pl', 'Empik Group':'empik.com',
  'Dubizzle Group':'dubizzle.com', 'Alef Group':'alefgroup.ae', 'Gulf Data Hub':'gulfdatahub.com',
  'Tabby':'tabby.ai', 'Ejada Systems':'ejada.com', 'Saudi Global Ports':'sgp.com.sa', 'Nupco':'nupco.com',
  'Coca-Cola Beverages Africa':'ccbagroup.com', 'Tyme Group':'tymebank.co.za', 'Kropz Elandsfontein':'kropz.com',
  'CSN Mineração':'csn.com.br', 'Vero Internet':'vero.net.br',
  'Foundation Healthcare Holdings':'foundationhealthcare.sg', 'Sea Forrest Marine':'seaforrest.com',
  'Keppel DC REIT II':'keppeldcreit.com', 'Hanpin Electron':'hanpin.com.tw',
  'Formosa Thermal Systems':'formosathermal.com.tw', 'SCG Cleanergy':'scgcleanergy.com',
  'Bangkok Genomics':'bkkgenomics.co.th', 'Sunway Healthcare Group':'sunwaymedical.com',
  'Loob Holding':'tealive.com.my', 'Brainlab':'brainlab.com', 'Stada Arzneimittel':'stada.de',
  'Flix SE':'flixbus.com', 'Ionos Renewables':'ionos-re.de'
}
};
