const { Kafka } = require('kafkajs');

const kafka = new Kafka({
    clientId: 'course-management-service',
    brokers: [process.env.KAFKA_BROKER],
});

const producer = kafka.producer();

const sendMessage = async (topic, message) => {
    await producer.connect();
    await producer.send({
        topic,
        messages: [{ value: JSON.stringify(message) }],
    });
    await producer.disconnect();
};

module.exports = { sendMessage };
