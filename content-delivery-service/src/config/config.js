require('dotenv').config();
const Joi = require('joi');
const fs = require('fs');
const path = require('path');

// Helper to read cert files
const readCertFile = (filename) => {
    try {
        return fs.readFileSync(
            path.join(__dirname, '..', 'certs', filename),
            'utf-8'
        );
    } catch (error) {
        console.warn(
            `Warning: Could not read certificate file ${filename}:`,
            error.message
        );
        return null;
    }
};

// Environment validation schema
const envSchema = Joi.object({
    NODE_ENV: Joi.string()
        .valid('development', 'production', 'test')
        .required(),
    PORT: Joi.number().default(3006),
    AWS_REGION: Joi.string().required(),
    AWS_ACCESS_KEY_ID: Joi.string().required(),
    AWS_SECRET_ACCESS_KEY: Joi.string().required(),
    AWS_MEDIACONVERT_ENDPOINT: Joi.string().required(),
    AWS_MEDIACONVERT_ROLE: Joi.string().required(),
    AWS_MEDIACONVERT_QUEUE: Joi.string().required(),
    S3_BUCKET_NAME: Joi.string().required(),
    DATABASE_URL: Joi.string().required(),
    REDIS_URL: Joi.string().required(),
    KAFKA_BROKERS: Joi.string().required(),
    JWT_SECRET: Joi.string().required(),
    JWT_EXPIRES_IN: Joi.string().default('24h'),
}).unknown();

// Validate environment variables
const { error, value: env } = envSchema.validate(process.env);
if (error) {
    throw new Error(`Config validation error: ${error.message}`);
}

const config = {
    app: {
        port: env.PORT || 3006,
        env: env.NODE_ENV || 'development',
        jwtSecret: env.JWT_SECRET,
        jwtExpiresIn: env.JWT_EXPIRES_IN,
    },
    aws: {
        region: env.AWS_REGION,
        bucketName: env.S3_BUCKET_NAME,
        accessKeyId: env.AWS_ACCESS_KEY_ID,
        secretAccessKey: env.AWS_SECRET_ACCESS_KEY,
        mediaConvertEndpoint: env.AWS_MEDIACONVERT_ENDPOINT,
        mediaConvertRole: env.AWS_MEDIACONVERT_ROLE,
        mediaConvertQueue: env.AWS_MEDIACONVERT_QUEUE,
    },
    kafka: {
        clientId: process.env.KAFKA_CLIENT_ID || 'content-delivery-service',
        brokers: (process.env.KAFKA_BROKERS || 'localhost:9092').split(','),
        groupId: process.env.KAFKA_GROUP_ID || 'content-delivery-group',
        ssl: true,
        topics: {
            studentEnrolled: 'Student-Enrolled',
            transcodeRequest: 'Transcoding-Request',
            transcodeComplete: 'Transcoding-Completed',
            transcodeProgress: 'Transcoding-Progress',
            transcodeFailed: 'Transcoding-Failed',
        },
        connectionTimeout: 5000,
        retry: {
            initialRetryTime: 100,
            retries: 8,
        },
    },
    redis: {
        url: env.REDIS_URL,
        ttl: 3600,
        options: {
            maxRetriesPerRequest: 3,
            enableReadyCheck: true,
            retryStrategy: (times) => {
                if (times > 3) {
                    return null;
                }
                return Math.min(times * 1000, 3000);
            },
            reconnectOnError: (err) => {
                const targetError = 'READONLY';
                if (err.message.includes(targetError)) {
                    return true;
                }
                return false;
            },
            tls: {
                rejectUnauthorized: false, // Required for DO managed Redis
            },
            commandTimeout: 5000,
            keepAlive: 10000,
            connectionName: 'content-delivery-service',
            enableOfflineQueue: true,
            showFriendlyErrorStack: env.NODE_ENV !== 'production',
        },
    },
    // db: {
    //     url: env.DATABASE_URL,
    //     options: {
    //         dialect: 'postgres',
    //         dialectOptions: {
    //             ssl: {
    //                 require: true,
    //                 rejectUnauthorized: false,
    //                 ca: readCertFile('../certs/pgdb.crt'),
    //             },
    //         },
    //         pool: {
    //             max: 5,
    //             min: 0,
    //             acquire: 30000,
    //             idle: 10000,
    //         },
    //         retry: {
    //             max: 5,
    //             timeout: 5000,
    //         },
    //     },
    // },
    upload: {
        maxSize: 100000000, // 100MB
        allowedTypes: ['video/mp4', 'video/mkv', 'video/avi'],
    },
    logging: {
        dir: env.LOG_DIR || 'logs',
        level: env.LOG_LEVEL || 'info',
        maxSize: '20m',
        maxFiles: '14d',
        format: env.LOG_FORMAT || 'json',
    },
    jwt: {
        secret: process.env.JWT_SECRET || 'your-default-secret-key',
        expiresIn: process.env.JWT_EXPIRES_IN || '24h',
    },
};

module.exports = config;
