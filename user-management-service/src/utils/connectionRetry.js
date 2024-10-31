const logger = require('../utils/logger');
const { AppError } = require('../utils/errorUtils');

/**
 * Retries a connection operation with exponential backoff
 * @param {Function} connect - Connection function to retry
 * @param {Object} options - Retry configuration options
 * @param {number} options.maxRetries - Maximum number of retry attempts (default: 5)
 * @param {number} options.initialDelay - Initial delay in ms (default: 5000)
 * @param {number} options.maxDelay - Maximum delay in ms (default: 30000)
 * @returns {Promise<boolean>} True if connection successful
 * @throws {AppError} If connection fails after all retries
 */
const retryConnection = async (connect, options = {}) => {
    const { maxRetries = 5, initialDelay = 5000, maxDelay = 30000 } = options;

    for (let i = 0; i < maxRetries; i++) {
        try {
            await connect();
            logger.info('Connection established successfully');
            return true;
        } catch (error) {
            const isLastAttempt = i === maxRetries - 1;
            if (isLastAttempt) {
                logger.error('Connection failed after all retries', {
                    error: error.message,
                    attempts: maxRetries,
                });
                throw new AppError(`Connection failed: ${error.message}`, 500);
            }

            const delay = Math.min(initialDelay * Math.pow(2, i), maxDelay);
            logger.warn(
                `Connection attempt ${i + 1} failed, retrying in ${delay}ms`,
                {
                    error: error.message,
                }
            );

            await new Promise((resolve) => setTimeout(resolve, delay));
        }
    }
};

module.exports = { retryConnection };
