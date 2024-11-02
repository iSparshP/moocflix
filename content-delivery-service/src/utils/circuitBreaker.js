const CircuitBreaker = require('opossum');

const defaultOptions = {
    timeout: 3000, // Time in ms before request is considered failed
    errorThresholdPercentage: 50, // Error rate % at which to open circuit
    resetTimeout: 30000, // Time in ms to wait before attempting reset
    volumeThreshold: 10, // Minimum requests needed before tripping circuit
};

const breakers = new Map();

function createBreaker(name, fn, options = {}) {
    const breaker = new CircuitBreaker(fn, {
        ...defaultOptions,
        ...options,
        name,
    });

    // Add event listeners
    breaker.on('open', () => {
        console.warn(`Circuit Breaker '${name}' is now OPEN`);
    });

    breaker.on('halfOpen', () => {
        console.info(`Circuit Breaker '${name}' is now HALF-OPEN`);
    });

    breaker.on('close', () => {
        console.info(`Circuit Breaker '${name}' is now CLOSED`);
    });

    breaker.on('reject', () => {
        console.warn(`Circuit Breaker '${name}' rejected the request`);
    });

    breakers.set(name, breaker);
    return breaker;
}

function getBreaker(name) {
    return breakers.get(name);
}

module.exports = {
    createBreaker,
    getBreaker,
};
