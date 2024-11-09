const { Kafka, CompressionTypes, logLevel } = require('kafkajs');
const logger = require('../utils/logger');
const config = require('./environment');
const redisClient = require('../services/redis/redisClient');
const transcodeService = require('../services/transcodeService');

async function initKafka() {
    try {
        const kafka = new Kafka({
            clientId: config.kafka.clientId,
            brokers: config.kafka.brokers,
            ssl: config.kafka.ssl,
            sasl: config.kafka.sasl,
            connectionTimeout: config.kafka.connectionTimeout,
            retry: config.kafka.retry,
        });

        const consumer = kafka.consumer({ groupId: config.kafka.groupId });
        const producer = kafka.producer();

        await Promise.all([consumer.connect(), producer.connect()]);

        // Subscribe to all relevant topics
        await consumer.subscribe({
            topics: [
                config.kafka.topics.request,
                config.kafka.topics.progress,
                config.kafka.topics.completed,
                config.kafka.topics.failed,
                config.kafka.topics.metrics,
            ],
            fromBeginning: false,
        });

        await consumer.run({
            eachMessage: async ({ topic, partition, message }) => {
                try {
                    const data = JSON.parse(message.value.toString());

                    switch (topic) {
                        case config.kafka.topics.request:
                            await transcodeService.processVideoJob(data);
                            break;

                        case config.kafka.topics.completed:
                            logger.info('Transcoding completed', {
                                videoId: data.videoId,
                                s3Location: data.s3Location,
                            });
                            await redisClient.updateJobState(data.videoId, {
                                status: 'completed',
                                s3Location: data.s3Location,
                            });
                            break;

                        case config.kafka.topics.failed:
                            logger.error('Transcoding failed', {
                                videoId: data.videoId,
                                error: data.error,
                            });
                            await redisClient.updateJobState(data.videoId, {
                                status: 'failed',
                                error: data.error,
                            });
                            break;

                        case config.kafka.topics.progress:
                            await redisClient.updateProgress(
                                data.videoId,
                                data.progress
                            );
                            break;
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
        return { consumer, producer };
    } catch (error) {
        logger.error('Failed to initialize Kafka:', error);
        throw error;
    }
}

module.exports = {
    initKafka,
    // ... rest of exports
};
