require('dotenv').config();

const requiredEnvVars = ['MONGODB_URI', 'JWT_SECRET', 'KAFKA_BROKERS'];

// Check for required environment variables
requiredEnvVars.forEach((envVar) => {
    if (!process.env[envVar]) {
        throw new Error(`Missing required environment variable: ${envVar}`);
    }
});

const env = {
    NODE_ENV: process.env.NODE_ENV || 'development',
    PORT: process.env.PORT || 3001,
    MONGODB_URI: process.env.MONGODB_URI,
    JWT_SECRET: process.env.JWT_SECRET,
    KAFKA: {
        BROKERS: process.env.KAFKA_BROKERS?.split(',') || [],
        USERNAME: process.env.KAFKA_USERNAME || process.env.KAFKA_SASL_USERNAME,
        PASSWORD: process.env.KAFKA_PASSWORD || process.env.KAFKA_SASL_PASSWORD,
        CLIENT_ID: process.env.KAFKA_CLIENT_ID || 'assessment-service',
        GROUP_ID: process.env.KAFKA_GROUP_ID || 'assessment-group',
    },
    API_URL: process.env.API_URL || 'http://localhost:3001',
    PROD_API_URL: process.env.PROD_API_URL,
};

module.exports = { env };
