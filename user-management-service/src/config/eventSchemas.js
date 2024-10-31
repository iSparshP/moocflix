const Joi = require('joi');

/**
 * @typedef {Object} UserEvent
 * @property {string} userId
 * @property {string} email
 * @property {('student'|'instructor'|'admin')} role
 * @property {string} timestamp - ISO date string
 */

const baseUserSchema = Joi.object({
    userId: Joi.string().required(),
    email: Joi.string().email().required(),
    role: Joi.string().valid('student', 'instructor', 'admin').required(),
    timestamp: Joi.date().iso().required(),
});

const schemas = {
    'User-Creation': baseUserSchema,
    'User-Update': baseUserSchema.keys({
        // Add any User-Update specific fields here
    }),
};

/**
 * Validates an event message against its schema
 * @param {string} topic - The event topic
 * @param {Object} message - The event message
 * @throws {Error} If validation fails
 */
const validateEventMessage = (topic, message) => {
    const schema = schemas[topic];
    if (!schema) {
        throw new Error(`No schema found for topic: ${topic}`);
    }

    const { error } = schema.validate(message, {
        abortEarly: false,
        stripUnknown: true,
    });

    if (error) {
        throw new Error(
            `Invalid message format: ${error.details.map((d) => d.message).join(', ')}`
        );
    }

    return true;
};

module.exports = {
    schemas,
    validateEventMessage,
};
