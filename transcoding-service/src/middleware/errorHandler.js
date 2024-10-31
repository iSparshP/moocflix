// src/middleware/errorHandler.js
const logger = require('../utils/logger');

class BaseError extends Error {
    constructor(message, status) {
        super(message);
        this.name = this.constructor.name;
        this.status = status;
        Error.captureStackTrace(this, this.constructor);
    }
}

class TranscodingError extends BaseError {
    constructor(message, videoId) {
        super(message, 500);
        this.videoId = videoId;
        this.isOperational = true;
    }
}

class ValidationError extends BaseError {
    constructor(message) {
        super(message, 400);
        this.isOperational = true;
    }
}

class KafkaError extends BaseError {
    constructor(message) {
        super(message, 503);
        this.isOperational = true;
    }
}

class ResourceError extends BaseError {
    constructor(message) {
        super(message, 429);
        this.isOperational = true;
    }
}

const errorHandler = (err, req, res, next) => {
    // Log error details
    logger.error(`[${err.name}] ${err.message}`, {
        error: err,
        path: req.path,
        method: req.method,
        timestamp: new Date().toISOString(),
    });

    // Handle specific error types
    switch (err.name) {
        case 'TranscodingError':
            return res.status(err.status).json({
                error: 'Video Transcoding Failed',
                message: err.message,
                videoId: err.videoId,
                retryable: err.isOperational,
            });

        case 'ValidationError':
            return res.status(err.status).json({
                error: 'Validation Error',
                message: err.message,
                details: err.details || [],
            });

        case 'KafkaError':
            return res.status(err.status).json({
                error: 'Message Queue Error',
                message: err.message,
                retryAfter: 30,
            });

        case 'ResourceError':
            return res.status(err.status).json({
                error: 'Resource Limit Exceeded',
                message: err.message,
                retryAfter: 60,
            });

        default:
            return res.status(500).json({
                error: 'Internal Server Error',
                message:
                    process.env.NODE_ENV === 'production'
                        ? 'An unexpected error occurred'
                        : err.message,
                requestId: req.id,
            });
    }
};

module.exports = {
    errorHandler,
    TranscodingError,
    ValidationError,
    KafkaError,
    ResourceError,
};
