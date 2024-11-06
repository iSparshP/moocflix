const { Kafka } = require('kafkajs');
const Redis = require('ioredis');
const mongoose = require('mongoose');
const logger = require('./logger');

const checkMongoHealth = async () => {
    try {
        const state = mongoose.connection.readyState;
        if (state === 1) {
            return 'healthy';
        }
        return 'unhealthy';
    } catch (error) {
        logger.error('MongoDB health check failed', { error: error.message });
        return 'unhealthy';
    }
};

const checkRedisHealth = async () => {
    try {
        const redis = new Redis(process.env.REDIS_URL);
        await redis.ping();
        redis.disconnect();
        return 'healthy';
    } catch (error) {
        logger.error('Redis health check failed', { error: error.message });
        return 'unhealthy';
    }
};

const checkKafkaHealth = async () => {
    try {
        const kafka = new Kafka({
            clientId: process.env.KAFKA_CLIENT_ID,
            brokers: [process.env.KAFKA_BROKERS],
            ssl: true,
            sasl: {
                mechanism: 'plain',
                username: process.env.KAFKA_USERNAME,
                password: process.env.KAFKA_PASSWORD,
            },
        });
        const admin = kafka.admin();
        await admin.connect();
        await admin.listTopics();
        await admin.disconnect();
        return 'healthy';
    } catch (error) {
        logger.error('Kafka health check failed', { error: error.message });
        return 'unhealthy';
    }
};

module.exports = {
    checkMongoHealth,
    checkRedisHealth,
    checkKafkaHealth,
};
