const express = require('express');
const cors = require('cors');
const https = require('https');

const app = express();
app.use(cors());
app.use(express.json());

const SYMBOL_MAP = {
  nifty50:'^NSEI', banknifty:'^NSEBANK', sensex:'^BSESN', bankex:'BANKEX.BO',
  finnifty:'NIFTY_FIN_SERVICE.NS', midcap:'^NSEMDCP50', smallcap:'NIFTYSMLCAP250.NS',
  niftyit:'^CNXIT', reliance:'RELIANCE.NS', tcs:'TCS.NS', hdfcbank:'HDFCBANK.NS',
  infosys:'INFY.NS', rategain:'RATEGAIN.NS', olectra:'OLECTRA.NS', itc:'ITC.NS',
  bajfinance:'BAJFINANCE.NS', axisbank:'AXISBANK.NS', wipro:'WIPRO.NS',
  sbi:'SBIN.NS', tatasteel:'TATASTEEL.NS', hcltech:'HCLTECH.NS',
  sunpharma:'SUNPHARMA.NS', maruti:'MARUTI.NS', titan:'TITAN.NS',
};

const USER_AGENTS = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/122.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 Safari/605.1.15',
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Chrome/121.0.0.0 Safari/537.36',
];
let uaIdx = 0;

function fetchYahoo(host, path) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: host,
      path,
      method: 'GET',
      headers: {
        'User-Agent': USER_AGENTS[uaIdx++ % USER_AGENTS.length],
        'Accept': 'application/json',
        'Accept-Language': 'en-US,en;q=0.9',
        'Referer': 'https://finance.yahoo.com/',
        'Cookie': 'B=abc; YM=abc',
      }
    };
    const req = https.request(options, res => {
      const chunks = [];
      res.on('data', c => chunks.push(c));
      res.on('end', () => {
        try { resolve(JSON.parse(Buffer.concat(chunks).toString())); }
        catch(e) { reject(new Error('Parse error')); }
      });
    });
    req.on('error', reject);
    req.setTimeout(12000, () => { req.destroy(); reject(new Error('Timeout')); });
    req.end();
  });
}

async function fetchWithFallback(path) {
  const hosts = ['query1.finance.yahoo.com', 'query2.finance.yahoo.com'];
  for (const host of hosts) {
    try {
      const data = await fetchYahoo(host, path);
      return data;
    } catch(e) {
      console.log(`Failed ${host}: ${e.message}, trying next...`);
    }
  }
  throw new Error('All hosts failed');
}

app.get('/quotes', async (req, res) => {
  try {
    const ids = (req.query.ids||'').split(',').filter(Boolean);
    if (!ids.length) return res.json([]);
    const symbols = ids.map(id => SYMBOL_MAP[id]||id).join(',');
    const fields = 'regularMarketPrice,regularMarketChange,regularMarketChangePercent,regularMarketDayHigh,regularMarketDayLow,fiftyTwoWeekHigh,fiftyTwoWeekLow,regularMarketPreviousClose,regularMarketOpen,marketCap,regularMarketVolume,trailingPE';
    const path = `/v7/finance/quote?symbols=${encodeURIComponent(symbols)}&fields=${fields}&formatted=false&lang=en-US&region=IN`;
    const data = await fetchWithFallback(path);
    const quotes = data?.quoteResponse?.result || [];
    const result = ids.map(id => {
      const sym = SYMBOL_MAP[id]||id;
      const q = quotes.find(x=>x.symbol===sym);
      if (!q) return {id, error:true};
      return {id, price:q.regularMarketPrice, change:q.regularMarketChange,
        changePct:q.regularMarketChangePercent, dayHigh:q.regularMarketDayHigh,
        dayLow:q.regularMarketDayLow, fiftyTwoWkH:q.fiftyTwoWeekHigh,
        fiftyTwoWkL:q.fiftyTwoWeekLow, prevClose:q.regularMarketPreviousClose,
        open:q.regularMarketOpen, mktCap:q.marketCap, volume:q.regularMarketVolume, pe:q.trailingPE};
    });
    res.json(result);
  } catch(e) {
    console.error('Quotes error:', e.message);
    res.status(500).json({error: e.message});
  }
});

app.get('/chart', async (req, res) => {
  try {
    const {id, range='1d', interval='15m'} = req.query;
    if (!id) return res.status(400).json({error:'id required'});
    const sym = SYMBOL_MAP[id]||id;
    const path = `/v8/finance/chart/${encodeURIComponent(sym)}?range=${range}&interval=${interval}&includePrePost=false&formatted=false&lang=en-US&region=IN`;
    const data = await fetchWithFallback(path);
    const chart = data?.chart?.result?.[0];
    if (!chart) return res.status(404).json({error:'No data'});
    const ts = chart.timestamp||[];
    const q = chart.indicators?.quote?.[0]||{};
    const candles = ts.map((t,i)=>({t:t*1000,o:q.open?.[i],h:q.high?.[i],l:q.low?.[i],c:q.close?.[i],v:q.volume?.[i]})).filter(c=>c.o!=null&&c.c!=null);
    res.json({id, range, interval, candles});
  } catch(e) {
    console.error('Chart error:', e.message);
    res.status(500).json({error: e.message});
  }
});

app.get('/', (req, res) => res.json({status:'ok', version:'2.1'}));
const PORT = process.env.PORT||3001;
app.listen(PORT, ()=>console.log(`Proxy v2.1 on port ${PORT}`));
