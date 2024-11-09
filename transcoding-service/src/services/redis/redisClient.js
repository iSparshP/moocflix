const Redis = require('ioredis');
const config = require('../../config/environment');
const logger = require('../../utils/logger');

class RedisClient {
    constructor() {
        try {
            const options = {
                retryStrategy: (times) => {
                    const delay = Math.min(times * 50, 2000);
                    return delay;
                },
                maxRetriesPerRequest: 3,
                enableReadyCheck: true,
                autoResubscribe: true,
                autoResendUnfulfilledCommands: true,
                lazyConnect: true,
                keyPrefix: config.redis.keyPrefix,
                showFriendlyErrorStack: process.env.NODE_ENV !== 'production',
            };

            if (process.env.REDIS_TLS === 'true') {
                options.tls = {
                    rejectUnauthorized:
                        process.env.REDIS_TLS_REJECT_UNAUTHORIZED !== 'false',
                };
            }

            this.client = new Redis(config.redis.url, options);

            this.isConnected = false;

            this.client.on('error', (error) => {
                this.isConnected = false;
                logger.error('Redis Client Error:', error.message);
            });

            this.client.on('connect', () => {
                this.isConnected = true;
                logger.info('Connected to Redis');
            });

            this.client.on('ready', () => {
                this.isConnected = true;
                logger.info('Redis Client Ready');
            });

            this.client.on('close', () => {
                this.isConnected = false;
                logger.info('Redis Connection Closed');
            });

            this.client.on('reconnecting', () => {
                logger.info('Redis Client Reconnecting');
            });
        } catch (error) {
            logger.error('Failed to initialize Redis client:', error.message);
            throw error;
        }
    }

    async connect() {
        try {
            if (!this.isConnected) {
                await this.client.connect();
                this.isConnected = true;
                logger.info('Redis connection established');
            }
        } catch (error) {
            logger.error('Failed to connect to Redis:', error.message);
            throw error;
        }
    }

    async ping() {
        try {
            const result = await this.client.ping();
            return result === 'PONG';
        } catch (error) {
            logger.error('Redis ping failed:', error);
            return false;
        }
    }

    async quit() {
        try {
            await this.client.quit();
            this.isConnected = false;
            logger.info('Disconnected from Redis');
        } catch (error) {
            logger.error('Error disconnecting from Redis:', error);
            throw error;
        }
    }

    async setex(key, seconds, value) {
        try {
            return await this.client.set(key, value, 'EX', seconds);
        } catch (error) {
            logger.error(`Failed to set key ${key} with expiry:`, error);
            throw error;
        }
    }

    async saveJobState(jobId, state) {
        try {
            const key = `job:${jobId}`;
            await this.client.hset(key, {
                ...state,
                updatedAt: Date.now(),
            });
            await this.client.expire(key, 86400); // 24 hours TTL
            logger.debug(`Saved state for job ${jobId}`);
        } catch (error) {
            logger.error(`Failed to save job state for ${jobId}:`, error);
            throw error;
        }
    }

    async getJobState(jobId) {
        try {
            const key = `job:${jobId}`;
            const state = await this.client.hgetall(key);
            return state || null;
        } catch (error) {
            logger.error(`Failed to get job state for ${jobId}:`, error);
            throw error;
        }
    }

    async updateProgress(jobId, progress) {
        try {
            const key = `progress:${jobId}`;
            await this.client.hset(key, {
                progress: String(progress),
                updatedAt: Date.now(),
            });
            await this.client.expire(key, 3600); // 1 hour TTL
            logger.debug(`Updated progress for job ${jobId}: ${progress}%`);
        } catch (error) {
            logger.error(`Failed to update progress for ${jobId}:`, error);
            throw error;
        }
    }

    async healthCheck() {
        return this.ping();
    }
}

// Export singleton instance
module.exports = new RedisClient();
