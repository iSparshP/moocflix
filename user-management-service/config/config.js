const mongoose = require('mongoose');
const dotenv = require('dotenv');
const logger = require('../src/utils/logger');
const { retryConnection } = require('../src/utils/connectionRetry');

dotenv.config();

const connectDB = async () => {
    // Build the connection URI with credentials
    const uri = process.env.MONGO_URI.replace(
        '<db_username>',
        encodeURIComponent(process.env.MONGO_USER)
    ).replace('<db_password>', encodeURIComponent(process.env.MONGO_PASSWORD));

    const options = {
        // Connection settings
        maxPoolSize: 10,
        minPoolSize: 0,
        serverSelectionTimeoutMS: 30000,
        socketTimeoutMS: 45000,
        connectTimeoutMS: 30000,
        heartbeatFrequencyMS: 10000,
        maxIdleTimeMS: 30000,

        // Network settings
        family: 4,

        // SSL/TLS settings for Atlas
        ssl: true,
        tls: true,

        // Enable debug logging through mongoose instead
        autoIndex: process.env.NODE_ENV !== 'production',
    };

    try {
        // Remove existing listeners to prevent duplicates
        mongoose.connection.removeAllListeners();

        // Enable mongoose debug mode if needed
        if (process.env.MONGO_DEBUG === 'true') {
            mongoose.set('debug', {
                color: true,
                shell: true,
            });
        }

        // Add event listeners
        mongoose.connection.on('connecting', () => {
            logger.info('Connecting to MongoDB Atlas...', {
                uri: uri.replace(/\/\/[^@]+@/, '//***:***@'),
            });
        });

        mongoose.connection.on('connected', () => {
            logger.info('MongoDB Atlas connected successfully');
        });

        mongoose.connection.on('disconnected', () => {
            logger.warn('MongoDB Atlas disconnected');
        });

        mongoose.connection.on('error', (err) => {
            logger.error('MongoDB connection error', {
                error: err.message,
                code: err.code,
            });
        });

        // Attempt connection with retries
        await retryConnection(
            async () => {
                await mongoose.connect(uri, options);
            },
            {
                maxRetries: 5,
                initialDelay: 5000,
                maxDelay: 30000,
                onRetry: (error, attempt) => {
                    logger.warn(
                        `MongoDB connection attempt ${attempt} failed`,
                        {
                            error: error.message,
                            code: error.code,
                        }
                    );
                },
            }
        );

        // Set up cleanup
        process.on('SIGINT', async () => {
            try {
                await mongoose.connection.close();
                logger.info(
                    'MongoDB connection closed through app termination'
                );
                process.exit(0);
            } catch (err) {
                logger.error('Error during MongoDB cleanup', {
                    error: err.message,
                });
                process.exit(1);
            }
        });
    } catch (err) {
        logger.error('MongoDB connection failed', {
            error: err.message,
            code: err.code,
        });
        throw err;
    }
};

module.exports = connectDB;
