const { Kafka } = require('kafkajs');

const kafka = new Kafka({
    clientId: 'user-management-service',
    brokers: [process.env.KAFKA_BROKER || 'kafka:9092'],
});

const producer = kafka.producer();

exports.produceUserRegisteredEvent = async (userData) => {
    try {
        await producer.connect();
        await producer.send({
            topic: 'User-Creation',
            messages: [
                {
                    value: JSON.stringify({
                        userId: userData.id,
                        email: userData.email,
                        role: userData.role,
                        timestamp: new Date().toISOString(),
                    }),
                },
            ],
        });
        await producer.disconnect();
    } catch (error) {
        console.error('Error producing UserRegistered event:', error);
        throw error;
    }
};
