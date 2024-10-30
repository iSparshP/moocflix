const winston = require('winston');
const logger = winston.createLogger({
    level: 'info',
    format: winston.format.json(),
    transports: [new winston.transports.File({ filename: 'kafka-events.log' })],
});

const messageValidators = {
    'User-Creation': (message) => {
        return (
            message.userId && message.email && message.role && message.timestamp
        );
    },
    'User-Update': (message) => {
        return (
            message.userId && message.email && message.role && message.timestamp
        );
    },
};

const handleUserCreation = async (message) => {
    try {
        if (!messageValidators['User-Creation'](message)) {
            throw new Error('Invalid message format for User-Creation');
        }

        // Send welcome notification
        await notificationService.sendWelcomeEmail(message.email);

        // Course enrollment integration
        if (message.role === 'student') {
            await courseService.initializeEnrollment(message.userId);
        }

        logger.info('User creation processed successfully', {
            userId: message.userId,
            notifications: 'sent',
            enrollment: 'initialized',
        });

        return true;
    } catch (error) {
        logger.error('Failed to process user creation', { error });
        throw error;
    }
};

const handleUserUpdate = async (message) => {
    try {
        if (!messageValidators['User-Update'](message)) {
            throw new Error('Invalid message format for User-Update');
        }

        // Send profile update notification
        await notificationService.sendProfileUpdateAlert(message.email);

        logger.info('User update processed successfully', {
            userId: message.userId,
            notifications: 'sent',
        });

        return true;
    } catch (error) {
        logger.error('Failed to process user update', { error });
        throw error;
    }
};

module.exports = {
    handleUserCreation,
    handleUserUpdate,
    messageValidators,
};
