const { Kafka } = require('kafkajs');
const { logger } = require('./logger');
const path = require('path');
const fs = require('fs');

// Helper to read cert files
const readCertFile = (filename) => {
    try {
        return fs.readFileSync(
            path.join(__dirname, '..', '..', 'certs', filename),
            'utf-8'
        );
    } catch (error) {
        logger.error(`Error reading certificate file ${filename}:`, error);
        throw error;
    }
};

// Create the Kafka client with SSL and SASL
const kafka = new Kafka({
    clientId: process.env.KAFKA_CLIENT_ID || 'assessment-service',
    brokers: [`${process.env.KAFKA_HOST}:${process.env.KAFKA_PORT}`], // Will be moocflix-kafka-do-user-18048795-0.e.db.ondigitalocean.com:25062
    ssl: {
        rejectUnauthorized: true,
        ca: [readCertFile('ca-certificate.crt')],
        key: readCertFile('user-access-key.key'),
        cert: readCertFile('user-access-certificate.crt'),
    },
    connectionTimeout: 5000,
    authenticationTimeout: 10000,
    retry: {
        initialRetryTime: 100,
        retries: 8,
    },
});

// Initialize consumer with error handling and reconnection logic
const initializeConsumer = async () => {
    try {
        const consumer = kafka.consumer({
            groupId: process.env.KAFKA_CONSUMER_GROUP_ID,
            retry: {
                initialRetryTime: 1000,
                retries: 10,
            },
        });

        await consumer.connect();
        logger.info('Kafka consumer connected successfully');

        consumer.on('consumer.disconnect', async () => {
            logger.warn(
                'Kafka consumer disconnected. Attempting to reconnect...'
            );
            try {
                await consumer.connect();
                logger.info('Kafka consumer reconnected successfully');
            } catch (error) {
                logger.error('Failed to reconnect consumer:', error);
            }
        });

        return consumer;
    } catch (error) {
        logger.error('Error initializing Kafka consumer:', error);
        throw error;
    }
};

// Initialize producer with error handling and reconnection logic
const initializeProducer = async () => {
    try {
        const producer = kafka.producer({
            retry: {
                initialRetryTime: 1000,
                retries: 10,
            },
        });

        await producer.connect();
        logger.info('Kafka producer connected successfully');

        producer.on('producer.disconnect', async () => {
            logger.warn(
                'Kafka producer disconnected. Attempting to reconnect...'
            );
            try {
                await producer.connect();
                logger.info('Kafka producer reconnected successfully');
            } catch (error) {
                logger.error('Failed to reconnect producer:', error);
            }
        });

        return producer;
    } catch (error) {
        logger.error('Error initializing Kafka producer:', error);
        throw error;
    }
};

// Helper function to send messages
const sendMessage = async (producer, topic, message) => {
    try {
        await producer.send({
            topic,
            messages: [{ value: JSON.stringify(message) }],
        });
        logger.info(`Message sent successfully to topic: ${topic}`);
    } catch (error) {
        logger.error(`Error sending message to topic ${topic}:`, error);
        throw error;
    }
};

// Helper function to subscribe to topics
const subscribeToTopics = async (consumer, topics) => {
    try {
        for (const topic of topics) {
            await consumer.subscribe({ topic, fromBeginning: false });
        }
        logger.info(`Successfully subscribed to topics: ${topics.join(', ')}`);
    } catch (error) {
        logger.error('Error subscribing to topics:', error);
        throw error;
    }
};

module.exports = {
    kafka,
    initializeConsumer,
    initializeProducer,
    sendMessage,
    subscribeToTopics,
};
