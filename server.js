const express = require('express');
const axios = require('axios');
const cors = require('cors');
const app = express();

app.use(cors());

// Live Price API
app.get('/stock/:symbol', async (req, res) => {
    try {
        const response = await axios.get(`https://query1.finance.yahoo.com/v8/finance/chart/${req.params.symbol}`);
        res.json(response.data);
    } catch (error) { res.status(500).send(error.message); }
});

// NEWS API: Real-time Market News
app.get('/news', async (req, res) => {
    try {
        const response = await axios.get('https://query2.finance.yahoo.com/v1/finance/search?q=NIFTY');
        const news = response.data.news.map(item => ({
            title: item.title,
            source: item.publisher,
            link: item.link
        }));
        res.json(news.slice(0, 5)); // Top 5 news
    } catch (error) { res.status(500).json({ error: "News failed" }); }
});

const PORT = process.env.PORT || 10000; // Render use 10000 by default
app.listen(PORT, () => console.log('Server Live!'));
