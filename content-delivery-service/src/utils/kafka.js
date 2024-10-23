const kafka = require('kafka-node');
const Producer = kafka.Producer;
const client = new kafka.KafkaClient({ kafkaHost: process.env.KAFKA_HOST });
const producer = new Producer(client);

producer.on('ready', () => {
    console.log('Kafka Producer is connected and ready.');
});

producer.on('error', (err) => {
    console.error('Kafka Producer error:', err);
});

exports.sendMessage = (topic, message) => {
    return new Promise((resolve, reject) => {
        const payloads = [
            {
                topic: topic,
                messages: JSON.stringify(message),
            },
        ];

        producer.send(payloads, (err, data) => {
            if (err) {
                console.error('Error sending message to Kafka:', err);
                reject(err);
            } else {
                console.log('Message sent to Kafka:', data);
                resolve(data);
            }
        });
    });
};
