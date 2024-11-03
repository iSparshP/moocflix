const consul = require('consul')();
const logger = require('./logger');

const SERVICE_NAME = 'course-management';
const SERVICE_ID = `${SERVICE_NAME}-${process.env.HOSTNAME || 'local'}`;

const registerService = async () => {
    try {
        await consul.agent.service.register({
            name: SERVICE_NAME,
            id: SERVICE_ID,
            address: process.env.SERVICE_HOST || 'localhost',
            port: parseInt(process.env.PORT || '3002'),
            tags: ['v1', 'course-management'],
            check: {
                http: `http://localhost:${process.env.PORT || '3002'}/health`,
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

module.exports = {
    registerService,
    deregisterService,
};
