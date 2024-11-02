const express = require('express');
const router = express.Router();
const dbManager = require('../config/db');
const kafka = require('../utils/kafka');
const { getBreaker } = require('../utils/circuitBreaker');

/**
 * @swagger
 * /health:
 *   get:
 *     summary: Get service health status
 *     tags: [Health]
 *     security: []
 *     responses:
 *       200:
 *         description: Service is healthy
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 uptime:
 *                   type: number
 *                 timestamp:
 *                   type: number
 *                 services:
 *                   type: object
 *                   properties:
 *                     database:
 *                       type: object
 *                       properties:
 *                         status:
 *                           type: string
 *                           enum: [healthy, unhealthy]
 *                         latency:
 *                           type: number
 *                     redis:
 *                       type: object
 *                       properties:
 *                         status:
 *                           type: string
 *                           enum: [healthy, unhealthy]
 *                         latency:
 *                           type: number
 *                     kafka:
 *                       type: object
 *                       properties:
 *                         status:
 *                           type: string
 *                           enum: [healthy, unhealthy]
 *                         latency:
 *                           type: number
 *                     s3:
 *                       type: object
 *                       properties:
 *                         status:
 *                           type: string
 *                           enum: [healthy, unhealthy]
 *                         upload_circuit:
 *                           type: string
 *                           enum: [healthy, unhealthy]
 *                         delete_circuit:
 *                           type: string
 *                           enum: [healthy, unhealthy]
 *       503:
 *         description: Service is unhealthy
 */
router.get('/health', async (req, res) => {
    const health = {
        uptime: process.uptime(),
        timestamp: Date.now(),
        services: {
            database: {
                status: 'unknown',
                latency: null,
            },
            redis: {
                status: 'unknown',
                latency: null,
            },
            kafka: {
                status: 'unknown',
                latency: null,
            },
            s3: {
                status: 'unknown',
                upload_circuit: getBreaker('s3-upload')?.status || 'unknown',
                delete_circuit: getBreaker('s3-delete')?.status || 'unknown',
            },
        },
    };

    try {
        // Check PostgreSQL
        const dbStart = Date.now();
        await dbManager.sequelize.authenticate();
        health.services.database = {
            status: 'healthy',
            latency: Date.now() - dbStart,
        };

        // Check Redis
        const redisStart = Date.now();
        const redisStatus = dbManager.redisClient.isReady;
        health.services.redis = {
            status: redisStatus ? 'healthy' : 'unhealthy',
            latency: Date.now() - redisStart,
        };

        // Check Kafka
        const kafkaStart = Date.now();
        const kafkaStatus = await kafka.producer.isConnected();
        health.services.kafka = {
            status: kafkaStatus ? 'healthy' : 'unhealthy',
            latency: Date.now() - kafkaStart,
        };

        const isHealthy = Object.values(health.services).every(
            (service) => service.status === 'healthy'
        );

        res.status(isHealthy ? 200 : 503).json(health);
    } catch (error) {
        health.error = error.message;
        res.status(503).json(health);
    }
});

// Add more detailed health checks
router.get('/health/liveness', (req, res) => {
    res.status(200).json({ status: 'alive' });
});

router.get('/health/readiness', async (req, res) => {
    try {
        await Promise.all([
            dbManager.sequelize.authenticate(),
            dbManager.redisClient.ping(),
            kafka.producer.isConnected(),
        ]);
        res.status(200).json({ status: 'ready' });
    } catch (error) {
        res.status(503).json({ status: 'not ready', error: error.message });
    }
});

module.exports = router;
