require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const notificationRoutes = require('./routes/notificationRoutes');
const kafkaConsumer = require('./subscribers/kafkaConsumer');
const rateLimit = require('express-rate-limit');
const errorHandler = require('./middlewares/errorHandler');
const { sequelize, testConnection } = require('../config/dbConfig');
const requestLogger = require('./middlewares/requestLogger');

const app = express();
const port = process.env.PORT || 3003;
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // Consider adjusting based on expected load
    max: 100, // Consider adjusting based on expected load
    message: 'Too many requests, please try again later',
    standardHeaders: true,
    legacyHeaders: false,
});

app.use(limiter);
app.use(bodyParser.json());
app.use(requestLogger);

app.use('/api/v1/notifications', notificationRoutes);

// Add health check endpoint
app.get('/health', async (req, res) => {
    try {
        // Check database connection
        await sequelize.authenticate();

        // Check Kafka connection
        const kafkaStatus = await kafkaConsumer.isConnected();

        res.status(200).json({
            status: 'healthy',
            checks: {
                database: 'connected',
                kafka: kafkaStatus ? 'connected' : 'disconnected',
            },
            timestamp: new Date().toISOString(),
        });
    } catch (error) {
        res.status(503).json({
            status: 'unhealthy',
            error: error.message,
            timestamp: new Date().toISOString(),
        });
    }
});

// Error handling middleware
app.use(errorHandler);

process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (error) => {
    console.error('Uncaught Exception:', error);
    process.exit(1);
});

const startServer = async () => {
    try {
        // Test database connection with retries
        let connected = false;
        let retries = 5;

        while (!connected && retries > 0) {
            connected = await testConnection();
            if (!connected) {
                console.log(
                    `Database connection attempt failed. Retries left: ${retries}`
                );
                retries--;
                if (retries > 0) {
                    await new Promise((resolve) => setTimeout(resolve, 5000)); // Wait 5 seconds before retry
                }
            }
        }

        if (!connected) {
            throw new Error(
                'Unable to establish database connection after multiple retries'
            );
        }

        app.listen(port, () => {
            console.log(`Notification service running on port ${port}`);
            kafkaConsumer.start();
        });
    } catch (error) {
        console.error('Error starting server:', {
            error: error.message,
            stack: error.stack,
            timestamp: new Date().toISOString(),
        });
        process.exit(1);
    }
};

startServer();
