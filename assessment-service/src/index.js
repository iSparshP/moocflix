// src/index.js
require('dotenv').config();
const express = require('express');
const { initializeKafkaConsumer } = require('./services/kafkaHandler');
const connectDB = require('./config/mongodb');
const quizRoutes = require('./routes/quizRoutes');
const assignmentRoutes = require('./routes/assignmentRoutes');
const errorHandler = require('./middlewares/errorHandler');
const authenticate = require('./middlewares/authenticate');
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./config/swagger');
const HealthService = require('./services/healthService');
const { logger, requestLogger } = require('./config/logger');
const { healthCheckLimiter } = require('./middlewares/rateLimiter');

const app = express();
app.use(express.json());
app.use(requestLogger);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.use(authenticate);
app.use(quizRoutes);
app.use(assignmentRoutes);
app.use(errorHandler);

app.get('/health', healthCheckLimiter, async (req, res) => {
    try {
        // Quick health check for load balancers
        res.status(200).json({
            status: 'up',
            timestamp: new Date().toISOString(),
        });
    } catch (error) {
        res.status(503).json({
            status: 'down',
            timestamp: new Date().toISOString(),
            error: error.message,
        });
    }
});

app.get('/health/detailed', healthCheckLimiter, async (req, res) => {
    try {
        const healthStatus = await HealthService.getFullHealthStatus();
        res.status(healthStatus.status === 'healthy' ? 200 : 503).json(
            healthStatus
        );
    } catch (error) {
        res.status(503).json({
            status: 'down',
            timestamp: new Date().toISOString(),
            error: error.message,
        });
    }
});

connectDB();
app.listen(process.env.PORT || 3001, () => {
    logger.info(`Server is running on port ${process.env.PORT || 3001}`);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
    logger.error('Uncaught Exception', {
        error: error.message,
        stack: error.stack,
    });
    process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (error) => {
    logger.error('Unhandled Rejection', {
        error: error.message,
        stack: error.stack,
    });
    process.exit(1);
});

// Initialize Kafka consumer
initializeKafkaConsumer();
