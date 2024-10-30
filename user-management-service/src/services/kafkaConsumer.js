const { Kafka } = require('kafkajs');
const { handleUserCreation, handleUserUpdate } = require('./messageHandlers');

const kafka = new Kafka({
    clientId: 'user-management-service-consumer',
    brokers: [process.env.KAFKA_BROKER || 'kafka:9092'],
});

const consumer = kafka.consumer({
    groupId: 'user-management-group',
    retry: {
        initialRetryTime: 100,
        retries: 3,
    },
});

const DLQ_TOPIC = 'dead-letter-queue';

const processMessage = async (topic, message) => {
    const handlers = {
        'User-Creation': handleUserCreation,
        'User-Update': handleUserUpdate,
    };

    try {
        const handler = handlers[topic];
        if (!handler) {
            throw new Error(`No handler found for topic: ${topic}`);
        }

        const parsedMessage = JSON.parse(message.value.toString());
        await handler(parsedMessage);
    } catch (error) {
        // Send to Dead Letter Queue
        const producer = kafka.producer();
        await producer.connect();
        await producer.send({
            topic: DLQ_TOPIC,
            messages: [
                {
                    value: JSON.stringify({
                        originalTopic: topic,
                        originalMessage: message.value.toString(),
                        error: error.message,
                        timestamp: new Date().toISOString(),
                    }),
                },
            ],
        });
        await producer.disconnect();
        throw error;
    }
};

const startConsumer = async () => {
    await consumer.connect();

    await consumer.subscribe({
        topics: ['User-Creation', 'User-Update'],
        fromBeginning: true,
    });

    await consumer.run({
        eachMessage: async ({ topic, partition, message }) => {
            await processMessage(topic, message);
        },
    });
};

module.exports = {
    startConsumer,
};
