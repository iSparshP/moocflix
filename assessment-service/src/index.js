const express = require('express');
const helmet = require('helmet');
const swaggerUi = require('swagger-ui-express');
const { logger } = require('./config/logger');
const { errorHandler } = require('./utils/errorHandler');
const { connectDB } = require('./config/mongodb');
const { swaggerSpec } = require('./config/swagger');
const kafkaService = require('./services/kafkaService');
const { HealthService } = require('./services/healthService');
const { securityConfig } = require('./config/security');

// Debug log for routes import
console.log('About to require routes');
const routes = require('./routes');
console.log('Routes type:', typeof routes);
console.log('Is Router?', routes instanceof express.Router);

// Initialize express app
const app = express();

// Apply security middleware
app.use(helmet());

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// API Documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Basic health check route
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'OK' });
});

// Mount API routes
app.use('/', routes);

// Error handling middleware
app.use((err, req, res, next) => {
    logger.error('Error:', err);
    res.status(500).json({
        status: 'error',
        message: err.message || 'Internal Server Error',
    });
});

// Start server function
const startServer = async () => {
    try {
        // Connect to MongoDB
        try {
            await connectDB();
            logger.info('MongoDB connected successfully');
        } catch (dbError) {
            logger.warn(
                'MongoDB connection failed, continuing without database:',
                dbError.message
            );
        }

        // Initialize Kafka
        try {
            // Register handlers first
            kafkaService.registerHandler(
                'assessment-topic',
                async (message) => {
                    logger.info('Received assessment message:', message);
                    // Handle the message
                }
            );

            // Then initialize the service
            await kafkaService.initialize();

            logger.info('Kafka service initialized successfully');
        } catch (kafkaError) {
            logger.warn(
                'Kafka initialization failed, continuing without Kafka:',
                kafkaError
            );
        }

        // Start server
        const PORT = process.env.PORT || 3001;
        app.listen(PORT, () => {
            logger.info(`Server is running on port ${PORT}`);
            logger.info(
                `API Documentation available at http://localhost:${PORT}/api-docs`
            );
        });
    } catch (error) {
        logger.error('Failed to start server:', error);
        process.exit(1);
    }
};

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
    logger.error('Uncaught Exception:', {
        error: error.message,
        stack: error.stack,
    });
    process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (error) => {
    logger.error('Unhandled Rejection:', {
        error: error.message,
        stack: error.stack,
    });
    process.exit(1);
});

// Handle graceful shutdown
process.on('SIGTERM', async () => {
    logger.info('SIGTERM received. Starting graceful shutdown...');
    try {
        // Shutdown Kafka connections
        await kafkaService.shutdown();

        // Close MongoDB connection
        await mongoose.connection.close();
        logger.info('MongoDB connection closed');

        // Close server
        server.close(() => {
            logger.info('Server closed');
            process.exit(0);
        });
    } catch (error) {
        logger.error('Error during graceful shutdown:', error);
        process.exit(1);
    }
});

// Start the server
startServer();

module.exports = app; // For testing purposes
