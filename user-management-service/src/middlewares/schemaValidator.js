const Joi = require('joi');

/**
 * Validates Kafka message schemas before processing
 * @param {Object} schema - Joi schema for validation
 * @returns {Function} Middleware function
 */
const validateSchema = (schema) => {
    return (message) => {
        const { error, value } = schema.validate(message, {
            abortEarly: false,
            stripUnknown: true,
        });

        if (error) {
            const errorMessage = error.details
                .map((detail) => detail.message)
                .join(', ');
            throw new Error(`Schema validation failed: ${errorMessage}`);
        }

        return value;
    };
};

// Common schemas used across Kafka messages
const schemas = {
    userCreated: Joi.object({
        userId: Joi.string().required(),
        email: Joi.string().email().required(),
        timestamp: Joi.date().iso().required(),
        metadata: Joi.object().optional(),
    }),

    userUpdated: Joi.object({
        userId: Joi.string().required(),
        changes: Joi.object().required(),
        timestamp: Joi.date().iso().required(),
    }),

    authEvent: Joi.object({
        userId: Joi.string().required(),
        eventType: Joi.string()
            .valid('login', 'logout', 'password-reset')
            .required(),
        timestamp: Joi.date().iso().required(),
        metadata: Joi.object().optional(),
    }),

    notification: Joi.object({
        type: Joi.string().valid('email', 'push', 'sms').required(),
        recipient: Joi.string().required(),
        content: Joi.object({
            subject: Joi.string().required(),
            body: Joi.string().required(),
        }).required(),
        metadata: Joi.object().optional(),
    }),
};

module.exports = {
    validateSchema,
    schemas,
};
