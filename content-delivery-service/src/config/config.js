require('dotenv').config();
const Joi = require('joi');

// Add environment validation
const envSchema = Joi.object({
    NODE_ENV: Joi.string()
        .valid('development', 'production', 'test')
        .required(),
    PORT: Joi.number().default(3010),
    AWS_REGION: Joi.string().required(),
    // ... other environment variables
}).unknown();

// Consolidate all configuration
const config = {
    app: {
        port: process.env.PORT || 3010,
        env: process.env.NODE_ENV || 'development',
    },
    aws: {
        region: process.env.AWS_REGION,
        bucketName: process.env.S3_BUCKET_NAME,
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    },
    kafka: {
        brokers: process.env.KAFKA_BROKERS?.split(',') || ['localhost:9092'],
        clientId: 'content-delivery-service',
        topics: {
            transcodeRequest: 'Transcoding-Request',
            transcodeComplete: 'Transcoding-Completed',
            studentEnrolled: 'Student-Enrolled',
        },
    },
    redis: {
        url: process.env.REDIS_URL || 'redis://localhost:6379',
        ttl: 3600,
    },
    db: {
        url: process.env.DATABASE_URL,
        options: {
            dialect: 'postgres',
            logging: false,
        },
    },
    upload: {
        maxSize: 100000000, // 100MB
        allowedTypes: ['video/mp4', 'video/mkv', 'video/avi'],
    },
    logging: {
        dir: process.env.LOG_DIR || 'logs',
        level: process.env.LOG_LEVEL || 'info',
        maxSize: '20m',
        maxFiles: '14d',
        format: process.env.LOG_FORMAT || 'json',
    },
    digitalOcean: {
        spacesEndpoint: process.env.DO_SPACES_ENDPOINT,
        spacesBucket: process.env.DO_SPACES_BUCKET,
        accessKeyId: process.env.DO_SPACES_ACCESS_KEY_ID,
        secretAccessKey: process.env.DO_SPACES_SECRET_ACCESS_KEY,
        region: process.env.DO_SPACES_REGION || 'nyc3',
    },
};

module.exports = config;
