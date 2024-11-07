// src/routes/health.js
const express = require('express');
const router = express.Router();

router.get('/live', (req, res) => {
    res.status(200).json({ status: 'alive' });
});

router.get('/ready', (req, res) => {
    res.status(200).json({ status: 'ready' });
});

module.exports = router;
