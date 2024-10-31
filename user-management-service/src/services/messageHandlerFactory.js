// src/services/messageHandlerFactory.js
const { AppError } = require('../utils/errorUtils');
const logger = require('../utils/logger');
const { validateEventMessage } = require('../config/eventSchemas');
const { createBreaker } = require('../utils/circuitBreaker');

/**
 * @typedef {Object} HandlerConfig
 * @property {Function} handler - The message handler function
 * @property {boolean} [useCircuitBreaker=false] - Whether to use circuit breaker
 * @property {boolean} [validateMessage=true] - Whether to validate messages
 */

/**
 * @type {Object.<string, HandlerConfig>}
 */
const handlers = new Map();

class HandlerNotFoundError extends AppError {
    constructor(topic) {
        super(`No handler found for topic: ${topic}`, 404);
    }
}

/**
 * Register a new message handler
 * @param {string} topic - Kafka topic
 * @param {Function} handler - Message handler function
 * @param {Object} options - Handler configuration
 */
const registerHandler = (topic, handler, options = {}) => {
    const config = {
        handler,
        useCircuitBreaker: options.useCircuitBreaker ?? false,
        validateMessage: options.validateMessage ?? true,
    };

    handlers.set(topic, config);
    logger.info(`Handler registered for topic: ${topic}`);
};

/**
 * Get handler with middleware pipeline
 * @param {string} topic - Kafka topic
 * @returns {Function} Handler with middleware
 */
const getHandler = (topic) => {
    const config = handlers.get(topic);

    if (!config) {
        throw new HandlerNotFoundError(topic);
    }

    // Create handler pipeline
    return async (message) => {
        try {
            // Validate message if enabled
            if (config.validateMessage) {
                await validateEventMessage(topic, message);
            }

            // Wrap with circuit breaker if enabled
            const handler = config.useCircuitBreaker
                ? createBreaker(config.handler)
                : config.handler;

            // Execute handler
            const result = await handler(message);

            logger.info(`Message processed for topic: ${topic}`, {
                messageId: message.id,
                success: true,
            });

            return result;
        } catch (error) {
            logger.error(`Error processing message for topic: ${topic}`, {
                messageId: message.id,
                error: error.message,
                stack: error.stack,
            });
            throw error;
        }
    };
};

// Register default handlers
registerHandler('User-Creation', handleUserCreation, {
    useCircuitBreaker: true,
});
registerHandler('User-Update', handleUserUpdate, {
    useCircuitBreaker: true,
});

module.exports = {
    getHandler,
    registerHandler,
    HandlerNotFoundError,
};
