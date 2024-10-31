const CircuitBreaker = require('opossum');
const logger = require('../utils/logger');

/**
 * Default circuit breaker configuration
 * @type {Object}
 */
const defaultOptions = {
    timeout: 3000, // Time in ms before a request is considered failed
    errorThresholdPercentage: 50, // Percentage of failures before opening circuit
    resetTimeout: 30000, // Time in ms to wait before attempting to close circuit
    volumeThreshold: 10, // Minimum number of requests before tripping circuit
    rollingCountTimeout: 10000, // Time window in ms for error rate calculation
};

/**
 * Creates a circuit breaker instance with event logging
 * @param {Function} fn - Function to wrap with circuit breaker
 * @param {Object} options - Circuit breaker options
 * @returns {CircuitBreaker} Configured circuit breaker instance
 */
const createBreaker = (fn, options = {}) => {
    const breaker = new CircuitBreaker(fn, { ...defaultOptions, ...options });

    // Add event logging
    breaker.on('open', () => {
        logger.warn('Circuit breaker opened', { name: fn.name });
    });

    breaker.on('halfOpen', () => {
        logger.info('Circuit breaker half-opened', { name: fn.name });
    });

    breaker.on('close', () => {
        logger.info('Circuit breaker closed', { name: fn.name });
    });

    breaker.on('reject', () => {
        logger.error('Circuit breaker rejected request', { name: fn.name });
    });

    breaker.fallback(() => {
        const error = new Error('Service unavailable');
        error.statusCode = 503;
        throw error;
    });

    return breaker;
};

module.exports = { createBreaker };
