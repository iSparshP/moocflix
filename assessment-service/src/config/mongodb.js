const mongoose = require('mongoose');
const { logger } = require('./logger');

const connectDB = async () => {
    try {
        const mongoURI = process.env.MONGODB_URI;

        if (!mongoURI) {
            throw new Error(
                'MongoDB URI is not defined in environment variables'
            );
        }

        const conn = await mongoose.connect(mongoURI, {
            // Remove deprecated options
            // useNewUrlParser and useUnifiedTopology are no longer needed in newer versions
        });

        logger.info(`MongoDB Connected: ${conn.connection.host}`);
    } catch (error) {
        logger.error('MongoDB connection error:', error);
        // Don't exit the process here, let the caller handle it
        throw error;
    }
};

module.exports = { connectDB };
