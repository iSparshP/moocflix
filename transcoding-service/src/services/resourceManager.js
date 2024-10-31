// src/services/resourceManager.js
const os = require('os');
const { limits } = require('../config/resources');
const {
    ValidationError,
    ResourceError,
} = require('../middleware/errorHandler');
const metricsService = require('./metricsService');

class ResourceManager {
    constructor() {
        this.reservations = new Map();
        this.thresholds = {
            cpu: limits.maxCpuUsage,
            memory: limits.maxMemoryUsage,
            disk: limits.maxDiskUsage || 0.9,
        };
    }

    async allocateResources(jobId, requirements) {
        const currentMetrics = await metricsService.checkResources();

        if (!this.canAllocate(currentMetrics.metrics, requirements)) {
            throw new ResourceError('Insufficient system resources');
        }

        this.reservations.set(jobId, {
            ...requirements,
            allocatedAt: Date.now(),
        });

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

    canAllocate(currentMetrics, requirements) {
        const totalReserved = this.calculateTotalReserved();

        return (
            currentMetrics.cpu.utilization + requirements.cpu <=
                this.thresholds.cpu &&
            currentMetrics.memory.used + requirements.memory <=
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

    cleanup() {
        const staleThreshold = Date.now() - 30 * 60 * 1000; // 30 minutes
        for (const [jobId, reservation] of this.reservations.entries()) {
            if (reservation.allocatedAt < staleThreshold) {
                this.reservations.delete(jobId);
            }
        }
    }

    async cleanupResources(jobId) {
        if (this.reservations.has(jobId)) {
            const resources = this.reservations.get(jobId);
            this.reservations.delete(jobId);
            await this.persistState();
            logger.info('Resources cleaned up', { jobId, resources });
        }
    }
}

module.exports = new ResourceManager();
