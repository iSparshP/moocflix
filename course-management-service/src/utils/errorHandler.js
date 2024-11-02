// src/utils/errorHandler.js
const logger = require('./logger');
const {
    AppError,
    ValidationError,
    AuthenticationError,
    NotFoundError,
} = require('./errors');

const handleError = (error, req) => {
    // Log error with consistent format
    logger.error('Error encountered:', {
        message: error.message,
        path: req?.path,
        method: req?.method,
        userId: req?.user?.id,
        stack: error.stack,
    });

    // Return structured error response
    if (error instanceof AppError) {
        return {
            status: error.statusCode,
            body: {
                error: error.message,
                code: error.errorCode,
            },
        };
    }

    if (error.name === 'ValidationError') {
        return {
            status: 400,
            body: {
                error: 'Validation error',
                details: error.message,
            },
        };
    }

    // Default server error
    return {
        status: 500,
        body: {
            error:
                process.env.NODE_ENV === 'production'
                    ? 'Internal server error'
                    : error.message,
        },
    };
};

module.exports = handleError;
