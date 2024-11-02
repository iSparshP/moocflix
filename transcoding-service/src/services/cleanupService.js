// src/services/cleanupService.js
const fs = require('fs').promises;
const path = require('path');
const { paths } = require('../config/env');
const logger = require('../utils/logger');
const { register } = require('../utils/metrics');
const TranscodingCircuitBreaker = require('../utils/circuitBreaker');
const { registry } = require('../services/serviceRegistry');
const BaseService = require('./baseService');

const cleanupMetrics = {
    runs: new register.Counter({
        name: 'cleanup_runs_total',
        help: 'Total number of cleanup runs',
        labelNames: ['status'],
    }),
    filesRemoved: new register.Counter({
        name: 'cleanup_files_removed_total',
        help: 'Number of files removed during cleanup',
    }),
    bytesFreed: new register.Gauge({
        name: 'cleanup_bytes_freed',
        help: 'Total bytes freed by cleanup',
    }),
    duration: new register.Histogram({
        name: 'cleanup_duration_seconds',
        help: 'Duration of cleanup operations',
    }),
};

class CleanupService extends BaseService {
    constructor() {
        super();
        this.initializeMetrics();
    }

    async init() {
        await super.init();
        this.schedule = this.startCleanupSchedule();
        this.emit('cleanup:initialized');
    }

    async shutdown() {
        if (this.schedule) {
            clearInterval(this.schedule);
        }
        await super.shutdown();
    }

    startCleanupSchedule() {
        const interval =
            (process.env.CLEANUP_INTERVAL_MINUTES || 30) * 60 * 1000;
        return setInterval(async () => {
            try {
                await this.cleanupAll();
            } catch (error) {
                logger.error('Cleanup failed:', error);
            }
        }, interval);
    }

    async cleanupTranscodedFile(videoId) {
        try {
            const inputPath = path.join(paths.input, `${videoId}.mp4`);
            await fs.unlink(inputPath);
            console.log(`Cleaned up input file for video ID: ${videoId}`);
        } catch (error) {
            console.error(
                `Error cleaning up input file for ${videoId}:`,
                error
            );
        }
    }

    async cleanupStaleFiles() {
        const startTime = Date.now();
        const metrics = {
            attempts: 0,
            success: 0,
            failed: 0,
            bytesFreed: 0,
        };

        try {
            const cutoffTime =
                Date.now() - this.retentionPeriod * 60 * 60 * 1000;

            for (const dir of [paths.input, paths.output]) {
                await this.cleanupDirectory(dir, cutoffTime, metrics);
            }

            // Update metrics
            cleanupMetrics.runs.inc({ status: 'success' });
            cleanupMetrics.filesRemoved.inc(metrics.success);
            cleanupMetrics.bytesFreed.set(metrics.bytesFreed);
            cleanupMetrics.duration.observe((Date.now() - startTime) / 1000);

            logger.info('Cleanup completed successfully', { metrics });
            return metrics;
        } catch (error) {
            cleanupMetrics.runs.inc({ status: 'failed' });
            logger.error('Cleanup failed', { error, metrics });
            throw error;
        }
    }

    async cleanupDirectory(dir, cutoffTime, metrics) {
        try {
            const files = await fs.readdir(dir);

            // Process files in batches
            for (let i = 0; i < files.length; i += this.batchSize) {
                const batch = files.slice(i, i + this.batchSize);
                await Promise.all(
                    batch.map((file) =>
                        this.processFile(dir, file, cutoffTime, metrics)
                    )
                );
            }
        } catch (error) {
            logger.error(`Error cleaning directory ${dir}`, { error });
            metrics.failed++;
            throw error;
        }
    }

    async processFile(dir, file, cutoffTime, metrics) {
        metrics.attempts++;

        try {
            const filePath = path.join(dir, file);
            const stats = await fs.stat(filePath);

            if (stats.mtimeMs < cutoffTime) {
                await fs.unlink(filePath);
                metrics.success++;
                metrics.bytesFreed += stats.size;
                logger.debug(`Removed stale file: ${filePath}`);
            }
        } catch (error) {
            metrics.failed++;
            logger.error(`Failed to process file: ${file}`, { error });
        }
    }

    async getStorageMetrics() {
        const metrics = {
            input: { total: 0, count: 0 },
            output: { total: 0, count: 0 },
        };

        for (const [key, dir] of Object.entries({
            input: paths.input,
            output: paths.output,
        })) {
            try {
                const files = await fs.readdir(dir);
                metrics[key].count = files.length;

                for (const file of files) {
                    const stats = await fs.stat(path.join(dir, file));
                    metrics[key].total += stats.size;
                }
            } catch (error) {
                console.error(`Error getting metrics for ${dir}:`, error);
            }
        }

        return metrics;
    }

    async cleanupStaleResources() {
        const resourceManager = registry.get('resources');
        const staleThreshold = Date.now() - 30 * 60 * 1000;

        for (const [
            jobId,
            reservation,
        ] of resourceManager.reservations.entries()) {
            if (reservation.allocatedAt < staleThreshold) {
                await resourceManager.releaseResources(jobId);
            }
        }
    }

    async cleanupAll() {
        await Promise.all([
            this.cleanupStaleFiles(),
            this.cleanupStaleResources(),
            this.cleanupFailedJobs(),
        ]);
    }

    async cleanupFailedJobs() {
        const queue = registry.get('queue');
        const staleThreshold = Date.now() - 24 * 60 * 60 * 1000; // 24 hours

        for (const [jobId, job] of queue.failedJobs.entries()) {
            if (job.failedAt < staleThreshold) {
                queue.failedJobs.delete(jobId);
            }
        }
    }
}

const cleanup = new CleanupService();
module.exports = cleanup;
