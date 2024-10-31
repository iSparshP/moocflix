// src/index.js
const express = require('express');
const fs = require('fs').promises;
const path = require('path');
const { limits } = require('./config/resources');
const { paths } = require('./config/env');
const consumer = require('./config/kafka');
const { transcodeVideo } = require('./services/transcodeService');
const kafka = require('./utils/kafka');
const queue = require('./services/queueService');
const cleanup = require('./services/cleanupService');
const validator = require('./services/validationService');
const metricsService = require('./services/metricsService');
const healthRoutes = require('./routes/health');
const logger = require('./utils/logger');
const requestLogger = require('./middleware/requestLogger');
const { errorHandler } = require('./middleware/errorHandler');
const compression = require('compression');
const timeout = require('connect-timeout');
const { securityMiddleware } = require('./middleware/security');

const app = express();
const port = process.env.SERVICE_PORT || 3006;

// Initialize queue processors
let queueProcessors = [];

const init = async () => {
    try {
        await Promise.all([
            fs.mkdir(paths.input, { recursive: true }),
            fs.mkdir(paths.output, { recursive: true }),
            metricsService.init(),
            queue.recover(),
        ]);

        // Start queue processors
        for (let i = 0; i < limits.maxConcurrentJobs; i++) {
            const processor = setInterval(() => processQueue(), 100);
            queueProcessors.push(processor);
        }

        return true;
    } catch (error) {
        logger.error('Initialization failed:', { error });
        return false;
    }
};

async function processQueue() {
    const job = queue.getNextJob();
    if (!job) return;

    try {
        await queue.startJob(job);
        const { videoId, profile } = job;

        logger.logJobStart(videoId, profile);
        metricsService.trackTranscodingJob(videoId, profile);
        await transcodeVideo(videoId, profile);

        const outputPath = path.join(paths.output, `${videoId}-transcoded.mp4`);
        const stats = await fs.stat(outputPath);

        metricsService.completeTranscodingJob(videoId, stats.size);
        await cleanup.cleanupTranscodedFile(videoId);
        logger.logJobComplete(videoId, Date.now() - job.startTime);

        await kafka.sendMessage('Transcoding-Completed', {
            videoId,
            transcodedUrl: outputPath,
            attempts: job.attempts + 1,
            metrics: metricsService.getMetricsSummary(),
        });
    } catch (error) {
        logger.logJobError(job.videoId, error);
        metricsService.recordTranscodingError(job.videoId, error);

        const willRetry = await queue.retryJob(job);
        if (!willRetry) {
            await cleanup.cleanupTranscodedFile(job.videoId);
        }

        await kafka.sendMessage(
            willRetry ? 'Transcoding-Retry' : 'Transcoding-Failed',
            {
                videoId: job.videoId,
                error: error.message,
                attempts: job.attempts + 1,
                nextRetry: willRetry
                    ? Date.now() + queue.calculateBackoff(job.attempts + 1)
                    : null,
                metrics: metricsService.getMetricsSummary(),
            }
        );
    } finally {
        await queue.completeJob(job.videoId);
    }
}

// Graceful shutdown
async function shutdown(signal) {
    logger.info(`Received ${signal}. Starting graceful shutdown...`);

    // Stop queue processors
    queueProcessors.forEach(clearInterval);

    // Pause queue
    queue.pause();

    // Wait for active jobs
    await new Promise((resolve) => setTimeout(resolve, 5000));

    // Persist queue state
    await queue.persistState();

    // Close server
    await new Promise((resolve) => app.close(resolve));

    process.exit(0);
}

// Kafka consumer setup
consumer.on('message', async (message) => {
    try {
        const data = JSON.parse(message.value);
        if (await validator.validateJobRequest(data)) {
            await queue.addJob(data);
            logger.info('Added new transcoding job', { videoId: data.videoId });
        }
    } catch (error) {
        logger.error('Error processing Kafka message', { error });
    }
});

// Signal handlers
process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

// Express middleware
app.use(securityMiddleware);
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));
app.use(compression());
app.use(timeout('30s'));
app.use(haltOnTimedout);
app.use(requestLogger);

// Routes
app.use('/health', healthRoutes);
app.use('/api/v1/transcode', require('./routes/transcode'));

// Error handling
app.use(errorHandler);

function haltOnTimedout(req, res, next) {
    if (!req.timedout) next();
}

// Start server
init().then((success) => {
    if (success) {
        app.listen(port, () => {
            logger.info(`Service running on port ${port}`);
        }).setTimeout(30000);
    } else {
        process.exit(1);
    }
});

// Global error handling
process.on('uncaughtException', (error) => {
    logger.error('Uncaught Exception', { error });
    process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
    logger.error('Unhandled Rejection', { reason, promise });
});

module.exports = app;
