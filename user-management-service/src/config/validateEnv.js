const Joi = require('joi');

const envSchema = Joi.object({
    NODE_ENV: Joi.string()
        .valid('development', 'production', 'test')
        .required(),
    PORT: Joi.number().default(3007),
    MONGO_URI: Joi.string().required(),
    JWT_SECRET: Joi.string().min(32).required(),
    KAFKA_BROKER: Joi.string().required(),
    CORS_ORIGIN: Joi.string().required(),
    LOG_LEVEL: Joi.string()
        .valid('error', 'warn', 'info', 'debug')
        .default('info'),
    RATE_LIMIT_MAX: Joi.number().default(100),
    SHUTDOWN_TIMEOUT: Joi.number().default(10000),
    KAFKA_CLIENT_ID: Joi.string().default('user-management-service'),
    KAFKA_GROUP_ID: Joi.string().default('user-management-group'),
    KAFKA_RETRY_ATTEMPTS: Joi.number().default(3),
    KAFKA_RETRY_DELAY: Joi.number().default(1000),
    DB_MAX_POOL_SIZE: Joi.number().default(10),
    DB_TIMEOUT_MS: Joi.number().default(5000),
    JWT_REFRESH_SECRET: Joi.string().min(32).required(),
    JWT_REFRESH_EXPIRES_IN: Joi.string().default('7d'),
}).unknown();

const validateEnv = () => {
    const { error, value } = envSchema.validate(process.env);
    if (error) {
        throw new Error(`Environment validation failed: ${error.message}`);
    }
    return value;
};

module.exports = validateEnv;
