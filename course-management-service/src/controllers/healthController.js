// src/controllers/healthController.js
const mongoose = require('mongoose');
const { kafka } = require('../utils/kafka');
const logger = require('../utils/logger');

exports.healthCheck = async (req, res) => {
    const health = {
        uptime: process.uptime(),
        timestamp: Date.now(),
        services: {
            database: {
                status: 'unknown',
            },
            kafka: {
                status: 'unknown',
            },
        },
    };

    try {
        await mongoose.connection.db.admin().ping();
        health.services.database = {
            status: 'healthy',
            type: 'mongodb',
            response_time: 'OK',
        };
    } catch (error) {
        logger.error('Database health check failed:', { error: error.message });
        health.services.database = {
            status: 'unhealthy',
            type: 'mongodb',
            error: error.message,
        };
    }

    try {
        const producer = kafka.producer();
        await producer.connect();
        await producer.disconnect();
        health.services.kafka = {
            status: 'healthy',
            type: 'kafka',
            response_time: 'OK',
        };
    } catch (error) {
        logger.error('Kafka health check failed:', { error: error.message });
        health.services.kafka = {
            status: 'unhealthy',
            type: 'kafka',
            error: error.message,
        };
    }

    const isHealthy = Object.values(health.services).every(
        (service) => service.status === 'healthy'
    );

    logger.info('Health check completed', {
        healthy: isHealthy,
        services: health.services,
    });

    res.status(isHealthy ? 200 : 503).json(health);
};
