const config = {
    kafka: {
        clientId: process.env.KAFKA_CLIENT_ID || 'user-management-service',
        brokers: (process.env.KAFKA_BROKERS || 'localhost:9092').split(','),
        groupId: process.env.KAFKA_GROUP_ID || 'user-management-group',
    },
    redis: {
        url: process.env.REDIS_URI,
        retryStrategy: (times) => Math.min(times * 50, 2000),
    },
    app: {
        port: parseInt(process.env.PORT || '3007'),
    },
};

module.exports = config;
