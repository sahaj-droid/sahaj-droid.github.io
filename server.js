const express = require('express');
const cors = require('cors');
const app = express();

app.use(cors());

// Health Check (Check karva mate ke server chalu che ke nahi)
app.get('/', (req, res) => res.send('Market Proxy is Live!'));

// Stock API
app.get('/stock/:symbol', async (req, res) => {
    try {
        const response = await fetch(`https://query1.finance.yahoo.com/v8/finance/chart/${req.params.symbol}`);
        const data = await response.json();
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: "Stock fetch failed" });
    }
});

// NEWS API (Free Yahoo Search API)
app.get('/news', async (req, res) => {
    try {
        const response = await fetch('https://query2.finance.yahoo.com/v1/finance/search?q=NIFTY');
        const data = await response.json();
        const news = data.news ? data.news.map(item => ({
            title: item.title,
            source: item.publisher,
            link: item.link
        })) : [];
        res.json(news.slice(0, 5));
    } catch (error) {
        res.status(500).json({ error: "News fetch failed" });
    }
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
