// src/index.js
const express = require('express');
const fs = require('fs').promises;
const path = require('path');
const { paths } = require('./config/env');
const kafka = require('./config/kafka');
const { transcodeVideo } = require('./services/transcodeService');
const logger = require('./utils/logger');
const cleanup = require('./services/cleanupService');
const healthRoutes = require('./routes/health');
const s3Service = require('./services/s3Service');

const app = express();
const port = process.env.SERVICE_PORT || 3004;

// Initialize queue processors
let queueProcessors = [];

const init = async () => {
    try {
        await Promise.all([
            fs.mkdir(paths.input, { recursive: true }),
            fs.mkdir(paths.output, { recursive: true }),
            kafka.initKafka(),
        ]);
        return true;
    } catch (error) {
        logger.error('Initialization failed:', { error });
        return false;
    }
};

async function processVideo(data) {
    const { videoId, profile } = data;
    const messageId = `${videoId}-${Date.now()}`;

    try {
        logger.info(`Starting video transcoding`, {
            messageId,
            videoId,
            profile,
        });

        // Download from S3
        await s3Service.downloadVideo(videoId);

        // Add progress updates during transcoding
        await kafka.sendMessage(config.kafka.topics.progress, {
            messageId,
            videoId,
            status: 'processing',
            progress: {
                stage: 'transcoding',
                percent: 0,
                timestamp: Date.now(),
            },
        });

        // Transcode video
        await transcodeVideo(videoId, profile, async (progress) => {
            // Send progress updates
            await kafka.sendMessage(config.kafka.topics.progress, {
                messageId,
                videoId,
                status: 'processing',
                progress: {
                    stage: 'transcoding',
                    percent: progress,
                    timestamp: Date.now(),
                },
            });
        });

        // Upload to S3
        const s3Path = await s3Service.uploadVideo(videoId, profile);

        // Cleanup local files
        await cleanup.cleanupTranscodedFile(videoId);

        // Send success message with more metadata
        await kafka.sendMessage(config.kafka.topics.completed, {
            messageId,
            videoId,
            status: 'success',
            profile,
            s3Path,
            metadata: {
                completedAt: Date.now(),
                processingTime:
                    Date.now() - parseInt(data.timestamp || Date.now()),
            },
        });
    } catch (error) {
        logger.error('Video processing failed', { messageId, videoId, error });

        // Send detailed error message
        await kafka.sendMessage(config.kafka.topics.failed, {
            messageId,
            videoId,
            status: 'failed',
            error: {
                message: error.message,
                code: error.code,
                retryable:
                    error instanceof TranscodingError && error.isOperational,
            },
            profile,
            timestamp: Date.now(),
        });

        // Ensure cleanup on failure
        try {
            await cleanup.cleanupTranscodedFile(videoId);
        } catch (cleanupError) {
            logger.error('Cleanup failed after processing error', {
                videoId,
                cleanupError,
            });
        }
    }
}

// Improve Kafka consumer setup with batching and error handling
kafka.consumer.run({
    eachBatchAutoResolve: false,
    eachBatch: async ({ batch, resolveOffset, heartbeat }) => {
        for (const message of batch.messages) {
            try {
                const data = JSON.parse(message.value.toString());
                await processVideo(data);
                await resolveOffset(message.offset);
                await heartbeat();
            } catch (error) {
                logger.error('Error processing message batch', { error });
                // Continue processing other messages in batch
            }
        }
    },
});

// Graceful shutdown
async function shutdown(signal) {
    logger.info(`Received ${signal}. Starting graceful shutdown...`);

    try {
        await kafka.shutdown();
    } catch (error) {
        logger.error('Error during Kafka shutdown:', error);
    }

    process.exit(0);
}

// Signal handlers
process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

// Routes
app.use('/health', healthRoutes);

// Start server
app.listen(port, () => {
    logger.info(`Service running on port ${port}`);
});

init();

module.exports = app;
