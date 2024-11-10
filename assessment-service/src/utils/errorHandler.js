const { logger } = require('../config/logger');
const { AppError } = require('./errors');

class ErrorHandler {
    static handleError(error, req, res) {
        logger.error('Error:', {
            message: error.message,
            stack: error.stack,
            path: req.path,
            method: req.method,
            correlationId: req.correlationId,
        });

        if (error instanceof AppError) {
            return this.handleResponse(res, {
                status: error.statusCode,
                error: error.message,
                code: error.code,
            });
        }

        return this.handleResponse(res, {
            status: 500,
            error: 'Internal server error',
        });
    }

    static handleResponse(res, { status = 200, data, error, message, code }) {
        const response = {
            status: error ? 'error' : 'success',
            ...(data && { data }),
            ...(error && { error }),
            ...(message && { message }),
            ...(code && { code }),
        };

        return res.status(status).json(response);
    }
}

module.exports = ErrorHandler;
