const axios = require('axios');
const logger = require('../utils/logger');
const { createBreaker } = require('../utils/circuitBreaker');
const { retryOperation } = require('../utils/retryHandler');
const { AppError } = require('../utils/errorUtils');
const serviceRegistry = require('../utils/serviceDiscovery');

class NotificationService {
    constructor() {
        this.serviceName = 'notification';
        this.initialize();
    }

    async initialize() {
        try {
            this.baseURL = await serviceRegistry.getServiceUrl(
                this.serviceName
            );
            this.axios = axios.create({
                baseURL: this.baseURL,
                timeout: 5000,
                headers: {
                    'Content-Type': 'application/json',
                },
            });
            logger.info('NotificationService initialized', {
                baseURL: this.baseURL,
            });
        } catch (error) {
            logger.error('Failed to initialize NotificationService', {
                error: error.message,
            });
            throw new AppError(
                `Service initialization failed: ${error.message}`,
                500
            );
        }
    }

    /**
     * Send welcome email to new users
     * @param {string} email - User's email address
     * @returns {Promise<Object>} Response from notification service
     */
    async sendWelcomeEmail(email) {
        const breaker = createBreaker(async () => {
            try {
                const response = await retryOperation(() =>
                    this.axios.post('/notifications/welcome', {
                        email,
                        template: 'welcome',
                        timestamp: new Date().toISOString(),
                    })
                );
                logger.info('Welcome email sent successfully', { email });
                return response.data;
            } catch (error) {
                logger.error('Failed to send welcome email', {
                    email,
                    error: error.message,
                });
                throw new AppError(
                    `Failed to send welcome email: ${error.message}`,
                    500
                );
            }
        });

        return await breaker.fire();
    }

    /**
     * Send profile update notification
     * @param {string} email - User's email address
     * @returns {Promise<Object>} Response from notification service
     */
    async sendProfileUpdateAlert(email) {
        const breaker = createBreaker(async () => {
            try {
                const response = await retryOperation(() =>
                    this.axios.post('/notifications/profile-update', {
                        email,
                        template: 'profile-update',
                        timestamp: new Date().toISOString(),
                    })
                );
                logger.info('Profile update notification sent', { email });
                return response.data;
            } catch (error) {
                logger.error('Failed to send profile update notification', {
                    email,
                    error: error.message,
                });
                throw new AppError(
                    `Failed to send profile update notification: ${error.message}`,
                    500
                );
            }
        });

        return await breaker.fire();
    }
}

// Export singleton instance
module.exports = new NotificationService();
