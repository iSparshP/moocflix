const { Kafka, logLevel } = require('kafkajs');
const config = require('../../config/environment');
const logger = require('../../utils/logger');

class KafkaClient {
    constructor() {
        this.kafka = new Kafka({
            clientId: config.kafka.clientId,
            brokers: config.kafka.brokers,
            ssl: config.kafka.ssl,
            sasl: config.kafka.sasl,
            logLevel: logLevel.INFO,
            retry: {
                initialRetryTime: 100,
                retries: 8,
            },
        });

        this.producer = this.kafka.producer({
            allowAutoTopicCreation: true,
            transactionTimeout: 30000,
        });

        this.consumer = this.kafka.consumer({
            groupId: `${config.kafka.clientId}-group`,
            maxWaitTimeInMs: 50,
            maxBytes: 5242880, // 5MB
        });

        this.admin = this.kafka.admin();
    }

    async connect() {
        try {
            await this.producer.connect();
            await this.consumer.connect();
            await this.admin.connect();
            logger.info('Successfully connected to Kafka');
        } catch (error) {
            logger.error('Failed to connect to Kafka:', error);
            throw error;
        }
    }

    async disconnect() {
        try {
            await this.producer.disconnect();
            await this.consumer.disconnect();
            await this.admin.disconnect();
            logger.info('Disconnected from Kafka');
        } catch (error) {
            logger.error('Failed to disconnect from Kafka:', error);
            throw error;
        }
    }

    async sendMessage(topic, message) {
        try {
            const result = await this.producer.send({
                topic,
                messages: [
                    {
                        key: message.id || String(Date.now()),
                        value: JSON.stringify(message),
                        headers: {
                            'content-type': 'application/json',
                            timestamp: Date.now().toString(),
                        },
                    },
                ],
            });
            logger.info(`Message sent to topic ${topic}`, { result });
            return result;
        } catch (error) {
            logger.error(`Failed to send message to topic ${topic}:`, error);
            throw error;
        }
    }

    async subscribe(topics, messageHandler) {
        try {
            await this.consumer.subscribe({ topics, fromBeginning: false });

            await this.consumer.run({
                eachMessage: async ({ topic, partition, message }) => {
                    try {
                        const value = JSON.parse(message.value.toString());
                        await messageHandler(value, {
                            topic,
                            partition,
                            offset: message.offset,
                            timestamp: message.timestamp,
                        });
                    } catch (error) {
                        logger.error('Error processing message:', error);
                    }
                },
            });

            logger.info(`Subscribed to topics: ${topics.join(', ')}`);
        } catch (error) {
            logger.error('Failed to subscribe to topics:', error);
            throw error;
        }
    }

    async createTopics(topics) {
        try {
            await this.admin.createTopics({
                topics: topics.map((topic) => ({
                    topic,
                    numPartitions: 3,
                    replicationFactor: 2,
                })),
            });
            logger.info(`Created topics: ${topics.join(', ')}`);
        } catch (error) {
            logger.error('Failed to create topics:', error);
            throw error;
        }
    }
}

module.exports = new KafkaClient();
