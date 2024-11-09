// src/utils/kafkaInit.js
const { Kafka } = require('kafkajs');
const fs = require('fs');
const logger = require('./logger');
const config = require('../../config/config');

const kafka = new Kafka({
    clientId: 'course-management-service',
    brokers: process.env.KAFKA_BROKERS.split(','),
    ssl: {
        ca: [fs.readFileSync(process.env.KAFKA_CA_CERT, 'utf-8')],
        key: fs.readFileSync(process.env.KAFKA_CLIENT_KEY, 'utf-8'),
        cert: fs.readFileSync(process.env.KAFKA_CLIENT_CERT, 'utf-8'),
        rejectUnauthorized: true, // Enable proper SSL verification
        servername: process.env.KAFKA_BROKERS.split(',')[0].split(':')[0], // Use the broker hostname
    },
    sasl: {
        mechanism: 'plain',
        username: process.env.KAFKA_USERNAME,
        password: process.env.KAFKA_PASSWORD,
    },
    retry: {
        initialRetryTime: 100,
        retries: 8,
    },
});

let producer = null;

async function initializeKafka() {
    try {
        producer = kafka.producer();
        await producer.connect();
        logger.info('Successfully connected to external Kafka broker with SSL');
        return producer;
    } catch (error) {
        logger.error('Failed to initialize Kafka:', error);
        throw error;
    }
}

module.exports = {
    initializeKafka,
    kafka,
    getProducer: () => producer,
};
