const { AppError } = require('../utils/errorUtils');
const logger = require('../utils/logger');
const schemas = require('../config/eventSchemas');

const validateEvent = (topic) => {
    return (message) => {
        try {
            // Check schema existence
            const schema = schemas[topic];
            if (!schema) {
                throw new AppError(`No schema found for topic: ${topic}`, 400);
            }

            // Validate message
            const { error, value } = schema.validate(message, {
                abortEarly: false,
                stripUnknown: true,
                presence: 'required',
            });

            if (error) {
                const details = error.details.map((d) => d.message).join(', ');
                logger.error('Event validation failed', {
                    topic,
                    errors: details,
                    message,
                });
                throw new AppError(`Invalid message format: ${details}`, 400);
            }

            logger.debug('Event validation successful', { topic });
            return value; // Return normalized message
        } catch (err) {
            if (err instanceof AppError) throw err;
            throw new AppError(err.message, 500);
        }
    };
};

module.exports = { validateEvent };
