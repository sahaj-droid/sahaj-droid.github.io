// ============================================================
// MarketTracker Backend Proxy — Yahoo Finance
// Deploy FREE on Render.com
// ============================================================

const express = require("express");
const cors = require("cors");
const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors()); // Allow all origins (personal use)
app.use(express.json());

// ── Symbol Map ──────────────────────────────────────────────
// NSE stocks use .NS suffix, BSE use .BO on Yahoo Finance
const SYMBOL_MAP = {
  // Indices
  nifty50:   "^NSEI",
  banknifty: "^NSEBANK",
  sensex:    "^BSESN",
  bankex:    "BANKEX.BO",
  finnifty:  "NIFTY_FIN_SERVICE.NS",
  midcap:    "^NSEMDCP50",
  smallcap:  "^NSESMALLCAP",
  niftyit:   "^CNXIT",

  // Stocks (NSE)
  reliance:  "RELIANCE.NS",
  tcs:       "TCS.NS",
  hdfcbank:  "HDFCBANK.NS",
  infosys:   "INFY.NS",
  rategain:  "RATEGAIN.NS",
  olectra:   "OLECTRA.NS",
  itc:       "ITC.NS",
  bajfinance:"BAJFINANCE.NS",
  axisbank:  "AXISBANK.NS",
  wipro:     "WIPRO.NS",
  sbi:       "SBIN.NS",
  tatasteel: "TATASTEEL.NS",
  hcltech:   "HCLTECH.NS",
  sunpharma: "SUNPHARMA.NS",
  maruti:    "MARUTI.NS",
  titan:     "TITAN.NS",
  ltim:      "LTIM.NS",
  ultracemco:"ULTRACEMCO.NS",
  nestleind: "NESTLEIND.NS",
  asianpaint:"ASIANPAINT.NS",
};

// ── Fetch single quote from Yahoo Finance ──────────────────
async function fetchYahooQuote(yahooSymbol) {
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(yahooSymbol)}?interval=1d&range=1d`;

  const res = await fetch(url, {
    headers: {
      "User-Agent": "Mozilla/5.0",
      "Accept": "application/json",
    },
  });

  if (!res.ok) throw new Error(`Yahoo returned ${res.status}`);
  const data = await res.json();

  const meta = data?.chart?.result?.[0]?.meta;
  if (!meta) throw new Error("No meta in response");

  const price         = meta.regularMarketPrice ?? 0;
  const prevClose     = meta.previousClose ?? meta.chartPreviousClose ?? price;
  const change        = price - prevClose;
  const changePct     = prevClose !== 0 ? (change / prevClose) * 100 : 0;
  const dayHigh       = meta.regularMarketDayHigh ?? price;
  const dayLow        = meta.regularMarketDayLow  ?? price;
  const fiftyTwoWkH   = meta.fiftyTwoWeekHigh ?? 0;
  const fiftyTwoWkL   = meta.fiftyTwoWeekLow  ?? 0;
  const volume        = meta.regularMarketVolume ?? 0;
  const mktCap        = meta.marketCap ?? null;

  return { price, prevClose, change, changePct, dayHigh, dayLow, fiftyTwoWkH, fiftyTwoWkL, volume, mktCap };
}

// ── GET /quote?id=reliance ─────────────────────────────────
app.get("/quote", async (req, res) => {
  const id = req.query.id;
  if (!id) return res.status(400).json({ error: "id param required" });

  const yahooSym = SYMBOL_MAP[id];
  if (!yahooSym) return res.status(404).json({ error: `Unknown id: ${id}` });

  try {
    const quote = await fetchYahooQuote(yahooSym);
    res.json({ id, symbol: yahooSym, ...quote, ts: Date.now() });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ── GET /quotes?ids=nifty50,banknifty,reliance ─────────────
app.get("/quotes", async (req, res) => {
  const ids = (req.query.ids || "").split(",").filter(Boolean);
  if (!ids.length) return res.status(400).json({ error: "ids param required" });

  const results = await Promise.allSettled(
    ids.map(async (id) => {
      const yahooSym = SYMBOL_MAP[id];
      if (!yahooSym) return { id, error: "Unknown symbol" };
      const quote = await fetchYahooQuote(yahooSym);
      return { id, symbol: yahooSym, ...quote, ts: Date.now() };
    })
  );

  const data = results.map((r, i) =>
    r.status === "fulfilled" ? r.value : { id: ids[i], error: r.reason?.message }
  );
  res.json(data);
});

// ── GET /search?q=infosys ──────────────────────────────────
app.get("/search", async (req, res) => {
  const q = (req.query.q || "").toLowerCase();
  const matches = Object.entries(SYMBOL_MAP)
    .filter(([id, sym]) => id.includes(q) || sym.toLowerCase().includes(q))
    .map(([id, sym]) => ({ id, symbol: sym }));
  res.json(matches);
});

// ── Health check ───────────────────────────────────────────
app.get("/", (req, res) => res.json({ status: "ok", message: "MarketTracker proxy running" }));

app.listen(PORT, () => console.log(`MarketTracker proxy running on port ${PORT}`));
