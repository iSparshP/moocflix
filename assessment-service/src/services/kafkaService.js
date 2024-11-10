const {
    initializeConsumer,
    initializeProducer,
    sendMessage,
    subscribeToTopics,
} = require('../config/kafka');
const { logger } = require('../config/logger');

class KafkaService {
    constructor() {
        this.producer = null;
        this.consumer = null;
        this.messageHandlers = new Map();
        this.pendingTopics = new Set();
    }

    async initialize() {
        try {
            // Initialize producer first
            this.producer = await initializeProducer();

            // Initialize consumer but don't start running yet
            this.consumer = await initializeConsumer();

            // Register any pending topics before starting the consumer
            if (this.pendingTopics.size > 0) {
                for (const topic of this.pendingTopics) {
                    await this.consumer.subscribe({ topic });
                }
            }

            // Now setup message processing
            await this.setupMessageProcessing();

            logger.info('Kafka service initialized successfully');
        } catch (error) {
            logger.error('Failed to initialize Kafka service:', error);
            throw error;
        }
    }

    async setupMessageProcessing() {
        if (!this.consumer) return;

        await this.consumer.run({
            eachMessage: async ({ topic, partition, message }) => {
                try {
                    const handler = this.messageHandlers.get(topic);
                    if (handler) {
                        await handler(JSON.parse(message.value.toString()));
                    } else {
                        logger.warn(
                            `No handler registered for topic: ${topic}`
                        );
                    }
                } catch (error) {
                    logger.error(
                        `Error processing message from topic ${topic}:`,
                        error
                    );
                }
            },
        });
    }

    // Register message handlers for specific topics
    registerHandler(topic, handler) {
        this.messageHandlers.set(topic, handler);
        this.pendingTopics.add(topic);
        logger.info(`Handler registered for topic: ${topic}`);
    }

    // Send message to a topic
    async produceMessage(topic, message) {
        if (!this.producer) {
            throw new Error('Producer not initialized');
        }
        await sendMessage(this.producer, topic, message);
    }

    // Subscribe to topics
    async subscribe(topics) {
        if (!this.consumer) {
            // Store topics for later subscription during initialization
            topics.forEach((topic) => this.pendingTopics.add(topic));
            return;
        }

        try {
            for (const topic of topics) {
                if (!this.pendingTopics.has(topic)) {
                    await this.consumer.subscribe({ topic });
                    this.pendingTopics.add(topic);
                }
            }
            logger.info(
                `Successfully subscribed to topics: ${topics.join(', ')}`
            );
        } catch (error) {
            logger.error('Error subscribing to topics:', error);
            throw error;
        }
    }

    // Graceful shutdown
    async shutdown() {
        try {
            if (this.producer) {
                await this.producer.disconnect();
                logger.info('Kafka producer disconnected');
            }
            if (this.consumer) {
                await this.consumer.disconnect();
                logger.info('Kafka consumer disconnected');
            }
        } catch (error) {
            logger.error('Error during Kafka service shutdown:', error);
            throw error;
        }
    }
}

module.exports = new KafkaService();
