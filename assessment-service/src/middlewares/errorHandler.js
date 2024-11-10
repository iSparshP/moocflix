// src/middlewares/errorHandler.js
const { logger } = require('../config/logger');
const { BaseError } = require('../utils/errors');

const errorHandler = (err, req, res, next) => {
    logger.error('Error:', {
        message: err.message,
        stack: err.stack,
        path: req.path,
        method: req.method,
        correlationId: req.correlationId,
        userId: req.user?.id,
    });

    if (err instanceof BaseError) {
        return res.status(err.statusCode).json({
            status: err.status,
            message: err.message,
            code: err.code,
            correlationId: req.correlationId,
        });
    }

    if (err.name === 'ValidationError') {
        return res.status(400).json({
            status: 'error',
            message: 'Validation Error',
            errors: Object.values(err.errors).map((e) => e.message),
            correlationId: req.correlationId,
        });
    }

    if (err.name === 'JsonWebTokenError') {
        return res.status(401).json({
            status: 'error',
            message: 'Invalid token',
            code: 'INVALID_TOKEN',
            correlationId: req.correlationId,
        });
    }

    res.status(500).json({
        status: 'error',
        message:
            process.env.NODE_ENV === 'production'
                ? 'Internal server error'
                : err.message,
        correlationId: req.correlationId,
    });
};

module.exports = { errorHandler };
