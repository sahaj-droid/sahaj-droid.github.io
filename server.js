const express = require('express');
const cors = require('cors');
const https = require('https');

const app = express();
app.use(cors());
app.use(express.json());

// ── Symbol map: app id → Yahoo Finance symbol
const SYMBOL_MAP = {
  nifty50:    '^NSEI',
  banknifty:  '^NSEBANK',
  sensex:     '^BSESN',
  bankex:     'BANKEX.BO',
  finnifty:   'NIFTY_FIN_SERVICE.NS',
  midcap:     '^NSEMDCP50',
  smallcap:   'NIFTYSMLCAP250.NS',
  niftyit:    '^CNXIT',
  reliance:   'RELIANCE.NS',
  tcs:        'TCS.NS',
  hdfcbank:   'HDFCBANK.NS',
  infosys:    'INFY.NS',
  rategain:   'RATEGAIN.NS',
  olectra:    'OLECTRA.NS',
  itc:        'ITC.NS',
  bajfinance: 'BAJFINANCE.NS',
  axisbank:   'AXISBANK.NS',
  wipro:      'WIPRO.NS',
  sbi:        'SBIN.NS',
  tatasteel:  'TATASTEEL.NS',
  hcltech:    'HCLTECH.NS',
  sunpharma:  'SUNPHARMA.NS',
  maruti:     'MARUTI.NS',
  titan:      'TITAN.NS',
};

function fetchUrl(url) {
  return new Promise((resolve, reject) => {
    const options = {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'application/json',
      }
    };
    https.get(url, options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try { resolve(JSON.parse(data)); }
        catch(e) { reject(new Error('Parse error')); }
      });
    }).on('error', reject);
  });
}

// ── GET /quotes?ids=nifty50,banknifty,...
app.get('/quotes', async (req, res) => {
  try {
    const ids = (req.query.ids || '').split(',').filter(Boolean);
    if (!ids.length) return res.json([]);

    const symbols = ids.map(id => SYMBOL_MAP[id] || id).join(',');
    const url = `https://query1.finance.yahoo.com/v7/finance/quote?symbols=${encodeURIComponent(symbols)}&fields=regularMarketPrice,regularMarketChange,regularMarketChangePercent,regularMarketDayHigh,regularMarketDayLow,fiftyTwoWeekHigh,fiftyTwoWeekLow,regularMarketPreviousClose,regularMarketOpen,marketCap,regularMarketVolume,trailingPE`;

    const data = await fetchUrl(url);
    const quotes = data?.quoteResponse?.result || [];

    const result = ids.map((id, i) => {
      const sym = SYMBOL_MAP[id] || id;
      const q = quotes.find(x => x.symbol === sym);
      if (!q) return { id, error: true };
      return {
        id,
        price:       q.regularMarketPrice,
        change:      q.regularMarketChange,
        changePct:   q.regularMarketChangePercent,
        dayHigh:     q.regularMarketDayHigh,
        dayLow:      q.regularMarketDayLow,
        fiftyTwoWkH: q.fiftyTwoWeekHigh,
        fiftyTwoWkL: q.fiftyTwoWeekLow,
        prevClose:   q.regularMarketPreviousClose,
        open:        q.regularMarketOpen,
        mktCap:      q.marketCap,
        volume:      q.regularMarketVolume,
        pe:          q.trailingPE,
      };
    });

    res.json(result);
  } catch(e) {
    console.error('Quotes error:', e.message);
    res.status(500).json({ error: e.message });
  }
});

// ── GET /chart?id=nifty50&range=1d&interval=15m
// range:    1d | 5d | 1mo | 6mo | 1y
// interval: 15m | 1d | 1wk | 1mo
app.get('/chart', async (req, res) => {
  try {
    const { id, range = '1d', interval = '15m' } = req.query;
    if (!id) return res.status(400).json({ error: 'id required' });

    const sym = SYMBOL_MAP[id] || id;
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(sym)}?range=${range}&interval=${interval}&includePrePost=false`;

    const data = await fetchUrl(url);
    const chart = data?.chart?.result?.[0];
    if (!chart) return res.status(404).json({ error: 'No chart data' });

    const timestamps = chart.timestamp || [];
    const ohlcv = chart.indicators?.quote?.[0] || {};

    const candles = timestamps.map((t, i) => ({
      t: t * 1000, // ms
      o: ohlcv.open?.[i],
      h: ohlcv.high?.[i],
      l: ohlcv.low?.[i],
      c: ohlcv.close?.[i],
      v: ohlcv.volume?.[i],
    })).filter(c => c.o != null && c.c != null);

    res.json({ id, range, interval, candles });
  } catch(e) {
    console.error('Chart error:', e.message);
    res.status(500).json({ error: e.message });
  }
});

// Health check
app.get('/', (req, res) => res.json({ status: 'ok', version: '2.0' }));

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`MarketTracker proxy running on port ${PORT}`));
