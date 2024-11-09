const EventEmitter = require('events');
const logger = require('./logger');

class ServiceRegistry extends EventEmitter {
    constructor() {
        super();
        this.services = new Map();
    }

    register(name, service) {
        if (!name || !service) {
            throw new Error(
                'Both name and service are required for registration'
            );
        }
        this.services.set(name, service);
        logger.info(`Service registered: ${name}`);
    }

    get(name) {
        if (!this.services.has(name)) {
            throw new Error(`Service '${name}' not found in registry`);
        }
        return this.services.get(name);
    }

    async initializeAll() {
        logger.info('Initializing all services...');
        for (const [name, service] of this.services) {
            if (typeof service.init === 'function') {
                try {
                    await service.init();
                    logger.info(`Service initialized: ${name}`);
                } catch (error) {
                    logger.error(
                        `Failed to initialize service ${name}:`,
                        error
                    );
                    throw error;
                }
            }
        }
    }

    async shutdownAll() {
        logger.info('Shutting down all services...');
        for (const [name, service] of this.services) {
            if (typeof service.shutdown === 'function') {
                try {
                    await service.shutdown();
                    logger.info(`Service shut down: ${name}`);
                } catch (error) {
                    logger.error(`Error shutting down service ${name}:`, error);
                }
            }
        }
    }
}

module.exports = new ServiceRegistry();
