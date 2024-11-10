const { logger } = require('../config/logger');

class RetryUtils {
    static async withRetry(fn, options = {}) {
        const {
            maxAttempts = 3,
            delay = 1000,
            backoff = 2,
            shouldRetry = () => true,
        } = options;

        let lastError;
        for (let attempt = 1; attempt <= maxAttempts; attempt++) {
            try {
                return await fn();
            } catch (error) {
                lastError = error;
                if (attempt === maxAttempts || !shouldRetry(error)) throw error;

                const waitTime = delay * Math.pow(backoff, attempt - 1);
                logger.warn(
                    `Retry attempt ${attempt}/${maxAttempts} after ${waitTime}ms`,
                    {
                        error: error.message,
                        attempt,
                        waitTime,
                    }
                );

                await new Promise((resolve) => setTimeout(resolve, waitTime));
            }
        }
        throw lastError;
    }
}

module.exports = RetryUtils;
