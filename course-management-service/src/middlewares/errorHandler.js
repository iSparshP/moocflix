// src/middlewares/errorHandler.js
const logger = require('../utils/logger');
const { AppError } = require('../utils/errors');

module.exports = (error, req, res, next) => {
    // Log error details
    logger.error('Error encountered:', {
        error: error.message,
        code: error.errorCode || 'INTERNAL_ERROR',
        status: error.statusCode || 500,
        stack: error.stack,
        path: req.path,
        method: req.method,
        requestId: req.id,
        userId: req.user?.id,
    });

    // Handle known errors
    if (error instanceof AppError) {
        return res.status(error.statusCode).json({
            status: error.status,
            code: error.errorCode,
            message: error.message,
            ...(process.env.NODE_ENV === 'development' && {
                stack: error.stack,
            }),
        });
    }

    // Handle validation errors (Mongoose/Joi)
    if (error.name === 'ValidationError') {
        return res.status(400).json({
            status: 'fail',
            code: 'VALIDATION_ERROR',
            message: error.message,
            details:
                error.details ||
                Object.values(error.errors).map((err) => err.message),
        });
    }

    // Handle external service errors
    if (error.response) {
        return res.status(error.response.status || 503).json({
            status: 'error',
            code:
                error.response.status === 504
                    ? 'GATEWAY_TIMEOUT'
                    : 'SERVICE_UNAVAILABLE',
            message: error.response.data?.message || 'External service error',
            service: error.response.config?.url,
        });
    }

    // Handle network errors
    if (error.code === 'ECONNREFUSED' || error.code === 'ECONNABORTED') {
        return res.status(503).json({
            status: 'error',
            code: 'NETWORK_ERROR',
            message: 'Network connection failed',
        });
    }

    // Handle Kafka errors
    if (error.type === 'KAFKA_ERROR') {
        return res.status(503).json({
            status: 'error',
            code: 'MESSAGE_BROKER_ERROR',
            message: 'Message processing failed',
        });
    }

    // Default server error
    const defaultError = {
        status: 'error',
        code: 'INTERNAL_SERVER_ERROR',
        message:
            process.env.NODE_ENV === 'production'
                ? 'An unexpected error occurred'
                : error.message,
    };

    if (process.env.NODE_ENV === 'development') {
        defaultError.stack = error.stack;
    }

    res.status(500).json(defaultError);
};
