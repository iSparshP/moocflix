const promClient = require('prom-client');
const logger = require('../utils/logger');

class MetricsMiddleware {
    constructor() {
        this.register = new promClient.Registry();

        // Add default metrics
        promClient.collectDefaultMetrics({ register: this.register });

        // Custom metrics
        this.httpRequestDuration = new promClient.Histogram({
            name: 'http_request_duration_seconds',
            help: 'Duration of HTTP requests in seconds',
            labelNames: ['method', 'route', 'status_code'],
            buckets: [0.1, 0.5, 1, 2, 5],
        });

        this.videoUploadSize = new promClient.Histogram({
            name: 'video_upload_size_bytes',
            help: 'Size of uploaded videos in bytes',
            buckets: [1e6, 5e6, 1e7, 5e7, 1e8], // 1MB to 100MB
        });

        this.transcodingDuration = new promClient.Histogram({
            name: 'video_transcoding_duration_seconds',
            help: 'Duration of video transcoding in seconds',
            buckets: [60, 300, 600, 1800, 3600], // 1min to 1hour
        });

        this.cacheHitRatio = new promClient.Gauge({
            name: 'cache_hit_ratio',
            help: 'Ratio of cache hits to total cache requests',
        });

        // Register metrics
        this.register.registerMetric(this.httpRequestDuration);
        this.register.registerMetric(this.videoUploadSize);
        this.register.registerMetric(this.transcodingDuration);
        this.register.registerMetric(this.cacheHitRatio);
    }

    getMiddleware() {
        return (req, res, next) => {
            const start = Date.now();

            res.on('finish', () => {
                const duration = (Date.now() - start) / 1000;
                this.httpRequestDuration.observe(
                    {
                        method: req.method,
                        route: req.route?.path || 'unknown',
                        status_code: res.statusCode,
                    },
                    duration
                );
            });

            next();
        };
    }

    getMetricsHandler() {
        return async (req, res) => {
            try {
                res.set('Content-Type', this.register.contentType);
                res.end(await this.register.metrics());
            } catch (error) {
                logger.error('Error generating metrics:', error);
                res.status(500).end();
            }
        };
    }
}

module.exports = new MetricsMiddleware();
