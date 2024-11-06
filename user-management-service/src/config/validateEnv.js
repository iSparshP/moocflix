const Joi = require('joi');
const logger = require('../utils/logger');

const envSchema = Joi.object({
    NODE_ENV: Joi.string()
        .valid('development', 'production', 'test')
        .required(),
    PORT: Joi.number().default(3007),

    // MongoDB Configuration
    MONGO_URI: Joi.string()
        .required()
        .pattern(/^mongodb(\+srv)?:\/\/.+/), // Validate MongoDB URI format
    MONGO_USER: Joi.string().required(),
    MONGO_PASSWORD: Joi.string().required(),
    MONGO_AUTH_SOURCE: Joi.string().default('admin'),
    MONGO_SSL: Joi.boolean().default(true),
    MONGO_DEBUG: Joi.boolean().default(false),
    MONGO_RETRY_WRITES: Joi.boolean().default(true),
    MONGO_RETRY_READS: Joi.boolean().default(true),
    MONGO_DIRECT_CONNECTION: Joi.boolean().default(true),

    JWT_SECRET: Joi.string().min(32).required(),
    KAFKA_BROKERS: Joi.string().required(),
    KAFKA_USERNAME: Joi.string().required(),
    KAFKA_PASSWORD: Joi.string().required(),

    // Redis configuration
    REDIS_URL: Joi.string(),
    REDIS_HOST: Joi.string().default('localhost'),
    REDIS_PORT: Joi.number().default(6379),
    REDIS_PASSWORD: Joi.string().allow('', null).default(''),
    REDIS_DB: Joi.number().default(0),

    CORS_ORIGIN: Joi.string().required(),
    LOG_LEVEL: Joi.string()
        .valid('error', 'warn', 'info', 'debug')
        .default('info'),
    HONEYCOMB_API_KEY: Joi.string().optional(),
}).unknown();

const validateEnv = () => {
    const { error, value } = envSchema.validate(process.env, {
        abortEarly: false,
        stripUnknown: true,
    });

    if (error) {
        logger.error('Environment validation failed', {
            error: error.message,
            details: error.details.map((d) => d.message),
        });
        throw new Error(`Environment validation failed: ${error.message}`);
    }

    // Additional MongoDB URI validation
    try {
        const mongoUrl = new URL(value.MONGO_URI);
        if (!mongoUrl.hostname) {
            throw new Error('Invalid MongoDB URI: missing hostname');
        }
    } catch (err) {
        logger.error('MongoDB URI validation failed', { error: err.message });
        throw new Error(`Invalid MongoDB URI: ${err.message}`);
    }

    return value;
};

module.exports = validateEnv;
