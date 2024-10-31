const mongoose = require('mongoose');
const dotenv = require('dotenv');
const logger = require('../src/utils/logger');
const { retryConnection } = require('../src/utils/connectionRetry');

dotenv.config();

const connectDB = async () => {
    const options = {
        maxPoolSize: 10,
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000,
        // Add recommended options
        compression: {
            compressors: ['zlib'],
        },
        heartbeatFrequencyMS: 10000,
        retryWrites: true,
        retryReads: true,
    };

    try {
        await retryConnection(async () => {
            await mongoose.connect(process.env.MONGO_URI, options);
            logger.info('MongoDB connected successfully');
        });
    } catch (err) {
        logger.error('MongoDB connection failed', {
            error: err.message,
            stack: err.stack,
        });
        throw err; // Let caller handle process exit
    }
};

module.exports = connectDB;
