// src/utils/kafkaInit.js
const { kafka } = require('./kafka');
const { initializeKafkaConsumer } = require('../services/kafkaHandler');

async function initializeKafka() {
    try {
        const producer = kafka.producer();
        await producer.connect();
        console.log('Kafka producer connected');

        await initializeKafkaConsumer();
        console.log('Kafka consumer initialized');
    } catch (error) {
        console.error('Failed to initialize Kafka:', error);
        process.exit(1);
    }
}

module.exports = initializeKafka;
