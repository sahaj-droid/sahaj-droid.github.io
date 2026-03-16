const express = require('express');
const cors = require('cors');
const https = require('https');
const zlib = require('zlib');

const app = express();
app.use(cors());

const SYMBOL_MAP = {
  nifty50:'^NSEI', banknifty:'^NSEBANK', sensex:'^BSESN', bankex:'BANKEX.BO',
  finnifty:'NIFTY_FIN_SERVICE.NS', midcap:'^NSEMDCP50', smallcap:'NIFTYSMLCAP250.NS',
  niftyit:'^CNXIT', reliance:'RELIANCE.NS', tcs:'TCS.NS', hdfcbank:'HDFCBANK.NS',
  infosys:'INFY.NS', rategain:'RATEGAIN.NS', olectra:'OLECTRA.NS', itc:'ITC.NS',
  bajfinance:'BAJFINANCE.NS', axisbank:'AXISBANK.NS', wipro:'WIPRO.NS',
  sbi:'SBIN.NS', tatasteel:'TATASTEEL.NS', hcltech:'HCLTECH.NS',
  sunpharma:'SUNPHARMA.NS', maruti:'MARUTI.NS', titan:'TITAN.NS',
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

// ── /lookup — symbol પરથી name + sector fetch કરો
// Usage: /lookup?sym=RELIANCE&exchange=NSE
app.get('/lookup', async (req, res) => {
  try {
    const { sym, exchange = 'NSE' } = req.query;
    if (!sym) return res.status(400).json({ error: 'sym required' });

    // Yahoo suffix: NSE → .NS, BSE → .BO
    const suffix = exchange.toUpperCase().includes('BSE') ? '.BO' : '.NS';
    const yahooSym = encodeURIComponent(sym.toUpperCase() + suffix);
    const path = `/v8/finance/chart/${yahooSym}?range=1d&interval=1d&includePrePost=false&formatted=false`;

    const data = await fetchYahoo(path);
    const meta = data?.chart?.result?.[0]?.meta;

    if (!meta) return res.json({ sym, name: sym, sector: '', exchange });

    // Yahoo meta માં longName અથવા shortName હોય
    const name   = meta.longName || meta.shortName || sym;
    // sector Yahoo chart API માં નથી આવતું — blank રાખો
    const sector = '';

    res.json({ sym: sym.toUpperCase(), name, sector, exchange });
  } catch (e) {
    console.error('Lookup error:', e.message);
    // Error હોય તો sym જ name તરીકે return
    res.json({ sym: req.query.sym, name: req.query.sym, sector: '', exchange: req.query.exchange || 'NSE' });
  }
});

// ── /lookup-batch — multiple symbols એક સાથે
// Usage: /lookup-batch?syms=RELIANCE,ADANIPORTS,TATAPOWER&exchange=NSE
app.get('/lookup-batch', async (req, res) => {
  try {
    const { syms = '', exchange = 'NSE' } = req.query;
    const symList = syms.split(',').map(s => s.trim().toUpperCase()).filter(Boolean);
    if (!symList.length) return res.json([]);

    const suffix = exchange.toUpperCase().includes('BSE') ? '.BO' : '.NS';

    // Parallel fetch — max 10 at a time to avoid rate limit
    const BATCH = 10;
    const results = [];
    for (let i = 0; i < symList.length; i += BATCH) {
      const batch = symList.slice(i, i + BATCH);
      const batchResults = await Promise.all(batch.map(async sym => {
        try {
          const yahooSym = encodeURIComponent(sym + suffix);
          const path = `/v8/finance/chart/${yahooSym}?range=1d&interval=1d&includePrePost=false&formatted=false`;
          const data = await fetchYahoo(path);
          const meta = data?.chart?.result?.[0]?.meta;
          const name = meta?.longName || meta?.shortName || sym;
          return { sym, name, sector: '', exchange };
        } catch {
          return { sym, name: sym, sector: '', exchange };
        }
      }));
      results.push(...batchResults);
      // Rate limit માટે થોડો delay
      if (i + BATCH < symList.length) await new Promise(r => setTimeout(r, 300));
    }

    res.json(results);
  } catch (e) {
    console.error('Lookup-batch error:', e.message);
    res.status(500).json({ error: e.message });
  }
});

// ── /quotes — use v8/chart with interval=1d to get current price + meta
app.get('/quotes', async (req, res) => {
  try {
    const ids = (req.query.ids||'').split(',').filter(Boolean);
    if (!ids.length) return res.json([]);

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

// ── /chart
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

app.get('/', (req, res) => res.json({status:'ok', version:'2.5'}));
const PORT = process.env.PORT||3001;
app.listen(PORT, ()=>console.log(`Proxy v2.5 on port ${PORT}`));
