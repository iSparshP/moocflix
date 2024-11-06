const logger = require('./logger');

// Simple in-memory metrics
const metrics = {
    requestCounts: {},
    responseTimes: {},
    activeUsers: 0,
};

const collectHttpMetrics = (req, res, next) => {
    const startTime = process.hrtime();

    res.on('finish', () => {
        const [seconds, nanoseconds] = process.hrtime(startTime);
        const duration = seconds + nanoseconds / 1e9;

        const route = req.route?.path || 'unknown';

        // Update request counts
        metrics.requestCounts[route] = (metrics.requestCounts[route] || 0) + 1;

        // Update response times
        if (!metrics.responseTimes[route]) {
            metrics.responseTimes[route] = [];
        }
        metrics.responseTimes[route].push(duration);

        logger.debug('Metrics collected', {
            path: route,
            method: req.method,
            status: res.statusCode,
            duration,
        });
    });

    next();
};

module.exports = {
    metrics,
    collectHttpMetrics,
};
