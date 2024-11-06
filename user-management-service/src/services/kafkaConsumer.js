const { consumer } = require('../../config/kafka');
const { handleUserCreation, handleUserUpdate } = require('./messageHandlers');
const logger = require('../utils/logger');
const { validateEventMessage } = require('../config/eventSchemas');
const { AppError } = require('../utils/errorUtils');
const handleKafkaError = require('../utils/kafkaErrorHandler');

const messageHandlers = {
    'User-Creation': handleUserCreation,
    'User-Update': handleUserUpdate,
};

const processMessage = async (topic, message) => {
    const handler = messageHandlers[topic];
    if (!handler) {
        throw new AppError(`No handler found for topic: ${topic}`, 400);
    }

    // Validate message format
    await validateEventMessage(topic, message);

    // Execute handler with circuit breaker and retry
    return await executeWithBreaker(() => executeWithRetry(handler, message));
};

const startConsumer = async () => {
    try {
        await consumer.connect();
        await consumer.subscribe({
            topics: Object.keys(messageHandlers),
            fromBeginning: true,
        });

        await consumer.run({
            eachMessage: async ({ topic, partition, message }) => {
                try {
                    const parsedMessage = JSON.parse(message.value.toString());
                    await processMessage(topic, parsedMessage);

                    logger.info('Message processed successfully', {
                        topic,
                        messageId: message.offset,
                    });
                } catch (error) {
                    logger.error('Error processing message', {
                        topic,
                        error: error.message,
                        partition,
                        offset: message.offset,
                    });
                }
            },
        });
    } catch (error) {
        logger.error('Failed to start consumer', { error: error.message });
        throw error;
    }
};

// Add error handling to consumer
consumer.on('consumer.crash', async (error) => {
    handleKafkaError(error);
    await consumer.disconnect();
    process.exit(1);
});

consumer.on('consumer.connect', () => {
    logger.info('Kafka consumer connected successfully');
});

module.exports = { startConsumer };
