module.exports = {
    broker: process.env.KAFKA_BROKER,
    clientId: 'course-management-service',
    connectionTimeout: 3000,
    authenticationTimeout: 1000,
    reauthenticationThreshold: 10000,
    requestTimeout: 30000,
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
