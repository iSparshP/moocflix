const requiredEnvVars = [
    'MONGO_URI',
    'KAFKA_BROKERS',
    'KAFKA_USERNAME',
    'KAFKA_PASSWORD',
    'KAFKA_CA_CERT',
    'KAFKA_CLIENT_KEY',
    'KAFKA_CLIENT_CERT',
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
    kafka: {
        brokers: process.env.KAFKA_BROKERS.split(','),
        username: process.env.KAFKA_USERNAME,
        password: process.env.KAFKA_PASSWORD,
        ssl: {
            enabled: true,
            caFilePath: process.env.KAFKA_CA_CERT,
            keyFilePath: process.env.KAFKA_CLIENT_KEY,
            certFilePath: process.env.KAFKA_CLIENT_CERT,
            rejectUnauthorized: true,
        },
    },
    userManagementServiceURL: process.env.USER_MANAGEMENT_SERVICE_URL,
    env: process.env.NODE_ENV || 'development',
    logLevel: process.env.LOG_LEVEL || 'info',
};
