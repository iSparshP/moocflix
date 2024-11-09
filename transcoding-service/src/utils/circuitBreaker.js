// src/utils/circuitBreaker.js
const CircuitBreaker = require('opossum');
const logger = require('./logger');

const breakerOptions = {
    timeout: 30000, // 30 sec timeout
    errorThresholdPercentage: 50,
    resetTimeout: 30000,
    maxFailures: 3,
};

class TranscodingCircuitBreaker {
    constructor() {
        this.breakers = new Map();
    }

    create(name, fn) {
        if (typeof fn !== 'function') {
            throw new Error('Circuit breaker requires a function to execute');
        }

        const breaker = new CircuitBreaker(fn, {
            ...breakerOptions,
            name: name,
        });

        breaker.fallback((error) => {
            logger.warn(`Circuit ${name} fallback triggered`, { error });
            throw new ResourceError('Service temporarily unavailable');
        });

        breaker.on('success', () => {
            logger.info(`Circuit ${name} success`);
        });

        breaker.on('failure', (error) => {
            logger.error(`Circuit ${name} failed`, { error });
        });

        breaker.on('timeout', () => {
            logger.warn(`Circuit ${name} timeout`);
        });

        breaker.on('reject', () => {
            logger.warn(`Circuit ${name} rejected`);
        });

        this.breakers.set(name, breaker);
        return breaker;
    }

    get(name) {
        const breaker = this.breakers.get(name);
        if (!breaker) {
            throw new Error(`Circuit breaker ${name} not found`);
        }
        return breaker;
    }
}

module.exports = new TranscodingCircuitBreaker();
