const config = {
    app: {
        port: process.env.PORT || 3000,
        env: process.env.NODE_ENV || 'development',
    },
    kafka: {
        brokers: [process.env.KAFKA_BROKER || 'kafka:9092'],
        clientId: 'user-management-service',
        groupId: 'user-management-group',
    },
    mongo: {
        uri: process.env.MONGO_URI,
        options: {
            maxPoolSize: 10,
            serverSelectionTimeoutMS: 5000,
        },
    },
    jwt: {
        secret: process.env.JWT_SECRET,
        expiresIn: process.env.JWT_EXPIRES_IN || '24h',
    },
};

module.exports = config;
