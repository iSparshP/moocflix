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
        const breaker = new CircuitBreaker(fn, breakerOptions);

        breaker.fallback(() => {
            logger.warn(`Circuit ${name} fallback triggered`);
            return { error: 'Service temporarily unavailable' };
        });

        breaker.on('success', () => {
            logger.info(`Circuit ${name} success`);
        });

        breaker.on('failure', (error) => {
            logger.error(`Circuit ${name} failed`, { error });
        });

        this.breakers.set(name, breaker);
        return breaker;
    }

    get(name) {
        return this.breakers.get(name);
    }
}

module.exports = new TranscodingCircuitBreaker();
