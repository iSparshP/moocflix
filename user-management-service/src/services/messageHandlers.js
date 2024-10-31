const logger = require('../utils/logger');
const notificationService = require('./notificationService');
const courseService = require('./courseService');
const { validateEventMessage } = require('../config/eventSchemas');
const { AppError } = require('../utils/errorUtils');
const { createBreaker } = require('../utils/circuitBreaker');
const { retryOperation } = require('../utils/retryHandler');

// Enhanced message validators with error messages
const messageValidators = {
    'User-Creation': (message) => {
        const requiredFields = ['userId', 'email', 'role', 'timestamp'];
        const missingFields = requiredFields.filter((field) => !message[field]);
        if (missingFields.length > 0) {
            throw new AppError(
                `Missing required fields: ${missingFields.join(', ')}`,
                400
            );
        }
        return true;
    },
    'User-Update': (message) => {
        const requiredFields = ['userId', 'email', 'role', 'timestamp'];
        const missingFields = requiredFields.filter((field) => !message[field]);
        if (missingFields.length > 0) {
            throw new AppError(
                `Missing required fields: ${missingFields.join(', ')}`,
                400
            );
        }
        return true;
    },
};

const handleUserCreation = async (message) => {
    try {
        // Schema validation with event schemas
        await validateEventMessage('User-Creation', message);
        messageValidators['User-Creation'](message);

        // Send welcome notification with circuit breaker and retry
        const notificationBreaker = createBreaker(() =>
            retryOperation(() =>
                notificationService.sendWelcomeEmail(message.email)
            )
        );
        await notificationBreaker.fire();

        // Course enrollment integration for students
        if (message.role === 'student') {
            const enrollmentBreaker = createBreaker(() =>
                retryOperation(() =>
                    courseService.initializeEnrollment(message.userId)
                )
            );
            await enrollmentBreaker.fire();
        }

        logger.info('User creation processed successfully', {
            userId: message.userId,
            notifications: 'sent',
            enrollment: message.role === 'student' ? 'initialized' : 'skipped',
            timestamp: message.timestamp,
        });

        return true;
    } catch (error) {
        logger.error('Failed to process user creation', {
            error: error.message,
            userId: message.userId,
            stack: error.stack,
        });
        throw new AppError(
            `User creation processing failed: ${error.message}`,
            500
        );
    }
};

const handleUserUpdate = async (message) => {
    try {
        // Schema validation with event schemas
        await validateEventMessage('User-Update', message);
        messageValidators['User-Update'](message);

        // Send profile update notification with circuit breaker and retry
        const notificationBreaker = createBreaker(() =>
            retryOperation(() =>
                notificationService.sendProfileUpdateAlert(message.email)
            )
        );
        await notificationBreaker.fire();

        logger.info('User update processed successfully', {
            userId: message.userId,
            notifications: 'sent',
            timestamp: message.timestamp,
        });

        return true;
    } catch (error) {
        logger.error('Failed to process user update', {
            error: error.message,
            userId: message.userId,
            stack: error.stack,
        });
        throw new AppError(
            `User update processing failed: ${error.message}`,
            500
        );
    }
};

module.exports = {
    handleUserCreation,
    handleUserUpdate,
    messageValidators,
};
