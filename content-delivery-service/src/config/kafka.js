const { Kafka } = require('kafkajs');
const config = require('./config');
const logger = require('../utils/logger');
const mediaConvertHandler = require('../services/mediaConvertHandler');
const path = require('path');
const fs = require('fs');

class KafkaManager {
    constructor() {
        this.kafka = null;
        this.producer = null;
        this.consumer = null;
    }

    async initialize() {
        try {
            // Read SSL certificates
            const ca = fs.readFileSync(
                path.join(__dirname, '..', 'certs', 'ca-certificate.crt'),
                'utf-8'
            );
            const key = fs.readFileSync(
                path.join(__dirname, '..', 'certs', 'user-access-key.key'),
                'utf-8'
            );
            const cert = fs.readFileSync(
                path.join(
                    __dirname,
                    '..',
                    'certs',
                    'user-access-certificate.crt'
                ),
                'utf-8'
            );

            // Create Kafka instance with configuration
            const kafkaConfig = {
                clientId: config.kafka.clientId,
                brokers: config.kafka.brokers,
                connectionTimeout: config.kafka.connectionTimeout || 5000,
                retry: config.kafka.retry,
                ssl: {
                    servername: config.kafka.brokers[0].split(':')[0], // Extract hostname for SSL verification
                    ca: [ca],
                    key: key,
                    cert: cert,
                    rejectUnauthorized: true, // Enable strict SSL certificate verification
                },
                // SASL not needed when using SSL certificate authentication
            };

            logger.info('Initializing Kafka with config:', {
                clientId: kafkaConfig.clientId,
                brokers: kafkaConfig.brokers,
                sslEnabled: true,
                servername: kafkaConfig.ssl.servername,
            });

            this.kafka = new Kafka(kafkaConfig);

            // Initialize producer with idempotence
            this.producer = this.kafka.producer({
                maxInFlightRequests: 1,
                idempotent: true,
                transactionalId: 'content-delivery-producer',
            });

            // Initialize consumer with group ID
            this.consumer = this.kafka.consumer({
                groupId: config.kafka.groupId,
                maxWaitTimeInMs: 5000,
                sessionTimeout: 30000,
            });

            // Connect both producer and consumer
            logger.info('Connecting to Kafka...');
            await Promise.all([
                this.producer.connect(),
                this.consumer.connect(),
            ]);

            // Subscribe to topics
            await this.consumer.subscribe({
                topics: [
                    config.kafka.topics.studentEnrolled,
                    config.kafka.topics.transcodeComplete,
                    config.kafka.topics.transcodeProgress,
                    config.kafka.topics.transcodeFailed,
                ],
                fromBeginning: false,
            });

            // Setup message handling
            await this.setupConsumer();

            logger.info('Kafka connections established successfully');
        } catch (error) {
            logger.error('Failed to initialize Kafka:', error);
            throw error;
        }
    }

    async setupConsumer() {
        if (!this.consumer) {
            throw new Error('Consumer not initialized');
        }

        await this.consumer.run({
            autoCommit: false,
            eachMessage: async ({ topic, partition, message }) => {
                try {
                    const data = JSON.parse(message.value.toString());
                    await this.handleMessage(topic, data);
                    await this.consumer.commitOffsets([
                        {
                            topic,
                            partition,
                            offset: (Number(message.offset) + 1).toString(),
                        },
                    ]);
                } catch (error) {
                    logger.error('Failed to process Kafka message:', error);
                }
            },
        });
    }

    async handleMessage(topic, data) {
        switch (topic) {
            case config.kafka.topics.transcodeComplete:
                await mediaConvertHandler.handleJobStatusChange({
                    detail: {
                        jobId: data.jobId,
                        status: 'COMPLETE',
                        ...data,
                    },
                });
                break;
            case config.kafka.topics.transcodeFailed:
                await mediaConvertHandler.handleJobStatusChange({
                    detail: {
                        jobId: data.jobId,
                        status: 'ERROR',
                        errorMessage: data.error,
                    },
                });
                break;
            default:
                logger.warn(`Unhandled Kafka topic: ${topic}`);
        }
    }

    async close() {
        try {
            if (this.consumer) await this.consumer.disconnect();
            if (this.producer) await this.producer.disconnect();
            logger.info('Kafka connections closed');
        } catch (error) {
            logger.error('Error closing Kafka connections:', error);
            throw error;
        }
    }
}

// Create and export a single instance
const kafkaManager = new KafkaManager();
module.exports = kafkaManager;
