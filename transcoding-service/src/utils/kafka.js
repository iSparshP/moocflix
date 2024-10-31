// src/utils/kafka.js
const kafka = require('kafka-node');
const Producer = kafka.Producer;
const client = new kafka.KafkaClient({ kafkaHost: process.env.KAFKA_HOST });
const producer = new Producer(client);

exports.sendMessage = (topic, message) => {
    return new Promise((resolve, reject) => {
        producer.send(
            [
                {
                    topic,
                    messages: JSON.stringify(message),
                },
            ],
            (err, data) => {
                if (err) reject(err);
                else resolve(data);
            }
        );
    });
};
