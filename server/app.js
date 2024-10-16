require('dotenv').config();
const express = require('express');
const axios = require('axios');
const cors = require('cors');
const { v4 } = require('uuid');
const rateLimit = require('express-rate-limit');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({
    origin: process.env.VITE_FRONTEND_URL,
    credentials: true
}));

app.use(express.json());

const airdropLimiter = rateLimit({
    windowMs: 1 * 60 * 1000,  // 1 minutes
    max: 1,  // Limit each IP to 1 request per window (5 minutes)
    message: 'Too many requests from this IP, please try again after 5 minutes',
    standardHeaders: true,  // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false,  // Disable the `X-RateLimit-*` headers
});

app.get('/', async (req, res) => {
    res.status(200).json({ message: 'Airdrop successful' });
});

app.post('/request-airdrop', airdropLimiter, async (req, res) => {
    const { publicKey } = req.body;
    const lamports = 5000000000;
    try {
        const response = await axios.post(process.env.VITE_API_URL, {
            jsonrpc: "2.0",
            method: "requestAirdrop",
            params: [publicKey, lamports],
            id: v4(),
        }, {
            headers: {
                'Content-Type': 'application/json',
            }
        });
        if (response.status === 200) {
            res.status(200).json({ message: 'Airdrop successful' });
        } else {
            res.status(500).json({ error: 'Failed to airdrop SOL' });
        }
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

app.options('/proxy', cors());
app.post('/proxy', async (req, res) => {
    try {
        const response = await axios.post('https://search1.jup.ag/multi_search?x-typesense-api-key=', req.body, {
            headers: {
                'accept-language': 'en-US,en;q=0.9,hi;q=0.8',
                'content-type': 'text/plain',
                'Referer': 'https://jup.ag/',  // Add Referer header
                'Referrer-Policy': 'strict-origin-when-cross-origin'  // Add Referrer-Policy
            }
        });
        res.json(response.data);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching data' });
    }
})

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
