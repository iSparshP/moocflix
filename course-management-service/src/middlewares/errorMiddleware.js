const logger = require('../utils/logger');

class AppError extends Error {
    constructor(message, statusCode, errorCode) {
        super(message);
        this.statusCode = statusCode;
        this.errorCode = errorCode;
        this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
        Error.captureStackTrace(this, this.constructor);
    }
}

class NotFoundError extends AppError {
    constructor(message = 'Resource not found') {
        super(message, 404, 'NOT_FOUND_ERROR');
    }
}

class UnauthorizedError extends AppError {
    constructor(message = 'Unauthorized access') {
        super(message, 401, 'UNAUTHORIZED_ERROR');
    }
}

class ValidationError extends AppError {
    constructor(message = 'Validation error') {
        super(message, 400, 'VALIDATION_ERROR');
    }
}

const errorHandler = (err, req, res, next) => {
    // Log error with consistent format
    logger.error('Error encountered:', {
        path: req.path,
        method: req.method,
        error: err.message,
        code: err.errorCode || 'INTERNAL_ERROR',
        status: err.statusCode || 500,
        userId: req.user?.id,
        stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    });

    // Handle known errors
    if (err instanceof AppError) {
        return res.status(err.statusCode).json({
            status: err.status,
            error: err.message,
            code: err.errorCode,
            ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
        });
    }

    // Handle Mongoose validation errors
    if (err.name === 'ValidationError') {
        return res.status(400).json({
            status: 'fail',
            code: 'VALIDATION_ERROR',
            error: err.message,
            details: Object.values(err.errors).map((e) => e.message),
        });
    }

    // Default error
    res.status(500).json({
        status: 'error',
        code: 'INTERNAL_SERVER_ERROR',
        error:
            process.env.NODE_ENV === 'production'
                ? 'Internal server error'
                : err.message,
    });
};

module.exports = {
    errorHandler,
    AppError,
    NotFoundError,
    UnauthorizedError,
    ValidationError,
};
