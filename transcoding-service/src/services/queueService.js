// src/services/queueService.js
const os = require('os');
const fs = require('fs').promises;
const path = require('path');
const { limits, retry } = require('../config/resources');
const { ValidationError } = require('../middleware/errorHandler');
const metricsService = require('./metricsService');
const TranscodingCircuitBreaker = require('../utils/circuitBreaker');

class PriorityQueue {
    constructor() {
        this.queues = {
            high: [],
            normal: [],
            low: [],
        };
        this.activeJobs = new Map();
        this.failedJobs = new Map();
        this.persistPath = path.join(process.cwd(), 'data', 'queue-state.json');
        this.paused = false;
        this.breaker = TranscodingCircuitBreaker.create('queue');
    }

    async addJob(job, priority = 'normal') {
        return this.breaker.fire(async () => {
            if (this.paused) {
                throw new ValidationError(
                    'Queue is paused, not accepting new jobs'
                );
            }

            if (!['high', 'normal', 'low'].includes(priority)) {
                priority = 'normal';
            }

            const jobWithRetry = {
                ...job,
                id:
                    job.id ||
                    `job-${Date.now()}-${Math.random().toString(36).slice(2)}`,
                attempts: job.attempts || 0,
                priority,
                addedAt: Date.now(),
                metrics: {
                    addedAt: Date.now(),
                    retries: 0,
                    duration: 0,
                },
            };

            if (
                this.queues[priority].length >= limits.queueSizeLimit[priority]
            ) {
                throw new ValidationError(`Queue ${priority} is full`);
            }

            const resources = await metricsService.checkResources();
            if (!resources.canAcceptMore && priority !== 'high') {
                throw new ValidationError('System resources exhausted');
            }

            this.queues[priority].push(jobWithRetry);
            await this.persistState();
            return resources.metrics;
        });
    }

    getNextJob() {
        if (this.paused || this.activeJobs.size >= limits.maxConcurrentJobs) {
            return null;
        }

        for (const priority of ['high', 'normal', 'low']) {
            if (this.queues[priority].length > 0) {
                const job = this.queues[priority].shift();
                this.activeJobs.set(job.id, job);
                return job;
            }
        }
        return null;
    }

    async startJob(job) {
        if (!this.activeJobs.has(job.id)) {
            throw new Error('Job not in active jobs list');
        }
        this.activeJobs.get(job.id).startedAt = Date.now();
        await this.persistState();
    }

    async completeJob(jobId) {
        const job = this.activeJobs.get(jobId);
        if (job) {
            job.completedAt = Date.now();
            this.activeJobs.delete(jobId);
            await this.persistState();
        }
    }

    async retryJob(job) {
        if (job.attempts >= retry.maxAttempts) {
            this.failedJobs.set(job.id, {
                ...job,
                failedAt: Date.now(),
                reason: 'Max retry attempts exceeded',
            });
            this.activeJobs.delete(job.id);
            await this.persistState();
            return false;
        }

        const backoff = this.calculateBackoff(job.attempts);
        const retryJob = {
            ...job,
            attempts: job.attempts + 1,
            nextRetry: Date.now() + backoff,
        };

        await this.addJob(retryJob, job.priority);
        this.activeJobs.delete(job.id);
        return true;
    }

    calculateBackoff(attempts) {
        return Math.min(
            retry.initialDelay * Math.pow(retry.backoffMultiplier, attempts),
            300000 // Max 5 minutes
        );
    }

    getStats() {
        return {
            queues: {
                high: this.queues.high.length,
                normal: this.queues.normal.length,
                low: this.queues.low.length,
            },
            activeJobs: this.activeJobs.size,
            failedJobs: this.getFailedJobStats(),
        };
    }

    getFailedJobStats() {
        const lastHour = Date.now() - 3600000;
        return {
            total: this.failedJobs.size,
            lastHour: Array.from(this.failedJobs.values()).filter(
                (job) => job.failedAt > lastHour
            ).length,
        };
    }

    getHealth() {
        const totalJobs = Object.values(this.queues).reduce(
            (sum, queue) => sum + queue.length,
            0
        );

        return {
            status: this.paused ? 'paused' : 'running',
            capacity: {
                total:
                    limits.queueSizeLimit.high +
                    limits.queueSizeLimit.normal +
                    limits.queueSizeLimit.low,
                used: totalJobs,
            },
            processing: this.activeJobs.size,
            failed: this.failedJobs.size,
        };
    }

    async persistState() {
        const state = {
            queues: this.queues,
            activeJobs: Array.from(this.activeJobs.entries()),
            failedJobs: Array.from(this.failedJobs.entries()),
            paused: this.paused,
        };

        await fs.mkdir(path.dirname(this.persistPath), { recursive: true });
        await fs.writeFile(this.persistPath, JSON.stringify(state, null, 2));
    }

    async recover() {
        try {
            const data = await fs.readFile(this.persistPath);
            const state = JSON.parse(data);
            this.queues = state.queues;
            this.activeJobs = new Map(state.activeJobs);
            this.failedJobs = new Map(state.failedJobs);
            this.paused = state.paused;
            console.log('Queue state recovered successfully');
        } catch (error) {
            console.warn('No queue state to recover:', error.message);
        }
    }

    pause() {
        this.paused = true;
    }

    resume() {
        this.paused = false;
    }
}

class CleanupService {
    constructor() {
        this.retentionPeriod = process.env.TEMP_FILE_RETENTION_HOURS || 24;
        this.schedule = this.startCleanupSchedule();
    }

    startCleanupSchedule() {
        const interval =
            (process.env.CLEANUP_INTERVAL_MINUTES || 30) * 60 * 1000;
        return setInterval(async () => {
            try {
                await this.cleanupStaleFiles();
            } catch (error) {
                logger.error('Cleanup failed:', error);
            }
        }, interval);
    }

    async cleanupStaleFiles() {
        // Existing cleanup logic with metrics
        const result = await super.cleanupStaleFiles();
        metricsService.recordCleanup(result);
        return result;
    }
}

const queue = new PriorityQueue();
module.exports = queue;