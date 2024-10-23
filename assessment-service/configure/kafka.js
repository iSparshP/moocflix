const { Kafka, Partitioners } = require('kafkajs');
require('dotenv').config();

const kafka = new Kafka({
    clientId: 'assessment-service',
    brokers: [process.env.KAFKA_BROKER],
    createPartitioner: Partitioners.LegacyPartitioner,
});

const producer = kafka.producer();
const consumer = kafka.consumer({ groupId: 'assessment-group' });

const send = async (message) => {
    await producer.connect();
    await producer.send(message);
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

module.exports = {
    send,
    consumeMessages,
};
