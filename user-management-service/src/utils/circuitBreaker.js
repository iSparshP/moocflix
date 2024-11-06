const CircuitBreaker = require('opossum');
const logger = require('./logger');

/**
 * Creates a circuit breaker instance with default or custom options
 * @param {Function} asyncFunction - The async function to protect
 * @param {Object} options - Circuit breaker configuration options
 * @returns {CircuitBreaker} Configured circuit breaker instance
 */
const createBreaker = (asyncFunction, options = {}) => {
    const defaultOptions = {
        timeout: 3000, // Time in milliseconds to wait for function execution
        errorThresholdPercentage: 50, // Error percentage to trip circuit
        resetTimeout: 30000, // Time to wait before attempting reset
        volumeThreshold: 10, // Minimum executions before error percentage calculation
        errorFilter: (error) => {
            // Don't count 4xx errors as failures
            return error.statusCode >= 500;
        },
    };

    const breaker = new CircuitBreaker(asyncFunction, {
        ...defaultOptions,
        ...options,
    });

    // Event handlers
    breaker.on('open', () => {
        logger.warn('Circuit Breaker opened', {
            name: asyncFunction.name || 'anonymous',
            failures: breaker.stats.failures,
            successes: breaker.stats.successes,
        });
    });

    breaker.on('halfOpen', () => {
        logger.info('Circuit Breaker half-open', {
            name: asyncFunction.name || 'anonymous',
        });
    });

    breaker.on('close', () => {
        logger.info('Circuit Breaker closed', {
            name: asyncFunction.name || 'anonymous',
        });
    });

    breaker.on('reject', () => {
        logger.warn('Circuit Breaker rejected request', {
            name: asyncFunction.name || 'anonymous',
            state: breaker.state,
        });
    });

    breaker.on('timeout', () => {
        logger.error('Circuit Breaker timeout', {
            name: asyncFunction.name || 'anonymous',
            timeout: breaker.options.timeout,
        });
    });

    breaker.fallback(() => {
        logger.error('Circuit Breaker fallback triggered', {
            name: asyncFunction.name || 'anonymous',
        });
        throw new Error('Service temporarily unavailable');
    });

    return breaker;
};

module.exports = {
    createBreaker,
};
