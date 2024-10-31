const kafka = require('kafka-node');
const logger = require('../utils/logger');

if (!process.env.KAFKA_HOST) {
    throw new Error('KAFKA_HOST environment variable is required');
}

if (!process.env.KAFKA_TRANSCODE_TOPIC) {
    throw new Error('KAFKA_TRANSCODE_TOPIC environment variable is required');
}

const client = new kafka.KafkaClient({
    kafkaHost: process.env.KAFKA_HOST,
    connectTimeout: 3000,
    requestTimeout: 30000,
});

const initKafka = async () => {
    let retries = 0;
    const maxRetries = 5;

    while (retries < maxRetries) {
        try {
            await client.connect();
            break;
        } catch (error) {
            retries++;
            logger.error(`Kafka connection attempt ${retries} failed`, {
                error,
            });
            await new Promise((resolve) => setTimeout(resolve, 5000));
        }
    }

    if (retries === maxRetries) {
        throw new Error('Failed to connect to Kafka');
    }
};

const consumer = new Consumer(
    client,
    [{ topic: process.env.KAFKA_TRANSCODE_TOPIC, partition: 0 }],
    {
        autoCommit: true,
        autoCommitIntervalMs: 5000,
        fetchMaxWaitMs: 100,
        fetchMinBytes: 1,
        fetchMaxBytes: 1024 * 1024,
    }
);

consumer.on('error', (err) => {
    logger.error('Kafka Consumer error:', { error: err.message });
});

consumer.on('offsetOutOfRange', (err) => {
    logger.error('Kafka offset out of range:', { error: err.message });
});

module.exports = { client, consumer, initKafka };
