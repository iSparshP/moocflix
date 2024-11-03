const express = require('express');
const connectDB = require('../config/config.js');
const mongoose = require('mongoose');
const { AppError } = require('./utils/errorUtils');
const userRoutes = require('./routes/userRoutes.js');
const profileRoutes = require('./routes/profileRoutes.js');
const helmet = require('helmet');
const compression = require('compression');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const morgan = require('morgan');
const {
    connectProducer,
    connectConsumer,
    disconnectProducer,
    disconnectConsumer,
} = require('../config/kafka');
const { errorHandler } = require('./middlewares/errorHandler');
const { startConsumer } = require('./services/kafkaConsumer');
const notificationRoutes = require('./routes/notificationRoutes');
const logger = require('./utils/logger');

const app = express();

// Enhanced security configuration
const securityConfig = {
    helmet: {
        contentSecurityPolicy: {
            directives: {
                defaultSrc: ["'self'"],
                scriptSrc: ["'self'", "'unsafe-inline'"],
                styleSrc: ["'self'", "'unsafe-inline'"],
                imgSrc: ["'self'", 'data:', 'https:'],
            },
        },
        referrerPolicy: { policy: 'same-origin' },
    },
    cors: {
        origin: process.env.CORS_ORIGIN || 'https://moocflix.tech',
        methods: ['GET', 'POST', 'PUT', 'DELETE'],
        allowedHeaders: ['Content-Type', 'Authorization'],
        credentials: true,
    },
};

// Security middlewares with enhanced configuration
app.use(helmet(securityConfig.helmet));
app.use(cors(securityConfig.cors));
app.use(compression());

// Enhanced rate limiting
const rateLimitConfig = {
    windowMs: 15 * 60 * 1000,
    max: process.env.RATE_LIMIT_MAX || 100,
    message: {
        status: 'error',
        message: 'Too many requests, please try again later',
    },
    standardHeaders: true,
    legacyHeaders: false,
};
app.use(rateLimit(rateLimitConfig));

// Request logging with correlation IDs
app.use(logger.addRequestContext);
app.use(
    morgan('combined', {
        stream: {
            write: (message) =>
                logger.info(message.trim(), {
                    component: 'http',
                    timestamp: new Date().toISOString(),
                }),
        },
    })
);

// Body parsing with size limits
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// API routes with versioning
const API_VERSION = '/api/v1';
app.use(`${API_VERSION}/users`, userRoutes);
app.use(`${API_VERSION}/profile`, profileRoutes);
app.use(`${API_VERSION}/notifications`, notificationRoutes);
app.use(`${API_VERSION}/system`, require('./routes/healthRoutes'));

// 404 handler for undefined routes
app.all('*', (req, res, next) => {
    next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});

// Centralized error handling
app.use(errorHandler);

// Enhanced Kafka initialization with retries
const initializeKafka = async () => {
    try {
        await connectProducer();
        await startConsumer();
        logger.info('Kafka producer and consumer initialized successfully');
    } catch (error) {
        logger.error('Failed to initialize Kafka', {
            error: error.message,
            stack: error.stack,
        });
        process.exit(1);
    }
};

// Graceful shutdown with timeout
const gracefulShutdown = async () => {
    logger.info('Received shutdown signal - starting graceful shutdown');

    const shutdownTimeout = parseInt(process.env.SHUTDOWN_TIMEOUT) || 10000;
    const forceExit = setTimeout(() => {
        logger.error('Forced shutdown due to timeout');
        process.exit(1);
    }, shutdownTimeout);

    try {
        server.close(() => logger.info('HTTP server closed'));

        await Promise.all([
            disconnectProducer(),
            disconnectConsumer(),
            mongoose.connection.close(),
        ]);

        logger.info('All connections closed successfully');
        clearTimeout(forceExit);
        process.exit(0);
    } catch (error) {
        logger.error('Error during shutdown', {
            error: error.message,
            stack: error.stack,
        });
        clearTimeout(forceExit);
        process.exit(1);
    }
};

// Enhanced process handlers
process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);
process.on('uncaughtException', (error) => {
    logger.error('Uncaught exception', {
        error: error.message,
        stack: error.stack,
    });
    process.exit(1);
});
process.on('unhandledRejection', (error) => {
    logger.error('Unhandled rejection', {
        error: error.message,
        stack: error.stack,
    });
    process.exit(1);
});

// Initialize database and start server
let server;
(async () => {
    try {
        await connectDB();
        const PORT = process.env.PORT || 3007;
        server = app.listen(PORT, async () => {
            logger.info(`Server running on port ${PORT}`, {
                env: process.env.NODE_ENV,
                port: PORT,
            });
            await initializeKafka();
        });
    } catch (error) {
        logger.error('Failed to start server', {
            error: error.message,
            stack: error.stack,
        });
        process.exit(1);
    }
})();

module.exports = app;
