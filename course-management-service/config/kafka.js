module.exports = {
    brokers: process.env.KAFKA_BROKERS.split(','),
    clientId: 'course-management-service',
    connectionTimeout: 3000,
    authenticationTimeout: 1000,
    reauthenticationThreshold: 10000,
    requestTimeout: 30000,
    ssl: process.env.KAFKA_SSL === 'true',
    sasl: {
        mechanism: 'plain',
        username: process.env.KAFKA_USERNAME,
        password: process.env.KAFKA_PASSWORD,
    },
    retry: {
        initialRetryTime: 100,
        retries: 8,
    },
    producerConfig: {
        allowAutoTopicCreation: false,
        idempotent: true,
    },
    consumerConfig: {
        groupId: 'course-management-group',
        sessionTimeout: 30000,
    },
};
