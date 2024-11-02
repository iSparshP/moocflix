// src/middlewares/rateLimiter.js
const rateLimit = require('express-rate-limit');
const logger = require('../utils/logger');

const defaultLimiter = rateLimit({
    windowMs: process.env.RATE_LIMIT_WINDOW_MS || 15 * 60 * 1000, // 15 minutes default
    max: process.env.RATE_LIMIT_MAX_REQUESTS || 100, // default limit
    message: {
        status: 'error',
        code: 'RATE_LIMIT_EXCEEDED',
        message: 'Too many requests, please try again later',
    },
    standardHeaders: true, // Return rate limit info in RateLimit-* headers
    legacyHeaders: false, // Disable X-RateLimit-* headers
    handler: (req, res) => {
        logger.warn('Rate limit exceeded:', {
            path: req.path,
            method: req.method,
            ip: req.ip,
        });
        res.status(429).json({
            status: 'error',
            code: 'RATE_LIMIT_EXCEEDED',
            message: 'Too many requests, please try again later',
        });
    },
});

// Higher limits for health checks
const healthCheckLimiter = rateLimit({
    windowMs: 1 * 60 * 1000, // 1 minute
    max: 60, // 1 request per second
});

module.exports = {
    defaultLimiter,
    healthCheckLimiter,
};
