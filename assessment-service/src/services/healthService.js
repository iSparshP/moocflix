const mongoose = require('mongoose');
const { Kafka } = require('kafkajs');
const axios = require('axios');

class HealthService {
    static async checkMongoDB() {
        try {
            const state = mongoose.connection.readyState;
            return {
                status: state === 1 ? 'up' : 'down',
                latency: await this.measureMongoLatency(),
            };
        } catch (error) {
            return { status: 'down', error: error.message };
        }
    }

    static async checkKafka() {
        const kafka = new Kafka({
            clientId: 'health-check',
            brokers: [process.env.KAFKA_BROKER],
        });
        const admin = kafka.admin();

        try {
            await admin.connect();
            await admin.listTopics();
            return { status: 'up' };
        } catch (error) {
            return { status: 'down', error: error.message };
        } finally {
            await admin.disconnect();
        }
    }

    static async checkDependentServices() {
        const services = {
            userService: process.env.USER_SERVICE_URL,
            courseService: process.env.COURSE_SERVICE_URL,
        };

        const results = {};
        for (const [service, url] of Object.entries(services)) {
            try {
                const start = Date.now();
                const response = await axios.get(`${url}/health`, {
                    timeout: 5000,
                });
                const latency = Date.now() - start;

                results[service] = {
                    status: response.status === 200 ? 'up' : 'down',
                    latency,
                };
            } catch (error) {
                results[service] = { status: 'down', error: error.message };
            }
        }
        return results;
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

    static async getFullHealthStatus() {
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
    }

    static handleHealthCheckError(res, error) {
        res.status(503).json({
            status: 'down',
            timestamp: new Date().toISOString(),
            error: error.message,
        });
    }
}

module.exports = HealthService;
