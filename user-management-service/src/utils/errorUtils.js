const logger = require('./logger');

/**
 * Custom error class for operational errors
 * @extends Error
 */
class AppError extends Error {
    /**
     * Create an operational error
     * @param {string} message - Error message
     * @param {number} statusCode - HTTP status code
     * @param {Object} [metadata] - Additional error metadata
     */
    constructor(message, statusCode, metadata = {}) {
        super(message);
        this.statusCode = statusCode;
        this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
        this.isOperational = true;
        this.metadata = metadata;

        // Capture stack trace
        Error.captureStackTrace(this, this.constructor);

        // Log error creation
        logger.error('AppError created', {
            message,
            statusCode,
            metadata,
            stack: this.stack,
        });
    }

    /**
     * Creates a 404 Not Found error
     * @param {string} [message] - Custom error message
     * @returns {AppError} Not found error
     */
    static notFound(message = 'Resource not found') {
        return new AppError(message, 404);
    }

    /**
     * Creates a 400 Bad Request error
     * @param {string} [message] - Custom error message
     * @returns {AppError} Bad request error
     */
    static badRequest(message = 'Invalid request') {
        return new AppError(message, 400);
    }

    /**
     * Creates a 401 Unauthorized error
     * @param {string} [message] - Custom error message
     * @returns {AppError} Unauthorized error
     */
    static unauthorized(message = 'Not authorized') {
        return new AppError(message, 401);
    }
}

/**
 * Wraps an async route handler with error catching
 * @param {Function} fn - Async route handler function
 * @returns {Function} Express middleware function
 */
const catchAsync = (fn) => {
    return (req, res, next) => {
        Promise.resolve(fn(req, res, next)).catch((err) => {
            // Convert non-AppErrors to AppErrors
            if (!(err instanceof AppError)) {
                err = new AppError(err.message, 500);
            }
            next(err);
        });
    };
};

module.exports = { AppError, catchAsync };
