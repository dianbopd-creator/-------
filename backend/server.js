require('dotenv').config();
const express = require('express');
const cors = require('cors');
const db = require('./db/connection');

const app = express();
const PORT = process.env.PORT || 3001;

// ─── CORS Whitelist ───────────────────────────────────────────────────────────
// In production: set ALLOWED_ORIGIN to your Vercel URL, e.g. https://dianbopopo.vercel.app
// Multiple origins can be separated by commas: https://a.com,https://b.com
const allowedOrigins = (process.env.ALLOWED_ORIGIN || 'http://localhost:5173,http://localhost:3000')
    .split(',')
    .map(o => o.trim())
    .filter(Boolean);

app.use(cors({
    origin: (origin, callback) => {
        // Allow requests with no origin (e.g. mobile apps, curl, Postman)
        if (!origin) return callback(null, true);
        if (allowedOrigins.includes(origin)) return callback(null, true);
        callback(new Error(`CORS policy: origin ${origin} is not allowed`));
    },
    credentials: true,
}));

app.use(express.json({ limit: '10mb' }));

// ─── Health Check ─────────────────────────────────────────────────────────────
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', message: 'DIANBOPOPO Interview System API is running', timezone: 'Asia/Taipei' });
});

// ─── API Routes ───────────────────────────────────────────────────────────────
const apiRoutes = require('./routes/api');
app.use('/api/v1', apiRoutes);

app.listen(PORT, () => {
    console.log(`[DIANBOPOPO] Server running on port ${PORT}`);
    console.log(`[CORS] Allowed origins: ${allowedOrigins.join(', ')}`);
});
