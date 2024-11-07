const { Kafka, CompressionTypes, logLevel } = require('kafkajs');
const logger = require('../utils/logger');
const config = require('./environment');

const kafka = new Kafka({
    clientId: config.clientId,
    brokers: config.brokers,
    ssl: config.ssl,
    sasl: config.sasl,
    connectionTimeout: config.connectionTimeout,
    retry: config.retry,
    logLevel: logLevel.INFO,
});

const consumer = kafka.consumer({
    groupId: config.clientId + '-group',
    maxWaitTimeInMs: 50,
    maxBytes: 5242880, // 5MB
});

const producer = kafka.producer();

async function initKafka() {
    try {
        await consumer.connect();
        await producer.connect();

        await consumer.subscribe({
            topics: [config.kafka.topics.request, config.kafka.topics.progress],
            fromBeginning: false,
        });

        await consumer.run({
            eachMessage: async ({ topic, partition, message }) => {
                try {
                    const data = JSON.parse(message.value.toString());

                    if (topic === config.kafka.topics.request) {
                        if (await validator.validateJobRequest(data)) {
                            await queue.addJob(data);
                            logger.info('Added new transcoding job', {
                                videoId: data.videoId,
                            });
                        }
                    } else if (topic === config.kafka.topics.progress) {
                        logger.info('Progress update received', {
                            videoId: data.videoId,
                            progress: data.progress,
                        });
                        await redisClient.updateProgress(
                            data.videoId,
                            data.progress
                        );
                    }
                } catch (error) {
                    logger.error('Error processing Kafka message', {
                        error,
                        topic,
                        partition,
                        offset: message.offset,
                    });
                }
            },
        });

        logger.info('Kafka consumer initialized successfully');
    } catch (error) {
        logger.error('Failed to initialize Kafka', error);
        throw error;
    }
}

async function shutdown() {
    try {
        await consumer.disconnect();
        await producer.disconnect();
        logger.info('Kafka connections closed');
    } catch (error) {
        logger.error('Error during Kafka shutdown', error);
        throw error;
    }
}

async function sendMessage(topic, message) {
    try {
        await producer.send({
            topic,
            compression: CompressionTypes.GZIP,
            messages: [
                {
                    key: message.videoId || String(Date.now()),
                    value: JSON.stringify(message),
                    headers: {
                        'content-type': 'application/json',
                        timestamp: Date.now().toString(),
                    },
                },
            ],
        });
    } catch (error) {
        logger.error(`Failed to send message to topic ${topic}:`, error);
        throw error;
    }
}

module.exports = {
    initKafka,
    shutdown,
    sendMessage,
    consumer, // Exported for health checks
    producer,
};
