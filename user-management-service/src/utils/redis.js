const Redis = require('ioredis');
const logger = require('./logger');

class RedisManager {
    constructor() {
        this.client = null;
        this.initialize();
    }

    initialize() {
        try {
            // Use URL if provided, otherwise use individual components
            if (process.env.REDIS_URL) {
                this.client = new Redis(process.env.REDIS_URL, {
                    retryStrategy: (times) => {
                        const delay = Math.min(times * 50, 2000);
                        return delay;
                    },
                    maxRetriesPerRequest: 3,
                });
            } else {
                this.client = new Redis({
                    host: process.env.REDIS_HOST,
                    port: parseInt(process.env.REDIS_PORT) || 6379,
                    password: process.env.REDIS_PASSWORD,
                    db: parseInt(process.env.REDIS_DB) || 0,
                    retryStrategy: (times) => {
                        const delay = Math.min(times * 50, 2000);
                        return delay;
                    },
                    maxRetriesPerRequest: 3,
                });
            }

            this.client.on('connect', () => {
                logger.info('Redis client connected successfully');
            });

            this.client.on('error', (error) => {
                logger.error('Redis client error', { error: error.message });
            });

            this.client.on('ready', () => {
                logger.info('Redis client ready');
            });

            return this.client;
        } catch (error) {
            logger.error('Failed to initialize Redis client', {
                error: error.message,
            });
            throw error;
        }
    }

    getClient() {
        if (!this.client) {
            throw new Error('Redis client not initialized');
        }
        return this.client;
    }

    async quit() {
        if (this.client) {
            await this.client.quit();
            this.client = null;
            logger.info('Redis connection closed');
        }
    }
}

// Export singleton instance
module.exports = new RedisManager();
