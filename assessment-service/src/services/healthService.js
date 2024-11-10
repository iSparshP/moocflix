const mongoose = require('mongoose');
const { kafka } = require('../config/kafka');
const axios = require('axios');
const BaseService = require('./baseService');
const { logger } = require('../config/logger');

class HealthService extends BaseService {
    static async checkMongoDB() {
        return await this.handleServiceCall(async () => {
            const state = mongoose.connection.readyState;
            const latency = await this.measureMongoLatency();
            return {
                status: state === 1 ? 'up' : 'down',
                latency,
            };
        }, 'MongoDB health check failed');
    }

    static async checkKafka() {
        return await this.handleServiceCall(async () => {
            const admin = kafka.admin();
            try {
                await admin.connect();
                await admin.listTopics();
                return { status: 'up' };
            } finally {
                await admin.disconnect();
            }
        }, 'Kafka health check failed');
    }

    static async checkDependentServices() {
        const services = {
            userService: process.env.USER_SERVICE_URL,
            courseService: process.env.COURSE_SERVICE_URL,
        };

        return await this.handleServiceCall(async () => {
            const results = {};
            await Promise.all(
                Object.entries(services).map(async ([service, url]) => {
                    try {
                        const start = Date.now();
                        const response = await axios.get(`${url}/health`, {
                            timeout: 5000,
                        });
                        results[service] = {
                            status: response.status === 200 ? 'up' : 'down',
                            latency: Date.now() - start,
                        };
                    } catch (error) {
                        results[service] = {
                            status: 'down',
                            error: error.message,
                        };
                    }
                })
            );
            return results;
        }, 'Dependent services health check failed');
    }

    static async getFullHealthStatus() {
        return await this.handleServiceCall(async () => {
            const [mongodb, kafka, services] = await Promise.all([
                this.checkMongoDB(),
                this.checkKafka(),
                this.checkDependentServices(),
            ]);

            const status =
                mongodb.status === 'up' &&
                kafka.status === 'up' &&
                Object.values(services).every((s) => s.status === 'up')
                    ? 'healthy'
                    : 'degraded';

            return {
                status,
                timestamp: new Date().toISOString(),
                services: {
                    mongodb,
                    kafka,
                    ...services,
                },
                system: {
                    memory: this.getMemoryUsage(),
                    uptime: Math.floor(process.uptime()),
                    nodeVersion: process.version,
                },
            };
        }, 'Health check failed');
    }

    static async measureMongoLatency() {
        const start = Date.now();
        await mongoose.connection.db.admin().ping();
        return Date.now() - start;
    }

    static getMemoryUsage() {
        const used = process.memoryUsage();
        return {
            heapTotal: Math.round(used.heapTotal / 1024 / 1024) + 'MB',
            heapUsed: Math.round(used.heapUsed / 1024 / 1024) + 'MB',
            rss: Math.round(used.rss / 1024 / 1024) + 'MB',
        };
    }
}

module.exports = HealthService;
