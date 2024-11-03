const rateLimit = require('express-rate-limit');
const { logger } = require('../config/logger');

// Helper to create a limiter with logging
const createLimiter = (options) => {
    return rateLimit({
        windowMs: options.windowMs,
        max: options.max,
        message: options.message,
        standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
        legacyHeaders: false, // Disable the `X-RateLimit-*` headers
        handler: (req, res) => {
            logger.warn('Rate limit exceeded', {
                ip: req.ip,
                endpoint: req.originalUrl,
                method: req.method,
                limit: options.max,
                windowMs: options.windowMs,
            });
            res.status(429).json({
                status: 'error',
                message:
                    options.message ||
                    'Too many requests, please try again later.',
                code: 'RateLimitExceeded',
            });
        },
    });
};

// General API limiter (more lenient)
const apiLimiter = createLimiter({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // 100 requests per windowMs
    message:
        'Too many requests from this IP, please try again after 15 minutes',
});

// Stricter limiter for write operations
const writeLimiter = createLimiter({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 30, // 30 requests per windowMs
    message: 'Too many write operations, please try again after 15 minutes',
});

// Very strict limiter for sensitive operations
const sensitiveOpLimiter = createLimiter({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 10, // 10 requests per windowMs
    message: 'Too many sensitive operations, please try again after 1 hour',
});

// Submission-specific limiter (existing one)
const submissionLimiter = createLimiter({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // 5 submissions per windowMs
    message: 'Too many submission attempts, please try again after 15 minutes',
});

// Health check limiter (more permissive)
const healthCheckLimiter = createLimiter({
    windowMs: 1 * 60 * 1000, // 1 minute
    max: 30, // 30 requests per minute
    message: 'Too many health check requests, please try again after 1 minute',
});

module.exports = {
    apiLimiter,
    writeLimiter,
    sensitiveOpLimiter,
    submissionLimiter,
    healthCheckLimiter,
};
