const { Kafka } = require('kafkajs');
require('dotenv').config();

const kafka = new Kafka({
    clientId: 'course-management-service',
    brokers: [process.env.KAFKA_BROKER],
});

const producer = kafka.producer();
const consumer = kafka.consumer({ groupId: 'course-management-group' });

const sendMessage = async (topic, message) => {
    await producer.connect();
    await producer.send({
        topic,
        messages: [{ value: JSON.stringify(message) }],
    });
    await producer.disconnect();
};

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

const checkKafkaHealth = async () => {
    try {
        if (!producer) {
            throw new Error('Kafka producer not initialized');
        }

        const isConnected = producer.isConnected();
        if (!isConnected) {
            throw new Error('Kafka producer is not connected');
        }

        return {
            status: 'healthy',
            type: 'kafka',
        };
    } catch (error) {
        logger.error('Kafka health check failed:', { error: error.message });
        return {
            status: 'unhealthy',
            type: 'kafka',
            error: error.message,
        };
    }
};

module.exports = { sendMessage, consumeMessages, checkKafkaHealth };
