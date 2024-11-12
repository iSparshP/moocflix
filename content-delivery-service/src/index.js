// src/index.js
require('dotenv').config();
const express = require('express');
const app = express();
const config = require('./config/config');
const routes = require('./routes');
const { errorHandler } = require('./middlewares');
const { dbManager } = require('./config/db');
const kafkaManager = require('./config/kafka');
const metrics = require('./middlewares/metrics');
const swaggerUi = require('swagger-ui-express');
const swaggerSpecs = require('./config/swagger');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const cors = require('cors');
const logger = require('./utils/logger');

const initializeApp = async () => {
    try {
        // Initialize database connections
        if (!dbManager || typeof dbManager.initialize !== 'function') {
            throw new Error('Database manager is not properly initialized');
        }
        await dbManager.initialize();
        logger.info('Database initialized successfully');

        // Initialize Kafka
        if (!kafkaManager || typeof kafkaManager.initialize !== 'function') {
            throw new Error('Kafka manager is not properly initialized');
        }
        await kafkaManager.initialize();
        logger.info('Kafka initialized successfully');

        // Setup Express middleware
        app.use(express.json());
        app.use(helmet());

        // Add rate limiting
        const limiter = rateLimit({
            windowMs: 15 * 60 * 1000, // 15 minutes
            max: 100, // limit each IP to 100 requests per windowMs
        });
        app.use('/api/', limiter);

        // Add CORS configuration
        app.use(
            cors({
                origin: process.env.ALLOWED_ORIGINS?.split(',') || [
                    'https://moocflix.tech',
                ],
                methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
                allowedHeaders: ['Authorization', 'Content-Type'],
                exposedHeaders: ['Content-Range', 'X-Content-Range'],
                credentials: true,
                maxAge: 3600,
            })
        );

        // Add metrics endpoint
        app.get('/metrics', metrics.getMetricsHandler());

        // Swagger documentation route
        if (config.app.env === 'development') {
            app.use(
                '/api-docs',
                swaggerUi.serve,
                swaggerUi.setup(swaggerSpecs, {
                    explorer: true,
                    customCss: '.swagger-ui .topbar { display: none }',
                })
            );
        }

        // Initialize routes
        routes(app);

        // Error handling middleware
        app.use(errorHandler);

        // Start server
        const server = app.listen(config.app.port, () => {
            logger.info(
                `Server running on port ${config.app.port} in ${config.app.env} mode`
            );
        });

        // Graceful shutdown
        const shutdown = async (signal) => {
            logger.info(`${signal} received. Starting graceful shutdown...`);
            try {
                // Close server first to stop accepting new requests
                server.close(() => {
                    logger.info('Server closed');
                });

                // Close other connections
                await Promise.all([
                    kafkaManager
                        .close()
                        .catch((err) =>
                            logger.error('Error closing Kafka:', err)
                        ),
                    dbManager
                        .close()
                        .catch((err) => logger.error('Error closing DB:', err)),
                ]);

                logger.info('Graceful shutdown completed');
                process.exit(0);
            } catch (error) {
                logger.error('Error during shutdown:', error);
                process.exit(1);
            }
        };

        // Handle shutdown signals
        process.on('SIGTERM', () => shutdown('SIGTERM'));
        process.on('SIGINT', () => shutdown('SIGINT'));
    } catch (error) {
        logger.error('Failed to initialize application:', error);
        throw error;
    }
};

// Start the application
if (require.main === module) {
    initializeApp().catch((error) => {
        logger.error('Application startup failed:', error);
        process.exit(1);
    });
}

module.exports = app; // Export for testing
