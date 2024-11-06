const axios = require('axios');
const logger = require('../utils/logger');
const { createBreaker } = require('../utils/circuitBreaker');
const { retryOperation } = require('../utils/retryHandler');
const { AppError } = require('../utils/errorUtils');
const serviceRegistry = require('../utils/serviceDiscovery');

class NotificationService {
    constructor() {
        this.serviceName = 'notification';
        this.isExternalMode = false;
        this.initialize();
    }

    async initialize() {
        try {
            // Try to initialize with external service
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
            this.isExternalMode = true;
            logger.info('NotificationService initialized in external mode', {
                baseURL: this.baseURL,
            });
        } catch (error) {
            // Fallback to local mode
            logger.warn('NotificationService falling back to local mode', {
                error: error.message,
            });
            this.isExternalMode = false;
        }
    }

    async sendNotification(type, recipient, data) {
        if (this.isExternalMode) {
            return this._sendExternalNotification(type, recipient, data);
        } else {
            return this._sendLocalNotification(type, recipient, data);
        }
    }

    async _sendLocalNotification(type, recipient, data) {
        try {
            // Log the notification details
            logger.info('Sending notification (local mode)', {
                type,
                recipient,
                data,
            });
            return { success: true, mode: 'local' };
        } catch (error) {
            logger.error('Failed to send local notification', {
                type,
                recipient,
                error: error.message,
            });
            throw new AppError('Failed to send notification', 500);
        }
    }

    async _sendExternalNotification(type, recipient, data) {
        const breaker = createBreaker(async () => {
            try {
                const response = await retryOperation(() =>
                    this.axios.post('/notifications/send', {
                        type,
                        recipient,
                        data,
                        timestamp: new Date().toISOString(),
                    })
                );
                logger.info('External notification sent successfully', {
                    type,
                    recipient,
                });
                return response.data;
            } catch (error) {
                logger.error('Failed to send external notification', {
                    type,
                    recipient,
                    error: error.message,
                });
                throw new AppError(
                    `Failed to send notification: ${error.message}`,
                    500
                );
            }
        });

        return await breaker.fire();
    }

    // Wrapper methods for specific notification types
    async sendWelcomeEmail(email) {
        return this.sendNotification('welcome', email, {
            template: 'welcome',
            timestamp: new Date().toISOString(),
        });
    }

    async sendPasswordResetEmail(email, resetUrl) {
        return this.sendNotification('password-reset', email, {
            template: 'password-reset',
            resetUrl,
            timestamp: new Date().toISOString(),
        });
    }

    async sendVerificationEmail(email, verificationUrl) {
        return this.sendNotification('email-verification', email, {
            template: 'email-verification',
            verificationUrl,
            timestamp: new Date().toISOString(),
        });
    }

    async sendPasswordChangeConfirmation(email) {
        return this.sendNotification('password-change', email, {
            template: 'password-change',
            timestamp: new Date().toISOString(),
        });
    }
}

// Export singleton instance
module.exports = new NotificationService();
