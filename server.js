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
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/122.0.0.0 Safari/537.36',
        'Accept': 'application/json',
        'Accept-Encoding': 'gzip, deflate',
        'Referer': 'https://finance.yahoo.com/',
      }
    };

    const req = https.request(options, res => {
      const chunks = [];
      res.on('data', c => chunks.push(c));
      res.on('end', () => {
        const buf = Buffer.concat(chunks);
        const enc = res.headers['content-encoding'];

        function parse(text) {
          try { resolve(JSON.parse(text)); }
          catch(e) { reject(new Error('Parse error: ' + text.slice(0,100))); }
        }

        if (enc === 'gzip') {
          zlib.gunzip(buf, (err, decoded) => {
            if (err) reject(err);
            else parse(decoded.toString('utf8'));
          });
        } else if (enc === 'deflate') {
          zlib.inflate(buf, (err, decoded) => {
            if (err) reject(err);
            else parse(decoded.toString('utf8'));
          });
        } else {
          parse(buf.toString('utf8'));
        }
      });
    });

    req.on('error', reject);
    req.setTimeout(12000, () => { req.destroy(); reject(new Error('Timeout')); });
    req.end();
  });
}

app.get('/quotes', async (req, res) => {
  try {
    const ids = (req.query.ids||'').split(',').filter(Boolean);
    if (!ids.length) return res.json([]);
    const symbols = ids.map(id => SYMBOL_MAP[id]||id).join(',');
    const fields = 'regularMarketPrice,regularMarketChange,regularMarketChangePercent,regularMarketDayHigh,regularMarketDayLow,fiftyTwoWeekHigh,fiftyTwoWeekLow,regularMarketPreviousClose,regularMarketOpen,marketCap,regularMarketVolume,trailingPE';
    const path = `/v7/finance/quote?symbols=${encodeURIComponent(symbols)}&fields=${fields}&formatted=false&lang=en-US&region=IN`;
    const data = await fetchYahoo(path);
    const quotes = data?.quoteResponse?.result || [];
    const result = ids.map(id => {
      const sym = SYMBOL_MAP[id]||id;
      const q = quotes.find(x=>x.symbol===sym);
      if (!q) return {id, error:true};
      return {
        id, price:q.regularMarketPrice, change:q.regularMarketChange,
        changePct:q.regularMarketChangePercent, dayHigh:q.regularMarketDayHigh,
        dayLow:q.regularMarketDayLow, fiftyTwoWkH:q.fiftyTwoWeekHigh,
        fiftyTwoWkL:q.fiftyTwoWeekLow, prevClose:q.regularMarketPreviousClose,
        open:q.regularMarketOpen, mktCap:q.marketCap,
        volume:q.regularMarketVolume, pe:q.trailingPE
      };
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

app.get('/', (req, res) => res.json({status:'ok', version:'2.2'}));
const PORT = process.env.PORT||3001;
app.listen(PORT, ()=>console.log(`Proxy v2.2 on port ${PORT}`));
