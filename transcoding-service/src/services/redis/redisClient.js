const Redis = require('ioredis');
const config = require('../../config/environment');
const logger = require('../../utils/logger');

class RedisClient {
    constructor() {
        this.client = new Redis({
            url: config.redis.url,
            password: config.redis.password,
            tls: config.redis.tls,
            db: parseInt(config.redis.database),
            retryStrategy: (times) => {
                const delay = Math.min(times * 50, 2000);
                return delay;
            },
            maxRetriesPerRequest: 3,
        });

        this.client.on('error', (error) => {
            logger.error('Redis Client Error:', error);
        });

        this.client.on('connect', () => {
            logger.info('Connected to Redis');
        });
    }

    async ping() {
        try {
            await this.client.ping();
            return true;
        } catch (error) {
            logger.error('Redis ping failed:', error);
            return false;
        }
    }

    async quit() {
        await this.client.quit();
        logger.info('Disconnected from Redis');
    }

    async saveJobState(jobId, state) {
        const key = `job:${jobId}`;
        await this.client.hset(key, {
            ...state,
            updatedAt: Date.now(),
        });
        await this.client.expire(key, 86400);
    }

    async getJobState(jobId) {
        const key = `job:${jobId}`;
        return this.client.hgetall(key);
    }

    async addActiveJob(jobId) {
        await this.client.sadd('active_jobs', jobId);
    }

    async removeActiveJob(jobId) {
        await this.client.srem('active_jobs', jobId);
    }

    async updateProgress(jobId, progress) {
        const key = `progress:${jobId}`;
        await this.client.set(key, progress);
        await this.client.expire(key, 3600);
    }

    async getProgress(jobId) {
        const key = `progress:${jobId}`;
        return this.client.get(key);
    }

    // Add rate limiting methods
    async checkRateLimit(clientId, limit, window) {
        const key = `ratelimit:${clientId}`;
        const current = await this.client.incr(key);

        if (current === 1) {
            await this.client.expire(key, window);
        }

        return current <= limit;
    }

    // Add metrics methods
    async storeMetrics(videoId, metrics) {
        const key = `metrics:${videoId}`;
        await this.client.hset(key, {
            ...metrics,
            timestamp: Date.now(),
        });
        // Keep metrics for 7 days
        await this.client.expire(key, 604800);
    }

    async getMetrics(videoId) {
        const key = `metrics:${videoId}`;
        return this.client.hgetall(key);
    }

    async getRecentMetrics(limit = 100) {
        const keys = await this.client.keys('metrics:*');
        const recent = keys.slice(-limit);

        return Promise.all(
            recent.map(async (key) => ({
                videoId: key.split(':')[1],
                metrics: await this.client.hgetall(key),
            }))
        );
    }

    // Add distributed locking methods
    async acquireLock(resource, ttl = 30000) {
        const token = Math.random().toString(36);
        const acquired = await this.client.set(
            `lock:${resource}`,
            token,
            'PX',
            ttl,
            'NX'
        );

        return acquired ? token : null;
    }

    async releaseLock(resource, token) {
        const script = `
            if redis.call("get", KEYS[1]) == ARGV[1] then
                return redis.call("del", KEYS[1])
            else
                return 0
            end
        `;

        return this.client.eval(script, 1, `lock:${resource}`, token);
    }
}

module.exports = new RedisClient();
