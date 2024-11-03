const EventEmitter = require('events');
const consul = require('consul')();
const logger = require('./logger');
const config = require('../config/env');

const SERVICE_NAME = 'transcoding-service';
const SERVICE_ID = `${SERVICE_NAME}-${process.env.HOSTNAME || 'local'}`;

const registerService = async () => {
    try {
        await consul.agent.service.register({
            name: SERVICE_NAME,
            id: SERVICE_ID,
            address: process.env.SERVICE_HOST || 'localhost',
            port: parseInt(config.service.port),
            tags: ['v1', 'transcoding'],
            check: {
                http: `http://localhost:${config.service.healthCheckPort}/health/live`,
                interval: '15s',
                timeout: '5s',
                deregisterCriticalServiceAfter: '1m',
            },
        });
        logger.info('Service registered with Consul');
    } catch (error) {
        logger.error('Failed to register service with Consul:', error);
        throw error;
    }
};

const deregisterService = async () => {
    try {
        await consul.agent.service.deregister(SERVICE_ID);
        logger.info('Service deregistered from Consul');
    } catch (error) {
        logger.error('Failed to deregister service from Consul:', error);
    }
};

class ServiceRegistry extends EventEmitter {
    constructor() {
        super();
        this.services = new Map();
        this.state = {
            initialized: false,
            shutdownInProgress: false,
        };
    }

    register(name, service) {
        if (this.services.has(name)) {
            throw new Error(`Service ${name} already registered`);
        }
        this.services.set(name, service);
        this.emit('service:registered', { name, service });
    }

    get(name) {
        if (!this.services.has(name)) {
            throw new Error(`Service ${name} not found`);
        }
        return this.services.get(name);
    }

    async initializeAll() {
        if (this.state.initialized) {
            return;
        }

        try {
            // Initialize in correct dependency order
            await this.get('metrics').init();
            await this.get('resources').init();
            await this.get('queue').init();
            await this.get('cleanup').init();
            await this.get('validation').init();

            this.state.initialized = true;
            this.emit('services:initialized');
        } catch (error) {
            this.emit('services:init:error', error);
            throw error;
        }
    }

    async shutdownAll() {
        if (this.state.shutdownInProgress) {
            return;
        }

        this.state.shutdownInProgress = true;
        try {
            // Shutdown in reverse order
            await this.get('validation').shutdown();
            await this.get('cleanup').shutdown();
            await this.get('queue').shutdown();
            await this.get('resources').shutdown();
            await this.get('metrics').shutdown();

            this.emit('services:shutdown');
        } catch (error) {
            this.emit('services:shutdown:error', error);
            throw error;
        }
    }

    async healthCheck() {
        const results = await Promise.all(
            Array.from(this.services.entries()).map(async ([name, service]) => {
                try {
                    const health = await service.healthCheck();
                    return { name, status: health ? 'healthy' : 'unhealthy' };
                } catch (error) {
                    return { name, status: 'error', error: error.message };
                }
            })
        );

        const isHealthy = results.every((r) => r.status === 'healthy');
        this.emit('health:check', { isHealthy, results });

        return {
            healthy: isHealthy,
            services: results,
            timestamp: new Date().toISOString(),
        };
    }
}

const registry = new ServiceRegistry();

// Register core services
registry.register('metrics', require('../services/metricsService'));
registry.register('queue', require('../services/queueService'));
registry.register('validation', require('../services/validationService'));
registry.register('resources', require('../services/resourceManager'));
registry.register('cleanup', require('../services/cleanupService'));

module.exports = {
    registry,
    registerService,
    deregisterService,
};
