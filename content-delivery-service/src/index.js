// src/index.js
require('dotenv').config();
const express = require('express');
const app = express();
const config = require('./config/config');
const contentRoutes = require('./routes/contentRoutes');
const healthRoutes = require('./routes/healthRoutes');
const errorHandler = require('./middlewares/errorHandler');
const { sequelize, redisClient } = require('./config/db');
const { initializeKafkaConsumer } = require('./services/kafkaHandler');
const transcodingManager = require('./services/transcodingManager');
const swaggerUi = require('swagger-ui-express');
const swaggerSpecs = require('./config/swagger');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

const initializeApp = async () => {
    try {
        // Connect to Redis
        await redisClient.connect();

        // Sync database
        await sequelize.sync({ force: false });

        // Initialize Kafka consumer
        await initializeKafkaConsumer();

        // Initialize transcoding manager
        await transcodingManager.start();

        // Setup Express middleware
        app.use(express.json());

        // Add security headers
        app.use(helmet());

        // Add rate limiting
        const limiter = rateLimit({
            windowMs: 15 * 60 * 1000, // 15 minutes
            max: 100, // limit each IP to 100 requests per windowMs
        });
        app.use('/api/', limiter);

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

        // Routes
        app.use('/api/v1/content', contentRoutes);
        app.use('/api/v1', healthRoutes);

        // Error handler
        app.use(errorHandler);

        // Start server
        app.listen(config.app.port, () => {
            console.log(`Server running on port ${config.app.port}`);
        });
    } catch (error) {
        console.error('Failed to initialize application:', error);
        process.exit(1);
    }
};

// Global error handler
process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
    process.exit(1);
});

// Add shutdown handler
const shutdown = async () => {
    console.log('Shutting down application...');
    try {
        await transcodingManager.stop();
        await redisClient.quit();
        await sequelize.close();
        process.exit(0);
    } catch (error) {
        console.error('Error during shutdown:', error);
        process.exit(1);
    }
};

// Add shutdown handlers
process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

initializeApp();
