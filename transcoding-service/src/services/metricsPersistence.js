const Redis = require('ioredis');
const logger = require('../utils/logger');

class MetricsPersistence {
    constructor() {
        this.redis = null;
        this.retentionHours = 24; // Keep metrics for 24h
        this.isInitialized = false;
    }

    async init() {
        try {
            this.redis = new Redis(process.env.REDIS_URL);

            this.redis.on('error', (error) => {
                logger.error('Redis connection error:', { error });
                this.isInitialized = false;
            });

            this.redis.on('connect', () => {
                logger.info('Connected to Redis');
                this.isInitialized = true;
            });

            // Test connection
            await this.redis.ping();
            this.isInitialized = true;
        } catch (error) {
            logger.error('Failed to initialize Redis connection:', { error });
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
            await this.redis.setex(
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
            const keys = await this.redis.keys('metrics:*');
            const latest = keys.sort().slice(-count);
            return await Promise.all(
                latest.map(async (key) => JSON.parse(await this.redis.get(key)))
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
            const keys = await this.redis.keys('metrics:*');

            for (const key of keys) {
                const timestamp = parseInt(key.split(':')[1]);
                if (timestamp < oldestAllowedTimestamp) {
                    await this.redis.del(key);
                }
            }
        } catch (error) {
            logger.error('Failed to cleanup old metrics', { error });
        }
    }

    async close() {
        if (this.redis) {
            await this.redis.quit();
            this.isInitialized = false;
        }
    }
}

module.exports = new MetricsPersistence();
