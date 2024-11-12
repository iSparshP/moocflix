const Redis = require('ioredis');
const config = require('../config/config');
const logger = require('../utils/logger');

class CacheService {
    constructor() {
        this.redis = new Redis(config.redis.url, {
            ...config.redis.options,
            lazyConnect: true, // Only connect when needed
            autoResubscribe: true, // Automatically handle reconnections
            maxRetriesPerRequest: 3,
            retryStrategy(times) {
                const delay = Math.min(times * 50, 2000);
                logger.warn(
                    `Redis retry attempt ${times} with delay ${delay}ms`
                );
                return delay;
            },
            reconnectOnError(err) {
                logger.error('Redis connection error:', err);
                const targetError = 'READONLY';
                if (err.message.includes(targetError)) {
                    // Only reconnect when the error contains "READONLY"
                    return true;
                }
                return false;
            },
        });

        this.redis.on('error', (error) => {
            logger.error('Redis connection error:', error);
        });

        this.redis.on('connect', () => {
            logger.info('Redis client connected');
        });

        this.redis.on('ready', () => {
            logger.info('Redis client ready');
        });

        this.redis.on('close', () => {
            logger.warn('Redis connection closed');
        });

        this.redis.on('reconnecting', () => {
            logger.info('Redis client reconnecting');
        });

        this.defaultTTL = config.redis.ttl;
    }

    async connect() {
        try {
            await this.redis.connect();
            logger.info('Connected to Redis');
        } catch (error) {
            logger.error('Failed to connect to Redis:', error);
            throw error;
        }
    }

    async get(key) {
        try {
            const data = await this.redis.get(key);
            return data ? JSON.parse(data) : null;
        } catch (error) {
            logger.error(`Cache get error for key ${key}:`, error);
            return null;
        }
    }

    async set(key, value, ttl = this.defaultTTL) {
        try {
            await this.redis.set(key, JSON.stringify(value), 'EX', ttl);
        } catch (error) {
            logger.error(`Cache set error for key ${key}:`, error);
        }
    }

    async del(key) {
        try {
            await this.redis.del(key);
        } catch (error) {
            logger.error(`Cache delete error for key ${key}:`, error);
        }
    }

    async healthCheck() {
        try {
            await this.redis.ping();
            return true;
        } catch (error) {
            logger.error('Redis health check failed:', error);
            return false;
        }
    }

    generateVideoKey(videoId) {
        return `video:${videoId}:metadata`;
    }

    async quit() {
        try {
            await this.redis.quit();
            logger.info('Redis connection closed gracefully');
        } catch (error) {
            logger.error('Error closing Redis connection:', error);
            throw error;
        }
    }
}

module.exports = new CacheService();
