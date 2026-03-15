const express = require('express');
const cors = require('cors');
const axios = require('axios'); // Fari axios vapriye jethi handling easy thay
const app = express();

app.use(cors());

// Health Check
app.get('/', (req, res) => res.send('Market Proxy is Running!'));

// Stock API (Fixed Path & Logic)
app.get('/stock/:symbol', async (req, res) => {
    const symbol = req.params.symbol;
    try {
        const url = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}`;
        const response = await axios.get(url, { 
            headers: { 'User-Agent': 'Mozilla/5.0' } // Yahoo mate aa jaruri che
        });
        res.json(response.data);
    } catch (error) {
        console.error("Stock Error:", error.message);
        res.status(500).json({ error: "Failed to fetch stock", details: error.message });
    }
});

// News API (Fixed)
app.get('/news', async (req, res) => {
    try {
        const url = 'https://query2.finance.yahoo.com/v1/finance/search?q=NIFTY';
        const response = await axios.get(url, {
            headers: { 'User-Agent': 'Mozilla/5.0' }
        });
        const news = response.data.news ? response.data.news.map(item => ({
            title: item.title,
            source: item.publisher,
            link: item.link
        })) : [];
        res.json(news.slice(0, 5));
    } catch (error) {
        console.error("News Error:", error.message);
        res.status(500).json({ error: "Failed to fetch news" });
    }
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`Server Live on port ${PORT}`));
