// src/index.js
const express = require('express');
const kafkaClient = require('./services/kafka/kafkaClient');
const redisClient = require('./services/redis/redisClient');
const { errorHandler } = require('./middleware/errorHandler');
const healthRoutes = require('./routes/health');
const config = require('./config/environment');
const logger = require('./utils/logger');
const registry = require('./utils/serviceRegistry');
const transcodeRoutes = require('./routes/transcode');

const app = express();
const healthApp = express();

logger.info('Starting application...');

process.on('uncaughtException', (error) => {
    logger.error('Uncaught Exception:', error);
    process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
    logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
    process.exit(1);
});

async function initializeServices() {
    logger.info('Initializing services...');
    try {
        // Register core services
        registry.register('redis', redisClient);
        registry.register('kafka', kafkaClient);

        // Connect Redis
        await redisClient.connect();
        logger.info('Redis connected successfully');

        // Connect Kafka
        await kafkaClient.connect();
        logger.info('Kafka connected successfully');

        // Initialize other services
        registry.register('metrics', require('./services/metricsService'));
        registry.register('queue', require('./services/queueService'));

        await registry.initializeAll();
        logger.info('All services initialized successfully');
    } catch (error) {
        logger.error('Failed to initialize services:', error.message);
        throw error;
    }
}

// Main API
app.use(express.json());
app.use('/health', healthRoutes);
app.use('/transcode', transcodeRoutes);
app.use(errorHandler);

// Health Check API
healthApp.use('/health', healthRoutes);
healthApp.use(errorHandler);

// Start servers
async function startServers() {
    logger.info('Starting servers...');
    try {
        await initializeServices();

        app.listen(config.service.port, () => {
            logger.info(`Service running on port ${config.service.port}`);
        });

        healthApp.listen(config.service.healthCheckPort, () => {
            logger.info(
                `Health check running on port ${config.service.healthCheckPort}`
            );
        });

        // Graceful shutdown
        process.on('SIGTERM', async () => {
            logger.info('Received SIGTERM. Starting graceful shutdown...');
            try {
                await registry.shutdownAll();
                setTimeout(() => {
                    process.exit(0);
                }, 1000);
            } catch (error) {
                logger.error('Error during shutdown:', error);
                process.exit(1);
            }
        });
    } catch (error) {
        logger.error('Failed to start servers:', error);
        process.exit(1);
    }
}

startServers().catch((error) => {
    logger.error('Failed to start application:', error);
    process.exit(1);
});
