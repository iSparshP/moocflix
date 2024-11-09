// src/index.js
const app = require('./app');
const { initializeKafka } = require('./utils/kafkaInit');
const connectToMongoDB = require('../config/mongodb');
const logger = require('./utils/logger');
require('dotenv').config();

// Connect to MongoDB
connectToMongoDB();

async function startServer() {
    try {
        await initializeKafka();
        // Start server
        const PORT = process.env.PORT || 3002;
        const server = app.listen(PORT, () => {
            logger.info(`Server is running on port ${PORT}`);
        });

        // Graceful shutdown
        const gracefulShutdown = async () => {
            logger.info('Initiating graceful shutdown...');

            try {
                await initializeKafka().producer().disconnect();
                await initializeKafka().consumer().disconnect();
                logger.info('Kafka disconnected');
            } catch (err) {
                logger.error('Error disconnecting Kafka:', err);
            }

            try {
                await mongoose.connection.close();
                logger.info('MongoDB disconnected');
            } catch (err) {
                logger.error('Error disconnecting MongoDB:', err);
            }

            server.close(() => {
                logger.info('Server closed');
                process.exit(0);
            });
        };

        // Handle shutdown signals
        process.on('SIGTERM', gracefulShutdown);
        process.on('SIGINT', gracefulShutdown);

        // Handle uncaught exceptions and rejections
        process.on('uncaughtException', (error) => {
            logger.error('Uncaught Exception:', error);
            gracefulShutdown();
        });

        process.on('unhandledRejection', (error) => {
            logger.error('Unhandled Rejection:', error);
            gracefulShutdown();
        });
    } catch (error) {
        logger.error('Failed to start server:', error);
        process.exit(1);
    }
}

startServer();
