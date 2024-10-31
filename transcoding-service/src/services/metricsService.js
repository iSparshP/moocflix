// src/services/metricsService.js
const os = require('os');
const fs = require('fs').promises;
const { EventEmitter } = require('events');
const { limits } = require('../config/resources');
const { paths } = require('../config/env');
const metricsPersistence = require('./metricsPersistence');

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
        const COLLECTION_INTERVAL = 1000; // 1 second
        setInterval(async () => {
            try {
                await this.collectSystemMetrics();
                this.emit('metrics-updated', this.metrics);
            } catch (error) {
                console.error('Error collecting metrics:', error);
            }
        }, COLLECTION_INTERVAL);
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
}

const metricsService = new MetricsService();
module.exports = metricsService;
