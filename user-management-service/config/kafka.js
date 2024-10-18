const { Kafka } = require('kafkajs');

const kafka = new Kafka({
    clientId: 'user-management-service',
    brokers: [process.env.KAFKA_BROKER], // Use the environment variable
});

const producer = kafka.producer();
const consumer = kafka.consumer({ groupId: 'user-management-group' });

const connectProducer = async () => {
    await producer.connect();
    console.log('Kafka Producer connected');
};

const connectConsumer = async () => {
    await consumer.connect();
    console.log('Kafka Consumer connected');
};

const sendMessage = async (topic, message) => {
    await producer.send({
        topic,
        messages: [{ value: JSON.stringify(message) }],
    });
    console.log(`Message sent to topic ${topic}`);
};

const consumeMessages = async (topics, handleMessage) => {
    for (const topic of topics) {
        await consumer.subscribe({ topic, fromBeginning: true });
    }
    await consumer.run({
        eachMessage: async ({ topic, partition, message }) => {
            console.log(`Received message: ${message.value.toString()}`);
            handleMessage(topic, JSON.parse(message.value.toString()));
        },
    });
};

module.exports = {
    connectProducer,
    connectConsumer,
    sendMessage,
    consumeMessages,
};
