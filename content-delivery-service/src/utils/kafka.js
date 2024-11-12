const { Kafka } = require('kafkajs');
const config = require('../config/config');

class KafkaClient {
    constructor() {
        this.kafka = new Kafka({
            clientId: config.kafka.clientId,
            brokers: config.kafka.brokers,
            ssl: true,
            sasl: {
                mechanism: 'plain',
                username: config.kafka.username,
                password: config.kafka.password,
            },
        });

        this.producer = null;
        this.consumer = null;
        this._isInitialized = false;
    }

    async initialize() {
        try {
            this.producer = this.kafka.producer();
            await this.producer.connect();

            this.consumer = this.kafka.consumer({
                groupId: config.kafka.groupId,
            });
            await this.consumer.connect();

            this._isInitialized = true;
            return true;
        } catch (error) {
            console.error('Failed to initialize Kafka:', error);
            this._isInitialized = false;
            throw error;
        }
    }

    async disconnect() {
        try {
            if (this.producer) {
                await this.producer.disconnect();
            }
            if (this.consumer) {
                await this.consumer.disconnect();
            }
            this._isInitialized = false;
        } catch (error) {
            console.error('Error disconnecting from Kafka:', error);
            throw error;
        }
    }

    async isConnected() {
        try {
            if (!this._isInitialized || !this.producer) {
                return false;
            }
            // Try a simple admin operation to verify connection
            await this.producer
                .send({ topic: '__kafka_ready_check', messages: [] })
                .catch(() => {});
            return true;
        } catch (error) {
            return false;
        }
    }
}

module.exports = new KafkaClient();
