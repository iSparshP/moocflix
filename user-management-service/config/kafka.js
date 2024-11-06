const { Kafka } = require('kafkajs');
const config = require('./appConfig');
const logger = require('../src/utils/logger');
const {
    validateSchema,
    schemas,
} = require('../src/middlewares/schemaValidator');
const { retryConnection } = require('../src/utils/connectionRetry');
const { createBreaker } = require('../src/utils/circuitBreaker');
const { validateEventMessage } = require('../src/config/eventSchemas');
const { v4: uuidv4 } = require('uuid');

// Centralized Kafka configuration
const kafka = new Kafka({
    clientId: config.kafka.clientId,
    brokers: config.kafka.brokers,
    ssl: true,
    sasl: {
        mechanism: 'plain',
        username: process.env.KAFKA_USERNAME,
        password: process.env.KAFKA_PASSWORD,
    },
    connectionTimeout: config.kafka.connectionTimeout,
    authenticationTimeout: config.kafka.authenticationTimeout,
    retry: {
        initialRetryTime: 100,
        retries: 5,
    },
});

// Shared instances
const producer = kafka.producer({
    allowAutoTopicCreation: false,
    transactionTimeout: 30000,
});

const consumer = kafka.consumer({
    groupId: config.kafka.groupId,
    sessionTimeout: 30000,
    heartbeatInterval: 3000,
    maxBytesPerPartition: 1048576, // 1MB
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
    const breaker = createBreaker(
        async () => {
            try {
                validateEventMessage(topic, message);
                await producer.send({
                    topic,
                    messages: [
                        {
                            key: uuidv4(),
                            value: JSON.stringify(message),
                            headers: {
                                timestamp: new Date().toISOString(),
                                correlationId: uuidv4(),
                            },
                        },
                    ],
                });
                logger.info(`Message sent to topic ${topic}`);
            } catch (error) {
                logger.error(`Failed to send message to topic ${topic}`, {
                    error,
                    topic,
                    messageId: message.id,
                });
                await sendToDLQ(topic, message, error);
                throw error;
            }
        },
        {
            timeout: 5000,
            resetTimeout: 30000,
            errorThresholdPercentage: 50,
        }
    );
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

// Health check
const checkKafkaHealth = async () => {
    try {
        const admin = kafka.admin();
        await admin.connect();
        const topics = await admin.listTopics();
        await admin.disconnect();
        logger.info('Kafka connection healthy', { topics: topics.length });
        return 'healthy';
    } catch (error) {
        logger.error('Kafka health check failed', { error: error.message });
        return 'unhealthy';
    }
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
    produceUserRegisteredEvent,
    checkKafkaHealth,
};
