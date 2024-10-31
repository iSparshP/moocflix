// src/utils/retryHandler.js
const logger = require('../utils/logger');

/**
 * Retries an operation with exponential backoff
 * @param {Function} operation - Operation to retry
 * @param {Object} options - Retry options
 * @param {number} options.maxRetries - Maximum number of retry attempts (default: 3)
 * @param {number} options.baseDelay - Base delay in ms (default: 1000)
 * @param {number} options.maxDelay - Maximum delay in ms (default: 10000)
 * @returns {Promise<any>} Operation result
 * @throws {Error} Last error encountered
 */
const retryOperation = async (operation, options = {}) => {
    const { maxRetries = 3, baseDelay = 1000, maxDelay = 10000 } = options;

    let lastError;

    for (let i = 0; i < maxRetries; i++) {
        try {
            const result = await operation();
            if (i > 0) {
                logger.info('Operation succeeded after retry', {
                    attempt: i + 1,
                    maxRetries,
                });
            }
            return result;
        } catch (error) {
            lastError = error;
            if (i === maxRetries - 1) {
                logger.error('Operation failed after max retries', {
                    error: error.message,
                    maxRetries,
                });
                break;
            }

            const delay = Math.min(baseDelay * Math.pow(2, i), maxDelay);
            logger.warn('Operation failed, retrying', {
                attempt: i + 1,
                maxRetries,
                delay,
                error: error.message,
            });

            await new Promise((resolve) => setTimeout(resolve, delay));
        }
    }

    throw lastError;
};

module.exports = { retryOperation };
