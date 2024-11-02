const EventEmitter = require('events');

class BaseService extends EventEmitter {
    constructor() {
        super();
        this.registry = require('../utils/serviceRegistry');
    }

    emit(event, data) {
        this.registry.emit(event, data);
    }

    on(event, handler) {
        this.registry.on(event, handler);
    }

    async init() {
        // Initialize service
        return true;
    }

    async shutdown() {
        // Cleanup resources
        return true;
    }

    async healthCheck() {
        // Basic health check
        return true;
    }

    async persistState() {
        // Persist service state
        return true;
    }

    async loadState() {
        // Load service state
        return true;
    }
}

module.exports = BaseService;
