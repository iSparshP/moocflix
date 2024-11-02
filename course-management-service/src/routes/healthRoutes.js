// src/routes/healthRoutes.js
const express = require('express');
const healthController = require('../controllers/healthController');
const { healthCheckLimiter } = require('../middlewares/rateLimiter');
const logger = require('../utils/logger');

const router = express.Router();

// Health check endpoint with rate limiting
router.get('/health', healthCheckLimiter, healthController.healthCheck);

// Simple liveness probe
router.get('/health/live', (req, res) => {
    logger.debug('Liveness check requested');
    res.status(200).json({ status: 'alive' });
});

// Readiness probe with full health check
router.get('/health/ready', healthCheckLimiter, healthController.healthCheck);

module.exports = router;
