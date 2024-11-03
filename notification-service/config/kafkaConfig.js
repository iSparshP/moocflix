module.exports = {
    clientId: 'notification-service',
    brokers: ['kafka:9092'],
    retry: {
        initialRetryTime: 100,
        retries: 8,
    },
    connectionTimeout: 3000,
    authenticationTimeout: 1000,
    ssl: process.env.KAFKA_SSL === 'true',
    sasl:
        process.env.KAFKA_SASL === 'true'
            ? {
                  mechanism: process.env.KAFKA_SASL_MECHANISM,
                  username: process.env.KAFKA_USERNAME,
                  password: process.env.KAFKA_PASSWORD,
              }
            : null,
};
