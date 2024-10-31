// src/utils/metrics.js
const promClient = require('prom-client');

const transcodingMetrics = {
    jobDuration: new promClient.Histogram({
        name: 'transcoding_job_duration_seconds',
        help: 'Duration of transcoding jobs',
        labelNames: ['profile'],
    }),

    queueSize: new promClient.Gauge({
        name: 'transcoding_queue_size',
        help: 'Current size of transcoding queues',
        labelNames: ['priority'],
    }),

    failureRate: new promClient.Counter({
        name: 'transcoding_failures_total',
        help: 'Total number of transcoding failures',
        labelNames: ['reason'],
    }),
};

module.exports = transcodingMetrics;
