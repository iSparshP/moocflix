// src/routes/healthRoutes.js
const express = require('express');
const healthController = require('../controllers/healthController');

const router = express.Router();

router.get('/health', healthController.healthCheck);
router.get('/health/live', (req, res) =>
    res.status(200).json({ status: 'alive' })
);
router.get('/health/ready', healthController.healthCheck);

module.exports = router;
