// src/services/metricsService.js
const os = require('os');
const fs = require('fs').promises;
const { EventEmitter } = require('events');
const { limits } = require('../config/limits');
const { paths } = require('../config/environment');
const metricsPersistence = require('./metricsPersistence');
const registry = require('../utils/serviceRegistry');
const kafkaClient = require('./kafka/kafkaClient');
const logger = require('../utils/logger');

class MetricsService extends EventEmitter {
    constructor() {
        super();
        this.metrics = {
            transcoding: new Map(),
            system: {
                lastMinute: [],
                lastHour: [],
                resources: {
                    cpu: 0,
                    memory: 0,
                    disk: {
                        input: 0,
                        output: 0,
                    },
                },
            },
            kafka: {
                messageCount: 0,
                errorCount: 0,
                lastEvents: [],
            },
        };

        // Initialize handlers first before binding
        this.handleJobComplete = (data) => {
            this.completeTranscodingJob(data.videoId, data.outputSize);
        };

        this.handleJobFailed = (data) => {
            this.recordTranscodingError(data.videoId, data.error);
        };

        this.handleResourceAllocation = (data) => {
            // Add resource allocation tracking logic here
            logger.info('Resource allocation event received', data);
        };

        // Now bind the event listeners
        registry.on('job:complete', this.handleJobComplete);
        registry.on('job:failed', this.handleJobFailed);
        registry.on('resources:allocated', this.handleResourceAllocation);

        this.startSystemMetricsCollection();

        // Store metrics periodically
        setInterval(async () => {
            const metrics = this.getMetricsSummary();
            await metricsPersistence.persistMetrics(metrics);
        }, 60000); // Store every minute
    }

    async init() {
        await metricsPersistence.init();
        this.startSystemMetricsCollection();
        return true;
    }

    async checkResources() {
        const metrics = await this.collectSystemMetrics();

        return {
            canAcceptMore: this.isUnderThreshold(metrics),
            metrics: metrics,
            thresholds: {
                cpu: limits.maxCpuUsage,
                memory: limits.maxMemoryUsage,
                disk: limits.maxDiskUsage || 0.9,
            },
        };
    }

    isUnderThreshold(metrics) {
        return (
            metrics.cpu.utilization < limits.maxCpuUsage &&
            metrics.memory.used < limits.maxMemoryUsage &&
            metrics.disk.input.used < (limits.maxDiskUsage || 0.9) &&
            metrics.disk.output.used < (limits.maxDiskUsage || 0.9)
        );
    }

    async collectSystemMetrics() {
        const metrics = {
            timestamp: new Date().toISOString(),
            cpu: {
                load: os.loadavg(),
                utilization: os.loadavg()[0] / os.cpus().length,
                count: os.cpus().length,
            },
            memory: {
                total: os.totalmem(),
                free: os.freemem(),
                used: process.memoryUsage().heapUsed / os.totalmem(),
                heapUsed: process.memoryUsage().heapUsed,
            },
            disk: await this.getDiskMetrics(),
            queue: this.getQueueMetrics(),
        };

        // Store metrics history
        this.metrics.system.lastMinute.unshift(metrics);
        this.metrics.system.lastMinute = this.metrics.system.lastMinute.slice(
            0,
            60
        );

        if (this.metrics.system.lastMinute.length === 60) {
            const hourlyMetric = this.aggregateMetrics(
                this.metrics.system.lastMinute
            );
            this.metrics.system.lastHour.unshift(hourlyMetric);
            this.metrics.system.lastHour = this.metrics.system.lastHour.slice(
                0,
                60
            );
        }

        // Update current resources
        this.metrics.system.resources = {
            cpu: metrics.cpu.utilization,
            memory: metrics.memory.used,
            disk: metrics.disk,
        };

        return metrics;
    }

    async getDiskMetrics() {
        const metrics = {
            input: { total: 0, used: 0, available: 0 },
            output: { total: 0, used: 0, available: 0 },
        };

        for (const [key, dir] of Object.entries({
            input: paths.input,
            output: paths.output,
        })) {
            try {
                const stats = await fs.statfs(dir);
                metrics[key] = {
                    total: stats.blocks * stats.bsize,
                    used: (stats.blocks - stats.bfree) * stats.bsize,
                    available: stats.bavail * stats.bsize,
                    usedPercentage: (stats.blocks - stats.bfree) / stats.blocks,
                };
            } catch (error) {
                console.error(`Error getting disk metrics for ${dir}:`, error);
            }
        }

        return metrics;
    }

    getQueueMetrics() {
        const queues = this.metrics.transcoding;
        return {
            active: Array.from(queues.values()).filter(
                (job) => job.status === 'processing'
            ).length,
            waiting: Array.from(queues.values()).filter(
                (job) => job.status === 'waiting'
            ).length,
            completed: Array.from(queues.values()).filter(
                (job) => job.status === 'completed'
            ).length,
            failed: Array.from(queues.values()).filter(
                (job) => job.status === 'failed'
            ).length,
        };
    }

    startSystemMetricsCollection() {
        // Set up periodic collection of system metrics
        setInterval(async () => {
            try {
                const metrics = await this.collectSystemMetrics();
                this.emit('metrics:update', metrics);
            } catch (error) {
                logger.error('Error collecting system metrics:', error);
            }
        }, 60000); // Collect every minute
    }

    aggregateMetrics(metrics) {
        return {
            timestamp: new Date().toISOString(),
            cpu: {
                utilization: this.average(
                    metrics.map((m) => m.cpu.utilization)
                ),
                load:
                    metrics.map((m) => m.cpu.load[0]).reduce((a, b) => a + b) /
                    metrics.length,
            },
            memory: {
                used: this.average(metrics.map((m) => m.memory.used)),
                heapUsed: this.average(metrics.map((m) => m.memory.heapUsed)),
            },
            disk: {
                input: {
                    used: this.average(
                        metrics.map((m) => m.disk.input.usedPercentage)
                    ),
                },
                output: {
                    used: this.average(
                        metrics.map((m) => m.disk.output.usedPercentage)
                    ),
                },
            },
        };
    }

    trackTranscodingJob(videoId, profile) {
        this.metrics.transcoding.set(videoId, {
            videoId,
            profile,
            status: 'processing',
            startTime: Date.now(),
        });
    }

    getMetricsSummary() {
        return {
            current: {
                system: this.metrics.system.resources,
                queue: this.getQueueMetrics(),
            },
            history: {
                lastMinute: this.metrics.system.lastMinute,
                lastHour: this.metrics.system.lastHour,
            },
            kafka: {
                messages: this.metrics.kafka.messageCount,
                errors: this.metrics.kafka.errorCount,
            },
        };
    }

    average(numbers) {
        return numbers.reduce((a, b) => a + b, 0) / numbers.length;
    }

    completeTranscodingJob(videoId, outputSize) {
        const job = this.metrics.transcoding.get(videoId);
        if (job) {
            const duration = Date.now() - job.startTime;
            try {
                // Only call if transcodingMetrics exists
                if (
                    typeof transcodingMetrics !== 'undefined' &&
                    transcodingMetrics.jobDuration
                ) {
                    transcodingMetrics.jobDuration.observe(
                        { profile: job.profile },
                        duration / 1000
                    );
                }
                this.metrics.transcoding.delete(videoId);
            } catch (error) {
                logger.error('Error recording job completion metrics:', error);
            }
        }
    }

    recordTranscodingError(videoId, error) {
        try {
            // Only call if transcodingMetrics exists
            if (
                typeof transcodingMetrics !== 'undefined' &&
                transcodingMetrics.failureRate
            ) {
                transcodingMetrics.failureRate.inc({
                    reason:
                        error.name === 'TranscodingError'
                            ? 'transcoding'
                            : 'system',
                });
            }

            const job = this.metrics.transcoding.get(videoId);
            if (job) {
                job.status = 'failed';
                job.error = error.message;
            }
        } catch (err) {
            logger.error('Error recording transcoding error metrics:', err);
        }
    }

    collectQueueMetrics() {
        const queue = registry.get('queue');
        return {
            queued: queue.getQueueStats(),
            active: queue.activeJobs.size,
            failed: queue.getFailedJobStats(),
        };
    }

    collectResourceMetrics() {
        const resources = registry.get('resources');
        return {
            allocated: resources.getResourceUtilization(),
            system: this.collectSystemMetrics(),
        };
    }

    // Centralize all metrics collection here
    async collectAllMetrics() {
        const metrics = {
            system: await this.collectSystemMetrics(),
            queue: await this.collectQueueMetrics(),
            resources: await this.collectResourceMetrics(),
            cleanup: await this.collectCleanupMetrics(),
        };

        await this.persistMetrics(metrics);
        return metrics;
    }

    async collectCleanupMetrics() {
        try {
            const cleanup = this.registry.get('cleanup');
            if (!cleanup) {
                logger.warn('Cleanup service not found in registry');
                return {
                    lastRun: null,
                    storage: null,
                };
            }
            return {
                lastRun: await cleanup.getLastRunMetrics(),
                storage: await cleanup.getStorageMetrics(),
            };
        } catch (error) {
            logger.error('Error collecting cleanup metrics:', error);
            return {
                lastRun: null,
                storage: null,
                error: error.message,
            };
        }
    }

    async recordTranscodingMetrics(videoId, metrics) {
        try {
            await kafkaClient.sendMessage(config.kafka.topics.metrics, {
                videoId,
                metrics,
                timestamp: Date.now(),
            });

            logger.info(`Recorded metrics for video ${videoId}`);
        } catch (error) {
            logger.error('Failed to record metrics:', error);
            throw error;
        }
    }

    async processMetrics() {
        await kafkaClient.subscribe(
            [config.kafka.topics.metrics],
            async (message, metadata) => {
                try {
                    logger.info(
                        `Processing metrics for video ${message.videoId}`
                    );
                    // Process and store metrics
                    await this.storeMetrics(message.metrics);
                } catch (error) {
                    logger.error(`Error processing metrics: ${error.message}`);
                }
            }
        );
    }

    async trackProgress(videoId, progress) {
        try {
            await kafkaClient.sendMessage(config.kafka.topics.progress, {
                videoId,
                progress,
                timestamp: Date.now(),
            });

            logger.info(`Progress update for video ${videoId}: ${progress}%`);
        } catch (error) {
            logger.error('Failed to send progress update:', error);
        }
    }
}

const metricsService = new MetricsService();
module.exports = metricsService;
