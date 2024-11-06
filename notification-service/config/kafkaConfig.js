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
    clientId: process.env.KAFKA_CLIENT_ID || 'notification-service',
    brokers: process.env.KAFKA_BROKERS?.split(',') || [],
    ssl: {
        rejectUnauthorized: true, // Set to true in production with proper certificates
        ca: [readCertFile('../certs/ca-certificate.crt')],
        key: readCertFile('../certs/user-access-key.key'),
        cert: readCertFile('../certs/user-access-certificate.crt'),
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
};
