const path = require('path');
require('dotenv').config();

const requiredEnvVars = [
    'KAFKA_HOST',
    'KAFKA_TRANSCODE_TOPIC',
    'INPUT_VIDEO_PATH',
    'OUTPUT_VIDEO_PATH',
];

const missingVars = requiredEnvVars.filter((varName) => !process.env[varName]);
if (missingVars.length > 0) {
    throw new Error(
        `Missing required environment variables: ${missingVars.join(', ')}`
    );
}

// Normalize and validate paths
const inputPath = path.resolve(process.env.INPUT_VIDEO_PATH);
const outputPath = path.resolve(process.env.OUTPUT_VIDEO_PATH);

const config = {
    kafka: {
        host: process.env.KAFKA_HOST,
        topic: process.env.KAFKA_TRANSCODE_TOPIC,
        groupId: process.env.KAFKA_GROUP_ID || 'transcoding-service',
    },
    paths: {
        input: inputPath,
        output: outputPath,
    },
    service: {
        port: parseInt(process.env.SERVICE_PORT || '3006', 10),
        healthCheckPort: parseInt(process.env.HEALTH_CHECK_PORT || '3001', 10),
        environment: process.env.NODE_ENV || 'development',
    },
};

module.exports = config;
