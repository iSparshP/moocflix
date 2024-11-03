const prometheus = require('prom-client');

const requestCounter = new prometheus.Counter({
    name: 'notification_requests_total',
    help: 'Total number of notification requests',
    labelNames: ['type', 'status'],
});

module.exports = { requestCounter };
