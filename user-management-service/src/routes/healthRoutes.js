const express = require('express');
const mongoose = require('mongoose');
const { kafka } = require('../../config/kafka');
const logger = require('../utils/logger');

const router = express.Router();

router.get('/health', async (req, res) => {
    try {
        const startTime = process.hrtime();

        // Check MongoDB connection with timeout
        const dbStatus = (await Promise.race([
            mongoose.connection.readyState === 1,
            new Promise((_, reject) =>
                setTimeout(() => reject(new Error('DB timeout')), 5000)
            ),
        ]))
            ? 'up'
            : 'down';

        // Check Kafka connection with timeout
        let kafkaStatus = 'down';
        try {
            const admin = kafka.admin();
            await Promise.race([
                admin.connect(),
                new Promise((_, reject) =>
                    setTimeout(() => reject(new Error('Kafka timeout')), 5000)
                ),
            ]);
            await admin.listTopics();
            await admin.disconnect();
            kafkaStatus = 'up';
        } catch (error) {
            logger.error('Kafka health check failed', {
                error: error.message,
                requestId: req.id,
            });
        }

        const [seconds, nanoseconds] = process.hrtime(startTime);
        const responseTime = seconds * 1000 + nanoseconds / 1000000;

        const status =
            dbStatus === 'up' && kafkaStatus === 'up' ? 'healthy' : 'unhealthy';

        res.status(status === 'healthy' ? 200 : 503).json({
            status,
            timestamp: new Date().toISOString(),
            requestId: req.id,
            responseTime: `${responseTime.toFixed(2)}ms`,
            services: {
                database: {
                    status: dbStatus,
                    connections:
                        mongoose.connection.states[
                            mongoose.connection.readyState
                        ],
                },
                kafka: {
                    status: kafkaStatus,
                    broker: process.env.KAFKA_BROKER,
                },
            },
            memory: {
                heapUsed: `${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)}MB`,
                heapTotal: `${Math.round(process.memoryUsage().heapTotal / 1024 / 1024)}MB`,
            },
        });
    } catch (error) {
        logger.error('Health check failed', {
            error: error.message,
            requestId: req.id,
        });
        res.status(503).json({
            status: 'unhealthy',
            timestamp: new Date().toISOString(),
            requestId: req.id,
            error: 'Service unavailable',
        });
    }
});

module.exports = router;
