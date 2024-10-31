// src/utils/serviceDiscovery.js
const axios = require('axios');
const logger = require('./logger');
const { AppError } = require('./errorUtils');
const { retryOperation } = require('./retryHandler');

const serviceRegistry = {
    // Cache for service URLs
    urlCache: new Map(),
    cacheTimeout: 5 * 60 * 1000, // 5 minutes

    /**
     * Get service URL with caching
     * @param {string} serviceName - Name of the service
     * @returns {Promise<string>} Service URL
     * @throws {AppError} If service URL not found or invalid
     */
    async getServiceUrl(serviceName) {
        try {
            // Check cache first
            const cached = this.urlCache.get(serviceName);
            if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
                return cached.url;
            }

            const url = process.env[`${serviceName.toUpperCase()}_SERVICE_URL`];
            if (!url) {
                throw new AppError(
                    `Service URL not found for: ${serviceName}`,
                    404
                );
            }

            // Validate URL before caching
            await this.validateServiceUrl(url);

            // Cache the valid URL
            this.urlCache.set(serviceName, {
                url,
                timestamp: Date.now(),
            });

            logger.info('Service URL retrieved', { serviceName, url });
            return url;
        } catch (error) {
            logger.error('Failed to get service URL', {
                serviceName,
                error: error.message,
            });
            throw new AppError(
                `Service discovery failed: ${error.message}`,
                500
            );
        }
    },

    /**
     * Validate service URL with retries
     * @param {string} url - Service URL to validate
     * @returns {Promise<boolean>} True if valid
     */
    async validateServiceUrl(url) {
        return await retryOperation(
            async () => {
                try {
                    const response = await axios.head(url, { timeout: 5000 });
                    const isValid = response.status === 200;

                    if (!isValid) {
                        throw new Error(
                            `Invalid service response: ${response.status}`
                        );
                    }

                    logger.debug('Service URL validated', { url });
                    return true;
                } catch (error) {
                    logger.error('Service URL validation failed', {
                        url,
                        error: error.message,
                    });
                    throw new AppError(
                        `Invalid service URL: ${error.message}`,
                        500
                    );
                }
            },
            { maxRetries: 3, baseDelay: 1000, maxDelay: 5000 }
        );
    },

    /**
     * Clear URL cache for a service
     * @param {string} serviceName - Name of service to clear
     */
    clearCache(serviceName) {
        if (serviceName) {
            this.urlCache.delete(serviceName);
            logger.debug('Cleared service URL cache', { serviceName });
        } else {
            this.urlCache.clear();
            logger.debug('Cleared all service URL caches');
        }
    },
};

module.exports = serviceRegistry;
