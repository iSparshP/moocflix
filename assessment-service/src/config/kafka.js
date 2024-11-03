const { Kafka, Partitioners } = require('kafkajs');
const logger = require('./logger');

const kafka = new Kafka({
    clientId: 'assessment-service',
    brokers: [process.env.KAFKA_BROKER],
    retry: {
        initialRetryTime: 100,
        retries: 8,
    },
    createPartitioner: Partitioners.LegacyPartitioner,
});

const producer = kafka.producer();
const consumer = kafka.consumer({ groupId: 'assessment-group' });

const send = async ({ topic, messages }) => {
    try {
        await producer.connect();
        await producer.send({ topic, messages });
    } catch (error) {
        logger.error('Kafka Producer Error:', error);
        throw error;
    } finally {
        await producer.disconnect();
    }
};

const consumeMessages = async (topics, callback) => {
    try {
        await consumer.connect();
        for (const topic of topics) {
            await consumer.subscribe({ topic, fromBeginning: true });
        }
        await consumer.run({
            eachMessage: async ({ topic, partition, message }) => {
                callback(topic, JSON.parse(message.value.toString()));
            },
        });
    } catch (error) {
        logger.error('Kafka Consumer Error:', error);
        throw error;
    }
};

module.exports = {
    kafka,
    send,
    consumeMessages,
};
