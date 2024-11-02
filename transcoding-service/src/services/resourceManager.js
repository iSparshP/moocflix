// src/services/resourceManager.js
const os = require('os');
const { limits } = require('../config/resources');
const {
    ValidationError,
    ResourceError,
} = require('../middleware/errorHandler');
const fs = require('fs');
const path = require('path');
const registry = require('../utils/serviceRegistry');
const BaseService = require('./baseService');
const logger = require('../utils/logger');

class ResourceManager extends BaseService {
    constructor() {
        super();
        this.reservations = new Map();
        this.thresholds = {
            cpu: limits.maxCpuUsage,
            memory: limits.maxMemoryUsage,
            disk: limits.maxDiskUsage || 0.9,
        };
    }

    async init() {
        await super.init();
        await this.loadState();
        this.startMonitoring();
    }

    async loadState() {
        try {
            const statePath = path.join(
                process.cwd(),
                'data',
                'resource-state.json'
            );

            if (fs.existsSync(statePath)) {
                const data = await fs.promises.readFile(statePath, 'utf8');
                const state = JSON.parse(data);

                this.reservations = new Map(state.reservations);
                this.thresholds = state.thresholds;

                logger.info('Resource state loaded successfully');
            }
        } catch (error) {
            logger.error('Failed to load resource state', { error });
            // Initialize with defaults if loading fails
            this.reservations = new Map();
        }
    }

    startMonitoring() {
        setInterval(() => {
            const metrics = this.getResourceUtilization();
            this.emit('resources:metrics', metrics);
        }, 5000);
    }

    async checkAndAllocate(jobId, requirements) {
        return this.allocateResources(jobId, requirements);
    }

    async allocateResources(jobId, requirements) {
        const metricsService = registry.get('metrics');
        const canAllocate = await this.canAllocate(requirements);

        if (!canAllocate) {
            throw new ResourceError('Insufficient system resources');
        }

        this.reservations.set(jobId, {
            ...requirements,
            allocatedAt: Date.now(),
        });
        await this.persistState();
        return true;
    }

    async releaseResources(jobId) {
        if (!this.reservations.has(jobId)) {
            throw new ValidationError(
                `No resources allocated for job ${jobId}`
            );
        }

        const released = this.reservations.get(jobId);
        this.reservations.delete(jobId);

        return released;
    }

    async canAllocate(requirements) {
        const currentMetrics = await registry.get('metrics').checkResources();
        const totalReserved = this.calculateTotalReserved();

        return (
            currentMetrics.metrics.cpu.utilization + requirements.cpu <=
                this.thresholds.cpu &&
            currentMetrics.metrics.memory.used + requirements.memory <=
                this.thresholds.memory
        );
    }

    calculateTotalReserved() {
        return Array.from(this.reservations.values()).reduce(
            (total, reservation) => ({
                cpu: total.cpu + reservation.cpu,
                memory: total.memory + reservation.memory,
            }),
            { cpu: 0, memory: 0 }
        );
    }

    getResourceUtilization() {
        return {
            reservations: this.reservations.size,
            allocated: this.calculateTotalReserved(),
            thresholds: this.thresholds,
        };
    }

    async cleanupResources(jobId) {
        if (this.reservations.has(jobId)) {
            const resources = this.reservations.get(jobId);
            this.reservations.delete(jobId);
            await this.persistState();
            logger.info('Resources cleaned up', { jobId, resources });
        }
    }

    async persistState() {
        try {
            const state = {
                reservations: Array.from(this.reservations.entries()),
                thresholds: this.thresholds,
            };

            await fs.writeFile(
                path.join(process.cwd(), 'data', 'resource-state.json'),
                JSON.stringify(state, null, 2)
            );
        } catch (error) {
            logger.error('Failed to persist resource state', { error });
        }
    }
}

module.exports = new ResourceManager();
