const Redis = require('ioredis');
const logger = require('./logger');

class CacheManager {
    constructor() {
        this.client = new Redis(process.env.REDIS_URL);
        this.defaultTTL = 3600; // 1 hour
    }

    async get(key) {
        try {
            const value = await this.client.get(key);
            return value ? JSON.parse(value) : null;
        } catch (error) {
            logger.error('Cache get error', { key, error: error.message });
            return null;
        }
    }

    async set(key, value, ttl = this.defaultTTL) {
        try {
            await this.client.setex(key, ttl, JSON.stringify(value));
        } catch (error) {
            logger.error('Cache set error', { key, error: error.message });
        }
    }
}

module.exports = new CacheManager();
