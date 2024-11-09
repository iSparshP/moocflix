const path = require('path');
const fs = require('fs');
const logger = require('../utils/logger');

// Helper to read cert files
const readCertFile = (filename) => {
    try {
        return fs.readFileSync(
            path.join(__dirname, '..', 'certs', filename),
            'utf-8'
        );
    } catch (error) {
        logger.warn(`Certificate file ${filename} not found: ${error.message}`);
        return null;
    }
};

const environment = {
    kafka: {
        clientId: process.env.KAFKA_CLIENT_ID || 'transcoding-service',
        brokers: (process.env.KAFKA_BROKERS || 'localhost:9092').split(','),
        groupId: process.env.KAFKA_GROUP_ID || 'transcoding-group',
        ssl: {
            rejectUnauthorized:
                process.env.KAFKA_SSL_REJECT_UNAUTHORIZED !== 'false',
            ca: [readCertFile('ca-certificate.crt')],
            key: readCertFile('user-access-key.key'),
            cert: readCertFile('user-access-certificate.crt'),
        },
        sasl: {
            mechanism: process.env.KAFKA_SASL_MECHANISM,
            username: process.env.KAFKA_USERNAME,
            password: process.env.KAFKA_PASSWORD,
        },
        connectionTimeout: 30000,
        retry: {
            initialRetryTime: 1000,
            retries: 10,
        },
        topics: {
            request: 'Transcoding-Request',
            completed: 'Transcoding-Completed',
            failed: 'Transcoding-Failed',
            progress: 'Transcoding-Progress',
            metrics: 'Transcoding-Metrics',
        },
    },
    redis: {
        url: process.env.REDIS_URL || 'redis://localhost:6379',
        keyPrefix: process.env.REDIS_KEY_PREFIX || 'transcode:',
        ttl: {
            job: parseInt(process.env.REDIS_JOB_TTL || '86400', 10),
            progress: parseInt(process.env.REDIS_PROGRESS_TTL || '3600', 10),
        },
        tls:
            process.env.REDIS_TLS === 'true'
                ? {
                      rejectUnauthorized:
                          process.env.REDIS_TLS_REJECT_UNAUTHORIZED !== 'false',
                  }
                : null,
        password: process.env.REDIS_PASSWORD || undefined,
        username: process.env.REDIS_USERNAME || undefined,
        retryStrategy: (times) => Math.min(times * 50, 2000),
    },
    paths: {
        input: process.env.INPUT_VIDEO_PATH || '/app/temp/videos',
        output: process.env.OUTPUT_VIDEO_PATH || '/app/temp/processed',
        certs: process.env.KAFKA_SSL_CERTS_PATH || '/certs',
    },
    service: {
        port: parseInt(process.env.SERVICE_PORT || '3004', 10),
        healthCheckPort: parseInt(process.env.HEALTH_CHECK_PORT || '3005', 10),
        environment: process.env.NODE_ENV || 'development',
    },
    aws: {
        region: process.env.AWS_REGION || 'ap-south-1',
        s3: {
            bucket: process.env.S3_BUCKET_NAME,
            uploadPrefix: 'uploads/',
            transcodedPrefix: 'transcoded/',
            maxUploadRetries: 3,
            partSize: 5 * 1024 * 1024,
            queueSize: 4,
        },
    },
};

module.exports = environment;
