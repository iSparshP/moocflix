const { logger } = require('../config/logger');

const requestLogger = (req, res, next) => {
    const start = Date.now();

    // Log the incoming request
    logger.info('Incoming request', {
        method: req.method,
        url: req.url,
        path: req.path,
        params: req.params,
        query: req.query,
        ip: req.ip,
        userAgent: req.get('user-agent'),
        correlationId: req.headers['x-correlation-id'],
    });

    // Once the request is processed
    res.on('finish', () => {
        const duration = Date.now() - start;
        logger.info('Request completed', {
            method: req.method,
            url: req.url,
            status: res.statusCode,
            duration: `${duration}ms`,
            correlationId: req.headers['x-correlation-id'],
        });
    });

    next();
};

module.exports = { requestLogger };
