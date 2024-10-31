// src/routes/health.js
const express = require('express');
const router = express.Router();
const kafka = require('../config/kafka');
const queue = require('../services/queueService');
const metricsService = require('../services/metricsService');
const resourceManager = require('../services/resourceManager');
const { paths } = require('../config/env');
const CircuitBreaker = require('opossum');
const cleanup = require('../services/cleanupService');
const logger = require('../utils/logger');
const { register } = require('../utils/metrics');

const cleanupMetrics = new register.Counter({
    name: 'cleanup_runs_total',
    help: 'Total number of cleanup runs',
    labelNames: ['status'],
});

const CLEANUP_INTERVAL = process.env.CLEANUP_INTERVAL_MINUTES || 30;

async function runCleanup() {
    try {
        logger.info('Starting periodic cleanup task');
        const result = await cleanup.cleanupStaleFiles();

        logger.info('Cleanup completed', {
            filesRemoved: result.cleanedFiles,
            spaceFreed: result.freedSpaceBytes,
        });

        cleanupMetrics.inc({ status: 'success' });
    } catch (error) {
        logger.error('Cleanup task failed', { error });
        cleanupMetrics.inc({ status: 'error' });
    }
}

// Run cleanup periodically
setInterval(runCleanup, CLEANUP_INTERVAL * 60 * 1000);

// Run initial cleanup
runCleanup();

const circuitBreakerFailures = new register.Counter({
    name: 'circuit_breaker_failures_total',
    help: 'Total number of circuit breaker failures',
    labelNames: ['breaker'],
});

const defaultOptions = {
    timeout: 3000,
    errorThresholdPercentage: 50,
    resetTimeout: 30000,
};

const breakerMap = new Map();

module.exports = function getCircuitBreaker(name, fn, options = {}) {
    if (!breakerMap.has(name)) {
        const breaker = new CircuitBreaker(fn, {
            ...defaultOptions,
            ...options,
        });

        breaker.on('failure', (error) => {
            logger.error(`Circuit ${name} failure`, { error });
            circuitBreakerFailures.inc({ breaker: name });
        });

        breaker.on('open', () => {
            logger.warn(`Circuit ${name} opened`);
        });

        breakerMap.set(name, breaker);
    }
    return breakerMap.get(name);
};

const checkKafkaConnection = async () => {
    try {
        const connected = await kafka.client.connected;
        return {
            status: connected ? 'healthy' : 'degraded',
            latency: await kafka.getLatency(),
        };
    } catch (error) {
        return { status: 'error', error: error.message };
    }
};

const checkDiskSpace = async () => {
    try {
        const diskMetrics = await metricsService.getDiskMetrics();
        return {
            input: {
                path: paths.input,
                available: diskMetrics.input.available,
                used: diskMetrics.input.usedPercentage,
                status:
                    diskMetrics.input.usedPercentage > 0.9
                        ? 'warning'
                        : 'healthy',
            },
            output: {
                path: paths.output,
                available: diskMetrics.output.available,
                used: diskMetrics.output.usedPercentage,
                status:
                    diskMetrics.output.usedPercentage > 0.9
                        ? 'warning'
                        : 'healthy',
            },
        };
    } catch (error) {
        return { status: 'error', error: error.message };
    }
};

router.get('/health', async (req, res) => {
    try {
        const [metrics, resources, kafkaStatus, diskStatus, queueHealth] =
            await Promise.all([
                metricsService.getMetricsSummary(),
                metricsService.checkResources(),
                checkKafkaConnection(),
                checkDiskSpace(),
                queue.getHealth(),
            ]);

        const systemStatus = determineSystemStatus({
            resources,
            kafka: kafkaStatus,
            disk: diskStatus,
            queue: queueHealth,
        });

        const health = {
            status: systemStatus,
            timestamp: new Date().toISOString(),
            components: {
                kafka: kafkaStatus,
                storage: diskStatus,
                queue: queueHealth,
                resources: resourceManager.getResourceUtilization(),
            },
            metrics: {
                current: resources.metrics,
                thresholds: resources.thresholds,
                history: metrics.history,
            },
            uptime: process.uptime(),
        };

        const httpStatus = determineHttpStatus(systemStatus);
        res.status(httpStatus).json(health);
    } catch (error) {
        console.error('Health check failed:', error);
        res.status(500).json({
            status: 'error',
            message: 'Health check failed',
            error:
                process.env.NODE_ENV === 'production'
                    ? undefined
                    : error.message,
            timestamp: new Date().toISOString(),
        });
    }
});

router.get('/ready', async (req, res) => {
    try {
        const status = await getServiceStatus();
        res.status(status.healthy ? 200 : 503).json(status);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.get('/live', (req, res) => {
    res.status(200).json({ status: 'alive' });
});

router.get('/lb-check', async (req, res) => {
    const queueHealth = await queue.getHealth();
    const metrics = await metricsService.checkResources();

    // Return 200 only if service can accept more jobs
    if (metrics.canAcceptMore && queueHealth.status === 'running') {
        return res.status(200).json({ status: 'accepting-traffic' });
    }

    return res.status(503).json({ status: 'at-capacity' });
});

router.get('/metrics', async (req, res) => {
    try {
        res.set('Content-Type', register.contentType);
        res.end(await register.metrics());
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

function determineSystemStatus({ resources, kafka, disk, queue }) {
    if (!kafka.status || resources.status === 'error') {
        return 'error';
    }

    if (
        !resources.canAcceptMore ||
        disk.input.status === 'warning' ||
        disk.output.status === 'warning' ||
        queue.status === 'paused'
    ) {
        return 'degraded';
    }

    return 'healthy';
}

function determineHttpStatus(status) {
    switch (status) {
        case 'healthy':
            return 200;
        case 'degraded':
            return 503;
        case 'error':
            return 500;
        default:
            return 500;
    }
}

module.exports = router;
