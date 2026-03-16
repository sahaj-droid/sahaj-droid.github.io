const express = require('express');
const cors = require('cors');
const https = require('https');
const zlib = require('zlib');

const app = express();
app.use(cors());

const SYMBOL_MAP = {
  // ── Indices ────────────────────────────────────────────────
  nifty50:'^NSEI', banknifty:'^NSEBANK', sensex:'^BSESN', bankex:'^BSEBANKEX',
  finnifty:'NIFTY_FIN_SERVICE.NS', midcap:'^NSEMDCP50', smallcap:'NIFTYSMLCAP250.NS',
  niftyit:'^CNXIT', niftypharma:'^CNXPHARMA', niftyauto:'^CNXAUTO',
  niftymetal:'^CNXMETAL', niftyfmcg:'^CNXFMCG', niftyrealty:'^CNXREALTY',
  niftyenergy:'^CNXENERGY', niftyinfra:'^CNXINFRA', niftypse:'^CNXPSE',
  nifty100:'^CNX100', nifty200:'NIFTY200.NS', nifty500:'^CRSLDX',
  niftynext50:'^NSMIDCP', niftymidcap150:'NIFTYMIDCAP150.NS',
  niftysmallcap100:'NIFTYSMLCAP100.NS', niftymicro250:'NIFTYMICROCAP250.NS',
  sensex50:'BSE-SENSEX50.BO', bse100:'BSE-100.BO', bse200:'BSE-200.BO',
  bse500:'BSE-500.BO', bsemidcap:'BSE-MID-CAP.BO', bsesmallcap:'BSE-SMLCAP.BO',
  bsemicrocap:'BSE-MICROCAP.BO', niftymedia:'^CNXMEDIA',
  niftyconsumer:'^CNXCONSUM', niftyoil:'^CNXOILGAS', niftydefence:'NIFTYDEFENCE.NS',
  niftypvtbank:'NIFTYPVTBANK.NS', niftypsubank:'^CNXPSUBANK', niftymnc:'^CNXMNC',

  // ── Large Cap ──────────────────────────────────────────────
  reliance:'RELIANCE.NS', tcs:'TCS.NS', hdfcbank:'HDFCBANK.NS',
  infosys:'INFY.NS', icicibank:'ICICIBANK.NS', hindunilvr:'HINDUNILVR.NS',
  itc:'ITC.NS', bajfinance:'BAJFINANCE.NS', sbi:'SBIN.NS', axisbank:'AXISBANK.NS',
  kotakbank:'KOTAKBANK.NS', lnt:'LT.NS', hcltech:'HCLTECH.NS', wipro:'WIPRO.NS',
  asianpaint:'ASIANPAINT.NS', maruti:'MARUTI.NS', bajajfinsv:'BAJAJFINSV.NS',
  titan:'TITAN.NS', sunpharma:'SUNPHARMA.NS', tatasteel:'TATASTEEL.NS',
  ntpc:'NTPC.NS', powergrid:'POWERGRID.NS', ongc:'ONGC.NS', coalindia:'COALINDIA.NS',
  jswsteel:'JSWSTEEL.NS', tatamotors:'TATAMOTORS.NS', ultracemco:'ULTRACEMCO.NS',
  adaniports:'ADANIPORTS.NS', adanient:'ADANIENT.NS', grasim:'GRASIM.NS',
  indusindbk:'INDUSINDBK.NS', drreddy:'DRREDDY.NS', cipla:'CIPLA.NS',
  hdfclife:'HDFCLIFE.NS', sbilife:'SBILIFE.NS', techm:'TECHM.NS',
  nestleind:'NESTLEIND.NS', britannia:'BRITANNIA.NS', heromotoco:'HEROMOTOCO.NS',
  eichermot:'EICHERMOT.NS', 'bajaj-auto':'BAJAJ-AUTO.NS', apollohosp:'APOLLOHOSP.NS',
  trent:'TRENT.NS', hindalco:'HINDALCO.NS', vedl:'VEDL.NS', bpcl:'BPCL.NS',
  iocl:'IOC.NS', hpclgas:'HINDPETRO.NS', gail:'GAIL.NS',
  shreecem:'SHREECEM.NS', ambujacement:'AMBUJACEM.NS', acccement:'ACC.NS',

  // ── Banking & Financial ────────────────────────────────────
  pnb:'PNB.NS', bankofbaroda:'BANKBARODA.NS', canarabank:'CANBK.NS',
  unionbank:'UNIONBANK.NS', idfcfirstb:'IDFCFIRSTB.NS', federalbnk:'FEDERALBNK.NS',
  yesbank:'YESBANK.NS', bandhanbnk:'BANDHANBNK.NS', rblbank:'RBLBANK.NS',
  aubank:'AUBANK.NS', equitasbnk:'EQUITASBNK.NS', ujjivansfb:'UJJIVANSFB.NS',
  cholafin:'CHOLAFIN.NS', muthootfin:'MUTHOOTFIN.NS', manappuram:'MANAPPURAM.NS',
  lichsgfin:'LICHSGFIN.NS', canfinhome:'CANFINHOME.NS', hdfcamc:'HDFCAMC.NS',
  nipponlife:'NAM-INDIA.NS', angelone:'ANGELONE.NS', '5paisa':'5PAISA.NS',
  icicigi:'ICICIGI.NS', starhealth:'STARHEALTH.NS', niacl:'NIACL.NS',

  // ── IT / Technology ────────────────────────────────────────
  ltim:'LTIM.NS', mphasis:'MPHASIS.NS', persistent:'PERSISTENT.NS',
  coforge:'COFORGE.NS', hexaware:'HEXAWARE.NS', kpit:'KPITTECH.NS',
  tanla:'TANLA.NS', rategain:'RATEGAIN.NS', zomato:'ZOMATO.NS',
  nykaa:'NYKAA.NS', paytm:'PAYTM.NS', policybazaar:'POLICYBZR.NS',
  indiamart:'INDIAMART.NS', justdial:'JUSTDIAL.NS', matrimony:'MATRIMONY.NS',
  mapmy:'MAPMYINDIA.NS', route:'ROUTE.NS', tataelxsi:'TATAELXSI.NS',
  cyient:'CYIENT.NS', zensar:'ZENSARTECH.NS', intellect:'INTELLECT.NS',
  infoedge:'NAUKRI.NS',

  // ── Pharma & Healthcare ────────────────────────────────────
  divi:'DIVISLAB.NS', auropharma:'AUROPHARMA.NS', lupin:'LUPIN.NS',
  torntpharm:'TORNTPHARM.NS', alkem:'ALKEM.NS', ipca:'IPCALAB.NS',
  abbotindia:'ABBOTINDIA.NS', glaxo:'GLAXO.NS', pfizer:'PFIZER.NS',
  sanofi:'SANOFI.NS', gland:'GLAND.NS', eris:'ERIS.NS',
  piramalent:'PIRAMALENT.NS', maxhealthcare:'MAXHEALTH.NS', fortis:'FORTIS.NS',
  narayana:'NH.NS', metropolis:'METROPOLIS.NS', thyrocare:'THYROCARE.NS',

  // ── Auto & EV ──────────────────────────────────────────────
  tvsmotors:'TVSMOTOR.NS', ashokley:'ASHOKLEY.NS', mahindra:'M&M.NS',
  bosch:'BOSCHLTD.NS', motherson:'MOTHERSON.NS', mrf:'MRF.NS',
  apollotyre:'APOLLOTYRE.NS', ceatltd:'CEATLTD.NS', balkrisind:'BALKRISIND.NS',
  olectra:'OLECTRA.NS', tatapower:'TATAPOWER.NS', abb:'ABB.NS',
  bel:'BEL.NS', exideind:'EXIDEIND.NS', amara:'AMARAJABAT.NS',

  // ── FMCG & Consumer ───────────────────────────────────────
  dabur:'DABUR.NS', marico:'MARICO.NS', colpal:'COLPAL.NS',
  emamiltd:'EMAMILTD.NS', gillette:'GILLETTE.NS', pghh:'PGHH.NS',
  varun:'VBL.NS', unitedbrew:'UBL.NS', radico:'RADICO.NS',
  dmart:'DMART.NS', tatacons:'TATACONSUM.NS', godrejcp:'GODREJCP.NS',
  pidilitind:'PIDILITIND.NS', pageind:'PAGEIND.NS', vbl:'MANYAVAR.NS',
  voltas:'VOLTAS.NS', whirlpool:'WHIRLPOOL.NS', havells:'HAVELLS.NS',
  crompton:'CROMPTON.NS', amber:'AMBER.NS', dixon:'DIXON.NS', kaynes:'KAYNES.NS',

  // ── Metals & Mining ───────────────────────────────────────
  nationalum:'NATIONALUM.NS', hindcopper:'HINDCOPPER.NS',
  ratnamani:'RATNAMANI.NS', welcorp:'WELCORP.NS', kalyankjil:'KALYANKJIL.NS',
  pcjeweller:'PCJEWELLER.NS', rajeshexpo:'RAJESHEXPO.NS',
  nmdc:'NMDC.NS', moil:'MOIL.NS',

  // ── Energy & Power ────────────────────────────────────────
  adanigreen:'ADANIGREEN.NS', adanitrans:'ADANITRANS.NS', adanipower:'ADANIPOWER.NS',
  torntpower:'TORNTPOWER.NS', cesc:'CESC.NS', jspenergy:'JSPOW.NS',
  suzlon:'SUZLON.NS', gipcl:'GIPCL.NS', indgas:'IGL.NS', mgl:'MGL.NS',
  petronet:'PETRONET.NS', castrol:'CASTROL.NS',

  // ── Infra & Real Estate ───────────────────────────────────
  dlf:'DLF.NS', godrejprop:'GODREJPROP.NS', oberoireal:'OBEROIRLTY.NS',
  prestige:'PRESTIGE.NS', brigade:'BRIGADE.NS', sobha:'SOBHA.NS',
  phoenixltd:'PHOENIXLTD.NS', irb:'IRB.NS', kalpataru:'KPIL.NS',
  ncc:'NCC.NS', ashokbuild:'ASHOKA.NS', knrcon:'KNRCON.NS',
  hginfra:'HGINFRA.NS', rvnl:'RVNL.NS', irfc:'IRFC.NS',
  irctc:'IRCTC.NS', container:'CONCOR.NS',

  // ── Cement ────────────────────────────────────────────────
  ramcocem:'RAMCOCEM.NS', jkcement:'JKCEMENT.NS', jklakshmi:'JKLAKSHMI.NS',
  heidelberg:'HEIDELBERG.NS', birlacorp:'BIRLACORP.NS',

  // ── Textiles ──────────────────────────────────────────────
  raymond:'RAYMOND.NS', trident:'TRIDENT.NS', arvind:'ARVIND.NS',
  welspunind:'WELSPUNIND.NS', rupa:'RUPA.NS', kitex:'KITEX.NS',

  // ── Media & Telecom ───────────────────────────────────────
  airtel:'BHARTIARTL.NS', vodafone:'IDEA.NS', industower:'INDUSTOWER.NS',
  tatacomm:'TATACOMM.NS', hathway:'HATHWAY.NS', suntv:'SUNTV.NS',
  zeel:'ZEEL.NS', pvrinox:'PVRINOX.NS',

  // ── Defence ───────────────────────────────────────────────
  hal:'HAL.NS', bhel:'BHEL.NS', cochinship:'COCHINSHIP.NS',
  mazagondock:'MAZDOCK.NS', gardenreach:'GRSE.NS', beml:'BEML.NS',
  'data-pattern':'DATAPATTNS.NS', 'bharat-dyn':'BDL.NS',

  // ── Chemicals ─────────────────────────────────────────────
  srf:'SRF.NS', aarti:'AARTIIND.NS', navinfluor:'NAVINFLUOR.NS',
  clean:'CLEAN.NS', galaxysurf:'GALAXYSURF.NS', vinatiorg:'VINATIORGA.NS',
  deepaknit:'DEEPAKNTR.NS', gnfc:'GNFC.NS', coromandel:'COROMANDEL.NS',
  chambalfert:'CHAMBLFERT.NS', ralisgro:'RALLIS.NS', piindustries:'PIIND.NS',
  excel:'EXCEL.NS', tatachem:'TATACHEM.NS',

  // ── Logistics ─────────────────────────────────────────────
  bluedart:'BLUEDART.NS', delhivery:'DELHIVERY.NS',
  mahindralog:'MAHLOG.NS', spoton:'TCI.NS', gati:'GATI.NS',

  // ── Agriculture & Food ────────────────────────────────────
  adanindag:'ADANIWILMAR.NS', krbl:'KRBL.NS', ltfoods:'LTFOODS.NS',
  patanjali:'PATANJALI.NS', kaveri:'KSCL.NS',

  // ── Hotels & Tourism ──────────────────────────────────────
  indhotel:'INDHOTEL.NS', eihltd:'EIHOTEL.NS', lemontree:'LEMONTREE.NS',
  mahindraholidays:'MHRIL.NS', thomascook:'THOMASCOOK.NS', easemytrip:'EASEMYTRIP.NS',

  // ── PSU / Govt ────────────────────────────────────────────
  nhpc:'NHPC.NS', recltd:'RECLTD.NS', pfc:'PFC.NS', hudco:'HUDCO.NS',
  ireda:'IREDA.NS', nbcc:'NBCC.NS', rites:'RITES.NS',
  enginersin:'ENGINERSIN.NS', oil:'OIL.NS', mrpl:'MRPL.NS',
  chennpetro:'CHENNPETRO.NS', bomdyeing:'BOMDYEING.NS',

  // ── Diversified / Finance ─────────────────────────────────
  godrejind:'GODREJIND.NS', jswinfra:'JSWINFRA.NS',
  sundarmfin:'SUNDARMFIN.NS', bajajhold:'BAJAJHLDNG.NS',
  schaeffler:'SCHAEFFLER.NS', skfindia:'SKFINDIA.NS', timken:'TIMKEN.NS',
  asahiindia:'ASAHIINDIA.NS', suprajit:'SUPRAJIT.NS',
  careratings:'CARERATING.NS', icra:'ICRA.NS', crisil:'CRISIL.NS',
  '360one':'360ONE.NS', masfin:'MASFIN.NS', bsfin:'BFINVEST.NS',
};

function fetchYahoo(path) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'query1.finance.yahoo.com',
      path,
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        'Accept': '*/*',
        'Accept-Encoding': 'gzip, deflate, br',
        'Accept-Language': 'en-US,en;q=0.9',
        'Origin': 'https://finance.yahoo.com',
        'Referer': 'https://finance.yahoo.com/',
      }
    };

    const req = https.request(options, res => {
      const chunks = [];
      res.on('data', c => chunks.push(c));
      res.on('end', () => {
        const buf = Buffer.concat(chunks);
        const enc = (res.headers['content-encoding'] || '').toLowerCase();
        function parse(text) {
          try { resolve(JSON.parse(text)); }
          catch(e) { reject(new Error('Parse error: ' + text.slice(0,200))); }
        }
        if (enc.includes('br')) {
          zlib.brotliDecompress(buf, (err, d) => err ? reject(err) : parse(d.toString()));
        } else if (enc.includes('gzip')) {
          zlib.gunzip(buf, (err, d) => err ? reject(err) : parse(d.toString()));
        } else if (enc.includes('deflate')) {
          zlib.inflate(buf, (err, d) => err ? reject(err) : parse(d.toString()));
        } else {
          parse(buf.toString());
        }
      });
    });
    req.on('error', reject);
    req.setTimeout(15000, () => { req.destroy(); reject(new Error('Timeout')); });
    req.end();
  });
}

// ── /quotes — use v8/chart with interval=1d to get current price + meta
// Chart API works, v7/quote API blocks. So we fetch each symbol via chart API.
app.get('/quotes', async (req, res) => {
  try {
    const ids = (req.query.ids||'').split(',').filter(Boolean);
    if (!ids.length) return res.json([]);

    // Fetch all in parallel using chart API (which works!)
    const results = await Promise.all(ids.map(async id => {
      try {
        const sym = encodeURIComponent(SYMBOL_MAP[id]||id);
        const path = `/v8/finance/chart/${sym}?range=5d&interval=1d&includePrePost=false&formatted=false`;
        const data = await fetchYahoo(path);
        const r = data?.chart?.result?.[0];
        if (!r) return {id, error:true};

        const meta = r.meta || {};
        const q = r.indicators?.quote?.[0] || {};
        const ts = r.timestamp || [];
        const lastIdx = ts.length - 1;

        // Get last close as current price
        const closes = q.close || [];
        const opens  = q.open  || [];
        const highs  = q.high  || [];
        const lows   = q.low   || [];
        const vols   = q.volume|| [];

        const price    = meta.regularMarketPrice || closes[lastIdx];
        const prevClose= meta.previousClose || meta.chartPreviousClose || closes[lastIdx-1];
        const change   = price && prevClose ? price - prevClose : null;
        const changePct= change && prevClose ? (change/prevClose)*100 : null;

        return {
          id,
          price,
          change,
          changePct,
          dayHigh:     meta.regularMarketDayHigh  || highs[lastIdx],
          dayLow:      meta.regularMarketDayLow   || lows[lastIdx],
          fiftyTwoWkH: meta.fiftyTwoWeekHigh,
          fiftyTwoWkL: meta.fiftyTwoWeekLow,
          prevClose,
          open:        meta.regularMarketOpen     || opens[lastIdx],
          volume:      meta.regularMarketVolume   || vols[lastIdx],
          mktCap:      meta.marketCap,
          pe:          null,
        };
      } catch(e) {
        console.error(`Error fetching ${id}:`, e.message);
        return {id, error:true};
      }
    }));

    res.json(results);
  } catch(e) {
    console.error('Quotes error:', e.message);
    res.status(500).json({error: e.message});
  }
});

// ── /chart — same working approach
app.get('/chart', async (req, res) => {
  try {
    const {id, range='1d', interval='15m'} = req.query;
    if (!id) return res.status(400).json({error:'id required'});
    const sym = SYMBOL_MAP[id]||id;
    const path = `/v8/finance/chart/${encodeURIComponent(sym)}?range=${range}&interval=${interval}&includePrePost=false&formatted=false`;
    const data = await fetchYahoo(path);
    const chart = data?.chart?.result?.[0];
    if (!chart) return res.status(404).json({error:'No data'});
    const ts = chart.timestamp||[];
    const q = chart.indicators?.quote?.[0]||{};
    const candles = ts.map((t,i)=>({
      t:t*1000, o:q.open?.[i], h:q.high?.[i],
      l:q.low?.[i], c:q.close?.[i], v:q.volume?.[i]
    })).filter(c=>c.o!=null&&c.c!=null);
    res.json({id, range, interval, candles});
  } catch(e) {
    console.error('Chart error:', e.message);
    res.status(500).json({error: e.message});
  }
});

// ── /search — Yahoo Finance autocomplete for any NSE/BSE stock
app.get('/search', async (req, res) => {
  try {
    const q = (req.query.q || '').trim();
    if (!q || q.length < 1) return res.json([]);

    // Try both NSE (.NS) and BSE (.BO) suffixed queries + plain symbol
    const queries = [q + '.NS', q + '.BO', q];
    const path = `/v1/finance/search?q=${encodeURIComponent(q)}&lang=en-US&region=IN&quotesCount=20&newsCount=0&listsCount=0&enableFuzzyQuery=false&enableCb=false&enableNavLinks=false&enableEnhancedTrivialQuery=true`;
    const data = await fetchYahoo(path);

    const quotes = data?.quotes || [];
    // Filter to Indian exchange stocks only (NSE/BSE)
    const indian = quotes.filter(q =>
      q.exchange === 'NSI' || q.exchange === 'BSE' ||
      (q.symbol && (q.symbol.endsWith('.NS') || q.symbol.endsWith('.BO')))
    );

    const results = indian.map(q => {
      const rawSym = q.symbol || '';
      // Generate a clean id from symbol
      const sym = rawSym.replace(/\.(NS|BO)$/, '');
      const exchange = rawSym.endsWith('.BO') ? 'BSE' : 'NSE';
      const id = (sym + (exchange === 'BSE' ? '_bse' : '')).toLowerCase().replace(/[^a-z0-9_]/g,'_');
      return {
        id,
        sym,
        name: q.longname || q.shortname || sym,
        sector: q.sector || '',
        exchange,
        yahooSym: rawSym,
      };
    });

    // Also add to SYMBOL_MAP dynamically so /quotes works
    results.forEach(r => {
      if (!SYMBOL_MAP[r.id]) SYMBOL_MAP[r.id] = r.yahooSym;
    });

    res.json(results);
  } catch(e) {
    console.error('Search error:', e.message);
    res.status(500).json({error: e.message});
  }
});


const PORT = process.env.PORT||3001;
app.listen(PORT, ()=>console.log(`Proxy v2.4 on port ${PORT}`));
