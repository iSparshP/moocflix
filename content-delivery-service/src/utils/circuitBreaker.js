const CircuitBreaker = require('opossum');

const defaultOptions = {
    timeout: 3000, // Time in milliseconds to wait for action to complete
    errorThresholdPercentage: 50, // Error percentage at which to open circuit
    resetTimeout: 30000, // Time in milliseconds to wait before testing circuit
    rollingCountTimeout: 10000, // Sets the duration of the statistical rolling window
    volumeThreshold: 10, // Minimum number of requests within the rolling window
};

const breakers = new Map();

const createBreaker = (action, name, options = {}) => {
    if (typeof action !== 'function') {
        throw new Error(
            `Circuit breaker '${name}' requires a function as an action`
        );
    }

    const breaker = new CircuitBreaker(action, {
        ...defaultOptions,
        ...options,
        name,
    });

    breakers.set(name, breaker);
    return breaker;
};

const getBreaker = (name) => {
    return breakers.get(name);
};

const getAllBreakers = () => {
    return Array.from(breakers.values());
};

module.exports = {
    createBreaker,
    getBreaker,
    getAllBreakers,
};
