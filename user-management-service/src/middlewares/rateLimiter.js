const rateLimit = require('express-rate-limit');
const Redis = require('ioredis');
const logger = require('../utils/logger');
const redisManager = require('../utils/redis');

const createRateLimiter = (options = {}) => {
    let limiterOptions = {
        windowMs: options.windowMs || 15 * 60 * 1000, // 15 minutes default
        max: options.max || 100, // limit each IP to 100 requests per windowMs
        message: {
            status: 'error',
            message: 'Too many requests, please try again later',
        },
        standardHeaders: true,
        legacyHeaders: false,
        handler: (req, res) => {
            logger.warn('Rate limit exceeded', {
                ip: req.ip,
                path: req.path,
            });
            res.status(429).json({
                status: 'error',
                message: 'Too many requests, please try again later',
            });
        },
    };

    try {
        const redis = redisManager.getClient();

        // Use Redis as store if available
        limiterOptions.store = {
            incr: (key) => {
                return redis
                    .multi()
                    .incr(key)
                    .pexpire(key, options.windowMs)
                    .exec()
                    .then(([[err, count]]) => {
                        if (err) throw err;
                        return count;
                    });
            },
            decrement: (key) => {
                return redis.decrby(key, 1);
            },
            resetKey: (key) => {
                return redis.del(key);
            },
        };

        logger.info('Rate limiter initialized with Redis store');
    } catch (error) {
        logger.warn(
            'Failed to initialize Redis store for rate limiting, falling back to memory store',
            {
                error: error.message,
            }
        );
        // Memory store is used by default if no store is specified
    }

    return rateLimit(limiterOptions);
};

module.exports = {
    authLimiter: createRateLimiter({ windowMs: 15 * 60 * 1000, max: 5 }),
    apiLimiter: createRateLimiter({ windowMs: 15 * 60 * 1000, max: 100 }),
    profileUpdateLimiter: createRateLimiter({
        windowMs: 60 * 60 * 1000,
        max: 10,
    }),
};
