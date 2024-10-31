const { Kafka } = require('kafkajs');
const { validateEvent } = require('../middlewares/schemaValidator');
const logger = require('../src/utils/logger');
const { retryConnection } = require('../src/utils/connectionRetry');
const { createBreaker } = require('../utils/circuitBreaker');
const { validateEventMessage } = require('../config/eventSchemas');

// Centralized Kafka configuration
const kafka = new Kafka({
    clientId: 'user-management-service',
    brokers: [process.env.KAFKA_BROKER || 'kafka:9092'],
    retry: {
        initialRetryTime: 100,
        retries: 5,
    },
});

// Shared instances
const producer = kafka.producer();
const consumer = kafka.consumer({
    groupId: 'user-management-group',
    retry: {
        initialRetryTime: 100,
        retries: 3,
    },
});

const DLQ_TOPIC = 'dead-letter-queue';

// Producer functions
const connectProducer = async () => {
    await retryConnection(async () => {
        await producer.connect();
        logger.info('Kafka Producer connected');
    });
};

const sendMessage = async (topic, message) => {
    const breaker = createBreaker(async () => {
        try {
            validateEventMessage(topic, message);
            await producer.send({
                topic,
                messages: [{ value: JSON.stringify(message) }],
            });
            logger.info(`Message sent to topic ${topic}`);
        } catch (error) {
            logger.error(`Failed to send message to topic ${topic}`, { error });
            await sendToDLQ(topic, message, error);
            throw error;
        }
    });
    return await breaker.fire();
};

const sendToDLQ = async (originalTopic, message, error) => {
    await producer.send({
        topic: DLQ_TOPIC,
        messages: [
            {
                value: JSON.stringify({
                    originalTopic,
                    originalMessage: message,
                    error: error.message,
                    timestamp: new Date().toISOString(),
                }),
            },
        ],
    });
};

const produceUserRegisteredEvent = async (userData) => {
    try {
        await producer.send({
            topic: 'User-Creation',
            messages: [
                {
                    value: JSON.stringify({
                        userId: userData.id,
                        email: userData.email,
                        role: userData.role,
                        timestamp: new Date().toISOString(),
                    }),
                },
            ],
        });
    } catch (error) {
        logger.error('Error producing UserRegistered event:', error);
        throw error;
    }
};

// Consumer functions
const connectConsumer = async () => {
    await consumer.connect();
    logger.info('Kafka Consumer connected');
};

const consumeMessages = async (topics, handleMessage) => {
    for (const topic of topics) {
        await consumer.subscribe({ topic, fromBeginning: true });
    }
    await consumer.run({
        eachMessage: async ({ topic, partition, message }) => {
            logger.info(`Received message: ${message.value.toString()}`);
            handleMessage(topic, JSON.parse(message.value.toString()));
        },
    });
};

const disconnectProducer = async () => {
    await producer.disconnect();
    logger.info('Kafka Producer disconnected');
};

const disconnectConsumer = async () => {
    await consumer.disconnect();
    logger.info('Kafka Consumer disconnected');
};

module.exports = {
    kafka,
    producer,
    consumer,
    DLQ_TOPIC,
    connectProducer,
    connectConsumer,
    sendMessage,
    sendToDLQ,
    consumeMessages,
    disconnectProducer,
    disconnectConsumer,
    produceUserRegisteredEvent, // Add this export
};
