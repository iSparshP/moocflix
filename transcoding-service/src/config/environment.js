const path = require('path');
const fs = require('fs');

// Helper to read cert files
const readCertFile = (filename) => {
    return fs.readFileSync(
        path.join(__dirname, '..', 'certs', filename),
        'utf-8'
    );
};

module.exports = {
    clientId: process.env.KAFKA_CLIENT_ID || 'transcoding-service',
    brokers: process.env.KAFKA_BROKERS?.split(',') || [],
    ssl: {
        rejectUnauthorized: true,
        ca: [readCertFile('ca-certificate.crt')],
        key: readCertFile('user-access-key.key'),
        cert: readCertFile('user-access-certificate.crt'),
    },
    sasl: {
        mechanism: 'plain',
        username: process.env.KAFKA_USERNAME,
        password: process.env.KAFKA_PASSWORD,
    },
    connectionTimeout: 5000,
    retry: {
        initialRetryTime: 100,
        retries: 8,
    },
    topics: {
        request: 'Transcoding-Request',
        completed: 'Transcoding-Completed',
        failed: 'Transcoding-Failed',
        progress: 'Transcoding-Progress',
        metrics: 'Transcoding-Metrics',
    },
    redis: {
        url: process.env.REDIS_URL,
        password: process.env.REDIS_PASSWORD,
        tls: process.env.NODE_ENV === 'production' ? {} : undefined,
        database: process.env.REDIS_DATABASE || '0',
    },
};
