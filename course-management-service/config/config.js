const kafkaConfig = require('./kafka');

const requiredEnvVars = [
    'MONGO_URI',
    'KAFKA_BROKER',
    'USER_MANAGEMENT_SERVICE_URL',
    'PORT',
];

// Validate required environment variables
requiredEnvVars.forEach((envVar) => {
    if (!process.env[envVar]) {
        throw new Error(`Missing required environment variable: ${envVar}`);
    }
});

module.exports = {
    port: process.env.PORT || 3000,
    mongodb: {
        uri: process.env.MONGO_URI,
    },
    kafka: kafkaConfig,
    userManagementServiceURL: process.env.USER_MANAGEMENT_SERVICE_URL,
    env: process.env.NODE_ENV || 'development',
    logLevel: process.env.LOG_LEVEL || 'info',
};
