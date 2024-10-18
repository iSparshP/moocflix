// src/utils/kafka.js
const { Kafka } = require('kafkajs');
require('dotenv').config();

const kafka = new Kafka({
    clientId: 'assessment-service',
    brokers: [process.env.KAFKA_BROKER],
});

const consumer = kafka.consumer({ groupId: 'assessment-group' });

const consumeMessages = async (topics, callback) => {
    await consumer.connect();
    for (const topic of topics) {
        await consumer.subscribe({ topic, fromBeginning: true });
    }
    await consumer.run({
        eachMessage: async ({ topic, partition, message }) => {
            callback(topic, JSON.parse(message.value.toString()));
        },
    });
};

module.exports = { consumeMessages };
