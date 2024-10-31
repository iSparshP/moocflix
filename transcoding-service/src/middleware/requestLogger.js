// src/middleware/requestLogger.js
const logger = require('../utils/logger');

const requestLogger = (req, res, next) => {
    const start = Date.now();

    res.on('finish', () => {
        const duration = Date.now() - start;
        logger.logAPIRequest(req, res, duration);
    });

    next();
};

module.exports = requestLogger;
