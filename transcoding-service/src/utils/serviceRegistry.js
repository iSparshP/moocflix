const EventEmitter = require('events');

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

module.exports = registry;
