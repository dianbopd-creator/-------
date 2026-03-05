let app;
try {
    app = require('../server');

    // Add a catch-all AFTER all routes to debug what's NOT being matched
    app.use((req, res) => {
        res.status(404).json({
            debug: true,
            method: req.method,
            originalUrl: req.originalUrl,
            path: req.path,
            headers: {
                'content-type': req.headers['content-type'],
                'origin': req.headers['origin']
            }
        });
    });

} catch (error) {
    console.error("Vercel Startup Error:", error);
    const express = require('express');
    app = express();
    app.use('*', (req, res) => {
        res.status(500).json({
            error: "Vercel Startup Error",
            message: error.message
        });
    });
}

module.exports = app;
