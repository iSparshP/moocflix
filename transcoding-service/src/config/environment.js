module.exports = {
    kafka: {
        brokers: process.env.KAFKA_BROKERS?.split(',') || [],
        clientId: process.env.KAFKA_CLIENT_ID || 'transcoding-service',
        ssl: true,
        sasl: {
            mechanism: 'plain',
            username: process.env.KAFKA_USERNAME,
            password: process.env.KAFKA_PASSWORD,
        },
        topics: {
            transcode: process.env.KAFKA_TRANSCODE_TOPIC || 'video-transcoding',
            status: process.env.KAFKA_STATUS_TOPIC || 'transcoding-status',
        },
    },
    redis: {
        url: process.env.REDIS_URL,
        password: process.env.REDIS_PASSWORD,
        tls: process.env.NODE_ENV === 'production' ? {} : undefined,
        database: process.env.REDIS_DATABASE || '0',
    },
};
