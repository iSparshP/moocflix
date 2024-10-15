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

exports.requestTranscoding = (videoId) => {
    return new Promise((resolve, reject) => {
        const payloads = [
            {
                topic: process.env.KAFKA_TRANSCODE_TOPIC,
                messages: JSON.stringify({ videoId }),
            },
        ];

        producer.send(payloads, (err, data) => {
            if (err) {
                console.error(
                    'Error sending transcoding request to Kafka:',
                    err
                );
                reject(err);
            } else {
                console.log('Transcoding request sent to Kafka:', data);
                resolve(data);
            }
        });
    });
};
