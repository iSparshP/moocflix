// src/routes/healthRoutes.js
const express = require('express');
const router = express.Router();
const logger = require('../utils/logger');
const mongoose = require('mongoose');
const { checkKafkaHealth } = require('../utils/kafka');

router.get('/health', async (req, res) => {
    logger.info('Incoming GET request to /health');

    try {
        // Check MongoDB
        const dbHealth = {
            status:
                mongoose.connection.readyState === 1 ? 'healthy' : 'unhealthy',
            type: 'mongodb',
            response_time: 'OK',
        };

        // Check Kafka
        const kafkaHealth = await checkKafkaHealth();

        // Determine overall health
        const isHealthy =
            dbHealth.status === 'healthy' && kafkaHealth.status === 'healthy';

        const healthStatus = {
            healthy: isHealthy,
            services: {
                database: dbHealth,
                kafka: kafkaHealth,
            },
        };

        logger.info('Health check completed', healthStatus);
        res.status(isHealthy ? 200 : 503).json(healthStatus);
    } catch (error) {
        logger.error('Health check failed:', error);
        res.status(500).json({
            healthy: false,
            error: error.message,
        });
    }
});

module.exports = router;
