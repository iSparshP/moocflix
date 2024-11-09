const redisClient = require('./redis/redisClient');
const logger = require('../utils/logger');

class MetricsPersistence {
    constructor() {
        this.retentionHours = 24; // Keep metrics for 24h
        this.isInitialized = false;
    }

    async init() {
        try {
            // Use the shared Redis client instance
            this.isInitialized = await redisClient.ping();
            logger.info('Metrics persistence initialized');
        } catch (error) {
            logger.error('Failed to initialize metrics persistence:', error);
            throw error;
        }
    }

    async persistMetrics(metrics) {
        if (!this.isInitialized) {
            throw new Error('MetricsPersistence not initialized');
        }

        const timestamp = Date.now();
        const key = `metrics:${timestamp}`;

        try {
            await redisClient.setex(
                key,
                this.retentionHours * 3600,
                JSON.stringify(metrics)
            );
            return true;
        } catch (error) {
            logger.error('Failed to persist metrics', { error });
            return false;
        }
    }

    async getLatestMetrics(count = 10) {
        if (!this.isInitialized) {
            throw new Error('MetricsPersistence not initialized');
        }

        try {
            const keys = await redisClient.keys('metrics:*');
            const latest = keys.sort().slice(-count);
            return await Promise.all(
                latest.map(async (key) =>
                    JSON.parse(await redisClient.get(key))
                )
            );
        } catch (error) {
            logger.error('Failed to retrieve metrics', { error });
            return [];
        }
    }

    async cleanup() {
        if (!this.isInitialized) return;

        try {
            const oldestAllowedTimestamp =
                Date.now() - this.retentionHours * 3600 * 1000;
            const keys = await redisClient.keys('metrics:*');

            for (const key of keys) {
                const timestamp = parseInt(key.split(':')[1]);
                if (timestamp < oldestAllowedTimestamp) {
                    await redisClient.del(key);
                }
            }
        } catch (error) {
            logger.error('Failed to cleanup old metrics', { error });
        }
    }

    async close() {
        if (redisClient) {
            await redisClient.quit();
            this.isInitialized = false;
        }
    }
}

module.exports = new MetricsPersistence();
