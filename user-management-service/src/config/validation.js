const Joi = require('joi');

const configValidationSchema = Joi.object({
    REDIS_HOST: Joi.string().default('localhost'),
    REDIS_PORT: Joi.number().default(6379),
    REDIS_PASSWORD: Joi.string().allow('').optional(),
    // Add other configuration variables as needed
}).unknown();

module.exports = configValidationSchema;
